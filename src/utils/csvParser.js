import Papa from 'papaparse';

// Google Sheet ID from the provided link
const SHEET_ID = '1JKx3RwPbUL2-r5l8ayDUQfKU3kiIEg-FkFym3yJCNiw';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

/**
 * Fetches and parses company data from Google Sheet
 * @returns {Promise<Array>} Array of company objects
 */
export async function fetchCompaniesCSV() {
  try {
    const response = await fetch(SHEET_CSV_URL);

    if (!response.ok) {
      console.warn('Failed to fetch Google Sheet, status:', response.status);
      return [];
    }

    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          // Normalize column names for easier access
          const normalized = results.data.map(row => ({
            name: row['Startup name'] || '',
            country: row['Country'] || '',
            problem: row['Basic problem'] || '',
            differentiator: row['Differentiator'] || '',
            description: row['Core product description (<=3 lines)'] || '',
            aiAdvantage: row['Main AI / data advantage'] || '',
            fundingAmount: row['Latest Funding Amount'] || '',
            fundingDate: row['Latest Funding Date'] || '',
            pricing: row['Pricing motion & segment'] || '',
            // Keep original row for any additional columns
            _raw: row
          }));
          resolve(normalized);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching Google Sheet:', error);
    return [];
  }
}

/**
 * Searches companies by keywords across all relevant fields
 * @param {Array} companies - Array of all companies
 * @param {string} query - Search query
 * @returns {Array} Matching companies sorted by relevance
 */
export function searchCompanies(companies, query) {
  if (!companies || companies.length === 0 || !query) {
    return [];
  }

  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  return companies
    .map(company => {
      let score = 0;
      const searchableText = [
        company.name,
        company.problem,
        company.description,
        company.differentiator,
        company.aiAdvantage,
        company.pricing
      ].join(' ').toLowerCase();

      terms.forEach(term => {
        if (company.name?.toLowerCase().includes(term)) score += 10;
        if (company.problem?.toLowerCase().includes(term)) score += 5;
        if (company.description?.toLowerCase().includes(term)) score += 3;
        if (company.differentiator?.toLowerCase().includes(term)) score += 3;
        if (searchableText.includes(term)) score += 1;
      });

      return { ...company, _score: score };
    })
    .filter(c => c._score > 0)
    .sort((a, b) => b._score - a._score);
}

/**
 * Filters companies by domain and subdomain keywords
 * @param {Array} companies - Array of all companies
 * @param {string} domain - Selected domain
 * @param {string} subdomain - Selected subdomain
 * @returns {Array} Filtered companies
 */
export function filterCompaniesByDomain(companies, domain, subdomain) {
  if (!companies || companies.length === 0) {
    return [];
  }

  // Domain keyword mappings
  const domainKeywords = {
    'marketing': ['marketing', 'seo', 'content', 'ads', 'advertising', 'campaign', 'brand'],
    'sales-support': ['sales', 'crm', 'support', 'customer service', 'lead', 'conversion'],
    'social-media': ['social', 'instagram', 'linkedin', 'twitter', 'video', 'influencer'],
    'legal': ['legal', 'contract', 'compliance', 'law', 'litigation', 'attorney'],
    'hr-hiring': ['hr', 'hiring', 'recruit', 'talent', 'interview', 'onboarding', 'employee'],
    'finance': ['finance', 'accounting', 'invoice', 'expense', 'budget', 'cfo', 'bookkeeping'],
    'supply-chain': ['supply', 'logistics', 'inventory', 'shipping', 'procurement', 'warehouse'],
    'research': ['research', 'competitor', 'market', 'analysis', 'intelligence', 'insight'],
    'data-analysis': ['data', 'analytics', 'dashboard', 'reporting', 'forecast', 'bi']
  };

  const keywords = domainKeywords[domain] || [domain?.toLowerCase()];
  const subdomainLower = subdomain?.toLowerCase() || '';

  return companies.filter(company => {
    const searchText = [
      company.problem,
      company.description,
      company.differentiator,
      company.aiAdvantage
    ].join(' ').toLowerCase();

    // Check domain match
    const domainMatch = keywords.some(kw => searchText.includes(kw));

    // Check subdomain match if provided
    if (subdomain && subdomain !== 'others') {
      const subdomainTerms = subdomainLower.split(/\s+/).filter(t => t.length > 2);
      const subdomainMatch = subdomainTerms.some(term => searchText.includes(term));
      return domainMatch && subdomainMatch;
    }

    return domainMatch;
  });
}

/**
 * Formats company data for chat display
 * @param {Array} companies - Filtered companies
 * @param {number} limit - Maximum number to display
 * @returns {string} Formatted markdown string
 */
export function formatCompaniesForDisplay(companies, limit = 5) {
  if (!companies || companies.length === 0) {
    return '- No exact matches found in our database';
  }

  const limited = companies.slice(0, limit);

  return limited.map(company => {
    let output = `**${company.name}**`;

    if (company.country) {
      output += ` (${company.country})`;
    }

    output += '\n';

    if (company.problem) {
      output += `  Problem: ${company.problem}\n`;
    }

    if (company.description) {
      output += `  What they do: ${company.description}\n`;
    }

    if (company.differentiator) {
      output += `  Differentiator: ${company.differentiator}\n`;
    }

    if (company.fundingAmount) {
      output += `  Funding: ${company.fundingAmount}`;
      if (company.fundingDate) {
        output += ` (${company.fundingDate})`;
      }
      output += '\n';
    }

    return output;
  }).join('\n');
}

/**
 * Gets closest alternatives when no exact match found
 * @param {Array} companies - All companies
 * @param {string} domain - Selected domain
 * @returns {Array} Alternative companies
 */
export function getAlternatives(companies, domain) {
  if (!companies || companies.length === 0) {
    return [];
  }

  // Return random sample from related domains or all if no domain
  const shuffled = [...companies].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
}

/**
 * Analyzes market gaps based on requirement and existing companies
 * @param {string} requirement - User's stated requirement
 * @param {Array} companies - Existing companies in the space
 * @returns {string} Gap analysis text
 */
export function analyzeMarketGaps(requirement, companies) {
  const count = companies?.length || 0;

  if (count === 0) {
    return `- This appears to be an underserved market
- First-mover advantage opportunity
- High potential for a tailored solution`;
  }

  if (count <= 2) {
    return `- Limited competition (${count} solution${count > 1 ? 's' : ''} found)
- Room for differentiation
- Opportunity to address gaps in existing offerings`;
  }

  if (count <= 5) {
    return `- Moderate competition (${count} solutions found)
- Focus on unique value proposition
- Consider niche specialization`;
  }

  return `- Competitive market with ${count}+ solutions
- Differentiation is key
- Focus on better UX, pricing, or specific use cases`;
}
