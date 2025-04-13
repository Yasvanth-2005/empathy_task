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

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { accessToken, user, media, loading, error } = useSelector(
    (state) => state.user
  );

  const [newComment, setNewComment] = useState(""); // State for new comment input
  const [comments, setComments] = useState({}); // State to store comments for each media item

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

  // Function to handle adding a new comment
  const handleAddComment = async (mediaId) => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/instagram/comment`,
        {
          mediaId: mediaId,
          message: newComment,
          token: accessToken, // Assuming token is required in the body
        }
      );

      // Update local state with the new comment
      setComments((prev) => ({
        ...prev,
        [mediaId]: [
          ...(prev[mediaId] || []),
          {
            id: Date.now().toString(), // Temporary ID, replace with actual ID from response if available
            text: newComment,
            username: user.username || "Current User", // Use current user's username
            timestamp: "Just now",
            replies: [],
          },
        ],
      }));

      setNewComment(""); // Clear input
    } catch (error) {
      dispatch(
        setError(
          error.response ? error.response.data.error : "Failed to post comment"
        )
      );
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error: {error}
      </div>
    );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Profile Section */}
      <div className="bg-white shadow-md mb-6">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg">
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
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-2xl font-bold">{user.username || "N/A"}</h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {user.account_type}
                </span>
              </div>
              <div className="text-gray-600 text-sm">Account ID: {user.id}</div>
              <button
                onClick={() => {
                  dispatch(logout());
                  navigate("/login");
                }}
                className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media Grid */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {media.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-md overflow-hidden"
            >
              <img
                src={item.media_url}
                alt={item.caption}
                className="w-full aspect-square object-cover"
              />
              <div className="p-6">
                <p className="text-gray-800 mb-4">{item.caption}</p>
                <div className="flex justify-between items-center mb-4">
                  <a
                    href={item.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View on Instagram
                  </a>
                </div>

                {/* Comments Section */}
                <div className="space-y-4 mb-4">
                  {(comments[item.id] || []).map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">
                            {comment.username[0]}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
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
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={() => handleAddComment(item.id)}
                    className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
