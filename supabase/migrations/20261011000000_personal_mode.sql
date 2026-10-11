-- Personal mode: Tra serves its owner only. New accounts are refused at the database, whatever calls the auth API,
-- unless private.app_config.signups_open is switched on (for local test runs, or to reopen sign-up later).
create table private.app_config (id int primary key default 1 check (id = 1), signups_open boolean not null default false);
insert into private.app_config default values;

create function public.guard_signup() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not coalesce((select signups_open from private.app_config where id = 1), false) then
    raise exception 'sign-up is closed';
  end if;
  return new;
end $$;
revoke execute on function public.guard_signup() from public, anon, authenticated;
create trigger before_auth_user_created_guard before insert on auth.users for each row execute function public.guard_signup();
