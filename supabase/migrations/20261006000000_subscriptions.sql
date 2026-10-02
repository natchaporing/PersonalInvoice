-- Subscriptions: every new account starts a 15-day trial of Pro. After that, issuing documents needs a paid
-- period. Existing documents always stay readable and downloadable (tax documents must be kept for 5 years).
--
-- Writes to subscriptions and paid charges go only through the functions below, never straight from the app:
-- a signed-in user can start a checkout but cannot mark it paid. A real payment provider will confirm charges
-- from its webhook with the service role (apply_paid_charge); until then a test mode, switched on only by a
-- secret stored in the private schema, lets the app simulate a successful payment.

create table subscriptions (
  owner_id uuid primary key references auth.users on delete cascade,
  plan text check (plan in ('comp', 'pro_year', 'pro_month')),   -- null = trial only
  trial_ends_at timestamptz not null default now() + interval '15 days',
  current_period_end timestamptz,                                  -- end of the last paid period
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table subscriptions enable row level security;
create policy subscriptions_read on subscriptions for select to authenticated using (owner_id = (select auth.uid()));

create table billing_charges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  plan text not null check (plan in ('pro_year', 'pro_month')),
  amount int not null check (amount > 0),                          -- satang, VAT included
  method text not null check (method in ('promptpay', 'card')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired')),
  provider text not null default 'test',
  provider_ref text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index on billing_charges (owner_id, created_at desc);
alter table billing_charges enable row level security;
create policy billing_charges_read on billing_charges for select to authenticated using (owner_id = (select auth.uid()));

-- Test-mode switch, invisible to the API. No row (the default) = test payments refused.
create schema if not exists private;
create table private.billing_config (id int primary key default 1 check (id = 1), test_secret text);
revoke all on schema private from anon, authenticated;

-- New accounts get the trial. Accounts that existed before billing are complimentary.
create function public.start_trial() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into subscriptions (owner_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created_trial after insert on auth.users for each row execute function public.start_trial();

insert into subscriptions (owner_id, plan, trial_ends_at) select id, 'comp', now() from auth.users on conflict do nothing;

create function public.has_entitlement(p_owner uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from subscriptions s
    where s.owner_id = p_owner
      and (s.plan = 'comp' or now() < s.trial_ends_at or (s.current_period_end is not null and now() < s.current_period_end))
  )
$$;

-- Issuing (draft -> issued/paid) needs an active trial or paid period. Voiding and editing drafts do not.
create function public.guard_entitlement() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'draft' and new.status in ('issued', 'paid') and not has_entitlement(new.owner_id) then
    raise exception 'Your free trial has ended. Subscribe to Tra Pro to issue documents.';
  end if;
  return new;
end $$;
create trigger documents_entitlement before update of status on documents for each row execute function public.guard_entitlement();

create function public.plan_price(p_plan text) returns int language sql immutable as $$
  select case p_plan when 'pro_year' then 249000 when 'pro_month' then 24900 end
$$;

-- Starts a checkout for the signed-in user; the price comes from the database, never from the browser.
create function public.start_checkout(p_plan text, p_method text) returns uuid language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if plan_price(p_plan) is null then raise exception 'unknown plan'; end if;
  insert into billing_charges (owner_id, plan, amount, method)
    values (auth.uid(), p_plan, plan_price(p_plan), p_method) returning id into cid;
  return cid;
end $$;

-- Marks a charge paid and extends the subscription. A paid period starts when the trial or the current period
-- ends, so paying early never loses days. Called by the provider webhook (service role) or test mode below.
create function public.apply_paid_charge(p_charge uuid, p_ref text) returns timestamptz language plpgsql security definer set search_path = public as $$
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
  return ends;
end $$;

-- Test mode: the app proves it holds the secret stored in private.billing_config.
create function public.complete_test_charge(p_charge uuid, p_secret text) returns timestamptz language plpgsql security definer set search_path = public as $$
begin
  if p_secret is null or not exists (select 1 from private.billing_config where test_secret = p_secret) then
    raise exception 'test payments are switched off';
  end if;
  if not exists (select 1 from billing_charges where id = p_charge and owner_id = auth.uid()) then
    raise exception 'charge not found';
  end if;
  return apply_paid_charge(p_charge, 'test-' || p_charge::text);
end $$;

revoke execute on function public.start_trial() from public, anon, authenticated;
revoke execute on function public.has_entitlement(uuid) from public, anon, authenticated;
revoke execute on function public.guard_entitlement() from public, anon, authenticated;
revoke execute on function public.apply_paid_charge(uuid, text) from public, anon, authenticated;
revoke execute on function public.start_checkout(text, text) from public, anon;
revoke execute on function public.complete_test_charge(uuid, text) from public, anon;
grant execute on function public.start_checkout(text, text) to authenticated;
grant execute on function public.complete_test_charge(uuid, text) to authenticated;
