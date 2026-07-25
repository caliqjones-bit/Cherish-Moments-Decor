/**
 * /api/book-consultation — Vercel serverless endpoint.
 *
 * The single orchestrator for a consultation submission. It coordinates the
 * modular services but contains no provider-specific code itself:
 *
 *   1. Validate + normalize the submission (honeypot, required fields).
 *   2. Save it durably (Supabase) — deduped by idempotency key.
 *   3. Send the branded confirmation EMAIL to the customer.
 *   4. Send the confirmation SMS to the customer (if a phone was provided).
 *   5. Notify staff (email, + optional SMS).
 *   6. Record per-channel delivery status back to storage.
 *
 * Guarantees:
 *   - The customer NEVER sees a technical error. Once the submission is
 *     accepted and saved, we always return success; delivery happens with
 *     retries and any failures are logged (and the staff email is a backup).
 *   - Duplicate submits (double-click / retry) are idempotent.
 *
 * Adding a new automation later (e.g. reminders, follow-ups) means adding a
 * new module and calling it here — no refactor required.
 */

import config from "../lib/config.js";
import logger from "../lib/logger.js";
import { validateConsultation } from "../lib/validate.js";
import { saveConsultation, updateDeliveryStatus } from "../lib/storage.js";
import { sendCustomerEmail, sendStaffEmail } from "../lib/email.js";
import { sendCustomerSms } from "../lib/sms.js";
import { notifyStaff } from "../lib/notify.js";
import { withRetry } from "../lib/retry.js";

/** Read + JSON-parse the request body (Vercel may hand us a string or object). */
async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.length) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  // Fallback: manually collect the stream.
  return await new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}

export default async function handler(req, res) {
  // ---- CORS (same-origin in production; permissive header is harmless here) ----
  res.setHeader("Access-Control-Allow-Origin", config.business.siteUrl || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-form-token");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "method_not_allowed" });

  // Optional shared-secret gate (set FORM_TOKEN to enable).
  if (config.formToken && req.headers["x-form-token"] !== config.formToken) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const body = await readBody(req);

  // ---- 1. Validate ----
  const { ok, errors, data, isSpam } = validateConsultation(body);
  if (isSpam) {
    // Silently accept spam so bots get no feedback, but do nothing else.
    logger.warn("book.spam_ignored");
    return res.status(200).json({ ok: true });
  }
  if (!ok) {
    return res.status(400).json({ ok: false, errors });
  }

  const submittedAt = new Date().toISOString();

  // ---- 2. Save (durable, deduped) ----
  const saveResult = await saveConsultation(data);
  const meta = {
    submittedAt,
    recordId: saveResult.id,
    storageError: saveResult.stored ? null : saveResult.error,
  };
  if (!saveResult.stored) {
    // Storage failed — do NOT fail the request. The staff email below carries
    // the full submission so nothing is lost, and the failure is logged.
    logger.error("book.storage_unavailable", { error: saveResult.error });
  }

  // ---- 3–5. Notifications (each isolated; failures never break the response) ----
  const delivery = { email_sent: false, sms_sent: false, sms_skipped_reason: null, staff_notified: false };

  // Customer email (retried)
  try {
    await withRetry(() => sendCustomerEmail(data), config.retries);
    delivery.email_sent = true;
  } catch (err) {
    logger.error("book.customer_email_failed", { email: data.email, message: err.message });
  }

  // Customer SMS (retried; skipped cleanly when unavailable)
  try {
    const smsRes = await withRetry(() => sendCustomerSms(data), config.retries);
    if (smsRes && smsRes.skipped) delivery.sms_skipped_reason = smsRes.reason;
    else delivery.sms_sent = true;
  } catch (err) {
    logger.error("book.customer_sms_failed", { message: err.message });
  }

  // Staff notification (email + optional SMS)
  const staff = await notifyStaff(data, meta);
  delivery.staff_notified = staff.emailOk;

  // ---- 6. Record delivery status (best-effort) ----
  const finalStatus =
    delivery.email_sent && delivery.staff_notified ? "confirmed"
    : delivery.staff_notified ? "partial"
    : "needs_attention";

  await updateDeliveryStatus(saveResult.id, {
    status: finalStatus,
    email_sent: delivery.email_sent,
    sms_sent: delivery.sms_sent,
    staff_notified: delivery.staff_notified,
  });

  logger.info("book.processed", {
    recordId: saveResult.id,
    stored: saveResult.stored,
    ...delivery,
    status: finalStatus,
  });

  // Always a friendly success to the customer.
  return res.status(200).json({ ok: true });
}
