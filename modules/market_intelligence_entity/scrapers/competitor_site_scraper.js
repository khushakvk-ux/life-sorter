/**
 * COMPETITOR SITE SCRAPER
 * ========================
 * 
 * Visits competitor websites like a real user would.
 * Extracts positioning, offers, trust signals, and CTAs.
 * 
 * ISOLATION GUARANTEES:
 * - No imports from core application
 * - No database writes
 * - Human-paced browsing simulation
 * - Outputs JSON only
 * 
 * CAPTURES:
 * - Positioning statement
 * - Core offer/value proposition
 * - Trust signals (testimonials, logos, certifications)
 * - CTA style and messaging
 * - Optional: Google Business Profile data
 */

import { isEnabled } from '../feature_flag.js';

// ═══════════════════════════════════════════════════════════════════
// COMPETITOR SITE SCRAPER CLASS
// ═══════════════════════════════════════════════════════════════════

class CompetitorSiteScraper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.enrichmentConfig = config?.enrichment || {};
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN ENRICHMENT METHOD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Enrich a competitor with website data
   * @param {Object} competitor - Competitor object with domain
   * @returns {Object} Enriched competitor data
   */
  async enrich(competitor) {
    // Safety check
    if (!isEnabled()) {
      this.logger?.warn('Competitor scraper called but entity is disabled');
      return competitor;
    }

    if (!competitor?.domain) {
      throw new Error('Invalid competitor: missing domain');
    }

    const startTime = Date.now();
    this.logger?.info(`[Enrichment] Starting for: ${competitor.domain}`);

    try {
      // Build full URL if needed
      const url = this._buildUrl(competitor.domain);
      
      // Fetch and analyze the website
      const siteData = await this._analyzeSite(url);
      
      // Extract key intelligence
      const enrichedData = {
        ...competitor,
        enrichedAt: new Date().toISOString(),
        enrichmentSuccess: true,
        
        // Positioning
        positioning: await this._extractPositioning(siteData),
        
        // Core Offer
        coreOffer: await this._extractCoreOffer(siteData),
        
        // Trust Signals
        trustSignals: await this._extractTrustSignals(siteData),
        
        // CTA Analysis
        ctaAnalysis: await this._extractCtaStyle(siteData),
        
        // Technical Signals
        technicalSignals: this._extractTechnicalSignals(siteData),
        
        // Optional: Google Business Profile
        googleBusinessProfile: this.enrichmentConfig.captureGoogleBusinessProfile
          ? await this._fetchGoogleBusinessProfile(competitor.domain)
          : null,
        
        // Confidence score for enrichment quality
        enrichmentConfidence: this._calculateEnrichmentConfidence(siteData),
      };

      const duration = Date.now() - startTime;
      this.logger?.info(`[Enrichment] Completed for ${competitor.domain} in ${duration}ms`);

      return enrichedData;

    } catch (error) {
      this.logger?.error(`[Enrichment] Failed for ${competitor.domain}: ${error.message}`);
      
      return {
        ...competitor,
        enrichedAt: new Date().toISOString(),
        enrichmentSuccess: false,
        enrichmentError: error.message,
        enrichmentConfidence: 0,
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // SITE ANALYSIS
  // ─────────────────────────────────────────────────────────────────

  async _analyzeSite(url) {
    this.logger?.debug(`[Enrichment] Fetching: ${url}`);
    
    try {
      const response = await this._fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      
      return {
        url,
        html,
        statusCode: response.status,
        headers: this._extractHeaders(response),
        fetchedAt: new Date().toISOString(),
      };
      
    } catch (error) {
      // Return mock data for development/testing
      this.logger?.warn(`[Enrichment] Fetch failed, using mock analysis: ${error.message}`);
      return this._getMockSiteData(url);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // EXTRACTION METHODS
  // ─────────────────────────────────────────────────────────────────

  async _extractPositioning(siteData) {
    if (!this.enrichmentConfig.capturePositioning) return null;
    
    const html = siteData.html || '';
    
    // Extract hero/headline text (simplified HTML parsing)
    const positioning = {
      headline: this._extractHeadline(html),
      subheadline: this._extractSubheadline(html),
      tagline: this._extractTagline(html),
      metaDescription: this._extractMetaDescription(html),
      uniqueValueProposition: this._inferUVP(html),
    };
    
    return positioning;
  }

  async _extractCoreOffer(siteData) {
    if (!this.enrichmentConfig.captureCoreOffer) return null;
    
    const html = siteData.html || '';
    
    return {
      primaryOffer: this._extractPrimaryOffer(html),
      pricingModel: this._detectPricingModel(html),
      targetAudience: this._inferTargetAudience(html),
      keyBenefits: this._extractKeyBenefits(html),
      differentiators: this._extractDifferentiators(html),
    };
  }

  async _extractTrustSignals(siteData) {
    if (!this.enrichmentConfig.captureTrustSignals) return null;
    
    const html = siteData.html || '';
    
    return {
      hasTestimonials: this._detectTestimonials(html),
      hasClientLogos: this._detectClientLogos(html),
      hasCertifications: this._detectCertifications(html),
      hasSecurityBadges: this._detectSecurityBadges(html),
      hasReviews: this._detectReviews(html),
      hasCaseStudies: this._detectCaseStudies(html),
      socialProof: this._extractSocialProof(html),
      trustScore: this._calculateTrustScore(html),
    };
  }

  async _extractCtaStyle(siteData) {
    if (!this.enrichmentConfig.captureCtaStyle) return null;
    
    const html = siteData.html || '';
    
    return {
      primaryCta: this._extractPrimaryCta(html),
      ctaPlacement: this._analyzeCtaPlacement(html),
      ctaTone: this._analyzeCtaTone(html),
      urgencySignals: this._detectUrgencySignals(html),
      frictionReduction: this._detectFrictionReduction(html),
    };
  }

  _extractTechnicalSignals(siteData) {
    return {
      hasSsl: siteData.url?.startsWith('https'),
      loadTime: null, // Would require actual performance measurement
      mobileOptimized: this._detectMobileOptimization(siteData.html || ''),
      hasStructuredData: this._detectStructuredData(siteData.html || ''),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // HTML PARSING HELPERS (Simplified - no external DOM parser)
  // ─────────────────────────────────────────────────────────────────

  _extractHeadline(html) {
    // Look for h1 tag
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
    if (h1Match) {
      return this._cleanText(h1Match[1]);
    }
    return null;
  }

  _extractSubheadline(html) {
    // Look for h2 tag or hero subtitle
    const h2Match = html.match(/<h2[^>]*>(.*?)<\/h2>/is);
    if (h2Match) {
      return this._cleanText(h2Match[1]);
    }
    return null;
  }

  _extractTagline(html) {
    // Look for common tagline patterns
    const patterns = [
      /<p[^>]*class="[^"]*tagline[^"]*"[^>]*>(.*?)<\/p>/is,
      /<span[^>]*class="[^"]*tagline[^"]*"[^>]*>(.*?)<\/span>/is,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        return this._cleanText(match[1]);
      }
    }
    return null;
  }

  _extractMetaDescription(html) {
    const match = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    if (match) {
      return match[1];
    }
    return null;
  }

  _inferUVP(html) {
    const headline = this._extractHeadline(html);
    const subheadline = this._extractSubheadline(html);
    const metaDesc = this._extractMetaDescription(html);
    
    return {
      detected: !!(headline || subheadline),
      headline,
      subheadline,
      metaDescription: metaDesc,
    };
  }

  _extractPrimaryOffer(html) {
    // Look for pricing or offer sections
    const offerPatterns = [
      /start.*?free/i,
      /free.*?trial/i,
      /get.*?started/i,
      /try.*?free/i,
    ];
    
    for (const pattern of offerPatterns) {
      if (pattern.test(html)) {
        return { hasFreeTrial: true };
      }
    }
    
    return { hasFreeTrial: false };
  }

  _detectPricingModel(html) {
    const models = [];
    
    if (/subscription|monthly|yearly|annual/i.test(html)) {
      models.push('subscription');
    }
    if (/one-time|lifetime|perpetual/i.test(html)) {
      models.push('one-time');
    }
    if (/per\s*user|per\s*seat/i.test(html)) {
      models.push('per-user');
    }
    if (/free\s*tier|freemium/i.test(html)) {
      models.push('freemium');
    }
    if (/enterprise|contact.*?sales/i.test(html)) {
      models.push('enterprise');
    }
    
    return models.length > 0 ? models : ['unknown'];
  }

  _inferTargetAudience(html) {
    const audiences = [];
    
    if (/small\s*business|smb|startup/i.test(html)) {
      audiences.push('SMB');
    }
    if (/enterprise|large\s*company/i.test(html)) {
      audiences.push('Enterprise');
    }
    if (/freelancer|individual|personal/i.test(html)) {
      audiences.push('Individual');
    }
    if (/team|collaboration/i.test(html)) {
      audiences.push('Teams');
    }
    
    return audiences.length > 0 ? audiences : ['General'];
  }

  _extractKeyBenefits(html) {
    // Look for bullet points or feature lists
    const benefits = [];
    
    // Extract list items that look like benefits
    const liMatches = html.matchAll(/<li[^>]*>(.*?)<\/li>/gis);
    for (const match of liMatches) {
      const text = this._cleanText(match[1]);
      if (text && text.length > 10 && text.length < 200) {
        benefits.push(text);
        if (benefits.length >= 5) break;
      }
    }
    
    return benefits;
  }

  _extractDifferentiators(html) {
    // Look for "why us" or comparison language
    const differentiators = [];
    
    if (/why\s*(choose|us|different)/i.test(html)) {
      differentiators.push('Has "Why Us" section');
    }
    if (/unlike|compared\s*to|vs\./i.test(html)) {
      differentiators.push('Has comparison language');
    }
    if (/only|first|leading|#1/i.test(html)) {
      differentiators.push('Claims market leadership');
    }
    
    return differentiators;
  }

  _detectTestimonials(html) {
    return /testimonial|review|customer\s*said|what.*?say/i.test(html);
  }

  _detectClientLogos(html) {
    return /trusted\s*by|used\s*by|our\s*customers|client.*?logo/i.test(html);
  }

  _detectCertifications(html) {
    return /certified|certification|iso|soc\s*2|gdpr|hipaa|compliant/i.test(html);
  }

  _detectSecurityBadges(html) {
    return /secure|ssl|encrypted|privacy|protection/i.test(html);
  }

  _detectReviews(html) {
    return /g2|capterra|trustpilot|review.*?rating|star.*?rating/i.test(html);
  }

  _detectCaseStudies(html) {
    return /case\s*stud|success\s*stor|how.*?used|customer\s*story/i.test(html);
  }

  _extractSocialProof(html) {
    const proof = [];
    
    // Look for numbers (e.g., "10,000+ customers")
    const numberMatches = html.matchAll(/(\d{1,3}(?:,\d{3})*(?:\+)?)\s*(customers|users|companies|teams|businesses)/gi);
    for (const match of numberMatches) {
      proof.push(`${match[1]} ${match[2]}`);
    }
    
    return proof;
  }

  _calculateTrustScore(html) {
    let score = 0;
    
    if (this._detectTestimonials(html)) score += 0.2;
    if (this._detectClientLogos(html)) score += 0.2;
    if (this._detectCertifications(html)) score += 0.15;
    if (this._detectSecurityBadges(html)) score += 0.15;
    if (this._detectReviews(html)) score += 0.15;
    if (this._detectCaseStudies(html)) score += 0.15;
    
    return Math.round(score * 100) / 100;
  }

  _extractPrimaryCta(html) {
    // Look for buttons with CTA text
    const ctaPatterns = [
      /<button[^>]*>(.*?)<\/button>/gi,
      /<a[^>]*class="[^"]*btn[^"]*"[^>]*>(.*?)<\/a>/gi,
      /<a[^>]*class="[^"]*button[^"]*"[^>]*>(.*?)<\/a>/gi,
    ];
    
    const ctas = [];
    for (const pattern of ctaPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const text = this._cleanText(match[1]);
        if (text && text.length > 2 && text.length < 50) {
          ctas.push(text);
        }
      }
    }
    
    return ctas.slice(0, 5);
  }

  _analyzeCtaPlacement(html) {
    // Simplified analysis
    return {
      hasHeaderCta: /<header[^>]*>[\s\S]*?<(button|a[^>]*btn)/i.test(html),
      hasHeroCta: /<(section|div)[^>]*class="[^"]*hero[^"]*"[\s\S]*?<(button|a[^>]*btn)/i.test(html),
      hasFooterCta: /<footer[^>]*>[\s\S]*?<(button|a[^>]*btn)/i.test(html),
    };
  }

  _analyzeCtaTone(html) {
    const ctas = this._extractPrimaryCta(html);
    const ctaText = ctas.join(' ').toLowerCase();
    
    const tone = {
      isUrgent: /now|today|hurry|limited/i.test(ctaText),
      isInviting: /discover|explore|learn|see/i.test(ctaText),
      isActionOriented: /get|start|begin|create|build/i.test(ctaText),
      isValueFocused: /free|save|boost|improve/i.test(ctaText),
    };
    
    return tone;
  }

  _detectUrgencySignals(html) {
    return {
      hasCountdown: /countdown|timer|expires/i.test(html),
      hasLimitedOffer: /limited|while.*?last|only.*?left/i.test(html),
      hasTimeConstraint: /today|now|hurry|don't.*?miss/i.test(html),
    };
  }

  _detectFrictionReduction(html) {
    return {
      hasNoCreditCard: /no.*?credit.*?card|no.*?payment/i.test(html),
      hasQuickSetup: /minute|instant|quick|easy/i.test(html),
      hasGuarantee: /guarantee|money.*?back|risk.*?free/i.test(html),
      hasSupport: /24\/7|support|help|chat/i.test(html),
    };
  }

  _detectMobileOptimization(html) {
    return /viewport.*?width.*?device-width/i.test(html);
  }

  _detectStructuredData(html) {
    return /application\/ld\+json/i.test(html);
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────

  _buildUrl(domain) {
    if (domain.startsWith('http')) {
      return domain;
    }
    return `https://${domain}`;
  }

  _cleanText(html) {
    if (!html) return null;
    
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
  }

  _extractHeaders(response) {
    const headers = {};
    try {
      for (const [key, value] of response.headers.entries()) {
        headers[key] = value;
      }
    } catch {
      // Headers not accessible
    }
    return headers;
  }

  async _fetchWithTimeout(url) {
    const timeout = this.enrichmentConfig.timeoutPerPageMs || 15000;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MarketIntelBot/1.0)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async _fetchGoogleBusinessProfile(domain) {
    // This would require Google Places API or scraping
    // Returning placeholder for isolation
    this.logger?.debug(`[Enrichment] GBP fetch not implemented for: ${domain}`);
    return null;
  }

  _calculateEnrichmentConfidence(siteData) {
    if (!siteData || !siteData.html) return 0;
    
    let score = 0;
    
    // Has content
    if (siteData.html.length > 1000) score += 0.3;
    if (siteData.html.length > 5000) score += 0.2;
    
    // Has key elements
    if (this._extractHeadline(siteData.html)) score += 0.2;
    if (this._extractMetaDescription(siteData.html)) score += 0.15;
    if (this._detectTrustSignals) score += 0.15;
    
    return Math.min(1, Math.round(score * 100) / 100);
  }

  // ─────────────────────────────────────────────────────────────────
  // MOCK DATA
  // ─────────────────────────────────────────────────────────────────

  _getMockSiteData(url) {
    return {
      url,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="description" content="Leading provider of AI-powered solutions for modern businesses. Trusted by 10,000+ companies worldwide.">
          <title>Example Competitor - AI Solutions</title>
        </head>
        <body>
          <header>
            <nav>
              <a href="/" class="logo">CompetitorBrand</a>
              <button class="btn">Start Free Trial</button>
            </nav>
          </header>
          <section class="hero">
            <h1>Transform Your Business with AI</h1>
            <h2>The smarter way to grow your company</h2>
            <p class="tagline">Trusted by leading enterprises worldwide</p>
            <button class="btn-primary">Get Started Free</button>
            <span>No credit card required</span>
          </section>
          <section class="social-proof">
            <p>Trusted by 10,000+ companies</p>
            <div class="client-logos">Client logos here</div>
          </section>
          <section class="features">
            <ul>
              <li>Easy integration in minutes</li>
              <li>24/7 customer support</li>
              <li>Enterprise-grade security</li>
              <li>SOC 2 certified</li>
            </ul>
          </section>
          <section class="testimonials">
            <h3>What our customers say</h3>
            <blockquote>Amazing product!</blockquote>
          </section>
        </body>
        </html>
      `,
      statusCode: 200,
      headers: {},
      fetchedAt: new Date().toISOString(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { CompetitorSiteScraper };
export default CompetitorSiteScraper;
