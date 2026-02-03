# 🔍 Market Intelligence Entity

> A comprehensive, 4-phase market intelligence system powered by OpenRouter API with optimal LLM selection per phase.

## ⚡ Quick Start (Enhanced Pipeline)

```javascript
import { EnhancedMarketOrchestrator, isEnabled } from './modules/market_intelligence_entity';

// Initialize with your OpenRouter API key
const orchestrator = new EnhancedMarketOrchestrator('your-openrouter-api-key');

// Execute the full 4-phase pipeline
const report = await orchestrator.execute({
  websiteUrl: 'https://example.com',
  textContent: 'Scraped website text content...',
  seedKeywords: ['AI SaaS', 'automation'],
});

// Access the consolidated report
console.log(report.report_markdown);  // Human-readable report
console.log(report.overall_confidence);  // 0.0 - 1.0
```

---

## 🎯 4-Phase Pipeline

| Phase | Name | Description | LLM | Why This LLM |
|-------|------|-------------|-----|--------------|
| **1** | Website Extraction | Business identity, offerings, proof assets | **Claude Sonnet 4** | Best for structured data extraction with precise JSON output |
| **2** | External Presence | Social profiles, GBP, sentiment analysis | **Claude Sonnet 4** | Excellent at theme extraction and nuanced tone detection |
| **3** | Marketing & Conversion | CTAs, engagement paths, sales process | **GPT-4.1** | Strong at marketing analysis and CTA detection |
| **4** | Competitor Analysis | Top 3 competitors with quick facts | **GPT-4.1** | Excels at comparative analysis and ranking |
| **Final** | Report Consolidation | Executive summary & actionable insights | **Claude Sonnet 4** | Produces exceptional narrative synthesis |

---

## 📥 Input Configuration

```javascript
{
  // Required
  websiteUrl: 'https://example.com',
  
  // Website content (at least one recommended)
  textContent: 'Full text content of the website',
  html: 'Raw HTML of the website',
  
  // Optional: Pre-collected website data
  websiteData: {
    url: 'https://example.com',
    html: '...',
    textContent: '...',
    scripts: [],
  },
  
  // Optional: External presence data (Phase 2)
  externalData: {
    social: [
      { platform: 'linkedin', profile_url: '...', followers: 5000 }
    ],
    reviews: [...],
    posts: [...],
  },
  
  // Optional: SERP data (Phase 4)
  serpData: {
    results: [...],
    keywords: ['keyword1', 'keyword2'],
  },
  
  // Optional: Seed keywords for competitor search
  seedKeywords: ['AI SaaS', 'business automation'],
}
```

---

## 📤 Output Structure

### Consolidated Report

```javascript
{
  report_id: 'mir_1234567890',
  generated_at: '2026-02-03T00:00:00Z',
  
  // Main report (markdown)
  report_markdown: '# Market Intelligence Report\n\n...',
  
  // Structured summary
  summary: {
    business_name: 'Example Corp',
    business_url: 'https://example.com',
    category: 'AI SaaS',
    location: { country: 'US', city: 'San Francisco' },
    metrics: {
      profiles_discovered: 5,
      gbp_rating: 4.5,
      gbp_reviews: 120,
      total_ctas: 8,
      competitors_identified: 3
    }
  },
  
  // Confidence scores
  overall_confidence: 0.78,
  phase_confidences: {
    phase1_website_extraction: 0.85,
    phase2_external_presence: 0.72,
    phase3_marketing_conversion: 0.80,
    phase4_competitor_analysis: 0.75
  },
  
  // Data quality assessment
  data_quality: {
    phases_completed: ['phase1', 'phase2', 'phase3', 'phase4'],
    phases_missing: [],
    low_confidence_areas: ['External presence analysis']
  },
  
  // Full phase outputs for deep dives
  phase_outputs: {
    phase1: {...},
    phase2: {...},
    phase3: {...},
    phase4: {...}
  }
}
```

---

## 📊 Phase Details

### Phase 1: Website Extraction
*LLM: Claude Sonnet 4 | Temperature: 0.1*

Extracts business fundamentals with confidence scores and evidence.

**Output:**
- Business identity (name, location, category)
- Primary offerings (ranked list)
- Proof assets (testimonials, case studies, awards, certifications)
- Offer structure (packages, inclusions, guarantees, timelines)
- Evidence (CSS selectors, snapshots)

### Phase 2: External Presence & Social Perception
*LLM: Claude Sonnet 4 | Temperature: 0.2*

Analyzes external digital footprint and social sentiment.

**Output:**
- Social profiles (Instagram, LinkedIn, Facebook, X, YouTube)
- Google Business Profile snapshot (rating, reviews, categories)
- Play Store listing (if app exists)
- B2B listings (Clutch, G2, Capterra, JustDial, IndiaMart)
- Social perception themes & sentiment distribution
- Owner response behavior (reply rate, tone patterns)

### Phase 3: Marketing, Reachout & Conversion
*LLM: GPT-4.1 | Temperature: 0.2*

Analyzes marketing infrastructure and conversion optimization.

**Output:**
- Marketing channels detected
- Tracking tags (GA4, GTM, Facebook Pixel, LinkedIn Insight, etc.)
- Landing page CTAs (type, text, target, confidence)
- Engagement paths (customer journey mapping)
- Sales process classification (demo-led, product-led, consultative, RFP, hybrid)
- Product journey (entry offers → core product → upsells/cross-sells)

