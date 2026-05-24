-- OS Legal v3 — Module 6C Repair Migration
-- Fixes: ERROR 42703 column "active" does not exist
-- Safe to run even if some tables/columns already exist.

-- 1. Ensure profile avatar column exists
alter table public.profiles
add column if not exists avatar_url text;

-- 2. Ensure announcements table exists
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

-- 3. Add any missing columns to existing announcements table
alter table public.announcements
add column if not exists audience text not null default 'internal',
add column if not exists priority text not null default 'Normal',
add column if not exists active boolean not null default true;

-- 4. Ensure checks exist without failing if old table existed
alter table public.announcements
drop constraint if exists announcements_audience_check;

alter table public.announcements
add constraint announcements_audience_check
check (audience in ('all', 'internal', 'lawfirm', 'finance', 'hr', 'client'));

alter table public.announcements
drop constraint if exists announcements_priority_check;

alter table public.announcements
add constraint announcements_priority_check
check (priority in ('Normal', 'High', 'Urgent'));

-- 5. Ensure library table exists
create table if not exists public.library_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_by uuid references public.profiles(user_id) on delete set null,
  approved_by uuid references public.profiles(user_id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Add any missing columns to existing library table
alter table public.library_templates
add column if not exists category text not null default 'Client Update',
add column if not exists language text not null default 'English',
add column if not exists jurisdiction text default 'UAE',
add column if not exists practice_area text default 'General',
add column if not exists status text not null default 'Draft',
add column if not exists tags text[] default '{}';

alter table public.library_templates
drop constraint if exists library_templates_status_check;

alter table public.library_templates
add constraint library_templates_status_check
check (status in ('Draft', 'Under Review', 'Approved', 'Archived'));

-- 7. Enable RLS
alter table public.announcements enable row level security;
alter table public.library_templates enable row level security;

-- 8. Policies
drop policy if exists "announcements_select_by_role" on public.announcements;
create policy "announcements_select_by_role"
on public.announcements for select
using (
  active = true
  and (
    audience = 'all'
    or (audience = 'internal' and public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr'))
    or audience = public.current_user_role()
    or public.is_manager()
  )
);

drop policy if exists "announcements_write_manager" on public.announcements;
create policy "announcements_write_manager"
on public.announcements for all
using (public.is_manager())
with check (public.is_manager());

drop policy if exists "library_select_internal" on public.library_templates;
create policy "library_select_internal"
on public.library_templates for select
using (
  public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr')
);

drop policy if exists "library_insert_internal" on public.library_templates;
create policy "library_insert_internal"
on public.library_templates for insert
with check (
  public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr')
  and created_by = auth.uid()
);

drop policy if exists "library_update_manager" on public.library_templates;
create policy "library_update_manager"
on public.library_templates for update
using (public.is_manager())
with check (public.is_manager());

-- 9. Seed core template library
insert into public.library_templates (title, category, language, jurisdiction, practice_area, status, tags, body)
values
('General Client Update Email', 'Client Update', 'English', 'UAE', 'General', 'Approved', array['client','update','email'],
'Dear {client},

We would like to update you regarding your matter {matter_ref} — {matter_title}.

Current stage: {stage}
Next deadline/date: {deadline}

Next step:
{next_step}

Best regards,
{firm}'),

('تحديث عام للعميل', 'Client Update', 'Arabic', 'UAE', 'General', 'Approved', array['arabic','client','update'],
'السيد/السيدة {client} المحترم/ة،

نود إفادتكم بآخر المستجدات بخصوص ملفكم رقم {matter_ref} — {matter_title}.

المرحلة الحالية: {stage}
الموعد القادم: {deadline}

الخطوة التالية:
{next_step}

مع خالص التحية،
{firm}'),

('Payment Demand Legal Notice', 'Legal Notice', 'English', 'UAE', 'Commercial', 'Approved', array['notice','payment','commercial'],
'WITHOUT PREJUDICE

To: {opponent}

We act for {client} in relation to {matter_title}.

Background:
{next_step}

You are hereby requested to settle the outstanding amounts within the prescribed period, failing which our client reserves all rights to commence legal proceedings without further notice.

{firm}'),

('Standard Engagement Letter', 'Engagement Letter', 'English', 'UAE', 'General', 'Approved', array['engagement','scope','fees'],
'Dear {client},

We are pleased to confirm our engagement in relation to {matter_title}.

Matter reference: {matter_ref}
Scope of work:
{next_step}

Fees, VAT, court fees and payment terms shall be set out in the approved fee schedule.

Best regards,
{firm}'),

('Settlement Agreement Skeleton', 'Settlement Agreement', 'English', 'UAE', 'Dispute Resolution', 'Approved', array['settlement','agreement'],
'SETTLEMENT AGREEMENT

This agreement is entered into between {client} and {opponent} concerning {matter_title}.

1. Background
2. Settlement Amount / Obligations
3. Payment Schedule
4. Mutual Releases
5. Confidentiality
6. Governing Law and Jurisdiction

Signed by the parties.'),

('Expert Memo Skeleton', 'Expert Memo', 'English', 'UAE', 'Litigation', 'Approved', array['expert','court','memo'],
'EXPERT MEMO

Matter: {matter_ref} — {matter_title}
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
