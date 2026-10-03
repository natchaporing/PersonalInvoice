-- Every paid subscription gets a receipt/tax invoice (ใบเสร็จรับเงิน/ใบกำกับภาษี) from Tra's operator.
-- It is an ordinary issued document in the operator's own account, so it takes the operator's normal RTX numbering,
-- shows up in their documents and their monthly VAT report, and can be checked on /verify. The subscriber reads it
-- through subscription_receipt(); they never see anything else in the operator's account.

-- Which account sells Tra. No seller set = no receipts issued (payments still work).
alter table private.billing_config add column seller_owner_id uuid references auth.users on delete set null;

alter table billing_charges add column receipt_document_id uuid references documents on delete set null;

-- A tax invoice needs the buyer's name, address and tax ID (Revenue Code s.86/4), so checkout needs them first.
create or replace function public.start_checkout(p_plan text, p_method text) returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if plan_price(p_plan) is null then raise exception 'unknown plan'; end if;
  if not exists (select 1 from business_profiles where owner_id = auth.uid()
                 and coalesce(name_th, '') <> '' and coalesce(address_th, '') <> '' and coalesce(tax_id, '') <> '') then
    raise exception 'complete your business profile before paying: your tax invoice needs your name, address and tax ID';
  end if;
  insert into billing_charges (owner_id, plan, amount, method)
    values (auth.uid(), p_plan, plan_price(p_plan), p_method) returning id into cid;
  return cid;
end $$;

-- Issues the receipt/tax invoice for a paid charge in the seller's account and returns its id. Never fails the
-- payment: if anything is missing it records why in the seller's audit log and returns null.
create function public.issue_subscription_receipt(p_charge uuid) returns uuid language plpgsql security definer set search_path = public as $$
declare
  c billing_charges%rowtype; seller uuid; sp business_profiles%rowtype; bp business_profiles%rowtype;
  cust uuid; doc uuid; signer signatories%rowtype; vat int; net int; yr int; n int; num text; issued date;
  period_th text; period_en text;
  th_date constant text := 'DD/MM/';
