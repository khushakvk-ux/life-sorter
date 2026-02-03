/**
 * PHASE 3 - MARKETING, REACHOUT & CONVERSION AGENT
 * =================================================
 * 
 * Detects, extracts, models and evidences marketing channels, landing-page offers,
 * CTAs, customer engagement paths, sales processes, and product journeys.
 * 
 * OUTPUT:
 * - marketing: channels, tracking tags, ad platform IDs
 * - landing_pages: offers, CTAs, evidence
 * - engagement_paths: step-by-step customer journeys
 * - sales_process: inbound/outbound flows
 * - product_journey: entry offers → core → upsells/cross-sells
 * 
 * LLM: GPT-4.1 (best for marketing analysis, CTA detection, conversion optimization)
 */

import { isEnabled } from '../feature_flag.js';
import { OpenRouterClient } from '../utils/openrouter_client.js';

// ═══════════════════════════════════════════════════════════════════
// JSON SCHEMA FOR PHASE 3 OUTPUT
// ═══════════════════════════════════════════════════════════════════

const PHASE3_OUTPUT_SCHEMA = {
  business_id: "string",
  url: "string",
  extracted_at: "ISO8601 timestamp",
  marketing: {
    channels: [
      { channel: "organic_search|paid_search|social|email|referral", evidence: [{ url: "string", selector: "string", method: "dom|search|api" }], confidence: "0.0-1.0" }
    ],
    tracking_tags: ["ga4|gtm|fb-pixel|etc"],
    ad_platform_ids: [{ platform: "google_ads|facebook_ads|etc", id: "string" }]
  },
  landing_pages: [
    {
      url: "string",
      offer_headline: "string",
      offer_summary: "string",
      primary_ctas: [
        { type: "form|button|link|chat|phone|whatsapp", selector: "string", text: "string", target: "string", confidence: "0.0-1.0" }
      ],
      supporting_ctas: [],
      evidence: [{ selector: "string", screenshot: "string" }]
    }
  ],
  engagement_paths: [
    {
      path_id: "string",
      steps: [{ step: "string", action: "string", cta_type: "string", fields: ["string"] }],
      probability: "0.0-1.0",
      confidence: "0.0-1.0"
    }
  ],
  sales_process: {
    type: "demo-led|product-led|consultative|rfp|hybrid",
    inbound: "string description of flow",
    outbound: "string description of flow",
    evidence: []
  },
  product_journey: {
    entry_offers: ["lead magnet|free trial|demo|consultation|etc"],
    core_product: "string",
    upsells: [{ name: "string", trigger: "string", evidence: [] }],
    cross_sells: [{ name: "string", placement: "string", evidence: [] }]
  },
  evidence: []
};

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT FOR MARKETING ANALYSIS
// ═══════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are an expert marketing and conversion optimization analyst. Your task is to analyze website content and extract comprehensive marketing intelligence including CTAs, engagement paths, sales processes, and product journeys.

CRITICAL RULES:
1. Return ONLY valid JSON matching the specified schema
2. Base all conclusions on provided evidence
3. Assign confidence scores (0.0-1.0) based on clarity of signals
4. Include CSS selectors and evidence for every CTA identified
5. Model realistic engagement paths based on detected elements

CTA DETECTION PRIORITY:
1. Hero section CTAs (highest impact)
2. Sticky header/floating CTAs
3. In-content CTAs
4. Footer CTAs
5. Chat widgets and popups

CTA TYPES:
- form: Contact forms, lead capture forms, signup forms
- button: Action buttons linking to booking/payment/next steps
- link: Text links to important pages
- chat: Live chat widgets (Intercom, Drift, Tawk, etc.)
- phone: tel: links or click-to-call
- whatsapp: wa.me links
- booking: Calendly, HubSpot Meetings, etc.

ENGAGEMENT PATH MODELING:
- Trace the customer journey from landing to conversion
- Identify each step and its action type
- Estimate probability based on CTA prominence
- Note form fields that indicate intent level

SALES PROCESS CLASSIFICATION:
- demo-led: Primary path is booking demos/calls
- product-led: Self-serve signup, free trial, freemium
- consultative: Discovery calls, custom proposals
- rfp: Enterprise/formal bidding process
- hybrid: Multiple paths available

