-- Module 7 — Restore Leads, Matter Editing Support, Email AI/Template Support, Settings Support

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  source text,
  matter_type text,
  forum text,
  opponent text,
  stage text not null default 'New Enquiry',
  priority text not null default 'Normal',
  assigned_to text,
  followup_date date,
  facts text,
  notes text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

drop policy if exists "leads_manager_only" on public.leads;
create policy "leads_manager_only"
on public.leads for all
using (public.is_manager())
with check (public.is_manager());

alter table public.profiles add column if not exists avatar_url text;

-- Make sure library has the email/legal categories available
insert into public.library_templates (title, category, language, body)
values
('Payment Reminder Email', 'Payment Reminder', 'English', 'Dear {client},\n\nThis is a kind reminder regarding the payment connected to {matter_ref} — {matter_title}.\n\nPlease arrange payment on or before the due date.\n\nBest regards,\nOS Legal'),
('Document Request Email', 'Document Request', 'English', 'Dear {client},\n\nTo proceed with {matter_ref} — {matter_title}, please provide the pending documents requested by our team.\n\nBest regards,\nOS Legal'),
('Legal Notice Cover Email', 'Legal Notice', 'English', 'Dear {client},\n\nPlease find attached the draft/legal notice in relation to {matter_ref} — {matter_title}.\n\nBest regards,\nOS Legal')
on conflict do nothing;
