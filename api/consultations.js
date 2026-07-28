/**
 * /api/consultations — read-only admin endpoint for the /admin dashboard.
 *
 * Security:
 *   - Gated by ADMIN_PASSWORD (server-side only). Compared in constant time.
 *   - Uses the Supabase SERVICE ROLE key, which never leaves the server — the
 *     browser only ever sends the password and receives already-selected rows.
 *   - Returns 503 when ADMIN_PASSWORD is unset, so the feature is off by default.
 */

import crypto from "node:crypto";
import config from "../lib/config.js";
import logger from "../lib/logger.js";
import {
  listConsultations,
  listDeletedConsultations,
  setConsultationStatus,
  deleteConsultation,
  purgeDeletedConsultations,
} from "../lib/storage.js";

/** Constant-time string comparison (avoids leaking the password via timing). */
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.length) {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return await new Promise((resolve) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  // Feature is disabled unless a password is configured.
  if (!config.admin.password) {
    return res.status(503).json({ ok: false, error: "admin_disabled" });
  }

  const body = await readBody(req);
  const provided = (body && body.password) || req.headers["x-admin-password"] || "";
  if (!safeEqual(provided, config.admin.password)) {
    logger.warn("admin.unauthorized");
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  // ---- Action router (all past the password gate above) ----
  const action = (body && body.action) || "list";

  if (action === "list") {
    const { rows, error } = await listConsultations();
    if (error) return res.status(500).json({ ok: false, error });
    return res.status(200).json({ ok: true, count: rows.length, consultations: rows });
  }

  if (action === "listDeleted") {
    const { rows, error } = await listDeletedConsultations();
    if (error) return res.status(500).json({ ok: false, error });
    return res.status(200).json({ ok: true, count: rows.length, consultations: rows });
  }

  if (action === "setStatus") {
    const id = body.id;
    const status = body.status;
    if (!id || !["completed", "open"].includes(status)) {
      return res.status(400).json({ ok: false, error: "bad_request" });
    }
    const r = await setConsultationStatus(id, status);
    if (!r.ok) return res.status(500).json({ ok: false, error: r.error });
    return res.status(200).json({ ok: true });
  }

  // Soft delete → move to Recently Deleted (recoverable).
  if (action === "delete") {
    const id = body.id;
    if (!id) return res.status(400).json({ ok: false, error: "bad_request" });
    const r = await setConsultationStatus(id, "deleted");
    if (!r.ok) return res.status(500).json({ ok: false, error: r.error });
    return res.status(200).json({ ok: true });
  }

  // Recover a soft-deleted consultation back into the active list.
  if (action === "restore") {
    const id = body.id;
    if (!id) return res.status(400).json({ ok: false, error: "bad_request" });
    const r = await setConsultationStatus(id, "open");
    if (!r.ok) return res.status(500).json({ ok: false, error: r.error });
    return res.status(200).json({ ok: true });
  }

  // Permanently remove a row (from the Recently Deleted view). Irreversible.
  if (action === "deleteForever") {
    const id = body.id;
    if (!id) return res.status(400).json({ ok: false, error: "bad_request" });
    const r = await deleteConsultation(id);
    if (!r.ok) return res.status(500).json({ ok: false, error: r.error });
    return res.status(200).json({ ok: true });
  }

  // Permanently remove ALL soft-deleted rows (empty Recently Deleted). Irreversible.
  if (action === "purgeDeleted") {
    const r = await purgeDeletedConsultations();
    if (!r.ok) return res.status(500).json({ ok: false, error: r.error });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ ok: false, error: "unknown_action" });
}
