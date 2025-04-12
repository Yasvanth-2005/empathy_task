import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import session from "express-session";
import rateLimit from "express-rate-limit";

const app = express();

app.use(express.json());
dotenv.config();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", httpOnly: true },
  })
);

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

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

// 1. Handle Callback from Frontend (POST)
app.post("/callback", async (req, res) => {
  const { code, redirect } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No authorization code provided" });
  }

  // Check if we already have a token in session
  if (req.session.accessToken) {
    return res.json({ access_token: req.session.accessToken });
  }

  try {
    console.log("Exchanging code for token with code:", code);
    console.log("Using REDIRECT_URI:", REDIRECT_URI);

    const tokenResponse = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: redirect,
        code: code,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    req.session.accessToken = accessToken; // Store in session
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

// 2. Fetch User Profile (Proxy Endpoint)
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

// 3. Fetch User Media (Proxy Endpoint)
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

// 4. Post Comment (Proxy Endpoint)
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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
