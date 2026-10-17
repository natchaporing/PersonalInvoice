-- A private reminder note on each customer (LINE or Facebook contact, billing exceptions...). Never printed.
alter table customers add column remark text check (remark is null or length(remark) <= 2000);
