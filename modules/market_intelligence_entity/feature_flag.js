/**
 * MARKET INTELLIGENCE ENTITY - FEATURE FLAG
 * ==========================================
 * 
 * This is the SINGLE KILL SWITCH for the entire entity.
 * 
 * When disabled:
 * - All functions become no-ops
 * - No errors are thrown
 * - No side effects occur
 * - System continues as if this module doesn't exist
 * 
 * SAFETY RULES:
 * - This file must NEVER import from core app
 * - This file must NEVER throw exceptions
 * - This file must ALWAYS return safe defaults
 */

// ═══════════════════════════════════════════════════════════════════
// FEATURE FLAG CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const FEATURE_FLAG = {
  // Master kill switch - set to false to completely disable
  ENABLED: true,
  
  // Legacy sub-feature flags (for backward compatibility)
  SERP_DISCOVERY_ENABLED: true,
  COMPETITOR_ENRICHMENT_ENABLED: true,
  AI_ANALYSIS_ENABLED: true,
  
  // Phase-specific flags (new 4-phase pipeline)
  WEBSITE_EXTRACTION_ENABLED: true,      // Phase 1
  EXTERNAL_PRESENCE_ENABLED: true,       // Phase 2
  MARKETING_CONVERSION_ENABLED: true,    // Phase 3
  COMPETITOR_ANALYSIS_ENABLED: true,     // Phase 4
  
  // Safety settings
  FAIL_SILENTLY: true,
  LOG_WHEN_DISABLED: false,
  
  // Environment override (allows env var to control flag)
  ENV_OVERRIDE_KEY: 'MARKET_INTEL_ENABLED',
};

// ═══════════════════════════════════════════════════════════════════
// FLAG CHECKER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if the entity is enabled
 * Supports environment variable override
 */
function isEnabled() {
  try {
    // Check environment variable first (if available)
    if (typeof process !== 'undefined' && process.env) {
      const envValue = process.env[FEATURE_FLAG.ENV_OVERRIDE_KEY];
      if (envValue !== undefined) {
        return envValue === 'true' || envValue === '1';
      }
    }
    return FEATURE_FLAG.ENABLED;
  } catch {
    // If anything fails, return configured default
    return FEATURE_FLAG.ENABLED;
  }
}

/**
 * Check if a specific sub-feature is enabled
 */
function isSubFeatureEnabled(featureName) {
  if (!isEnabled()) return false;
  
  try {
    const flagKey = `${featureName.toUpperCase()}_ENABLED`;
    return FEATURE_FLAG[flagKey] === true;
  } catch {
    return false;
  }
}

/**
 * Wrapper to safely execute a function only if enabled
 * Returns null if disabled, never throws
 */
async function executeIfEnabled(fn, fallbackValue = null) {
  if (!isEnabled()) {
    if (FEATURE_FLAG.LOG_WHEN_DISABLED) {
      console.log('[MarketIntel] Entity disabled, skipping execution');
    }
    return fallbackValue;
  }
  
  try {
    return await fn();
  } catch (error) {
    if (FEATURE_FLAG.FAIL_SILENTLY) {
      console.error('[MarketIntel] Silent failure:', error.message);
      return fallbackValue;
    }
    throw error;
  }
}

/**
 * Synchronous version of executeIfEnabled
 */
function executeIfEnabledSync(fn, fallbackValue = null) {
  if (!isEnabled()) {
    return fallbackValue;
  }
  
  try {
    return fn();
  } catch (error) {
    if (FEATURE_FLAG.FAIL_SILENTLY) {
      console.error('[MarketIntel] Silent failure:', error.message);
      return fallbackValue;
    }
    throw error;
  }
}

/**
 * Get current flag status (for debugging/logging)
 */
function getStatus() {
  return {
    enabled: isEnabled(),
    // Legacy
    serpDiscovery: isSubFeatureEnabled('SERP_DISCOVERY'),
    competitorEnrichment: isSubFeatureEnabled('COMPETITOR_ENRICHMENT'),
    aiAnalysis: isSubFeatureEnabled('AI_ANALYSIS'),
    // New phases
    phase1_websiteExtraction: isSubFeatureEnabled('WEBSITE_EXTRACTION'),
    phase2_externalPresence: isSubFeatureEnabled('EXTERNAL_PRESENCE'),
    phase3_marketingConversion: isSubFeatureEnabled('MARKETING_CONVERSION'),
    phase4_competitorAnalysis: isSubFeatureEnabled('COMPETITOR_ANALYSIS'),
    // Meta
    failSilently: FEATURE_FLAG.FAIL_SILENTLY,
    timestamp: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export {
  FEATURE_FLAG,
  isEnabled,
  isSubFeatureEnabled,
  executeIfEnabled,
  executeIfEnabledSync,
  getStatus,
};

export default {
  FEATURE_FLAG,
  isEnabled,
  isSubFeatureEnabled,
  executeIfEnabled,
  executeIfEnabledSync,
  getStatus,
};
