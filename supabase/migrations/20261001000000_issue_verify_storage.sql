-- Verification codes, signed-PDF storage and a narrow public verification function.

-- 1. A random public code printed on each issued document (the PDF cannot contain its own hash,
--    so the verify page looks the document up by this code and shows the recorded hash).
alter table documents add column verify_code text unique;

-- verify_code is set by issue_document in the same UPDATE that flips status away from draft,
-- so the immutability guard (which checks the OLD row's status) allows it.

create or replace function issue_document(p_document_id uuid, p_seller jsonb, p_customer jsonb)
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
    seller_snapshot = p_seller, customer_snapshot = p_customer,
    verify_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)
    where id = d.id;
  insert into audit_log (owner_id, document_id, action, detail) values (d.owner_id, d.id, 'issued', jsonb_build_object('number', num));
  return num;
end $$;

-- 2. Public verification: only the fields a verifier needs, looked up by the unguessable code.
create or replace function verify_document(p_code text)
returns table (
  number text, doc_type document_type, status document_status, issue_date date,
  seller_name text, seller_tax_id text, buyer_name text, total int, vat int,
  pdf_sha256 text, signed_at timestamptz, voided_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select d.number, d.doc_type, d.status, d.issue_date,
         d.seller_snapshot->>'name_th', d.seller_snapshot->>'tax_id', d.customer_snapshot->>'name_th',
         d.total, d.vat, d.pdf_sha256, d.signed_at, d.voided_at
  from documents d
  where d.verify_code = p_code and d.status <> 'draft';
$$;
revoke all on function verify_document(text) from public;
grant execute on function verify_document(text) to anon, authenticated;

-- 3. Private storage for signed PDFs, withholding certificates and payment slips.
--    Objects live under "<owner uuid>/..." and each user can only touch their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "documents: owner read" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "documents: owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "documents: owner update" on storage.objects for update to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "documents: owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 4. Payments recorded against issued documents only.
create or replace function guard_payment() returns trigger language plpgsql set search_path = public as $$
declare st document_status;
begin
  select status into st from documents where id = new.document_id and owner_id = new.owner_id;
  if st is null then raise exception 'document not found'; end if;
  if st not in ('issued', 'paid') then raise exception 'payments can only be recorded on issued documents'; end if;
  return new;
end $$;
create trigger payments_guard before insert on payments for each row execute function guard_payment();
