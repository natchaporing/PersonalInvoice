-- 1. How the original of a tax document reached the buyer. A PDF sent as an ordinary email attachment is only a
--    copy; the original is a paper print, or a PDF/A-3 sent by e-Tax Invoice by Email (CC the ETDA time-stamp
--    service). Recording it is part of the seller's own records; it does not change the document.
alter table documents
  add column delivered_via text check (delivered_via in ('paper', 'etax_email')),
  add column delivered_at timestamptz;

create or replace function guard_issued_document() returns trigger language plpgsql as $$
declare
  free text[] := array['status','pdf_path','pdf_sha256','signed_at','voided_at','signer_id','approver_id',
    'etax_status','etax_xml_path','etax_pdf_path','etax_pdf_sha256','etax_generated_at','etax_test_cert','etax_error',
    'delivered_via','delivered_at'];
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

-- 2. Access log. The Computer Crime Act requires service providers to keep traffic data for at least 90 days.
--    Users cannot read it; only the operator can, for an authority's lawful request or a security investigation.
create table access_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  user_id uuid,
  ip text,
  method text not null,
  path text not null,
  user_agent text
);
create index on access_log (at);
create index on access_log (user_id, at);
alter table access_log enable row level security;  -- no policies: nobody reads or writes it through the API

-- The app records each signed-in request through this function; the user id comes from the session, not the caller.
create function public.log_access(p_ip text, p_method text, p_path text, p_user_agent text) returns void
language sql security definer set search_path = public as $$
  insert into access_log (user_id, ip, method, path, user_agent)
  values (auth.uid(), left(p_ip, 100), left(p_method, 10), left(p_path, 500), left(p_user_agent, 300));
$$;
revoke execute on function public.log_access(text, text, text, text) from public, anon;
grant execute on function public.log_access(text, text, text, text) to authenticated;

-- Kept for one year (more than the 90 days required), then removed: personal data is not kept longer than needed.
create function public.prune_access_log() returns void language sql security definer set search_path = public as $$
  delete from access_log where at < now() - interval '1 year';
$$;
revoke execute on function public.prune_access_log() from public, anon, authenticated;

-- Monthly clean-up where pg_cron is available (it is on hosted Supabase; local stacks may not have it).
do $$ begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('prune-access-log', '17 3 1 * *', 'select public.prune_access_log()');
  end if;
exception when others then
  raise notice 'pg_cron not scheduled: %', sqlerrm;
end $$;
