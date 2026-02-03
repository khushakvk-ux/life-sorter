/**
 * MARKET INTELLIGENCE ORCHESTRATOR
 * =================================
 * 
 * Central controller for the Market Intelligence Entity.
 * Coordinates all discovery, enrichment, and analysis workflows.
 * 
 * ISOLATION GUARANTEES:
 * - No imports from core application
 * - No shared state with external systems
 * - All outputs are JSON files only
 * - Fully resumable execution
 * - Graceful failure handling
 * 
 * EXECUTION FLOW:
 * 1. Check feature flag → abort if disabled
 * 2. Load configuration
 * 3. Execute SERP discovery
 * 4. Select top competitors
 * 5. Enrich competitor data
 * 6. Run AI analysis
 * 7. Generate verdicts
 * 8. Write outputs
 */

import { isEnabled, isSubFeatureEnabled, getStatus } from '../feature_flag.js';
import { SerpSearchScraper } from '../scrapers/serp_search_scraper.js';
import { CompetitorSiteScraper } from '../scrapers/competitor_site_scraper.js';
import { SerpUserIntentAgent } from '../ai_agents/serp_user_intent_agent.js';
import { CompetitorComparisonAgent } from '../ai_agents/competitor_comparison_agent.js';
import { Logger } from '../utils/logger.js';
import { ConfigLoader } from '../utils/config_loader.js';
import { OutputWriter } from '../utils/output_writer.js';
import { delay, generateExecutionId } from '../utils/helpers.js';

// ═══════════════════════════════════════════════════════════════════
// ORCHESTRATOR CLASS
// ═══════════════════════════════════════════════════════════════════

