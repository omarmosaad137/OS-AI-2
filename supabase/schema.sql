-- OS Legal v3 — Module 1 Auth and Roles Schema
-- Run this in Supabase SQL Editor before using the app.

create extension if not exists pgcrypto;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'Individual' check (type in ('Individual', 'Company')),
  email text,
  phone text,
  identity text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role text not null check (role in ('manager', 'lawfirm', 'finance', 'hr', 'client')),
  client_id uuid references public.clients(id) on delete set null,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.matters (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  title text not null,
  client_id uuid references public.clients(id) on delete restrict,
  matter_type text,
  forum text,
  opponent text,
  stage text not null default 'New Enquiry',
  status text not null default 'Active',
  owner_id uuid references public.profiles(user_id) on delete set null,
  deadline date,
  facts text,
  next_step text,
  created_at timestamptz not null default now()
);

create table if not exists public.matter_access (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade not null,
  user_id uuid references public.profiles(user_id) on delete cascade not null,
  access_level text not null default 'assigned' check (access_level in ('assigned', 'viewer', 'client')),
  unique (matter_id, user_id)
);

create table if not exists public.invoice_requests (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade not null,
  requested_by uuid references public.profiles(user_id) on delete set null,
  request_type text not null default 'Court fee',
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'AED',
  description text,
  urgency text not null default 'Normal' check (urgency in ('Normal', 'High', 'Urgent')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(user_id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.profiles where user_id = auth.uid() and status = 'active'
$$;

create or replace function public.current_user_client_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select client_id from public.profiles where user_id = auth.uid() and status = 'active'
$$;

create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
    and role = 'manager'
    and status = 'active'
  )
$$;

create or replace function public.is_lawfirm_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
    and role in ('manager', 'lawfirm', 'finance')
    and status = 'active'
  )
$$;

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.matters enable row level security;
alter table public.matter_access enable row level security;
alter table public.audit_log enable row level security;
alter table public.invoice_requests enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_manager" on public.profiles;
create policy "profiles_select_own_or_manager"
on public.profiles for select
using (user_id = auth.uid() or public.is_manager());

drop policy if exists "profiles_update_manager_only" on public.profiles;
create policy "profiles_update_manager_only"
on public.profiles for update
using (public.is_manager())
with check (public.is_manager());

-- clients
drop policy if exists "clients_select_by_role" on public.clients;
create policy "clients_select_by_role"
on public.clients for select
using (
  public.is_lawfirm_user()
  or id = public.current_user_client_id()
);

drop policy if exists "clients_write_manager_only" on public.clients;
create policy "clients_write_manager_only"
on public.clients for all
using (public.is_manager())
with check (public.is_manager());

-- matters
drop policy if exists "matters_select_by_role" on public.matters;
create policy "matters_select_by_role"
on public.matters for select
using (
  public.is_manager()
  or public.current_user_role() in ('lawfirm', 'finance')
  or (
    public.current_user_role() = 'client'
    and client_id = public.current_user_client_id()
  )
);

drop policy if exists "matters_insert_manager_lawfirm" on public.matters;
create policy "matters_insert_manager_lawfirm"
on public.matters for insert
with check (public.is_lawfirm_user());

drop policy if exists "matters_update_manager_or_assigned" on public.matters;
create policy "matters_update_manager_or_assigned"
on public.matters for update
using (
  public.is_manager()
  or exists (
    select 1 from public.matter_access ma
    where ma.matter_id = matters.id
    and ma.user_id = auth.uid()
  )
)
with check (
  public.is_manager()
  or exists (
    select 1 from public.matter_access ma
    where ma.matter_id = matters.id
    and ma.user_id = auth.uid()
  )
);

-- matter access
drop policy if exists "matter_access_select_manager_or_self" on public.matter_access;
create policy "matter_access_select_manager_or_self"
on public.matter_access for select
using (public.is_manager() or user_id = auth.uid());

drop policy if exists "matter_access_write_manager_only" on public.matter_access;
create policy "matter_access_write_manager_only"
on public.matter_access for all
using (public.is_manager())
with check (public.is_manager());

-- audit log
drop policy if exists "audit_select_manager_only" on public.audit_log;
create policy "audit_select_manager_only"
on public.audit_log for select
using (public.is_manager());

drop policy if exists "audit_insert_lawfirm" on public.audit_log;
create policy "audit_insert_lawfirm"
on public.audit_log for insert
with check (auth.uid() = actor_id);


-- invoice requests
drop policy if exists "invoice_requests_select_by_role" on public.invoice_requests;
create policy "invoice_requests_select_by_role"
on public.invoice_requests for select
using (
  public.is_manager()
  or public.current_user_role() = 'finance'
  or (
    public.current_user_role() = 'lawfirm'
    and requested_by = auth.uid()
  )
);

drop policy if exists "invoice_requests_insert_lawfirm" on public.invoice_requests;
create policy "invoice_requests_insert_lawfirm"
on public.invoice_requests for insert
with check (
  public.current_user_role() in ('manager', 'lawfirm', 'finance')
  and requested_by = auth.uid()
);

drop policy if exists "invoice_requests_update_manager_only" on public.invoice_requests;
create policy "invoice_requests_update_manager_only"
on public.invoice_requests for update
using (public.is_manager() or public.current_user_role() = 'finance')
with check (public.is_manager() or public.current_user_role() = 'finance');

-- Helpful view for app
create or replace view public.user_directory as
select
  p.user_id,
  p.email,
  p.full_name,
  p.role,
  p.status,
  p.client_id,
  c.name as client_name,
  p.created_at
from public.profiles p
left join public.clients c on c.id = p.client_id;


-- OS Legal v3 — Module 3 Finance Operations
-- Run after Module 2.1.

create table if not exists public.engagement_letters (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade not null,
  ref text not null unique,
  title text not null default 'Engagement Letter',
  status text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'cancelled')),
  sent_date date,
  signed_date date,
  payment_terms text,
  payment_due_date date,
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade not null,
  engagement_letter_id uuid references public.engagement_letters(id) on delete set null,
  invoice_no text not null unique,
  invoice_type text not null default 'Professional fee',
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'AED',
  vat_applicable boolean not null default false,
  vat_rate numeric(5,2) not null default 0,
  vat_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2),
  issue_date date not null default current_date,
  due_date date not null,
  status text not null default 'pending_approval' check (status in ('draft', 'pending_approval', 'approved', 'sent', 'part_paid', 'paid', 'overdue', 'cancelled', 'rejected')),
  description text,
  created_by uuid references public.profiles(user_id) on delete set null,
  approved_by uuid references public.profiles(user_id) on delete set null,
  approved_at timestamptz,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_reminders (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  matter_id uuid references public.matters(id) on delete cascade not null,
  reminder_date date not null,
  channel text not null default 'email' check (channel in ('email', 'whatsapp', 'phone', 'internal')),
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'skipped', 'failed')),
  message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.engagement_letters enable row level security;
