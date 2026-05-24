-- OS Legal v3 — Module 2.1 Finance User Role
-- Run this after Module 2 if database already exists.

-- 1. Allow finance role in profiles
alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('manager', 'lawfirm', 'finance', 'client'));

-- 2. Update helper function so finance is treated as back-office user
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

-- 3. Law firm and finance users can see all matters; clients see own matters only
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

-- 4. Invoice requests: manager and finance see all, lawfirm sees own requests
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
using (
  public.is_manager()
  or public.current_user_role() = 'finance'
)
with check (
  public.is_manager()
  or public.current_user_role() = 'finance'
);

-- 5. Finance can see clients, same as lawfirm/manager
drop policy if exists "clients_select_by_role" on public.clients;
create policy "clients_select_by_role"
on public.clients for select
using (
  public.is_lawfirm_user()
  or id = public.current_user_client_id()
);
