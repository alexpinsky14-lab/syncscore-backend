export default async function handler(req, res) {
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
      body: JSON.stringify({
        mood,
        genre,
        duration,
      }),
    });

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error("Beatoven error:", error);
    res.status(500).json({ error: "Failed to generate track" });
  }
}
