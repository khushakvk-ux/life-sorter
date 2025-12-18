// Vercel Serverless Function for efficient priority-based company search
import Papa from 'papaparse';

// Consolidated sheet with all companies
const SHEET_ID = '1d6nrGP4yRbx_ddzClAheicsavF2OsmINJmMDIQIL4m0';

// URL to fetch the consolidated sheet (first/default tab)
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

// Known domain labels (for row type detection)
const DOMAIN_LABELS = ['LEGAL', 'MARKETING', 'SALES', 'HR', 'FINANCE', 'SUPPLY CHAIN', 'RESEARCH', 'DATA', 'SOCIAL MEDIA', 'CUSTOMER SUPPORT'];

// Priority column names (for matching - highest weight)
const PRIORITY_COLUMNS = {
  name: ['Startup name', 'Startup Name', 'Company', 'Name', 'Company Name'],
  country: ['Country', 'Location', 'Region'],
  problem: ['Basic problem', 'Basic Problem', 'Problem', 'Problem Statement', 'What they solve'],
  description: ['Core product description (<=3 lines)', 'Core product description', 'Description', 'Product Description', 'What they do'],
  productDescription: ['Product description', 'Product Description', 'Full Description']
};

// Secondary columns (only for tie-breakers)
const SECONDARY_COLUMNS = {
  differentiator: ['Differentiator', 'Unique Value', 'USP', 'What makes them special'],
  aiAdvantage: ['Main AI / data advantage', 'Main AI/data advantage', 'AI Advantage', 'Tech Advantage'],
  fundingAmount: ['Latest Funding Amount', 'Funding', 'Funding Amount'],
  fundingDate: ['Latest Funding Date', 'Funding Date'],
  pricing: ['Pricing motion & segment', 'Pricing', 'Price', 'Pricing Model']
};

