import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  setUser,
  setMedia,
  setLoading,
  setError,
  logout,
} from "../store/user/userSlice";
import { TailSpin } from "react-loader-spinner";
import { LogOut } from "lucide-react";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accessToken, user, media, loading, error } = useSelector(
    (state) => state.user
  );

  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState({});
  const [sendingComment, setSendingComment] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
      return;
    }

    const fetchUserAndMedia = async () => {
      dispatch(setLoading(true));
      try {
        const profileResponse = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/instagram/profile?token=${accessToken}`
        );
        dispatch(setUser(profileResponse.data));

        const mediaResponse = await axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/api/instagram/media?token=${accessToken}`
        );
        dispatch(setMedia(mediaResponse.data.data || []));
      } catch (error) {
        dispatch(
          setError(error.response ? error.response.data.error : error.message)
        );
      } finally {
        dispatch(setLoading(false));
      }
    };

    fetchUserAndMedia();
  }, [accessToken, dispatch, navigate]);

  const handleAddComment = async (mediaId) => {
    if (!newComment.trim()) return;

    setSendingComment((prev) => ({ ...prev, [mediaId]: true }));

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/instagram/comment`,
        {
          mediaId: mediaId,
          message: newComment,
          token: accessToken,
        }
      );

      setComments((prev) => ({
        ...prev,
        [mediaId]: [
          ...(prev[mediaId] || []),
          {
            id: Date.now().toString(),
            text: newComment,
            username: user.username || "Current User",
            timestamp: "Just now",
            replies: [],
          },
        ],
      }));

      setNewComment("");
    } catch (error) {
      dispatch(
        setError(
          error.response ? error.response.data.error : "Failed to post comment"
        )
      );
    } finally {
      setSendingComment((prev) => ({ ...prev, [mediaId]: false }));
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMedia = media.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(media.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 sm:px-6 md:px-8">
        <TailSpin color="#4A5568" height={40} width={40} />
        <span className="mt-4 text-gray-600">
          Loading your Instagram data...
        </span>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white px-4 sm:px-6 md:px-8 text-red-600">
        Error: {error}
      </div>
    );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 px-4 sm:px-6 md:px-8">
      {/* Profile Section */}
      <div className="bg-white shadow-md rounded-lg p-6 mx-auto max-w-3xl mt-8 border border-gray-200">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-100">
            {user.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
          </div>
          <div className="w-full sm:w-auto">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {user.username || "N/A"}
            </h1>
            <div className="flex flex-col sm:flex-row gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {user.account_type}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {user.media_count} Posts
              </span>
            </div>
            <div className="text-gray-600 text-sm line-clamp-1">
              Account ID: {user.id}
            </div>
            <button
              onClick={() => {
                dispatch(logout());
                navigate("/login");
              }}
              className="mt-4 px-5 py-2 cursor-pointer bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg shadow-md hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center gap-2 transition-all duration-300"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="max-w-3xl mx-auto py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Posts</h2>
        <div className="space-y-6">
          {currentMedia.map((item) => (
            <div
              key={item.id}
              className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow duration-300"
            >
              {item.media_type === "VIDEO" ? (
                <video
                  controls
                  className="w-full object-cover rounded-md mb-3"
                  poster={`${item.media_url.split(".mp4")[0]}.jpg`}
                >
                  <source src={item.media_url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={item.media_url}
                  alt={item.caption || "Media"}
                  className="w-full object-cover rounded-md mb-3"
                />
              )}
              <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                {item.caption || "No caption"}
              </p>
              <div className="flex justify-between items-center mb-4">
                <a
                  href={item.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm font-medium"
                >
                  View on Instagram
                </a>
              </div>

              {/* Comments Section */}
              <div className="space-y-3 mb-4">
                {(comments[item.id] || []).map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 rounded-md p-3 border border-gray-100"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xs">
                          {comment.username[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-gray-800 text-sm">
                            {comment.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {comment.timestamp}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm mt-1">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment Input */}
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !sendingComment[item.id]) {
                      handleAddComment(item.id);
                    }
                  }}
                  disabled={sendingComment[item.id]}
                  className={`flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    sendingComment[item.id] ? "bg-gray-100" : ""
                  } transition-all duration-300`}
                />
                <button
                  onClick={() => handleAddComment(item.id)}
                  disabled={sendingComment[item.id]}
                  className={`bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-all duration-300 text-sm ${
                    sendingComment[item.id]
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {sendingComment[item.id] ? (
                    <div className="flex items-center gap-1">
                      <TailSpin color="#ffffff" height={16} width={16} />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls (only show if more than one page) */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 text-sm"
            >
              Previous
            </button>
            <span className="px-3 py-2 text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white text-gray-700 rounded-md hover:bg-gray-100 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
