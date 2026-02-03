/**
 * ENHANCED MARKET INTELLIGENCE ORCHESTRATOR
 * ==========================================
 * 
 * Central controller for the Market Intelligence Entity.
 * Executes all 4 phases sequentially and produces a consolidated report.
 * 
 * PHASES:
 * 1. Website Extraction - Business identity, offerings, proof assets
 * 2. External Presence - Social profiles, GBP, sentiment analysis
 * 3. Marketing & Conversion - CTAs, engagement paths, sales process
 * 4. Competitor Analysis - Top 3 competitors with quick facts
 * 
 * FINAL OUTPUT: Consolidated Market Intelligence Report
 * 
 * REQUIRES: OpenRouter API key for LLM operations
 */

import { isEnabled, isSubFeatureEnabled, getStatus } from '../feature_flag.js';
import { Logger } from '../utils/logger.js';
import { ConfigLoader } from '../utils/config_loader.js';
import { OutputWriter } from '../utils/output_writer.js';
import { delay, generateExecutionId } from '../utils/helpers.js';
import { OpenRouterClient } from '../utils/openrouter_client.js';

// Phase Agents
import { WebsiteExtractionAgent } from '../ai_agents/phase1_website_extraction_agent.js';
import { ExternalPresenceAgent } from '../ai_agents/phase2_external_presence_agent.js';
import { MarketingConversionAgent } from '../ai_agents/phase3_marketing_conversion_agent.js';
import { CompetitorAnalysisAgent } from '../ai_agents/phase4_competitor_analysis_agent.js';
import { ReportConsolidator } from '../ai_agents/report_consolidator.js';

// Legacy agents for backward compatibility
import { SerpUserIntentAgent } from '../ai_agents/serp_user_intent_agent.js';
import { CompetitorComparisonAgent } from '../ai_agents/competitor_comparison_agent.js';

// Scrapers
import { SerpSearchScraper } from '../scrapers/serp_search_scraper.js';
import { CompetitorSiteScraper } from '../scrapers/competitor_site_scraper.js';

// ═══════════════════════════════════════════════════════════════════
// ENHANCED ORCHESTRATOR CLASS
// ═══════════════════════════════════════════════════════════════════

