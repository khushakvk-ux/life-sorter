/**
 * REPORT CONSOLIDATOR - FINAL INTELLIGENCE REPORT
 * ================================================
 * 
 * Synthesizes outputs from all 4 phases into a single, comprehensive
 * Market Intelligence Report with executive summary and actionable insights.
 * 
 * INPUT: Outputs from Phase 1, 2, 3, and 4
 * 
 * OUTPUT:
 * - Executive Summary
 * - Business Profile Overview
 * - Market Positioning Analysis
 * - Competitive Landscape
 * - Marketing & Conversion Insights
 * - Strengths, Weaknesses, Opportunities, Threats (SWOT)
 * - Actionable Recommendations
 * - Confidence Scores & Data Quality Notes
 * 
 * LLM: Claude Sonnet 4 (best for narrative synthesis and executive reporting)
 */

import { isEnabled } from '../feature_flag.js';
import { OpenRouterClient } from '../utils/openrouter_client.js';

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT FOR REPORT CONSOLIDATION
// ═══════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are an expert business intelligence analyst creating executive reports. Your task is to synthesize comprehensive market intelligence data into a clear, actionable report.

REPORT STRUCTURE:
1. **Executive Summary** (3-4 sentences max)
   - Key finding about the business
   - Main competitive insight
   - Critical recommendation

2. **Business Profile**
   - Identity & positioning
   - Core offerings
   - Proof of credibility

3. **Market Presence**
   - Digital footprint strength
   - Social perception themes
   - Customer engagement patterns

4. **Marketing & Conversion Analysis**
   - Primary conversion paths
   - CTA effectiveness indicators
   - Sales process type

5. **Competitive Landscape**
   - Top 3 competitors with positioning
   - Competitive advantages/disadvantages
   - Market gaps identified

6. **SWOT Analysis**
   - Strengths (from evidence)
   - Weaknesses (from gaps)
   - Opportunities (from market)
   - Threats (from competitors)

7. **Actionable Recommendations**
   - 3-5 specific, prioritized actions
   - Quick wins vs strategic moves

8. **Data Quality & Confidence**
   - Overall confidence score
   - Data gaps noted
   - Recommended follow-ups

WRITING STYLE:
- Professional but accessible
- Evidence-based (cite sources where possible)
- Concise - no fluff
- Action-oriented language
- Use bullet points for clarity
- Highlight key metrics and numbers

