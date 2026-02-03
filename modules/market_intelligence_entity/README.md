# 🔍 Market Intelligence Entity

> A fully isolated, safety-first module for SERP-driven market discovery and competitive intelligence.

## ⚡ Quick Start

```javascript
// 1. Enable the feature flag
// Edit: feature_flag.js → Set ENABLED: true

// 2. Add your SERP API key
// Set environment variable: SERP_API_KEY=your_key

// 3. Run the orchestrator
import { MarketOrchestrator } from './orchestrator/market_orchestrator.js';

const orchestrator = new MarketOrchestrator();
const results = await orchestrator.execute({
  service: 'AI SaaS',
  location: 'United States',
  year: '2026'
});
```

---

## 🎯 Purpose

This entity simulates **how a real user discovers alternatives while searching online**.

It is NOT:
- A simple competitor scraper
- An SEO analysis tool
- A marketing advisor

It IS:
- A market researcher simulation
- A user-perspective discovery engine
- A competitive positioning analyzer

---

## 🏗️ Architecture

```
/modules/market_intelligence_entity/
│
├── feature_flag.js            # Single kill switch for entire entity
│
├── config/
│   ├── serp_config.json       # SERP API and search settings
│   └── entity_settings.json   # Master configuration
│
├── orchestrator/
│   └── market_orchestrator.js # Central controller
│
├── scrapers/
│   ├── serp_search_scraper.js     # SERP discovery
│   └── competitor_site_scraper.js # Website enrichment
│
├── ai_agents/
│   ├── serp_user_intent_agent.js      # User perspective analysis
│   └── competitor_comparison_agent.js # Side-by-side comparison
│
├── utils/
│   ├── logger.js              # Isolated logging
│   ├── config_loader.js       # Config management
│   ├── output_writer.js       # JSON output
│   └── helpers.js             # Generic utilities
│
├── outputs/                   # Generated JSON files
│   ├── serp_discovery.json
│   ├── competitors_enriched.json
│   └── competitive_verdict.json
│
└── logs/
    └── entity.log             # Execution logs
```

---

## 🔒 Isolation Guarantees

| Rule | Implementation |
|------|----------------|
| **No shared state** | Module has zero imports from core app |
| **No direct DB writes** | Only writes JSON to `outputs/` folder |
| **File-based communication** | Reads config from `config/`, writes to `outputs/` |
| **Deletable without side effects** | Remove folder = entity gone, app works |
| **Feature flag controlled** | Single boolean enables/disables everything |
| **Fail-safe** | Errors are caught, logged, and silenced |

---

## 🚀 Execution Flow

### Phase 1: SERP Discovery
```
Input → Generate Queries → Execute Searches → Parse Results → Aggregate Domains
```

**Extracts:**
- Organic results (top 10)
- Ads (marked separately)
- Local pack
- People-also-ask questions
- Related searches
- Domain frequency

### Phase 2: Competitor Selection
```
Aggregated Domains → Score & Rank → Select Top 3
```

**Criteria:**
- SERP frequency (35%)
- Local relevance (25%)
- Perceived authority (25%)
- Offer clarity (15%)

### Phase 3: Competitor Enrichment
```
Selected Competitors → Visit Websites → Extract Intelligence
```

**Captures:**
- Positioning (headline, UVP)
- Core offer (pricing, target audience)
- Trust signals (testimonials, certifications)
- CTA analysis

### Phase 4: AI Analysis
```
SERP Data + Enriched Data → AI Agents → Verdicts
```

**User Intent Agent:**
- Intent clusters
- Clickability factors
- Trust perception
- Attractive language patterns

**Comparison Agent:**
- "Why choose them?"
- Ease & safety analysis
- Clarity comparison
- Disadvantage mapping

---

## ⚙️ Configuration

### Feature Flag (`feature_flag.js`)
```javascript
const FEATURE_FLAG = {
  ENABLED: false,                    // Master switch
  SERP_DISCOVERY_ENABLED: true,      // Sub-feature
  COMPETITOR_ENRICHMENT_ENABLED: true,
  AI_ANALYSIS_ENABLED: true,
  FAIL_SILENTLY: true,               // Safety
};
```

### Environment Variables
```bash
SERP_API_KEY=your_serpapi_key        # Required for live searches
MARKET_INTEL_ENABLED=true            # Override feature flag
```

### SERP Config (`config/serp_config.json`)
```json
{
  "api": {
    "provider": "serpapi",
    "timeout": 30000
  },
  "search": {
    "engine": "google",
    "resultsPerQuery": 10
  },
  "rateLimiting": {
    "requestsPerMinute": 10,
    "humanPacingEnabled": true
  }
}
```

---

## 📤 Output Files

