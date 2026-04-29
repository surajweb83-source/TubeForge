export default async function handler(req, res) {
  // Security aur CORS setting
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key is missing in Vercel!' });
    }

    // Timeout controller — 9 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    // Google Gemini AI ko message bhejna
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'AI Error' });
    }

    // AI ka reply nikalna aur wapas bhejna
    const aiText = data.candidates[0].content.parts[0].text;
    res.status(200).json({ result: aiText });

  } catch (error) {
    console.error(error);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout — Gemini ne response nahi diya!' });
    }
    res.status(500).json({ error: 'Server crashed!' });
  }
}
