-- OS Legal v3 — Module 5 Communication + Search
-- Run after Module 4.

create table if not exists public.team_chat_messages (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade,
  author_id uuid references public.profiles(user_id) on delete set null,
  channel text not null default 'general',
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete set null,
  to_email text not null,
  subject text not null,
  body text not null,
  email_type text not null default 'Client update',
  status text not null default 'draft' check (status in ('draft', 'queued', 'sent', 'failed', 'cancelled')),
  created_by uuid references public.profiles(user_id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.team_chat_messages enable row level security;
alter table public.email_queue enable row level security;

create or replace function public.is_internal_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
    and role in ('manager', 'lawfirm', 'finance', 'hr')
    and status = 'active'
  )
$$;

-- Internal chat is for internal users only, not client users.
drop policy if exists "team_chat_select_internal" on public.team_chat_messages;
create policy "team_chat_select_internal"
on public.team_chat_messages for select
using (public.is_internal_user());

drop policy if exists "team_chat_insert_internal" on public.team_chat_messages;
create policy "team_chat_insert_internal"
on public.team_chat_messages for insert
with check (
  public.is_internal_user()
  and author_id = auth.uid()
);

-- Email queue is internal only.
drop policy if exists "email_queue_select_internal" on public.email_queue;
create policy "email_queue_select_internal"
on public.email_queue for select
using (public.is_internal_user());

drop policy if exists "email_queue_insert_internal" on public.email_queue;
create policy "email_queue_insert_internal"
on public.email_queue for insert
with check (
  public.is_internal_user()
  and created_by = auth.uid()
);

drop policy if exists "email_queue_update_internal" on public.email_queue;
create policy "email_queue_update_internal"
on public.email_queue for update
using (public.is_internal_user())
with check (public.is_internal_user());
