-- OS Legal Module 6C Full Restore Repair Migration
-- Safe to run even if some objects already exist.

alter table public.profiles
add column if not exists avatar_url text;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text,
  message text,
  audience text default 'all',
  active boolean not null default true,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.announcements
add column if not exists title text,
add column if not exists message text,
add column if not exists audience text default 'all',
add column if not exists active boolean not null default true,
add column if not exists created_by uuid references public.profiles(user_id) on delete set null,
add column if not exists created_at timestamptz not null default now();

create table if not exists public.library_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'General',
  language text not null default 'English',
  body text not null,
  status text not null default 'approved',
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.announcements enable row level security;
alter table public.library_templates enable row level security;

drop policy if exists "announcements_select_internal" on public.announcements;
create policy "announcements_select_internal"
on public.announcements for select
using (
  active = true
  or public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr')
);

drop policy if exists "announcements_write_manager" on public.announcements;
create policy "announcements_write_manager"
on public.announcements for all
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "library_templates_select_internal" on public.library_templates;
create policy "library_templates_select_internal"
on public.library_templates for select
using (
  public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr')
);

drop policy if exists "library_templates_write_manager" on public.library_templates;
create policy "library_templates_write_manager"
on public.library_templates for all
using (public.current_user_role() in ('manager', 'lawfirm'))
with check (public.current_user_role() in ('manager', 'lawfirm'));

drop policy if exists "meeting_tasks_select_internal" on public.meeting_tasks;
create policy "meeting_tasks_select_internal"
on public.meeting_tasks for select
using (
  public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr')
);

drop policy if exists "meeting_tasks_write_internal" on public.meeting_tasks;
create policy "meeting_tasks_write_internal"
on public.meeting_tasks for all
using (
  public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr')
)
with check (
  public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr')
);

insert into public.library_templates (title, category, language, body)
values
('Client Update Email', 'Client Update', 'English', 'Dear {client},

We would like to update you regarding {matter_ref} — {matter_title}.

Current stage: {stage}
Next deadline/date: {deadline}

Next step:
{next_step}

Best regards,
OS Legal'),
('تحديث عام للعميل', 'Client Update', 'Arabic', 'السيد/السيدة {client} المحترم/ة،

نود إفادتكم بآخر المستجدات بخصوص الملف رقم {matter_ref} — {matter_title}.

المرحلة الحالية: {stage}
الموعد القادم: {deadline}

الخطوة التالية:
{next_step}

مع خالص التحية،
OS Legal'),
('Payment Demand Legal Notice', 'Legal Notice', 'English', 'WITHOUT PREJUDICE

To: {opponent}

We act for {client} in relation to {matter_title}.

Background:
{facts}

You are hereby requested to settle the outstanding amount within the legal notice period, failing which our client reserves all rights to commence legal proceedings without further notice.

OS Legal'),
('Standard Engagement Letter', 'Engagement Letter', 'English', 'Dear {client},

We are pleased to confirm our engagement in relation to {matter_title}.

Scope of work:
{next_step}

Professional fees, VAT, court/government fees and payment terms shall be confirmed in the fee schedule.

Best regards,
OS Legal'),
('Expert Memo Template', 'Expert Memo', 'English', 'Matter: {matter_ref}
Client: {client}
Opponent: {opponent}

Issues for expert:
1.
2.
3.

Documents to submit:
1.
2.
3.

Questions/objections:
1.
2.
3.')
on conflict do nothing;
