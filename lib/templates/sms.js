/**
 * sms.js (templates) — SMS message bodies.
 *
 * Customer message is kept under 160 characters where possible so it sends as
 * a single SMS segment. Staff message is concise but complete.
 */

/** Customer confirmation — kept to a single 160-char SMS segment. */
export function customerSms(data, brand) {
  return `Thank you for booking with ${brand.name}! We received your consultation request and will contact you soon. We can't wait to create something beautiful!`;
}

/** Staff alert — includes the essentials to act quickly. */
export function staffSms(data) {
  const parts = [
    "New consultation:",
    data.fullName,
    data.phone,
    data.projectType,
    data.preferredInstallationDate && `Date: ${data.preferredInstallationDate}`,
  ].filter(Boolean);
  return parts.join(" | ");
}

export default { customerSms, staffSms };
