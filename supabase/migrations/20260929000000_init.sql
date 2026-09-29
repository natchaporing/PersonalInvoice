-- PersonalInvoice: initial schema. Money = integer satang. Rates = basis points.
-- Every row carries owner_id and is protected by RLS (single user now, multi-user ready).

create type document_type as enum
  ('quotation','invoice','tax_invoice','receipt_tax_invoice','credit_note','debit_note');
create type document_status as enum ('draft','issued','paid','void');
create type doc_lang as enum ('th','en','bilingual');

create table business_profiles (
  owner_id uuid primary key references auth.users on delete cascade,
  name_th text not null, name_en text,
  tax_id text not null check (tax_id ~ '^[0-9]{13}$'),
  branch_code text not null default '00000' check (branch_code ~ '^[0-9]{5}$'),
  address_th text not null, address_en text,
  phone text, email text,
  promptpay_id text,
  vat_registered boolean not null default true,
  default_vat_bps int not null default 700,
  logo_path text, signature_path text,
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name_th text not null, name_en text,
  tax_id text check (tax_id is null or tax_id ~ '^[0-9]{13}$'),
  branch_code text not null default '00000' check (branch_code ~ '^[0-9]{5}$'),
  is_juristic boolean not null default true,   -- company (PND 53) vs individual (PND 3)
  address_th text, address_en text, email text, phone text,
  created_at timestamptz not null default now()
);

create table items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name_th text not null, name_en text,
  unit text not null default 'unit',
  unit_price int not null check (unit_price >= 0),  -- satang
  default_wht_bps int not null default 0,
  created_at timestamptz not null default now()
);

create table document_sequences (
  owner_id uuid not null references auth.users on delete cascade,
  doc_type document_type not null,
  year int not null,
  last_number int not null default 0,
  primary key (owner_id, doc_type, year)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  doc_type document_type not null,
  status document_status not null default 'draft',
  number text,                                  -- assigned on issue, gap-free per type/year
  customer_id uuid references customers,
  customer_snapshot jsonb,                      -- frozen copies at issue time
  seller_snapshot jsonb,
  issue_date date not null default current_date,
  due_date date,
  lang doc_lang not null default 'bilingual',
  prices_include_vat boolean not null default false,
  vat_bps int not null default 700,
  wht_bps int not null default 0,
  discount int not null default 0 check (discount >= 0),
  subtotal int not null default 0, taxable int not null default 0,
  vat int not null default 0, total int not null default 0,
  wht int not null default 0, net_receivable int not null default 0,
  ref_document_id uuid references documents,    -- credit/debit note -> original
  reason text,                                  -- required for credit/debit notes
  notes text,
  pdf_path text, pdf_sha256 text, signed_at timestamptz, voided_at timestamptz,
  created_at timestamptz not null default now(),
  unique (owner_id, doc_type, number)
);

create table document_lines (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  position int not null,
  description_th text not null, description_en text,
  qty_milli int not null check (qty_milli > 0),  -- 1000 = 1 unit
  unit text not null default 'unit',
  unit_price int not null check (unit_price >= 0),
  amount int not null
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  document_id uuid not null references documents,
  paid_on date not null default current_date,
  amount int not null check (amount > 0),
  method text not null default 'promptpay',
  reference text, slip_path text,
  created_at timestamptz not null default now()
);

create table wht_certificates (   -- 50 Tawi received from customers
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  document_id uuid references documents,
  certificate_no text, issued_on date not null,
  income_amount int not null, wht_amount int not null,
  file_path text,
  created_at timestamptz not null default now()
);

create table audit_log (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid(),
  document_id uuid, action text not null, detail jsonb,
  at timestamptz not null default now()
);

create index on documents (owner_id, doc_type, issue_date desc);
create index on document_lines (document_id, position);
create index on payments (document_id);

-- Atomic, gap-free numbering. Called inside the issue transaction; if it rolls back, the number is not consumed.
create function issue_document(p_document_id uuid, p_seller jsonb, p_customer jsonb)
returns text language plpgsql as $$
declare
  d documents%rowtype; prefix text; yr int; n int; num text;
begin
  select * into d from documents where id = p_document_id and owner_id = auth.uid() for update;
  if not found then raise exception 'document not found'; end if;
  if d.status <> 'draft' then raise exception 'only drafts can be issued'; end if;
  if not exists (select 1 from document_lines where document_id = d.id) then
    raise exception 'document has no lines';
  end if;
  if d.doc_type in ('credit_note','debit_note') and (d.ref_document_id is null or coalesce(d.reason,'') = '') then
    raise exception 'credit/debit note needs a reference document and a reason';
  end if;
  if d.doc_type in ('tax_invoice','receipt_tax_invoice','credit_note','debit_note')
     and (p_customer->>'tax_id' is null or p_customer->>'address_th' is null) then
    raise exception 'tax documents need buyer tax id and address (Revenue Code s.86/4)';
  end if;

  yr := extract(year from d.issue_date)::int;
  insert into document_sequences (owner_id, doc_type, year, last_number)
    values (d.owner_id, d.doc_type, yr, 1)
    on conflict (owner_id, doc_type, year) do update set last_number = document_sequences.last_number + 1
    returning last_number into n;

  prefix := case d.doc_type
    when 'quotation' then 'QT' when 'invoice' then 'INV' when 'tax_invoice' then 'TX'
    when 'receipt_tax_invoice' then 'RTX' when 'credit_note' then 'CN' else 'DN' end;
  num := prefix || yr || '-' || lpad(n::text, 4, '0');

  update documents set status = 'issued', number = num,
    seller_snapshot = p_seller, customer_snapshot = p_customer where id = d.id;
  insert into audit_log (owner_id, document_id, action, detail) values (d.owner_id, d.id, 'issued', jsonb_build_object('number', num));
  return num;
end $$;

-- Issued documents are immutable except status progression and PDF/signature fields.
create function guard_issued_document() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'issued documents cannot be deleted; void or credit-note them'; end if;
    return old;
  end if;
  if old.status <> 'draft' then
    if (to_jsonb(new) - array['status','pdf_path','pdf_sha256','signed_at','voided_at'])
       is distinct from (to_jsonb(old) - array['status','pdf_path','pdf_sha256','signed_at','voided_at']) then
      raise exception 'issued documents are immutable';
    end if;
  end if;
  return new;
end $$;
create trigger documents_guard before update or delete on documents
  for each row execute function guard_issued_document();

create function guard_issued_lines() returns trigger language plpgsql as $$
declare st document_status;
begin
  select status into st from documents where id = coalesce(new.document_id, old.document_id);
  if st is not null and st <> 'draft' then raise exception 'lines of issued documents are immutable'; end if;
  return coalesce(new, old);
end $$;
create trigger lines_guard before insert or update or delete on document_lines
  for each row execute function guard_issued_lines();

-- Row level security: each owner sees only their rows.
do $$ declare t text; begin
  foreach t in array array['customers','items','documents','document_lines','payments','wht_certificates','audit_log','document_sequences']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for all to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()))', t || '_owner', t);
  end loop;
end $$;
alter table business_profiles enable row level security;
create policy business_profiles_owner on business_profiles for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
-- audit log is append-only from the app's view
drop policy audit_log_owner on audit_log;
create policy audit_log_read on audit_log for select to authenticated using (owner_id = (select auth.uid()));
create policy audit_log_insert on audit_log for insert to authenticated with check (owner_id = (select auth.uid()));
