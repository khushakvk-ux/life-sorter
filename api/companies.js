// Vercel Serverless Function to fetch companies from Google Sheet
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get domain from query parameter
    const { domain } = req.query;

    // Get sheet name for this domain
    const sheetName = DOMAIN_TO_SHEET[domain] || 'Social Media'; // Default to Social Media

    // URL to fetch specific sheet by name
    const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;

    console.log('Fetching sheet:', sheetName, 'for domain:', domain);
    console.log('URL:', SHEET_CSV_URL);

    const response = await fetch(SHEET_CSV_URL);

    if (!response.ok) {
      console.error('Failed to fetch sheet:', response.status, response.statusText);
      return res.status(500).json({
        error: 'Failed to fetch Google Sheet',
        status: response.status,
        message: 'Make sure the sheet is publicly accessible (anyone with link can view)'
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

    if (parsed.errors.length > 0) {
      console.error('CSV parsing errors:', parsed.errors);
    }

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
      .filter(c => c.name && c.name.trim()); // Filter out empty rows

    console.log('Parsed companies:', companies.length);

    return res.status(200).json({
      success: true,
      count: companies.length,
      companies: companies
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
