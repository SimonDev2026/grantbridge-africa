-- 20261111000900_email_marketing.sql
-- Backstage email marketing: the admin designs emails and sends them to all
-- subscribers at once, consent-respecting.
--
-- APPLY via the Supabase dashboard SQL Editor (paste verbatim, like the
-- earlier migrations). Until it runs, /admin/email errors — the email
-- marketing section must not be treated as live before this runs.
--
-- TABLES
--   email_campaigns   — one row per email the admin writes (draft or sent).
--   email_sends       — one row per recipient per campaign: the audit trail
--                       (who got it, who failed and why). Unique on
--                       (campaign_id, email) so a re-send never double-mails.
--   email_unsubscribes — addresses that opted out. Recipient selection
--                       always excludes these.
--
-- RECIPIENTS (consent-respecting): quiz_leads with marketing_consent = true
-- and a non-null email. Signed-up users are NOT included — the profiles
-- table has no email-marketing opt-in (only whatsapp_opt_in), so there is no
-- consent on file to mail them.
--
-- RLS: no public access at all. No policies by design — writes and reads go
-- through the service role (admin server actions).
create table if not exists email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_html text not null default '',
  body_text text not null default '',
  status text not null default 'draft' check (status in ('draft', 'sent')),
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table email_campaigns enable row level security;
-- No policies by design: service-role only.

create table if not exists email_sends (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references email_campaigns(id) on delete cascade,
  email text not null,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  error text,
  sent_at timestamptz not null default now(),
  unique (campaign_id, email)
);

alter table email_sends enable row level security;
-- No policies by design: service-role only.

create index if not exists email_sends_campaign_id_idx on email_sends (campaign_id);

create table if not exists email_unsubscribes (
  email text primary key,
  unsubscribed_at timestamptz not null default now()
);

alter table email_unsubscribes enable row level security;
-- No policies by design: service-role only.