begin
  select * into c from billing_charges where id = p_charge;
  if not found or c.status <> 'paid' or c.receipt_document_id is not null then return c.receipt_document_id; end if;
  select seller_owner_id into seller from private.billing_config where id = 1;
  if seller is null or seller = c.owner_id then return null; end if;

  begin
    select * into sp from business_profiles where owner_id = seller;
    if not found then raise exception 'the seller has no business profile'; end if;
    select * into bp from business_profiles where owner_id = c.owner_id;
    if not found or coalesce(bp.address_th, '') = '' then raise exception 'the buyer has no address on their business profile'; end if;

    -- The subscriber as a customer in the seller's book, matched on tax ID and branch.
    select id into cust from customers where owner_id = seller and tax_id = bp.tax_id and branch_code = bp.branch_code limit 1;
    if cust is null then
      insert into customers (owner_id, name_th, name_en, tax_id, branch_code, is_juristic, address_th, address_en, email, phone, postcode)
        values (seller, bp.name_th, bp.name_en, bp.tax_id, bp.branch_code, false, bp.address_th, bp.address_en, bp.email, bp.phone, bp.addr_postcode)
        returning id into cust;
    end if;

    vat := round(c.amount * 700.0 / 10700);
    net := c.amount - vat;
    issued := (coalesce(c.paid_at, now()) at time zone 'Asia/Bangkok')::date;
    period_th := to_char(c.period_start at time zone 'Asia/Bangkok', th_date) || (extract(year from c.period_start at time zone 'Asia/Bangkok')::int + 543)
      || ' – ' || to_char(c.period_end at time zone 'Asia/Bangkok', th_date) || (extract(year from c.period_end at time zone 'Asia/Bangkok')::int + 543);
    period_en := to_char(c.period_start at time zone 'Asia/Bangkok', 'DD Mon YYYY') || ' – ' || to_char(c.period_end at time zone 'Asia/Bangkok', 'DD Mon YYYY');
    select * into signer from signatories where owner_id = seller order by created_at limit 1;

    insert into documents (owner_id, doc_type, status, customer_id, issue_date, lang, prices_include_vat, vat_bps,
                           subtotal, taxable, vat, total, net_receivable, notes, signer_id)
      values (seller, 'receipt_tax_invoice', 'draft', cust, issued, 'bilingual', false, 700,
              net, net, vat, c.amount, c.amount,
              'ชำระออนไลน์ · Paid online (' || case c.method when 'promptpay' then 'PromptPay' else 'card' end
                || coalesce(', ref ' || c.provider_ref, '') || ')',
              signer.id)
      returning id into doc;
    insert into document_lines (document_id, owner_id, position, description_th, description_en, qty_milli, unit, unit_price, amount, discount, vat_bps)
      values (doc, seller, 0,
              'ค่าบริการ Tra Pro ' || case c.plan when 'pro_year' then 'รายปี' else 'รายเดือน' end || ' ช่วง ' || period_th,
              'Tra Pro subscription, ' || case c.plan when 'pro_year' then 'yearly' else 'monthly' end || ', ' || period_en,
              1000, case c.plan when 'pro_year' then 'ปี · year' else 'เดือน · month' end, net, net, 0, 700);

    -- Number it exactly as issue_document() does: gap-free per type and year, in the same transaction.
    yr := extract(year from issued)::int;
    insert into document_sequences (owner_id, doc_type, year, last_number) values (seller, 'receipt_tax_invoice', yr, 1)
      on conflict (owner_id, doc_type, year) do update set last_number = document_sequences.last_number + 1
      returning last_number into n;
    num := 'RTX' || yr || '-' || lpad(n::text, 4, '0');

    update documents set status = 'issued', number = num,
      seller_snapshot = jsonb_build_object('name_th', sp.name_th, 'name_en', sp.name_en, 'address_th', sp.address_th, 'address_en', sp.address_en,
        'tax_id', sp.tax_id, 'branch_code', sp.branch_code, 'phone', sp.phone, 'email', sp.email),
      customer_snapshot = jsonb_build_object('name_th', bp.name_th, 'name_en', bp.name_en, 'address_th', bp.address_th, 'address_en', bp.address_en,
        'tax_id', bp.tax_id, 'branch_code', bp.branch_code, 'is_juristic', false),
      signers_snapshot = case when signer.id is null then null else jsonb_build_object('signer', jsonb_build_object(
        'name_th', signer.name_th, 'name_en', signer.name_en, 'title_th', signer.title_th, 'title_en', signer.title_en,
        'signature_image', signer.signature_image)) end,
      verify_code = substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)
      where id = doc;
    insert into audit_log (owner_id, document_id, action, detail)
      values (seller, doc, 'issued', jsonb_build_object('number', num, 'subscription_charge', c.id));
    update billing_charges set receipt_document_id = doc where id = c.id;
    return doc;
  exception when others then
    insert into audit_log (owner_id, action, detail)
      values (seller, 'subscription_receipt_failed', jsonb_build_object('charge', c.id, 'error', sqlerrm));
    return null;
  end;
end $$;

-- Payments issue the receipt as part of the same transaction.
create or replace function public.apply_paid_charge(p_charge uuid, p_ref text) returns timestamptz language plpgsql security definer set search_path = public as $$
declare c billing_charges%rowtype; s subscriptions%rowtype; starts timestamptz; ends timestamptz;
begin
  select * into c from billing_charges where id = p_charge for update;
  if not found then raise exception 'charge not found'; end if;
  if c.status <> 'pending' then raise exception 'charge is already %', c.status; end if;
  select * into s from subscriptions where owner_id = c.owner_id for update;
  if not found then
    insert into subscriptions (owner_id, trial_ends_at) values (c.owner_id, now()) returning * into s;
  end if;
  starts := greatest(now(), s.trial_ends_at, coalesce(s.current_period_end, now()));
  ends := starts + case c.plan when 'pro_year' then interval '1 year' else interval '1 month' end;
  update billing_charges set status = 'paid', paid_at = now(), provider_ref = p_ref, period_start = starts, period_end = ends where id = c.id;
  update subscriptions set plan = case when s.plan = 'comp' then 'comp' else c.plan end, current_period_end = ends, updated_at = now()
    where owner_id = c.owner_id;
  perform issue_subscription_receipt(c.id);
  return ends;
end $$;

-- The subscriber's view of their receipt: the document and its lines, only for their own charge.
create function public.subscription_receipt(p_charge uuid) returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('doc', to_jsonb(d), 'lines', coalesce((select jsonb_agg(to_jsonb(l) order by l.position) from document_lines l where l.document_id = d.id), '[]'::jsonb))
  from billing_charges c join documents d on d.id = c.receipt_document_id
  where c.id = p_charge and c.owner_id = auth.uid()
$$;

revoke execute on function public.issue_subscription_receipt(uuid) from public, anon, authenticated;
revoke execute on function public.subscription_receipt(uuid) from public, anon;
grant execute on function public.subscription_receipt(uuid) to authenticated;