// Column header indicators
const HEADER_INDICATORS = ['startup name', 'company', 'country', 'basic problem', 'core product', 'description', 'differentiator'];

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

    console.log('Priority search for domain:', domain, 'subdomain:', subdomain);
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

    // Parse CSV without headers first (to detect row types)
    const parsed = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true
    });

    const rawRows = parsed.data;
    console.log('Total raw rows:', rawRows.length);

    // Helper function to detect row type
    const detectRowType = (row, rowIndex) => {
      if (!row || row.length === 0) return 'empty';

      const firstCell = (row[0] || '').toString().trim().toUpperCase();
      const nonEmptyCells = row.filter(cell => cell && cell.toString().trim()).length;

      // Check if it's a domain header (single label like "LEGAL", most cells empty)
      if (nonEmptyCells <= 2) {
        const isDomainLabel = DOMAIN_LABELS.some(d =>
          firstCell === d || firstCell.includes(d) || d.includes(firstCell)
        );
        if (isDomainLabel) return 'domain-header';
      }

      // Check if it's a column header row
      const lowerRow = row.map(c => (c || '').toString().toLowerCase());
      const headerMatches = HEADER_INDICATORS.filter(h =>
        lowerRow.some(cell => cell.includes(h))
      ).length;
      if (headerMatches >= 3) return 'column-header';

      // Check if it's a startup record (has name and at least 2 priority fields filled)
      const hasName = firstCell && firstCell.length > 1 && !DOMAIN_LABELS.some(d => firstCell === d);
      const filledPriorityCells = row.slice(0, 5).filter(cell => cell && cell.toString().trim().length > 3).length;
      if (hasName && filledPriorityCells >= 2) return 'startup-record';

      return 'unknown';
    };

    // Helper function to get column value with flexible matching
    const getColumnValue = (row, headers, possibleNames) => {
      for (const name of possibleNames) {
        const idx = headers.findIndex(h => {
          const hLower = (h || '').toLowerCase();
          const nLower = name.toLowerCase();
          return hLower === nLower || hLower.includes(nLower.split(' ')[0]);
        });
        if (idx !== -1 && row[idx]) {
          return row[idx].toString().trim();
        }
      }
      return '';
    };

    // Process rows and detect domains
    let currentDomain = 'General';
    let currentHeaders = [];
    const startups = [];

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowType = detectRowType(row, i);

      if (rowType === 'domain-header') {
        currentDomain = (row[0] || 'General').toString().trim();
        console.log(`Found domain: ${currentDomain} at row ${i + 1}`);
      } else if (rowType === 'column-header') {
        currentHeaders = row.map(h => (h || '').toString().trim());
        console.log(`Found headers at row ${i + 1}:`, currentHeaders.slice(0, 5));
      } else if (rowType === 'startup-record' && currentHeaders.length > 0) {
        // Extract priority fields
        const name = getColumnValue(row, currentHeaders, PRIORITY_COLUMNS.name);
        const country = getColumnValue(row, currentHeaders, PRIORITY_COLUMNS.country);
        const problem = getColumnValue(row, currentHeaders, PRIORITY_COLUMNS.problem);
        const description = getColumnValue(row, currentHeaders, PRIORITY_COLUMNS.description);
        const productDescription = getColumnValue(row, currentHeaders, PRIORITY_COLUMNS.productDescription);

        // Extract secondary fields (for tie-breakers only)
        const differentiator = getColumnValue(row, currentHeaders, SECONDARY_COLUMNS.differentiator);
        const aiAdvantage = getColumnValue(row, currentHeaders, SECONDARY_COLUMNS.aiAdvantage);
        const pricing = getColumnValue(row, currentHeaders, SECONDARY_COLUMNS.pricing);

        if (name && name.length > 1) {
          // Build priority text blob (used for almost all matching)
          const priorityText = [name, country, problem, description, productDescription]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          // Build secondary text blob (only for tie-break)
          const secondaryText = [differentiator, aiAdvantage, pricing]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          startups.push({
            name,
            country,
            problem,
            description: description || productDescription,
            differentiator,
            aiAdvantage,
            pricing,
            domain: currentDomain,
            rowNumber: i + 1,
            priorityText,
            secondaryText
          });
        }
      }
    }

    console.log('Parsed startups:', startups.length);

    // If no startups found, return empty
    if (startups.length === 0) {
      return res.status(200).json({
        success: true,
        companies: [],
        message: 'No startups found in the database',
        debug: {
          requestedDomain: domain,
          csvLength: csvText.length,
          rawRowCount: rawRows.length
        }
      });
    }

    // If no requirement provided, return startups from matching domain
    if (!requirement) {
      const domainMatches = domain
        ? startups.filter(s => s.domain.toLowerCase().includes(domain.toLowerCase()))
        : startups;
      return res.status(200).json({
        success: true,
        companies: domainMatches.slice(0, 10),
        totalCount: startups.length
      });
    }

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

    // Use GPT for intelligent priority-based search
    const apiKey = process.env.OPENAI_API_KEY;
    const modelName = process.env.OPENAI_MODEL_NAME || 'gpt-4o-mini';

    if (!apiKey) {
      console.error('OpenAI API key not configured');
      // Fallback to basic keyword matching on priority text
      const requirementLower = requirement.toLowerCase();
      const keywords = requirementLower.split(/\s+/).filter(w => w.length > 3);

      const scored = startups.map(s => {
        let score = 0;
        keywords.forEach(kw => {
          if (s.priorityText.includes(kw)) score += 2;
        });
        if (domain && s.domain.toLowerCase().includes(domain.toLowerCase())) score += 1;
        return { ...s, score };
      });

      scored.sort((a, b) => b.score - a.score);

      return res.status(200).json({
        success: true,
        companies: scored.slice(0, 3),
        totalCount: startups.length,
        searchMethod: 'keyword-fallback'
      });
    }

    // Create compact summary using ONLY priority fields
    const startupSummaries = startups.map((s, i) =>
      `[${i}] ${s.name} (${s.country || 'Global'}) [Domain: ${s.domain}] [Row: ${s.rowNumber}]
Problem: ${s.problem || 'N/A'}
Description: ${s.description || 'N/A'}`
    ).join('\n\n');

    // GPT prompt for priority-based search with scoring
    const searchPrompt = `You are an AI search assistant that matches user requirements to startups.

PRIORITY SEARCH RULES:
1. Search ONLY using these fields (in order of importance):
   - Basic problem (weight: +4 for direct match)
   - Core product/description (weight: +3 for direct match)
   - Startup name (weight: +1 if obviously indicates category)
   - Country (weight: +1 if user specified preference)
   - Domain (weight: +1 if matches user's domain)

2. SCORING:
   - Score 8-10: Excellent match (problem directly addresses user need)
   - Score 6-7: Good match (description relates to user need)
   - Score 4-5: Partial match (some keyword overlap)
   - Score 0-3: Weak match

3. ALWAYS find TOP 3 matches - there is always a best fit.

${userProfile}

User's domain context: ${subdomain ? `${subdomain} in ${domain}` : domain || 'General business'}
User's requirement: "${requirement}"

Available startups (${startups.length} total):
${startupSummaries}

Return EXACTLY this JSON format:
{
  "topMatches": [
    {"index": 0, "score": 9, "matchReason": "Two bullet points explaining why"},
    {"index": 2, "score": 7, "matchReason": "Two bullet points explaining why"},
    {"index": 5, "score": 6, "matchReason": "Two bullet points explaining why"}
  ],
  "alternatives": [{"index": 8, "score": 5}, {"index": 12, "score": 4}]
}`;

    console.log('Calling GPT for priority-based search...');

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
          { role: 'user', content: `Find the best startups for: "${requirement}"` }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    });

    if (!searchResponse.ok) {
      console.error('GPT API error:', searchResponse.status);
      return res.status(200).json({
        success: true,
        companies: startups.slice(0, 3),
        totalCount: startups.length,
        searchMethod: 'fallback'
      });
    }

    const searchData = await searchResponse.json();
    const searchMessage = searchData.choices[0]?.message?.content || '';

    // Parse GPT response
    let matchedResults = { topMatches: [], alternatives: [] };
    try {
      // Extract JSON from response
      const jsonMatch = searchMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        matchedResults = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse GPT response:', e);
      // Fallback: extract any numbers
      const numbers = searchMessage.match(/\d+/g);
      if (numbers) {
        matchedResults.topMatches = numbers.slice(0, 3).map((n, i) => ({
          index: parseInt(n),
          score: 7 - i,
          matchReason: 'Matches your requirements'
        }));
      }
    }

    // Get matched companies with enriched data
    const topMatches = (matchedResults.topMatches || [])
      .filter(m => m.index >= 0 && m.index < startups.length)
      .slice(0, 3)
      .map(m => ({
        ...startups[m.index],
        matchScore: m.score,
        matchReason: m.matchReason
      }));

    const alternatives = (matchedResults.alternatives || [])
      .filter(m => m.index >= 0 && m.index < startups.length)
      .slice(0, 4)
      .map(m => ({
        ...startups[m.index],
        matchScore: m.score
      }));

    // If no matches found, fallback to first 3
    if (topMatches.length === 0) {
      topMatches.push(...startups.slice(0, 3).map((s, i) => ({
        ...s,
        matchScore: 5 - i,
        matchReason: 'Closest available match'
      })));
    }

    // Generate helpful explanation
    const explanationPrompt = `You are a friendly business advisor helping someone find AI tools.
Write in VERY SIMPLE language - like explaining to a friend.

${userProfile}

User needs: "${requirement}"
Context: ${subdomain ? `${subdomain} in ${domain}` : domain || 'their business'}

TOP MATCHES FOUND:
${topMatches.map((c, i) => `
**${i + 1}. ${c.name}** (${c.country || 'Global'}) [Score: ${c.matchScore}/10]
- Problem solved: ${c.problem || 'Business automation'}
- What they do: ${c.description || 'AI solution'}
- Why it matches: ${c.matchReason || 'Relevant to your need'}
- Row #${c.rowNumber}
`).join('\n')}

Write a helpful response:
1. Start with "Based on what you're looking for..." (1 sentence)
2. For each tool, explain in 2-3 simple sentences:
   - What it does
   - How it helps with their specific need
3. End with encouragement

RULES:
- NEVER say "no matches" or "not perfect"
- Be positive and show how each tool helps
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
          { role: 'user', content: `Explain these tools for: "${requirement}"` }
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
      companies: topMatches,
      alternatives: alternatives,
      totalCount: startups.length,
      searchMethod: 'priority-ai',
      helpfulResponse: helpfulExplanation,
      userRequirement: requirement,
      debug: {
        requestedDomain: domain,
        subdomain: subdomain,
        totalStartupsSearched: startups.length,
        domainsFound: [...new Set(startups.map(s => s.domain))]
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
