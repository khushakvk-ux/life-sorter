/**
 * MARKET INTELLIGENCE - DEMO RUNNER
 * ==================================
 * 
 * Quick demo script to test the 4-phase market intelligence pipeline.
 * 
 * Usage:
 *   node modules/market_intelligence_entity/demo.js
 * 
 * Or with a specific URL:
 *   node modules/market_intelligence_entity/demo.js https://example.com
 */

import { EnhancedMarketOrchestrator, isEnabled, getStatus } from './index.js';
import { getOpenRouterKey } from './config/api_keys.js';

async function runDemo() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   MARKET INTELLIGENCE ENTITY - DEMO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  // Check feature status
  const status = getStatus();
  console.log('Feature Status:', JSON.stringify(status, null, 2));
  console.log('');

  if (!isEnabled()) {
    console.log('❌ Market Intelligence Entity is DISABLED');
    console.log('   Enable it in feature_flag.js by setting ENABLED: true');
    return;
  }

  // Get API key
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    console.log('❌ OpenRouter API key not configured');
    console.log('   Set it in config/api_keys.js or as OPENROUTER_API_KEY env var');
    return;
  }

  console.log('✓ API Key configured (starts with:', apiKey.substring(0, 15) + '...)');
  console.log('');

  // Get target URL from command line or use default
  const targetUrl = process.argv[2] || 'https://example.com';
  
  console.log('Target URL:', targetUrl);
  console.log('');
  console.log('Starting 4-phase analysis...');
  console.log('───────────────────────────────────────────────────────────');

  // Initialize orchestrator
  const orchestrator = new EnhancedMarketOrchestrator(apiKey);

  // Sample input - in production, you would scrape the website first
  const input = {
    websiteUrl: targetUrl,
    textContent: `
      Welcome to Example Corp - Your AI-Powered Business Solutions Partner
      
      We provide cutting-edge AI SaaS solutions for modern businesses.
      
      Our Services:
      - AI Analytics Platform
      - Automated Workflow Solutions  
      - Business Intelligence Dashboard
      - Custom AI Model Development
      
      Trusted by 500+ companies worldwide.
      
      "Example Corp transformed our operations" - John Smith, CEO of TechStart
      "Best investment we made this year" - Sarah Johnson, CTO of DataFlow
      
      Get Started Today - Book a Free Demo
      Contact: hello@example.com | +1-555-0123
    `,
    seedKeywords: ['AI SaaS', 'business automation', 'AI analytics'],
  };

  try {
    // Run the full pipeline
    const report = await orchestrator.execute(input);

    if (report) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('   REPORT GENERATED SUCCESSFULLY');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      console.log('Report ID:', report.report_id);
      console.log('Overall Confidence:', (report.overall_confidence * 100).toFixed(1) + '%');
      console.log('');
      console.log('Phase Confidences:');
      console.log('  - Phase 1 (Website Extraction):', (report.phase_confidences?.phase1_website_extraction * 100 || 0).toFixed(1) + '%');
      console.log('  - Phase 2 (External Presence):', (report.phase_confidences?.phase2_external_presence * 100 || 0).toFixed(1) + '%');
      console.log('  - Phase 3 (Marketing & CTA):', (report.phase_confidences?.phase3_marketing_conversion * 100 || 0).toFixed(1) + '%');
      console.log('  - Phase 4 (Competitor Analysis):', (report.phase_confidences?.phase4_competitor_analysis * 100 || 0).toFixed(1) + '%');
      console.log('');
      console.log('Summary:', JSON.stringify(report.summary, null, 2));
      console.log('');
      console.log('───────────────────────────────────────────────────────────');
      console.log('MARKDOWN REPORT:');
      console.log('───────────────────────────────────────────────────────────');
      console.log(report.report_markdown);
      console.log('');
      console.log('───────────────────────────────────────────────────────────');
      console.log('✓ Full report saved to outputs/ folder');
    } else {
      console.log('');
      console.log('❌ Report generation failed or was disabled');
    }

  } catch (error) {
    console.error('');
    console.error('❌ Error during execution:', error.message);
    console.error(error.stack);
  }
}

// Run the demo
runDemo().catch(console.error);
