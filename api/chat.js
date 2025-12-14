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
    const { message, persona, context, conversationHistory } = req.body;

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

When asked about a product, provide a structured response with:
- **USP** (1-liner value proposition)
- **Pain Point Solved** (what problem it addresses)
- **How It Works** (brief workflow/steps)
- **Industry Applicability** (which industries benefit)
- **Implementation Approach** (how to get started)

Be consultative, helpful, and use clear markdown formatting.`;
    } else if (persona === 'contributor') {
      const isGeneratingBrief = context?.generateBrief;
      const domain = context?.domain;
      const subDomain = context?.subDomain;

      if (isGeneratingBrief) {
        systemPrompt = `You are the Ikshan Founder - visionary and analytical.

Based on the conversation history, generate a comprehensive **Idea Brief** in markdown format with these sections:

## 📋 Idea Brief

### Problem Statement
[What specific problem needs solving?]

### Who It Impacts
[Target users, departments, or roles affected]

### Current Workflow/Tools
[How is this being done today? What tools are being used?]

### Proposed Solution
[High-level solution approach with AI/automation]

### Required Integrations
[Systems, APIs, or tools that need to connect]

### Success Metrics
[How will success be measured? KPIs, time savings, etc.]

### Constraints & Considerations
[Technical limitations, budget, timeline, compliance needs]

---

Be specific, actionable, and extract as much detail as possible from the conversation. If some information is missing, use [To be determined] placeholders.`;
      } else {
        systemPrompt = `You are the Ikshan Founder - visionary, curious, and collaborative.

You're helping a user in the **${domain || 'business'}** domain${subDomain ? `, specifically with **${subDomain}**` : ''}.

Your goal is to understand their pain points and capture a product idea. Ask 1-2 focused questions per response to dig deeper:
- What's the biggest bottleneck in their workflow?
- What tools or processes are they using today?
- How much time/effort is wasted on this?
- What's their ideal outcome or success metric?
- Who on their team is affected?
- What have they tried so far?

Guidelines:
- Keep responses concise (2-3 sentences max)
- Ask ONE question at a time, not multiple
- Be enthusiastic and collaborative
- DO NOT mention "Generate Idea Brief" button - it's already visible to them
- DO NOT promise what the brief will contain
- After gathering key details (problem, current process, desired outcome), confirm your understanding briefly

When you sense you have enough information (usually after 3-4 exchanges), simply acknowledge their input without pushing them toward the brief generation.`;
      }
    } else {
      systemPrompt = `You are Ikshan AI Assistant. Help users by asking if they want to:
1. Learn about Ikshan products
2. Share a new idea or product request`;
    }

    // Build messages array with conversation history
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add conversation history if available
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory);
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Adjust parameters based on context
    const isGeneratingBrief = context?.generateBrief === true;
    const temperature = isGeneratingBrief ? 0.5 : 0.7; // Lower temp for structured output
    const maxTokens = isGeneratingBrief ? 1500 : 600; // More tokens for brief

    // Call OpenAI API with detailed error handling
    console.log('Calling OpenAI API...', { messagesCount: messages.length, isGeneratingBrief });
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens
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
