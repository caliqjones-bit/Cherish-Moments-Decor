/**
 * config.js — Central configuration & feature flags.
 *
 * All secrets and environment-specific values are read from environment
 * variables (set in Vercel → Project → Settings → Environment Variables,
 * and locally in a .env file — see .env.example).
 *
 * Nothing in here is exposed to the browser. This module only runs
 * server-side inside the /api serverless functions.
 */

/** Small helper: read an env var, trimming whitespace, with a default. */
function env(name, fallback = "") {
  const v = process.env[name];
  return v === undefined || v === null ? fallback : String(v).trim();
}

const config = {
  // ---- Business / branding (safe, non-secret) ----
  business: {
    name: env("BUSINESS_NAME", "Cherish Moments Decor"),
    siteUrl: env("SITE_URL", "https://www.cherishmomentsdecor.com"),
    instagramUrl: env("INSTAGRAM_URL", "https://www.instagram.com/cherish_moments_decor/"),
    // Absolute URL to the logo used in the email header (must be publicly reachable).
    // Defaults to the live Vercel deployment so emails render before the custom
    // domain (www.cherishmomentsdecor.com) is pointed at the site. Once the domain
    // is live, set LOGO_URL to https://www.cherishmomentsdecor.com/assets/img/logo/cm-decor-emblem.png
    logoUrl: env("LOGO_URL", "https://cherish-moments-decor-htfk.vercel.app/assets/img/logo/cm-decor-emblem.png"),
    phone: env("BUSINESS_PHONE", "(352) 349-9494"),
    replyToEmail: env("STAFF_EMAIL", "cherishmomentsdecorllc@gmail.com"),
  },

  // ---- Email (Resend) ----
  email: {
    apiKey: env("RESEND_API_KEY"),
    // Must be a verified sender/domain in Resend, e.g. "Cherish Moments Decor <hello@cherishmomentsdecor.com>"
    from: env("EMAIL_FROM", "Cherish Moments Decor <onboarding@resend.dev>"),
    staffTo: env("STAFF_EMAIL", "cherishmomentsdecorllc@gmail.com"),
  },

  // ---- SMS (Twilio) ----
  sms: {
    accountSid: env("TWILIO_ACCOUNT_SID"),
    authToken: env("TWILIO_AUTH_TOKEN"),
    from: env("TWILIO_FROM_NUMBER"),        // e.g. +13475551234
    staffTo: env("STAFF_SMS"),              // optional: staff mobile for SMS alerts
  },

  // ---- Storage (Supabase / Postgres) ----
  storage: {
    url: env("SUPABASE_URL"),
    // SERVICE ROLE key — server-only, never expose to the browser.
    serviceKey: env("SUPABASE_SERVICE_ROLE_KEY"),
    table: env("SUPABASE_TABLE", "consultations"),
  },

  // ---- Delivery behavior ----
  retries: {
    attempts: Number(env("RETRY_ATTEMPTS", "3")),   // total attempts per delivery
    baseDelayMs: Number(env("RETRY_BASE_DELAY_MS", "400")),
  },

  // Optional shared secret to protect the endpoint from spam bots.
  // If set, the frontend must send the same value in the "x-form-token" header.
  formToken: env("FORM_TOKEN"),

  nodeEnv: env("NODE_ENV", "production"),
};

/**
 * Feature flags — derived from whether the relevant credentials exist.
 * This lets the system degrade gracefully: e.g. if Twilio isn't configured
 * yet, SMS is simply skipped (and logged) rather than throwing.
 */
config.features = {
  emailEnabled: Boolean(config.email.apiKey),
  smsEnabled: Boolean(config.sms.accountSid && config.sms.authToken && config.sms.from),
  staffSmsEnabled: Boolean(config.sms.accountSid && config.sms.authToken && config.sms.from && config.sms.staffTo),
  storageEnabled: Boolean(config.storage.url && config.storage.serviceKey),
};

export default config;