FORMAT: Return a well-structured markdown document.`;

// ═══════════════════════════════════════════════════════════════════
// REPORT CONSOLIDATOR CLASS
// ═══════════════════════════════════════════════════════════════════

class ReportConsolidator {
  constructor(config, logger, apiKey) {
    this.config = config;
    this.logger = logger;
    this.llmClient = new OpenRouterClient(apiKey, logger);
    this.phase = 'report_consolidation';
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN CONSOLIDATION METHOD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Consolidate all phase outputs into final report
   * @param {Object} phase1 - Website Extraction output
   * @param {Object} phase2 - External Presence output
   * @param {Object} phase3 - Marketing & Conversion output
   * @param {Object} phase4 - Competitor Analysis output
   * @returns {Object} Consolidated report with executive summary
   */
  async consolidate(phase1, phase2, phase3, phase4) {
    if (!isEnabled()) {
      this.logger?.warn('[ReportConsolidator] Entity is disabled');
      return this._getEmptyReport();
    }

    this.logger?.info('[ReportConsolidator] Starting report consolidation...');

    try {
      // Step 1: Extract key insights from each phase
      const phase1Insights = this._extractPhase1Insights(phase1);
      const phase2Insights = this._extractPhase2Insights(phase2);
      const phase3Insights = this._extractPhase3Insights(phase3);
      const phase4Insights = this._extractPhase4Insights(phase4);
      
      // Step 2: Calculate overall confidence
      const overallConfidence = this._calculateOverallConfidence(phase1, phase2, phase3, phase4);
      
      // Step 3: Build consolidation prompt
      const userPrompt = this._buildConsolidationPrompt(
        phase1Insights,
        phase2Insights,
        phase3Insights,
        phase4Insights,
        overallConfidence
      );
      
      // Step 4: Generate report via LLM
      const llmResult = await this.llmClient.complete(
        this.phase,
        userPrompt,
        SYSTEM_PROMPT
      );
      
      // Step 5: Build final report object
      const report = this._buildFinalReport(
        llmResult,
        phase1,
        phase2,
        phase3,
        phase4,
        overallConfidence
      );
      
      this.logger?.info(`[ReportConsolidator] Report complete. Overall confidence: ${report.overall_confidence.toFixed(2)}`);
      
      return report;

    } catch (error) {
      this.logger?.error(`[ReportConsolidator] Consolidation failed: ${error.message}`);
      return this._getErrorReport(error.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // INSIGHT EXTRACTION FROM PHASES
  // ─────────────────────────────────────────────────────────────────

  _extractPhase1Insights(phase1) {
    if (!phase1) return { available: false };
    
    return {
      available: true,
      businessName: phase1.business_identity?.name?.value || 'Unknown',
      businessNameConfidence: phase1.business_identity?.name?.confidence || 0,
      location: phase1.business_identity?.location || {},
      category: phase1.business_identity?.category?.value || 'Unknown',
      primaryOfferings: (phase1.primary_offerings || []).slice(0, 5).map(o => ({
        name: o.name,
        confidence: o.confidence
      })),
      proofAssets: {
        count: (phase1.proof_assets || []).length,
        types: [...new Set((phase1.proof_assets || []).map(p => p.type))]
      },
      packages: (phase1.offer_structure?.packages || []).length,
      overallConfidence: phase1.overall_confidence || 0
    };
  }

  _extractPhase2Insights(phase2) {
    if (!phase2) return { available: false };
    
    return {
      available: true,
      profilesDiscovered: phase2.profiles_discovered || 0,
      socialProfiles: (phase2.profiles?.social || []).map(s => ({
        platform: s.platform,
        followers: s.followers
      })),
      hasGBP: !!phase2.profiles?.google_business_profile,
      gbpRating: phase2.profiles?.google_business_profile?.rating,
      gbpReviews: phase2.profiles?.google_business_profile?.review_count,
      hasPlayStore: !!phase2.profiles?.play_store,
      b2bListings: (phase2.profiles?.b2b_listings || []).length,
      topThemes: (phase2.social_perception?.last_30_posts?.top_comment_themes || []).slice(0, 5),
      sentimentDistribution: phase2.social_perception?.sentiment_distribution || {},
      ownerReplies: phase2.owner_response_behavior?.replies_exist || false,
      replyRate: phase2.owner_response_behavior?.reply_rate_estimate || 0,
      tonePatterns: phase2.owner_response_behavior?.tone_patterns || [],
      overallConfidence: phase2.overall_confidence || 0
    };
  }

  _extractPhase3Insights(phase3) {
    if (!phase3) return { available: false };
    
    return {
      available: true,
      totalCTAs: phase3.total_ctas || 0,
      trackingTags: phase3.marketing?.tracking_tags || [],
      adPlatforms: phase3.marketing?.ad_platform_ids?.length || 0,
      landingPages: (phase3.landing_pages || []).map(lp => ({
        url: lp.url,
        headline: lp.offer_headline,
        primaryCTAs: (lp.primary_ctas || []).length
      })),
      engagementPaths: (phase3.engagement_paths || []).length,
      salesProcessType: phase3.sales_process?.type || 'unknown',
      entryOffers: phase3.product_journey?.entry_offers || [],
      coreProduct: phase3.product_journey?.core_product || '',
      upsells: (phase3.product_journey?.upsells || []).length,
      crossSells: (phase3.product_journey?.cross_sells || []).length,
      overallConfidence: phase3.overall_confidence || 0
    };
  }

  _extractPhase4Insights(phase4) {
    if (!phase4) return { available: false };
    
    return {
      available: true,
      seedKeywords: phase4.seed_keywords || [],
      competitors: (phase4.competitors || []).map(c => ({
        name: c.name,
        domain: c.domain,
        rank: c.rank,
        positioning: c.positioning,
        primaryOfferings: c.primary_offerings?.slice(0, 3) || [],
        gbpRating: c.gbp_snapshot?.rating,
        gbpReviews: c.gbp_snapshot?.review_count,
        whyPicked: c.why_picked || [],
        score: c.score
      })),
      overallConfidence: phase4.overall_confidence || 0
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // CONFIDENCE CALCULATION
  // ─────────────────────────────────────────────────────────────────

  _calculateOverallConfidence(phase1, phase2, phase3, phase4) {
    const confidences = [];
    const weights = {
      phase1: 0.35, // Business identity is most important
      phase2: 0.20,
      phase3: 0.25,
      phase4: 0.20
    };
    
    if (phase1?.overall_confidence) {
      confidences.push({ value: phase1.overall_confidence, weight: weights.phase1 });
    }
    if (phase2?.overall_confidence) {
      confidences.push({ value: phase2.overall_confidence, weight: weights.phase2 });
    }
    if (phase3?.overall_confidence) {
      confidences.push({ value: phase3.overall_confidence, weight: weights.phase3 });
    }
    if (phase4?.overall_confidence) {
      confidences.push({ value: phase4.overall_confidence, weight: weights.phase4 });
    }
    
    if (confidences.length === 0) return 0;
    
    const totalWeight = confidences.reduce((sum, c) => sum + c.weight, 0);
    const weightedSum = confidences.reduce((sum, c) => sum + c.value * c.weight, 0);
    
    return weightedSum / totalWeight;
  }

  // ─────────────────────────────────────────────────────────────────
  // PROMPT BUILDING
  // ─────────────────────────────────────────────────────────────────

  _buildConsolidationPrompt(phase1, phase2, phase3, phase4, overallConfidence) {
    return `
