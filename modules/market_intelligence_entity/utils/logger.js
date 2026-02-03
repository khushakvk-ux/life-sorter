/**
 * LOGGER UTILITY
 * ===============
 * 
 * Isolated logging for the Market Intelligence Entity.
 * Browser-compatible - logs to console only.
 * 
 * ISOLATION GUARANTEES:
 * - Never imports from core app
 * - Works in browser and Node.js
 */

// ═══════════════════════════════════════════════════════════════════
// LOGGER CLASS (Browser Compatible)
// ═══════════════════════════════════════════════════════════════════

class Logger {
  constructor(options = {}) {
    this.executionId = options.executionId || 'unknown';
    this.config = options.config || {};
    this.level = this._parseLevel(this.config.level || 'info');
    this.buffer = [];
    this.maxBufferSize = 100;
  }

  // ─────────────────────────────────────────────────────────────────
  // LOG LEVELS
  // ─────────────────────────────────────────────────────────────────

  debug(message, data = null) {
    this._log('DEBUG', message, data);
  }

  info(message, data = null) {
    this._log('INFO', message, data);
  }

  warn(message, data = null) {
    this._log('WARN', message, data);
  }

  error(message, data = null) {
    this._log('ERROR', message, data);
  }

  // ─────────────────────────────────────────────────────────────────
  // INTERNAL METHODS
  // ─────────────────────────────────────────────────────────────────

  _log(level, message, data) {
    const levelValue = this._parseLevel(level);
    
    // Check if this level should be logged
    if (levelValue < this.level) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      executionId: this.executionId,
      message,
      data: data || undefined,
    };

    // Console output
    const consoleMessage = `[${timestamp}] [${level}] [${this.executionId}] ${message}`;
    
    switch (level) {
      case 'ERROR':
        console.error(consoleMessage, data || '');
        break;
      case 'WARN':
        console.warn(consoleMessage, data || '');
        break;
      case 'DEBUG':
        console.debug(consoleMessage, data || '');
        break;
      default:
        console.log(consoleMessage, data || '');
    }

    // Store in memory buffer
    this.buffer.push(logEntry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }
  }

  _parseLevel(level) {
    const levels = {
      'debug': 0,
      'info': 1,
      'warn': 2,
      'error': 3,
    };
    return levels[level.toLowerCase()] || 1;
  }

  // ─────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Log a step with duration tracking
   */
  step(stepName, fn) {
    const startTime = Date.now();
    this.info(`Step started: ${stepName}`);
    
    return Promise.resolve(fn())
      .then(result => {
        const duration = Date.now() - startTime;
        this.info(`Step completed: ${stepName} (${duration}ms)`);
        return result;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        this.error(`Step failed: ${stepName} (${duration}ms)`, { error: error.message });
        throw error;
      });
  }

  /**
   * Get all log entries
   */
  getLogs() {
    return [...this.buffer];
  }

  /**
   * Clear log buffer
   */
  clearLogs() {
    this.buffer = [];
    this.info('Log buffer cleared');
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

export { Logger };
export default Logger;
