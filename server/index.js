import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import session from "express-session";
import rateLimit from "express-rate-limit";

const app = express();

// Middleware
app.use(express.json());
dotenv.config();

// CORS configuration
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", httpOnly: true },
  })
);

// Environment variables
const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI =
  process.env.NODE_ENV === "production"
    ? "https://empathy-task-yash.vercel.app/callback"
    : "http://localhost:3000/callback";

if (
  !INSTAGRAM_APP_ID ||
  !INSTAGRAM_APP_SECRET ||
  !REDIRECT_URI ||
  !process.env.SESSION_SECRET
) {
  console.error("Missing environment variables. Please check your .env file.");
  process.exit(1);
}

console.log("Configured REDIRECT_URI:", REDIRECT_URI);

// 1. Initiate Instagram OAuth Login
app.get("/auth/instagram", (req, res) => {
  const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments%2Cinstagram_business_content_publish%2Cinstagram_business_manage_insights`;
  console.log("Authorization URL with redirect_uri:", authUrl);
  res.redirect(authUrl);
});

// 2. Handle Callback (POST from frontend)
app.post("/callback", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No authorization code provided" });
  }

  // Check if we already have a token in session
  if (req.session.accessToken) {
    return res.json({ access_token: req.session.accessToken });
  }

  try {
    console.log("Token exchange redirect_uri:", REDIRECT_URI);
    console.log("Exchanging code for token with code:", code);

    const tokenResponse = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI, // Ensure this matches the logged authUrl
        code: code,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    req.session.accessToken = accessToken;
    res.json({ access_token: accessToken });
  } catch (error) {
    console.error(
      "Error exchanging code for token:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Authentication failed",
      details: error.response ? error.response.data : error.message,
    });
  }
});

app.get("/api/instagram/profile", async (req, res) => {
  const token = req.query.token || req.session.accessToken;

  if (!token) {
    return res.status(401).json({ error: "No access token provided" });
  }

  try {
    const response = await axios.get(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count,profile_picture_url&access_token=${token}`
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching profile:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Failed to fetch profile",
      details: error.response ? error.response.data : error.message,
    });
  }
});

app.get("/api/instagram/media", async (req, res) => {
  const token = req.query.token || req.session.accessToken;

  if (!token) {
    return res.status(401).json({ error: "No access token provided" });
  }

  try {
    const response = await axios.get(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink&access_token=${token}`
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error fetching media:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Failed to fetch media",
      details: error.response ? error.response.data : error.message,
    });
  }
});

app.post("/api/instagram/comment", async (req, res) => {
  const { mediaId, message } = req.body;
  const token = req.body.token || req.session.accessToken;

  if (!token || !mediaId || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await axios.post(
      `https://graph.instagram.com/${mediaId}/comments`,
      {
        message: message,
        access_token: token,
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error posting comment:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({
      error: "Failed to post comment",
      details: error.response ? error.response.data : error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