=== MARKET INTELLIGENCE DATA TO CONSOLIDATE ===

== PHASE 1: BUSINESS IDENTITY ==
${phase1.available ? `
Business Name: ${phase1.businessName} (confidence: ${(phase1.businessNameConfidence * 100).toFixed(0)}%)
Category: ${phase1.category}
Location: ${phase1.location.city || 'Unknown'}, ${phase1.location.country || 'Unknown'}

Primary Offerings:
${phase1.primaryOfferings.map(o => `- ${o.name} (confidence: ${(o.confidence * 100).toFixed(0)}%)`).join('\n') || '- None identified'}

Proof Assets: ${phase1.proofAssets.count} found (types: ${phase1.proofAssets.types.join(', ') || 'none'})
Packages/Plans: ${phase1.packages} identified
Phase 1 Confidence: ${(phase1.overallConfidence * 100).toFixed(0)}%
` : 'Phase 1 data not available'}

== PHASE 2: EXTERNAL PRESENCE & SOCIAL PERCEPTION ==
${phase2.available ? `
Digital Presence:
- Social Profiles: ${phase2.profilesDiscovered} discovered
  ${phase2.socialProfiles.map(s => `  - ${s.platform}: ${s.followers || 'unknown'} followers`).join('\n')}
- Google Business Profile: ${phase2.hasGBP ? `Yes (${phase2.gbpRating}★, ${phase2.gbpReviews} reviews)` : 'Not found'}
- Play Store App: ${phase2.hasPlayStore ? 'Yes' : 'No'}
- B2B Listings: ${phase2.b2bListings}

Social Perception Themes:
${phase2.topThemes.map(t => `- "${t.theme}" (${t.sentiment}, frequency: ${t.frequency})`).join('\n') || '- No themes identified'}

Sentiment Distribution: ${phase2.sentimentDistribution.positive ? `Positive: ${(phase2.sentimentDistribution.positive * 100).toFixed(0)}%, Neutral: ${(phase2.sentimentDistribution.neutral * 100).toFixed(0)}%, Negative: ${(phase2.sentimentDistribution.negative * 100).toFixed(0)}%` : 'Not available'}

Owner Response Behavior:
- Replies to reviews: ${phase2.ownerReplies ? 'Yes' : 'No'}
- Reply rate: ${(phase2.replyRate * 100).toFixed(0)}%
- Tone patterns: ${phase2.tonePatterns.join(', ') || 'Unknown'}

Phase 2 Confidence: ${(phase2.overallConfidence * 100).toFixed(0)}%
` : 'Phase 2 data not available'}

== PHASE 3: MARKETING & CONVERSION ==
${phase3.available ? `
Marketing Infrastructure:
- Tracking tags: ${phase3.trackingTags.join(', ') || 'None detected'}
- Ad platforms: ${phase3.adPlatforms} connected
- Total CTAs detected: ${phase3.totalCTAs}

Landing Pages:
${phase3.landingPages.map(lp => `- ${lp.headline || 'Untitled'} (${lp.primaryCTAs} CTAs)`).join('\n') || '- None analyzed'}

Sales Process: ${phase3.salesProcessType}
Engagement Paths: ${phase3.engagementPaths} mapped

Product Journey:
- Entry offers: ${phase3.entryOffers.join(', ') || 'None identified'}
- Core product: ${phase3.coreProduct || 'Not identified'}
- Upsells: ${phase3.upsells}
- Cross-sells: ${phase3.crossSells}

Phase 3 Confidence: ${(phase3.overallConfidence * 100).toFixed(0)}%
` : 'Phase 3 data not available'}

