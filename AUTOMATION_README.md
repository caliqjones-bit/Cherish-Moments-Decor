# Cherish Moments Decor — Consultation Booking Automation

When a visitor submits the **Book a Consultation** form, this system automatically:

1. **Saves** the consultation to a database (deduplicated, timestamped, status-tracked).
2. Sends the customer a **branded HTML confirmation email**.
3. Sends the customer a **confirmation SMS** (if a phone number was provided).
4. **Notifies the studio** by email (and optionally SMS) that a new request came in.
5. Redirects the visitor to a **branded thank-you page**.

It's built as small, independent modules so new automations (reminders,
follow-ups, review requests, CRM sync…) can be added later without a rewrite.

---

## 1. Architecture at a glance

```
Browser (book-consultation.html)
   │  POST JSON  ─────────────────────────────►  /api/book-consultation.js   (orchestrator)
   │                                                    │
   │                                                    ├─ lib/validate.js     validate + normalize + honeypot
   │                                                    ├─ lib/storage.js      save/dedup/status  (Supabase)
   │                                                    ├─ lib/email.js        customer + staff email (Resend)
   │                                                    ├─ lib/sms.js          customer + staff SMS  (Twilio)
   │                                                    ├─ lib/notify.js       staff notification bundle
   │                                                    ├─ lib/retry.js        exponential-backoff retries
   │                                                    ├─ lib/logger.js       structured logs
   │                                                    ├─ lib/config.js       env vars + feature flags
   │                                                    └─ lib/templates/*     email + SMS content
   │  200 { ok:true }  ◄────────────────────────────────┘
   ▼
thank-you.html  (branded confirmation page)
```

**Design principles**

- **Separation of concerns** — form handling, email, SMS, notifications,
  storage, config, and logging are each their own module. Each provider lives
  behind a tiny interface, so switching Resend → SendGrid, or Twilio → another
  SMS vendor, means editing one file.
- **Never lose a submission** — if the database is unavailable, the request
  still succeeds and the staff email (which contains every field) is the backup
  copy.
- **Never show technical errors** — the customer always gets a friendly result;
  delivery happens with automatic retries, and failures are logged, not shown.
- **Idempotent** — each form load carries a unique key, so double-clicks and
  network retries can't create duplicate records.
- **Graceful degradation** — SMS/DB are optional. If Twilio or Supabase aren't
  configured yet, those steps are skipped (and logged), and email still works.

---

## 2. File map

| File | Purpose |
|------|---------|
| `api/book-consultation.js` | Serverless endpoint — orchestrates the whole flow. |
| `lib/config.js` | Reads env vars; derives feature flags. |
| `lib/validate.js` | Validates/sanitizes input; honeypot; phone → E.164; dedup key. |
| `lib/storage.js` | Supabase save / dedup / status updates. |
| `lib/email.js` | Resend send wrappers (customer + staff). |
| `lib/sms.js` | Twilio send wrappers (customer + staff). |
| `lib/notify.js` | Bundles the staff-alert channels. |
| `lib/retry.js` | Retry with exponential backoff. |
| `lib/logger.js` | Structured JSON logging (swap for Sentry/Logtail later). |
| `lib/templates/customer-email.js` | Branded, mobile-responsive HTML email. |
| `lib/templates/staff-email.js` | Internal "New Consultation Request" email. |
| `lib/templates/sms.js` | Customer + staff SMS bodies. |
| `db/schema.sql` | Supabase table + indexes + triggers. |
| `thank-you.html` | Branded confirmation page. |
| `.env.example` | All environment variables, documented. |
| `vercel.json` / `package.json` | Deployment + dependency config. |

---

## 3. One-time setup

You'll need three free accounts. Set SMS/Twilio up whenever you're ready — email
works on its own.

### a) Supabase (database)
1. Create a project at <https://supabase.com>.
2. Open **SQL Editor** → paste the contents of `db/schema.sql` → **Run**.
3. **Settings → API**: copy the **Project URL** and the **service_role** key.

### b) Resend (email)
1. Create an account at <https://resend.com> and an **API key**.
2. **Verify your domain** (`cherishmomentsdecor.com`) so email lands in inboxes.
3. Set `EMAIL_FROM` to an address on that domain (e.g. `hello@cherishmomentsdecor.com`).

### c) Twilio (SMS) — optional
1. Create an account at <https://twilio.com>, buy an SMS-capable number.
2. Copy your **Account SID**, **Auth Token**, and the number (E.164, e.g. `+13475551234`).

### d) Environment variables
Copy `.env.example` → `.env` for local testing, and add the **same keys** in
**Vercel → Project → Settings → Environment Variables** for production.

---

## 4. Deploy to Vercel

1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. In Vercel, **Import** the repo. It auto-detects the static site + the
   `/api` function — no build step needed.
3. Add the environment variables (step 3d).
4. **Deploy.** Your form now posts to `https://<your-domain>/api/book-consultation`.

Local testing: install the Vercel CLI, then `npm install` and `vercel dev`.

> **Note:** the `/api` endpoint only runs on a serverless host like Vercel. If
> the site is served as plain static files (no backend), the form shows a
> friendly "please call us" message instead — nothing breaks.

---

## 5. How the customer experience flows

1. Visitor fills the form and picks a preferred installation date.
2. On submit, the browser POSTs JSON to `/api/book-consultation` and the button
   shows "Sending…".
3. The API saves + sends everything, returns `{ ok: true }`.
4. The browser redirects to `thank-you.html`.
5. The customer receives the branded email (and SMS if they gave a number); the
   studio gets the "New Consultation Request" alert.

---

## 6. Security notes

- All secrets live in environment variables and are **only** read server-side.
  Nothing sensitive is ever sent to the browser.
- Supabase **Row Level Security** is enabled; only the server's service-role key
  can read/write the table.
- A hidden **honeypot** field silently drops bot submissions. For extra
  protection you can set `FORM_TOKEN` (the frontend already sends nothing that
  exposes it; enable only if you add the header).

---

## 7. Adding future automations

The architecture is built to extend. Examples:

- **Consultation / installation reminders** — add `api/cron-reminders.js`,
  schedule it with [Vercel Cron](https://vercel.com/docs/cron-jobs), query
  Supabase for upcoming dates, and reuse `lib/email.js` / `lib/sms.js` with a
  new template in `lib/templates/`.
- **Follow-up & review-request emails** — same pattern: a scheduled function +
  a new template. No changes to existing code.
- **Staff scheduling** — read from the `consultations` table; add columns as
  needed.
- **CRM integration** — the table already has `synced_to_crm` / `crm_id`; add a
  `lib/crm.js` module and call it from the orchestrator (or a cron job).
- **AI-powered support** — add a separate endpoint that reads the same storage
  layer.

Because every provider sits behind a small interface and the orchestrator just
calls modules, you can add capabilities without refactoring what's already here.

---

## 8. What was changed on the website itself

- `book-consultation.html` form now submits via `js/main.js` to the API and
  redirects to `thank-you.html` on success (with a friendly fallback message if
  the backend is unreachable).
- `thank-you.html` was added as the branded confirmation page.
- No other pages, styling, or content were altered.
