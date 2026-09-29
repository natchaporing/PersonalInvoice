-- Replace the PromptPay QR with bank-transfer details printed on payable documents.
alter table business_profiles
  drop column if exists promptpay_id,
  add column bank_name_th text,
  add column bank_name_en text,
  add column bank_branch_th text,
  add column bank_branch_en text,
  add column bank_account_name text,
  add column bank_account_name_en text,
  add column bank_account_number text check (bank_account_number is null or bank_account_number ~ '^[0-9]{6,20}$'),
  add column bank_account_type text check (bank_account_type is null or bank_account_type in ('savings', 'current'));
