/**
 * staff-email.js — Internal "New Consultation Request" notification.
 *
 * Plain, scannable, and complete so the team can act immediately from their
 * inbox. Phone/email are click-to-contact. This email also doubles as a
 * durable backup of the submission if the database write ever fails.
 */

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

function row(label, value) {
  if (!value) return "";
  return `<tr>
    <td style="padding:8px 14px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8a7c5f;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap;vertical-align:top;">${esc(label)}</td>
    <td style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1f1f1c;vertical-align:top;">${value}</td>
  </tr>`;
}

export function buildStaffEmail(data, brand, meta = {}) {
  const subject = "New Consultation Request";
  const phoneLink = data.phone
    ? `<a href="tel:${esc((data.phoneE164 || data.phone).replace(/[^\d+]/g, ""))}">${esc(data.phone)}</a>`
    : "";
  const emailLink = data.email ? `<a href="mailto:${esc(data.email)}">${esc(data.email)}</a>` : "";

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;background:#f4f4f2;padding:24px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" align="center" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e2dd;border-radius:6px;">
    <tr><td style="background:#0d1f18;color:#fdfcf9;padding:18px 24px;font-family:Georgia,serif;font-size:19px;border-radius:6px 6px 0 0;">New Consultation Request</td></tr>
    <tr><td style="padding:22px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${row("Customer Name", esc(data.fullName))}
        ${row("Phone Number", phoneLink)}
        ${row("Email", emailLink)}
        ${row("Project Type", esc(data.projectType))}
        ${row("Address", esc(data.projectAddress))}
        ${row("Preferred Installation Date", esc(data.preferredInstallationDate))}
        ${row("Preferred Consultation Date", esc(data.consultationDate))}
        ${row("Requested Services", esc(data.servicesRequested))}
        ${row("Tree Height", esc(data.treeHeight))}
        ${row("Number of Trees", esc(data.treeCount))}
        ${row("Budget", esc(data.budget))}
        ${row("Consultation Format", esc(data.format))}
        ${row("Notes", esc(data.notes))}
      </table>
      <p style="margin:20px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#9a9a92;">
        Submitted ${esc(meta.submittedAt || new Date().toISOString())}${meta.recordId ? " · Record #" + esc(meta.recordId) : ""}${meta.storageError ? " · ⚠ DB save failed (this email is the backup copy)" : ""}
      </p>
    </td></tr>
  </table>
</body></html>`;

  const text =
    `New Consultation Request\n\n` +
    `Customer Name: ${data.fullName}\n` +
    `Phone Number: ${data.phone}\n` +
    `Email: ${data.email}\n` +
    `Project Type: ${data.projectType}\n` +
    `Address: ${data.projectAddress}\n` +
    `Preferred Installation Date: ${data.preferredInstallationDate}\n` +
    (data.consultationDate ? `Preferred Consultation Date: ${data.consultationDate}\n` : "") +
    `Requested Services: ${data.servicesRequested}\n` +
    (data.treeHeight ? `Tree Height: ${data.treeHeight}\n` : "") +
    (data.treeCount ? `Number of Trees: ${data.treeCount}\n` : "") +
    (data.budget ? `Budget: ${data.budget}\n` : "") +
    (data.format ? `Consultation Format: ${data.format}\n` : "") +
    (data.notes ? `Notes: ${data.notes}\n` : "") +
    `\nSubmitted ${meta.submittedAt || new Date().toISOString()}`;

  return { subject, html, text };
}

export default buildStaffEmail;
