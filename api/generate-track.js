export default async function handler(req, res) {
  // ✅ Dynamically allow requests from trusted domains
  const allowedOrigins = [
    "https://cultural-concept-965314.framer.app", // your current Framer domain
    "https://framer.website",                     // optional fallback for new publishes
    "https://syncscore.vercel.app"                // if you ever add your own domain
  ];

  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // Default to * for safety during development
    res.setHeader("Access-Control-Allow-Origin", "*");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { mood, genre, duration } = req.body;

    const response = await fetch("https://api.beatoven.ai/v1/tracks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.BEATOVEN_API_KEY,
      },
      body: JSON.stringify({ mood, genre, duration }),
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Beatoven error:", error);
    res.status(500).json({ error: "Failed to generate track" });
  }
}
