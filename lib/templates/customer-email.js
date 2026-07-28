/**
 * customer-email.js — Branded HTML confirmation email for the customer.
 *
 * Email-client-safe techniques used:
 *  - Table-based layout (not fl[ex]box/grid) for Outlook/Gmail compatibility.
 *  - All CSS inlined on elements; a small <style> only for the mobile media query.
 *  - Web-safe serif (Georgia) as a stand-in for the site's Cormorant Garamond,
 *    since custom web fonts don't load in most email clients.
 *  - Max width 600px, fluid on mobile.
 *
 * Brand palette (from the website):
 *   evergreen-deep #0d1f18 · evergreen #163026 · champagne #c9a86a
 *   ivory #f7f3ec · winter-white #fdfcf9 · ink #2a2a28
 */

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

/** One row in the details summary table. */
function detailRow(label, value) {
  if (!value) return "";
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #ece5d6;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8a7c5f;width:42%;vertical-align:top;">${esc(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #ece5d6;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#2a2a28;vertical-align:top;">${esc(value)}</td>
    </tr>`;
}

/**
 * @param {Object} data   normalized consultation record
 * @param {Object} brand  config.business
 * @returns {{subject:string, html:string, text:string}}
 */
export function buildCustomerEmail(data, brand) {
  const subject = "Thank You for Booking Your Consultation | Cherish Moments Decor";

  const details =
    detailRow("Name", data.fullName) +
    detailRow("Email", data.email) +
    detailRow("Phone Number", data.phone) +
    detailRow("Preferred Installation Date", data.preferredInstallationDate) +
    detailRow("Preferred Consultation Date", data.consultationDate) +
    detailRow("Project Address", data.projectAddress) +
    detailRow("Services Requested", data.servicesRequested) +
    detailRow("Additional Notes", data.notes);

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${esc(subject)}</title>
<style>
  @media only screen and (max-width:620px){
    .container{width:100% !important;}
    .px{padding-left:24px !important;padding-right:24px !important;}
    .h1{font-size:26px !important;}
  }
  body{margin:0;padding:0;background:#f2ede3;}
</style>
</head>
<body style="margin:0;padding:0;background:#f2ede3;">
  <!-- preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your consultation request has been received — our team will contact you shortly.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2ede3;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="600" class="container" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#fdfcf9;border-radius:6px;overflow:hidden;border:1px solid #e6ddc9;">

          <!-- Header / logo on brand evergreen -->
          <tr>
            <td align="center" style="background:#0d1f18;padding:30px 24px 26px;">
              <img src="${esc(brand.logoUrl)}" width="120" alt="${esc(brand.name)}" style="display:block;border:0;outline:none;width:120px;max-width:60%;height:auto;">
            </td>
          </tr>

          <!-- Gold divider -->
          <tr><td style="height:3px;background:#c9a86a;line-height:3px;font-size:0;">&nbsp;</td></tr>

          <!-- Body -->
          <tr>
            <td class="px" style="padding:38px 44px 8px;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.28em;text-transform:uppercase;color:#b96a2e;">Request Received</p>
              <h1 class="h1" style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:30px;line-height:1.2;color:#0d1f18;">Thank you for booking your consultation</h1>
              <p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.7;color:#3a3a35;">Dear ${esc(data.firstName || "there")},</p>
              <p style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.7;color:#3a3a35;">Your consultation request has been <strong>successfully received</strong>. A member of the ${esc(brand.name)} team will contact you as soon as possible to discuss your project and finalize the details.</p>
              <p style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.7;color:#3a3a35;">We are so excited to help you create a beautiful, unforgettable holiday display. Your vision is in caring hands.</p>
            </td>
          </tr>

          <!-- Details summary -->
          <tr>
            <td class="px" style="padding:6px 44px 8px;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#8a7c5f;">Your Consultation Details</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${details}
              </table>
            </td>
          </tr>

          <!-- CTA buttons -->
          <tr>
            <td class="px" align="center" style="padding:30px 44px 10px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:4px;background:#c9a86a;">
                    <a href="${esc(brand.siteUrl)}" style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#0d1f18;text-decoration:none;font-weight:bold;">Visit Our Website</a>
                  </td>
                  <td style="width:14px;">&nbsp;</td>
                  <td align="center" style="border-radius:4px;border:1px solid #c9a86a;">
                    <a href="${esc(brand.instagramUrl)}" style="display:inline-block;padding:13px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#0d1f18;text-decoration:none;">Instagram</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:30px 40px 34px;background:#0d1f18;">
              <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#fdfcf9;">${esc(brand.name)}</p>
              <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#c9a86a;">Luxury Holiday Tree Design</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:rgba(247,243,236,.7);">
                <a href="tel:${esc((brand.phone || "").replace(/[^\d+]/g, ""))}" style="color:rgba(247,243,236,.85);text-decoration:none;">${esc(brand.phone)}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${esc(brand.replyToEmail)}" style="color:rgba(247,243,236,.85);text-decoration:none;">${esc(brand.replyToEmail)}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `Thank you for booking your consultation with ${brand.name}.`,
    ``,
    `Dear ${data.firstName || "there"},`,
    ``,
    `Your consultation request has been successfully received. A member of our team will contact you as soon as possible to discuss your project and finalize the details.`,
    ``,
    `We are excited to help you create a beautiful holiday display.`,
    ``,
    `YOUR CONSULTATION DETAILS`,
    `Name: ${data.fullName}`,
    `Email: ${data.email}`,
    `Phone Number: ${data.phone}`,
    `Preferred Installation Date: ${data.preferredInstallationDate}`,
    data.consultationDate ? `Preferred Consultation Date: ${data.consultationDate}` : ``,
    `Project Address: ${data.projectAddress}`,
    `Services Requested: ${data.servicesRequested}`,
    data.notes ? `Additional Notes: ${data.notes}` : ``,
    ``,
    `Website: ${brand.siteUrl}`,
    `Instagram: ${brand.instagramUrl}`,
    ``,
    `${brand.name} — Luxury Holiday Tree Design`,
    `${brand.phone} · ${brand.replyToEmail}`,
  ]
    .filter((l) => l !== undefined)
    .join("\n");

  return { subject, html, text };
}

export default buildCustomerEmail;
