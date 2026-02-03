/**
 * HELPER UTILITIES
 * =================
 * 
 * Generic helper functions for the Market Intelligence Entity.
 * No external dependencies, no core app imports.
 */

// ═══════════════════════════════════════════════════════════════════
// TIMING UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Promise-based delay
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Random delay within a range
 * @param {number} min - Minimum milliseconds
 * @param {number} max - Maximum milliseconds
 * @returns {Promise<void>}
 */
export async function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  return delay(ms);
}

// ═══════════════════════════════════════════════════════════════════
// ID GENERATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate a unique execution ID
 * @returns {string} Execution ID
 */
export function generateExecutionId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `mi_${timestamp}_${random}`;
}

/**
 * Generate a short unique ID
 * @returns {string} Short ID
 */
export function generateShortId() {
  return Math.random().toString(36).substring(2, 10);
}

// ═══════════════════════════════════════════════════════════════════
// STRING UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Truncate string to max length with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength = 100) {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Clean HTML string (remove tags, decode entities)
 * @param {string} html - HTML string
 * @returns {string} Clean text
 */
export function cleanHtml(html) {
  if (!html) return '';
  
  return html
    .replace(/<[^>]*>/g, '') // Remove tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract domain from URL
 * @param {string} url - Full URL
 * @returns {string|null} Domain or null
 */
export function extractDomain(url) {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// ARRAY UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array[]} Array of chunks
 */
export function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Get unique values from array
 * @param {Array} array - Input array
 * @param {Function} keyFn - Optional key function
 * @returns {Array} Unique values
 */
export function unique(array, keyFn = x => x) {
  const seen = new Set();
  return array.filter(item => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Group array by key
 * @param {Array} array - Input array
 * @param {Function} keyFn - Key function
 * @returns {Object} Grouped object
 */
export function groupBy(array, keyFn) {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

// ═══════════════════════════════════════════════════════════════════
// OBJECT UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return obj;
  }
}

/**
 * Safely get nested property
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot-notation path
 * @param {*} defaultValue - Default if not found
 * @returns {*} Value or default
 */
export function get(obj, path, defaultValue = undefined) {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current !== undefined ? current : defaultValue;
}

// ═══════════════════════════════════════════════════════════════════
// RETRY UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise<*>} Result or throws
 */
export async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry = null,
  } = options;

  let lastError;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        if (onRetry) {
          onRetry(error, attempt);
        }
        await delay(currentDelay);
        currentDelay *= backoffMultiplier;
      }
    }
  }

  throw lastError;
}

// ═══════════════════════════════════════════════════════════════════
// VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Check if value is a valid URL
 * @param {string} str - String to check
 * @returns {boolean} Is valid URL
 */
export function isValidUrl(str) {
  if (!str || typeof str !== 'string') return false;
  
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if value is a non-empty string
 * @param {*} value - Value to check
 * @returns {boolean} Is non-empty string
 */
export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// ═══════════════════════════════════════════════════════════════════
// DATE UTILITIES
// ═══════════════════════════════════════════════════════════════════

/**
 * Get ISO timestamp
 * @returns {string} ISO timestamp
 */
export function timestamp() {
  return new Date().toISOString();
}

/**
 * Format duration in human readable form
 * @param {number} ms - Milliseconds
 * @returns {string} Human readable duration
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export default {
  delay,
  randomDelay,
  generateExecutionId,
  generateShortId,
  truncate,
  cleanHtml,
  extractDomain,
  chunk,
  unique,
  groupBy,
  deepClone,
  get,
  retry,
  isValidUrl,
  isNonEmptyString,
  timestamp,
  formatDuration,
};