OUTPUT JSON SCHEMA:
${JSON.stringify(PHASE3_OUTPUT_SCHEMA, null, 2)}`;

// ═══════════════════════════════════════════════════════════════════
// MARKETING CONVERSION AGENT CLASS
// ═══════════════════════════════════════════════════════════════════

class MarketingConversionAgent {
  constructor(config, logger, apiKey) {
    this.config = config;
    this.logger = logger;
    this.llmClient = new OpenRouterClient(apiKey, logger);
    this.phase = 'phase3_marketing_conversion';
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN ANALYSIS METHOD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Analyze marketing, CTAs, and conversion elements
   * @param {Object} businessIdentity - Phase 1 output with business identity
   * @param {Object} websiteData - Scraped website data including HTML, scripts, forms
   * @param {Object} externalPresence - Phase 2 output (optional)
   * @returns {Object} Marketing and conversion analysis
   */
  async analyze(businessIdentity, websiteData, externalPresence = null) {
    if (!isEnabled()) {
      this.logger?.warn('[Phase3] Entity is disabled');
      return this._getEmptyAnalysis(businessIdentity?.url);
    }

    // Check if we have actual website data or just a description
    const hasWebsiteData = websiteData?.html || websiteData?.textContent?.length > 500;
    
    if (!hasWebsiteData) {
      this.logger?.info('[Phase3] No website HTML provided, generating marketing analysis from description');
      // Use description-based analysis with LLM
      return await this._generateFromDescription(businessIdentity, websiteData, externalPresence);
    }

    this.logger?.info(`[Phase3] Starting marketing analysis for: ${websiteData.url}`);

    try {
      // Step 1: Detect tracking tags and ad platforms
      const trackingData = this._detectTrackingTags(websiteData);
      
      // Step 2: Extract CTA candidates
      const ctaCandidates = this._extractCtaCandidates(websiteData);
      
      // Step 3: Detect forms and their fields
      const formData = this._extractForms(websiteData);
      
      // Step 4: Detect chat widgets and vendors
      const chatData = this._detectChatWidgets(websiteData);
      
      // Step 5: Detect booking/scheduling tools
      const bookingData = this._detectBookingTools(websiteData);
      
      // Step 6: Build analysis prompt
      const userPrompt = this._buildAnalysisPrompt(
        businessIdentity,
        websiteData,
        trackingData,
        ctaCandidates,
        formData,
        chatData,
        bookingData,
        externalPresence
      );
      
      // Step 7: Execute LLM analysis
      const llmResult = await this.llmClient.complete(
        this.phase,
        userPrompt,
        SYSTEM_PROMPT
      );
      
      // Step 8: Validate and enrich
      const analysis = this._validateAndEnrich(
        llmResult,
        websiteData.url,
        trackingData,
        ctaCandidates
      );
      
      this.logger?.info(`[Phase3] Analysis complete. CTAs found: ${analysis.total_ctas}`);
      
      return analysis;

    } catch (error) {
      this.logger?.error(`[Phase3] Analysis failed: ${error.message}`);
      return this._getErrorAnalysis(websiteData?.url || 'unknown', error.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // DESCRIPTION-BASED ANALYSIS (when no website HTML available)
  // ─────────────────────────────────────────────────────────────────

  async _generateFromDescription(businessIdentity, websiteData, externalPresence) {
    const description = websiteData?.textContent || businessIdentity?.business_identity?.description?.value || '';
    const businessName = businessIdentity?.business_identity?.name?.value || 'Unknown Business';
    const industry = businessIdentity?.business_identity?.industry?.value || '';
    const services = businessIdentity?.business_identity?.services || [];
    
    this.logger?.info(`[Phase3] Generating marketing analysis from description for: ${businessName}`);
    
    const prompt = `You are an expert marketing and conversion optimization analyst. Based on the following business description, generate a realistic marketing and conversion analysis.

BUSINESS INFORMATION:
- Name: ${businessName}
- Industry: ${industry}
- Services: ${services.join(', ') || 'Not specified'}
- Description: ${description}

