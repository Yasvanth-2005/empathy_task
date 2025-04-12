import React, { useEffect } from "react";
import { Instagram } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAccessToken } from "../store/user/userSlice";
import axios from "axios";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleInstagramLogin = () => {
    window.location.href = `${import.meta.env.VITE_BACKEND_URL}/auth/instagram`;
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");

      if (code) {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/callback`,
            {
              code: code,
            }
          );

          const accessToken = response.data.access_token;

          if (accessToken) {
            dispatch(setAccessToken(accessToken));
            navigate("/dashboard");
          } else {
            console.error("No access token received from backend");
          }
        } catch (error) {
          console.error("Error during callback:", error);
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
