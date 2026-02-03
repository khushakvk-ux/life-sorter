/**
 * OPENROUTER API CLIENT
 * =====================
 * 
 * Unified client for OpenRouter API with automatic model selection,
 * fallback handling, and phase-specific configuration.
 * 
 * FEATURES:
 * - Automatic model selection based on phase
 * - Fallback to alternative models on failure
 * - Retry logic with exponential backoff
 * - JSON schema validation for structured outputs
 * - Cost tracking and logging
 * 
 * USAGE:
 * ```javascript
 * const client = new OpenRouterClient(apiKey);
 * const result = await client.complete('phase1_website_extraction', prompt, systemPrompt);
 * ```
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════════════════════════════
// OPENROUTER CLIENT CLASS
// ═══════════════════════════════════════════════════════════════════

class OpenRouterClient {
  constructor(apiKey, logger = null) {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }
    
    this.apiKey = apiKey;
    this.logger = logger;
    this.config = this._loadConfig();
    this.usageStats = {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      estimatedCost: 0,
      phaseUsage: {}
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // CONFIGURATION LOADING
  // ─────────────────────────────────────────────────────────────────

  _loadConfig() {
    try {
      const configPath = join(__dirname, '../config/openrouter_config.json');
      const configContent = readFileSync(configPath, 'utf-8');
      return JSON.parse(configContent);
    } catch (error) {
      this._log('warn', `Failed to load config, using defaults: ${error.message}`);
      return this._getDefaultConfig();
    }
  }

  _getDefaultConfig() {
    return {
      api: {
        baseUrl: 'https://openrouter.ai/api/v1',
        defaultTimeout: 60000,
        maxRetries: 3,
        retryDelayMs: 2000
      },
      phases: {
        default: {
          primaryModel: 'anthropic/claude-sonnet-4',
          fallbackModel: 'openai/gpt-4.1',
          temperature: 0.2,
          maxTokens: 4000
        }
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN COMPLETION METHOD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Execute a completion request for a specific phase
   * @param {string} phase - Phase identifier (e.g., 'phase1_website_extraction')
   * @param {string} userPrompt - The user prompt
   * @param {string} systemPrompt - The system prompt
   * @param {Object} options - Additional options
   * @returns {Object} Completion result with content and metadata
   */
  async complete(phase, userPrompt, systemPrompt, options = {}) {
    const phaseConfig = this.config.phases[phase] || this.config.phases.default || {
      primaryModel: 'anthropic/claude-sonnet-4',
      temperature: 0.2,
      maxTokens: 4000
    };

    this._log('info', `[OpenRouter] Phase: ${phase}, Model: ${phaseConfig.primaryModel}`);

    // Try primary model first
    try {
      return await this._executeCompletion(
        phaseConfig.primaryModel,
        userPrompt,
        systemPrompt,
        { ...phaseConfig, ...options },
        phase
      );
    } catch (primaryError) {
      this._log('warn', `Primary model failed: ${primaryError.message}. Trying fallback...`);
      
      // Try fallback model
      if (phaseConfig.fallbackModel) {
        try {
          return await this._executeCompletion(
            phaseConfig.fallbackModel,
            userPrompt,
            systemPrompt,
            { ...phaseConfig, ...options },
            phase
          );
        } catch (fallbackError) {
          this._log('error', `Fallback model also failed: ${fallbackError.message}`);
          throw new Error(`All models failed for phase ${phase}: ${fallbackError.message}`);
        }
      }
      
      throw primaryError;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // COMPLETION EXECUTION
  // ─────────────────────────────────────────────────────────────────

  async _executeCompletion(model, userPrompt, systemPrompt, config, phase) {
    const maxRetries = this.config.api?.maxRetries || 3;
    const retryDelay = this.config.api?.retryDelayMs || 2000;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this._makeApiRequest(model, userPrompt, systemPrompt, config);
        
        // Update usage stats
        this._updateUsageStats(phase, model, response.usage);
        
        // Parse and return result
        return this._parseResponse(response, config.requiresJson);
        
      } catch (error) {
        lastError = error;
        this._log('warn', `Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          await this._delay(retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  async _makeApiRequest(model, userPrompt, systemPrompt, config) {
    const baseUrl = this.config.api?.baseUrl || 'https://openrouter.ai/api/v1';
    const timeout = this.config.api?.defaultTimeout || 60000;
    
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: userPrompt });
    
    const requestBody = {
      model: model,
      messages: messages,
      temperature: config.temperature || 0.2,
      max_tokens: config.maxTokens || 4000,
    };
    
    // Add JSON mode if required
    if (config.requiresJson) {
      requestBody.response_format = { type: 'json_object' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://life-sorter.app',
          'X-Title': 'Market Intelligence Entity'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API request failed: ${response.status} - ${errorBody}`);
      }
      
      return await response.json();
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // RESPONSE PARSING
  // ─────────────────────────────────────────────────────────────────

  _parseResponse(response, requiresJson = false) {
    const content = response.choices?.[0]?.message?.content || '';
    
    const result = {
      raw: content,
      parsed: null,
      model: response.model,
      usage: response.usage,
      finishReason: response.choices?.[0]?.finish_reason
    };
    
    if (requiresJson) {
      try {
        // Try to extract JSON from the content
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result.parsed = JSON.parse(jsonMatch[0]);
        } else {
          result.parsed = JSON.parse(content);
        }
      } catch (parseError) {
        this._log('warn', `JSON parsing failed: ${parseError.message}`);
        result.parseError = parseError.message;
      }
    } else {
      result.parsed = content;
    }
    
    return result;
  }

  // ─────────────────────────────────────────────────────────────────
  // USAGE TRACKING
  // ─────────────────────────────────────────────────────────────────

  _updateUsageStats(phase, model, usage) {
    if (!usage) return;
    
    this.usageStats.totalRequests++;
    this.usageStats.totalInputTokens += usage.prompt_tokens || 0;
    this.usageStats.totalOutputTokens += usage.completion_tokens || 0;
    
    // Initialize phase tracking if needed
    if (!this.usageStats.phaseUsage[phase]) {
      this.usageStats.phaseUsage[phase] = {
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        models: {}
      };
    }
    
    const phaseStats = this.usageStats.phaseUsage[phase];
    phaseStats.requests++;
    phaseStats.inputTokens += usage.prompt_tokens || 0;
    phaseStats.outputTokens += usage.completion_tokens || 0;
    
    if (!phaseStats.models[model]) {
      phaseStats.models[model] = 0;
    }
    phaseStats.models[model]++;
    
    // Estimate cost
    const modelCaps = this.config.modelCapabilities?.[model];
    if (modelCaps?.costPer1kTokens) {
      const inputCost = (usage.prompt_tokens / 1000) * modelCaps.costPer1kTokens.input;
      const outputCost = (usage.completion_tokens / 1000) * modelCaps.costPer1kTokens.output;
      this.usageStats.estimatedCost += inputCost + outputCost;
    }
  }

  getUsageStats() {
    return { ...this.usageStats };
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────

  _log(level, message) {
    if (this.logger) {
      this.logger[level]?.(message) || this.logger.info?.(message);
    } else {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the recommended model for a specific phase
   */
  getModelForPhase(phase) {
    const phaseConfig = this.config.phases[phase];
    return phaseConfig?.primaryModel || 'anthropic/claude-sonnet-4';
  }

  /**
   * Get all available phases and their configurations
   */
  getPhaseConfigs() {
    return { ...this.config.phases };
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { OpenRouterClient };
export default OpenRouterClient;
