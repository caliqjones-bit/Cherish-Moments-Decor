/**
 * logger.js — Minimal structured logger.
 *
 * Serverless platforms (Vercel) capture stdout/stderr, so structured JSON
 * lines are searchable in the platform's log viewer. Swap the `write`
 * function later to forward to Sentry/Logtail/Datadog without touching callers.
 */

function line(level, message, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...(meta && typeof meta === "object" ? { meta: safe(meta) } : {}),
  };
  const out = JSON.stringify(entry);
  if (level === "error") console.error(out);
  else if (level === "warn") console.warn(out);
  else console.log(out);
}

/** Redact obviously sensitive keys before logging. */
function safe(meta) {
  const clone = {};
  for (const k of Object.keys(meta)) {
    if (/token|key|secret|password|auth/i.test(k)) clone[k] = "[redacted]";
    else clone[k] = meta[k];
  }
  return clone;
}

const logger = {
  info: (message, meta) => line("info", message, meta),
  warn: (message, meta) => line("warn", message, meta),
  error: (message, meta) => line("error", message, meta),
};

export default logger;
