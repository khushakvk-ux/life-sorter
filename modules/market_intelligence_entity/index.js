/**
 * MARKET INTELLIGENCE ENTITY - MAIN ENTRY POINT
 * ==============================================
 * 
 * This is the public API for the Market Intelligence Entity.
 * Import from here for clean access to all entity functionality.
 * 
 * USAGE (Enhanced - 4 Phase Pipeline):
 * ```javascript
 * import { EnhancedMarketOrchestrator, isEnabled } from './modules/market_intelligence_entity';
 * 
 * if (isEnabled()) {
 *   const orchestrator = new EnhancedMarketOrchestrator('your-openrouter-api-key');
 *   const report = await orchestrator.execute({
 *     websiteUrl: 'https://example.com',
 *     textContent: 'Website text content...',
 *     seedKeywords: ['AI SaaS', 'automation']
 *   });
 * }
 * ```
 * 
 * PHASES:
 * 1. Website Extraction - Business identity, offerings, proof assets
 * 2. External Presence - Social profiles, GBP, sentiment analysis  
 * 3. Marketing & Conversion - CTAs, engagement paths, sales process
 * 4. Competitor Analysis - Top 3 competitors with quick facts
 * 
 * FINAL OUTPUT: Consolidated Market Intelligence Report
 * 
 * LLM SELECTION PER PHASE:
 * - Phase 1: Claude Sonnet 4 (structured extraction)
 * - Phase 2: Claude Sonnet 4 (sentiment & theme analysis)
 * - Phase 3: GPT-4.1 (marketing & CTA analysis)
 * - Phase 4: GPT-4.1 (competitive intelligence)
 * - Report: Claude Sonnet 4 (narrative synthesis)
 * 
 * ISOLATION GUARANTEES:
 * - This module has ZERO dependencies on the core application
 * - Can be deleted without breaking the app
 * - All functionality controlled by feature flag
 */

// ═══════════════════════════════════════════════════════════════════
// FEATURE FLAG EXPORTS
// ═══════════════════════════════════════════════════════════════════

export {
  FEATURE_FLAG,
  isEnabled,
  isSubFeatureEnabled,
  executeIfEnabled,
  executeIfEnabledSync,
  getStatus,
} from './feature_flag.js';

// ═══════════════════════════════════════════════════════════════════
// ORCHESTRATOR EXPORTS
// ═══════════════════════════════════════════════════════════════════

// Enhanced orchestrator (recommended - full 4-phase pipeline)
export { EnhancedMarketOrchestrator } from './orchestrator/enhanced_orchestrator.js';

// Legacy orchestrator (for backward compatibility)
export { MarketOrchestrator } from './orchestrator/market_orchestrator.js';

// ═══════════════════════════════════════════════════════════════════
// PHASE AGENT EXPORTS (for granular control)
// ═══════════════════════════════════════════════════════════════════

// Phase 1: Website Extraction
export { WebsiteExtractionAgent } from './ai_agents/phase1_website_extraction_agent.js';

// Phase 2: External Presence & Social Perception
export { ExternalPresenceAgent } from './ai_agents/phase2_external_presence_agent.js';

// Phase 3: Marketing, Reachout & Conversion
export { MarketingConversionAgent } from './ai_agents/phase3_marketing_conversion_agent.js';

// Phase 4: Competitor Identification & Quick-Facts
export { CompetitorAnalysisAgent } from './ai_agents/phase4_competitor_analysis_agent.js';

// Report Consolidation
export { ReportConsolidator } from './ai_agents/report_consolidator.js';

// ═══════════════════════════════════════════════════════════════════
// LEGACY AI AGENT EXPORTS (for backward compatibility)
// ═══════════════════════════════════════════════════════════════════

export { SerpUserIntentAgent } from './ai_agents/serp_user_intent_agent.js';
export { CompetitorComparisonAgent } from './ai_agents/competitor_comparison_agent.js';

// ═══════════════════════════════════════════════════════════════════
// SCRAPER EXPORTS (for advanced usage)
// ═══════════════════════════════════════════════════════════════════

export { SerpSearchScraper } from './scrapers/serp_search_scraper.js';
export { CompetitorSiteScraper } from './scrapers/competitor_site_scraper.js';

// ═══════════════════════════════════════════════════════════════════
// UTILITY EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { Logger } from './utils/logger.js';
export { ConfigLoader } from './utils/config_loader.js';
export { OutputWriter } from './utils/output_writer.js';
export { OpenRouterClient } from './utils/openrouter_client.js';

// ═══════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════

import { EnhancedMarketOrchestrator } from './orchestrator/enhanced_orchestrator.js';
import { MarketOrchestrator } from './orchestrator/market_orchestrator.js';
import { isEnabled, getStatus } from './feature_flag.js';

export default {
  // Recommended
  EnhancedMarketOrchestrator,
  
  // Legacy
  MarketOrchestrator,
  
  // Feature flags
  isEnabled,
  getStatus,
};
