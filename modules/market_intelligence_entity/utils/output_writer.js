/**
 * OUTPUT WRITER UTILITY
 * ======================
 * 
 * Browser-compatible output storage for market intelligence results.
 * Uses in-memory storage with localStorage persistence.
 * 
 * ISOLATION GUARANTEES:
 * - Only stores data in local namespace
 * - Never accesses external storage
 * - Always writes valid JSON
 */

// Storage key prefix for isolation
const STORAGE_PREFIX = 'market_intel_output_';

// ═══════════════════════════════════════════════════════════════════
// OUTPUT WRITER CLASS
// ═══════════════════════════════════════════════════════════════════

class OutputWriter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.prettyPrint = config?.outputs?.prettyPrint !== false;
    
    // In-memory cache
    this.cache = new Map();
    
    // Load from localStorage if available
    this._loadFromStorage();
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN WRITE METHOD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Write data to an output
   * @param {string} filename - Name of the output
   * @param {Object} data - Data to write (will be JSON serialized)
   * @returns {boolean} Success status
   */
  async write(filename, data) {
    try {
      // Add metadata
      const output = {
        _metadata: {
          generatedAt: new Date().toISOString(),
          filename,
          entityVersion: this.config?.entity?.version || '1.0.0',
        },
        ...data,
      };

      // Store in cache
      this.cache.set(filename, output);
      
      // Persist to localStorage
      this._saveToStorage(filename, output);
      
      const content = JSON.stringify(output);
      this.logger?.info(`[OutputWriter] Wrote: ${filename} (${content.length} bytes)`);
      
      return true;

    } catch (error) {
      this.logger?.error(`[OutputWriter] Failed to write ${filename}: ${error.message}`);
      return false;
    }
  }

  /**
   * Write multiple files at once
   * @param {Object} files - Object with filename keys and data values
   * @returns {Object} Results for each file
   */
  async writeAll(files) {
    const results = {};
    
    for (const [filename, data] of Object.entries(files)) {
      results[filename] = await this.write(filename, data);
    }
    
    return results;
  }

  // ─────────────────────────────────────────────────────────────────
  // READ METHODS (for resumable execution)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Read an existing output
   * @param {string} filename - Name of the output
   * @returns {Object|null} Parsed data or null if not found
   */
  async read(filename) {
    try {
      // Check cache first
      if (this.cache.has(filename)) {
        return this.cache.get(filename);
      }
      
      // Try localStorage
      return this._loadFromStorageSingle(filename);

    } catch (error) {
      this.logger?.warn(`[OutputWriter] Could not read ${filename}: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if an output exists
   * @param {string} filename - Name of the output
   * @returns {boolean} Whether output exists
   */
  exists(filename) {
    if (this.cache.has(filename)) {
      return true;
    }
    
    try {
      const key = STORAGE_PREFIX + filename;
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────

  /**
   * List all outputs
   * @returns {string[]} Array of filenames
   */
  list() {
    const filenames = new Set(this.cache.keys());
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          filenames.add(key.replace(STORAGE_PREFIX, ''));
        }
      }
    } catch {
      // localStorage not available
    }
    
    return Array.from(filenames).filter(f => f.endsWith('.json'));
  }

  /**
   * Clear all outputs
   */
  clear() {
    try {
      const files = this.list();
      
      for (const file of files) {
        this.cache.delete(file);
        localStorage.removeItem(STORAGE_PREFIX + file);
      }
      
      this.logger?.info(`[OutputWriter] Cleared ${files.length} outputs`);

    } catch (error) {
      this.logger?.warn(`[OutputWriter] Could not clear outputs: ${error.message}`);
    }
  }

  /**
   * Get all outputs as downloadable JSON
   * @returns {Object} All outputs
   */
  exportAll() {
    const all = {};
    for (const [key, value] of this.cache.entries()) {
      all[key] = value;
    }
    return all;
  }

  // ─────────────────────────────────────────────────────────────────
  // INTERNAL METHODS
  // ─────────────────────────────────────────────────────────────────

  _loadFromStorage() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const data = localStorage.getItem(key);
          if (data) {
            const filename = key.replace(STORAGE_PREFIX, '');
            this.cache.set(filename, JSON.parse(data));
          }
        }
      }
    } catch {
      // localStorage not available, use in-memory only
    }
  }

  _loadFromStorageSingle(filename) {
    try {
      const key = STORAGE_PREFIX + filename;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        this.cache.set(filename, parsed);
        return parsed;
      }
    } catch {
      // localStorage not available
    }
    return null;
  }

  _saveToStorage(filename, data) {
    try {
      const key = STORAGE_PREFIX + filename;
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // localStorage not available or quota exceeded
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { OutputWriter };
export default OutputWriter;
