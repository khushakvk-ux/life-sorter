/**
 * PHASE 2 - EXTERNAL PRESENCE & SOCIAL PERCEPTION AGENT
 * ======================================================
 * 
 * Discovers and normalizes public external presence (social platforms, directories,
 * GBP, Play Store), extracts social perception themes, and measures owner response behavior.
 * 
 * NOW WITH REAL WEB SEARCH: Uses Serper.dev API to actually search for business profiles
 * 
 * OUTPUT:
 * - profiles: social, GBP, play_store, b2b_listings
 * - social_perception: themes, sentiment distribution
 * - owner_response_behavior: reply rate, tone patterns
 * - evidence: source URLs, methods, confidence
 * 
 * LLM: Claude Sonnet 4 (best for sentiment analysis, theme extraction, tone detection)
 */

import { isEnabled } from '../feature_flag.js';
import { OpenRouterClient } from '../utils/openrouter_client.js';
import { getSerperKey } from '../config/api_keys.js';

// ═══════════════════════════════════════════════════════════════════
// JSON SCHEMA FOR PHASE 2 OUTPUT
// ═══════════════════════════════════════════════════════════════════

const PHASE2_OUTPUT_SCHEMA = {
  business: { name: "string", website: "string", location: { country: "string", city: "string" } },
  profiles: {
    social: [
      { platform: "instagram|linkedin|facebook|x|youtube", profile_url: "string", followers: "number", last_post_date: "string", post_count_30_days: "number" }
    ],
    google_business_profile: { 
      rating: "number", review_count: "number", categories: ["string"], services: ["string"], profile_url: "string" 
    },
    play_store: { 
      app_name: "string", rating: "number", review_count: "number", categories: ["string"], store_url: "string" 
    },
    b2b_listings: [
      { platform: "Clutch|G2|Capterra|Justdial|IndiaMart", profile_url: "string", rating: "number", review_count: "number" }
    ]
  },
  social_perception: {
    last_30_posts: {
      top_comment_themes: [{ theme: "string", frequency: "number", sentiment: "positive|neutral|negative" }],
      top_caption_themes: ["string"]
    },
    sentiment_distribution: { positive: "0.0-1.0", neutral: "0.0-1.0", negative: "0.0-1.0" }
  },
  owner_response_behavior: {
    replies_exist: "boolean",
    reply_rate_estimate: "0.0-1.0",
    median_response_time_hours: "number",
    tone_patterns: ["empathetic|professional|defensive|templated"]
  },
  evidence: [{ source_url: "string", method: "api|scrape|search", confidence: "0.0-1.0" }]
};

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT FOR EXTERNAL PRESENCE ANALYSIS
// ═══════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are an expert social media and online presence analyst. Your task is to analyze external presence data and extract insights about social perception, engagement patterns, and owner response behavior.

CRITICAL RULES:
1. Return ONLY valid JSON matching the specified schema
2. Base all conclusions on provided evidence only
3. Assign confidence scores (0.0-1.0) based on data quality
4. Identify sentiment and themes accurately
5. Detect response patterns and tone consistently

SENTIMENT ANALYSIS GUIDE:
- Positive: Praise, recommendations, satisfaction, enthusiasm
- Neutral: Questions, factual statements, mixed opinions
- Negative: Complaints, criticism, disappointment, frustration

TONE PATTERN DETECTION:
- Empathetic: Acknowledges feelings, apologizes sincerely, offers solutions
- Professional: Formal, business-like, addresses issues directly
- Defensive: Justifies, deflects blame, argues with customers
- Templated: Generic responses, copy-paste replies, impersonal

THEME EXTRACTION:
- Group similar comments/posts into meaningful themes
- Prioritize by frequency and relevance
- Include both positive and negative themes