== PHASE 4: COMPETITIVE LANDSCAPE ==
${phase4.available ? `
Seed Keywords: ${phase4.seedKeywords.slice(0, 5).join(', ')}

Top 3 Competitors:
${phase4.competitors.map(c => `
[#${c.rank}] ${c.name} (${c.domain})
Positioning: ${c.positioning || 'Not determined'}
Key Offerings: ${c.primaryOfferings.join(', ') || 'Unknown'}
GBP: ${c.gbpRating ? `${c.gbpRating}★ (${c.gbpReviews} reviews)` : 'Not found'}
Why selected: ${c.whyPicked.join(', ')}
Score: ${(c.score * 100).toFixed(0)}%
`).join('\n') || 'No competitors identified'}

Phase 4 Confidence: ${(phase4.overallConfidence * 100).toFixed(0)}%
` : 'Phase 4 data not available'}

== OVERALL CONFIDENCE: ${(overallConfidence * 100).toFixed(0)}% ==

=== CONSOLIDATION TASK ===
Create a comprehensive Market Intelligence Report following the structure in the system prompt.
Make it actionable, evidence-based, and executive-ready.
Highlight key insights and specific recommendations.`;
  }

  // ─────────────────────────────────────────────────────────────────
  // FINAL REPORT BUILDING
  // ─────────────────────────────────────────────────────────────────

  _buildFinalReport(llmResult, phase1, phase2, phase3, phase4, overallConfidence) {
    const report = {
      // Metadata
      report_id: `mir_${Date.now()}`,
      generated_at: new Date().toISOString(),
      model_used: llmResult.model,
      
      // Core report content
      report_markdown: llmResult.parsed || llmResult.raw,
      
      // Structured summary
      summary: {
        business_name: phase1?.business_identity?.name?.value || 'Unknown',
        business_url: phase1?.url || '',
        category: phase1?.business_identity?.category?.value || 'Unknown',
        location: phase1?.business_identity?.location || {},
        
        // Key metrics
        metrics: {
          profiles_discovered: phase2?.profiles_discovered || 0,
          gbp_rating: phase2?.profiles?.google_business_profile?.rating || null,
          gbp_reviews: phase2?.profiles?.google_business_profile?.review_count || null,
          total_ctas: phase3?.total_ctas || 0,
          competitors_identified: phase4?.competitors?.length || 0
        }
      },
      
      // Confidence & quality
      overall_confidence: overallConfidence,
      phase_confidences: {
        phase1_website_extraction: phase1?.overall_confidence || 0,
        phase2_external_presence: phase2?.overall_confidence || 0,
        phase3_marketing_conversion: phase3?.overall_confidence || 0,
        phase4_competitor_analysis: phase4?.overall_confidence || 0
      },
      
      // Data quality notes
      data_quality: {
        phases_completed: [
          phase1 ? 'phase1' : null,
          phase2 ? 'phase2' : null,
          phase3 ? 'phase3' : null,
          phase4 ? 'phase4' : null
        ].filter(Boolean),
        phases_missing: [
          !phase1 ? 'phase1' : null,
          !phase2 ? 'phase2' : null,
          !phase3 ? 'phase3' : null,
          !phase4 ? 'phase4' : null
        ].filter(Boolean),
        low_confidence_areas: this._identifyLowConfidenceAreas(phase1, phase2, phase3, phase4)
      },
      
      // Raw phase outputs for reference
      phase_outputs: {
        phase1: phase1 || null,
        phase2: phase2 || null,
        phase3: phase3 || null,
        phase4: phase4 || null
      },
      
      // LLM usage stats
      _metadata: {
        llm_tokens: llmResult.usage,
        generation_model: llmResult.model
      }
    };
    
    return report;
  }

  _identifyLowConfidenceAreas(phase1, phase2, phase3, phase4) {
    const lowConfidence = [];
    const threshold = 0.5;
    
    if (phase1?.overall_confidence < threshold) {
      lowConfidence.push('Business identity extraction');
    }
    if (phase1?.business_identity?.name?.confidence < threshold) {
      lowConfidence.push('Business name identification');
    }
    if (phase2?.overall_confidence < threshold) {
      lowConfidence.push('External presence analysis');
    }
    if (phase3?.overall_confidence < threshold) {
      lowConfidence.push('Marketing & conversion analysis');
    }
    if (phase4?.overall_confidence < threshold) {
      lowConfidence.push('Competitor identification');
    }
    
    return lowConfidence;
  }

  // ─────────────────────────────────────────────────────────────────
  // EMPTY/ERROR REPORTS
  // ─────────────────────────────────────────────────────────────────

  _getEmptyReport() {
    return {
      report_id: `mir_${Date.now()}`,
      generated_at: new Date().toISOString(),
      report_markdown: '# Market Intelligence Report\n\nNo data available for report generation.',
      summary: {},
      overall_confidence: 0,
      phase_confidences: {},
      data_quality: { phases_completed: [], phases_missing: ['phase1', 'phase2', 'phase3', 'phase4'] },
      phase_outputs: {},
      status: 'empty'
    };
  }

  _getErrorReport(error) {
    return {
      report_id: `mir_${Date.now()}`,
      generated_at: new Date().toISOString(),
      report_markdown: `# Market Intelligence Report\n\n**Error:** ${error}`,
      summary: {},
      overall_confidence: 0,
      error: error,
      status: 'failed'
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { ReportConsolidator };
export default ReportConsolidator;
