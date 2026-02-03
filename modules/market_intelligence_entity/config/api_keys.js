/**
 * API KEYS CONFIGURATION
 * ======================
 * 
 * This file contains API key configuration for the Market Intelligence Entity.
 * 
 * SECURITY NOTE: In production, use environment variables instead of hardcoding keys.
 * Set: OPENROUTER_API_KEY=your_key in your environment
 */

// OpenRouter API Key
// Used for all LLM operations across the 4-phase pipeline
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

// Serper.dev API Key (for web search in Phase 2)
// Free tier: 2500 queries/month - https://serper.dev
export const SERPER_API_KEY = process.env.SERPER_API_KEY || '05b312d6feb727c5c0e34305258c6ae613be39d6';

// Export configuration
export const apiKeys = {
  openRouter: OPENROUTER_API_KEY,
  serper: SERPER_API_KEY,
};

// Helper function to get the OpenRouter key
export function getOpenRouterKey() {
  const key = process.env.OPENROUTER_API_KEY || OPENROUTER_API_KEY;
  
  if (!key || key === 'your-api-key-here') {
    console.warn('[API Keys] OpenRouter API key not configured');
    return null;
  }
  
  return key;
}

// Helper function to get Serper key
export function getSerperKey() {
  return process.env.SERPER_API_KEY || SERPER_API_KEY || null;
}

export default apiKeys;
