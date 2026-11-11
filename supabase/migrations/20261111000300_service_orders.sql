-- Step 2: Service Orders back office (DRAFT — review with the user before copying
-- into the repo and applying).
--
-- Extends the kit's service_requests (Expert Review $149 / Done-for-you $399)
-- with the full order lifecycle the user specified:
--   paid -> intake_pending -> in_progress -> review -> delivered -> closed
--   (refunded at any point)
-- Plus: intake form data, order files, private internal notes, client message
-- thread, deliveries, and a file view/download audit log.
--
-- Storage: order files live in the private 'org-docs' bucket under
--   <user_id>/orders/<service_request_id>/<file>
-- so the existing "own files" storage policies (foldername [1] = auth.uid())
-- already let each client read/write only their own files. Admins use the
-- service-role client (bypasses RLS) in the back office.
-- Never store funder-portal passwords anywhere. This schema has no such field.

-- ---------- lifecycle + payment fields on the kit table ----------
alter table service_requests drop constraint if exists service_requests_status_check;
alter table service_requests add constraint service_requests_status_check
  check (status in ('paid','intake_pending','in_progress','review','delivered','closed','refunded'));

alter table service_requests
  add column if not exists amount_paid_cents int,
  add column if not exists currency text not null default 'USD',
  add column if not exists deadline date,
  add column if not exists revision_requested boolean not null default false,
  add column if not exists revision_count int not null default 0,
  add column if not exists completed_at timestamptz;

-- ---------- intake form (client saves a draft, submits when ready) ----------
create table if not exists service_order_intakes (
  service_request_id uuid primary key references service_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  org_name text,
  org_type text,                    -- ngo | startup | researcher | individual | community_group | company
  org_country text,
  org_registration_no text,
  contact_name text,
  contact_email text,
  contact_phone text,
  project_title text,
  project_summary text,
  project_objectives text,
  beneficiaries text[] default '{}',
  budget_total numeric,
  budget_currency text default 'USD',
  amount_requested numeric,
  timeline text,
  status text not null default 'draft' check (status in ('draft','submitted')),
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------- files attached to an order ----------
create table if not exists order_files (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references service_requests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,               -- registration_certificate | constitution | annual_report | budget | letter_of_support | photo | final_document | other
  file_name text not null,
  file_path text not null,          -- org-docs path: <user_id>/orders/<service_request_id>/<file>
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists order_files_request_idx on order_files (service_request_id);

-- ---------- private internal notes (admins only, never shown to the client) ----------
create table if not exists order_notes (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references service_requests(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists order_notes_request_idx on order_notes (service_request_id);

-- ---------- message thread with the client ----------
create table if not exists order_messages (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references service_requests(id) on delete cascade,
  sender text not null check (sender in ('client','admin')),
  author_id uuid references auth.users(id) on delete cascade,
  body text not null,
  read_by_client boolean not null default false,
  read_by_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists order_messages_request_idx on order_messages (service_request_id);

-- ---------- deliveries (Word + PDF handovers; one revision, then close) ----------
create table if not exists order_deliveries (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references service_requests(id) on delete cascade,
  file_ids uuid[] default '{}',     -- order_files ids included in this delivery
  note text,
  delivered_by uuid references auth.users(id),
  delivered_at timestamptz not null default now()
);
create index if not exists order_deliveries_request_idx on order_deliveries (service_request_id);

-- ---------- audit log: every file view and download ----------
create table if not exists file_access_log (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid references service_requests(id) on delete cascade,
  file_path text not null,
  user_id uuid references auth.users(id) on delete cascade,
  action text not null check (action in ('view','download')),
  created_at timestamptz not null default now()
);
create index if not exists file_access_log_request_idx on file_access_log (service_request_id);

-- ---------- RLS ----------
-- Clients see only their own orders' rows (via service_requests.user_id or the
-- row's own user_id). Admins work through the service-role client, which
-- bypasses RLS. order_notes has NO client policy at all: internal only.
alter table service_order_intakes enable row level security;
alter table order_files enable row level security;
alter table order_notes enable row level security;
alter table order_messages enable row level security;
alter table order_deliveries enable row level security;
alter table file_access_log enable row level security;

create policy "own intake" on service_order_intakes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own order files" on order_files for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own order messages" on order_messages for select
  using (exists (select 1 from service_requests sr
                  where sr.id = service_request_id and sr.user_id = auth.uid()));
create policy "own order messages insert" on order_messages for insert
  with check (sender = 'client'
    and exists (select 1 from service_requests sr
                 where sr.id = service_request_id and sr.user_id = auth.uid()));
create policy "own deliveries" on order_deliveries for select
  using (exists (select 1 from service_requests sr
                  where sr.id = service_request_id and sr.user_id = auth.uid()));
create policy "own file access log" on file_access_log for select
  using (auth.uid() = user_id);
