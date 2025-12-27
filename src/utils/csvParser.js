import Papa from 'papaparse';

/**
 * Fetches and parses the AI SaaS companies CSV file
 * @returns {Promise<Array>} Array of company objects
 */
export async function fetchCompaniesCSV() {
  try {
    // Try different possible filenames
    const possiblePaths = [
      '/AI SaaS Biz - Research .csv',
      '/AI SaaS Biz - Research.csv',
      '/ai-saas-biz.csv',
      '/AI-SaaS-Biz-Research.csv'
    ];

    let csvText = null;
    let successPath = null;

    for (const path of possiblePaths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          csvText = await response.text();
          successPath = path;
          console.log(`✅ CSV loaded from: ${path}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!csvText) {
      console.warn('❌ CSV file not found at any expected path');
      return [];
    }

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          console.log(`📊 Total companies loaded: ${results.data.length}`);
          console.log('📋 Sample row:', results.data[0]);
          console.log('🔑 CSV Headers:', Object.keys(results.data[0] || {}));
          resolve(results.data);
        },
        error: (error) => {
          console.error('CSV parsing error:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching CSV:', error);
    return [];
  }
}

/**
 * Filters companies by domain and subdomain
 * @param {Array} companies - Array of all companies
 * @param {string} domain - Selected domain (e.g., 'marketing', 'sales-support')
 * @param {string} subdomain - Selected subdomain (optional)
 * @returns {Array} Filtered companies
 */
export function filterCompaniesByDomain(companies, domain, subdomain) {
  if (!companies || companies.length === 0) {
    console.warn('⚠️ No companies data to filter');
    return [];
  }

  console.log(`🔍 Filtering for domain: "${domain}", subdomain: "${subdomain}"`);
  console.log(`📦 Total companies before filter: ${companies.length}`);

  // Map domain IDs to expected sheet/category names
  const domainMap = {
    'marketing': ['marketing', 'mktg'],
    'sales-support': ['sales and customer support', 'sales', 'customer support', 'crm'],
    'social-media': ['social media', 'social'],
    'legal': ['legal', 'law'],
    'hr-hiring': ['hr and talent hiring', 'hr', 'human resources', 'talent', 'hiring', 'recruitment'],
    'finance': ['finance', 'financial', 'fintech'],
    'supply-chain': ['supply chain', 'logistics', 'procurement'],
    'research': ['research', 'r&d'],
    'data-analysis': ['data analysis', 'analytics', 'business intelligence', 'bi']
  };

  // Get possible domain names
  const possibleDomainNames = domainMap[domain?.toLowerCase()] || [domain?.toLowerCase().replace(/-/g, ' ')];
  const normalizedSubdomain = subdomain?.toLowerCase().trim();

  console.log(`🎯 Looking for domain names: ${possibleDomainNames.join(', ')}`);

  const filtered = companies.filter(company => {
    // Get all possible domain field names
    const companyDomain = (
      company.Domain ||
      company.domain ||
      company.Category ||
      company.category ||
      company.Industry ||
      company.industry ||
      company['Focus Area'] ||
      company['Sheet'] ||
      company['Tab'] ||
      ''
    ).toLowerCase().trim();

    const companySubdomain = (
      company.Subdomain ||
      company.subdomain ||
      company.Subcategory ||
      company.subcategory ||
      company['Sub-domain'] ||
      company['Use Case'] ||
      ''
    ).toLowerCase().trim();

    // Check if company domain matches any of the possible domain names
    const domainMatch = possibleDomainNames.some(domainName =>
      companyDomain === domainName ||
      companyDomain.includes(domainName) ||
      domainName.includes(companyDomain)
    );

    if (!domainMatch) {
      return false;
    }

    // If subdomain provided, match it too
    if (subdomain && companySubdomain) {
      const subdomainMatch =
        companySubdomain.includes(normalizedSubdomain) ||
        normalizedSubdomain.includes(companySubdomain);

      if (subdomainMatch) {
        console.log(`✅ Match found: ${company.Name || company.Company} (Domain: ${companyDomain}, Subdomain: ${companySubdomain})`);
      }

      return subdomainMatch;
    }

    console.log(`✅ Match found: ${company.Name || company.Company} (Domain: ${companyDomain})`);
    return true;
  });

  console.log(`📊 Filtered results: ${filtered.length} companies`);

  return filtered;
}

/**
 * Formats company data for display in market analysis
 * @param {Array} companies - Filtered companies
 * @param {number} limit - Maximum number of companies to display
 * @returns {string} Formatted markdown string
 */
export function formatCompaniesForDisplay(companies, limit = 5) {
  if (!companies || companies.length === 0) {
    return '- No specific tools identified in our database yet';
  }

  const limitedCompanies = companies.slice(0, limit);

  return limitedCompanies.map((company, index) => {
    const name = company.Name || company.name || company.Company || company.company || 'Unknown';
    const problem = company.Problem || company.problem || '';
    const solution = company['What they do'] || company.Solution || company.solution || '';
    const differentiator = company.Differentiator || company.differentiator || company['Key Feature'] || '';
    const funding = company.Funding || company.funding || '';
    const url = company.URL || company.url || company.Website || company.website || '';
    const country = company.Country || company.country || company.Location || '';

    let formatted = `**${name}**`;

    if (country) {
      formatted += ` (${country})`;
    }

    formatted += '\n\n';

    if (problem) {
      formatted += `- **Problem:** ${problem}\n`;
    }

    if (solution) {
      formatted += `- **What they do:** ${solution}\n`;
    }

    if (differentiator) {
      formatted += `- **Differentiator:** ${differentiator}\n`;
    }

    if (funding) {
      formatted += `- **Funding:** ${funding}\n`;
    }

    if (url) {
      formatted += `- **Website:** [Visit](${url})\n`;
    }

    return formatted;
  }).join('\n');
}

/**
 * Analyzes market gaps based on user requirement and existing companies
 * @param {string} requirement - User's stated requirement
 * @param {Array} companies - Existing companies in the space
 * @returns {string} Gap analysis text
 */
export function analyzeMarketGaps(requirement, companies) {
  const hasCompetition = companies && companies.length > 0;

  if (!hasCompetition) {
    return `- This appears to be an underserved market segment
- First-mover advantage opportunity
- High potential for innovation`;
  }

  if (companies.length <= 2) {
    return `- Limited competition (${companies.length} solution${companies.length > 1 ? 's' : ''} found)
- Room for differentiation and improvement
- Opportunity to address unmet needs`;
  }

  return `- Competitive market with ${companies.length}+ existing solutions
- Focus on unique value proposition
- Consider niche specialization or innovative features
- Better user experience and pricing could be differentiators`;
}