alter table public.invoices enable row level security;
alter table public.payment_reminders enable row level security;

-- Engagement letters: manager and finance see/manage; client can see signed/sent for own matters later
drop policy if exists "engagement_letters_select_finance" on public.engagement_letters;
create policy "engagement_letters_select_finance"
on public.engagement_letters for select
using (
  public.is_manager()
  or public.current_user_role() = 'finance'
);

drop policy if exists "engagement_letters_write_finance" on public.engagement_letters;
create policy "engagement_letters_write_finance"
on public.engagement_letters for all
using (
  public.is_manager()
  or public.current_user_role() = 'finance'
)
with check (
  public.is_manager()
  or public.current_user_role() = 'finance'
);

-- Invoices: manager and finance see/manage
drop policy if exists "invoices_select_finance" on public.invoices;
create policy "invoices_select_finance"
on public.invoices for select
using (
  public.is_manager()
  or public.current_user_role() = 'finance'
);

drop policy if exists "invoices_insert_finance" on public.invoices;
create policy "invoices_insert_finance"
on public.invoices for insert
with check (
  public.is_manager()
  or public.current_user_role() = 'finance'
);

drop policy if exists "invoices_update_finance" on public.invoices;
create policy "invoices_update_finance"
on public.invoices for update
using (
  public.is_manager()
  or public.current_user_role() = 'finance'
)
with check (
  public.is_manager()
  or public.current_user_role() = 'finance'
);

