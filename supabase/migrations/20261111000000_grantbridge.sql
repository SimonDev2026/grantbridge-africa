-- GrantBridge Africa schema. Add to the starter repo's supabase/migrations and run `npm run migration:up`.
-- Uses pgvector (built into Supabase). bge-m3 produces 1024-dimension vectors.
create extension if not exists vector;

-- ---------- grant data ----------
create table funders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,                      -- foundation | government | multilateral | embassy | corporate
  website text,
  hq_country text,
  verified_at timestamptz,
  created_at timestamptz default now()
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  method text not null check (method in ('api','rss','scrape')),
  active boolean default true,
  last_run timestamptz,
  last_ok boolean
);

create table raw_pages (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references sources(id) on delete cascade,
  url text not null unique,
  content_hash text not null,
  text text not null,
  fetched_at timestamptz default now(),
  processed boolean default false
);

create table grants (
  id uuid primary key default gen_random_uuid(),
  funder_id uuid references funders(id),
  source_id uuid references sources(id),
  title text not null,
  summary text,
  official_url text not null,
  amount_min numeric, amount_max numeric, currency text default 'USD',
  amount_usd_min numeric, amount_usd_max numeric,
  deadline date, rolling boolean default false,
  scope text check (scope in ('international','africa','national')),
  all_countries boolean default false,
  eligible_countries text[] default '{}',       -- ISO names, e.g. {Nigeria,Ghana}
  eligible_regions text[] default '{}',         -- {Africa,"West Africa",ECOWAS,LMIC,ODA}
  excluded_countries text[] default '{}',
  foreign_applicants_allowed boolean,
  applicant_types text[] default '{}',          -- {ngo,startup,researcher,individual,community_group}
  registration_required text[],                 -- {registered_nonprofit,registered_company,cooperative}
  partner_required text,                        -- e.g. "EU lead partner"
  sectors text[] default '{}',
  beneficiaries text[] default '{}',
  stages text[] default '{}',
  max_share_of_budget numeric,                  -- e.g. 0.5 = grant can't exceed 50% of annual budget
  documents_required text[] default '{}',
  languages text[] default '{English}',
  fee_charged boolean default false,            -- if true, never published (scam rule)
  status text default 'open' check (status in ('open','upcoming','closed')),
  approved boolean default false,               -- human review before going live
  last_checked_at timestamptz default now(),
  embedding vector(1024),
  created_at timestamptz default now()
);
create index on grants using hnsw (embedding vector_cosine_ops);
create index on grants (status, approved);

-- ---------- users ----------
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_name text,
  applicant_type text,
  registration_type text,
  country text,
  regions text[] default '{}',
  state text,
  description text,
  sectors text[] default '{}',
  beneficiaries text[] default '{}',
  funding_need numeric,          -- USD
  annual_budget numeric,         -- USD
  team_size text,
  stage text,
  languages text[] default '{English}',
  whatsapp_number text,
  whatsapp_opt_in boolean default false,
  embedding vector(1024),
  updated_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  kind text,                     -- registration_certificate | constitution | annual_report | budget | past_application
  file_path text not null,       -- Supabase Storage path in private bucket 'org-docs'
  extracted_text text,
  created_at timestamptz default now()
);

create table matches (
  user_id uuid references auth.users(id) on delete cascade,
  grant_id uuid references grants(id) on delete cascade,
  score numeric not null,
  reasons jsonb default '[]',
  status text default 'new' check (status in ('new','saved','skipped','applying','submitted','won','lost')),
  created_at timestamptz default now(),
  primary key (user_id, grant_id)
);

create table drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  grant_id uuid references grants(id) on delete cascade,
  sections jsonb not null,       -- [{title, body}]
  version int default 1,
  model text,
  created_at timestamptz default now()
);

create table quiz_leads (
  id uuid primary key default gen_random_uuid(),
  answers jsonb not null,
  email text,
  marketing_consent boolean default false,
  utm jsonb,
  fbp text, fbc text,            -- Meta browser/click ids for Conversions API matching
  created_at timestamptz default now()
);

-- ---------- security: users only see their own rows ----------
alter table profiles  enable row level security;
alter table documents enable row level security;
alter table matches   enable row level security;
alter table drafts    enable row level security;
alter table grants    enable row level security;
alter table quiz_leads enable row level security;   -- no public policy: written only by the server (service role)

create policy "own profile"   on profiles  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own documents" on documents for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own matches"   on matches   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own drafts"    on drafts    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "approved grants are public" on grants for select using (approved and not fee_charged);

-- Private storage bucket for organisation documents
insert into storage.buckets (id, name, public) values ('org-docs','org-docs', false) on conflict do nothing;
create policy "own files read"  on storage.objects for select using (bucket_id = 'org-docs' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "own files write" on storage.objects for insert with check (bucket_id = 'org-docs' and auth.uid()::text = (storage.foldername(name))[1]);

-- ---------- matching ----------
-- Hard eligibility filters first, then a weighted score (0..1).
create or replace function match_grants(p_user uuid, p_limit int default 50)
returns table (grant_id uuid, score numeric)
language sql stable security definer set search_path = public as $$
  select g.id,
    round((
        0.55 * (1 - (g.embedding <=> p.embedding))
      + 0.15 * (case when p.sectors && g.sectors or g.sectors = '{}' then 1 else 0 end)
      + 0.10 * (case when p.beneficiaries && g.beneficiaries or g.beneficiaries = '{}' then 1 else 0 end)
      + 0.10 * (case when g.amount_usd_max is null
                       or p.funding_need between coalesce(g.amount_usd_min,0) and g.amount_usd_max * 1.2 then 1 else 0 end)
      + 0.10 * (case when g.rolling or g.deadline < current_date + 45 then 1 else 0 end)
    )::numeric, 4)
  from grants g join profiles p on p.user_id = p_user
  where g.approved and not g.fee_charged
    and g.status in ('open','upcoming')
    and (g.deadline is null or g.deadline >= current_date)
    and g.embedding is not null and p.embedding is not null
    and (g.all_countries or p.country = any(g.eligible_countries) or g.eligible_regions && p.regions)
    and not (p.country = any(g.excluded_countries))
    and (g.foreign_applicants_allowed is distinct from false or g.scope <> 'international')
    and (g.applicant_types = '{}' or p.applicant_type = any(g.applicant_types))
    and (g.registration_required is null or p.registration_type = any(g.registration_required))
    and (g.max_share_of_budget is null or p.annual_budget is null
         or p.funding_need <= p.annual_budget * g.max_share_of_budget)
  order by 2 desc
  limit p_limit;
$$;

-- Region lookup used when a profile is saved (extend for all 54 countries).
create table country_regions (country text primary key, regions text[] not null);
insert into country_regions values
 ('Nigeria','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,LMIC,ODA}'),
 ('Ghana','{Africa,"Sub-Saharan Africa","West Africa",ECOWAS,LMIC,ODA}'),
 ('Kenya','{Africa,"Sub-Saharan Africa","East Africa",EAC,LMIC,ODA}'),
 ('South Africa','{Africa,"Sub-Saharan Africa","Southern Africa",SADC,ODA}'),
 ('Egypt','{Africa,"North Africa",MENA,LMIC,ODA}');
