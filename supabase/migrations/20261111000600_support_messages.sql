-- 20261111000600_support_messages.sql
-- Chat support messages from the floating help button (POST /api/support-message).
--
-- APPLY via the Supabase dashboard SQL Editor (paste verbatim, like the
-- earlier migrations). Until it runs, the API route cannot save messages and
-- returns 500 — the chat button must not be treated as live before this runs.
--
-- WHY A TABLE: email delivery to real inboxes only works once the domain is
-- verified in Resend (until then Resend only delivers to the account owner),
-- so the database is the safety net — a visitor's message is saved first and
-- the email is best-effort on top. Admins read/reply from /admin/support.
--
-- SAFE: RLS is enabled with NO policies at all, so only the service role can
-- read or insert (the API route inserts via the service-role client; the
-- admin page reads via the service role). No public SELECT/INSERT policy.
create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'replied')),
  created_at timestamptz not null default now()
);

alter table support_messages enable row level security;
-- No policies by design: service-role only.
