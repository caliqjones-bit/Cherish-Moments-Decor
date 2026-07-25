/**
 * email.js — Transactional email service (Resend).
 *
 * Exposes two single-attempt send functions. Retry/backoff is applied by the
 * orchestrator (api/book-consultation.js) so this stays a thin, testable wrapper.
 * Each function throws on failure so the retry helper can catch it.
 *
 * To switch providers (SendGrid/Postmark), reimplement `send()` — the rest of
 * the app calls sendCustomerEmail / sendStaffEmail and is provider-agnostic.
 */

import { Resend } from "resend";
import config from "./config.js";
import { buildCustomerEmail } from "./templates/customer-email.js";
import { buildStaffEmail } from "./templates/staff-email.js";

let resend = null;
function client() {
  if (!config.features.emailEnabled) return null;
  if (!resend) resend = new Resend(config.email.apiKey);
  return resend;
}

/** Low-level send. Throws on any provider error. */
async function send({ to, subject, html, text, replyTo }) {
  const c = client();
  if (!c) throw new Error("email_disabled");
  const { data, error } = await c.emails.send({
    from: config.email.from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
    ...(replyTo ? { reply_to: replyTo } : {}),
  });
  if (error) throw new Error(error.message || "resend_error");
  return data;
}

/** Branded confirmation email to the customer. */
export async function sendCustomerEmail(data) {
  const { subject, html, text } = buildCustomerEmail(data, config.business);
  return send({
    to: data.email,
    subject,
    html,
    text,
    replyTo: config.business.replyToEmail,
  });
}

/** Internal "New Consultation Request" email to staff. */
export async function sendStaffEmail(data, meta) {
  const { subject, html, text } = buildStaffEmail(data, config.business, meta);
  return send({
    to: config.email.staffTo,
    subject,
    html,
    text,
    replyTo: data.email, // replying goes straight to the customer
  });
}

export default { sendCustomerEmail, sendStaffEmail };