${externalPresence ? `EXTERNAL PRESENCE DATA:
- Profiles discovered: ${externalPresence.profiles_discovered || 0}
- Social platforms: ${(externalPresence.profiles?.social || []).map(s => s.platform).join(', ') || 'None found'}` : ''}

TASK: Generate a comprehensive marketing and conversion analysis for this business. Based on the business type and industry:
1. Identify likely marketing channels they would use
2. Suggest typical tracking/analytics tools for this business type
3. Model realistic engagement paths and customer journeys
4. Determine likely sales process type
5. Map the product/service journey

OUTPUT FORMAT (JSON):
{
  "marketing": {
    "channels": [
      { "channel": "organic_search", "evidence": [{"url": "hypothetical", "method": "inferred"}], "confidence": 0.8 },
      { "channel": "social", "evidence": [{"url": "hypothetical", "method": "inferred"}], "confidence": 0.7 }
    ],
    "tracking_tags": ["ga4", "gtm"],
    "ad_platform_ids": []
  },
  "landing_pages": [
    {
      "url": "homepage",
      "offer_headline": "Main value proposition",
      "offer_summary": "Summary of main offer",
      "primary_ctas": [
        { "type": "button", "text": "Get Started", "target": "signup", "confidence": 0.8 }
      ],
      "supporting_ctas": []
    }
  ],
  "engagement_paths": [
    {
      "path_id": "primary_conversion",
      "steps": [
        { "step": "1", "action": "Visit homepage", "cta_type": "landing" },
        { "step": "2", "action": "View services", "cta_type": "navigation" },
        { "step": "3", "action": "Contact/signup", "cta_type": "conversion" }
      ],
      "probability": 0.7,
      "confidence": 0.75
    }
  ],
  "sales_process": {
    "type": "demo-led|product-led|consultative|hybrid",
    "inbound": "Description of inbound process",
    "outbound": "Description of outbound process",
    "evidence": []
  },
  "product_journey": {
    "entry_offers": ["free consultation", "demo"],
    "core_product": "Main service/product",
    "upsells": [],
    "cross_sells": []
  },
  "overall_confidence": 0.7
}

