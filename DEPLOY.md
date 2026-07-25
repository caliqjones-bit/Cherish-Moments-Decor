# Deployment

This project is a static site + Vercel serverless functions (`/api`) for the
consultation booking automation (email via Resend, optional SMS via Twilio,
storage in Supabase).

## Steps
1. **Supabase** — run `db/schema.sql` in the SQL editor (creates the
   `consultations` table).
2. **Vercel** — import this GitHub repo, then add the environment variables
   listed in `.env.example` under Settings → Environment Variables.
3. **Deploy.**

## Required environment variables (minimum to go live)
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `STAFF_EMAIL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_TABLE` (defaults to `consultations`)

SMS (Twilio) variables are optional — SMS is skipped gracefully until they are set.
