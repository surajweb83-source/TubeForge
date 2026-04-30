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

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt missing!' });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(prompt)}`,
      {
        method: 'GET',
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      return res.status(500).json({ error: 'AI Error!' });
    }

    const aiText = await response.text();
    res.status(200).json({ result: aiText });

  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Timeout!' });
    }
    res.status(500).json({ error: error.message });
  }
};
