import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";

const app = express();

app.use(cors());
app.use(express.json());
dotenv.config();

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const REDIRECT_URI =
  process.env.REDIRECT_URI || "http://localhost:3000/callback";

app.get("/auth/instagram", (req, res) => {
  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=user_profile,user_media&response_type=code`;
  console.log(authUrl);
  res.redirect(authUrl);
});

app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("No authorization code received");
  }

  try {
    const tokenResponse = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code: code,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    res.redirect(`http://localhost:3000/dashboard?token=${accessToken}`);
  } catch (error) {
    console.error(
      "Error exchanging code for token:",
      error.response ? error.response.data : error.message
    );
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/instagram/profile", async (req, res) => {
  const token = req.query.token;
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
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

app.get("/api/instagram/media", async (req, res) => {
  const token = req.query.token;
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
    res.status(500).json({ error: "Failed to fetch media" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));
