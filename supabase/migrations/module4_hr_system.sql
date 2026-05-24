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
