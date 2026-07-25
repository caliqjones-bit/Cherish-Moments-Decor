/**
 * validate.js — Validate & normalize an incoming consultation submission.
 *
 * Turns the raw request body into a clean, canonical record the rest of the
 * system uses. Also enforces required fields and runs a honeypot spam check.
 *
 * The frontend sends these field names (see book-consultation form):
 *   first_name, last_name, email, phone, project_type, city,
 *   preferred_installation_date, tree_height, tree_count, areas,
 *   budget, format, notes, company_website (honeypot), idempotency_key
 */

import crypto from "crypto";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Trim and collapse whitespace; cap length to protect storage/templates. */
function clean(value, max = 500) {
  if (value === undefined || value === null) return "";
  return String(value).replace(/\s+/g, " ").trim().slice(0, max);
}

/** Digits-only version of a phone number, for validation & E.164 assembly. */
function digits(value) {
  return String(value || "").replace(/\D/g, "");
}

/**
 * Best-effort conversion to E.164 (+1XXXXXXXXXX) for US numbers.
 * Twilio requires E.164. If we can't confidently format it, return "".
 */
export function toE164(rawPhone) {
  const d = digits(rawPhone);
  if (!d) return "";
  if (d.length === 10) return "+1" + d;               // US 10-digit
  if (d.length === 11 && d.startsWith("1")) return "+" + d; // US with country code
  if (String(rawPhone).trim().startsWith("+")) return "+" + d; // already intl
  return "";
}

/**
 * @param {Object} body raw parsed request body
 * @returns {{ ok:boolean, errors:string[], data:Object|null, isSpam:boolean }}
 */
export function validateConsultation(body = {}) {
  // Honeypot: real users never fill this hidden field.
  if (clean(body.company_website)) {
    return { ok: false, errors: ["spam"], data: null, isSpam: true };
  }

  const data = {
    firstName: clean(body.first_name, 80),
    lastName: clean(body.last_name, 80),
    email: clean(body.email, 160).toLowerCase(),
    phone: clean(body.phone, 40),
    phoneE164: toE164(body.phone),
    projectType: clean(body.project_type, 60),
    city: clean(body.city, 120),
    preferredInstallationDate: clean(body.preferred_installation_date, 120),
    treeHeight: clean(body.tree_height, 60),
    treeCount: clean(body.tree_count, 40),
    areas: clean(body.areas, 300),
    budget: clean(body.budget, 60),
    format: clean(body.format, 60),
    notes: clean(body.notes, 2000),
    // Client-provided idempotency key (one per form load) prevents duplicates
    // from double-clicks or network retries. We fall back to a derived key.
    idempotencyKey: clean(body.idempotency_key, 80),
  };

  const errors = [];
  if (!data.firstName) errors.push("First name is required.");
  if (!data.lastName) errors.push("Last name is required.");
  if (!data.email || !EMAIL_RE.test(data.email)) errors.push("A valid email address is required.");
  if (digits(data.phone).length < 10) errors.push("A valid phone number is required.");
  if (!data.projectType) errors.push("Project type is required.");
  if (!data.city) errors.push("Property city is required.");
  if (!data.preferredInstallationDate) errors.push("A preferred installation date is required.");

  // Derive a stable dedup key if the client didn't send one.
  if (!data.idempotencyKey) {
    data.idempotencyKey = crypto
      .createHash("sha256")
      .update([data.email, data.preferredInstallationDate, data.phone].join("|"))
      .digest("hex")
      .slice(0, 40);
  }

  // Convenience composed fields used by templates.
  data.fullName = `${data.firstName} ${data.lastName}`.trim();
  data.servicesRequested = data.areas || "Not specified";
  data.projectAddress = data.city; // form currently collects city as the property location

  return { ok: errors.length === 0, errors, data, isSpam: false };
}

export default validateConsultation;
