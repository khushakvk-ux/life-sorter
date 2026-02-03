/**
 * SERP USER INTENT AGENT
 * =======================
 * 
 * AI agent that analyzes SERP data from a USER'S perspective.
 * NOT an SEO analyst. NOT a marketing advisor.
 * 
 * This agent thinks like a REAL USER searching for solutions:
 * - What are they actually trying to solve?
 * - Why do certain results feel more clickable?
 * - What language/promises attract attention?
 * 
 * OUTPUTS:
 * - User intent clusters
 * - Trust & authority perception
 * - Why competitors appear convincing
 * 
 * DOES NOT:
 * - Explain SEO theory
 * - Give marketing advice
 * - Analyze from business perspective
 */

import { isEnabled } from '../feature_flag.js';

// ═══════════════════════════════════════════════════════════════════
// SERP USER INTENT AGENT CLASS
// ═══════════════════════════════════════════════════════════════════

class SerpUserIntentAgent {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.agentConfig = config?.aiAgents?.userIntentAgent || {};
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN ANALYSIS METHOD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Analyze SERP data from a user's perspective
   * @param {Object} serpDiscovery - SERP discovery results
   * @returns {Object} User intent analysis
   */
  async analyze(serpDiscovery) {
    // Safety check
    if (!isEnabled() || !this.agentConfig.enabled) {
      this.logger?.warn('User Intent Agent called but is disabled');
      return this._getEmptyAnalysis();
    }

    if (!serpDiscovery?.results?.length) {
      this.logger?.warn('No SERP data provided for analysis');
      return this._getEmptyAnalysis();
    }

    this.logger?.info('[UserIntentAgent] Starting analysis...');

    try {
      // Analyze from user perspective
      const analysis = {
        timestamp: new Date().toISOString(),
        
        // What is the user trying to solve?
        userIntentClusters: await this._identifyIntentClusters(serpDiscovery),
        
        // Why do certain results feel clickable?
        clickabilityFactors: await this._analyzeClickability(serpDiscovery),
        
        // Trust and authority perception
        trustPerception: await this._analyzeTrustPerception(serpDiscovery),
        
        // Language patterns that attract attention
        attractiveLanguage: await this._analyzeAttractiveLanguage(serpDiscovery),
        
        // What's making users choose competitors?
        competitorAppeal: await this._analyzeCompetitorAppeal(serpDiscovery),
        
        // User's likely decision journey
        decisionJourney: await this._mapDecisionJourney(serpDiscovery),
        
        // Overall confidence
        confidenceScore: 0,
      };

      // Calculate overall confidence
      analysis.confidenceScore = this._calculateConfidence(analysis);

      this.logger?.info(`[UserIntentAgent] Analysis complete. Confidence: ${analysis.confidenceScore}`);

      return analysis;

    } catch (error) {
      this.logger?.error(`[UserIntentAgent] Analysis failed: ${error.message}`);
      return {
        ...this._getEmptyAnalysis(),
        error: error.message,
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // USER INTENT CLUSTER ANALYSIS
  // ─────────────────────────────────────────────────────────────────

  async _identifyIntentClusters(serpDiscovery) {
    const clusters = [];
    const queries = serpDiscovery.queries || [];
    const results = serpDiscovery.results || [];
    const paaQuestions = this._extractAllPaaQuestions(results);

    // Cluster 1: Problem-Aware (user knows they have a problem)
    const problemAware = {
      name: 'Problem-Aware',
      description: 'User recognizes they have a challenge to solve',
      indicators: [],
      strength: 0,
    };

    // Cluster 2: Solution-Seeking (actively looking for solutions)
    const solutionSeeking = {
      name: 'Solution-Seeking',
      description: 'User is actively searching for a solution',
      indicators: [],
      strength: 0,
    };

    // Cluster 3: Comparison Mode (evaluating options)
    const comparisonMode = {
      name: 'Comparison-Mode',
      description: 'User is comparing different options',
      indicators: [],
      strength: 0,
    };

    // Cluster 4: Validation-Seeking (wants social proof)
    const validationSeeking = {
      name: 'Validation-Seeking',
      description: 'User wants confirmation before deciding',
      indicators: [],
      strength: 0,
    };

    // Analyze queries for intent signals
    for (const query of queries) {
      const q = query.toLowerCase();
      
      if (q.includes('how to') || q.includes('help with') || q.includes('solve')) {
        problemAware.indicators.push(query);
        problemAware.strength += 0.25;
      }
      
      if (q.includes('best') || q.includes('top') || q.includes('alternatives')) {
        solutionSeeking.indicators.push(query);
        solutionSeeking.strength += 0.25;
      }
      
      if (q.includes('vs') || q.includes('compare') || q.includes('difference')) {
        comparisonMode.indicators.push(query);
        comparisonMode.strength += 0.25;
      }
      
      if (q.includes('review') || q.includes('rating') || q.includes('reliable')) {
        validationSeeking.indicators.push(query);
        validationSeeking.strength += 0.25;
      }
    }

    // Analyze PAA questions for intent signals
    for (const question of paaQuestions) {
      const q = question.toLowerCase();
      
      if (q.includes('what is') || q.includes('why') || q.includes('problem')) {
        problemAware.indicators.push(`PAA: ${question}`);
        problemAware.strength += 0.15;
      }
      
      if (q.includes('best') || q.includes('recommend') || q.includes('should i')) {
        solutionSeeking.indicators.push(`PAA: ${question}`);
        solutionSeeking.strength += 0.15;
      }
      
      if (q.includes('better') || q.includes('versus') || q.includes('difference')) {
        comparisonMode.indicators.push(`PAA: ${question}`);
        comparisonMode.strength += 0.15;
      }
    }

    // Normalize strengths
    [problemAware, solutionSeeking, comparisonMode, validationSeeking].forEach(cluster => {
      cluster.strength = Math.min(1, cluster.strength);
      if (cluster.strength > 0) {
        clusters.push(cluster);
      }
    });

    // Sort by strength
    clusters.sort((a, b) => b.strength - a.strength);

    return {
      primaryIntent: clusters[0]?.name || 'Unknown',
      clusters,
      userMindset: this._describeUserMindset(clusters),
    };
  }

  _describeUserMindset(clusters) {
    if (!clusters.length) {
      return 'User intent is unclear from search data';
    }

    const primary = clusters[0];
    
    if (primary.name === 'Problem-Aware') {
      return 'User is in early discovery phase, still understanding their challenge. They need education and clarity.';
    }
    if (primary.name === 'Solution-Seeking') {
      return 'User knows what they need and is actively hunting for the right solution. They want clear options.';
    }
    if (primary.name === 'Comparison-Mode') {
      return 'User has narrowed down options and is comparing specifics. They want differentiation.';
    }
    if (primary.name === 'Validation-Seeking') {
      return 'User is close to deciding but needs reassurance. They want proof and trust signals.';
    }
    
    return 'User shows mixed intent signals across the decision journey.';
  }

  // ─────────────────────────────────────────────────────────────────
  // CLICKABILITY ANALYSIS
  // ─────────────────────────────────────────────────────────────────

  async _analyzeClickability(serpDiscovery) {
    const factors = [];
    const results = serpDiscovery.results || [];
    
    for (const searchResult of results) {
      const organic = searchResult?.organicResults || [];
      
      for (const item of organic.slice(0, 5)) { // Top 5 results
        const clickFactors = this._analyzeResultClickability(item);
        factors.push({
          position: item.position,
          title: item.title,
          domain: item.domain,
          factors: clickFactors,
        });
      }
    }

    // Aggregate common factors
    const commonFactors = this._aggregateClickFactors(factors);

    return {
      topResults: factors.slice(0, 10),
      commonFactors,
      userPerspective: this._explainClickabilityAsUser(commonFactors),
    };
  }

  _analyzeResultClickability(result) {
    const factors = [];
    const title = (result.title || '').toLowerCase();
    const snippet = (result.snippet || '').toLowerCase();

    // Numbers and specificity
    if (/\d+/.test(result.title)) {
      factors.push({
        factor: 'Uses specific numbers',
        example: result.title,
        impact: 'Numbers create credibility and specificity',
      });
    }

    // Current year reference
    if (/2026|2025|updated|latest/i.test(title)) {
      factors.push({
        factor: 'Shows freshness/recency',
        example: result.title,
        impact: 'User trusts recent information more',
      });
    }

    // Promise of value
    if (/best|top|ultimate|complete|guide/i.test(title)) {
      factors.push({
        factor: 'Promises comprehensive value',
        example: result.title,
        impact: 'User expects one-stop solution',
      });
    }

    // Clear benefit
    if (/save|easy|fast|free|simple/i.test(title + snippet)) {
      factors.push({
        factor: 'Clear benefit stated',
        example: result.title,
        impact: 'User immediately sees what they get',
      });
    }

    // Trust indicators in snippet
    if (/trusted|verified|certified|award/i.test(snippet)) {
      factors.push({
        factor: 'Trust signals present',
        example: result.snippet?.substring(0, 100),
        impact: 'User feels safer clicking',
      });
    }

    return factors;
  }

  _aggregateClickFactors(allFactors) {
    const factorCounts = {};
    
    for (const result of allFactors) {
      for (const factor of result.factors) {
        const key = factor.factor;
        if (!factorCounts[key]) {
          factorCounts[key] = { count: 0, examples: [], impact: factor.impact };
        }
        factorCounts[key].count++;
        if (factorCounts[key].examples.length < 3) {
          factorCounts[key].examples.push(factor.example);
        }
      }
    }

    return Object.entries(factorCounts)
      .map(([factor, data]) => ({
        factor,
        frequency: data.count,
        examples: data.examples,
        impact: data.impact,
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  _explainClickabilityAsUser(commonFactors) {
    if (!commonFactors.length) {
      return 'No clear clickability patterns detected.';
    }

    const topFactor = commonFactors[0];
    
    return `As a user scanning these results, I'm most drawn to titles that ${topFactor.factor.toLowerCase()}. ` +
      `This makes me feel like ${topFactor.impact.toLowerCase()}. ` +
      `I'd be more likely to click something that stands out with these qualities.`;
  }

  // ─────────────────────────────────────────────────────────────────
  // TRUST PERCEPTION ANALYSIS
  // ─────────────────────────────────────────────────────────────────

  async _analyzeTrustPerception(serpDiscovery) {
    const results = serpDiscovery.results || [];
    const trustSignals = [];

    for (const searchResult of results) {
      // Analyze organic results for trust
      for (const item of (searchResult.organicResults || []).slice(0, 5)) {
        trustSignals.push({
          domain: item.domain,
          signals: this._extractTrustSignalsFromResult(item),
          authorityScore: this._estimateAuthorityScore(item),
        });
      }
    }

    // Find most trusted domains
    const sortedByAuthority = [...trustSignals].sort((a, b) => b.authorityScore - a.authorityScore);

    return {
      topTrustedDomains: sortedByAuthority.slice(0, 5),
      trustPatterns: this._identifyTrustPatterns(trustSignals),
      userPerception: this._explainTrustAsUser(sortedByAuthority),
    };
  }

  _extractTrustSignalsFromResult(result) {
    const signals = [];
    const title = result.title || '';
    const snippet = result.snippet || '';
    const combined = `${title} ${snippet}`.toLowerCase();

    if (result.hasSitelinks) {
      signals.push('Has sitelinks (established site)');
    }
    if (result.hasRichSnippet) {
      signals.push('Has rich snippet (Google trusts this)');
    }
    if (/official|\.gov|\.org|\.edu/.test(result.domain || '')) {
      signals.push('Authoritative domain type');
    }
    if (/since \d{4}|years|established|founded/i.test(combined)) {
      signals.push('Shows longevity');
    }
    if (/million|thousand|enterprise|fortune/i.test(combined)) {
      signals.push('Scale indicators');
    }

    return signals;
  }

  _estimateAuthorityScore(result) {
    let score = 0;
    
    // Position matters
    score += Math.max(0, (10 - (result.position || 10)) * 0.05);
    
    // Sitelinks = trust
    if (result.hasSitelinks) score += 0.2;
    
    // Rich snippet = Google approval
    if (result.hasRichSnippet) score += 0.15;
    
    // Known domain patterns
    const domain = result.domain || '';
    if (domain.endsWith('.gov') || domain.endsWith('.edu')) score += 0.3;
    if (domain.endsWith('.org')) score += 0.1;
    
    return Math.min(1, score);
  }

  _identifyTrustPatterns(trustSignals) {
    const patterns = [];
    const allSignals = trustSignals.flatMap(t => t.signals);
    
    const signalCounts = {};
    for (const signal of allSignals) {
      signalCounts[signal] = (signalCounts[signal] || 0) + 1;
    }

    for (const [signal, count] of Object.entries(signalCounts)) {
      if (count >= 2) {
        patterns.push({
          signal,
          frequency: count,
          implication: this._getSignalImplication(signal),
        });
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  _getSignalImplication(signal) {
    const implications = {
      'Has sitelinks (established site)': 'Users see this as a credible, established player',
      'Has rich snippet (Google trusts this)': 'Google\'s endorsement increases user trust',
      'Shows longevity': 'Being around longer means reliability to users',
      'Scale indicators': 'Big numbers suggest proven success',
    };
    return implications[signal] || 'Contributes to overall trustworthiness';
  }

  _explainTrustAsUser(sortedDomains) {
    if (!sortedDomains.length) {
      return 'No clear trust leaders in results.';
    }

    const top = sortedDomains[0];
    const signals = top.signals.join(', ').toLowerCase();

    return `Looking at these results, ${top.domain} feels most trustworthy because it ${signals || 'appears professionally presented'}. ` +
      `As a user, I\'d feel more comfortable starting there.`;
  }

  // ─────────────────────────────────────────────────────────────────
  // ATTRACTIVE LANGUAGE ANALYSIS
  // ─────────────────────────────────────────────────────────────────

  async _analyzeAttractiveLanguage(serpDiscovery) {
    const results = serpDiscovery.results || [];
    const languagePatterns = [];

    for (const searchResult of results) {
      for (const item of (searchResult.organicResults || []).slice(0, 10)) {
        const patterns = this._extractLanguagePatterns(item);
        languagePatterns.push(...patterns);
      }
    }

    // Group by category
    const grouped = this._groupLanguagePatterns(languagePatterns);

    return {
      patterns: grouped,
      mostEffective: grouped.slice(0, 5),
      userPerspective: this._explainLanguageAsUser(grouped),
    };
  }

  _extractLanguagePatterns(result) {
    const patterns = [];
    const title = result.title || '';
    const snippet = result.snippet || '';

    // Power words
    const powerWords = ['ultimate', 'complete', 'essential', 'proven', 'powerful', 'simple', 'easy', 'fast'];
    for (const word of powerWords) {
      if (title.toLowerCase().includes(word) || snippet.toLowerCase().includes(word)) {
        patterns.push({
          category: 'Power Words',
          word,
          context: title,
          effect: 'Creates emotional response and urgency',
        });
      }
    }

    // Benefit language
    if (/save|grow|boost|improve|increase|reduce/i.test(title + snippet)) {
      patterns.push({
        category: 'Benefit-Focused',
        word: title.match(/save|grow|boost|improve|increase|reduce/i)?.[0],
        context: title,
        effect: 'User immediately sees value',
      });
    }

    // Numbers and specificity
    const numberMatch = title.match(/\d+/);
    if (numberMatch) {
      patterns.push({
        category: 'Specificity',
        word: numberMatch[0],
        context: title,
        effect: 'Concrete numbers build credibility',
      });
    }

    return patterns;
  }

  _groupLanguagePatterns(patterns) {
    const grouped = {};
    
    for (const pattern of patterns) {
      if (!grouped[pattern.category]) {
        grouped[pattern.category] = {
          category: pattern.category,
          examples: [],
          effect: pattern.effect,
          count: 0,
        };
      }
      grouped[pattern.category].count++;
      if (grouped[pattern.category].examples.length < 3) {
        grouped[pattern.category].examples.push(pattern.word);
      }
    }

    return Object.values(grouped).sort((a, b) => b.count - a.count);
  }

  _explainLanguageAsUser(grouped) {
    if (!grouped.length) {
      return 'No distinctive language patterns detected.';
    }

    const top = grouped[0];
    
    return `The language that catches my eye uses ${top.category.toLowerCase()} like "${top.examples.join('", "')}". ` +
      `This ${top.effect.toLowerCase()}.`;
  }

  // ─────────────────────────────────────────────────────────────────
  // COMPETITOR APPEAL ANALYSIS
  // ─────────────────────────────────────────────────────────────────

  async _analyzeCompetitorAppeal(serpDiscovery) {
    const topDomains = serpDiscovery.aggregatedDomains?.slice(0, 5) || [];
    const appealAnalysis = [];

    for (const domain of topDomains) {
      appealAnalysis.push({
        domain: domain.domain,
        occurrences: domain.occurrences,
        appealFactors: this._identifyAppealFactors(domain),
        whyUsersChoose: this._explainWhyUsersChoose(domain),
      });
    }

    return {
      topCompetitors: appealAnalysis,
      commonAppealFactors: this._findCommonAppealFactors(appealAnalysis),
    };
  }

  _identifyAppealFactors(domain) {
    const factors = [];
    
    if (domain.occurrences >= 3) {
      factors.push('Appears consistently across searches (visibility = credibility)');
    }
    
    if (domain.positions?.some(p => p <= 3)) {
      factors.push('Ranks in top 3 (Google thinks it\'s relevant)');
    }
    
    if (domain.firstSeen?.hasSitelinks) {
      factors.push('Has sitelinks (established presence)');
    }

    return factors;
  }

  _explainWhyUsersChoose(domain) {
    const avgPosition = domain.positions?.length 
      ? domain.positions.reduce((a, b) => a + b, 0) / domain.positions.length 
      : 10;

    if (avgPosition <= 2) {
      return 'Users see it first and it appears most relevant';
    }
    if (avgPosition <= 5) {
      return 'Strong visibility makes it a natural consideration';
    }
    return 'Consistently appears which builds familiarity';
  }

  _findCommonAppealFactors(appealAnalysis) {
    const allFactors = appealAnalysis.flatMap(a => a.appealFactors);
    const factorCounts = {};
    
    for (const factor of allFactors) {
      factorCounts[factor] = (factorCounts[factor] || 0) + 1;
    }

    return Object.entries(factorCounts)
      .filter(([_, count]) => count >= 2)
      .map(([factor, count]) => ({ factor, frequency: count }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  // ─────────────────────────────────────────────────────────────────
  // DECISION JOURNEY MAPPING
  // ─────────────────────────────────────────────────────────────────

  async _mapDecisionJourney(serpDiscovery) {
    const paaQuestions = this._extractAllPaaQuestions(serpDiscovery.results || []);
    const relatedSearches = this._extractAllRelatedSearches(serpDiscovery.results || []);

    return {
      stages: [
        {
          stage: 'Awareness',
          questions: paaQuestions.filter(q => /what|why|how|problem/i.test(q)).slice(0, 3),
          userThinking: 'What exactly is this and do I need it?',
        },
        {
          stage: 'Consideration',
          questions: paaQuestions.filter(q => /best|compare|vs|difference/i.test(q)).slice(0, 3),
          userThinking: 'What are my options and how do they differ?',
        },
        {
          stage: 'Decision',
          questions: paaQuestions.filter(q => /price|cost|worth|should/i.test(q)).slice(0, 3),
          userThinking: 'Is this the right choice for me?',
        },
      ],
      likelyNextSearches: relatedSearches.slice(0, 5),
      journeySummary: this._summarizeJourney(paaQuestions),
    };
  }

  _summarizeJourney(questions) {
    if (!questions.length) {
      return 'Unable to map user journey from available data.';
    }

    return 'Users typically start by understanding the problem, then compare options, ' +
      'and finally seek validation before deciding. The questions people ask reveal ' +
      'they want clarity, comparison, and confidence.';
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────────

  _extractAllPaaQuestions(results) {
    const questions = [];
    for (const result of results) {
      for (const paa of (result.peopleAlsoAsk || [])) {
        if (paa.question) {
          questions.push(paa.question);
        }
      }
    }
    return [...new Set(questions)];
  }

  _extractAllRelatedSearches(results) {
    const searches = [];
    for (const result of results) {
      for (const related of (result.relatedSearches || [])) {
        if (related.query) {
          searches.push(related.query);
        }
      }
    }
    return [...new Set(searches)];
  }

  _calculateConfidence(analysis) {
    let score = 0;
    let factors = 0;

    if (analysis.userIntentClusters?.clusters?.length) {
      score += 0.25;
    }
    factors++;

    if (analysis.clickabilityFactors?.commonFactors?.length) {
      score += 0.2;
    }
    factors++;

    if (analysis.trustPerception?.topTrustedDomains?.length) {
      score += 0.2;
    }
    factors++;

    if (analysis.attractiveLanguage?.patterns?.length) {
      score += 0.15;
    }
    factors++;

    if (analysis.competitorAppeal?.topCompetitors?.length) {
      score += 0.2;
    }
    factors++;

    return Math.round(score * 100) / 100;
  }

  _getEmptyAnalysis() {
    return {
      timestamp: new Date().toISOString(),
      userIntentClusters: null,
      clickabilityFactors: null,
      trustPerception: null,
      attractiveLanguage: null,
      competitorAppeal: null,
      decisionJourney: null,
      confidenceScore: 0,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { SerpUserIntentAgent };
export default SerpUserIntentAgent;
