/**
 * Retry Engine — Exponential backoff + non-retryable error handling
 */

const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  backoffBase: 2,
  retryableErrors: null, // null = retry all by default
  nonRetryableErrors: ['invalid_input', 'auth_failed', 'not_found']
};

class RetryEngine {
  constructor() {
    this.attempts = new Map(); // plugin_id -> attempt count
  }

  shouldRetry(pluginId, error, config = {}) {
    const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
    const attempt = this.attempts.get(pluginId) || 0;

    if (attempt >= cfg.maxAttempts) return false;

    // Check non-retryable first
    if (cfg.nonRetryableErrors?.some(e => error.includes(e))) return false;

    // If retryableErrors specified, error must match
    if (cfg.retryableErrors) {
      return cfg.retryableErrors.some(e => error.includes(e));
    }

    return true; // Default: retry all except non-retryable
  }

  async executeWithRetry(pluginId, fn, config = {}) {
    const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
    this.attempts.set(pluginId, 0);

    while (true) {
      const attempt = this.attempts.get(pluginId);
      try {
        const result = await fn();
        this.attempts.delete(pluginId);
        return { success: true, result, attempt: attempt + 1 };
      } catch (err) {
        const errorMsg = err.message || String(err);
        this.attempts.set(pluginId, attempt + 1);

        if (!this.shouldRetry(pluginId, errorMsg, cfg)) {
          return {
            success: false,
            error: errorMsg,
            attempt: attempt + 1,
            reason: attempt >= cfg.maxAttempts ? 'max_attempts' : 'non_retryable'
          };
        }

        const backoffMs = Math.pow(cfg.backoffBase, attempt + 1) * 1000;
        console.log(`⏳ Retry ${pluginId} in ${backoffMs / 1000}s (attempt ${attempt + 2}/${cfg.maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  getAttemptCount(pluginId) {
    return this.attempts.get(pluginId) || 0;
  }

  reset(pluginId) {
    this.attempts.delete(pluginId);
  }
}

module.exports = { RetryEngine, DEFAULT_RETRY_CONFIG };