-- Payment reminders: manager and finance see/manage
drop policy if exists "payment_reminders_select_finance" on public.payment_reminders;
create policy "payment_reminders_select_finance"
on public.payment_reminders for select
using (
  public.is_manager()
  or public.current_user_role() = 'finance'
);

drop policy if exists "payment_reminders_write_finance" on public.payment_reminders;
create policy "payment_reminders_write_finance"
on public.payment_reminders for all
using (
  public.is_manager()
  or public.current_user_role() = 'finance'
)
with check (
  public.is_manager()
  or public.current_user_role() = 'finance'
);


-- OS Legal v3 — Module 3.1 VAT Invoicing
-- Adds VAT calculation fields to invoices.

alter table public.invoices
add column if not exists vat_applicable boolean not null default false,
add column if not exists vat_rate numeric(5,2) not null default 0,
add column if not exists vat_amount numeric(12,2) not null default 0,
add column if not exists total_amount numeric(12,2);

-- Backfill total amount for existing invoices.
update public.invoices
set total_amount = coalesce(total_amount, amount + coalesce(vat_amount, 0))
where total_amount is null;

-- Add safety check.
alter table public.invoices
drop constraint if exists invoices_vat_non_negative;

alter table public.invoices
add constraint invoices_vat_non_negative
check (
  amount > 0
  and vat_rate >= 0
  and vat_amount >= 0
  and total_amount >= amount
);

comment on column public.invoices.vat_applicable is 'True for taxable professional/legal service invoices. False for court/government disbursements by default.';
comment on column public.invoices.vat_rate is 'VAT rate percentage, normally 5 for UAE taxable legal services.';
comment on column public.invoices.vat_amount is 'Calculated VAT amount.';
comment on column public.invoices.total_amount is 'Subtotal plus VAT.';


-- OS Legal v3 — Module 4 HR System
-- Run after Module 3.1.

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('manager', 'lawfirm', 'finance', 'hr', 'client'));

