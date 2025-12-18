// Vercel Serverless Function for GPT-powered company search
import Papa from 'papaparse';

// Consolidated sheet with all companies
const SHEET_ID = '1d6nrGP4yRbx_ddzClAheicsavF2OsmINJmMDIQIL4m0';

// URL to fetch the consolidated sheet (first/default tab)
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { domain, subdomain, requirement, userContext } = req.body;

    console.log('Fetching consolidated sheet for domain:', domain, 'subdomain:', subdomain);
    console.log('User context:', userContext);

    const response = await fetch(SHEET_CSV_URL);

    if (!response.ok) {
      console.error('Failed to fetch sheet:', response.status);
      return res.status(500).json({
        error: 'Failed to fetch Google Sheet',
        companies: []
      });
    }

    const csvText = await response.text();
    console.log('CSV fetched, length:', csvText.length);

    // Parse CSV
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    // Helper function to find column value with flexible matching
    const getColumnValue = (row, possibleNames) => {
      for (const name of possibleNames) {
        if (row[name]) return row[name];
        // Try case-insensitive match
        const lowerName = name.toLowerCase();
        for (const key of Object.keys(row)) {
          if (key.toLowerCase() === lowerName || key.toLowerCase().includes(lowerName.split(' ')[0])) {
            if (row[key]) return row[key];
          }
        }
      }
      return '';
    };

    // Normalize column names with flexible matching
    const companies = parsed.data
      .map(row => ({
        name: getColumnValue(row, ['Startup name', 'Startup Name', 'Company', 'Name', 'Company Name']),
        country: getColumnValue(row, ['Country', 'Location', 'Region']),
        problem: getColumnValue(row, ['Basic problem', 'Basic Problem', 'Problem', 'Problem Statement', 'What they solve']),
        differentiator: getColumnValue(row, ['Differentiator', 'Unique Value', 'USP', 'What makes them special']),
        description: getColumnValue(row, ['Core product description (<=3 lines)', 'Core product description', 'Description', 'Product Description', 'What they do']),
        aiAdvantage: getColumnValue(row, ['Main AI / data advantage', 'Main AI/data advantage', 'AI Advantage', 'Tech Advantage']),
        fundingAmount: getColumnValue(row, ['Latest Funding Amount', 'Funding', 'Funding Amount']),
        fundingDate: getColumnValue(row, ['Latest Funding Date', 'Funding Date']),
        pricing: getColumnValue(row, ['Pricing motion & segment', 'Pricing', 'Price', 'Pricing Model'])
      }))
      .filter(c => c.name && c.name.trim());

    console.log('Parsed companies:', companies.length);
    console.log('First company name:', companies[0]?.name);
    console.log('Headers found:', parsed.meta?.fields);

    // If no companies found, return empty
    if (companies.length === 0) {
      return res.status(200).json({
        success: true,
        companies: [],
        message: 'No companies found in the database',
        debug: {
          requestedDomain: domain,
          csvLength: csvText.length,
          headers: parsed.meta?.fields
        }
      });
    }

    // If no requirement provided, return all companies
    if (!requirement) {
      return res.status(200).json({
        success: true,
        companies: companies.slice(0, 10),
        totalCount: companies.length
      });
    }

    // Use GPT to intelligently search for relevant companies
    const apiKey = process.env.OPENAI_API_KEY;
    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';

    if (!apiKey) {
      console.error('OpenAI API key not configured');
      // Fallback to basic keyword matching
      return res.status(200).json({
        success: true,
        companies: companies.slice(0, 5),
        totalCount: companies.length,
        searchMethod: 'fallback'
      });
    }

    // Create a compact summary of companies for GPT
    const companySummaries = companies.map((c, i) =>
      `[${i}] ${c.name}: ${c.problem || ''} | ${c.description || ''} | ${c.differentiator || ''}`
    ).join('\n');

    // Build user profile from context
    let userProfile = '';
    if (userContext) {
      if (userContext.role === 'business-owner') {
        userProfile = `User Profile: Business Owner
- Business type: ${userContext.businessType || 'Not specified'}
- Industry: ${userContext.industry || 'Not specified'}
- Target audience: ${userContext.targetAudience || 'Not specified'}
- Market segment: ${userContext.marketSegment || 'Not specified'}`;
      } else if (userContext.role === 'professional') {
        userProfile = `User Profile: Working Professional
- Role & Industry: ${userContext.roleAndIndustry || 'Not specified'}
- Solution for: ${userContext.solutionFor || 'Not specified'}${userContext.salaryContext ? `\n- Context: ${userContext.salaryContext}` : ''}`;
      } else if (userContext.role === 'freelancer') {
        userProfile = `User Profile: Freelancer
- Type of work: ${userContext.freelanceType || 'Not specified'}
- Main challenge: ${userContext.challenge || 'Not specified'}`;
      } else if (userContext.role === 'student') {
        userProfile = `User Profile: Student/Learner exploring solutions`;
      }
    }

    // First GPT call: Find relevant companies
    const searchPrompt = `You are an AI assistant that matches user requirements to AI/SaaS companies.
You MUST always find the TOP 3 BEST matches from the available companies - there is ALWAYS a best match.

IMPORTANT: Even if no company is a perfect match, find the 3 CLOSEST ones that could potentially help.
Think creatively - a marketing tool might help with sales, a data tool might help with research, etc.

${userProfile}

User's context: ${subdomain ? `${subdomain} in ${domain}` : domain || 'General business'}
User's requirement: "${requirement}"

Available companies (${companies.length} total):
${companySummaries}

You MUST return exactly 3 indices. Return ONLY a JSON array: [0, 2, 5]`;

    console.log('Calling GPT for intelligent search...');

    const searchResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: searchPrompt },
          { role: 'user', content: `Find relevant companies for: "${requirement}"` }
        ],
        temperature: 0.3,
        max_tokens: 100
      })
    });

    if (!searchResponse.ok) {
      console.error('GPT API error:', searchResponse.status);
      return res.status(200).json({
        success: true,
        companies: companies.slice(0, 3),
        totalCount: companies.length,
        searchMethod: 'fallback'
      });
    }

    const searchData = await searchResponse.json();
    const searchMessage = searchData.choices[0]?.message?.content || '';

    // Parse indices
    let matchedIndices = [];
    try {
      const numbers = searchMessage.match(/\d+/g);
      if (numbers) {
        matchedIndices = numbers.map(n => parseInt(n)).filter(n => n >= 0 && n < companies.length).slice(0, 3);
      }
    } catch (e) {
      matchedIndices = [0, 1, 2];
    }

    if (matchedIndices.length === 0) {
      matchedIndices = [0, 1, 2].filter(i => i < companies.length);
    }

    // Get matched companies
    const matchedCompanies = matchedIndices.map(i => companies[i]);

    // Second GPT call: Generate helpful, layman explanation
    const explanationPrompt = `You are a friendly business advisor helping someone find AI tools for their needs.
Write in VERY SIMPLE language - like explaining to a friend who isn't technical.

${userProfile}

The user needs help with: "${requirement}"
Context: ${subdomain ? `${subdomain} in ${domain}` : domain || 'their business'}

Here are the best available solutions I found:

${matchedCompanies.map((c, i) => `
Tool ${i + 1}: ${c.name}
- Problem they solve: ${c.problem || 'General business automation'}
- What they do: ${c.description || 'AI-powered solution'}
- What makes them special: ${c.differentiator || 'Unique approach'}
`).join('\n')}

Write a helpful response that:
1. Start with understanding what the user wants (1 sentence)
2. For each tool, explain:
   - The tool name (bold it with **)
   - What it does in simple words
   - How it COULD help with their need (even if not a perfect fit, explain the connection)
3. Keep each tool to 2-3 sentences
4. Be warm and helpful - like a friend giving advice
5. End with encouragement

IMPORTANT RULES:
- NEVER say "no matches found" or "not a perfect fit"
- Always be positive and show how each tool can help
- If a tool isn't directly related, explain how it could still be useful
- Use everyday language, no jargon
- Keep under 250 words`;

    const explanationResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: explanationPrompt },
          { role: 'user', content: `Help me understand these tools for: "${requirement}"` }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    let helpfulExplanation = '';
    if (explanationResponse.ok) {
      const explanationData = await explanationResponse.json();
      helpfulExplanation = explanationData.choices[0]?.message?.content || '';
    }

    return res.status(200).json({
      success: true,
      companies: matchedCompanies,
      totalCount: companies.length,
      searchMethod: 'ai',
      helpfulResponse: helpfulExplanation,
      userRequirement: requirement,
      debug: {
        requestedDomain: domain,
        subdomain: subdomain,
        totalCompaniesSearched: companies.length
      }
    });

  } catch (error) {
    console.error('Error in search-companies:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      companies: []
    });
  }
}
