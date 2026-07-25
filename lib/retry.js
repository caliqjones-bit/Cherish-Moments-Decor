/**
 * retry.js — Retry an async operation with exponential backoff.
 *
 * Used to make third-party deliveries (email/SMS) resilient to transient
 * failures (network blips, provider rate limits) without giving up.
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {Function} fn      async function to attempt; should throw on failure
 * @param {Object}   opts
 * @param {number}   opts.attempts     total attempts (default 3)
 * @param {number}   opts.baseDelayMs  base backoff delay (default 400)
 * @param {Function} opts.onRetry      optional (attempt, error) => void
 * @returns {Promise<*>} resolves with fn()'s result, or throws the last error
 */
export async function withRetry(fn, opts = {}) {
  const attempts = Math.max(1, opts.attempts || 3);
  const baseDelayMs = opts.baseDelayMs || 400;
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        if (typeof opts.onRetry === "function") opts.onRetry(attempt, err);
        // Exponential backoff with a little jitter to avoid thundering herds.
        const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 120);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

export default withRetry;
