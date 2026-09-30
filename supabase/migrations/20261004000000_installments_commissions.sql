-- Installment billing: a payment plan on a quotation, invoices per installment, receipt/tax invoices from invoices.
-- Commission: an internal ledger per quotation of commission owed and transferred. Never printed on documents.

create table installments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  quotation_id uuid not null references documents on delete cascade,
  position int not null check (position > 0),
  label text not null,
  pct_bps int not null check (pct_bps > 0 and pct_bps <= 10000),
  -- Amount before VAT, in satang, split from the quotation; the last installment takes any rounding.
  amount int not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (quotation_id, position)
);
create index on installments (owner_id);

alter table documents
  add column quotation_id uuid references documents on delete set null,
  add column installment_id uuid references installments on delete set null,
  -- Receipt/tax invoice: the invoice it settles.
  add column source_document_id uuid references documents on delete set null;
create index on documents (quotation_id);
create index on documents (installment_id);
create index on documents (source_document_id);

create table commissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  quotation_id uuid not null references documents on delete cascade,
  payee_name text not null,
  payee_account text,
  basis text not null check (basis in ('percent', 'fixed')),
  rate_bps int check (rate_bps is null or (rate_bps > 0 and rate_bps <= 10000)),
  amount int not null check (amount > 0),       -- commission before withholding, satang
  wht_bps int not null default 0 check (wht_bps in (0, 100, 200, 300, 500)),
  wht int not null default 0 check (wht >= 0),   -- satang withheld when paying
  note text,
  paid_on date,
  paid_reference text,
  created_at timestamptz not null default now()
);
create index on commissions (owner_id);
create index on commissions (quotation_id);

do $$ declare t text; begin
  foreach t in array array['installments', 'commissions'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t || '_owner', t);
  end loop;
end $$;