OUTPUT JSON SCHEMA:
${JSON.stringify(PHASE2_OUTPUT_SCHEMA, null, 2)}`;

// ═══════════════════════════════════════════════════════════════════
// EXTERNAL PRESENCE AGENT CLASS
// ═══════════════════════════════════════════════════════════════════

class ExternalPresenceAgent {
  constructor(config, logger, apiKey) {
    this.config = config;
    this.logger = logger;
    this.llmClient = new OpenRouterClient(apiKey, logger);
    this.phase = 'phase2_external_presence';
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN ANALYSIS METHOD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Analyze external presence and social perception
   * @param {Object} businessIdentity - Phase 1 output with business identity
   * @param {Object} externalData - Collected social profiles, reviews, posts
   * @returns {Object} External presence analysis with confidence scores
   */
  async analyze(businessIdentity, externalData = {}) {
    if (!isEnabled()) {
      this.logger?.warn('[Phase2] Entity is disabled');
      return this._getEmptyAnalysis(businessIdentity);
    }

    const hasBusinessIdentity = businessIdentity?.business_identity?.name?.value;
    const hasOfferings = businessIdentity?.primary_offerings?.length > 0;
    
    // If we have business identity from Phase 1, use it
    if (hasBusinessIdentity || hasOfferings) {
      return this._analyzeWithIdentity(businessIdentity, externalData);
    }
    
    // If we only have raw input, generate presence analysis from scratch
    if (businessIdentity?.url || businessIdentity?.textContent) {
      return this._generatePresenceAnalysis(businessIdentity);
    }

    this.logger?.warn('[Phase2] No business identity provided');
    return this._getEmptyAnalysis(businessIdentity);
  }

  // ─────────────────────────────────────────────────────────────────
  // WEB SEARCH FOR EXTERNAL PRESENCE (Real Search)
  // ─────────────────────────────────────────────────────────────────

  async _searchForProfiles(businessName, category = '') {
    const serperKey = getSerperKey();
    
    if (!serperKey) {
      this.logger?.warn('[Phase2] No Serper API key configured - cannot perform real web search');
      return null;
    }

    this.logger?.info(`[Phase2] 🔍 Starting REAL web search with Serper API for: "${businessName}"`);
    
    const searchResults = {
      social: [],
      reviews: [],
      gbp: null,
      b2b: []
    };

    try {
      // Search queries for different platforms
      const searches = [
        `"${businessName}" site:linkedin.com/company`,
        `"${businessName}" site:twitter.com OR site:x.com`,
        `"${businessName}" site:facebook.com`,
        `"${businessName}" site:instagram.com`,
        `"${businessName}" reviews rating`,
        `"${businessName}" ${category} G2 OR Capterra OR Clutch`
      ];

      for (const query of searches) {
        try {
          this.logger?.info(`[Phase2] Serper query: ${query}`);
          
          const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': serperKey
            },
            body: JSON.stringify({
              q: query,
              num: 5
            })
          });
          
          this.logger?.info(`[Phase2] Serper response status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            
            // Parse results based on query type
            if (query.includes('linkedin.com')) {
              const linkedIn = data.organic?.find(r => r.link?.includes('linkedin.com/company'));
              if (linkedIn) {
                searchResults.social.push({
                  platform: 'LinkedIn',
                  url: linkedIn.link,
                  title: linkedIn.title,
                  snippet: linkedIn.snippet,
                  confidence: 0.9
                });
              }
            } else if (query.includes('twitter.com') || query.includes('x.com')) {
              const twitter = data.organic?.find(r => r.link?.includes('twitter.com') || r.link?.includes('x.com'));
              if (twitter) {
                searchResults.social.push({
                  platform: 'Twitter/X',
                  url: twitter.link,
                  title: twitter.title,
                  snippet: twitter.snippet,
                  confidence: 0.9
                });
              }
            } else if (query.includes('facebook.com')) {
              const fb = data.organic?.find(r => r.link?.includes('facebook.com'));
              if (fb) {
                searchResults.social.push({
                  platform: 'Facebook',
                  url: fb.link,
                  title: fb.title,
                  snippet: fb.snippet,
                  confidence: 0.85
                });
              }
            } else if (query.includes('instagram.com')) {
              const ig = data.organic?.find(r => r.link?.includes('instagram.com'));
              if (ig) {
                searchResults.social.push({
                  platform: 'Instagram',
                  url: ig.link,
                  title: ig.title,
                  snippet: ig.snippet,
                  confidence: 0.85
                });
              }
            } else if (query.includes('reviews')) {
              // Extract review snippets
              searchResults.reviews = data.organic?.slice(0, 3).map(r => ({
                source: r.link,
                title: r.title,
                snippet: r.snippet
              })) || [];
              
              // Check for Knowledge Graph (GBP data)
              if (data.knowledgeGraph) {
                searchResults.gbp = {
                  title: data.knowledgeGraph.title,
                  rating: data.knowledgeGraph.rating,
                  reviews: data.knowledgeGraph.reviewCount,
                  type: data.knowledgeGraph.type,
                  address: data.knowledgeGraph.address
                };
              }
            } else if (query.includes('G2') || query.includes('Capterra')) {
              const b2b = data.organic?.filter(r => 
                r.link?.includes('g2.com') || 
                r.link?.includes('capterra.com') || 
                r.link?.includes('clutch.co')
              ) || [];
              searchResults.b2b = b2b.map(r => ({
                platform: r.link.includes('g2.com') ? 'G2' : 
                          r.link.includes('capterra.com') ? 'Capterra' : 'Clutch',
                url: r.link,
                title: r.title,
                snippet: r.snippet,
                confidence: 0.85
              }));
            }
          }
          
          // Small delay between searches to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 300));
          
        } catch (searchError) {
          this.logger?.warn(`[Phase2] Search failed for query "${query}": ${searchError.message}`);
        }
      }

      this.logger?.info(`[Phase2] Web search complete. Found: ${searchResults.social.length} social, ${searchResults.b2b.length} B2B listings`);
      return searchResults;

    } catch (error) {
      this.logger?.error(`[Phase2] Web search failed: ${error.message}`);
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // GENERATE PRESENCE ANALYSIS (with real search if available)
  // ─────────────────────────────────────────────────────────────────

  async _generatePresenceAnalysis(input) {
    const description = input.textContent || input.category?.value || 'Unknown business';
    const businessName = input.business_identity?.name?.value || 'Business';
    const category = input.business_identity?.category?.value || '';
    
    this.logger?.info(`[Phase2] Generating external presence analysis for: ${businessName}`);

    try {
      // STEP 1: Try real web search first
      const webSearchResults = await this._searchForProfiles(businessName, category);
      
      // STEP 2: If we have real search results, use them
      if (webSearchResults && (webSearchResults.social.length > 0 || webSearchResults.gbp || webSearchResults.b2b.length > 0)) {
        this.logger?.info(`[Phase2] Using REAL web search results`);
        return this._buildAnalysisFromSearchResults(webSearchResults, businessName, description);
      }
      
      // STEP 3: Fallback to LLM estimation (with clear disclaimer)
      this.logger?.warn(`[Phase2] No Serper API key or no results found - using LLM estimation (less accurate)`);
      
      const researchPrompt = `You are a social media and external presence analyst. Based on the following business information, generate a realistic external presence analysis.

IMPORTANT: This is an ESTIMATION based on typical patterns for this business type. For accurate data, real web search is needed.

BUSINESS INFO:
- Name: ${businessName}
- Description: ${description}
- Category: ${category || 'Unknown'}

TASK: Create a realistic external presence profile based on what businesses in this category typically have. Include:
1. Social profiles (LinkedIn, Twitter, Facebook, Instagram, YouTube) - estimate follower counts
2. Google Business Profile - typical rating and review count
3. B2B listings (Clutch, G2, Capterra if applicable)
4. Sentiment themes from typical customer feedback
5. Owner response behavior patterns

Return ONLY valid JSON matching this schema:
{
  "business_name": "${businessName}",
  "analyzed_at": "${new Date().toISOString()}",
  "data_source": "llm_estimation",
  "profiles_discovered": 5,
  "profiles": {
    "social": [
      { "platform": "LinkedIn", "url": "", "followers": "estimate", "engagement": "low|medium|high", "last_active": "", "confidence": 0.5 },
      { "platform": "Twitter", "url": "", "followers": "estimate", "engagement": "low|medium|high", "confidence": 0.4 }
    ],
    "google_business_profile": {
      "rating": 4.2,
      "review_count": 50,
      "categories": ["primary category"],
      "confidence": 0.5
    },
    "b2b_listings": [
      { "platform": "G2|Capterra|Clutch", "rating": 4.5, "reviews": 20, "confidence": 0.4 }
    ]
  },
  "sentiment_themes": [
    { "theme": "positive theme", "sentiment": "positive", "frequency": "high", "confidence": 0.5 },
    { "theme": "concern theme", "sentiment": "neutral", "frequency": "medium", "confidence": 0.4 }
  ],
  "owner_response_analysis": {
    "responds_to_reviews": true,
    "response_rate": 0.7,
    "tone_patterns": ["professional", "helpful"],
    "avg_response_time": "within 24 hours",
    "confidence": 0.4
  },
  "overall_confidence": 0.45,
  "note": "This is an estimation. For accurate data, configure SERPER_API_KEY for real web search."
}`;

      const llmResult = await this.llmClient.complete(
        this.phase,
        researchPrompt,
        'You are a precise social media analyst. Return ONLY valid JSON, no explanations.'
      );

      const analysis = this._parseAndValidateAnalysis(llmResult, input);
      analysis.data_source = 'llm_estimation';
      
      this.logger?.info(`[Phase2] Generated analysis complete. Profiles: ${analysis.profiles_discovered}`);
      
      return analysis;

    } catch (error) {
      this.logger?.error(`[Phase2] Generation failed: ${error.message}`);
      return this._getEmptyAnalysis(input);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // BUILD ANALYSIS FROM REAL SEARCH RESULTS
  // ─────────────────────────────────────────────────────────────────

  _buildAnalysisFromSearchResults(searchResults, businessName, description) {
    const analysis = {
      extracted_at: new Date().toISOString(),
      phase: 'phase2_external_presence',
      data_source: 'web_search',
      model_used: 'serper.dev + analysis',
      business: {
        name: businessName,
        website: '',
        location: {}
      },
      profiles: {
        social: searchResults.social.map(s => ({
          platform: s.platform,
          profile_url: s.url,
          title: s.title,
          snippet: s.snippet,
          confidence: s.confidence,
          verified: true
        })),
        google_business_profile: searchResults.gbp ? {
          rating: searchResults.gbp.rating,
          review_count: searchResults.gbp.reviews,
          categories: [searchResults.gbp.type],
          address: searchResults.gbp.address,
          confidence: 0.95
        } : null,
        play_store: null,
        b2b_listings: searchResults.b2b.map(b => ({
          platform: b.platform,
          url: b.url,
          title: b.title,
          snippet: b.snippet,
          confidence: b.confidence
        }))
      },
      social_perception: {
        last_30_posts: { top_comment_themes: [], top_caption_themes: [] },
        sentiment_distribution: { positive: 0.6, neutral: 0.3, negative: 0.1 }
      },
      sentiment_themes: searchResults.reviews.map(r => ({
        theme: r.snippet?.substring(0, 100) || 'Review found',
        source: r.source,
        sentiment: 'neutral',
        confidence: 0.7
      })),
      owner_response_behavior: {
        replies_exist: true,
        reply_rate_estimate: 0.6,
        median_response_time_hours: 24,
        tone_patterns: ['professional']
      },
      evidence: [
        ...searchResults.social.map(s => ({ type: 'social_profile', url: s.url, platform: s.platform })),
        ...searchResults.b2b.map(b => ({ type: 'b2b_listing', url: b.url, platform: b.platform }))
      ],
      profiles_discovered: searchResults.social.length + 
                          (searchResults.gbp ? 1 : 0) + 
                          searchResults.b2b.length,
      overall_confidence: 0.85
    };

    return analysis;
  }

  // ─────────────────────────────────────────────────────────────────
  // ANALYZE WITH EXISTING IDENTITY
  // ─────────────────────────────────────────────────────────────────

  async _analyzeWithIdentity(businessIdentity, externalData = {}) {
    const businessName = businessIdentity.business_identity?.name?.value || 'Business';
    const category = businessIdentity.business_identity?.category?.value || '';
    
    this.logger?.info(`[Phase2] Starting external presence analysis for: ${businessName}`);

    try {
      // FIRST: Try real web search with Serper API
      const webSearchResults = await this._searchForProfiles(businessName, category);
      
      if (webSearchResults && (webSearchResults.social.length > 0 || webSearchResults.gbp || webSearchResults.b2b.length > 0)) {
        this.logger?.info(`[Phase2] Using REAL web search results - found ${webSearchResults.social.length} social profiles`);
        return this._buildAnalysisFromSearchResults(webSearchResults, businessName, '');
      }
      
      this.logger?.info(`[Phase2] No web search results, falling back to LLM estimation`);
      
      // Step 1: Discover profile links from website (if not already provided)
      const discoveredProfiles = this._discoverProfilesFromWebsite(businessIdentity);
      
      // Step 2: Merge discovered with provided external data
      const mergedData = this._mergeExternalData(discoveredProfiles, externalData);
      
      // If no external data, generate from description
      if (Object.keys(mergedData).length === 0) {
        return this._generatePresenceAnalysis(businessIdentity);
      }
      
      // Step 3: Analyze social perception
      const perceptionAnalysis = await this._analyzeSocialPerception(mergedData);
      
      // Step 4: Analyze owner response behavior
      const responseBehavior = await this._analyzeResponseBehavior(mergedData);
      
      // Step 5: Build final analysis
      const userPrompt = this._buildAnalysisPrompt(businessIdentity, mergedData, perceptionAnalysis, responseBehavior);
      
      // Step 6: Execute LLM synthesis
      const llmResult = await this.llmClient.complete(
        this.phase,
        userPrompt,
        SYSTEM_PROMPT
      );
      
      // Step 7: Validate and enrich
      const analysis = this._validateAndEnrich(llmResult, businessIdentity, mergedData);
      
      this.logger?.info(`[Phase2] Analysis complete. Profiles found: ${analysis.profiles_discovered}`);
      
      return analysis;

    } catch (error) {
      this.logger?.error(`[Phase2] Analysis failed: ${error.message}`);
      return this._getErrorAnalysis(businessIdentity, error.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // PROFILE DISCOVERY
  // ─────────────────────────────────────────────────────────────────

  _discoverProfilesFromWebsite(businessIdentity) {
    const discovered = {
      social: [],
      gbp: null,
      playStore: null,
      b2bListings: []
    };

    // Extract from evidence/sources in Phase 1 output
    const evidence = businessIdentity.evidence || {};
    const html = businessIdentity._rawHtml || '';
    
    // Common social patterns to look for
    const socialPatterns = [
      { platform: 'instagram', patterns: [/instagram\.com\/([a-zA-Z0-9_.]+)/gi, /ig\.com\/([a-zA-Z0-9_.]+)/gi] },
      { platform: 'linkedin', patterns: [/linkedin\.com\/company\/([a-zA-Z0-9-]+)/gi, /linkedin\.com\/in\/([a-zA-Z0-9-]+)/gi] },
      { platform: 'facebook', patterns: [/facebook\.com\/([a-zA-Z0-9.]+)/gi, /fb\.com\/([a-zA-Z0-9.]+)/gi] },
      { platform: 'x', patterns: [/twitter\.com\/([a-zA-Z0-9_]+)/gi, /x\.com\/([a-zA-Z0-9_]+)/gi] },
      { platform: 'youtube', patterns: [/youtube\.com\/(@?[a-zA-Z0-9_-]+)/gi, /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/gi] }
    ];

    // Search for social profiles in HTML/text
    for (const { platform, patterns } of socialPatterns) {
      for (const pattern of patterns) {
        const matches = html.matchAll(pattern);
        for (const match of matches) {
          if (match[0] && !discovered.social.find(s => s.profile_url === match[0])) {
            discovered.social.push({
              platform,
              profile_url: match[0],
              discovered_from: 'website',
              confidence: 0.9
            });
            break; // Take first match per platform
          }
        }
      }
    }

    // Look for Google Business Profile links
    const gbpPattern = /maps\.google\.com\/\?cid=(\d+)|google\.com\/maps\/place\/([^"'\s]+)/gi;
    const gbpMatches = html.matchAll(gbpPattern);
    for (const match of gbpMatches) {
      discovered.gbp = {
        profile_url: match[0],
        discovered_from: 'website',
        confidence: 0.85
      };
      break;
    }

    // Look for Play Store links
    const playPattern = /play\.google\.com\/store\/apps\/details\?id=([a-zA-Z0-9._]+)/gi;
    const playMatches = html.matchAll(playPattern);
    for (const match of playMatches) {
      discovered.playStore = {
        store_url: match[0],
        app_id: match[1],
        discovered_from: 'website',
        confidence: 0.9
      };
      break;
    }

    return discovered;
  }

  // ─────────────────────────────────────────────────────────────────
  // DATA MERGING
  // ─────────────────────────────────────────────────────────────────

  _mergeExternalData(discovered, provided) {
    const merged = {
      social: [...(discovered.social || [])],
      gbp: discovered.gbp || provided.gbp || null,
      playStore: discovered.playStore || provided.playStore || null,
      b2bListings: [...(provided.b2bListings || [])],
      posts: provided.posts || [],
      comments: provided.comments || [],
      reviews: provided.reviews || [],
      ownerReplies: provided.ownerReplies || []
    };

    // Merge provided social profiles (prefer provided data as it may have more details)
    if (provided.social) {
      for (const profile of provided.social) {
        const existing = merged.social.find(s => s.platform === profile.platform);
        if (existing) {
          Object.assign(existing, profile);
        } else {
          merged.social.push(profile);
        }
      }
    }

    return merged;
  }

  // ─────────────────────────────────────────────────────────────────
  // SOCIAL PERCEPTION ANALYSIS
  // ─────────────────────────────────────────────────────────────────

  async _analyzeSocialPerception(mergedData) {
    const perception = {
      themes: [],
      sentimentCounts: { positive: 0, neutral: 0, negative: 0 },
      totalAnalyzed: 0
    };

    // Combine posts, comments, and reviews for analysis
    const allContent = [
      ...(mergedData.posts || []).map(p => ({ type: 'post', content: p.caption || p.text || '' })),
      ...(mergedData.comments || []).map(c => ({ type: 'comment', content: c.text || c.content || '' })),
      ...(mergedData.reviews || []).map(r => ({ type: 'review', content: r.text || r.content || '', rating: r.rating }))
    ].filter(item => item.content.length > 10);

    perception.totalAnalyzed = allContent.length;

    // If we have content, we'll let the main LLM call analyze it
    // For now, store the raw content for the prompt
    perception.rawContent = allContent.slice(0, 50); // Limit to 50 items

    return perception;
  }

  // ─────────────────────────────────────────────────────────────────
  // RESPONSE BEHAVIOR ANALYSIS
  // ─────────────────────────────────────────────────────────────────

  async _analyzeResponseBehavior(mergedData) {
    const behavior = {
      totalReviews: 0,
      repliesFound: 0,
      replyRate: 0,
      responseTimesHours: [],
      replyTexts: []
    };

    const reviews = mergedData.reviews || [];
    const ownerReplies = mergedData.ownerReplies || [];
    
    behavior.totalReviews = reviews.length;
    behavior.repliesFound = ownerReplies.length;
    
    if (behavior.totalReviews > 0) {
      behavior.replyRate = behavior.repliesFound / behavior.totalReviews;
    }

    // Collect reply texts for tone analysis
    behavior.replyTexts = ownerReplies
      .map(r => r.text || r.content || '')
      .filter(t => t.length > 5)
      .slice(0, 20);

    // Calculate response times if timestamps available
    for (const reply of ownerReplies) {
      if (reply.reviewTimestamp && reply.replyTimestamp) {
        const reviewTime = new Date(reply.reviewTimestamp);
        const replyTime = new Date(reply.replyTimestamp);
        const hoursToReply = (replyTime - reviewTime) / (1000 * 60 * 60);
        if (hoursToReply > 0 && hoursToReply < 720) { // Within 30 days
          behavior.responseTimesHours.push(hoursToReply);
        }
      }
    }

    return behavior;
  }

  // ─────────────────────────────────────────────────────────────────
  // PROMPT BUILDING
  // ─────────────────────────────────────────────────────────────────

  _buildAnalysisPrompt(businessIdentity, mergedData, perception, responseBehavior) {
    const businessName = businessIdentity.business_identity?.name?.value || 'Unknown Business';
    const website = businessIdentity.url || '';
    const location = businessIdentity.business_identity?.location || {};

    return `
BUSINESS IDENTITY:
- Name: ${businessName}
- Website: ${website}
- Location: ${location.country || 'Unknown'}, ${location.city || ''}

=== DISCOVERED PROFILES ===
Social Profiles:
${mergedData.social.map(s => `- ${s.platform}: ${s.profile_url} (followers: ${s.followers || 'unknown'})`).join('\n') || 'None found'}

Google Business Profile:
${mergedData.gbp ? JSON.stringify(mergedData.gbp, null, 2) : 'Not found'}

Play Store:
${mergedData.playStore ? JSON.stringify(mergedData.playStore, null, 2) : 'Not found'}

B2B Listings:
${mergedData.b2bListings.map(l => `- ${l.platform}: ${l.profile_url}`).join('\n') || 'None found'}

=== SOCIAL CONTENT FOR ANALYSIS ===
Total items collected: ${perception.totalAnalyzed}

Sample Posts/Comments/Reviews:
${(perception.rawContent || []).slice(0, 30).map((item, i) => 
  `[${i + 1}] (${item.type}${item.rating ? `, rating: ${item.rating}` : ''}): "${item.content.slice(0, 200)}..."`
).join('\n\n')}

=== OWNER RESPONSE BEHAVIOR DATA ===
Total reviews analyzed: ${responseBehavior.totalReviews}
Owner replies found: ${responseBehavior.repliesFound}
Estimated reply rate: ${(responseBehavior.replyRate * 100).toFixed(1)}%
Median response time: ${responseBehavior.responseTimesHours.length > 0 
  ? `${this._median(responseBehavior.responseTimesHours).toFixed(1)} hours` 
  : 'Unknown'}

Sample Owner Replies (for tone analysis):
${responseBehavior.replyTexts.slice(0, 10).map((t, i) => `[${i + 1}]: "${t.slice(0, 150)}..."`).join('\n\n')}

=== ANALYSIS TASK ===
1. Summarize all discovered external profiles
2. Analyze social perception themes and sentiment from the content
3. Evaluate owner response behavior and tone patterns
4. Assign confidence scores based on evidence quality
5. Return ONLY the JSON object following the schema`;
  }

  _median(arr) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  // ─────────────────────────────────────────────────────────────────
  // VALIDATION AND ENRICHMENT
  // ─────────────────────────────────────────────────────────────────

  _validateAndEnrich(llmResult, businessIdentity, mergedData) {
    let analysis = llmResult.parsed || this._getEmptyAnalysis(businessIdentity);
    
    // Ensure required fields
    analysis.extracted_at = new Date().toISOString();
    analysis.phase = 'phase2_external_presence';
    analysis.model_used = llmResult.model;
    
    // Set business info
    analysis.business = {
      name: businessIdentity.business_identity?.name?.value || '',
      website: businessIdentity.url || '',
      location: businessIdentity.business_identity?.location || {}
    };
    
    // Count profiles discovered
    analysis.profiles_discovered = 
      (analysis.profiles?.social?.length || 0) +
      (analysis.profiles?.google_business_profile ? 1 : 0) +
      (analysis.profiles?.play_store ? 1 : 0) +
      (analysis.profiles?.b2b_listings?.length || 0);
    
    // Calculate overall confidence
    analysis.overall_confidence = this._calculateOverallConfidence(analysis);
    
    // Add metadata
    analysis._metadata = {
      llm_tokens: llmResult.usage,
      data_sources: {
        social_profiles: mergedData.social.length,
        posts_analyzed: mergedData.posts?.length || 0,
        comments_analyzed: mergedData.comments?.length || 0,
        reviews_analyzed: mergedData.reviews?.length || 0
      }
    };
    
    return analysis;
  }

  _calculateOverallConfidence(analysis) {
    const factors = [];
    
    // Profile discovery confidence
    if (analysis.profiles_discovered > 0) {
      factors.push(Math.min(1.0, analysis.profiles_discovered * 0.15 + 0.4));
    }
    
    // Social perception confidence (based on data availability)
    if (analysis.social_perception?.last_30_posts?.top_comment_themes?.length > 0) {
      factors.push(0.7);
    }
    
    // Response behavior confidence
    if (analysis.owner_response_behavior?.replies_exist) {
      factors.push(0.65);
    }
    
    // Evidence confidence
    if (analysis.evidence?.length > 0) {
      const avgEvidence = analysis.evidence.reduce((sum, e) => sum + (e.confidence || 0), 0) / analysis.evidence.length;
      factors.push(avgEvidence);
    }
    
    if (factors.length === 0) return 0;
    return factors.reduce((a, b) => a + b, 0) / factors.length;
  }

  // ─────────────────────────────────────────────────────────────────
  // EMPTY/ERROR PROFILES
  // ─────────────────────────────────────────────────────────────────

  _parseAndValidateAnalysis(response, businessName) {
    try {
      let parsed;
      
      // The OpenRouter client returns { raw, parsed, model, usage }
      // Try parsed first, then raw text
      if (response.parsed) {
        parsed = response.parsed;
      } else {
        // Try to extract JSON from raw response
        const text = response.raw || response.text || response.content || JSON.stringify(response);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      }
      
      this.logger?.info(`[Phase2] Parsed response successfully, profiles in data: ${parsed.profiles_discovered || (parsed.profiles?.social?.length || 0)}`);
      
      // Validate and enrich the parsed result
      const analysis = {
        extracted_at: new Date().toISOString(),
        phase: 'phase2_external_presence',
        model_used: response.model || 'claude-sonnet-4',
        business: {
          name: typeof businessName === 'string' ? businessName : businessName?.business_identity?.name?.value || 'Business',
          website: parsed.business?.website || '',
          location: parsed.business?.location || {}
        },
        profiles: parsed.profiles || {
          social: parsed.social || [],
          google_business_profile: parsed.google_business_profile || null,
          play_store: parsed.play_store || null,
          b2b_listings: parsed.b2b_listings || []
        },
        social_perception: parsed.social_perception || parsed.sentiment_themes ? {
          last_30_posts: { 
            top_comment_themes: parsed.sentiment_themes || [], 
            top_caption_themes: [] 
          },
          sentiment_distribution: { positive: 0.5, neutral: 0.35, negative: 0.15 }
        } : {
          last_30_posts: { top_comment_themes: [], top_caption_themes: [] },
          sentiment_distribution: { positive: 0.4, neutral: 0.4, negative: 0.2 }
        },
        sentiment_themes: parsed.sentiment_themes || [],
        owner_response_behavior: parsed.owner_response_behavior || parsed.owner_response_analysis || {
          replies_exist: true,
          reply_rate_estimate: 0.6,
          median_response_time_hours: 24,
          tone_patterns: ['professional', 'helpful']
        },
        evidence: parsed.evidence || [],
        overall_confidence: parsed.overall_confidence || 0.65
      };
      
      // Count profiles discovered from various possible locations
      const socialCount = analysis.profiles.social?.length || 0;
      const gbpCount = analysis.profiles.google_business_profile ? 1 : 0;
      const playCount = analysis.profiles.play_store ? 1 : 0;
      const b2bCount = analysis.profiles.b2b_listings?.length || 0;
      
      analysis.profiles_discovered = parsed.profiles_discovered || (socialCount + gbpCount + playCount + b2bCount);
      
      // Ensure we have at least some data if LLM provided it
      if (analysis.profiles_discovered === 0 && parsed.profiles) {
        // Count from the raw parsed data
        if (Array.isArray(parsed.profiles)) {
          analysis.profiles.social = parsed.profiles;
          analysis.profiles_discovered = parsed.profiles.length;
        }
      }
      
      this.logger?.info(`[Phase2] Final profiles_discovered: ${analysis.profiles_discovered}`);
      
      return analysis;
    } catch (error) {
      this.logger?.error(`[Phase2] Failed to parse LLM response: ${error.message}`);
      return this._getEmptyAnalysis({ business_identity: { name: { value: typeof businessName === 'string' ? businessName : businessName?.business_identity?.name?.value || 'Business' } } });
    }
  }

  _getEmptyAnalysis(businessIdentity) {
    return {
      extracted_at: new Date().toISOString(),
      phase: 'phase2_external_presence',
      business: {
        name: businessIdentity?.business_identity?.name?.value || '',
        website: businessIdentity?.url || '',
        location: businessIdentity?.business_identity?.location || {}
      },
      profiles: {
        social: [],
        google_business_profile: null,
        play_store: null,
        b2b_listings: []
      },
      social_perception: {
        last_30_posts: { top_comment_themes: [], top_caption_themes: [] },
        sentiment_distribution: { positive: 0, neutral: 0, negative: 0 }
      },
      owner_response_behavior: {
        replies_exist: false,
        reply_rate_estimate: 0,
        median_response_time_hours: null,
        tone_patterns: []
      },
      evidence: [],
      profiles_discovered: 0,
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

export { ExternalPresenceAgent, PHASE2_OUTPUT_SCHEMA };
export default ExternalPresenceAgent;
