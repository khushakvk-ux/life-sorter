/**
 * PHASE 1 - WEBSITE EXTRACTION AGENT
 * ===================================
 * 
 * Produces a validated, auditable JSON profile for a business from a single website URL.
 * Captures identity, core offers, hard evidence on-site, and structured offer details.
 * 
 * OUTPUT SCHEMA:
 * - business_identity: name, location, category with confidence scores
 * - primary_offerings: ranked list of main offerings
 * - proof_assets: testimonials, case studies, awards, certifications
 * - offer_structure: packages, inclusions, guarantees, timelines
 * - evidence: snapshots, selectors for audit trail
 * 
 * LLM: Claude Sonnet 4 (best for structured extraction with precise JSON output)
 */

import { isEnabled, isSubFeatureEnabled } from '../feature_flag.js';
import { OpenRouterClient } from '../utils/openrouter_client.js';

// ═══════════════════════════════════════════════════════════════════
// JSON SCHEMA FOR PHASE 1 OUTPUT
// ═══════════════════════════════════════════════════════════════════

const PHASE1_OUTPUT_SCHEMA = {
  url: "string",
  extracted_at: "ISO8601 timestamp",
  business_identity: {
    name: { value: "string", confidence: "0.0-1.0", sources: [{ url: "string", selector: "string" }] },
    location: { country: "string", city: "string", confidence: "0.0-1.0", sources: [] },
    category: { value: "string", taxonomy: "string", confidence: "0.0-1.0", sources: [] }
  },
  primary_offerings: [
    { name: "string", rank: "number", confidence: "0.0-1.0", source: "string", excerpt: "string" }
  ],
  proof_assets: [
    { type: "testimonial|case_study|award|cert", excerpt: "string", location_url: "string", selector: "string", confidence: "0.0-1.0" }
  ],
  offer_structure: {
    packages: [
      { name: "string", inclusions: ["string"], guarantee: "string", timeline: "string", confidence: "0.0-1.0" }
    ]
  },
  evidence: {
    snapshots: ["string"],
    selectors: { name_selector: "string", testimonials_selector: "string" }
  }
};

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT FOR WEBSITE EXTRACTION
// ═══════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are a precise business intelligence extraction engine. Your task is to extract structured data from website content with high accuracy.

CRITICAL RULES:
1. Return ONLY valid JSON matching the specified schema
2. Do NOT invent or hallucinate facts - extract only what is explicitly present
3. Assign confidence scores (0.0-1.0) based on clarity of evidence
4. Include source references (URL, CSS selector) for every extracted field
5. If data is missing or unclear, set confidence to 0.0 and leave value empty

CONFIDENCE SCORING GUIDE:
- 1.0: Explicitly stated in clear, prominent text
- 0.8-0.9: Clearly stated but in secondary location
- 0.6-0.7: Implied or can be inferred with high confidence
- 0.4-0.5: Partially present, requires interpretation
- 0.0-0.3: Weak evidence or not found

EXTRACTION PRIORITY:
1. Schema.org JSON-LD data (highest trust)
2. Open Graph meta tags
3. Hero section content
4. About/Services pages
5. Footer information

OUTPUT JSON SCHEMA:
${JSON.stringify(PHASE1_OUTPUT_SCHEMA, null, 2)}`;

// ═══════════════════════════════════════════════════════════════════
// WEBSITE EXTRACTION AGENT CLASS
// ═══════════════════════════════════════════════════════════════════

class WebsiteExtractionAgent {
  constructor(config, logger, apiKey) {
    this.config = config;
    this.logger = logger;
    this.llmClient = new OpenRouterClient(apiKey, logger);
    this.phase = 'phase1_website_extraction';
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN EXTRACTION METHOD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Extract business profile from website content OR generate from description
   * @param {Object} websiteData - Scraped website data including HTML, meta, text
   * @returns {Object} Structured business profile with confidence scores
   */
  async extract(websiteData) {
    // Safety check
    if (!isEnabled()) {
      this.logger?.warn('[Phase1] Entity is disabled');
      return this._getEmptyProfile(websiteData?.url || 'unknown');
    }

    const hasWebsiteContent = websiteData?.html || (websiteData?.textContent && websiteData.textContent.length > 50);
    const hasDescription = websiteData?.textContent && websiteData.textContent.includes('Business providing:');
    
    // If we have actual website content, extract from it
    if (hasWebsiteContent && !hasDescription) {
      return this._extractFromWebsite(websiteData);
    }
    
    // If we only have a description/service query, use LLM to research and generate profile
    if (hasDescription || websiteData?.textContent) {
      return this._generateFromDescription(websiteData);
    }

    this.logger?.warn('[Phase1] No website data or description provided');
    return this._getEmptyProfile(websiteData?.url || 'unknown');
  }

  // ─────────────────────────────────────────────────────────────────
  // GENERATE PROFILE FROM DESCRIPTION (LLM Research Mode)
  // ─────────────────────────────────────────────────────────────────

  async _generateFromDescription(websiteData) {
    const description = websiteData.textContent || '';
    const url = websiteData.url || 'N/A';
    
    this.logger?.info(`[Phase1] Generating profile from description: "${description.substring(0, 100)}..."`);

    try {
      const researchPrompt = `You are a business intelligence analyst. Based on the following business description/query, generate a detailed business profile as if you've analyzed their potential website.

