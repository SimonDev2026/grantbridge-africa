-- Pay-per-application credits ($29 one-time "Single Application Draft" price in Stripe)
-- and Done-for-you service requests. Credits are added by the Stripe webhook (see ADD_TO_STARTER_WEBHOOK.md).
create table draft_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits int not null default 0 check (credits >= 0),
  updated_at timestamptz default now()
);
alter table draft_credits enable row level security;
create policy "see own credits" on draft_credits for select using (auth.uid() = user_id);

create table service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  grant_id uuid references grants(id),
  package text check (package in ('review','done_for_you')),   -- $149 expert review / $399 done-for-you
  stripe_session_id text,
  status text default 'paid' check (status in ('paid','in_progress','delivered','refunded')),
  created_at timestamptz default now()
);
alter table service_requests enable row level security;
create policy "see own requests" on service_requests for select using (auth.uid() = user_id);

-- Atomically consume one credit; returns true if a credit was used.
create or replace function use_draft_credit(p_user uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update draft_credits set credits = credits - 1, updated_at = now()
   where user_id = p_user and credits > 0;
  return found;
end $$;

create or replace function add_draft_credits(p_user uuid, p_n int) returns void
language sql security definer set search_path = public as $$
  insert into draft_credits(user_id, credits) values (p_user, p_n)
  on conflict (user_id) do update set credits = draft_credits.credits + excluded.credits, updated_at = now();
$$;
revoke execute on function use_draft_credit(uuid), add_draft_credits(uuid,int) from public, anon, authenticated;
