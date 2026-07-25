/**
 * notify.js — Staff notification orchestration.
 *
 * Groups the internal-alert channels (email + optional SMS) behind one call so
 * the API handler stays readable and new staff channels (Slack, push, etc.)
 * can be added here without touching the endpoint.
 */

import { sendStaffEmail } from "./email.js";
import { sendStaffSms } from "./sms.js";
import { withRetry } from "./retry.js";
import config from "./config.js";
import logger from "./logger.js";

/**
 * Notify staff of a new consultation. Never throws — returns a result summary.
 * @returns {{ emailOk:boolean, smsOk:boolean|null }}
 */
export async function notifyStaff(data, meta) {
  const result = { emailOk: false, smsOk: null };

  // Staff email (retried)
  try {
    await withRetry(() => sendStaffEmail(data, meta), config.retries);
    result.emailOk = true;
  } catch (err) {
    logger.error("notify.staff_email_failed", { message: err.message });
  }

  // Staff SMS (optional; retried)
  if (config.features.staffSmsEnabled) {
    try {
      await withRetry(() => sendStaffSms(data), config.retries);
      result.smsOk = true;
    } catch (err) {
      result.smsOk = false;
      logger.error("notify.staff_sms_failed", { message: err.message });
    }
  }

  return result;
}

export default { notifyStaff };
