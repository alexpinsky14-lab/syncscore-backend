// /api/check-status.js

export default async function handler(req, res) {
  // ✅ Dynamically allow CORS for trusted Framer or your domains
  const allowedOrigins = [
    "https://cultural-concept-965314.framer.app", // your current Framer domain
  ];

  const origin = req.headers.origin;

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith(".framer.app"))) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*"); // fallback for testing
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Example static status check (you can replace with your real logic)
    res.status(200).json({
      status: "ok",
      message: "SyncScore backend is running and reachable.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ error: "Failed to check status" });
  }
}
