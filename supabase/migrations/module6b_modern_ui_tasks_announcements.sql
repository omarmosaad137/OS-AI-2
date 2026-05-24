-- OS Legal v3 — Module 6B Modern UI, Tasks, Avatars, Announcements
-- Run after Module 6A.

alter table public.profiles
add column if not exists avatar_url text;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  audience text not null default 'internal' check (audience in ('all', 'internal', 'lawfirm', 'finance', 'hr', 'client')),
  priority text not null default 'Normal' check (priority in ('Normal', 'High', 'Urgent')),
  status text not null default 'active' check (status in ('active', 'archived')),
  expires_at date,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;

drop policy if exists "announcements_select_visible" on public.announcements;
create policy "announcements_select_visible"
on public.announcements for select
using (
  status = 'active'
  and (expires_at is null or expires_at >= current_date)
  and (
    audience = 'all'
    or (audience = 'internal' and public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr'))
    or audience = public.current_user_role()
  )
);

drop policy if exists "announcements_insert_manager" on public.announcements;
create policy "announcements_insert_manager"
on public.announcements for insert
with check (public.is_manager());

drop policy if exists "announcements_update_manager" on public.announcements;
create policy "announcements_update_manager"
on public.announcements for update
using (public.is_manager())
with check (public.is_manager());

-- Ensure internal users can manage meeting tasks from the dedicated task page.
drop policy if exists "meeting_tasks_write_internal" on public.meeting_tasks;
create policy "meeting_tasks_write_internal"
on public.meeting_tasks for all
using (
  public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr')
)
with check (
  public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr')
);
