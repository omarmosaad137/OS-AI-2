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