Return ONLY the JSON object, no additional text.`;

    try {
      const llmResult = await this.llmClient.complete(
        this.phase,
        prompt,
        SYSTEM_PROMPT
      );
      
      return this._parseAndValidateMarketingAnalysis(llmResult, businessName);
    } catch (error) {
      this.logger?.error(`[Phase3] Description-based analysis failed: ${error.message}`);
      return this._getEmptyAnalysis(websiteData?.url || 'unknown');
    }
  }

  _parseAndValidateMarketingAnalysis(response, businessName) {
    try {
      let parsed;
      
      // The OpenRouter client returns { raw, parsed, model, usage }
      if (response.parsed) {
        parsed = response.parsed;
      } else {
        const text = response.raw || response.text || response.content || JSON.stringify(response);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      }
      
      this.logger?.info(`[Phase3] Parsed response successfully`);
      
      // Count CTAs from landing pages
      const landingPages = parsed.landing_pages || [];
      let totalCtas = 0;
      landingPages.forEach(lp => {
        totalCtas += (lp.primary_ctas?.length || 0) + (lp.supporting_ctas?.length || 0);
      });
      
      const analysis = {
        extracted_at: new Date().toISOString(),
        phase: 'phase3_marketing_conversion',
        model_used: response.model || 'gpt-4.1',
        url: 'description-based',
        marketing: parsed.marketing || {
          channels: [{ channel: 'organic_search', evidence: [], confidence: 0.6 }],
          tracking_tags: ['ga4'],
          ad_platform_ids: []
        },
        landing_pages: landingPages,
        engagement_paths: parsed.engagement_paths || [],
        sales_process: parsed.sales_process || {
          type: 'consultative',
          inbound: 'Contact form and phone inquiries',
          outbound: 'Email outreach',
          evidence: []
        },
        product_journey: parsed.product_journey || {
          entry_offers: ['free consultation'],
          core_product: businessName,
          upsells: [],
          cross_sells: []
        },
        total_ctas: totalCtas || (parsed.marketing?.channels?.length || 1),
        overall_confidence: parsed.overall_confidence || 0.65
      };
      
      this.logger?.info(`[Phase3] Final total_ctas: ${analysis.total_ctas}`);
      
      return analysis;
    } catch (error) {
      this.logger?.error(`[Phase3] Failed to parse marketing analysis: ${error.message}`);
      return this._getEmptyAnalysis('unknown');
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // TRACKING TAG DETECTION
  // ─────────────────────────────────────────────────────────────────

  _detectTrackingTags(websiteData) {
    const html = websiteData.html || '';
    const scripts = websiteData.scripts || [];
    const tracking = {
      tags: [],
      adPlatforms: []
    };

    // Google Analytics 4
    if (html.includes('gtag') || html.includes('G-') || html.includes('ga4')) {
      tracking.tags.push('ga4');
      const gaMatch = html.match(/G-[A-Z0-9]+/);
      if (gaMatch) {
        tracking.adPlatforms.push({ platform: 'google_analytics', id: gaMatch[0] });
      }
    }

    // Google Tag Manager
    if (html.includes('GTM-') || html.includes('googletagmanager')) {
      tracking.tags.push('gtm');
      const gtmMatch = html.match(/GTM-[A-Z0-9]+/);
      if (gtmMatch) {
        tracking.adPlatforms.push({ platform: 'google_tag_manager', id: gtmMatch[0] });
      }
    }

    // Facebook Pixel
    if (html.includes('fbq') || html.includes('facebook.com/tr') || html.includes('connect.facebook')) {
      tracking.tags.push('fb-pixel');
      const fbMatch = html.match(/fbq\(['"]init['"],\s*['"](\d+)['"]/);
      if (fbMatch) {
        tracking.adPlatforms.push({ platform: 'facebook_ads', id: fbMatch[1] });
      }
    }

    // Google Ads
    if (html.includes('AW-') || html.includes('googleads') || html.includes('conversion')) {
      const awMatch = html.match(/AW-\d+/);
      if (awMatch) {
        tracking.tags.push('google_ads');
        tracking.adPlatforms.push({ platform: 'google_ads', id: awMatch[0] });
      }
    }

    // LinkedIn Insight Tag
    if (html.includes('linkedin.com/px') || html.includes('_linkedin_partner_id')) {
      tracking.tags.push('linkedin-insight');
    }

    // Twitter/X Pixel
    if (html.includes('twq') || html.includes('analytics.twitter.com')) {
      tracking.tags.push('twitter-pixel');
    }

    // Hotjar
    if (html.includes('hotjar') || html.includes('hj(')) {
      tracking.tags.push('hotjar');
    }

    // Mixpanel
    if (html.includes('mixpanel')) {
      tracking.tags.push('mixpanel');
    }

    // Segment
    if (html.includes('segment.com') || html.includes('analytics.js')) {
      tracking.tags.push('segment');
    }

    return tracking;
  }

  // ─────────────────────────────────────────────────────────────────
  // CTA CANDIDATE EXTRACTION
  // ─────────────────────────────────────────────────────────────────

  _extractCtaCandidates(websiteData) {
    const html = websiteData.html || '';
    const candidates = [];

    // Button elements with CTA-like text
    const buttonPatterns = [
      /get started/gi, /sign up/gi, /try free/gi, /book demo/gi, /schedule/gi,
      /contact us/gi, /learn more/gi, /download/gi, /subscribe/gi, /join/gi,
      /buy now/gi, /add to cart/gi, /start trial/gi, /request/gi, /claim/gi
    ];

    // Look for anchor tags with CTA classes/text
    const ctaClassPatterns = /class="[^"]*\b(cta|btn|button|action)[^"]*"/gi;
    const ctaMatches = html.matchAll(/<a[^>]*class="[^"]*\b(cta|btn|button|action)[^"]*"[^>]*>([^<]+)<\/a>/gi);
    
    for (const match of ctaMatches) {
      candidates.push({
        type: 'link',
        text: match[2]?.trim() || '',
        html: match[0],
        source: 'class_pattern'
      });
    }

    // Look for buttons
    const buttonMatches = html.matchAll(/<button[^>]*>([^<]+)<\/button>/gi);
    for (const match of buttonMatches) {
      const text = match[1]?.trim() || '';
      if (text && text.length < 50) {
        candidates.push({
          type: 'button',
          text: text,
          html: match[0],
          source: 'button_element'
        });
      }
    }

    // Look for tel: links
    const telMatches = html.matchAll(/<a[^>]*href="tel:([^"]+)"[^>]*>([^<]*)<\/a>/gi);
    for (const match of telMatches) {
      candidates.push({
        type: 'phone',
        target: match[1],
        text: match[2]?.trim() || match[1],
        source: 'tel_link'
      });
    }

    // Look for WhatsApp links
    const waMatches = html.matchAll(/<a[^>]*href="(https?:\/\/wa\.me\/[^"]+)"[^>]*>/gi);
    for (const match of waMatches) {
      candidates.push({
        type: 'whatsapp',
        target: match[1],
        text: 'WhatsApp',
        source: 'wa_link'
      });
    }

    // Look for mailto: links
    const mailMatches = html.matchAll(/<a[^>]*href="mailto:([^"]+)"[^>]*>/gi);
    for (const match of mailMatches) {
      candidates.push({
        type: 'email',
        target: match[1],
        text: match[1],
        source: 'mailto_link'
      });
    }

    return candidates;
  }

  // ─────────────────────────────────────────────────────────────────
  // FORM EXTRACTION
  // ─────────────────────────────────────────────────────────────────

  _extractForms(websiteData) {
    const html = websiteData.html || '';
    const forms = [];

    // Find all form elements
    const formMatches = html.matchAll(/<form[^>]*>([\s\S]*?)<\/form>/gi);
    
    for (const match of formMatches) {
      const formHtml = match[0];
      const formContent = match[1];
      
      const form = {
        action: '',
        method: 'post',
        fields: [],
        hasPhone: false,
        hasEmail: false,
        hasName: false,
        hasCompany: false,
        submitText: ''
      };

      // Extract action URL
      const actionMatch = formHtml.match(/action="([^"]+)"/i);
      if (actionMatch) form.action = actionMatch[1];

      // Extract method
      const methodMatch = formHtml.match(/method="([^"]+)"/i);
      if (methodMatch) form.method = methodMatch[1].toLowerCase();

      // Find input fields
      const inputMatches = formContent.matchAll(/<input[^>]*>/gi);
      for (const inputMatch of inputMatches) {
        const input = inputMatch[0];
        const nameMatch = input.match(/name="([^"]+)"/i);
        const typeMatch = input.match(/type="([^"]+)"/i);
        const placeholderMatch = input.match(/placeholder="([^"]+)"/i);
        
        const fieldName = nameMatch?.[1] || '';
        const fieldType = typeMatch?.[1] || 'text';
        
        if (['hidden', 'submit'].includes(fieldType)) continue;
        
        form.fields.push({
          name: fieldName,
          type: fieldType,
          placeholder: placeholderMatch?.[1] || ''
        });

        // Check for common field types
        const lowerName = fieldName.toLowerCase();
        if (lowerName.includes('phone') || lowerName.includes('tel')) form.hasPhone = true;
        if (lowerName.includes('email')) form.hasEmail = true;
        if (lowerName.includes('name') && !lowerName.includes('company')) form.hasName = true;
        if (lowerName.includes('company') || lowerName.includes('organization')) form.hasCompany = true;
      }

      // Find submit button text
      const submitMatch = formContent.match(/<button[^>]*type="submit"[^>]*>([^<]+)<\/button>/i) ||
                         formContent.match(/<input[^>]*type="submit"[^>]*value="([^"]+)"/i);
      if (submitMatch) form.submitText = submitMatch[1];

      if (form.fields.length > 0) {
        forms.push(form);
      }
    }

    return forms;
  }

  // ─────────────────────────────────────────────────────────────────
  // CHAT WIDGET DETECTION
  // ─────────────────────────────────────────────────────────────────

  _detectChatWidgets(websiteData) {
    const html = websiteData.html || '';
    const chat = {
      detected: false,
      vendors: []
    };

    const chatVendors = [
      { name: 'Intercom', patterns: ['intercom', 'intercomSettings'] },
      { name: 'Drift', patterns: ['drift', 'driftWidget'] },
      { name: 'Tawk.to', patterns: ['tawk', 'Tawk_API'] },
      { name: 'Zendesk', patterns: ['zendeskChat', 'zE('] },
      { name: 'HubSpot', patterns: ['hubspot', 'hs-script-loader'] },
      { name: 'Crisp', patterns: ['crisp.chat', '$crisp'] },
      { name: 'LiveChat', patterns: ['livechatinc', '__lc'] },
      { name: 'Freshdesk', patterns: ['freshchat', 'freshdesk'] },
      { name: 'Olark', patterns: ['olark'] },
      { name: 'Tidio', patterns: ['tidio', 'tidioChatApi'] }
    ];

    for (const vendor of chatVendors) {
      for (const pattern of vendor.patterns) {
        if (html.toLowerCase().includes(pattern.toLowerCase())) {
          chat.detected = true;
          if (!chat.vendors.includes(vendor.name)) {
            chat.vendors.push(vendor.name);
          }
          break;
        }
      }
    }

    return chat;
  }

  // ─────────────────────────────────────────────────────────────────
  // BOOKING TOOL DETECTION
  // ─────────────────────────────────────────────────────────────────

  _detectBookingTools(websiteData) {
    const html = websiteData.html || '';
    const booking = {
      detected: false,
      tools: [],
      links: []
    };

    const bookingTools = [
      { name: 'Calendly', pattern: /calendly\.com\/([a-zA-Z0-9-_/]+)/gi },
      { name: 'HubSpot Meetings', pattern: /meetings\.hubspot\.com\/([a-zA-Z0-9-_/]+)/gi },
      { name: 'Acuity', pattern: /acuityscheduling\.com\/([a-zA-Z0-9-_/]+)/gi },
      { name: 'YouCanBook.me', pattern: /youcanbook\.me\/([a-zA-Z0-9-_/]+)/gi },
      { name: 'Cal.com', pattern: /cal\.com\/([a-zA-Z0-9-_/]+)/gi },
      { name: 'Savvycal', pattern: /savvycal\.com\/([a-zA-Z0-9-_/]+)/gi },
      { name: 'Chili Piper', pattern: /chilipiper\.com/gi }
    ];

    for (const tool of bookingTools) {
      const matches = html.matchAll(tool.pattern);
      for (const match of matches) {
        booking.detected = true;
        if (!booking.tools.includes(tool.name)) {
          booking.tools.push(tool.name);
        }
        booking.links.push(match[0]);
      }
    }

    return booking;
  }

  // ─────────────────────────────────────────────────────────────────
  // PROMPT BUILDING
  // ─────────────────────────────────────────────────────────────────

  _buildAnalysisPrompt(businessIdentity, websiteData, tracking, ctas, forms, chat, booking, externalPresence) {
    const businessName = businessIdentity?.business_identity?.name?.value || 'Unknown Business';

    return `