BUSINESS DESCRIPTION/QUERY:
${description}

TARGET URL (if provided): ${url}

TASK: Create a realistic and comprehensive business profile based on typical businesses in this space. Include:
1. Business identity (likely name patterns, category, typical locations)
2. Primary offerings (5-7 core services/products this type of business typically offers)
3. Proof assets (what testimonials, case studies, certifications such businesses typically have)
4. Offer structure (typical packages, pricing tiers, guarantees)

Use your knowledge to create a realistic profile. Set confidence scores based on how typical/certain these elements are for this business type.

Return ONLY valid JSON matching this schema:
{
  "url": "${url}",
  "extracted_at": "${new Date().toISOString()}",
  "business_identity": {
    "name": { "value": "string - likely business name or type", "confidence": 0.7, "sources": [] },
    "location": { "country": "string", "city": "string", "confidence": 0.5, "sources": [] },
    "category": { "value": "string - business category", "taxonomy": "industry/sub-industry", "confidence": 0.8, "sources": [] }
  },
  "primary_offerings": [
    { "name": "offering name", "rank": 1, "confidence": 0.8, "source": "typical for this business type", "excerpt": "description" }
  ],
  "proof_assets": [
    { "type": "testimonial|case_study|award|cert", "excerpt": "what they likely have", "location_url": "", "selector": "", "confidence": 0.6 }
  ],
  "offer_structure": {
    "packages": [
      { "name": "package name", "inclusions": ["feature1", "feature2"], "guarantee": "typical guarantee", "timeline": "typical timeline", "confidence": 0.6 }
    ]
  },
  "overall_confidence": 0.7
}`;

      const llmResult = await this.llmClient.complete(
        this.phase,
        researchPrompt,
        'You are a precise business intelligence analyst. Return ONLY valid JSON, no explanations.'
      );

      // Parse and validate
      const profile = this._parseAndValidateProfile(llmResult, url);
      
      this.logger?.info(`[Phase1] Generated profile complete. Confidence: ${profile.overall_confidence}`);
      
      return profile;

    } catch (error) {
      this.logger?.error(`[Phase1] Generation failed: ${error.message}`);
      return this._getErrorProfile(url, error.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // EXTRACT FROM ACTUAL WEBSITE CONTENT
  // ─────────────────────────────────────────────────────────────────

  async _extractFromWebsite(websiteData) {
    this.logger?.info(`[Phase1] Starting website extraction for: ${websiteData.url}`);

    try {
      // Step 1: Pre-process and segment content
      const segments = this._segmentContent(websiteData);
      
      // Step 2: Extract deterministic candidates (schema.org, meta tags)
      const deterministicData = this._extractDeterministicData(websiteData);
      
      // Step 3: Build extraction prompt
      const userPrompt = this._buildExtractionPrompt(websiteData, segments, deterministicData);
      
      // Step 4: Execute LLM extraction
      const llmResult = await this.llmClient.complete(
        this.phase,
        userPrompt,
        SYSTEM_PROMPT
      );
      
      // Step 5: Validate and reconcile
      const profile = this._validateAndReconcile(llmResult, deterministicData, websiteData.url);
      
      this.logger?.info(`[Phase1] Extraction complete. Confidence: ${profile.overall_confidence}`);
      
      return profile;

    } catch (error) {
      this.logger?.error(`[Phase1] Extraction failed: ${error.message}`);
      return this._getErrorProfile(websiteData.url, error.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // PARSE AND VALIDATE PROFILE
  // ─────────────────────────────────────────────────────────────────

  _parseAndValidateProfile(llmResult, url) {
    let parsed = llmResult.parsed || llmResult;
    
    // If it's a string, try to parse it
    if (typeof parsed === 'string') {
      try {
        // Extract JSON from the response
        const jsonMatch = parsed.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        this.logger?.warn('[Phase1] Failed to parse LLM response as JSON');
        return this._getEmptyProfile(url);
      }
    }

    // Ensure required fields exist
    return {
      url: parsed.url || url,
      extracted_at: parsed.extracted_at || new Date().toISOString(),
      business_identity: parsed.business_identity || {
        name: { value: '', confidence: 0 },
        location: { country: '', city: '', confidence: 0 },
        category: { value: '', confidence: 0 }
      },
      primary_offerings: parsed.primary_offerings || [],
      proof_assets: parsed.proof_assets || [],
      offer_structure: parsed.offer_structure || { packages: [] },
      evidence: parsed.evidence || { snapshots: [], selectors: {} },
      overall_confidence: parsed.overall_confidence || this._calculateOverallConfidence(parsed)
    };
  }

  _calculateOverallConfidence(profile) {
    const scores = [
      profile?.business_identity?.name?.confidence || 0,
      profile?.business_identity?.category?.confidence || 0,
      (profile?.primary_offerings?.length > 0) ? 0.7 : 0,
      (profile?.proof_assets?.length > 0) ? 0.6 : 0
    ];
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  // ─────────────────────────────────────────────────────────────────
  // CONTENT SEGMENTATION
  // ─────────────────────────────────────────────────────────────────

  _segmentContent(websiteData) {
    const segments = {
      hero: '',
      about: '',
      services: '',
      testimonials: '',
      contact: '',
      footer: '',
      faq: ''
    };

    // Extract text content from different sections
    const text = websiteData.textContent || websiteData.text || '';
    const html = websiteData.html || '';
    
    // Simple heuristic segmentation (would be enhanced with DOM analysis in production)
    const lines = text.split('\n').filter(l => l.trim());
    
    // Hero is typically first substantial content
    if (lines.length > 0) {
      segments.hero = lines.slice(0, Math.min(10, lines.length)).join('\n');
    }
    
    // Look for section markers
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('about')) {
      const aboutStart = lowerText.indexOf('about');
      segments.about = text.slice(aboutStart, aboutStart + 500);
    }
    
    if (lowerText.includes('service') || lowerText.includes('offering')) {
      const servicesStart = Math.max(
        lowerText.indexOf('service'),
        lowerText.indexOf('offering')
      );
      if (servicesStart > 0) {
        segments.services = text.slice(servicesStart, servicesStart + 800);
      }
    }
    
    if (lowerText.includes('testimonial') || lowerText.includes('review') || lowerText.includes('what our')) {
      const testStart = Math.max(
        lowerText.indexOf('testimonial'),
        lowerText.indexOf('review'),
        lowerText.indexOf('what our')
      );
      if (testStart > 0) {
        segments.testimonials = text.slice(testStart, testStart + 600);
      }
    }
    
    return segments;
  }

  // ─────────────────────────────────────────────────────────────────
  // DETERMINISTIC DATA EXTRACTION
  // ─────────────────────────────────────────────────────────────────

  _extractDeterministicData(websiteData) {
    const data = {
      schemaOrg: null,
      openGraph: {},
      metaTags: {},
      patterns: {
        emails: [],
        phones: [],
        addresses: []
      }
    };

    const html = websiteData.html || '';
    const text = websiteData.textContent || '';

    // Extract Schema.org JSON-LD
    const schemaMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
    if (schemaMatch) {
      try {
        data.schemaOrg = JSON.parse(schemaMatch[1]);
      } catch (e) {
        this.logger?.warn('[Phase1] Failed to parse Schema.org data');
      }
    }

    // Extract Open Graph tags
    const ogMatches = html.matchAll(/<meta\s+property="og:(\w+)"\s+content="([^"]+)"/gi);
    for (const match of ogMatches) {
      data.openGraph[match[1]] = match[2];
    }

    // Extract meta tags
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      data.metaTags.title = titleMatch[1];
    }

    const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    if (descMatch) {
      data.metaTags.description = descMatch[1];
    }

    // Regex patterns for contact info
    data.patterns.emails = (text.match(/[\w.-]+@[\w.-]+\.\w+/g) || []).slice(0, 3);
    data.patterns.phones = (text.match(/[\+]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}/g) || []).slice(0, 3);

    return data;
  }

  // ─────────────────────────────────────────────────────────────────
  // PROMPT BUILDING
  // ─────────────────────────────────────────────────────────────────

  _buildExtractionPrompt(websiteData, segments, deterministicData) {
    return `
