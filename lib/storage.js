/**
 * storage.js — Durable storage for consultation submissions (Supabase/Postgres).
 *
 * Design goals from the spec:
 *  - Never lose submissions            → upsert on load; staff email is a backup path.
 *  - Prevent duplicate submissions     → unique `idempotency_key` + upsert.
 *  - Include timestamps                → created_at / updated_at (DB defaults + here).
 *  - Record submission status          → status + per-channel delivery flags.
 *  - CRM-syncable                      → flat, well-named columns; `synced_to_crm` flag.
 *
 * This module hides the storage implementation behind a small interface
 * (saveConsultation / updateDeliveryStatus). To swap Supabase for another
 * database later, reimplement these two functions — nothing else changes.
 *
 * See db/schema.sql for the table definition.
 */

import { createClient } from "@supabase/supabase-js";
import config from "./config.js";
import logger from "./logger.js";

let client = null;
function getClient() {
  if (!config.features.storageEnabled) return null;
  if (!client) {
    client = createClient(config.storage.url, config.storage.serviceKey, {
      auth: { persistSession: false },
    });
  }
  return client;
}

/**
 * Insert (or upsert on idempotency_key) a consultation record.
 * Returns { stored, id, duplicate, error }.
 */
export async function saveConsultation(data) {
  const db = getClient();
  if (!db) {
    logger.warn("storage.disabled", { note: "Supabase not configured; skipping DB save" });
    return { stored: false, id: null, duplicate: false, error: "storage_disabled" };
  }

  const now = new Date().toISOString();
  const row = {
    idempotency_key: data.idempotencyKey,
    first_name: data.firstName,
    last_name: data.lastName,
    full_name: data.fullName,
    email: data.email,
    phone: data.phone,
    phone_e164: data.phoneE164 || null,
    project_type: data.projectType,
    city: data.city,
    project_address: data.projectAddress,
    preferred_installation_date: data.preferredInstallationDate,
    consultation_date: data.consultationDate || null,
    tree_height: data.treeHeight || null,
    tree_count: data.treeCount || null,
    services_requested: data.servicesRequested,
    budget: data.budget || null,
    consultation_format: data.format || null,
    notes: data.notes || null,
    status: "received",
    email_sent: false,
    sms_sent: false,
    staff_notified: false,
    synced_to_crm: false,
    updated_at: now,
  };

  // Save with the idempotent upsert. If the `consultation_date` column hasn't
  // been added yet (migration not run), retry once without it so the booking
  // still persists — the date is never lost because the emails also carry it.
  async function upsertRow(r) {
    return db
      .from(config.storage.table)
      .upsert(r, { onConflict: "idempotency_key", ignoreDuplicates: false })
      .select("id")
      .limit(1);
  }
  function isUnknownColumn(err, col) {
    return err && (err.code === "PGRST204" || (err.message && err.message.indexOf(col) !== -1));
  }

  try {
    let { data: rows, error } = await upsertRow(row);
    if (error && isUnknownColumn(error, "consultation_date")) {
      logger.warn("storage.consultation_date_missing", { note: "Run the ALTER TABLE migration to store consultation_date." });
      const { consultation_date, ...rest } = row;
      ({ data: rows, error } = await upsertRow(rest));
    }
    if (error) throw error;
    const id = rows && rows[0] ? rows[0].id : null;
    return { stored: true, id, duplicate: false, error: null };
  } catch (err) {
    logger.error("storage.save_failed", { message: err.message });
    return { stored: false, id: null, duplicate: false, error: err.message };
  }
}

/**
 * Patch delivery/status flags after notifications are attempted.
 * Best-effort: failures here are logged but never block the customer response.
 */
export async function updateDeliveryStatus(id, patch) {
  const db = getClient();
  if (!db || !id) return { updated: false };
  try {
    const { error } = await db
      .from(config.storage.table)
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return { updated: true };
  } catch (err) {
    logger.error("storage.update_failed", { id, message: err.message });
    return { updated: false, error: err.message };
  }
}

// Soft-deleted rows carry this status; they're hidden from the main list and
// shown in "Recently Deleted" where they can be recovered or purged.
const DELETED_STATUS = "deleted";

/**
 * List active (non-deleted) consultations, newest first, for the dashboard.
 * Returns { rows, error }. Uses the service-role client (server-only).
 */
export async function listConsultations({ limit = 500 } = {}) {
  const db = getClient();
  if (!db) return { rows: [], error: "storage_disabled" };
  try {
    const { data, error } = await db
      .from(config.storage.table)
      .select("*")
      .neq("status", DELETED_STATUS)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { rows: data || [], error: null };
  } catch (err) {
    logger.error("storage.list_failed", { message: err.message });
    return { rows: [], error: err.message };
  }
}

/**
 * List soft-deleted consultations (Recently Deleted), most-recently-deleted first.
 */
export async function listDeletedConsultations({ limit = 500 } = {}) {
  const db = getClient();
  if (!db) return { rows: [], error: "storage_disabled" };
  try {
    const { data, error } = await db
      .from(config.storage.table)
      .select("*")
      .eq("status", DELETED_STATUS)
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { rows: data || [], error: null };
  } catch (err) {
    logger.error("storage.list_deleted_failed", { message: err.message });
    return { rows: [], error: err.message };
  }
}

/**
 * Set a consultation's workflow status (admin action). Returns { ok, error }.
 */
export async function setConsultationStatus(id, status) {
  const db = getClient();
  if (!db || !id) return { ok: false, error: "storage_disabled" };
  try {
    const { error } = await db
      .from(config.storage.table)
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    logger.error("storage.set_status_failed", { id, message: err.message });
    return { ok: false, error: err.message };
  }
}

/**
 * Permanently delete a consultation by id (admin action). Returns { ok, error }.
 */
export async function deleteConsultation(id) {
  const db = getClient();
  if (!db || !id) return { ok: false, error: "storage_disabled" };
  try {
    const { error } = await db.from(config.storage.table).delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    logger.error("storage.delete_failed", { id, message: err.message });
    return { ok: false, error: err.message };
  }
}

/**
 * Permanently delete ALL soft-deleted consultations (empty Recently Deleted).
 * Irreversible. Returns { ok, error }.
 */
export async function purgeDeletedConsultations() {
  const db = getClient();
  if (!db) return { ok: false, error: "storage_disabled" };
  try {
    const { error } = await db.from(config.storage.table).delete().eq("status", DELETED_STATUS);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    logger.error("storage.purge_failed", { message: err.message });
    return { ok: false, error: err.message };
  }
}

export default {
  saveConsultation,
  updateDeliveryStatus,
  listConsultations,
  listDeletedConsultations,
  setConsultationStatus,
  deleteConsultation,
  purgeDeletedConsultations,
};
