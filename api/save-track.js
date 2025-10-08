import { put } from "@vercel/blob";

/**
 * POST /api/save-track
 * Body: { trackUrl: "https://cdn.beatoven.ai/tracks/123.mp3", filename?: "myfile.mp3" }
 *
 * Downloads the Beatoven MP3 and re-uploads it to your own Vercel Blob store.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { trackUrl, filename } = req.body || {};
    if (!trackUrl) {
      return res.status(400).json({ error: "Missing trackUrl" });
    }

    // 1️⃣ Download the Beatoven file
    const resp = await fetch(trackUrl);
    if (!resp.ok) throw new Error(`Download failed (${resp.status})`);

    const buf = Buffer.from(await resp.arrayBuffer());

    // 2️⃣ Upload it to your Blob store
    const blob = await put(`tracks/${filename || Date.now()}.mp3`, buf, {
      access: "public",
      contentType: "audio/mpeg",
    });

    // 3️⃣ Return the permanent public URL
    res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error("save-track error:", err);
    res.status(500).json({ error: "Failed to save track", details: err.message });
  }
}