class EnhancedMarketOrchestrator {
  constructor(openRouterApiKey = null) {
    this.executionId = null;
    this.logger = null;
    this.config = null;
    this.checkpoint = null;
    this.startTime = null;
    this.openRouterApiKey = openRouterApiKey;
    
    // Phase results
    this.results = {
      phase1: null,  // Website Extraction
      phase2: null,  // External Presence
      phase3: null,  // Marketing & Conversion
      phase4: null,  // Competitor Analysis
      consolidatedReport: null,
    };
    
    // LLM usage tracking
    this.llmUsage = {
      totalTokens: 0,
      estimatedCost: 0,
      phaseBreakdown: {}
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // CONFIGURATION
  // ─────────────────────────────────────────────────────────────────

  setApiKey(apiKey) {
    this.openRouterApiKey = apiKey;
    return this;
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN ENTRY POINT
  // ─────────────────────────────────────────────────────────────────

  /**
   * Execute the full 4-phase market intelligence workflow
   * @param {Object} input - Input configuration
   * @param {string} input.websiteUrl - Target website URL
   * @param {Object} input.websiteData - Pre-scraped website data (optional)
   * @param {Object} input.externalData - Pre-collected external data (optional)
   * @param {Object} input.serpData - Pre-collected SERP data (optional)
   * @param {string[]} input.seedKeywords - Keywords for competitor search (optional)
   * @returns {Object} Consolidated Market Intelligence Report
   */
  async execute(input) {
    // ════════════════════════════════════════════════════════════════
    // STEP 0: FEATURE FLAG CHECK
    // ════════════════════════════════════════════════════════════════
    if (!isEnabled()) {
      console.log('[EnhancedOrchestrator] Entity is DISABLED. Exiting gracefully.');
      return null;
    }

    // Validate API key
    if (!this.openRouterApiKey) {
      console.error('[EnhancedOrchestrator] OpenRouter API key is required');
      return null;
    }

    this.executionId = generateExecutionId();
    this.startTime = Date.now();

    try {
      // Initialize components
      await this._initialize(input);

      this.logger.info('═══════════════════════════════════════════════════════════');
      this.logger.info('ENHANCED MARKET INTELLIGENCE - EXECUTION STARTED');
      this.logger.info(`Execution ID: ${this.executionId}`);
      this.logger.info(`Target: ${input.websiteUrl || 'N/A'}`);
      this.logger.info('═══════════════════════════════════════════════════════════');

      // ════════════════════════════════════════════════════════════════
      // PHASE 1: WEBSITE EXTRACTION
      // ════════════════════════════════════════════════════════════════
      if (isSubFeatureEnabled('WEBSITE_EXTRACTION')) {
        await this._executePhase1(input);
      } else {
        this.logger.info('[SKIP] Phase 1 - Website Extraction disabled');
      }

      // ════════════════════════════════════════════════════════════════
      // PHASE 2: EXTERNAL PRESENCE
      // ════════════════════════════════════════════════════════════════
      if (isSubFeatureEnabled('EXTERNAL_PRESENCE')) {
        await this._executePhase2(input);
      } else {
        this.logger.info('[SKIP] Phase 2 - External Presence disabled');
      }

      // ════════════════════════════════════════════════════════════════
      // PHASE 3: MARKETING & CONVERSION
      // ════════════════════════════════════════════════════════════════
      if (isSubFeatureEnabled('MARKETING_CONVERSION')) {
        await this._executePhase3(input);
      } else {
        this.logger.info('[SKIP] Phase 3 - Marketing & Conversion disabled');
      }

      // ════════════════════════════════════════════════════════════════
      // PHASE 4: COMPETITOR ANALYSIS
      // ════════════════════════════════════════════════════════════════
      if (isSubFeatureEnabled('COMPETITOR_ANALYSIS')) {
        await this._executePhase4(input);
      } else {
        this.logger.info('[SKIP] Phase 4 - Competitor Analysis disabled');
      }

      // ════════════════════════════════════════════════════════════════
      // FINAL: REPORT CONSOLIDATION
      // ════════════════════════════════════════════════════════════════
      await this._consolidateReport();

      // ════════════════════════════════════════════════════════════════
      // OUTPUT: WRITE ALL RESULTS
      // ════════════════════════════════════════════════════════════════
      await this._writeOutputs();

      // Final summary
      const duration = (Date.now() - this.startTime) / 1000;
      this.logger.info('═══════════════════════════════════════════════════════════');
      this.logger.info(`EXECUTION COMPLETED in ${duration.toFixed(2)}s`);
      this.logger.info(`Overall Confidence: ${(this.results.consolidatedReport?.overall_confidence * 100 || 0).toFixed(1)}%`);
      this.logger.info('═══════════════════════════════════════════════════════════');

      return this.results.consolidatedReport;

    } catch (error) {
      return this._handleFatalError(error);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────

  async _initialize(input) {
    this.config = await ConfigLoader.load();
    
    this.logger = new Logger({
      executionId: this.executionId,
      config: this.config.logging,
    });

    this.logger.info('Initialization complete');
    this.logger.info(`Input URL: ${input.websiteUrl || 'Not provided'}`);
  }

  // ─────────────────────────────────────────────────────────────────
  // PHASE 1: WEBSITE EXTRACTION
  // ─────────────────────────────────────────────────────────────────

  async _executePhase1(input) {
    this.logger.info('───────────────────────────────────────────────────────');
    this.logger.info('PHASE 1: WEBSITE EXTRACTION');
    this.logger.info('LLM: Claude Sonnet 4 (structured extraction)');
    this.logger.info('───────────────────────────────────────────────────────');

    const agent = new WebsiteExtractionAgent(
      this.config,
      this.logger,
      this.openRouterApiKey
    );

    // Prepare website data
    const websiteData = input.websiteData || {
      url: input.websiteUrl,
      html: input.html || '',
      textContent: input.textContent || '',
    };

    // If no data provided and we have a URL, we'd scrape it here
    // For now, we work with whatever data is provided
    if (!websiteData.html && !websiteData.textContent) {
      this.logger.warn('No website content provided. Phase 1 may have limited results.');
    }

    this.results.phase1 = await agent.extract(websiteData);
    this._saveCheckpoint('phase1', this.results.phase1);
    
    this.logger.info(`Phase 1 complete. Confidence: ${(this.results.phase1?.overall_confidence * 100 || 0).toFixed(1)}%`);
    
    await this._humanDelay();
  }

  // ─────────────────────────────────────────────────────────────────
  // PHASE 2: EXTERNAL PRESENCE
  // ─────────────────────────────────────────────────────────────────

  async _executePhase2(input) {
    this.logger.info('───────────────────────────────────────────────────────');
    this.logger.info('PHASE 2: EXTERNAL PRESENCE & SOCIAL PERCEPTION');
    this.logger.info('LLM: Claude Sonnet 4 (sentiment & theme analysis)');
    this.logger.info('───────────────────────────────────────────────────────');

    const agent = new ExternalPresenceAgent(
      this.config,
      this.logger,
      this.openRouterApiKey
    );

    // Use Phase 1 output as business identity
    const businessIdentity = this.results.phase1 || {
      url: input.websiteUrl,
      business_identity: { name: { value: '' }, location: {} }
    };

    // External data (social profiles, reviews, etc.)
    const externalData = input.externalData || {};

    this.results.phase2 = await agent.analyze(businessIdentity, externalData);
    this._saveCheckpoint('phase2', this.results.phase2);
    
    this.logger.info(`Phase 2 complete. Profiles found: ${this.results.phase2?.profiles_discovered || 0}`);
    
    await this._humanDelay();
  }

  // ─────────────────────────────────────────────────────────────────
  // PHASE 3: MARKETING & CONVERSION
  // ─────────────────────────────────────────────────────────────────

  async _executePhase3(input) {
    this.logger.info('───────────────────────────────────────────────────────');
    this.logger.info('PHASE 3: MARKETING, REACHOUT & CONVERSION');
    this.logger.info('LLM: GPT-4.1 (marketing & CTA analysis)');
    this.logger.info('───────────────────────────────────────────────────────');

    const agent = new MarketingConversionAgent(
      this.config,
      this.logger,
      this.openRouterApiKey
    );

    // Prepare website data
    const websiteData = input.websiteData || {
      url: input.websiteUrl,
      html: input.html || '',
      textContent: input.textContent || '',
    };

    this.results.phase3 = await agent.analyze(
      this.results.phase1,
      websiteData,
      this.results.phase2
    );
    this._saveCheckpoint('phase3', this.results.phase3);
    
    this.logger.info(`Phase 3 complete. CTAs found: ${this.results.phase3?.total_ctas || 0}`);
    
    await this._humanDelay();
  }

  // ─────────────────────────────────────────────────────────────────
  // PHASE 4: COMPETITOR ANALYSIS
  // ─────────────────────────────────────────────────────────────────

  async _executePhase4(input) {
    this.logger.info('───────────────────────────────────────────────────────');
    this.logger.info('PHASE 4: COMPETITOR IDENTIFICATION & QUICK-FACTS');
    this.logger.info('LLM: GPT-4.1 (competitive intelligence)');
    this.logger.info('───────────────────────────────────────────────────────');

    const agent = new CompetitorAnalysisAgent(
      this.config,
      this.logger,
      this.openRouterApiKey
    );

    // SERP data (if available)
    const serpData = input.serpData || {};
    
    // Competitor site data (if pre-scraped)
    const competitorSiteData = input.competitorSiteData || [];
    
    // Options
    const options = {
      seedKeywords: input.seedKeywords || []
    };

    this.results.phase4 = await agent.analyze(
      this.results.phase1,
      serpData,
      competitorSiteData,
      options
    );
    this._saveCheckpoint('phase4', this.results.phase4);
    
    this.logger.info(`Phase 4 complete. Competitors identified: ${this.results.phase4?.competitors?.length || 0}`);
    
    await this._humanDelay();
  }

  // ─────────────────────────────────────────────────────────────────
  // REPORT CONSOLIDATION
  // ─────────────────────────────────────────────────────────────────

  async _consolidateReport() {
    this.logger.info('───────────────────────────────────────────────────────');
    this.logger.info('FINAL: REPORT CONSOLIDATION');
    this.logger.info('LLM: Claude Sonnet 4 (narrative synthesis)');
    this.logger.info('───────────────────────────────────────────────────────');

    const consolidator = new ReportConsolidator(
      this.config,
      this.logger,
      this.openRouterApiKey
    );

    this.results.consolidatedReport = await consolidator.consolidate(
      this.results.phase1,
      this.results.phase2,
      this.results.phase3,
      this.results.phase4
    );

    this._saveCheckpoint('consolidation', this.results.consolidatedReport);
    
    this.logger.info(`Report consolidated. Overall confidence: ${(this.results.consolidatedReport?.overall_confidence * 100 || 0).toFixed(1)}%`);
  }

  // ─────────────────────────────────────────────────────────────────
  // OUTPUT WRITING
  // ─────────────────────────────────────────────────────────────────

  async _writeOutputs() {
    this.logger.info('───────────────────────────────────────────────────────');
    this.logger.info('WRITING OUTPUTS');
    this.logger.info('───────────────────────────────────────────────────────');

    const writer = new OutputWriter(this.config, this.logger);
    const timestamp = new Date().toISOString().split('T')[0];

    // Write individual phase outputs
    if (this.results.phase1) {
      await writer.write(`phase1_website_extraction_${timestamp}.json`, this.results.phase1);
    }

    if (this.results.phase2) {
      await writer.write(`phase2_external_presence_${timestamp}.json`, this.results.phase2);
    }

    if (this.results.phase3) {
      await writer.write(`phase3_marketing_conversion_${timestamp}.json`, this.results.phase3);
    }

    if (this.results.phase4) {
      await writer.write(`phase4_competitor_analysis_${timestamp}.json`, this.results.phase4);
    }

    // Write consolidated report
    if (this.results.consolidatedReport) {
      await writer.write(`consolidated_report_${timestamp}.json`, this.results.consolidatedReport);
      
      // Also write markdown report separately for easy reading
      if (this.results.consolidatedReport.report_markdown) {
        await writer.write(
          `market_intelligence_report_${timestamp}.md`,
          this.results.consolidatedReport.report_markdown,
          'text'
        );
      }
    }

    this.logger.info('All outputs written successfully');
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────

  async _humanDelay() {
    if (!this.config?.humanPacing?.enabled) return;
    
    const min = this.config.humanPacing.minDelayMs || 2000;
    const max = this.config.humanPacing.maxDelayMs || 7000;
    const delayMs = Math.floor(Math.random() * (max - min)) + min;
    
    this.logger.debug(`Human pacing delay: ${delayMs}ms`);
    await delay(delayMs);
  }

  _saveCheckpoint(phase, data) {
    this.checkpoint = {
      phase,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  _handleFatalError(error) {
    const errorInfo = {
      executionId: this.executionId,
      error: error.message,
      stack: error.stack,
      checkpoint: this.checkpoint,
      timestamp: new Date().toISOString(),
    };

    if (this.logger) {
      this.logger.error('FATAL ERROR:', errorInfo);
    } else {
      console.error('[EnhancedOrchestrator] FATAL ERROR:', errorInfo);
    }

    return null;
  }

  // ─────────────────────────────────────────────────────────────────
  // PUBLIC GETTERS
  // ─────────────────────────────────────────────────────────────────

  getPhaseResults() {
    return { ...this.results };
  }

  getExecutionId() {
    return this.executionId;
  }

  getLLMUsage() {
    return { ...this.llmUsage };
  }
}

// ═══════════════════════════════════════════════════════════════════
// STANDALONE EXECUTION
// ═══════════════════════════════════════════════════════════════════

async function main() {
  // Get API key from environment
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('ERROR: OPENROUTER_API_KEY environment variable is required');
    console.log('Usage: OPENROUTER_API_KEY=your_key node enhanced_orchestrator.js');
    process.exit(1);
  }
  
  const orchestrator = new EnhancedMarketOrchestrator(apiKey);
  
  // Example input
  const input = {
    websiteUrl: 'https://example.com',
    textContent: 'Example Company - We provide AI SaaS solutions for businesses.',
    seedKeywords: ['AI SaaS', 'business automation'],
  };
  
  const report = await orchestrator.execute(input);
  
  if (report) {
    console.log('\n✓ Market Intelligence Report Generated');
    console.log(`  - Report ID: ${report.report_id}`);
    console.log(`  - Overall Confidence: ${(report.overall_confidence * 100).toFixed(1)}%`);
    console.log(`  - Phases Completed: ${report.data_quality?.phases_completed?.length || 0}/4`);
  } else {
    console.log('\n✗ Execution did not complete');
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { EnhancedMarketOrchestrator };
export default EnhancedMarketOrchestrator;
