import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());

// bagian penting ini bro:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname)); // biar bisa akses file index.html

// TikTok OAuth URL (sandbox)
const authURL = `https://open-api.tiktok.com/platform/oauth/connect/?client_key=${process.env.TIKTOK_CLIENT_KEY}&scope=user.info.basic&response_type=code&redirect_uri=${encodeURIComponent(process.env.TIKTOK_REDIRECT_URI)}`;

// Endpoint buat mulai login TikTok
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Callback TikTok ke web lu setelah user login
app.get("/api/callback", async (req, res) => {
  const code = req.query.code;

  try {
    const tokenResponse = await fetch("https://open-api.tiktok.com/oauth/access_token/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_key: process.env.TIKTOK_CLIENT_KEY,
        client_secret: process.env.TIKTOK_CLIENT_SECRET,
        code,
        grant_type: "authorization_code"
      }),
    });

    const tokenData = await tokenResponse.json();

    // Ambil user info pakai access_token
    const userResponse = await fetch("https://open-api.tiktok.com/user/info/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: tokenData.data.access_token,
        fields: ["open_id", "union_id", "avatar_url", "display_name", "bio_description"]
      }),
    });

    const userData = await userResponse.json();
    res.json(userData.data.user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal ambil data TikTok" });
  }
});

// // start server (kalau di local)
// app.listen(process.env.PORT || 3000, () => {
//   console.log(`Server jalan di port ${process.env.PORT}`);
// });
