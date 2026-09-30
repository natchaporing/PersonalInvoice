-- Commission payee profiles: the people and companies you pay commission to, with the details needed to
-- transfer the money and issue a withholding certificate (50 Tawi). Commissions keep their own copy of the
-- payee name and account, so editing or deleting a profile never changes recorded commissions.

create table commission_payees (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  is_juristic boolean not null default false,          -- company (PND 53) or individual (PND 3)
  tax_id text check (tax_id is null or tax_id ~ '^\d{13}$'),
  address text,
  phone text,
  email text,
  bank_name text,
  bank_account_name text,
  bank_account_number text check (bank_account_number is null or bank_account_number ~ '^\d{6,20}$'),
  default_rate_bps int check (default_rate_bps is null or (default_rate_bps > 0 and default_rate_bps <= 10000)),
  default_wht_bps int not null default 0 check (default_wht_bps in (0, 100, 200, 300, 500)),
  note text,
  created_at timestamptz not null default now()
);
create index on commission_payees (owner_id);
alter table commission_payees enable row level security;
create policy commission_payees_owner on commission_payees for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

alter table commissions add column payee_id uuid references commission_payees on delete set null;
create index on commissions (payee_id);
