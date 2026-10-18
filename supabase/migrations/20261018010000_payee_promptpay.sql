-- PromptPay for commission payees: a phone number (10 digits), national/tax ID (13) or e-wallet ID (15).
alter table public.commission_payees
  add column promptpay_id text check (promptpay_id is null or promptpay_id ~ '^(\d{10}|\d{13}|\d{15})$');
