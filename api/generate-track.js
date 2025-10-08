console.log("Beatoven key detected?", !!process.env.BEATOVEN_API_KEY);
// /api/generate-track.js

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { mood, genre, duration } = req.body;

  try {
    // 1️⃣ Create a track on Beatoven
    const createRes = await fetch("https://api.beatoven.ai/v1/tracks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.BEATOVEN_API_KEY,
      },
      body: JSON.stringify({ mood, genre, duration }),
    });

    const createData = await createRes.json();
    const trackId = createData?.data?.id;

    if (!trackId) {
      throw new Error("Beatoven did not return a track ID");
    }

    console.log("Track created:", trackId);

    // 2️⃣ Ask Beatoven to generate the full track
    await fetch(`https://api.beatoven.ai/v1/tracks/${trackId}/generate`, {
      method: "POST",
      headers: {
        "x-api-key": process.env.BEATOVEN_API_KEY,
      },
    });

    // 3️⃣ Poll until we get a real audio_url (up to 60 seconds)
    let trackUrl = null;
    const maxAttempts = 12; // 12 * 5s = 60 seconds
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 5000)); // wait 5 seconds

      const checkRes = await fetch(`https://api.beatoven.ai/v1/tracks/${trackId}`, {
        headers: { "x-api-key": process.env.BEATOVEN_API_KEY },
      });

      const checkData = await checkRes.json();
      const possibleUrl =
        checkData?.data?.audio_url ||
        checkData?.data?.preview_url ||
        checkData?.audio_url;

      // Skip Mixkit previews — wait for real Beatoven audio
      if (possibleUrl && !possibleUrl.includes("mixkit")) {
        trackUrl = possibleUrl;
        break;
      }

      console.log(`Waiting for Beatoven track (${i + 1}/${maxAttempts})...`);
    }

    if (!trackUrl) {
      throw new Error("Timed out waiting for Beatoven track to be ready");
    }

    console.log("Beatoven track ready:", trackUrl);

    // 4️⃣ Send it to your save-track endpoint for permanent storage
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
      throw new Error(saveData.error || "Failed to save track");
    }

    // 5️⃣ Return the permanent blob URL to Framer
    res.status(200).json({
      message: "Track generated and stored successfully",
      beatovenUrl: trackUrl,
      storedUrl: saveData.url,
    });
  } catch (error) {
    console.error("Beatoven error:", error);
    res.status(500).json({ error: "Beatoven generation failed", details: error.message });
  }
}
