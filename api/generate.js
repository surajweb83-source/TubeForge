module.exports = async function handler(req, res) {
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
      return res.status(500).json({ error: 'API key missing!' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
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

    console.log('Gemini status:', response.status);
    console.log('Gemini response:', JSON.stringify(data));

    if (!response.ok) {
      return res.status(500).json({ 
        error: data.error?.message || 'Gemini API Error',
        details: JSON.stringify(data)
      });
    }

    if (!data.candidates || !data.candidates[0]) {
      return res.status(500).json({ 
        error: 'No response from Gemini',
        details: JSON.stringify(data)
      });
    }

    const aiText = data.candidates[0].content.parts[0].text;
    res.status(200).json({ result: aiText });

  } catch (error) {
    console.error('Catch error:', error.message);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout!' });
    }
    res.status(500).json({ error: error.message });
  }
};
