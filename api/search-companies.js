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
    const { domain, subdomain, requirement } = req.body;

    console.log('Fetching consolidated sheet for domain:', domain, 'subdomain:', subdomain);

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

    // Normalize column names
    const companies = parsed.data
      .map(row => ({
        name: row['Startup name'] || row['Startup Name'] || '',
        country: row['Country'] || '',
        problem: row['Basic problem'] || row['Basic Problem'] || '',
        differentiator: row['Differentiator'] || '',
        description: row['Core product description (<=3 lines)'] || row['Core product description'] || '',
        aiAdvantage: row['Main AI / data advantage'] || row['Main AI/data advantage'] || '',
        fundingAmount: row['Latest Funding Amount'] || '',
        fundingDate: row['Latest Funding Date'] || '',
        pricing: row['Pricing motion & segment'] || ''
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

    // First GPT call: Find relevant companies
    const searchPrompt = `You are an AI assistant that matches user requirements to relevant AI/SaaS companies.
Find the TOP 3 most relevant companies that can solve the user's problem.

User's context: ${subdomain ? `${subdomain} in ${domain}` : domain || 'General business'}
User's requirement: "${requirement}"

Available companies (${companies.length} total):
${companySummaries}

Return ONLY a JSON array of indices: [0, 2, 5]`;

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
    const explanationPrompt = `You are a friendly business advisor helping someone find the right AI tool for their needs.
Write in VERY SIMPLE language - like explaining to a friend who isn't technical.

The user needs help with: "${requirement}"
Context: ${subdomain ? `${subdomain} in ${domain}` : domain || 'their business'}

Here are the best solutions I found:

${matchedCompanies.map((c, i) => `
Tool ${i + 1}: ${c.name}
- Problem they solve: ${c.problem || 'General business automation'}
- What they do: ${c.description || 'AI-powered solution'}
- What makes them special: ${c.differentiator || 'Unique approach'}
`).join('\n')}

Write a helpful response that:
1. Starts with a brief understanding of what the user is trying to solve (1 sentence)
2. For each tool, explain in simple words:
   - The tool name (bold it with **)
   - What problem it actually solves (in everyday language)
   - Why it might be a good fit for their specific need (be specific!)
3. Keep each tool explanation to 2-3 short sentences max
4. Use a warm, helpful tone - like a knowledgeable friend giving advice
5. End with an encouraging note

DO NOT use technical jargon. Imagine explaining to your grandmother.
DO NOT use bullet points - write in flowing sentences.
Keep the total response under 250 words.`;

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
