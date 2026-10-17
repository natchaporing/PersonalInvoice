-- Missing buyer tax ID or address on a tax document is now a warning the issuer can confirm past, not a hard stop.
-- A full tax invoice must show the buyer's name and address; the tax ID is needed when the buyer is VAT-registered,
-- so some legitimate invoices (to individuals, for instance) have none. The app asks first and passes
-- p_allow_incomplete_buyer only after the person confirms.
-- Added next to the 4-argument version (left in place: dropping it hung on the hosted database). No defaults, so the
-- two never clash; the app always passes all five arguments.
create or replace function issue_document(p_document_id uuid, p_seller jsonb, p_customer jsonb, p_signers jsonb, p_allow_incomplete_buyer boolean)
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
  if d.doc_type in ('tax_invoice','receipt_tax_invoice','credit_note','debit_note') and not coalesce(p_allow_incomplete_buyer, false)
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
  insert into audit_log (owner_id, document_id, action, detail)
    values (d.owner_id, d.id, 'issued', jsonb_build_object('number', num, 'incomplete_buyer', coalesce(p_allow_incomplete_buyer, false)));
  return num;
end $$;