WEBSITE URL: ${websiteData.url}

=== DETERMINISTIC DATA (HIGH TRUST) ===
Schema.org: ${JSON.stringify(deterministicData.schemaOrg, null, 2) || 'Not found'}
Open Graph: ${JSON.stringify(deterministicData.openGraph, null, 2)}
Meta Tags: ${JSON.stringify(deterministicData.metaTags, null, 2)}
Contact Patterns Found:
- Emails: ${deterministicData.patterns.emails.join(', ') || 'None'}
- Phones: ${deterministicData.patterns.phones.join(', ') || 'None'}

=== CONTENT SEGMENTS ===

[HERO SECTION]
${segments.hero || 'Not identified'}

[ABOUT SECTION]
${segments.about || 'Not identified'}

[SERVICES/OFFERINGS]
${segments.services || 'Not identified'}

[TESTIMONIALS/REVIEWS]
${segments.testimonials || 'Not identified'}

=== FULL TEXT CONTENT (truncated) ===
${(websiteData.textContent || '').slice(0, 4000)}

=== EXTRACTION TASK ===
Extract a complete business profile following the JSON schema. 
Cross-reference LLM extraction against deterministic data for higher confidence.
Return ONLY the JSON object, no explanations.`;
  }

  // ─────────────────────────────────────────────────────────────────
  // VALIDATION AND RECONCILIATION
  // ─────────────────────────────────────────────────────────────────

  _validateAndReconcile(llmResult, deterministicData, url) {
    let profile = llmResult.parsed || this._getEmptyProfile(url);
    
    // Ensure required fields
    profile.url = url;
    profile.extracted_at = new Date().toISOString();
    profile.phase = 'phase1_website_extraction';
    profile.model_used = llmResult.model;
    
    // Reconcile with deterministic data
    if (deterministicData.schemaOrg) {
      const schema = deterministicData.schemaOrg;
      
      // Boost confidence if Schema.org matches LLM extraction
      if (schema.name && profile.business_identity?.name?.value) {
        if (this._similarityScore(schema.name, profile.business_identity.name.value) > 0.8) {
          profile.business_identity.name.confidence = Math.min(1.0, 
            (profile.business_identity.name.confidence || 0) + 0.2
          );
          profile.business_identity.name.sources.push({
            url: url,
            selector: 'script[type="application/ld+json"]',
            type: 'schema.org'
          });
        }
      }
    }
    
    // Calculate overall confidence
    profile.overall_confidence = this._calculateOverallConfidence(profile);
    
    // Add extraction metadata
    profile._metadata = {
      llm_tokens: llmResult.usage,
      extraction_method: 'llm_with_deterministic_reconciliation',
      deterministic_signals_found: {
        schemaOrg: !!deterministicData.schemaOrg,
        openGraph: Object.keys(deterministicData.openGraph).length > 0,
        emails: deterministicData.patterns.emails.length,
        phones: deterministicData.patterns.phones.length
      }
    };
    
    return profile;
  }

  _similarityScore(str1, str2) {
    if (!str1 || !str2) return 0;
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    return 0;
  }

  _calculateOverallConfidence(profile) {
    const confidences = [];
    
    if (profile.business_identity?.name?.confidence) {
      confidences.push(profile.business_identity.name.confidence * 1.5); // Weight name higher
    }
    if (profile.business_identity?.category?.confidence) {
      confidences.push(profile.business_identity.category.confidence);
    }
    if (profile.primary_offerings?.length > 0) {
      const avgOffering = profile.primary_offerings.reduce((sum, o) => sum + (o.confidence || 0), 0) / profile.primary_offerings.length;
      confidences.push(avgOffering);
    }
    if (profile.proof_assets?.length > 0) {
      confidences.push(0.7); // Bonus for having proof assets
    }
    
    if (confidences.length === 0) return 0;
    return Math.min(1.0, confidences.reduce((a, b) => a + b, 0) / confidences.length);
  }

  // ─────────────────────────────────────────────────────────────────
  // EMPTY/ERROR PROFILES
  // ─────────────────────────────────────────────────────────────────

  _getEmptyProfile(url) {
    return {
      url: url,
      extracted_at: new Date().toISOString(),
      phase: 'phase1_website_extraction',
      business_identity: {
        name: { value: '', confidence: 0, sources: [] },
        location: { country: '', city: '', confidence: 0, sources: [] },
        category: { value: '', taxonomy: '', confidence: 0, sources: [] }
      },
      primary_offerings: [],
      proof_assets: [],
      offer_structure: { packages: [] },
      evidence: { snapshots: [], selectors: {} },
      overall_confidence: 0
    };
  }

  _getErrorProfile(url, error) {
    const profile = this._getEmptyProfile(url);
    profile.extraction_error = error;
    profile.extraction_status = 'failed';
    return profile;
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { WebsiteExtractionAgent, PHASE1_OUTPUT_SCHEMA };
export default WebsiteExtractionAgent;
