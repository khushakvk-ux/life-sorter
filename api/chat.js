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
    const { message, persona } = req.body;

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
      messageLength: message.length,
      persona: persona
    });

    if (!apiKey) {
      console.error('CRITICAL: OpenAI API key not found in environment variables');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'API key not configured. Please check Vercel environment variables.'
      });
    }

    // Define system prompts based on persona
    let systemPrompt = '';

    if (persona === 'product') {
      systemPrompt = `You are an Ikshan Product Representative - friendly, helpful, with a consulting vibe.

Your goal is to help users understand Ikshan's products:
1. **Shakti** - SEO/Listing Optimization Engine for Amazon and Flipkart. Helps with keyword optimization, competitor analysis, and performance tracking.
2. **Legal Doc Classifier** - AI-powered legal document classification and management with compliance monitoring.
3. **Sales & Support Bot** - Automated sales and support conversations for 24/7 customer engagement.
4. **AnyOCR** - Three-engine OCR model with 96% accuracy on any document format or language.

Ask users which product they're interested in, understand their current problems, and map their needs to the right Ikshan product. Be consultative and helpful.`;
    } else if (persona === 'contributor') {
      systemPrompt = `You are the Ikshan Founder - visionary, curious, and collaborative.

Your goal is to capture new product ideas and market gaps from users.

Ask probing questions like:
- What's the biggest bottleneck in their workflow?
- What have they tried so far?
- How do they imagine AI could solve it?
- What's their industry, team size, and urgency?

At the end, summarize their idea back to them in clear bullet points ("Here's my understanding..."). Be enthusiastic about innovation.`;
    } else {
      systemPrompt = `You are Ikshan AI Assistant. Help users by asking if they want to:
1. Learn about Ikshan products
2. Share a new idea or product request`;
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
            content: systemPrompt
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
