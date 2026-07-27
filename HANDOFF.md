# Client Handoff Plan — Cherish Moments Decor

Goal: move the four services still under the developer's accounts
(**GitHub, Supabase, Resend, Vercel**) to the **client's** accounts, while the
developer keeps admin/member access. The domain + Cloudflare DNS are already the
client's.

**Principles**
1. Developer is invited to each client account *before* anything transfers — access never drops.
2. The live site keeps taking bookings throughout.
3. Env vars change only when a resource actually moves.

---

## Phase 0 — Client sets up accounts + invites the developer (no downtime)
- **Vercel** — client creates a **Team on the Pro plan** ($20/mo; required for a commercial site) → invites developer as **Member**.
- **Supabase** — client creates an **Organization** → invites developer as **Owner/Admin**.
- **Resend** — client creates an account → invites developer as a team member.
- **GitHub** — client creates an account/org (developer added as Collaborator in Phase 1).

## Phase 1 — GitHub (code)
1. Transfer the repo: GitHub → repo **Settings → General → Transfer ownership** → client's org.
2. Client adds developer as a **Collaborator** (keeps push access).
3. Vercel's Git link is reconnected in Phase 4.

## Phase 2 — Supabase (database + existing bookings)
1. **Back up first:** Table Editor → `consultations` → **Export CSV**.
2. **Transfer Project:** Project **Settings → General → Transfer project** → client's Organization.
   - Keeps the same project ref, URL, keys, and all data → **no env-var changes**, zero data loss.
   - Fallback if unavailable: `pg_dump` → restore into a new project, then update
     `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in Vercel.

## Phase 3 — Resend (email) — requires re-verification (DKIM keys are per-account)
1. In the **client's** Resend account: **Add Domain → cherishmomentsdecor.com → Manual setup** (generates a new record set).
2. Add the new DKIM/SPF/DMARC records in Cloudflare → **Verify**.
3. Create a **new API key** in the client's account.
4. Update **`RESEND_API_KEY`** in Vercel → redeploy.
5. Keep the old account/records until the new one verifies and a test email sends, then remove old DNS records.
6. Client invites developer as a Resend team member.

## Phase 4 — Vercel (hosting + env vars)
1. **Transfer Project:** Vercel → project **Settings → Advanced → Transfer Project** → client's Team.
   - Environment variables, domains, and deployment history transfer with it.
2. Reconnect **Git** (Settings → Git) to the client-owned repo if needed.
3. Confirm env vars carried over.

## Phase 5 — Point the real domain at the site + finalize env vars
1. Vercel → **Settings → Domains** → add `cherishmomentsdecor.com` and `www.cherishmomentsdecor.com`.
2. In **Cloudflare**, add the records Vercel specifies (A for root, CNAME for `www` set to **DNS only / grey cloud**).
3. Update env vars → **redeploy**:
   - `SITE_URL` = `https://www.cherishmomentsdecor.com`
   - `LOGO_URL` = `https://www.cherishmomentsdecor.com/assets/img/logo/cm-decor-emblem.png`
   - `EMAIL_FROM` = `Cherish Moments Decor <hello@cherishmomentsdecor.com>`

## Phase 6 — Verify end-to-end, then decommission
1. Submit a real test booking on the live domain → confirm thank-you page, row in client's Supabase,
   branded email from `hello@…` with the logo.
2. Delete the now-empty resources in the developer's own accounts (old Supabase project, old Resend domain/keys).
3. Confirm member access remains on all four client accounts.

---

## Env-var change summary
| When | Variable | New value |
|---|---|---|
| Phase 3 | `RESEND_API_KEY` | new key from client's Resend |
| Phase 5 | `SITE_URL` | `https://www.cherishmomentsdecor.com` |
| Phase 5 | `LOGO_URL` | `https://www.cherishmomentsdecor.com/assets/img/logo/cm-decor-emblem.png` |
| Phase 5 | `EMAIL_FROM` | `Cherish Moments Decor <hello@cherishmomentsdecor.com>` |
| Supabase (fallback only) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | new project values |

**Irreversible-data note:** only Supabase holds real data (the bookings). Always export the
CSV backup before any transfer. Everything else (code, config, DNS) is reproducible.

---

## Invite requests to send the client
Replace `[your email]` with the single email the developer uses for these accounts.

**Vercel**
> To host the site under your account, please add me to a Vercel team:
> 1. Sign up at vercel.com and create a **Team** (choose the **Pro** plan — required for a business site).
> 2. Team **Settings → Members → Invite** → email **[your email]** → role **Member**.

**Supabase**
> To move the booking database to your account:
> 1. Sign up at supabase.com (an **Organization** is created automatically).
> 2. **Organization Settings → Team → Invite** → email **[your email]** → role **Owner** or **Administrator**.

**Resend**
> To send the booking emails from your account:
> 1. Sign up at resend.com.
> 2. **Settings → Team → Invite member** → email **[your email]**.

**GitHub**
> To hand over the website code:
> 1. Create a free account (or org) at github.com and tell me the username.
> 2. After I transfer the repo to you, add me back as a **Collaborator** (repo Settings → Collaborators).

---

## Admin dashboard (view all bookings)
A password-protected page lists every consultation straight from the database —
independent of email, so it shows all bookings even if an email alert never arrived.

- **URL (current Vercel deployment):** https://cherish-moments-decor-htfk.vercel.app/admin
- **URL (once the custom domain is live):** https://cherishmomentsdecor.com/admin — same page, same password.
- **It reads from whichever Supabase database the app points to**, so after the handoff it
  automatically shows the client's data.

**To enable it (one-time):**
1. Vercel → **Settings → Environment Variables** → add **`ADMIN_PASSWORD`** = a strong password.
2. **Redeploy** (Deployments → ⋯ → Redeploy).
3. Open `/admin`, enter that password. Give the client the URL + password.

Until `ADMIN_PASSWORD` is set, the page loads but shows "Admin view isn't enabled yet."
The password is checked server-side; the Supabase service-role key never reaches the browser.
`/admin` is marked noindex and disallowed in robots.txt.
