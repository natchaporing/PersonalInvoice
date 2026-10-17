-- Service agreements (สัญญาจ้าง) made from an issued quotation. Editable while draft; once sent for signing or
-- signed the text is frozen. The client can sign on paper, or online through a private link (sign_token).
create table contracts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  quotation_id uuid not null references documents on delete restrict,
  number text not null,
  status text not null default 'draft' check (status in ('draft', 'sent', 'signed', 'void')),
  lang doc_lang not null default 'bilingual',
  contract_date date not null default current_date,
  place text,
  start_date date,
  end_date date,
  clauses jsonb not null default '[]',
  facts jsonb not null,            -- quotation number/date, lines, amounts and payment schedule, frozen at creation
  seller_snapshot jsonb not null,
  client_snapshot jsonb not null,
  owner_signer jsonb,              -- the contractor's signatory (name, title, signature image), frozen when sent
  content_hash text,               -- sha256 of the frozen text, set when sent; printed on the signed copy
  sign_token text unique,
  sent_at timestamptz,
  signed_via text check (signed_via in ('online', 'paper')),
  client_signed_at timestamptz,
  client_signer_name text,
  client_signature text check (client_signature is null or (length(client_signature) < 400000 and client_signature ~ '^data:image/png;base64,')),
  client_sign_ip text,
  client_sign_ua text,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, number)
);
create index on contracts (owner_id, created_at desc);
create index on contracts (quotation_id);
alter table contracts enable row level security;
create policy contracts_owner on contracts for all to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));

-- Once out of draft, the agreed text never changes; only the status and signing record move forward.
create function guard_contract() returns trigger language plpgsql as $$
declare frozen text[] := array['quotation_id','number','lang','contract_date','place','start_date','end_date','clauses','facts',
  'seller_snapshot','client_snapshot','owner_signer','content_hash','sign_token','sent_at'];
begin
  if tg_op = 'DELETE' then
    if old.status <> 'draft' then raise exception 'only draft contracts can be deleted; void it instead'; end if;
    return old;
  end if;
  if old.status = 'signed' and new.status not in ('signed', 'void') then raise exception 'a signed contract can only be voided'; end if;
  if old.status = 'void' then raise exception 'a void contract cannot change'; end if;
  -- A sent contract may go back to draft for changes (its signing link stops working); otherwise the text is fixed.
  if old.status = 'sent' and new.status = 'draft' then
    if new.sign_token is not null or new.content_hash is not null then raise exception 'reopening a contract clears its signing link'; end if;
  elsif old.status <> 'draft' then
    if (select jsonb_object_agg(k, to_jsonb(new) -> k) from unnest(frozen) k) is distinct from
       (select jsonb_object_agg(k, to_jsonb(old) -> k) from unnest(frozen) k) then
      raise exception 'the contract text is frozen once it has been sent or signed';
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger contracts_guard before update or delete on contracts for each row execute function guard_contract();

-- The client's view through the signing link: only a sent or signed contract, never the signing IP or user agent.
create function public.contract_for_signing(p_token text) returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(c) - 'client_sign_ip' - 'client_sign_ua' - 'owner_id'
  from contracts c where c.sign_token = p_token and length(p_token) >= 32 and c.status in ('sent', 'signed');
$$;

-- The client signs online. The hash they saw must be the one frozen when the contract was sent.
create function public.sign_contract(p_token text, p_name text, p_signature text, p_hash text, p_ip text, p_ua text)
returns timestamptz language plpgsql security definer set search_path = public as $$
declare c contracts%rowtype;
begin
  select * into c from contracts where sign_token = p_token and length(p_token) >= 32 for update;
  if not found then raise exception 'contract not found'; end if;
  if c.status = 'signed' then raise exception 'this contract has already been signed'; end if;
  if c.status <> 'sent' then raise exception 'this contract is not open for signing'; end if;
  if c.content_hash is distinct from p_hash then raise exception 'the contract changed; reload the page and read it again'; end if;
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'type your full name'; end if;
  update contracts set status = 'signed', signed_via = 'online', client_signed_at = now(), client_signer_name = trim(p_name),
    client_signature = p_signature, client_sign_ip = left(p_ip, 100), client_sign_ua = left(p_ua, 300)
    where id = c.id;
  insert into audit_log (owner_id, action, detail) values (c.owner_id, 'contract_signed', jsonb_build_object('contract', c.id, 'number', c.number, 'via', 'online'));
  return now();
end $$;

revoke execute on function public.contract_for_signing(text) from public;
revoke execute on function public.sign_contract(text, text, text, text, text, text) from public;
grant execute on function public.contract_for_signing(text) to anon, authenticated;
grant execute on function public.sign_contract(text, text, text, text, text, text) to anon, authenticated;
