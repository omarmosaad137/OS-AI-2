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
