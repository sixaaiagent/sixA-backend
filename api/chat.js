export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key missing in server config" });
  }

  const MAX_RETRIES = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini", // তুমি চাইলে এখানে অন্য মডেল দিতে পারো
          messages: [{ role: "user", content: message }],
          temperature: 0.7,
          top_p: 0.9,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Attempt ${attempt} failed:`, response.status, errorText);

        lastError = `Error ${response.status}: ${errorText}`;
        continue; // retry next attempt
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "⚠️ No response from AI";
      return res.status(200).json({ reply });
    } catch (err) {
      console.error(`❌ Attempt ${attempt} exception:`, err.message);
      lastError = err.message;
    }
  }

  // সব চেষ্টা ব্যর্থ হলে
  return res.status(500).json({
    error: "AI request failed after multiple retries.",
    details: lastError,
  });
}
