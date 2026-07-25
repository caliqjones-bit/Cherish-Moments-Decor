/**
 * sms.js — Transactional SMS service (Twilio).
 *
 * Thin wrapper; retry/backoff is applied by the orchestrator. Sends are
 * skipped gracefully (not errored) when SMS is not configured or no valid
 * customer phone number is available.
 *
 * To switch providers, reimplement `send()` — callers use sendCustomerSms /
 * sendStaffSms and are provider-agnostic.
 */

import twilio from "twilio";
import config from "./config.js";
import { customerSms, staffSms } from "./templates/sms.js";

let tw = null;
function client() {
  if (!config.features.smsEnabled) return null;
  if (!tw) tw = twilio(config.sms.accountSid, config.sms.authToken);
  return tw;
}

/** Low-level send. Throws on provider error. */
async function send(to, body) {
  const c = client();
  if (!c) throw new Error("sms_disabled");
  return c.messages.create({ from: config.sms.from, to, body });
}

/**
 * Customer confirmation SMS.
 * Returns { skipped:true, reason } when it can't/shouldn't send, otherwise the
 * Twilio message. Skips are not failures.
 */
export async function sendCustomerSms(data) {
  if (!config.features.smsEnabled) return { skipped: true, reason: "sms_disabled" };
  if (!data.phoneE164) return { skipped: true, reason: "no_valid_phone" };
  return send(data.phoneE164, customerSms(data, config.business));
}

/** Optional staff alert SMS. */
export async function sendStaffSms(data) {
  if (!config.features.staffSmsEnabled) return { skipped: true, reason: "staff_sms_disabled" };
  return send(config.sms.staffTo, staffSms(data));
}

export default { sendCustomerSms, sendStaffSms };
