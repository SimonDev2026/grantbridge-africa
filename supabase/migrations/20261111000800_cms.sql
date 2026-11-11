-- 20261111000800_cms.sql
-- Backstage CMS: admin-manageable events, figures/stats, testimonials.
--
-- APPLY via the Supabase dashboard SQL Editor (paste verbatim, like the
-- earlier migrations). Until it runs, /admin/cms and /events error and the
-- homepage stats band falls back to the live counts only — the CMS must not
-- be treated as live before this runs.
--
-- TABLES
--   cms_events       — public events (webinars, info sessions, launch days).
--   cms_stats        — figures shown in the homepage stats band. Rows with
--                      source = 'live' are COMPUTED from the grants tables at
--                      request time (the stored value is ignored); rows with
--                      source = 'manual' show the admin's typed value. Live
--                      rows are seeded below with the real live counts as
--                      labels only — nothing here is an invented number.
--   cms_testimonials — quotes from real users. NO seed rows: the homepage
--                      shows nothing until the admin adds real testimonials.
--
-- RLS: the public may SELECT published rows only. No public INSERT/UPDATE/
-- DELETE policy — writes go through the service role (admin server actions).
create table if not exists cms_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  location text not null default '',
  description text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cms_events enable row level security;

create policy "public reads published events"
  on cms_events for select
  using (status = 'published');

create table if not exists cms_stats (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  sub text not null default '',
  value text not null default '',
  source text not null default 'manual' check (source in ('live', 'manual')),
  sort_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cms_stats enable row level security;

create policy "public reads published stats"
  on cms_stats for select
  using (status = 'published');

create table if not exists cms_testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default '',
  quote text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table cms_testimonials enable row level security;

create policy "public reads published testimonials"
  on cms_testimonials for select
  using (status = 'published');

-- Seed the four live figures (source = 'live': values are computed from the
-- grants tables at request time, never taken from this table). Labels and
-- explanations match the homepage stats band as it stands today.
insert into cms_stats (key, label, sub, source, sort_order, status) values
  ('open_grants', 'Open grants', 'Live listings, checked against funder pages', 'live', 10, 'published'),
  ('total_funding_usd', 'Total funding available', 'Combined maximum value of open grants, in USD', 'live', 20, 'published'),
  ('funders', 'Funders with open calls', 'International and African funders', 'live', 30, 'published'),
  ('countries', 'African countries covered', 'Every country, from Algeria to Zimbabwe', 'live', 40, 'published')
on conflict (key) do nothing;
