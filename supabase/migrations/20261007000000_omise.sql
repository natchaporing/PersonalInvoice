-- Real payments through Opn Payments (Omise). The app creates the provider charge, then settles our charge only
-- after fetching the provider's charge itself (from the webhook or a status check), never from what a browser or
-- webhook body claims. Settling needs a server secret stored in the private schema, the same pattern as test mode,
-- so the app does not need the Supabase service-role key.

alter table private.billing_config add column provider_secret text;

-- Links a checkout to the provider charge just created for it. Only the owner, only once, only while pending.
create function public.attach_provider_charge(p_charge uuid, p_provider text, p_ref text) returns void language plpgsql security definer set search_path = public as $$
begin
  update billing_charges set provider = p_provider, provider_ref = p_ref
    where id = p_charge and owner_id = auth.uid() and status = 'pending' and provider_ref is null;
  if not found then raise exception 'charge not found'; end if;
end $$;

-- Records the provider's verdict on a charge. p_status is 'paid', 'failed', 'expired' or 'pending'. Idempotent: the
-- webhook and the checkout page's status check can both report the same payment.
create function public.settle_provider_charge(p_charge uuid, p_provider text, p_ref text, p_status text, p_amount int, p_secret text)
returns text language plpgsql security definer set search_path = public as $$
declare c billing_charges%rowtype;
begin
  if p_secret is null or not exists (select 1 from private.billing_config where provider_secret = p_secret) then
    raise exception 'provider payments are switched off';
  end if;
  select * into c from billing_charges where id = p_charge for update;
  if not found then raise exception 'charge not found'; end if;
  if c.provider_ref is not null and c.provider_ref <> p_ref then raise exception 'charge reference mismatch'; end if;
  if c.status <> 'pending' then return c.status; end if;
  -- The webhook can arrive before the checkout attached the reference (an instant card payment).
  update billing_charges set provider = p_provider, provider_ref = p_ref where id = c.id;
  if p_status = 'paid' then
    if p_amount is distinct from c.amount then raise exception 'amount mismatch'; end if;
    perform apply_paid_charge(c.id, p_ref);
  elsif p_status in ('failed', 'expired') then
    update billing_charges set status = p_status where id = c.id;
  else
    return 'pending';
  end if;
  return p_status;
end $$;

revoke execute on function public.attach_provider_charge(uuid, text, text) from public, anon;
revoke execute on function public.settle_provider_charge(uuid, text, text, text, int, text) from public;
grant execute on function public.attach_provider_charge(uuid, text, text) to authenticated;
-- anon: the webhook has no signed-in user. The secret is what authorises the call.
grant execute on function public.settle_provider_charge(uuid, text, text, text, int, text) to anon, authenticated;