BUSINESS: ${businessName}
URL: ${websiteData.url}

=== DETECTED TRACKING & ANALYTICS ===
Tags Found: ${tracking.tags.join(', ') || 'None'}
Ad Platforms:
${tracking.adPlatforms.map(p => `- ${p.platform}: ${p.id}`).join('\n') || 'None detected'}

=== CTA CANDIDATES DETECTED ===
${ctas.slice(0, 30).map((c, i) => `[${i + 1}] Type: ${c.type}, Text: "${c.text}", Target: ${c.target || 'N/A'}`).join('\n')}

=== FORMS DETECTED ===
${forms.map((f, i) => `
Form ${i + 1}:
- Action: ${f.action || 'N/A'}
- Fields: ${f.fields.map(field => field.name || field.placeholder).join(', ')}
- Has Phone: ${f.hasPhone}, Has Email: ${f.hasEmail}, Has Company: ${f.hasCompany}
- Submit Button: "${f.submitText || 'Submit'}"
`).join('\n') || 'No forms detected'}

=== CHAT WIDGETS ===
Detected: ${chat.detected}
Vendors: ${chat.vendors.join(', ') || 'None'}

=== BOOKING/SCHEDULING TOOLS ===
Detected: ${booking.detected}
Tools: ${booking.tools.join(', ') || 'None'}
Links: ${booking.links.join(', ') || 'N/A'}

