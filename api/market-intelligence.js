// Vercel Serverless Function for Market Intelligence
import { EnhancedMarketOrchestrator, isEnabled } from '../modules/market_intelligence_entity/index.js';
import { OPENROUTER_API_KEY } from '../modules/market_intelligence_entity/config/api_keys.js';

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
    const { service, location, year, websiteUrl } = req.body;

    if (!service && !websiteUrl) {
      return res.status(400).json({ error: 'Service/query or websiteUrl is required' });
    }

    // Check if feature is enabled
    if (!isEnabled()) {
      return res.status(503).json({
        error: 'Feature disabled',
        message: 'Market Intelligence feature is currently disabled. Enable it in feature_flag.js'
      });
    }

    // Check for API key
    const apiKey = OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Configuration error',
        message: 'OpenRouter API key not configured'
      });
    }

    // Create ENHANCED orchestrator with API key and execute
    const orchestrator = new EnhancedMarketOrchestrator(apiKey);
    
    const executionResults = await orchestrator.execute({
      websiteUrl: websiteUrl || null,
      textContent: service ? `Business providing: ${service.trim()}` : '',
      seedKeywords: service ? [service.trim()] : [],
      location: location || 'India',
      year: year || new Date().getFullYear()
    });

    return res.status(200).json({
      success: true,
      data: executionResults
    });
    
  } catch (error) {
    console.error('Market Intelligence API Error:', error);
    return res.status(500).json({
      error: 'Analysis failed',
      message: error.message || 'An error occurred during market analysis'
    });
  }
}