### Phase 4: Competitor Identification & Quick-Facts
*LLM: GPT-4.1 | Temperature: 0.3*

Identifies and profiles top 3 competitors.

**Output:**
- Top 3 competitors with SERP-based rankings
- Positioning statements
- Primary offerings comparison
- GBP snapshots (rating, reviews, categories, services)
- SEO metrics (SERP rank, keywords, estimated traffic)
- Social presence overview
- Why each competitor was selected (evidence-based)

---

## ⚙️ Configuration

### OpenRouter Config (`config/openrouter_config.json`)

```json
{
  "phases": {
    "phase1_website_extraction": {
      "primaryModel": "anthropic/claude-sonnet-4",
      "fallbackModel": "openai/gpt-4.1",
      "temperature": 0.1,
      "maxTokens": 4000,
      "requiresJson": true
    },
    "phase2_external_presence": {
      "primaryModel": "anthropic/claude-sonnet-4",
      "fallbackModel": "openai/gpt-4.1",
      "temperature": 0.2
    },
    "phase3_marketing_conversion": {
      "primaryModel": "openai/gpt-4.1",
      "fallbackModel": "anthropic/claude-sonnet-4",
      "temperature": 0.2
    },
    "phase4_competitor_analysis": {
      "primaryModel": "openai/gpt-4.1",
      "fallbackModel": "anthropic/claude-sonnet-4",
      "temperature": 0.3
    },
    "report_consolidation": {
      "primaryModel": "anthropic/claude-sonnet-4",
      "fallbackModel": "openai/gpt-4.1",
      "temperature": 0.4
    }
  }
}
```

### Feature Flags

```javascript
// Enable/disable specific phases
FEATURE_FLAG.WEBSITE_EXTRACTION_ENABLED = true;    // Phase 1
FEATURE_FLAG.EXTERNAL_PRESENCE_ENABLED = true;     // Phase 2
FEATURE_FLAG.MARKETING_CONVERSION_ENABLED = true;  // Phase 3
FEATURE_FLAG.COMPETITOR_ANALYSIS_ENABLED = true;   // Phase 4
```

---

## 🔧 Individual Phase Usage

Use phases independently for granular control:

```javascript
import { 
  WebsiteExtractionAgent,
  ExternalPresenceAgent,
  MarketingConversionAgent,
  CompetitorAnalysisAgent,
  ReportConsolidator
} from './modules/market_intelligence_entity';

// Use Phase 1 only
const phase1Agent = new WebsiteExtractionAgent(config, logger, apiKey);
const websiteProfile = await phase1Agent.extract(websiteData);

// Use Phase 4 only
const phase4Agent = new CompetitorAnalysisAgent(config, logger, apiKey);
const competitors = await phase4Agent.analyze(businessIdentity, serpData);
```

---

## 💰 Cost Estimation

Approximate costs per full execution (all 4 phases + consolidation):

| Model | Input Cost | Output Cost | Est. per Phase |
|-------|------------|-------------|----------------|
| Claude Sonnet 4 | $0.003/1K | $0.015/1K | ~$0.05-0.10 |
| GPT-4.1 | $0.01/1K | $0.03/1K | ~$0.05-0.10 |

**Total estimated cost per report: $0.30-0.60**

---

## 📁 File Structure

```
market_intelligence_entity/
├── index.js                              # Main exports
├── feature_flag.js                       # Kill switch & sub-features
├── README.md                             # This file
├── ai_agents/
│   ├── phase1_website_extraction_agent.js
│   ├── phase2_external_presence_agent.js
│   ├── phase3_marketing_conversion_agent.js
│   ├── phase4_competitor_analysis_agent.js
│   ├── report_consolidator.js
│   ├── serp_user_intent_agent.js         # Legacy
│   └── competitor_comparison_agent.js    # Legacy
├── config/
│   ├── entity_settings.json
│   ├── openrouter_config.json            # LLM selection config
│   ├── schemas.json                      # JSON validation schemas
│   └── serp_config.json
├── orchestrator/
│   ├── enhanced_orchestrator.js          # New 4-phase orchestrator
│   └── market_orchestrator.js            # Legacy orchestrator
├── scrapers/
│   ├── serp_search_scraper.js
│   └── competitor_site_scraper.js
├── utils/
│   ├── config_loader.js
│   ├── helpers.js
│   ├── logger.js
│   ├── openrouter_client.js              # OpenRouter API client
│   └── output_writer.js
├── outputs/                              # Generated reports
└── logs/                                 # Execution logs
```

---

## ✅ Isolation Guarantees

- ✅ **Zero dependencies** on core application
- ✅ **Can be deleted** without breaking the app
- ✅ All functionality controlled by **feature flag**
- ✅ **Fail-silent** error handling
- ✅ Outputs only to local `outputs/` folder
- ✅ **No shared state** with external systems

---

## 🚀 Legacy Support

The original orchestrator is still available for backward compatibility:

```javascript
import { MarketOrchestrator } from './modules/market_intelligence_entity';

const orchestrator = new MarketOrchestrator();
const results = await orchestrator.execute({
  service: 'AI SaaS',
  location: 'United States',
  year: '2026'
});
```