### `serp_discovery.json`
```json
{
  "executionId": "mi_abc123",
  "queries": ["AI SaaS near me", "AI SaaS vs", ...],
  "aggregatedDomains": [
    { "domain": "competitor1.com", "occurrences": 5 },
    { "domain": "competitor2.com", "occurrences": 3 }
  ],
  "confidenceScore": 0.85
}
```

### `competitors_enriched.json`
```json
{
  "competitors": [
    {
      "domain": "competitor1.com",
      "positioning": { "headline": "...", "uvp": "..." },
      "trustSignals": { "trustScore": 0.75 },
      "ctaAnalysis": { "primaryCta": ["Get Started Free"] }
    }
  ]
}
```

### `competitive_verdict.json`
```json
{
  "userIntent": { "primaryIntent": "Solution-Seeking" },
  "competitorComparison": {
    "whyChooseThem": [...],
    "disadvantages": [...],
    "missingSignals": [...]
  },
  "verdict": {
    "competitiveDisadvantages": [...],
    "differentiationGaps": [...],
    "actionableInsights": [...]
  }
}
```

---

## 🛡️ Safety Features

### Human Pacing
```javascript
// Random delays between requests (2-7 seconds)
humanPacing: {
  enabled: true,
  minDelayMs: 2000,
  maxDelayMs: 7000
}
```

### Rate Limiting
```javascript
// Max 10 requests per minute
rateLimiting: {
  requestsPerMinute: 10,
  minDelayBetweenRequestsMs: 3000
}
```

### Fail Silently
```javascript
// Errors logged but never thrown to caller
if (FEATURE_FLAG.FAIL_SILENTLY) {
  console.error('[MarketIntel] Silent failure:', error.message);
  return fallbackValue;
}
```

### Resumable Execution
```javascript
// Checkpoints saved after each phase
this._saveCheckpoint('serp_discovery', serpResults);
```

---

## 🔧 Usage Examples

### Basic Execution
```javascript
import { MarketOrchestrator } from './orchestrator/market_orchestrator.js';

const orchestrator = new MarketOrchestrator();
const results = await orchestrator.execute({
  service: 'Legal Documentation Software',
  location: 'California',
  year: '2026'
});

if (results) {
  console.log('Competitors found:', results.competitorsEnriched?.competitors.length);
}
```

### Check If Enabled
```javascript
import { isEnabled, getStatus } from './feature_flag.js';

if (isEnabled()) {
  console.log('Entity is active');
  console.log(getStatus());
}
```

### Safe Execution Wrapper
```javascript
import { executeIfEnabled } from './feature_flag.js';

const result = await executeIfEnabled(async () => {
  // Your code here
  return data;
}, null); // Returns null if disabled
```

---

## 🗑️ Rollback

### Option 1: Disable via Flag
```javascript
// feature_flag.js
ENABLED: false
```

### Option 2: Environment Variable
```bash
MARKET_INTEL_ENABLED=false
```

### Option 3: Delete Folder
```bash
rm -rf modules/market_intelligence_entity/
# App continues working - zero side effects
```

---

## 🧪 Testing

### Test Feature Flag
```javascript
import { isEnabled } from './feature_flag.js';
console.log('Enabled:', isEnabled());
```

### Test with Mock Data
The scrapers automatically use mock data when:
- No API key is configured
- API calls fail

### Test Output Writing
```javascript
import { OutputWriter } from './utils/output_writer.js';
const writer = new OutputWriter({}, console);
await writer.write('test.json', { test: true });
```

---

## 📊 Performance

| Operation | Typical Duration |
|-----------|------------------|
| Single SERP search | 3-8 seconds (with pacing) |
| Full discovery (5 queries) | 20-45 seconds |
| Competitor enrichment (3 sites) | 15-30 seconds |
| AI analysis | 2-5 seconds |
| **Total execution** | **1-2 minutes** |

---

## ⚠️ Important Notes

1. **API Key Required**: Without `SERP_API_KEY`, the module uses mock data
2. **Rate Limits**: Default is 10 requests/minute to avoid API blocks
3. **No Parallel Execution**: Sequential by design for safety
4. **Confidence Scores**: All outputs include confidence indicators
5. **Logs Stay Local**: All logging in `logs/entity.log` only

---

## 🔮 Future Enhancements

- [ ] OpenAI integration for deeper AI analysis
- [ ] Google Business Profile scraping
- [ ] Automated scheduling
- [ ] Multiple search engine support
- [ ] Historical trend tracking

---

## 📝 License

Internal module - part of the life-sorter project.

---

## 🤝 Contributing

This module is designed for isolation. When modifying:

1. **Never** import from core app (`src/`, `api/`, etc.)
2. **Always** use feature flag checks
3. **Always** handle errors silently
4. **Always** write outputs to `outputs/` folder only
5. **Always** log to `logs/` folder only
