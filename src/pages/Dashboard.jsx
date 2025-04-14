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
import Modal from "react-modal";

Modal.setAppElement("#root");

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accessToken, user, media, loading, error } = useSelector(
    (state) => state.user
  );

  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState({});
  const [sendingComment, setSendingComment] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null); // State for modal

  useEffect(() => {
    if (!accessToken) {
      navigate("/");
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

  if (loading)
    return (
      <div className="flex items-center flex-col justify-center min-h-[90vh] bg-white px-4 sm:px-6 md:px-8">
        <TailSpin color="#4A5568" height={40} width={40} />
        <span className="mt-4 text-gray-600">
          Loading your Instagram data...
        </span>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-[90vh] bg-white px-4 sm:px-6 md:px-8 text-red-600">
        Error: {error}
      </div>
    );

  if (!user) return null;

  return (
    <div className="min-h-[90vh] bg-gray-50 px-4 sm:px-6 md:px-8">
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
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              {user.username || "N/A"}
            </h1>
            <div className="flex gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full max-w-fit text-xs font-medium">
                {user.account_type}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full max-w-fit text-xs font-medium">
                {user.media_count} Posts
              </span>
            </div>
            <div className="text-gray-600 text-sm line-clamp-1">
              Account ID: {user.id}
            </div>
            <button
              onClick={() => {
                dispatch(logout());
                navigate("/");
              }}
              className="mt-4 px-5 py-2 cursor-pointer bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-medium rounded-md shadow-md hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center gap-2 transition-all duration-300"
            >
              <LogOut size={12} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Your Posts</h2>
        {media.length === 0 ? (
          <div className="flex items-center justify-center min-h-[500px] bg-white">
            <span className="text-gray-500">No posts found</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {media.map((item) => (
              <div
                key={item.id}
                className="aspect-[4/5] cursor-pointer overflow-hidden rounded-md border border-gray-200 hover:border-gray-300 transition-all duration-300"
                onClick={() => setSelectedMedia(item)}
              >
                {item.media_type === "VIDEO" ? (
                  <video
                    className="w-full h-full object-cover"
                    poster={`http://www.commander.co.uk/wp-content/uploads/2015/06/video-placeholder.png`}
                  >
                    <source src={item.media_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={item.media_url}
                    alt={item.caption || "Media"}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={!!selectedMedia}
        onRequestClose={() => setSelectedMedia(null)}
        style={{
          content: {
            top: "50%",
            left: "50%",
            right: "auto",
            bottom: "auto",
            marginRight: "-50%",
            transform: "translate(-50%, -50%)",
            maxWidth: "90vw",
            maxHeight: "90vh",
            width: "500px",
            borderRadius: "8px",
            padding: "20px",
            background: "#fff",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        {selectedMedia && (
          <div className="flex flex-col h-full">
            {selectedMedia.media_type === "VIDEO" ? (
              <video
                controls
                className="w-full h-64 object-cover rounded-md mb-2"
                poster={`${selectedMedia.media_url.split(".mp4")[0]}.jpg`}
              >
                <source src={selectedMedia.media_url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={selectedMedia.media_url}
                alt={selectedMedia.caption || "Media"}
                className="w-full h-64 object-cover rounded-md mb-2"
              />
            )}
            {/* Caption below media, Instagram style */}
            {selectedMedia.caption && (
              <div className="mb-2 text-gray-600 text-sm font-medium">
                {selectedMedia.caption}
              </div>
            )}
            <div className="flex-1 overflow-y-auto max-h-64 mb-2">
              <div className="space-y-3">
                {(comments[selectedMedia.id] || []).map((comment) => (
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
            </div>

            {/* Add Comment Input in Modal */}
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !sendingComment[selectedMedia.id]) {
                    handleAddComment(selectedMedia.id);
                  }
                }}
                disabled={sendingComment[selectedMedia.id]}
                className={`flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                  sendingComment[selectedMedia.id] ? "bg-gray-100" : ""
                } transition-all duration-300`}
              />
              <button
                onClick={() => handleAddComment(selectedMedia.id)}
                disabled={sendingComment[selectedMedia.id]}
                className={`bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600 transition-all duration-300 text-sm ${
                  sendingComment[selectedMedia.id]
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {sendingComment[selectedMedia.id] ? (
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
        )}
      </Modal>
    </div>
  );
};

export default Dashboard;
