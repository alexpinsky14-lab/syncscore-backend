// /api/proxy-audio.js
// Streams external audio files safely through your backend.

export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: "Missing ?url parameter" });
  }

  try {
    // Add a browser-like User-Agent to avoid CDN blocking
    const audioResponse = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!audioResponse.ok) {
      console.error(
        "Audio fetch failed:",
        audioResponse.status,
        audioResponse.statusText
      );
      return res
        .status(audioResponse.status)
        .json({ error: "Audio fetch failed" });
    }

    // ✅ Add safe headers so Framer can read and play it
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cache-Control", "public, max-age=3600");

    // ✅ Handle browser preflight
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Stream audio back to browser
    const arrayBuffer = await audioResponse.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: "Proxy failed", details: err.message });
  }
}
