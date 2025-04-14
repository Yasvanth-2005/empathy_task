import React, { useEffect, useState } from "react";
import { Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAccessToken } from "../store/user/userSlice";
import axios from "axios";
import { TailSpin } from "react-loader-spinner";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
  const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;

  const handleInstagramLogin = () => {
    setLoading(true);
    const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        setLoading(true);
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/callback`,
            {
              code: code,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const accessToken = response.data.access_token;

          if (accessToken) {
            dispatch(setAccessToken(accessToken));
            navigate("/dashboard");
          } else {
            setError("No access token received from backend");
          }
        } catch (error) {
          console.error("Error during callback:", error);
          setError("Authentication failed. Please check server logs.");
          if (error.response) {
            console.error("Error details:", error.response.data);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, [navigate, dispatch]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <Instagram className="h-16 w-16 text-pink-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Instagram Integration
          </h1>
          <p className="text-gray-600">
            Connect with Instagram to view your profile and media and comment on
            them
          </p>
        </div>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <button
          onClick={handleInstagramLogin}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
          disabled={loading}
        >
          <Instagram className="h-5 w-5" />
          {!loading ? "Login with Instagram" : "Logging In...."}
        </button>
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>By continuing, you agree to our</p>
          <div className="flex justify-center gap-2 mt-1">
            <a href="#" className="text-pink-500 hover:underline">
              Terms of Service
            </a>
            <span>&</span>
            <a href="#" className="text-pink-500 hover:underline">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
