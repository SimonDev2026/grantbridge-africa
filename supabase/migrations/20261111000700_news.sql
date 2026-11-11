-- 20261111000700_news.sql
-- News / blog: public news page + backstage publisher + grant-news feed queue.
--
-- APPLY via the Supabase dashboard SQL Editor (paste verbatim, like the
-- earlier migrations). Until it runs, /news returns an error and the admin
-- publisher cannot save posts — the news section must not be treated as
-- live before this runs.
--
-- TABLES
--   news_posts   — every post, original (written by the admin) or curated
--                   (a short summary of a third-party article, queued by the
--                   RSS fetcher; NEVER auto-published, NEVER full copied text).
--   news_sources — the RSS feeds the fetcher polls (seeded below with the
--                   three feeds verified live on 2026-11-11).
--
-- RLS: the public may SELECT published posts only. No public INSERT/UPDATE/
-- DELETE policy — writes go through the service role (admin server actions
-- and the admin-only fetch route). news_sources is service-role only.
create table if not exists news_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  summary text not null default '',
  body text not null default '',
  source_name text,
  source_url text,
  origin text not null default 'original' check (origin in ('original', 'curated')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table news_posts enable row level security;

create policy "public reads published news"
  on news_posts for select
  using (status = 'published');

create table if not exists news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  feed_url text not null unique,
  active boolean not null default true,
  last_fetched_at timestamptz,
  last_status text,
  created_at timestamptz not null default now()
);

alter table news_sources enable row level security;
-- No policies by design: service-role only.

-- Seed feeds, each verified live (HTTP 200, real RSS items) on 2026-11-11.
--   fundsforNGOs — https://www.fundsforngos.org/feed/ (25 items)
--   Bond (UK NGO network) — https://www.bond.org.uk/news/feed/
--   African Development Bank — https://www.afdb.org/en/rss.xml (10 items,
--     but intermittently behind a Cloudflare challenge — the fetcher treats a
--     per-feed failure as a soft error and keeps the other feeds).
-- Deliberately NOT seeded (bot-blocked for server-side fetch, verified):
--   Devex, GrantWatch, Philanthropy News Digest / Candid, Inside Philanthropy,
--   GlobalGiving (all HTTP 403 to a server fetch).
insert into news_sources (name, feed_url) values
  ('fundsforNGOs', 'https://www.fundsforngos.org/feed/'),
  ('Bond', 'https://www.bond.org.uk/news/feed/'),
  ('African Development Bank', 'https://www.afdb.org/en/rss.xml')
on conflict (feed_url) do nothing;
