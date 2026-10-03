-- Plan prices are now quoted before VAT (฿2,490 a year, ฿249 a month) with 7% VAT added at checkout.
-- plan_price() returns what is actually charged, VAT included. Charges already made keep their amounts.
create or replace function public.plan_price(p_plan text) returns int language sql immutable as $$
  select case p_plan when 'pro_year' then 266430 when 'pro_month' then 26643 end
$$;
comment on column billing_charges.amount is 'satang charged, 7% VAT included';
