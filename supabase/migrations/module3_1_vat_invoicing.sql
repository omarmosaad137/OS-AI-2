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
