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

    // Get API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';

    // Log for debugging (without exposing the key)
    console.log('Environment check:', {
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT_SET',
      modelName: modelName,
      messageLength: message.length
    });

    if (!apiKey) {
      console.error('CRITICAL: OpenAI API key not found in environment variables');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'API key not configured. Please check Vercel environment variables.'
      });
    }

    // Call OpenAI API with detailed error handling
    console.log('Calling OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are Ikshan AI Assistant, a helpful business intelligence chatbot. You help users understand our products: ecommerce optimizer (AI SEO optimizer for e-commerce), Samarth (AI legal documentation manager - coming soon), and Gati (AI HR management platform - coming soon).'
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

    console.log('OpenAI response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorData
      });

      // Return specific error messages
      if (openaiResponse.status === 401) {
        return res.status(500).json({
          error: 'Authentication failed',
          message: 'Invalid API key. Please regenerate your OpenAI API key and update Vercel environment variables.'
        });
      }

      if (openaiResponse.status === 404) {
        return res.status(500).json({
          error: 'Model not found',
          message: 'The specified model does not exist or you do not have access to it. Check OPENAI_MODEL_NAME.'
        });
      }

      return res.status(openaiResponse.status).json({
        error: 'OpenAI API error',
        message: errorData.error?.message || 'Failed to get response from AI',
        details: errorData
      });
    }

    const data = await openaiResponse.json();
    console.log('OpenAI response received successfully');

    const aiMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return res.status(200).json({ message: aiMessage });

  } catch (error) {
    console.error('Error in chat handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
