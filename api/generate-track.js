// /api/generate-track.js

import { put } from "@vercel/blob"; // optional, only used if you want to upload directly
import { fetch } from "undici"; // if you're using Node 18+, you can omit this import

export default async function handler(req, res) {
  // ✅ Allow Framer to reach it
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { mood, genre, duration } = req.body;

    // 1️⃣ Request a track from Beatoven
    const beatovenRes = await fetch("https://api.beatoven.ai/v1/tracks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.BEATOVEN_API_KEY,
      },
      body: JSON.stringify({ mood, genre, duration }),
    });

    const beatovenData = await beatovenRes.json();
    console.log("Beatoven response:", beatovenData);

    // 2️⃣ Extract audio URL from Beatoven response
    const trackUrl =
      beatovenData?.data?.audio_url ||
      beatovenData?.audio_url ||
      beatovenData?.url ||
      beatovenData?.preview_url;

    if (!trackUrl) {
      return res.status(400).json({ error: "No track URL returned by Beatoven" });
    }

    // 3️⃣ Upload to your blob store through /save-track
    const saveRes = await fetch(`${process.env.BASE_URL || "https://syncscore-backend.vercel.app"}/api/save-track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackUrl,
        filename: `beatoven-${Date.now()}.mp3`,
      }),
    });

    const saveData = await saveRes.json();
    if (!saveRes.ok) {
      throw new Error(saveData.error || "Upload failed");
    }

    // 4️⃣ Return your permanent blob URL to Framer
    res.status(200).json({
      message: "Track generated and stored successfully",
      beatovenUrl: trackUrl,
      storedUrl: saveData.url,
    });
  } catch (error) {
    console.error("Beatoven error:", error);
    res.status(500).json({ error: "Failed to generate or store track", details: error.message });
  }
}
