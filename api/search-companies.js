// Vercel Serverless Function for GPT-powered company search
import Papa from 'papaparse';

const SHEET_ID = '1JKx3RwPbUL2-r5l8ayDUQfKU3kiIEg-FkFym3yJCNiw';

// Map domain IDs to actual sheet tab names in Google Sheets
const DOMAIN_TO_SHEET = {
  'marketing': 'Marketing',
  'sales-support': 'sales and support',
  'social-media': 'Social media',
  'legal': 'Legal',
  'hr-hiring': 'HR',
  'finance': 'Finance',
  'supply-chain': 'Supply chain',
  'research': 'Research',
  'data-analysis': 'Data'
};

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

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    // Get sheet name for this domain
    const sheetName = DOMAIN_TO_SHEET[domain] || 'Social media';

    // URL to fetch specific sheet by name
    const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

    console.log('Fetching sheet:', sheetName, 'for domain:', domain);

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
        message: 'No companies found in this domain',
        debug: {
          requestedDomain: domain,
          sheetName: sheetName,
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

    const systemPrompt = `You are an AI assistant that matches user requirements to relevant companies.
Given a user's requirement and a list of companies, identify the TOP 5 most relevant companies.

IMPORTANT:
- Only return company indices that exist in the list
- Return indices as a JSON array of numbers
- Consider semantic similarity, not just keyword matching
- A company is relevant if it solves a similar problem, targets similar users, or offers similar capabilities

User is looking for solutions in: ${subdomain || domain}
User's requirement: "${requirement}"

Available companies:
${companySummaries}

Respond with ONLY a JSON object in this format:
{"indices": [0, 2, 5], "reasoning": "Brief explanation of why these match"}`;

    console.log('Calling GPT for intelligent search...');

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Find the most relevant companies for: "${requirement}"` }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!gptResponse.ok) {
      console.error('GPT API error:', gptResponse.status);
      // Fallback to returning first few companies
      return res.status(200).json({
        success: true,
        companies: companies.slice(0, 5),
        totalCount: companies.length,
        searchMethod: 'fallback'
      });
    }

    const gptData = await gptResponse.json();
    const gptMessage = gptData.choices[0]?.message?.content || '';

    console.log('GPT response:', gptMessage);

    // Parse GPT response
    let matchedIndices = [];
    let reasoning = '';

    try {
      // Try to extract JSON from the response
      const jsonMatch = gptMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        matchedIndices = parsed.indices || [];
        reasoning = parsed.reasoning || '';
      }
    } catch (parseError) {
      console.error('Error parsing GPT response:', parseError);
      // Try to extract just numbers
      const numbers = gptMessage.match(/\d+/g);
      if (numbers) {
        matchedIndices = numbers.map(n => parseInt(n)).filter(n => n < companies.length);
      }
    }

    // Get matched companies
    const matchedCompanies = matchedIndices
      .filter(i => i >= 0 && i < companies.length)
      .map(i => companies[i]);

    // If GPT didn't return good matches, fall back to all companies
    if (matchedCompanies.length === 0) {
      return res.status(200).json({
        success: true,
        companies: companies.slice(0, 5),
        totalCount: companies.length,
        searchMethod: 'fallback',
        reasoning: 'No specific matches found, showing top companies'
      });
    }

    return res.status(200).json({
      success: true,
      companies: matchedCompanies,
      totalCount: companies.length,
      searchMethod: 'ai',
      reasoning: reasoning,
      debug: {
        requestedDomain: domain,
        sheetName: sheetName,
        firstCompanyInSheet: companies[0]?.name
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
