/**
 * COMPETITOR COMPARISON AGENT
 * ============================
 * 
 * AI agent that simulates a USER comparing options side-by-side.
 * NOT a business analyst. NOT a marketing strategist.
 * 
 * This agent thinks like a REAL USER choosing between options:
 * - "Why would I choose them instead?"
 * - "What feels easier or safer?"
 * - "What is explained better there?"
 * 
 * OUTPUTS:
 * - Competitive disadvantage map
 * - Missing clarity signals
 * - Differentiation gaps
 * 
 * PERSPECTIVE: Always from the user comparing, never from business analysis.
 */

import { isEnabled } from '../feature_flag.js';

// ═══════════════════════════════════════════════════════════════════
// COMPETITOR COMPARISON AGENT CLASS
// ═══════════════════════════════════════════════════════════════════

class CompetitorComparisonAgent {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.agentConfig = config?.aiAgents?.comparisonAgent || {};
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN COMPARISON METHOD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Compare competitors from a user's perspective
   * @param {Object} competitorsEnriched - Enriched competitor data
   * @returns {Object} Comparison analysis
   */
  async compare(competitorsEnriched) {
    // Safety check
    if (!isEnabled() || !this.agentConfig.enabled) {
      this.logger?.warn('Comparison Agent called but is disabled');
      return this._getEmptyComparison();
    }

    if (!competitorsEnriched?.competitors?.length) {
      this.logger?.warn('No competitor data provided for comparison');
      return this._getEmptyComparison();
    }

    this.logger?.info('[ComparisonAgent] Starting comparison analysis...');

    try {
      const competitors = competitorsEnriched.competitors.filter(c => c.enrichmentSuccess);

      if (!competitors.length) {
        this.logger?.warn('No successfully enriched competitors to compare');
        return this._getEmptyComparison();
      }

      const analysis = {
        timestamp: new Date().toISOString(),
        competitorsAnalyzed: competitors.length,
        
        // "Why would I choose them instead?"
        whyChooseThem: await this._analyzeWhyChooseThem(competitors),
        
        // "What feels easier or safer?"
        easeAndSafety: await this._analyzeEaseAndSafety(competitors),
        
        // "What is explained better there?"
        clarityComparison: await this._analyzeClarityComparison(competitors),
        
        // Competitive disadvantage map
        disadvantages: await this._mapDisadvantages(competitors),
        
        // Missing clarity signals
        missingSignals: await this._identifyMissingSignals(competitors),
        
        // Differentiation gaps
        gaps: await this._identifyDifferentiationGaps(competitors),
        
        // Side-by-side matrix
        comparisonMatrix: await this._buildComparisonMatrix(competitors),
        
        // User's likely choice
        userVerdictSimulation: await this._simulateUserVerdict(competitors),
        
        // Confidence score
        confidenceScore: 0,
      };

      analysis.confidenceScore = this._calculateConfidence(analysis);

      this.logger?.info(`[ComparisonAgent] Analysis complete. Confidence: ${analysis.confidenceScore}`);

      return analysis;

    } catch (error) {
      this.logger?.error(`[ComparisonAgent] Comparison failed: ${error.message}`);
      return {
        ...this._getEmptyComparison(),
        error: error.message,
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // "WHY WOULD I CHOOSE THEM INSTEAD?"
  // ─────────────────────────────────────────────────────────────────

  async _analyzeWhyChooseThem(competitors) {
    const reasons = [];

    for (const competitor of competitors) {
      const competitorReasons = {
        domain: competitor.domain,
        reasonsToChoose: [],
        userThought: '',
      };

      // Analyze positioning clarity
      if (competitor.positioning?.headline) {
        competitorReasons.reasonsToChoose.push({
          reason: 'Clear headline',
          detail: competitor.positioning.headline,
          userFeeling: 'I immediately understand what they do',
        });
      }

      // Analyze trust signals
      if (competitor.trustSignals?.trustScore > 0.5) {
        competitorReasons.reasonsToChoose.push({
          reason: 'Strong trust signals',
          detail: this._summarizeTrustSignals(competitor.trustSignals),
          userFeeling: 'I feel more confident they\'re legitimate',
        });
      }

      // Analyze social proof
      if (competitor.trustSignals?.socialProof?.length) {
        competitorReasons.reasonsToChoose.push({
          reason: 'Social proof',
          detail: competitor.trustSignals.socialProof.join(', '),
          userFeeling: 'Others have chosen them, so it must be good',
        });
      }

      // Analyze CTA clarity
      if (competitor.ctaAnalysis?.primaryCta?.length) {
        const ctas = competitor.ctaAnalysis.primaryCta;
        if (ctas.some(c => /free|try|start/i.test(c))) {
          competitorReasons.reasonsToChoose.push({
            reason: 'Low barrier to try',
            detail: ctas.filter(c => /free|try|start/i.test(c)).join(', '),
            userFeeling: 'Easy to get started without risk',
          });
        }
      }

      // Generate user thought summary
      competitorReasons.userThought = this._generateUserThought(competitorReasons.reasonsToChoose);
      
      reasons.push(competitorReasons);
    }

    return {
      byCompetitor: reasons,
      summary: this._summarizeWhyChooseThem(reasons),
    };
  }

  _summarizeTrustSignals(trustSignals) {
    const signals = [];
    if (trustSignals.hasTestimonials) signals.push('testimonials');
    if (trustSignals.hasClientLogos) signals.push('client logos');
    if (trustSignals.hasCertifications) signals.push('certifications');
    if (trustSignals.hasReviews) signals.push('reviews');
    return signals.join(', ') || 'some trust indicators';
  }

  _generateUserThought(reasons) {
    if (!reasons.length) {
      return 'Nothing stands out that would make me choose them.';
    }

    const feelings = reasons.map(r => r.userFeeling).slice(0, 2);
    return `I\'d consider them because: ${feelings.join(', and ')}.`;
  }

  _summarizeWhyChooseThem(allReasons) {
    const allReasonsFlat = allReasons.flatMap(r => r.reasonsToChoose.map(x => x.reason));
    const reasonCounts = {};
    
    for (const reason of allReasonsFlat) {
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }

    const common = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([reason]) => reason);

    if (!common.length) {
      return 'No clear patterns in why users would choose competitors.';
    }

    return `Users are likely drawn to competitors because of: ${common.join(', ')}. ` +
      `These are the factors that make alternatives feel more appealing.`;
  }

  // ─────────────────────────────────────────────────────────────────
  // "WHAT FEELS EASIER OR SAFER?"
  // ─────────────────────────────────────────────────────────────────

  async _analyzeEaseAndSafety(competitors) {
    const analysis = [];

    for (const competitor of competitors) {
      const easeAndSafety = {
        domain: competitor.domain,
        
        // Ease factors
        ease: {
          score: 0,
          factors: [],
        },
        
        // Safety factors
        safety: {
          score: 0,
          factors: [],
        },
        
        userPerception: '',
      };

      // Analyze ease factors
      if (competitor.ctaAnalysis?.frictionReduction) {
        const fr = competitor.ctaAnalysis.frictionReduction;
        
        if (fr.hasNoCreditCard) {
          easeAndSafety.ease.factors.push('No credit card needed to start');
          easeAndSafety.ease.score += 0.3;
        }
        if (fr.hasQuickSetup) {
          easeAndSafety.ease.factors.push('Quick/easy setup promised');
          easeAndSafety.ease.score += 0.25;
        }
        if (fr.hasSupport) {
          easeAndSafety.ease.factors.push('Support available');
          easeAndSafety.ease.score += 0.2;
        }
      }

      // Analyze safety factors
      if (competitor.trustSignals) {
        const ts = competitor.trustSignals;
        
        if (ts.hasCertifications) {
          easeAndSafety.safety.factors.push('Has security certifications');
          easeAndSafety.safety.score += 0.3;
        }
        if (ts.hasSecurityBadges) {
          easeAndSafety.safety.factors.push('Shows security badges');
          easeAndSafety.safety.score += 0.2;
        }
        if (ts.hasReviews) {
          easeAndSafety.safety.factors.push('Third-party reviews available');
          easeAndSafety.safety.score += 0.25;
        }
        if (competitor.ctaAnalysis?.frictionReduction?.hasGuarantee) {
          easeAndSafety.safety.factors.push('Offers money-back guarantee');
          easeAndSafety.safety.score += 0.25;
        }
      }

      // Normalize scores
      easeAndSafety.ease.score = Math.min(1, easeAndSafety.ease.score);
      easeAndSafety.safety.score = Math.min(1, easeAndSafety.safety.score);

      // Generate user perception
      easeAndSafety.userPerception = this._generateEaseSafetyPerception(easeAndSafety);

      analysis.push(easeAndSafety);
    }

    // Rank by combined score
    analysis.sort((a, b) => 
      (b.ease.score + b.safety.score) - (a.ease.score + a.safety.score)
    );

    return {
      byCompetitor: analysis,
      easiestOption: analysis[0]?.domain || 'None identified',
      safestOption: [...analysis].sort((a, b) => b.safety.score - a.safety.score)[0]?.domain || 'None identified',
      userPerspective: this._summarizeEaseSafety(analysis),
    };
  }

  _generateEaseSafetyPerception(easeAndSafety) {
    const easeScore = easeAndSafety.ease.score;
    const safetyScore = easeAndSafety.safety.score;

    if (easeScore > 0.5 && safetyScore > 0.5) {
      return 'This feels both easy to try AND safe - low risk to give it a shot.';
    }
    if (easeScore > 0.5) {
      return 'Getting started seems easy, though I\'d want more reassurance about safety.';
    }
    if (safetyScore > 0.5) {
      return 'They seem trustworthy, but it might take some effort to get started.';
    }
    return 'Neither particularly easy nor clearly safe feeling.';
  }

  _summarizeEaseSafety(analysis) {
    if (!analysis.length) {
      return 'Unable to assess ease and safety of competitors.';
    }

    const easiest = analysis[0];
    const avgEase = analysis.reduce((sum, a) => sum + a.ease.score, 0) / analysis.length;
    const avgSafety = analysis.reduce((sum, a) => sum + a.safety.score, 0) / analysis.length;

    return `Among competitors, ${easiest.domain} feels easiest to try. ` +
      `Average ease score: ${(avgEase * 100).toFixed(0)}%, ` +
      `Average safety score: ${(avgSafety * 100).toFixed(0)}%. ` +
      `Users typically gravitate toward options that minimize risk and effort.`;
  }

  // ─────────────────────────────────────────────────────────────────
  // "WHAT IS EXPLAINED BETTER THERE?"
  // ─────────────────────────────────────────────────────────────────

  async _analyzeClarityComparison(competitors) {
    const clarityAnalysis = [];

    for (const competitor of competitors) {
      const clarity = {
        domain: competitor.domain,
        
        clarityScore: 0,
        clarityFactors: [],
        
        whatTheyExplainWell: [],
        whatRemainConfusing: [],
      };

      // Positioning clarity
      if (competitor.positioning?.headline && competitor.positioning.headline.length < 100) {
        clarity.clarityFactors.push('Concise headline');
        clarity.whatTheyExplainWell.push('What they are');
        clarity.clarityScore += 0.2;
      }

      if (competitor.positioning?.uniqueValueProposition?.detected) {
        clarity.clarityFactors.push('Clear value proposition');
        clarity.whatTheyExplainWell.push('Why they\'re different');
        clarity.clarityScore += 0.25;
      }

      // Offer clarity
      if (competitor.coreOffer?.pricingModel?.length && !competitor.coreOffer.pricingModel.includes('unknown')) {
        clarity.clarityFactors.push('Clear pricing model');
        clarity.whatTheyExplainWell.push('How much it costs');
        clarity.clarityScore += 0.2;
      }

      if (competitor.coreOffer?.targetAudience?.length && !competitor.coreOffer.targetAudience.includes('General')) {
        clarity.clarityFactors.push('Clear target audience');
        clarity.whatTheyExplainWell.push('Who it\'s for');
        clarity.clarityScore += 0.15;
      }

      // Key benefits
      if (competitor.coreOffer?.keyBenefits?.length >= 3) {
        clarity.clarityFactors.push('Multiple clear benefits');
        clarity.whatTheyExplainWell.push('What I\'ll get');
        clarity.clarityScore += 0.2;
      }

      // What's confusing?
      if (!competitor.coreOffer?.pricingModel || competitor.coreOffer.pricingModel.includes('unknown')) {
        clarity.whatRemainConfusing.push('Pricing is unclear');
      }
      if (!competitor.positioning?.subheadline) {
        clarity.whatRemainConfusing.push('Could explain more about how it works');
      }

      clarity.clarityScore = Math.min(1, clarity.clarityScore);
      clarityAnalysis.push(clarity);
    }

    // Sort by clarity score
    clarityAnalysis.sort((a, b) => b.clarityScore - a.clarityScore);

    return {
      byCompetitor: clarityAnalysis,
      clearest: clarityAnalysis[0]?.domain || 'None',
      commonClarityStrengths: this._findCommonClarityStrengths(clarityAnalysis),
      userPerspective: this._summarizeClarity(clarityAnalysis),
    };
  }

  _findCommonClarityStrengths(clarityAnalysis) {
    const allFactors = clarityAnalysis.flatMap(c => c.clarityFactors);
    const counts = {};
    
    for (const factor of allFactors) {
      counts[factor] = (counts[factor] || 0) + 1;
    }

    return Object.entries(counts)
      .filter(([_, count]) => count >= 2)
      .map(([factor, count]) => ({ factor, frequency: count }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  _summarizeClarity(clarityAnalysis) {
    if (!clarityAnalysis.length) {
      return 'Unable to assess competitor clarity.';
    }

    const clearest = clarityAnalysis[0];
    const explained = clearest.whatTheyExplainWell.slice(0, 3).join(', ');

    return `${clearest.domain} explains things most clearly, especially: ${explained}. ` +
      `As a user, I understand what they offer faster than others.`;
  }

  // ─────────────────────────────────────────────────────────────────
  // COMPETITIVE DISADVANTAGE MAPPING
  // ─────────────────────────────────────────────────────────────────

  async _mapDisadvantages(competitors) {
    const disadvantages = [];

    // Find the "best" competitor for each category
    const bestTrust = [...competitors].sort((a, b) => 
      (b.trustSignals?.trustScore || 0) - (a.trustSignals?.trustScore || 0)
    )[0];

    const bestClarity = [...competitors].sort((a, b) => {
      const aScore = a.positioning?.uniqueValueProposition?.detected ? 1 : 0;
      const bScore = b.positioning?.uniqueValueProposition?.detected ? 1 : 0;
      return bScore - aScore;
    })[0];

    // Document disadvantages
    if (bestTrust?.trustSignals?.trustScore > 0.5) {
      disadvantages.push({
        category: 'Trust Signals',
        leader: bestTrust.domain,
        gap: `${bestTrust.domain} has stronger trust indicators (score: ${(bestTrust.trustSignals.trustScore * 100).toFixed(0)}%)`,
        userImpact: 'Users may feel safer choosing them',
        recommendation: 'Add testimonials, certifications, or social proof',
      });
    }

    if (bestClarity?.positioning?.uniqueValueProposition?.detected) {
      disadvantages.push({
        category: 'Positioning Clarity',
        leader: bestClarity.domain,
        gap: `${bestClarity.domain} communicates their value proposition more clearly`,
        userImpact: 'Users understand what they get faster',
        recommendation: 'Simplify and clarify your main headline',
      });
    }

    // Check for free trial advantage
    const hasFreeTrialCompetitor = competitors.find(c => 
      c.coreOffer?.primaryOffer?.hasFreeTrial
    );
    if (hasFreeTrialCompetitor) {
      disadvantages.push({
        category: 'Barrier to Entry',
        leader: hasFreeTrialCompetitor.domain,
        gap: `${hasFreeTrialCompetitor.domain} offers a free trial`,
        userImpact: 'Users can try before committing',
        recommendation: 'Consider offering a free trial or demo',
      });
    }

    return disadvantages;
  }

  // ─────────────────────────────────────────────────────────────────
  // MISSING SIGNALS IDENTIFICATION
  // ─────────────────────────────────────────────────────────────────

  async _identifyMissingSignals(competitors) {
    const missingSignals = [];

    // Check what competitors have that should be standard
    const hasAnyTestimonials = competitors.some(c => c.trustSignals?.hasTestimonials);
    const hasAnyClientLogos = competitors.some(c => c.trustSignals?.hasClientLogos);
    const hasAnyCertifications = competitors.some(c => c.trustSignals?.hasCertifications);
    const hasAnyReviews = competitors.some(c => c.trustSignals?.hasReviews);
    const hasAnyCaseStudies = competitors.some(c => c.trustSignals?.hasCaseStudies);

    if (hasAnyTestimonials) {
      missingSignals.push({
        signal: 'Customer Testimonials',
        competitorsWith: competitors.filter(c => c.trustSignals?.hasTestimonials).map(c => c.domain),
        userExpectation: 'Users expect to see what real customers say',
        importance: 'high',
      });
    }

    if (hasAnyClientLogos) {
      missingSignals.push({
        signal: 'Client/Partner Logos',
        competitorsWith: competitors.filter(c => c.trustSignals?.hasClientLogos).map(c => c.domain),
        userExpectation: 'Users want to know who else uses this',
        importance: 'medium',
      });
    }

    if (hasAnyCertifications) {
      missingSignals.push({
        signal: 'Security/Compliance Certifications',
        competitorsWith: competitors.filter(c => c.trustSignals?.hasCertifications).map(c => c.domain),
        userExpectation: 'Users need assurance about data safety',
        importance: 'high',
      });
    }

    if (hasAnyReviews) {
      missingSignals.push({
        signal: 'Third-Party Reviews (G2, Capterra, etc.)',
        competitorsWith: competitors.filter(c => c.trustSignals?.hasReviews).map(c => c.domain),
        userExpectation: 'Users trust independent review platforms',
        importance: 'high',
      });
    }

    if (hasAnyCaseStudies) {
      missingSignals.push({
        signal: 'Case Studies',
        competitorsWith: competitors.filter(c => c.trustSignals?.hasCaseStudies).map(c => c.domain),
        userExpectation: 'Users want proof of real results',
        importance: 'medium',
      });
    }

    return missingSignals;
  }

  // ─────────────────────────────────────────────────────────────────
  // DIFFERENTIATION GAPS
  // ─────────────────────────────────────────────────────────────────

  async _identifyDifferentiationGaps(competitors) {
    const gaps = [];

    // Analyze positioning uniqueness
    const headlines = competitors
      .filter(c => c.positioning?.headline)
      .map(c => ({
        domain: c.domain,
        headline: c.positioning.headline,
      }));

    // Check for generic positioning
    const genericPatterns = /solution|platform|tool|software|service|best|leading/i;
    const genericCompetitors = headlines.filter(h => genericPatterns.test(h.headline));

    if (genericCompetitors.length >= 2) {
      gaps.push({
        gap: 'Generic Positioning',
        description: 'Multiple competitors use similar generic language',
        examples: genericCompetitors.map(c => `${c.domain}: "${c.headline}"`),
        opportunity: 'A more specific, unique positioning could stand out',
        userPerspective: 'These all sound the same to me, hard to tell them apart',
      });
    }

    // Check for target audience differentiation
    const audienceMap = {};
    for (const c of competitors) {
      const audiences = c.coreOffer?.targetAudience || ['General'];
      for (const audience of audiences) {
        if (!audienceMap[audience]) audienceMap[audience] = [];
        audienceMap[audience].push(c.domain);
      }
    }

    const crowdedAudiences = Object.entries(audienceMap)
      .filter(([_, domains]) => domains.length >= 2);

    if (crowdedAudiences.length) {
      gaps.push({
        gap: 'Crowded Target Audience',
        description: 'Multiple competitors target the same audience segments',
        examples: crowdedAudiences.map(([audience, domains]) => `${audience}: ${domains.join(', ')}`),
        opportunity: 'A more niche focus could reduce competition',
        userPerspective: 'They all say they\'re for me, but which one really understands my needs?',
      });
    }

    return gaps;
  }

  // ─────────────────────────────────────────────────────────────────
  // COMPARISON MATRIX
  // ─────────────────────────────────────────────────────────────────

  async _buildComparisonMatrix(competitors) {
    const criteria = [
      'Positioning Clarity',
      'Trust Signals',
      'Ease of Getting Started',
      'Pricing Clarity',
      'Social Proof',
    ];

    const matrix = {
      criteria,
      competitors: competitors.map(c => ({
        domain: c.domain,
        scores: {
          'Positioning Clarity': c.positioning?.uniqueValueProposition?.detected ? 'Strong' : 'Weak',
          'Trust Signals': this._scoreToLabel(c.trustSignals?.trustScore || 0),
          'Ease of Getting Started': c.ctaAnalysis?.frictionReduction?.hasNoCreditCard ? 'Easy' : 'Moderate',
          'Pricing Clarity': (c.coreOffer?.pricingModel && !c.coreOffer.pricingModel.includes('unknown')) ? 'Clear' : 'Unclear',
          'Social Proof': c.trustSignals?.socialProof?.length ? 'Present' : 'Missing',
        },
      })),
    };

    return matrix;
  }

  _scoreToLabel(score) {
    if (score >= 0.7) return 'Strong';
    if (score >= 0.4) return 'Moderate';
    return 'Weak';
  }

  // ─────────────────────────────────────────────────────────────────
  // USER VERDICT SIMULATION
  // ─────────────────────────────────────────────────────────────────

  async _simulateUserVerdict(competitors) {
    // Score each competitor from user perspective
    const scored = competitors.map(c => {
      let score = 0;
      
      // Trust matters most
      score += (c.trustSignals?.trustScore || 0) * 0.35;
      
      // Clarity matters
      if (c.positioning?.uniqueValueProposition?.detected) score += 0.25;
      
      // Ease of trying
      if (c.ctaAnalysis?.frictionReduction?.hasNoCreditCard) score += 0.2;
      
      // Social proof
      if (c.trustSignals?.socialProof?.length) score += 0.2;

      return {
        domain: c.domain,
        score,
        strengths: this._summarizeStrengths(c),
        weaknesses: this._summarizeWeaknesses(c),
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const likely = scored[0];
    const runnerUp = scored[1];

    return {
      likelyChoice: likely?.domain || 'Unknown',
      likelyChoiceReason: likely ? `Best combination of ${likely.strengths.join(' and ')}` : 'Unable to determine',
      runnerUp: runnerUp?.domain || 'None',
      userThought: this._generateUserVerdictThought(likely, runnerUp),
      allScored: scored,
    };
  }

  _summarizeStrengths(competitor) {
    const strengths = [];
    
    if (competitor.trustSignals?.trustScore > 0.5) {
      strengths.push('trustworthiness');
    }
    if (competitor.positioning?.uniqueValueProposition?.detected) {
      strengths.push('clear messaging');
    }
    if (competitor.ctaAnalysis?.frictionReduction?.hasNoCreditCard) {
      strengths.push('easy to try');
    }
    
    return strengths.length ? strengths : ['no clear strengths identified'];
  }

  _summarizeWeaknesses(competitor) {
    const weaknesses = [];
    
    if (!competitor.trustSignals?.trustScore || competitor.trustSignals.trustScore < 0.3) {
      weaknesses.push('lacks trust signals');
    }
    if (!competitor.positioning?.uniqueValueProposition?.detected) {
      weaknesses.push('unclear value proposition');
    }
    if (!competitor.trustSignals?.socialProof?.length) {
      weaknesses.push('no social proof');
    }
    
    return weaknesses.length ? weaknesses : ['no obvious weaknesses'];
  }

  _generateUserVerdictThought(likely, runnerUp) {
    if (!likely) {
      return 'Hard to choose - none of them really stand out.';
    }

    if (!runnerUp) {
      return `${likely.domain} is the obvious choice since they're the only strong option.`;
    }

    return `If I had to pick right now, I\'d probably go with ${likely.domain} ` +
      `because of their ${likely.strengths[0] || 'overall presentation'}. ` +
      `${runnerUp.domain} is a close second though.`;
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────

  _calculateConfidence(analysis) {
    let score = 0;

    if (analysis.whyChooseThem?.byCompetitor?.length) score += 0.2;
    if (analysis.easeAndSafety?.byCompetitor?.length) score += 0.2;
    if (analysis.clarityComparison?.byCompetitor?.length) score += 0.2;
    if (analysis.disadvantages?.length) score += 0.15;
    if (analysis.missingSignals?.length) score += 0.1;
    if (analysis.gaps?.length) score += 0.15;

    return Math.round(score * 100) / 100;
  }

  _getEmptyComparison() {
    return {
      timestamp: new Date().toISOString(),
      competitorsAnalyzed: 0,
      whyChooseThem: null,
      easeAndSafety: null,
      clarityComparison: null,
      disadvantages: [],
      missingSignals: [],
      gaps: [],
      comparisonMatrix: null,
      userVerdictSimulation: null,
      confidenceScore: 0,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { CompetitorComparisonAgent };
export default CompetitorComparisonAgent;
