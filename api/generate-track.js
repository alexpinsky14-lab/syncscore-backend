// api/generate-track.js

export default async function handler(req, res) {
  // CORS headers so your Framer app can call this API
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mood, genre, duration } = req.body;

// 1️⃣ Create a track on Beatoven
const createRes = await fetch("https://public-api.beatoven.ai/v1/tracks", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.BEATOVEN_API_KEY,
  },
  body: JSON.stringify({ mood, genre, duration }),
});

const createText = await createRes.text();
console.log("🔍 Beatoven create response:", createText);

let createData;
try {
  createData = JSON.parse(createText);
} catch {
  console.error("Failed to parse JSON response from Beatoven");
  throw new Error("Invalid JSON returned from Beatoven");
}

    // 2️⃣ Extract a track ID (or similar key) — adapt based on what your API returns
    const trackId =
      createData?.data?.id ||
      createData?.id ||
      createData?.trackId;

    if (!trackId) {
      throw new Error("Beatoven did not return a track ID");
    }

    // 3️⃣ Request full generation (if needed)
    await fetch(`https://public-api.beatoven.ai/v1/tracks/${trackId}/generate`, {
      method: "POST",
      headers: {
        "x-api-key": process.env.BEATOVEN_API_KEY,
      },
    });

    // 4️⃣ Poll until the real audio URL is ready
    let trackUrl = null;
    const maxTries = 12; // e.g. 12 tries
    for (let i = 0; i < maxTries; i++) {
      await new Promise((r) => setTimeout(r, 5000)); // wait 5 seconds

      const checkRes = await fetch(`https://public-api.beatoven.ai/v1/tracks/${trackId}`, {
        headers: {
          "x-api-key": process.env.BEATOVEN_API_KEY,
        },
      });

      const checkData = await checkRes.json();
      console.log("Beatoven check response:", checkData);

      // Suppose the returned JSON has `data.audio_url`
      const possibleUrl = checkData?.data?.audio_url;

      if (possibleUrl && !possibleUrl.includes("mixkit")) {
        trackUrl = possibleUrl;
        break;
      }
    }

    if (!trackUrl) {
      throw new Error("Timed out waiting for Beatoven track");
    }

    // 5️⃣ Save the track via your save-track endpoint
    const saveRes = await fetch(
      `${process.env.BASE_URL || "https://syncscore-backend.vercel.app"}/api/save-track`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackUrl,
          filename: `beatoven-${Date.now()}.mp3`,
        }),
      }
    );

    const saveData = await saveRes.json();
    if (!saveRes.ok) {
      throw new Error(saveData.error || "Save-track failed");
    }

    // 6️⃣ Return to Framer
    res.status(200).json({
      beatovenUrl: trackUrl,
      storedUrl: saveData.url,
    });
  } catch (err) {
    console.error("Beatoven error:", err);
    res.status(500).json({
      error: "Beatoven generation failed",
      details: err.message,
    });
  }
}
