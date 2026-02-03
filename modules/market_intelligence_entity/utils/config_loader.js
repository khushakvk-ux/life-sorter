/**
 * CONFIG LOADER UTILITY
 * ======================
 * 
 * Loads configuration for the Market Intelligence Entity.
 * Browser-compatible - uses embedded defaults instead of file reads.
 * 
 * ISOLATION GUARANTEES:
 * - Only returns local configuration
 * - Never accesses core app configuration
 * - Returns sensible defaults
 */

// ═══════════════════════════════════════════════════════════════════
// CONFIG LOADER CLASS (Browser Compatible)
// ═══════════════════════════════════════════════════════════════════

class ConfigLoader {
  /**
   * Load all configuration
   * @returns {Object} Combined configuration
   */
  static async load() {
    return ConfigLoader._getDefaultConfig();
  }

  /**
   * Get default configuration
   */
  static _getDefaultConfig() {
    return {
      entity: {
        name: 'Market Intelligence Entity',
        version: '1.0.0',
      },
      execution: {
        mode: 'sequential',
        parallelExecutionAllowed: false,
        resumableSteps: true,
      },
      humanPacing: {
        enabled: true,
        minDelayMs: 2000,
        maxDelayMs: 7000,
      },
      competitorSelection: {
        maxCompetitors: 3,
        selectionCriteria: {
          serpFrequencyWeight: 0.35,
          localRelevanceWeight: 0.25,
          perceivedAuthorityWeight: 0.25,
          offerClarityWeight: 0.15,
        },
        minimumConfidenceScore: 0.6,
      },
      enrichment: {
        visitWebsite: true,
        capturePositioning: true,
        captureCoreOffer: true,
        captureTrustSignals: true,
        captureCtaStyle: true,
        timeoutPerPageMs: 15000,
      },
      aiAgents: {
        userIntentAgent: { enabled: true },
        comparisonAgent: { enabled: true },
      },
      logging: {
        enabled: true,
        level: 'info',
      },
      errorHandling: {
        failSilently: true,
        maxRetries: 3,
      },
      outputs: {
        prettyPrint: true,
      },
      api: {
        provider: 'serpapi',
        timeout: 30000,
      },
      search: {
        engine: 'google',
        defaultLocation: 'United States',
        resultsPerQuery: 10,
        queryTemplates: {
          nearMe: '{service} near me',
          versus: '{service} vs',
          best: 'best {service} in {location}',
          alternatives: '{service} alternatives',
        },
      },
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 10,
        minDelayBetweenRequestsMs: 3000,
        humanPacingEnabled: true,
      },
    };
  }

  /**
   * Get a specific config value with dot notation
   * @param {Object} config - Config object
   * @param {string} path - Dot-notation path
   * @param {*} defaultValue - Default if not found
   */
  static get(config, path, defaultValue = null) {
    try {
      const keys = path.split('.');
      let value = config;
      for (const key of keys) {
        value = value?.[key];
      }
      return value !== undefined ? value : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Reload configuration
   */
  static async reload() {
    return await ConfigLoader.load();
  }

  /**
   * Validate configuration
   */
  static validate(config) {
    const errors = [];

    if (!config.competitorSelection?.maxCompetitors) {
      errors.push('Missing competitorSelection.maxCompetitors');
    }

    if (!config.humanPacing?.minDelayMs) {
      errors.push('Missing humanPacing.minDelayMs');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { ConfigLoader };
export default ConfigLoader;
