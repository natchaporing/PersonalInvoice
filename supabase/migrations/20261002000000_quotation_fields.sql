-- Quotation-style fields: validity dates, per-line discount / VAT / product code, column toggles,
-- and signatories (signer + approver) whose details are frozen on the document when it is issued.

alter table documents
  add column valid_until date,
  add column reply_by date,
  add column show_product_code boolean not null default false,
  add column show_unit boolean not null default true,
  add column signer_id uuid,
  add column approver_id uuid,
  add column signers_snapshot jsonb;

alter table document_lines
  add column product_code text,
  add column discount int not null default 0 check (discount >= 0),
  add column vat_bps int not null default 700 check (vat_bps >= 0 and vat_bps <= 10000);

alter table items
  add column code text,
  add column default_vat_bps int not null default 700 check (default_vat_bps >= 0 and default_vat_bps <= 10000);

create table signatories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  name_th text not null,
  name_en text,
  title_th text,
  title_en text,
  -- Handwritten signature as a small PNG/JPEG data URL. Optional.
  signature_image text check (signature_image is null or (length(signature_image) < 400000 and signature_image ~ '^data:image/(png|jpeg);base64,')),
  created_at timestamptz not null default now()
);
create index on signatories (owner_id);
alter table signatories enable row level security;
create policy signatories_owner on signatories for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

alter table documents
  add constraint documents_signer_fk foreign key (signer_id) references signatories on delete set null,
  add constraint documents_approver_fk foreign key (approver_id) references signatories on delete set null;

-- Deleting a signatory nulls signer_id on documents; that must not trip the immutability guard.
create or replace function guard_issued_document() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'issued documents cannot be deleted; void or credit-note them'; end if;
    return old;
  end if;
  if old.status <> 'draft' then
    if (to_jsonb(new) - array['status','pdf_path','pdf_sha256','signed_at','voided_at','signer_id','approver_id'])
       is distinct from (to_jsonb(old) - array['status','pdf_path','pdf_sha256','signed_at','voided_at','signer_id','approver_id']) then
      raise exception 'issued documents are immutable';
    end if;
  end if;
  return new;
end $$;

drop function issue_document(uuid, jsonb, jsonb);
create function issue_document(p_document_id uuid, p_seller jsonb, p_customer jsonb, p_signers jsonb default null)
returns text language plpgsql set search_path = public as $$
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
     and (coalesce(p_customer->>'tax_id','') = '' or coalesce(p_customer->>'address_th','') = '') then
    raise exception 'tax documents need buyer tax id and address (Revenue Code s.86/4)';
  end if;
  if coalesce(p_seller->>'tax_id','') = '' or coalesce(p_seller->>'name_th','') = '' then
    raise exception 'complete your business profile before issuing';
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
    seller_snapshot = p_seller, customer_snapshot = p_customer, signers_snapshot = p_signers,
    verify_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)
    where id = d.id;
  insert into audit_log (owner_id, document_id, action, detail) values (d.owner_id, d.id, 'issued', jsonb_build_object('number', num));
  return num;
end $$;
