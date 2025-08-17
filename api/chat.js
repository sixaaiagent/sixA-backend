// api/chat.js
// Vercel serverless function: handles POST /api/chat
// DO NOT put your API key here — keep it in Vercel Environment Variables

module.exports = async (req, res) => {
  const allowed = process.env.ALLOWED_ORIGIN || "*"; // e.g. https://<your-username>.github.io

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", allowed);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "86400");
    res.status(204).end();
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", allowed);

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { message } = req.body || {};
    if (!message || !message.trim()) {
      res.status(400).json({ error: "empty message" });
      return;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Missing OPENROUTER_API_KEY" });
      return;
    }

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.HTTP_REFERER || "https://vercel.app",
        "X-Title": "6A AI Agent"
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openrouter/auto",
        messages: [
          { role: "system", content: "You are 6A AI Agent. Be concise and helpful." },
          { role: "user", content: message }
        ]
      })
    });

    const text = await r.text();
    if (!r.ok) {
      res.status(500).send(text);
      return;
    }

    const data = JSON.parse(text);
    const reply = data.choices?.[0]?.message?.content || "(no content)";
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
