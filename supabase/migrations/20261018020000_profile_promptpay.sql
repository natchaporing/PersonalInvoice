-- PromptPay for the seller: printed as a QR for the amount due on invoices, tax invoices, debit notes and quotations.
alter table public.business_profiles
  add column promptpay_id text check (promptpay_id is null or promptpay_id ~ '^(\d{10}|\d{13}|\d{15})$');
