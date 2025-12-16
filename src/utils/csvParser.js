/**
 * Fetches company data from backend API (which fetches from Google Sheet)
 * @param {string} domain - Domain ID to fetch the correct sheet tab
 * @returns {Promise<Array>} Array of company objects
 */
export async function fetchCompaniesCSV(domain) {
  try {
    const url = domain
      ? `/api/companies?domain=${encodeURIComponent(domain)}`
      : '/api/companies';

    console.log('Fetching companies for domain:', domain);
    const response = await fetch(url);

    if (!response.ok) {
      console.error('Failed to fetch companies:', response.status);
      return [];
    }

    const data = await response.json();

    if (!data.success) {
      console.error('API error:', data.error);
      return [];
    }

    console.log('Fetched companies:', data.count, 'for domain:', domain);
    return data.companies || [];

  } catch (error) {
    console.error('Error fetching companies:', error);
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

  // Domain keyword mappings - expanded for better matching
  const domainKeywords = {
    'marketing': ['marketing', 'seo', 'content', 'ads', 'advertising', 'campaign', 'brand', 'email', 'outreach', 'lead gen', 'demand'],
    'sales-support': ['sales', 'crm', 'support', 'customer service', 'lead', 'conversion', 'sdr', 'outbound', 'inbound', 'ticket', 'helpdesk'],
    'social-media': ['social', 'instagram', 'linkedin', 'twitter', 'video', 'influencer', 'creator', 'content', 'scheduling', 'post', 'engagement'],
    'legal': ['legal', 'contract', 'compliance', 'law', 'litigation', 'attorney', 'lawyer', 'document', 'clause'],
    'hr-hiring': ['hr', 'hiring', 'recruit', 'talent', 'interview', 'onboarding', 'employee', 'candidate', 'resume', 'job'],
    'finance': ['finance', 'accounting', 'invoice', 'expense', 'budget', 'cfo', 'bookkeeping', 'payment', 'billing', 'tax'],
    'supply-chain': ['supply', 'logistics', 'inventory', 'shipping', 'procurement', 'warehouse', 'fulfillment', 'order', 'delivery'],
    'research': ['research', 'competitor', 'market', 'intelligence', 'insight', 'trend', 'analysis', 'monitor'],
    'data-analysis': ['data', 'analytics', 'dashboard', 'reporting', 'forecast', 'bi', 'visualization', 'metrics', 'kpi']
  };

  const keywords = domainKeywords[domain] || [domain?.toLowerCase()];
  const subdomainLower = subdomain?.toLowerCase() || '';

  const results = companies.filter(company => {
    const searchText = [
      company.problem,
      company.description,
      company.differentiator,
      company.aiAdvantage,
      company.name
    ].join(' ').toLowerCase();

    // Check domain match
    const domainMatch = keywords.some(kw => searchText.includes(kw));

    // Check subdomain match if provided
    if (subdomain && subdomain !== 'others') {
      const subdomainTerms = subdomainLower.split(/\s+/).filter(t => t.length > 2);
      const subdomainMatch = subdomainTerms.some(term => searchText.includes(term));
      return domainMatch || subdomainMatch; // Match either domain OR subdomain for broader results
    }

    return domainMatch;
  });

  return results;
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

  return limited.map((company, index) => {
    let output = `${index + 1}. **${company.name}**`;

    if (company.country) {
      output += ` (${company.country})`;
    }

    output += '\n';

    if (company.problem) {
      output += `   - Problem: ${company.problem}\n`;
    }

    if (company.description) {
      output += `   - What they do: ${company.description}\n`;
    }

    if (company.differentiator) {
      output += `   - Differentiator: ${company.differentiator}\n`;
    }

    if (company.fundingAmount) {
      output += `   - Funding: ${company.fundingAmount}`;
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

  // Return random sample
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
