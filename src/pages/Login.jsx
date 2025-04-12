import React, { useEffect } from "react";
import { Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAccessToken } from "../store/user/userSlice";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const CLIENT_ID = "2232031687246073";
  const REDIRECT_URI = "https://empathy-task-yash.vercel.app/callback";
  const SCOPE =
    "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights";

  const handleInstagramLogin = () => {
    const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
      REDIRECT_URI
    )}&response_type=code&scope=${encodeURIComponent(SCOPE)}`;
    window.location.href = authUrl;
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code && window.location.pathname === "/callback") {
        try {
          const tokenResponse = await axios.post(
            "https://api.instagram.com/oauth/access_token",
            {
              client_id: CLIENT_ID,
              client_secret: process.env.REACT_APP_INSTAGRAM_CLIENT_SECRET,
              grant_type: "authorization_code",
              redirect_uri: REDIRECT_URI,
              code: code,
            }
          );

          const accessToken = tokenResponse.data.access_token;

          if (accessToken) {
            dispatch(setAccessToken(accessToken));
            navigate("/dashboard");
          } else {
            console.error("No access token received");
          }
        } catch (error) {
          console.error("Error exchanging code for token:", error);
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
            Connect with Instagram to view your profile and media
          </p>
        </div>

        <button
          onClick={handleInstagramLogin}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
        >
          <Instagram className="h-5 w-5" />
          Login with Instagram
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
