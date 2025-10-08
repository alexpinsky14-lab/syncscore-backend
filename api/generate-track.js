export default async function handler(req, res) {
  // ✅ 1. Allow requests from Framer (CORS fix)
  res.setHeader("Access-Control-Allow-Origin", "*"); // change * to your Framer URL later
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ 2. Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // ✅ 3. Only allow POST for actual API calls
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mood, genre, duration } = req.body;

    // ✅ 4. Call Beatoven API
    const response = await fetch("https://api.beatoven.ai/v1/tracks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.BEATOVEN_API_KEY,
      },
      body: JSON.stringify({
        mood,
        genre,
        duration,
      }),
    });

    // ✅ 5. Return Beatoven’s response to Framer
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Beatoven error:", error);
    res.status(500).json({ error: "Failed to generate track" });
  }
}
