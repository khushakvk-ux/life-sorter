/**
 * SERP SEARCH SCRAPER
 * ====================
 * 
 * Performs search engine results page (SERP) discovery.
 * Simulates how a real user searches for alternatives online.
 * 
 * ISOLATION GUARANTEES:
 * - No imports from core application
 * - Uses only local config files
 * - All API keys from environment variables
 * - Outputs JSON only - no database writes
 * 
 * EXTRACTS:
 * - Organic search results
 * - Local pack (if available)
 * - Ads (marked separately)
 * - People-also-ask questions
 * - Related searches
 */

import { isEnabled } from '../feature_flag.js';

// ═══════════════════════════════════════════════════════════════════
// SERP SEARCH SCRAPER CLASS
// ═══════════════════════════════════════════════════════════════════

class SerpSearchScraper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.serpConfig = config?.search || {};
    this.apiConfig = config?.api || {};
    this.rateLimiter = new RateLimiter(config?.rateLimiting);
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN SEARCH METHOD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Execute a SERP search for a given query
   * @param {string} query - Search query
   * @returns {Object} Structured SERP results
   */
  async search(query) {
    // Safety check
    if (!isEnabled()) {
      this.logger?.warn('SERP scraper called but entity is disabled');
      return null;
    }

    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query provided');
    }

    const startTime = Date.now();
    this.logger?.info(`[SERP] Searching: "${query}"`);

    try {
      // Apply rate limiting
      await this.rateLimiter.wait();

      // Execute search (API or mock based on availability)
      const rawResults = await this._executeSearch(query);

      // Parse and structure results
      const structuredResults = this._parseResults(rawResults, query);

      const duration = Date.now() - startTime;
      this.logger?.info(`[SERP] Search completed in ${duration}ms`);

      return structuredResults;

    } catch (error) {
      this.logger?.error(`[SERP] Search failed: ${error.message}`);
      return {
        query,
        error: error.message,
        timestamp: new Date().toISOString(),
        success: false,
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // SEARCH EXECUTION
  // ─────────────────────────────────────────────────────────────────

  async _executeSearch(query) {
    const apiKey = this._getApiKey();

    if (!apiKey) {
      this.logger?.warn('[SERP] No API key found, using mock data');
      return this._getMockResults(query);
    }

    const provider = this.apiConfig.provider || 'serpapi';
    
    switch (provider) {
      case 'serpapi':
        return await this._searchSerpApi(query, apiKey);
      case 'valueserp':
        return await this._searchValueSerp(query, apiKey);
      case 'serper':
        return await this._searchSerper(query, apiKey);
      default:
        this.logger?.warn(`[SERP] Unknown provider: ${provider}, using mock`);
        return this._getMockResults(query);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // API INTEGRATIONS
  // ─────────────────────────────────────────────────────────────────

  async _searchSerpApi(query, apiKey) {
    const baseUrl = this.apiConfig.baseUrl || 'https://serpapi.com/search';
    const params = new URLSearchParams({
      q: query,
      api_key: apiKey,
      engine: this.serpConfig.engine || 'google',
      location: this.serpConfig.defaultLocation || 'United States',
      hl: this.serpConfig.defaultLanguage || 'en',
      num: this.serpConfig.resultsPerQuery || 10,
    });

    const url = `${baseUrl}?${params.toString()}`;
    
    const response = await this._fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    return await response.json();
  }

  async _searchValueSerp(query, apiKey) {
    const url = 'https://api.valueserp.com/search';
    const params = new URLSearchParams({
      q: query,
      api_key: apiKey,
      location: this.serpConfig.defaultLocation || 'United States',
      num: this.serpConfig.resultsPerQuery || 10,
    });

    const response = await this._fetchWithTimeout(`${url}?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`ValueSERP error: ${response.status}`);
    }

    return await response.json();
  }

  async _searchSerper(query, apiKey) {
    const url = 'https://google.serper.dev/search';
    
    const response = await this._fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        q: query,
        location: this.serpConfig.defaultLocation || 'United States',
        num: this.serpConfig.resultsPerQuery || 10,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Serper error: ${response.status}`);
    }

    return await response.json();
  }

  // ─────────────────────────────────────────────────────────────────
  // RESULTS PARSING
  // ─────────────────────────────────────────────────────────────────

  _parseResults(rawResults, query) {
    const timestamp = new Date().toISOString();
    
    return {
      query,
      timestamp,
      success: true,
      
      // Organic Results
      organicResults: this._parseOrganicResults(rawResults),
      
      // Ads (marked separately)
      ads: this._parseAds(rawResults),
      
      // Local Pack
      localPack: this._parseLocalPack(rawResults),
      
      // People Also Ask
      peopleAlsoAsk: this._parsePeopleAlsoAsk(rawResults),
      
      // Related Searches
      relatedSearches: this._parseRelatedSearches(rawResults),
      
      // Knowledge Graph (if available)
      knowledgeGraph: this._parseKnowledgeGraph(rawResults),
      
      // Domain frequency analysis
      domainFrequency: this._analyzeDomainFrequency(rawResults),
      
      // Confidence score for this search
      confidenceScore: this._calculateConfidenceScore(rawResults),
    };
  }

  _parseOrganicResults(raw) {
    const results = raw?.organic_results || raw?.organic || raw?.results || [];
    const maxResults = this.config?.extraction?.maxOrganicResults || 10;
    
    return results.slice(0, maxResults).map((item, index) => ({
      position: item.position || index + 1,
      title: item.title || '',
      url: item.link || item.url || '',
      domain: this._extractDomain(item.link || item.url),
      snippet: item.snippet || item.description || '',
      displayedUrl: item.displayed_link || item.displayedUrl || '',
      // Additional metadata
      hasSitelinks: !!(item.sitelinks?.length),
      hasRichSnippet: !!(item.rich_snippet),
      isFeatured: !!(item.featured),
    }));
  }

  _parseAds(raw) {
    const ads = raw?.ads || raw?.paid_results || [];
    const maxAds = this.config?.extraction?.maxAdsResults || 5;
    
    return ads.slice(0, maxAds).map((ad, index) => ({
      position: ad.position || index + 1,
      title: ad.title || '',
      url: ad.link || ad.url || '',
      domain: this._extractDomain(ad.link || ad.url),
      description: ad.description || ad.snippet || '',
      isAd: true, // Always mark as ad
      adType: ad.block_position || 'unknown',
    }));
  }

  _parseLocalPack(raw) {
    const localPack = raw?.local_results || raw?.local_pack || raw?.places || [];
    
    return localPack.map((place, index) => ({
      position: place.position || index + 1,
      title: place.title || place.name || '',
      address: place.address || '',
      phone: place.phone || '',
      rating: place.rating || null,
      reviewCount: place.reviews || place.review_count || 0,
      type: place.type || place.category || '',
      website: place.website || place.link || '',
      domain: this._extractDomain(place.website || place.link),
      isLocalResult: true,
    }));
  }

  _parsePeopleAlsoAsk(raw) {
    const paa = raw?.related_questions || raw?.people_also_ask || [];
    
    return paa.map((item, index) => ({
      position: index + 1,
      question: item.question || item.title || '',
      snippet: item.snippet || item.answer || '',
      source: item.source?.name || item.source || '',
      sourceUrl: item.source?.link || item.link || '',
    }));
  }

  _parseRelatedSearches(raw) {
    const related = raw?.related_searches || raw?.related || [];
    
    return related.map((item, index) => ({
      position: index + 1,
      query: item.query || item.text || item,
    }));
  }

  _parseKnowledgeGraph(raw) {
    const kg = raw?.knowledge_graph || null;
    if (!kg) return null;
    
    return {
      title: kg.title || '',
      type: kg.type || '',
      description: kg.description || '',
      website: kg.website || '',
      attributes: kg.attributes || {},
    };
  }

  _analyzeDomainFrequency(raw) {
    const organicResults = raw?.organic_results || raw?.organic || raw?.results || [];
    const domainCounts = {};
    
    for (const result of organicResults) {
      const domain = this._extractDomain(result.link || result.url);
      if (domain) {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    }
    
    return Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);
  }

  _calculateConfidenceScore(raw) {
    let score = 0;
    let factors = 0;
    
    // Has organic results
    if (raw?.organic_results?.length || raw?.organic?.length) {
      score += 0.4;
    }
    factors++;
    
    // Has local pack
    if (raw?.local_results?.length || raw?.local_pack?.length) {
      score += 0.2;
    }
    factors++;
    
    // Has related searches
    if (raw?.related_searches?.length) {
      score += 0.2;
    }
    factors++;
    
    // Has people also ask
    if (raw?.related_questions?.length) {
      score += 0.2;
    }
    factors++;
    
    return Math.round(score * 100) / 100;
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────

  _getApiKey() {
    const envKey = this.apiConfig.apiKeyEnvVar || 'SERP_API_KEY';
    
    try {
      if (typeof process !== 'undefined' && process.env) {
        return process.env[envKey];
      }
    } catch {
      // Environment not available
    }
    
    return null;
  }

  _extractDomain(url) {
    if (!url) return null;
    
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return null;
    }
  }

  async _fetchWithTimeout(url, options = {}) {
    const timeout = this.apiConfig.timeout || 30000;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // MOCK DATA (FOR TESTING / NO API KEY)
  // ─────────────────────────────────────────────────────────────────

  _getMockResults(query) {
    this.logger?.info('[SERP] Generating mock results for testing');
    
    return {
      organic_results: [
        {
          position: 1,
          title: `Best ${query} Solutions - Top Rated 2026`,
          link: 'https://example-competitor-1.com/solutions',
          snippet: 'Discover the leading solutions for your needs. Trusted by thousands.',
        },
        {
          position: 2,
          title: `${query} - Compare Top Providers`,
          link: 'https://example-competitor-2.com/compare',
          snippet: 'Compare features, pricing, and reviews of top providers.',
        },
        {
          position: 3,
          title: `${query} Alternative - Modern Approach`,
          link: 'https://example-competitor-3.com/',
          snippet: 'A fresh take on solving your challenges. Free trial available.',
        },
      ],
      local_results: [
        {
          title: 'Local Business Example',
          address: '123 Main St, City, State',
          rating: 4.5,
          reviews: 128,
          website: 'https://local-business.com',
        },
      ],
      related_questions: [
        { question: `What is the best ${query}?`, snippet: 'The best option depends on your specific needs...' },
        { question: `How much does ${query} cost?`, snippet: 'Pricing varies based on features and scale...' },
      ],
      related_searches: [
        { query: `${query} reviews` },
        { query: `${query} pricing` },
        { query: `${query} alternatives` },
      ],
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// RATE LIMITER (HUMAN PACING)
// ═══════════════════════════════════════════════════════════════════

class RateLimiter {
  constructor(config) {
    this.config = config || {};
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.windowStart = Date.now();
  }

  async wait() {
    if (!this.config.enabled) return;

    // Check requests per minute limit
    const now = Date.now();
    if (now - this.windowStart >= 60000) {
      this.requestCount = 0;
      this.windowStart = now;
    }

    const maxRequests = this.config.requestsPerMinute || 10;
    if (this.requestCount >= maxRequests) {
      const waitTime = 60000 - (now - this.windowStart);
      if (waitTime > 0) {
        await this._delay(waitTime);
      }
      this.requestCount = 0;
      this.windowStart = Date.now();
    }

    // Apply minimum delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minDelay = this.config.minDelayBetweenRequestsMs || 3000;
    const maxDelay = this.config.maxDelayBetweenRequestsMs || 8000;

    // Human pacing - random delay within range
    let delay = minDelay;
    if (this.config.humanPacingEnabled) {
      delay = Math.floor(Math.random() * (maxDelay - minDelay)) + minDelay;
    }

    if (timeSinceLastRequest < delay) {
      await this._delay(delay - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { SerpSearchScraper, RateLimiter };
export default SerpSearchScraper;