=== PAGE CONTENT (Hero & Key Sections) ===
${(websiteData.textContent || '').slice(0, 3000)}

=== EXTERNAL PRESENCE (from Phase 2) ===
${externalPresence ? `
- Social Profiles: ${externalPresence.profiles_discovered || 0}
- GBP Found: ${!!externalPresence.profiles?.google_business_profile}
` : 'Not available'}

=== ANALYSIS TASK ===
1. Identify all marketing channels based on evidence
2. Map all CTAs with type, text, target, and confidence
3. Model engagement paths (landing → conversion)
4. Classify the sales process type
5. Identify entry offers, core product, upsells, cross-sells
6. Return ONLY the JSON object following the schema`;
  }

  // ─────────────────────────────────────────────────────────────────
  // VALIDATION AND ENRICHMENT
  // ─────────────────────────────────────────────────────────────────

  _validateAndEnrich(llmResult, url, tracking, ctas) {
    let analysis = llmResult.parsed || this._getEmptyAnalysis(url);
    
    // Ensure required fields
    analysis.url = url;
    analysis.extracted_at = new Date().toISOString();
    analysis.phase = 'phase3_marketing_conversion';
    analysis.model_used = llmResult.model;
    
    // Ensure tracking data is included
    if (!analysis.marketing) {
      analysis.marketing = { channels: [], tracking_tags: [], ad_platform_ids: [] };
    }
    analysis.marketing.tracking_tags = [...new Set([
      ...(analysis.marketing.tracking_tags || []),
      ...tracking.tags
    ])];
    analysis.marketing.ad_platform_ids = [
      ...(analysis.marketing.ad_platform_ids || []),
      ...tracking.adPlatforms
    ];
    
    // Count total CTAs
    analysis.total_ctas = 
      (analysis.landing_pages?.reduce((sum, lp) => 
        sum + (lp.primary_ctas?.length || 0) + (lp.supporting_ctas?.length || 0), 0) || 0);
    
    // Calculate overall confidence
    analysis.overall_confidence = this._calculateOverallConfidence(analysis);
    
    // Add metadata
    analysis._metadata = {
      llm_tokens: llmResult.usage,
      detected_elements: {
        tracking_tags: tracking.tags.length,
        cta_candidates: ctas.length,
        ad_platforms: tracking.adPlatforms.length
      }
    };
    
    return analysis;
  }

  _calculateOverallConfidence(analysis) {
    const factors = [];
    
    // CTA detection confidence
    if (analysis.total_ctas > 0) {
      factors.push(Math.min(1.0, 0.5 + analysis.total_ctas * 0.1));
    }
    
    // Tracking tags (indicates marketing maturity)
    if (analysis.marketing?.tracking_tags?.length > 0) {
      factors.push(0.7);
    }
    
    // Engagement paths defined
    if (analysis.engagement_paths?.length > 0) {
      const avgPathConfidence = analysis.engagement_paths.reduce((sum, p) => sum + (p.confidence || 0), 0) / analysis.engagement_paths.length;
      factors.push(avgPathConfidence);
    }
    
    // Sales process identified
    if (analysis.sales_process?.type) {
      factors.push(0.65);
    }
    
    if (factors.length === 0) return 0;
    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  // ─────────────────────────────────────────────────────────────────
  // EMPTY/ERROR PROFILES
  // ─────────────────────────────────────────────────────────────────

  _getEmptyAnalysis(url) {
    return {
      url: url,
      extracted_at: new Date().toISOString(),
      phase: 'phase3_marketing_conversion',
      marketing: {
        channels: [],
        tracking_tags: [],
        ad_platform_ids: []
      },
      landing_pages: [],
      engagement_paths: [],
      sales_process: {
        type: null,
        inbound: '',
        outbound: '',
        evidence: []
      },
      product_journey: {
        entry_offers: [],
        core_product: '',
        upsells: [],
        cross_sells: []
      },
      evidence: [],
      total_ctas: 0,
      overall_confidence: 0
    };
  }

  _getErrorAnalysis(url, error) {
    const analysis = this._getEmptyAnalysis(url);
    analysis.extraction_error = error;
    analysis.extraction_status = 'failed';
    return analysis;
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { MarketingConversionAgent, PHASE3_OUTPUT_SCHEMA };
export default MarketingConversionAgent;
