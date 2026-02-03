/**
 * PHASE 4 - COMPETITOR IDENTIFICATION & QUICK-FACTS AGENT
 * ========================================================
 * 
 * Automatically identifies Top-3 competitors and produces concise, evidence-backed
 * quick facts: positioning, primary offerings, GBP snapshot, SEO presence, social signals.
 * 
 * OUTPUT:
 * - competitors: array of top 3 with full profiles
 *   - name, domain, positioning
 *   - primary_offerings, offer_highlights
 *   - gbp_snapshot: rating, reviews, categories
 *   - seo_metrics: SERP rank, keywords, traffic estimates
 *   - social_presence
 *   - evidence
 * 
 * LLM: GPT-4.1 (best for comparative analysis, ranking, competitive intelligence)
 */

import { isEnabled } from '../feature_flag.js';
import { OpenRouterClient } from '../utils/openrouter_client.js';

// ═══════════════════════════════════════════════════════════════════
// JSON SCHEMA FOR PHASE 4 OUTPUT
// ═══════════════════════════════════════════════════════════════════

const PHASE4_OUTPUT_SCHEMA = {
  business_id: "string",
  extracted_at: "ISO8601 timestamp",
  seed_keywords: ["string"],
  competitors: [
    {
      name: "string",
      domain: "string",
      rank: "1-3",
      why_picked: ["string"],
      score: "0.0-1.0",
      positioning: "string",
      primary_offerings: ["string"],
      offer_highlights: [
        { text: "string", evidence: { url: "string", selector: "string" } }
      ],
      gbp_snapshot: {
        found: "boolean",
        profile_url: "string",
        rating: "number",
        review_count: "number",
        primary_category: "string",
        services: ["string"],
        confidence: "0.0-1.0",
        extraction_method: "google_places_api|serp_fallback|manual"
      },
      seo_metrics: {
        avg_serp_rank: "number",
        top_keywords: [{ keyword: "string", position: "number" }],
        est_monthly_traffic: "number"
      },
      social_presence: [
        { platform: "string", profile_url: "string", followers: "number" }
      ],
      evidence: [{ source: "string", url: "string", confidence: "0.0-1.0" }]
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT FOR COMPETITOR ANALYSIS
// ═══════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are an expert competitive intelligence analyst. Your task is to identify and analyze the top 3 competitors for a business based on SERP data, local presence, and market signals.

CRITICAL RULES:
1. Return ONLY valid JSON matching the specified schema
2. Select exactly 3 competitors ranked by relevance
3. Provide clear reasoning for why each competitor was selected
4. Include evidence sources for all facts
5. Assign confidence scores based on data quality

COMPETITOR SELECTION CRITERIA (in order of importance):
1. SERP Presence (35%): Domains appearing frequently in top organic results
2. Local GBP Match (30%): Same category, nearby location
3. GBP Strength (15%): rating × log(review_count)
4. Traffic/Backlinks (10%): Estimated domain authority
5. Social Presence (10%): Active social audience aligned with category

WHY_PICKED REASONS (use these labels):
- "serp_competitor": Appears in same search results
- "local_category": Same business category in same area
- "direct_offering_overlap": Similar products/services
- "target_audience_overlap": Same customer segments
- "market_leader": Known leader in the space
- "emerging_competitor": Growing presence in market

POSITIONING STATEMENT:
- Synthesize a 1-2 sentence positioning statement
- Focus on their unique value proposition
- Base on hero text, taglines, and key messaging

GBP SNAPSHOT:
- Include if Google Business Profile is found
- Mark found: false if not available
- Include extraction_method to indicate data source

OUTPUT JSON SCHEMA:
${JSON.stringify(PHASE4_OUTPUT_SCHEMA, null, 2)}`;

// ═══════════════════════════════════════════════════════════════════
// COMPETITOR ANALYSIS AGENT CLASS
// ═══════════════════════════════════════════════════════════════════

class CompetitorAnalysisAgent {
  constructor(config, logger, apiKey) {
    this.config = config;
    this.logger = logger;
    this.llmClient = new OpenRouterClient(apiKey, logger);
    this.phase = 'phase4_competitor_analysis';
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN ANALYSIS METHOD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Identify and analyze top competitors
   * @param {Object} businessIdentity - Phase 1 output with business identity
   * @param {Object} serpData - SERP results for relevant keywords
   * @param {Object} competitorSiteData - Scraped data from competitor websites
   * @param {Object} options - Additional options (seedKeywords, localRadius)
   * @returns {Object} Competitor analysis with top 3 profiles
   */
  async analyze(businessIdentity, serpData = {}, competitorSiteData = [], options = {}) {
    if (!isEnabled()) {
      this.logger?.warn('[Phase4] Entity is disabled');
      return this._getEmptyAnalysis(businessIdentity);
    }

    const businessName = businessIdentity?.business_identity?.name?.value || 'Unknown';
    this.logger?.info(`[Phase4] Starting competitor analysis for: ${businessName}`);

    try {
      // Step 1: Generate/validate seed keywords
      const seedKeywords = await this._generateSeedKeywords(businessIdentity, options.seedKeywords);
      
      // Step 2: Score and rank candidate competitors
      const rankedCandidates = this._scoreCompetitors(serpData, businessIdentity);
      
      // Step 3: Select top 3
      const topCompetitors = rankedCandidates.slice(0, 3);
      
      // Step 4: Enrich competitor data
      const enrichedCompetitors = this._enrichCompetitorData(topCompetitors, competitorSiteData);
      
      // Step 5: Build analysis prompt
      const userPrompt = this._buildAnalysisPrompt(
        businessIdentity,
        seedKeywords,
        serpData,
        enrichedCompetitors
      );
      
      // Step 6: Execute LLM analysis
      const llmResult = await this.llmClient.complete(
        this.phase,
        userPrompt,
        SYSTEM_PROMPT
      );
      
      // Step 7: Validate and finalize
      const analysis = this._validateAndFinalize(llmResult, businessIdentity, seedKeywords);
      
      this.logger?.info(`[Phase4] Analysis complete. Competitors identified: ${analysis.competitors?.length || 0}`);
      
      return analysis;

    } catch (error) {
      this.logger?.error(`[Phase4] Analysis failed: ${error.message}`);
      return this._getErrorAnalysis(businessIdentity, error.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // SEED KEYWORD GENERATION
  // ─────────────────────────────────────────────────────────────────

  async _generateSeedKeywords(businessIdentity, providedKeywords = []) {
    const keywords = new Set(providedKeywords);
    
    // Extract from business identity
    const category = businessIdentity?.business_identity?.category?.value;
    if (category) {
      keywords.add(category);
    }
    
    // Extract from primary offerings
    const offerings = businessIdentity?.primary_offerings || [];
    for (const offering of offerings.slice(0, 5)) {
      if (offering.name) {
        keywords.add(offering.name.toLowerCase());
      }
    }
    
    // Add location-based keywords
    const location = businessIdentity?.business_identity?.location;
    if (location?.city) {
      // Add location + category combinations
      if (category) {
        keywords.add(`${category} ${location.city}`);
        keywords.add(`${category} in ${location.city}`);
      }
    }
    
    // Add common competitor search patterns
    if (category) {
      keywords.add(`best ${category}`);
      keywords.add(`${category} alternatives`);
      keywords.add(`${category} companies`);
    }
    
    return Array.from(keywords).filter(k => k && k.length > 2);
  }

  // ─────────────────────────────────────────────────────────────────
  // COMPETITOR SCORING
  // ─────────────────────────────────────────────────────────────────

  _scoreCompetitors(serpData, businessIdentity) {
    const candidates = new Map(); // domain -> score data
    const ownDomain = this._extractDomain(businessIdentity?.url);
    
    // Process SERP results
    const serpResults = serpData?.results || serpData?.organicResults || [];
    
    for (const result of serpResults) {
      const domain = this._extractDomain(result.link || result.url);
      if (!domain || domain === ownDomain) continue;
      
      if (!candidates.has(domain)) {
        candidates.set(domain, {
          domain: domain,
          name: result.title || domain,
          serpAppearances: 0,
          avgPosition: 0,
          positions: [],
          snippets: [],
          keywords: new Set()
        });
      }
      
      const candidate = candidates.get(domain);
      candidate.serpAppearances++;
      candidate.positions.push(result.position || 10);
      if (result.snippet) candidate.snippets.push(result.snippet);
      if (result.keyword) candidate.keywords.add(result.keyword);
    }
    
    // Calculate scores
    const scored = [];
    for (const [domain, data] of candidates) {
      // SERP frequency score (35%)
      const serpScore = Math.min(1.0, data.serpAppearances / 10);
      
      // Position score (25%)
      const avgPos = data.positions.reduce((a, b) => a + b, 0) / data.positions.length;
      const posScore = Math.max(0, 1 - (avgPos - 1) / 10);
      
      // Keyword coverage (20%)
      const keywordScore = Math.min(1.0, data.keywords.size / 5);
      
      // Snippet quality indicator (20%)
      const snippetScore = data.snippets.length > 0 ? 0.7 : 0.3;
      
      // Combined score
      const totalScore = 
        serpScore * 0.35 +
        posScore * 0.25 +
        keywordScore * 0.20 +
        snippetScore * 0.20;
      
      scored.push({
        ...data,
        avgPosition: avgPos.toFixed(1),
        keywords: Array.from(data.keywords),
        score: totalScore
      });
    }
    
    // Sort by score
    return scored.sort((a, b) => b.score - a.score);
  }

  _extractDomain(url) {
    if (!url) return null;
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // COMPETITOR DATA ENRICHMENT
  // ─────────────────────────────────────────────────────────────────

  _enrichCompetitorData(topCompetitors, siteData) {
    const enriched = [];
    
    for (const competitor of topCompetitors) {
      const enrichedCompetitor = { ...competitor };
      
      // Find matching site data
      const matchingSite = siteData.find(site => {
        const siteDomain = this._extractDomain(site.url);
        return siteDomain === competitor.domain;
      });
      
      if (matchingSite) {
        enrichedCompetitor.siteData = {
          title: matchingSite.title || '',
          description: matchingSite.description || '',
          heroText: matchingSite.heroText || '',
          services: matchingSite.services || [],
          testimonials: matchingSite.testimonials || [],
          hasChat: matchingSite.hasChat || false,
          hasForms: matchingSite.hasForms || false,
          socialLinks: matchingSite.socialLinks || []
        };
      }
      
      enriched.push(enrichedCompetitor);
    }
    
    return enriched;
  }

  // ─────────────────────────────────────────────────────────────────
  // PROMPT BUILDING
  // ─────────────────────────────────────────────────────────────────

  _buildAnalysisPrompt(businessIdentity, seedKeywords, serpData, enrichedCompetitors) {
    const businessName = businessIdentity?.business_identity?.name?.value || 'Unknown';
    const businessCategory = businessIdentity?.business_identity?.category?.value || 'Unknown';
    const businessLocation = businessIdentity?.business_identity?.location || {};

    return `
=== TARGET BUSINESS ===
Name: ${businessName}
Website: ${businessIdentity?.url || 'N/A'}
Category: ${businessCategory}
Location: ${businessLocation.city || ''}, ${businessLocation.country || ''}

Primary Offerings:
${(businessIdentity?.primary_offerings || []).slice(0, 5).map(o => `- ${o.name}`).join('\n') || 'Not available'}

=== SEED KEYWORDS USED ===
${seedKeywords.join(', ')}

=== TOP COMPETITOR CANDIDATES (by SERP analysis) ===
${enrichedCompetitors.map((c, i) => `
[${i + 1}] ${c.name}
Domain: ${c.domain}
SERP Score: ${(c.score * 100).toFixed(1)}%
SERP Appearances: ${c.serpAppearances}
Avg Position: ${c.avgPosition}
Keywords Found: ${c.keywords.join(', ')}
Snippets: ${c.snippets.slice(0, 2).join(' | ').slice(0, 200)}...
${c.siteData ? `
Site Data Available:
- Hero: "${(c.siteData.heroText || '').slice(0, 150)}..."
- Services: ${c.siteData.services.slice(0, 5).join(', ') || 'N/A'}
- Has Chat: ${c.siteData.hasChat}
- Social Links: ${c.siteData.socialLinks.length}
` : 'No site data available'}
`).join('\n---\n')}

=== SERP OVERVIEW ===
Total Results Analyzed: ${serpData?.results?.length || serpData?.organicResults?.length || 0}
Keywords Searched: ${serpData?.keywords?.join(', ') || 'N/A'}

=== ANALYSIS TASK ===
Based on the above data:
1. Confirm or adjust the top 3 competitors
2. Synthesize positioning statements for each
3. Extract primary offerings and key differentiators
4. Note any GBP/local presence indicators
5. Estimate SEO strength relative to target business
6. Identify social presence signals
7. Explain WHY each was selected as a competitor
8. Return ONLY the JSON object following the schema`;
  }

  // ─────────────────────────────────────────────────────────────────
  // VALIDATION AND FINALIZATION
  // ─────────────────────────────────────────────────────────────────

  _validateAndFinalize(llmResult, businessIdentity, seedKeywords) {
    let analysis = llmResult.parsed || this._getEmptyAnalysis(businessIdentity);
    
    // Ensure required fields
    analysis.extracted_at = new Date().toISOString();
    analysis.phase = 'phase4_competitor_analysis';
    analysis.model_used = llmResult.model;
    analysis.business_id = businessIdentity?.business_identity?.name?.value || 'unknown';
    analysis.seed_keywords = seedKeywords;
    
    // Ensure exactly 3 competitors (or less if not enough data)
    if (analysis.competitors && analysis.competitors.length > 3) {
      analysis.competitors = analysis.competitors.slice(0, 3);
    }
    
    // Ensure ranks are set
    if (analysis.competitors) {
      analysis.competitors.forEach((c, i) => {
        c.rank = i + 1;
      });
    }
    
    // Calculate overall confidence
    analysis.overall_confidence = this._calculateOverallConfidence(analysis);
    
    // Add metadata
    analysis._metadata = {
      llm_tokens: llmResult.usage,
      competitors_analyzed: analysis.competitors?.length || 0,
      seed_keywords_count: seedKeywords.length
    };
    
    return analysis;
  }

  _calculateOverallConfidence(analysis) {
    if (!analysis.competitors || analysis.competitors.length === 0) return 0;
    
    const factors = [];
    
    // Number of competitors found
    factors.push(analysis.competitors.length / 3);
    
    // Average competitor score
    const avgScore = analysis.competitors.reduce((sum, c) => sum + (c.score || 0), 0) / analysis.competitors.length;
    factors.push(avgScore);
    
    // Evidence quality
    const hasEvidence = analysis.competitors.filter(c => c.evidence && c.evidence.length > 0).length;
    factors.push(hasEvidence / analysis.competitors.length);
    
    // Positioning quality (non-empty)
    const hasPositioning = analysis.competitors.filter(c => c.positioning && c.positioning.length > 10).length;
    factors.push(hasPositioning / analysis.competitors.length);
    
    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  // ─────────────────────────────────────────────────────────────────
  // EMPTY/ERROR PROFILES
  // ─────────────────────────────────────────────────────────────────

  _getEmptyAnalysis(businessIdentity) {
    return {
      extracted_at: new Date().toISOString(),
      phase: 'phase4_competitor_analysis',
      business_id: businessIdentity?.business_identity?.name?.value || 'unknown',
      seed_keywords: [],
      competitors: [],
      overall_confidence: 0
    };
  }

  _getErrorAnalysis(businessIdentity, error) {
    const analysis = this._getEmptyAnalysis(businessIdentity);
    analysis.extraction_error = error;
    analysis.extraction_status = 'failed';
    return analysis;
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { CompetitorAnalysisAgent, PHASE4_OUTPUT_SCHEMA };
export default CompetitorAnalysisAgent;
