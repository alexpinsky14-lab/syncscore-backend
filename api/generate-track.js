// /api/generate-track.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { mood, genre, duration } = req.body;

    // 👇 1️⃣ Build a clean Beatoven prompt from your UI fields
    const prompt = `Generate ${mood || "ambient"} ${genre || "background"} music, around ${duration || 60} seconds long, unobtrusive, suitable for video editing.`;

    // 👇 2️⃣ Send the request to your Make.com webhook
    const webhookUrl = process.env.MAKE_WEBHOOK_URL;
    if (!webhookUrl) throw new Error("MAKE_WEBHOOK_URL not set in environment");

    console.log("🔗 Sending to Make webhook:", webhookUrl);
    console.log("🎵 Prompt:", prompt);

    const makeRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const makeText = await makeRes.text();
    let makeData;
    try {
      makeData = JSON.parse(makeText);
    } catch (e) {
      throw new Error("Make.com returned invalid JSON: " + makeText);
    }

    console.log("🎧 Make.com response:", makeData);

    const trackUrl =
      makeData?.track_url ||
      makeData?.data?.track_url ||
      makeData?.result?.track_url;

    if (!trackUrl) {
      throw new Error("No track URL returned from Make.com");
    }

    // 👇 3️⃣ Optional: save to your Blob storage (if you have /api/save-track)
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

    let storedUrl = null;
    try {
      const saveData = await saveRes.json();
      storedUrl = saveData.url || null;
    } catch {
      console.warn("⚠️ Save-track returned non-JSON");
    }

    // 👇 4️⃣ Respond to Framer with both URLs
    return res.status(200).json({
      message: "Track generated successfully",
      beatovenUrl: trackUrl,
      storedUrl,
    });
  } catch (error) {
    console.error("❌ Generate-track error:", error);
    return res
      .status(500)
      .json({ error: "Generation failed", details: error.message });
  }
}
