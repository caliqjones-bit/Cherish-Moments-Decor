-- ============================================================================
-- Cherish Moments Decor — consultation storage schema (Supabase / Postgres)
-- Run this once in the Supabase SQL editor (Project → SQL → New query).
-- ============================================================================

create table if not exists public.consultations (
  id                          bigint generated always as identity primary key,

  -- Deduplication: one row per submission. Repeat submits (double-click /
  -- network retry) upsert onto the same row instead of creating duplicates.
  idempotency_key             text not null unique,

  -- Customer details
  first_name                  text not null,
  last_name                   text not null,
  full_name                   text,
  email                       text not null,
  phone                       text,
  phone_e164                  text,

  -- Project details
  project_type                text,
  city                        text,
  project_address             text,
  preferred_installation_date text,
  consultation_date           text,
  tree_height                 text,
  tree_count                  text,
  services_requested          text,
  budget                      text,
  consultation_format         text,
  notes                       text,

  -- Workflow status + per-channel delivery flags
  status                      text not null default 'received',
  email_sent                  boolean not null default false,
  sms_sent                    boolean not null default false,
  staff_notified              boolean not null default false,

  -- CRM sync hook (for a future integration)
  synced_to_crm               boolean not null default false,
  crm_id                      text,

  -- Timestamps
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

-- Helpful indexes for the admin/CRM views you may add later.
create index if not exists consultations_created_at_idx on public.consultations (created_at desc);
create index if not exists consultations_email_idx      on public.consultations (email);
create index if not exists consultations_status_idx     on public.consultations (status);

-- ----------------------------------------------------------------------------
-- Row Level Security.
-- The serverless functions use the SERVICE ROLE key, which bypasses RLS, so no
-- policies are required for the automation to work. We still ENABLE RLS so that
-- the public/anon key can never read or write this table by default.
-- ----------------------------------------------------------------------------
alter table public.consultations enable row level security;

-- (Intentionally no anon/public policies: only the service role may access.)

-- Auto-update updated_at on any row change.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists consultations_set_updated_at on public.consultations;
create trigger consultations_set_updated_at
  before update on public.consultations
  for each row execute function public.set_updated_at();
