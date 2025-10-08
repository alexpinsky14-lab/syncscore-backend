// /api/beatoven-probe.js
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const base = "https://public-api.beatoven.ai";

  // Candidate CREATE endpoints people commonly guess/use
  const candidates = [
    "/tracks",
    "/tracks/create",
    "/music/generate",
    "/compose",
    "/compositions",
    "/generate"
  ];

  const body = {
    // Try both styles so we can see which schema the API expects
    mood: "calm",
    genre: "ambient",
    duration: 30,
    prompt: "Calm ambient corporate background bed, no drums, unobtrusive."
  };

  const results = [];
  for (const path of candidates) {
    try {
      const r = await fetch(`${base}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.BEATOVEN_API_KEY || ""
        },
        body: JSON.stringify(body)
      });
      const text = await r.text();
      results.push({ path, status: r.status, text: safeTrim(text) });
    } catch (e) {
      results.push({ path, error: e.message || String(e) });
    }
  }

  // Also check common “status” shapes IF we happened to get any ID back
  // (You’ll paste an ID into the querystring to test, like ?id=XYZ)
  const id = req.query.id;
  const statusCandidates = id
    ? [ `/tracks/${id}`, `/compositions/${id}`, `/tasks/${id}`, `/jobs/${id}` ]
    : [];

  for (const path of statusCandidates) {
    try {
      const r = await fetch(`${base}${path}`, {
        method: "GET",
        headers: { "x-api-key": process.env.BEATOVEN_API_KEY || "" }
      });
      const text = await r.text();
      results.push({ path, status: r.status, text: safeTrim(text) });
    } catch (e) {
      results.push({ path, error: e.message || String(e) });
    }
  }

  return res.status(200).json({ base, results });
}

function safeTrim(s) {
  if (!s) return s;
  return s.length > 500 ? s.slice(0, 500) + " …(truncated)" : s;
}