class MarketOrchestrator {
  constructor() {
    this.executionId = null;
    this.logger = null;
    this.config = null;
    this.checkpoint = null;
    this.startTime = null;
    this.results = {
      serpDiscovery: null,
      competitorsEnriched: null,
      competitiveVerdict: null,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN ENTRY POINT
  // ─────────────────────────────────────────────────────────────────

  /**
   * Execute the full market intelligence workflow
   * @param {Object} input - Input configuration
   * @returns {Object|null} Results or null if disabled/failed
   */
  async execute(input) {
    // ════════════════════════════════════════════════════════════════
    // STEP 0: FEATURE FLAG CHECK (CRITICAL - DO THIS FIRST)
    // ════════════════════════════════════════════════════════════════
    if (!isEnabled()) {
      console.log('[MarketOrchestrator] Entity is DISABLED. Exiting gracefully.');
      return null;
    }

    this.executionId = generateExecutionId();
    this.startTime = Date.now();

    try {
      // Initialize components
      await this._initialize(input);

      this.logger.info('═══════════════════════════════════════════════════════');
      this.logger.info('MARKET INTELLIGENCE ENTITY - EXECUTION STARTED');
      this.logger.info(`Execution ID: ${this.executionId}`);
      this.logger.info(`Feature Status: ${JSON.stringify(getStatus())}`);
      this.logger.info('═══════════════════════════════════════════════════════');

      // ════════════════════════════════════════════════════════════════
      // STEP 1: SERP DISCOVERY
      // ════════════════════════════════════════════════════════════════
      if (isSubFeatureEnabled('SERP_DISCOVERY')) {
        await this._executeSerpDiscovery(input);
      } else {
        this.logger.info('[SKIP] SERP Discovery disabled');
      }

      // ════════════════════════════════════════════════════════════════
      // STEP 2: COMPETITOR SELECTION
      // ════════════════════════════════════════════════════════════════
      const selectedCompetitors = await this._selectCompetitors();

      // ════════════════════════════════════════════════════════════════
      // STEP 3: COMPETITOR ENRICHMENT
      // ════════════════════════════════════════════════════════════════
      if (isSubFeatureEnabled('COMPETITOR_ENRICHMENT')) {
        await this._executeCompetitorEnrichment(selectedCompetitors);
      } else {
        this.logger.info('[SKIP] Competitor Enrichment disabled');
      }

      // ════════════════════════════════════════════════════════════════
      // STEP 4: AI ANALYSIS
      // ════════════════════════════════════════════════════════════════
      if (isSubFeatureEnabled('AI_ANALYSIS')) {
        await this._executeAiAnalysis();
      } else {
        this.logger.info('[SKIP] AI Analysis disabled');
      }

      // ════════════════════════════════════════════════════════════════
      // STEP 5: WRITE OUTPUTS
      // ════════════════════════════════════════════════════════════════
      await this._writeOutputs();

      // Final summary
      const duration = (Date.now() - this.startTime) / 1000;
      this.logger.info('═══════════════════════════════════════════════════════');
      this.logger.info(`EXECUTION COMPLETED in ${duration.toFixed(2)}s`);
      this.logger.info('═══════════════════════════════════════════════════════');

      return this.results;

    } catch (error) {
      return this._handleFatalError(error);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────

  async _initialize(input) {
    // Load configuration (isolated - only reads from local config folder)
    this.config = await ConfigLoader.load();
    
    // Initialize logger (isolated - only writes to local logs folder)
    this.logger = new Logger({
      executionId: this.executionId,
      config: this.config.logging,
    });

    this.logger.info('Initialization complete');
    this.logger.info(`Input: ${JSON.stringify(input, null, 2)}`);
  }

  // ─────────────────────────────────────────────────────────────────
  // SERP DISCOVERY
  // ─────────────────────────────────────────────────────────────────

  async _executeSerpDiscovery(input) {
    this.logger.info('───────────────────────────────────────────────────────');
    this.logger.info('PHASE 1: SERP DISCOVERY');
    this.logger.info('───────────────────────────────────────────────────────');

    const scraper = new SerpSearchScraper(this.config, this.logger);

    // Generate search queries based on input
    const queries = this._generateSearchQueries(input);
    this.logger.info(`Generated ${queries.length} search queries`);

    // Execute searches with human pacing
    const serpResults = [];
    for (const query of queries) {
      this.logger.info(`Searching: "${query}"`);
      
      try {
        const result = await scraper.search(query);
        serpResults.push(result);
        this._saveCheckpoint('serp_discovery', serpResults);
        
        // Human pacing - random delay between searches
        await this._humanDelay();
      } catch (error) {
        this.logger.warn(`Search failed for "${query}": ${error.message}`);
        // Continue with other queries - don't abort entire process
      }
    }

    // Aggregate and store results
    this.results.serpDiscovery = {
      executionId: this.executionId,
      timestamp: new Date().toISOString(),
      input: input,
      queries: queries,
      results: serpResults,
      aggregatedDomains: this._aggregateDomains(serpResults),
      confidenceScore: this._calculateSerpConfidence(serpResults),
    };

    this.logger.info(`SERP Discovery complete. Found ${this.results.serpDiscovery.aggregatedDomains.length} unique domains`);
  }

  // ─────────────────────────────────────────────────────────────────
  // COMPETITOR SELECTION
  // ─────────────────────────────────────────────────────────────────

  async _selectCompetitors() {
    this.logger.info('───────────────────────────────────────────────────────');
    this.logger.info('PHASE 2: COMPETITOR SELECTION');
    this.logger.info('───────────────────────────────────────────────────────');

    if (!this.results.serpDiscovery) {
      this.logger.warn('No SERP data available for competitor selection');
      return [];
    }

    const domains = this.results.serpDiscovery.aggregatedDomains;
    const maxCompetitors = this.config.competitorSelection.maxCompetitors;
    const criteria = this.config.competitorSelection.selectionCriteria;

    // Score each domain
    const scoredDomains = domains.map(domain => ({
      ...domain,
      score: this._calculateCompetitorScore(domain, criteria),
      selectionReason: this._determineSelectionReason(domain),
    }));

    // Sort by score and take top N
    const selected = scoredDomains
      .filter(d => d.score >= this.config.competitorSelection.minimumConfidenceScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCompetitors);

    this.logger.info(`Selected ${selected.length} competitors:`);
    selected.forEach((comp, i) => {
      this.logger.info(`  ${i + 1}. ${comp.domain} (score: ${comp.score.toFixed(2)}, reason: ${comp.selectionReason})`);
    });

    return selected;
  }

  // ─────────────────────────────────────────────────────────────────
  // COMPETITOR ENRICHMENT
  // ─────────────────────────────────────────────────────────────────

  async _executeCompetitorEnrichment(competitors) {
    this.logger.info('───────────────────────────────────────────────────────');
    this.logger.info('PHASE 3: COMPETITOR ENRICHMENT');
    this.logger.info('───────────────────────────────────────────────────────');

    const scraper = new CompetitorSiteScraper(this.config, this.logger);
    const enrichedCompetitors = [];

    for (const competitor of competitors) {
      this.logger.info(`Enriching: ${competitor.domain}`);
      
      try {
        const enrichedData = await scraper.enrich(competitor);
        enrichedCompetitors.push(enrichedData);
        this._saveCheckpoint('competitor_enrichment', enrichedCompetitors);
        
        // Human pacing between site visits
        await this._humanDelay();
      } catch (error) {
        this.logger.warn(`Enrichment failed for ${competitor.domain}: ${error.message}`);
        enrichedCompetitors.push({
          ...competitor,
          enrichmentFailed: true,
          error: error.message,
        });
      }
    }

    this.results.competitorsEnriched = {
      executionId: this.executionId,
      timestamp: new Date().toISOString(),
      competitors: enrichedCompetitors,
      confidenceScore: this._calculateEnrichmentConfidence(enrichedCompetitors),
    };

    this.logger.info(`Enrichment complete. ${enrichedCompetitors.filter(c => !c.enrichmentFailed).length}/${competitors.length} successful`);
  }

  // ─────────────────────────────────────────────────────────────────
  // AI ANALYSIS
  // ─────────────────────────────────────────────────────────────────

  async _executeAiAnalysis() {
    this.logger.info('───────────────────────────────────────────────────────');
    this.logger.info('PHASE 4: AI ANALYSIS');
    this.logger.info('───────────────────────────────────────────────────────');

    // User Intent Analysis
    this.logger.info('Running User Intent Analysis...');
    const intentAgent = new SerpUserIntentAgent(this.config, this.logger);
    const userIntentAnalysis = await intentAgent.analyze(this.results.serpDiscovery);

    // Competitor Comparison
    this.logger.info('Running Competitor Comparison...');
    const comparisonAgent = new CompetitorComparisonAgent(this.config, this.logger);
    const comparisonAnalysis = await comparisonAgent.compare(this.results.competitorsEnriched);

    // Generate competitive verdict
    this.results.competitiveVerdict = {
      executionId: this.executionId,
      timestamp: new Date().toISOString(),
      userIntent: userIntentAnalysis,
      competitorComparison: comparisonAnalysis,
      verdict: this._generateVerdict(userIntentAnalysis, comparisonAnalysis),
      confidenceScore: (userIntentAnalysis.confidenceScore + comparisonAnalysis.confidenceScore) / 2,
    };

    this.logger.info('AI Analysis complete');
  }

  // ─────────────────────────────────────────────────────────────────
  // OUTPUT WRITING
  // ─────────────────────────────────────────────────────────────────

  async _writeOutputs() {
    this.logger.info('───────────────────────────────────────────────────────');
    this.logger.info('PHASE 5: WRITING OUTPUTS');
    this.logger.info('───────────────────────────────────────────────────────');

    const writer = new OutputWriter(this.config, this.logger);

    if (this.results.serpDiscovery) {
      await writer.write('serp_discovery.json', this.results.serpDiscovery);
    }

    if (this.results.competitorsEnriched) {
      await writer.write('competitors_enriched.json', this.results.competitorsEnriched);
    }

    if (this.results.competitiveVerdict) {
      await writer.write('competitive_verdict.json', this.results.competitiveVerdict);
    }

    this.logger.info('All outputs written successfully');
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────

  _generateSearchQueries(input) {
    const { service, location, year } = input;
    const templates = this.config.search?.queryTemplates || {};
    
    const queries = [];
    
    if (templates.nearMe) {
      queries.push(templates.nearMe.replace('{service}', service));
    }
    if (templates.versus) {
      queries.push(templates.versus.replace('{service}', service));
    }
    if (templates.best && location) {
      queries.push(templates.best.replace('{service}', service).replace('{location}', location));
    }
    if (templates.alternatives) {
      queries.push(templates.alternatives.replace('{service}', service));
    }
    if (templates.reviews && year) {
      queries.push(templates.reviews.replace('{service}', service).replace('{year}', year));
    }
    
    return queries;
  }

  _aggregateDomains(serpResults) {
    const domainMap = new Map();
    
    for (const result of serpResults) {
      if (!result?.organicResults) continue;
      
      for (const item of result.organicResults) {
        const domain = this._extractDomain(item.url);
        if (!domain) continue;
        
        if (domainMap.has(domain)) {
          const existing = domainMap.get(domain);
          existing.occurrences++;
          existing.positions.push(item.position);
        } else {
          domainMap.set(domain, {
            domain,
            occurrences: 1,
            positions: [item.position],
            firstSeen: item,
          });
        }
      }
    }
    
    return Array.from(domainMap.values())
      .sort((a, b) => b.occurrences - a.occurrences);
  }

  _extractDomain(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return null;
    }
  }

  _calculateCompetitorScore(domain, criteria) {
    const serpFrequency = Math.min(domain.occurrences / 5, 1) * criteria.serpFrequencyWeight;
    const localRelevance = 0.5 * criteria.localRelevanceWeight; // Placeholder
    const authority = this._estimateAuthority(domain) * criteria.perceivedAuthorityWeight;
    const clarity = 0.5 * criteria.offerClarityWeight; // Placeholder
    
    return serpFrequency + localRelevance + authority + clarity;
  }

  _estimateAuthority(domain) {
    // Simple heuristic based on SERP position
    const avgPosition = domain.positions.reduce((a, b) => a + b, 0) / domain.positions.length;
    return Math.max(0, 1 - (avgPosition - 1) / 10);
  }

  _determineSelectionReason(domain) {
    if (domain.occurrences >= 3) return 'SERP_FREQUENCY';
    if (domain.positions.some(p => p <= 3)) return 'TOP_RANKING';
    return 'RELEVANCE';
  }

  _calculateSerpConfidence(results) {
    if (!results.length) return 0;
    const successRate = results.filter(r => r && !r.error).length / results.length;
    return Math.round(successRate * 100) / 100;
  }

  _calculateEnrichmentConfidence(competitors) {
    if (!competitors.length) return 0;
    const successRate = competitors.filter(c => !c.enrichmentFailed).length / competitors.length;
    return Math.round(successRate * 100) / 100;
  }

  _generateVerdict(intentAnalysis, comparisonAnalysis) {
    return {
      competitiveDisadvantages: comparisonAnalysis.disadvantages || [],
      missingClaritySignals: comparisonAnalysis.missingSignals || [],
      differentiationGaps: comparisonAnalysis.gaps || [],
      userPerception: intentAnalysis.perception || {},
      actionableInsights: this._generateActionableInsights(intentAnalysis, comparisonAnalysis),
    };
  }

  _generateActionableInsights(intentAnalysis, comparisonAnalysis) {
    return [
      'Review competitor positioning statements',
      'Analyze trust signals that competitors display',
      'Identify clarity improvements in value proposition',
    ];
  }

  async _humanDelay() {
    if (!this.config.humanPacing?.enabled) return;
    
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
      console.error('[MarketOrchestrator] FATAL ERROR:', errorInfo);
    }

    // Store error in output writer for debugging (browser-compatible)
    try {
      if (this.outputWriter) {
        this.outputWriter.write('error_log.json', errorInfo);
      }
    } catch {
      // Ignore write errors - we're already in error handling
    }

    // Return null - never throw to external callers
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// STANDALONE EXECUTION
// ═══════════════════════════════════════════════════════════════════

/**
 * Run the orchestrator as a standalone process
 * Can be called via: node market_orchestrator.js
 */
async function main() {
  const orchestrator = new MarketOrchestrator();
  
  // Example input - in production, this would come from config file
  const input = {
    service: 'AI SaaS',
    location: 'United States',
    year: '2026',
  };
  
  const results = await orchestrator.execute(input);
  
  if (results) {
    console.log('\n✓ Execution completed successfully');
    console.log(`  - SERP Discovery: ${results.serpDiscovery ? '✓' : '✗'}`);
    console.log(`  - Competitors Enriched: ${results.competitorsEnriched ? '✓' : '✗'}`);
    console.log(`  - Competitive Verdict: ${results.competitiveVerdict ? '✓' : '✗'}`);
  } else {
    console.log('\n✗ Execution did not complete (disabled or failed)');
  }
}

// Run if called directly (Node.js only, not in browser)
// NOTE: This check is commented out for browser compatibility
// if (import.meta.url === `file://${process.argv[1]}`) {
//   main().catch(console.error);
// }

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { MarketOrchestrator };
export default MarketOrchestrator;
