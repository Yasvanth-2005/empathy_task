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
  const itemsPerPage = 5; // Number of media items per page

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 via-orange-400 to-yellow-300">
        <TailSpin color="#ffffff" height={40} width={40} />
        <span className="mt-4 text-white">Loading your Instagram data...</span>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 via-orange-400 to-yellow-300 text-red-100">
        Error: {error}
      </div>
    );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-orange-400 to-yellow-300">
      {/* Profile Section */}
      <div className="bg-white rounded-2xl p-8 mx-auto max-w-3xl mt-8 border border-gray-100">
        <div className="flex items-center gap-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white">
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
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.username || "N/A"}
              </h1>
              <span className="px-4 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {user.account_type}
              </span>
            </div>
            <div className="text-gray-600 text-md">Account ID: {user.id}</div>
            <button
              onClick={() => {
                dispatch(logout());
                navigate("/login");
              }}
              className="mt-6 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-white mb-6">Your Posts</h2>
        <div className="space-y-6">
          {currentMedia.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:bg-gray-50 transition-colors duration-300"
            >
              <img
                src={item.media_url}
                alt={item.caption}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <p className="text-gray-800 mb-4 line-clamp-2">{item.caption}</p>
              <div className="flex justify-between items-center mb-4">
                <a
                  href={item.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline font-medium"
                >
                  View on Instagram
                </a>
              </div>

              {/* Comments Section */}
              <div className="space-y-4 mb-4">
                {(comments[item.id] || []).map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">
                          {comment.username[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">
                            {comment.username}
                          </span>
                          <span className="text-sm text-gray-500">
                            {comment.timestamp}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-1">{comment.text}</p>
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
                  disabled={sendingComment[item.id]}
                  className={`flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    sendingComment[item.id] ? "bg-gray-100" : ""
                  } transition-all duration-300`}
                />
                <button
                  onClick={() => handleAddComment(item.id)}
                  disabled={sendingComment[item.id]}
                  className={`bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-all duration-300 ${
                    sendingComment[item.id]
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {sendingComment[item.id] ? (
                    <div className="flex items-center gap-2">
                      <TailSpin color="#ffffff" height={20} width={20} />
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
              className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200"
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
