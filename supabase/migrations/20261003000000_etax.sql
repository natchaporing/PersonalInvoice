-- Phase 2: e-Tax invoice package (ETDA standard ขมธอ. 3-2560 v2.0).
-- The seller address must carry structured codes (province / district / sub-district / postcode),
-- and each issued tax document can get an e-Tax package: XML + signed PDF/A-3.

alter table business_profiles
  add column addr_building_number text,
  add column addr_street text,
  add column addr_province_code text check (addr_province_code ~ '^\d{2}$'),
  add column addr_district_code text check (addr_district_code ~ '^\d{4}$'),
  add column addr_subdistrict_code text check (addr_subdistrict_code ~ '^\d{6}$'),
  add column addr_postcode text check (addr_postcode ~ '^\d{5}$');

-- Buyer address goes into the XML as free text, which still needs a 5-digit postcode.
alter table customers add column postcode text check (postcode ~ '^\d{5}$');

alter table documents
  add column etax_status text not null default 'none' check (etax_status in ('none', 'generated')),
  add column etax_xml_path text,
  add column etax_pdf_path text,
  add column etax_pdf_sha256 text,
  add column etax_generated_at timestamptz,
  -- true when the package was signed with the self-signed test certificate instead of a CA-issued one.
  add column etax_test_cert boolean,
  add column etax_error text;

create or replace function guard_issued_document() returns trigger language plpgsql as $$
declare
  free text[] := array['status','pdf_path','pdf_sha256','signed_at','voided_at','signer_id','approver_id',
    'etax_status','etax_xml_path','etax_pdf_path','etax_pdf_sha256','etax_generated_at','etax_test_cert','etax_error'];
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'issued documents cannot be deleted; void or credit-note them'; end if;
    return old;
  end if;
  if old.status <> 'draft' then
    if (to_jsonb(new) - free) is distinct from (to_jsonb(old) - free) then
      raise exception 'issued documents are immutable';
    end if;
  end if;
  return new;
end $$;

-- The documents bucket also holds the e-Tax XML files.
update storage.buckets
   set allowed_mime_types = array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/xml', 'application/xml']
 where id = 'documents';
