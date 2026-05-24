-- OS Legal v3 — Module 2 migration
-- Run this in Supabase SQL Editor if Module 1 schema was already installed.

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

alter table public.invoice_requests enable row level security;

drop policy if exists "matters_select_by_role" on public.matters;
create policy "matters_select_by_role"
on public.matters for select
using (
  public.is_manager()
  or public.current_user_role() = 'lawfirm'
  or (
    public.current_user_role() = 'client'
    and client_id = public.current_user_client_id()
  )
);

drop policy if exists "invoice_requests_select_by_role" on public.invoice_requests;
create policy "invoice_requests_select_by_role"
on public.invoice_requests for select
using (
  public.is_manager()
  or (
    public.current_user_role() = 'lawfirm'
    and requested_by = auth.uid()
  )
);

drop policy if exists "invoice_requests_insert_lawfirm" on public.invoice_requests;
create policy "invoice_requests_insert_lawfirm"
on public.invoice_requests for insert
with check (
  public.is_lawfirm_user()
  and requested_by = auth.uid()
);

drop policy if exists "invoice_requests_update_manager_only" on public.invoice_requests;
create policy "invoice_requests_update_manager_only"
on public.invoice_requests for update
using (public.is_manager())
with check (public.is_manager());