create table if not exists public.hr_employees (
  id uuid primary key default gen_random_uuid(),
  profile_user_id uuid references public.profiles(user_id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  department text not null default 'Legal',
  employee_type text not null default 'Full-time',
  start_date date,
  end_date date,
  basic_salary numeric(12,2),
  total_salary numeric(12,2),
  status text not null default 'active' check (status in ('active', 'on_leave', 'terminated', 'inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.hr_employees(id) on delete cascade not null,
  leave_type text not null default 'Annual leave',
  start_date date,
  end_date date,
  days_count numeric(6,2),
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  requested_by uuid references public.profiles(user_id) on delete set null,
  approved_by uuid references public.profiles(user_id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.hr_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.hr_employees(id) on delete cascade not null,
  attendance_date date not null,
  status text not null default 'Present' check (status in ('Present', 'Absent', 'Remote', 'Leave', 'Late')),
  check_in time,
  check_out time,
  notes text,
  recorded_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  unique(employee_id, attendance_date)
);

create table if not exists public.hr_payroll (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.hr_employees(id) on delete cascade not null,
  payroll_month text not null,
  basic_salary numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_salary numeric(12,2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'approved', 'paid', 'cancelled')),
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  unique(employee_id, payroll_month)
);

create table if not exists public.hr_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.hr_employees(id) on delete cascade not null,
  document_type text not null default 'Employment Contract',
  title text not null,
  expiry_date date,
  status text not null default 'pending',
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.hr_employees enable row level security;
alter table public.hr_leave_requests enable row level security;
alter table public.hr_attendance enable row level security;
alter table public.hr_payroll enable row level security;
alter table public.hr_documents enable row level security;

create or replace function public.is_hr_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
    and role in ('manager', 'hr')
    and status = 'active'
  )
$$;

create or replace function public.is_finance_or_hr()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where user_id = auth.uid()
    and role in ('manager', 'finance', 'hr')
    and status = 'active'
  )
$$;

-- Employees: manager/hr/finance can view. Manager/hr can write.
drop policy if exists "hr_employees_select" on public.hr_employees;
create policy "hr_employees_select"
on public.hr_employees for select
using (public.is_finance_or_hr());

drop policy if exists "hr_employees_write" on public.hr_employees;
create policy "hr_employees_write"
on public.hr_employees for all
using (public.is_hr_user())
with check (public.is_hr_user());

-- Leave: manager/hr/finance can view. Manager/hr can write/update.
drop policy if exists "hr_leave_select" on public.hr_leave_requests;
create policy "hr_leave_select"
on public.hr_leave_requests for select
using (public.is_finance_or_hr());

drop policy if exists "hr_leave_write" on public.hr_leave_requests;
create policy "hr_leave_write"
on public.hr_leave_requests for all
using (public.is_hr_user())
with check (public.is_hr_user());

-- Attendance: manager/hr/finance can view. Manager/hr can write.
drop policy if exists "hr_attendance_select" on public.hr_attendance;
create policy "hr_attendance_select"
on public.hr_attendance for select
using (public.is_finance_or_hr());

drop policy if exists "hr_attendance_write" on public.hr_attendance;
create policy "hr_attendance_write"
on public.hr_attendance for all
using (public.is_hr_user())
with check (public.is_hr_user());

-- Payroll: manager/hr/finance can view. Manager/finance can write.
drop policy if exists "hr_payroll_select" on public.hr_payroll;
create policy "hr_payroll_select"
on public.hr_payroll for select
using (public.is_finance_or_hr());

drop policy if exists "hr_payroll_write" on public.hr_payroll;
create policy "hr_payroll_write"
on public.hr_payroll for all
using (
  public.is_manager()
  or public.current_user_role() = 'finance'
)
with check (
  public.is_manager()
  or public.current_user_role() = 'finance'
);

-- HR documents: manager/hr/finance can view. Manager/hr can write.
drop policy if exists "hr_documents_select" on public.hr_documents;
create policy "hr_documents_select"
on public.hr_documents for select
using (public.is_finance_or_hr());

drop policy if exists "hr_documents_write" on public.hr_documents;
create policy "hr_documents_write"
on public.hr_documents for all
using (public.is_hr_user())
with check (public.is_hr_user());


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


-- OS Legal v3 — Module 6A Operations Calendar
-- Adds court calendar, expert missions, daily meetings and meeting action items.

create table if not exists public.court_hearings (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade not null,
  court_name text,
  case_number text,
  hearing_date date not null,
  hearing_time time,
  courtroom text,
  hearing_type text,
  assigned_lawyer text,
  client_attendance_required boolean not null default false,
  lawyer_attendance_required boolean not null default true,
  preparation_notes text,
  documents_required text,
  previous_result text,
  next_purpose text,
  judgment_expected_date date,
  appeal_deadline date,
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Prepared', 'Attended', 'Adjourned', 'Reserved for judgment', 'Judgment issued', 'Missed / urgent review', 'Closed')),
  client_visible boolean not null default false,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expert_missions (
  id uuid primary key default gen_random_uuid(),
  matter_id uuid references public.matters(id) on delete cascade not null,
  expert_name text,
  expert_type text not null default 'Accounting',
  expert_contact text,
  appointment_date date,
  deposit_amount numeric(12,2),
  deposit_deadline date,
  deposit_paid boolean not null default false,
  meeting_date date,
  meeting_location text,
  documents_submitted text,
  documents_pending text,
  court_questions text,
  site_visit_date date,
  preliminary_report_date date,
  objection_deadline date,
  final_report_date date,
  status text not null default 'Expert appointed' check (status in ('Expert appointed', 'Deposit pending', 'Deposit paid', 'Documents preparing', 'Documents submitted', 'Meeting scheduled', 'Meeting attended', 'Preliminary report issued', 'Objection drafting', 'Final report issued', 'Closed')),
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_meetings (
  id uuid primary key default gen_random_uuid(),
  meeting_date date not null,
  meeting_time time,
  meeting_type text not null default 'Daily',
  attendees text,
  agenda text,
  decisions text,
  followup_date date,
  status text not null default 'Scheduled' check (status in ('Scheduled', 'Completed', 'Pending action items', 'Closed')),
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.meeting_tasks (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.daily_meetings(id) on delete set null,
  matter_id uuid references public.matters(id) on delete set null,
  title text not null,
  owner_name text,
  due_date date,
  priority text not null default 'Normal' check (priority in ('Low', 'Normal', 'High', 'Urgent')),
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Done', 'Cancelled')),
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.court_hearings enable row level security;
alter table public.expert_missions enable row level security;
alter table public.daily_meetings enable row level security;
alter table public.meeting_tasks enable row level security;

-- Court hearings: manager/lawfirm/finance can access internally.
drop policy if exists "court_hearings_select_internal" on public.court_hearings;
create policy "court_hearings_select_internal"
on public.court_hearings for select
using (
  public.current_user_role() in ('manager', 'lawfirm', 'finance')
);

drop policy if exists "court_hearings_write_internal" on public.court_hearings;
create policy "court_hearings_write_internal"
on public.court_hearings for all
using (
  public.current_user_role() in ('manager', 'lawfirm')
)
with check (
  public.current_user_role() in ('manager', 'lawfirm')
);

-- Expert missions: manager/lawfirm/finance can access internally.
drop policy if exists "expert_missions_select_internal" on public.expert_missions;
create policy "expert_missions_select_internal"
on public.expert_missions for select
using (
  public.current_user_role() in ('manager', 'lawfirm', 'finance')
);

drop policy if exists "expert_missions_write_internal" on public.expert_missions;
create policy "expert_missions_write_internal"
on public.expert_missions for all
using (
  public.current_user_role() in ('manager', 'lawfirm')
)
with check (
  public.current_user_role() in ('manager', 'lawfirm')
);

-- Meetings: manager/lawfirm/finance/hr can see, internal can create.
drop policy if exists "daily_meetings_select_internal" on public.daily_meetings;
create policy "daily_meetings_select_internal"
on public.daily_meetings for select
using (
  public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr')
);

drop policy if exists "daily_meetings_write_internal" on public.daily_meetings;
create policy "daily_meetings_write_internal"
on public.daily_meetings for all
using (
  public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr')
)
with check (
  public.current_user_role() in ('manager', 'lawfirm', 'finance', 'hr')
);

-- Meeting tasks: internal users.
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


-- OS Legal v3 — Module 6C UI/Library/Tasks/Arabic Fix
-- Run after Module 6A or Module 6B.

alter table public.profiles
add column if not exists avatar_url text;

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  audience text not null default 'internal' check (audience in ('all', 'internal', 'lawfirm', 'finance', 'hr', 'client')),
  priority text not null default 'Normal' check (priority in ('Normal', 'High', 'Urgent')),
  active boolean not null default true,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.library_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Client Update',
  language text not null default 'English',
  jurisdiction text default 'UAE',
  practice_area text default 'General',
  status text not null default 'Draft' check (status in ('Draft', 'Under Review', 'Approved', 'Archived')),
  tags text[] default '{}',
  body text not null,
  created_by uuid references public.profiles(user_id) on delete set null,
  approved_by uuid references public.profiles(user_id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.announcements enable row level security;
alter table public.library_templates enable row level security;

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

-- Seed core template library
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
