import React, { useEffect } from "react";
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

  useEffect(() => {
    if (!accessToken) {
      navigate("/login");
      return;
    }

    const fetchUserAndMedia = async () => {
      dispatch(setLoading(true));
      try {
        // Fetch user profile using axios
        const profileResponse = await axios.get(
          `http://localhost:5000/api/instagram/profile?token=${accessToken}`
        );
        dispatch(setUser(profileResponse.data));

        // Fetch media using axios
        const mediaResponse = await axios.get(
          `http://localhost:5000/api/instagram/media?token=${accessToken}`
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

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
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
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Instagram Dashboard
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">User Profile</h2>
        {user.profile_picture_url && (
          <img
            src={user.profile_picture_url}
            alt="Profile"
            className="w-32 h-32 rounded-full mx-auto mb-4"
          />
        )}
        <p>
          <strong>Username:</strong> {user.username || "N/A"}
        </p>
        <p>
          <strong>ID:</strong> {user.id}
        </p>
        <p>
          <strong>Account Type:</strong> {user.account_type}
        </p>
        <button
          onClick={() => {
            dispatch(logout());
            navigate("/login");
          }}
          className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {media.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-lg shadow-md">
            <img
              src={item.media_url}
              alt={item.caption}
              className="w-full h-64 object-cover rounded-md mb-2"
            />
            <p className="text-gray-700">{item.caption}</p>
            <a
              href={item.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              View on Instagram
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
