// Vercel Serverless Function for OpenAI Chat
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get API key from environment variables (NEVER hardcode it!)
    const apiKey = process.env.OPENAI_API_KEY;
    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';

    if (!apiKey) {
      console.error('OpenAI API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: 'You are Ikshan AI Assistant, a helpful business intelligence chatbot. You help users understand our products: Shakti (AI SEO optimizer), Samarth (legal documentation manager), and Gati (HR management platform).'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return res.status(response.status).json({
        error: 'Failed to get response from AI',
        details: error.error?.message || 'Unknown error'
      });
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return res.status(200).json({ message: aiMessage });

  } catch (error) {
    console.error('Error in chat handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}
