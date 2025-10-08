export default async function handler(req, res) {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: "Missing URL parameter" });

  try {
    const audioResponse = await fetch(url);
    if (!audioResponse.ok) {
      return res.status(audioResponse.status).json({ error: "Failed to fetch audio" });
    }

    // copy headers to allow streaming
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=3600");

    // stream the file directly to browser
    const arrayBuffer = await audioResponse.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Proxy failed" });
  }
}
