-- Give the service roles the stack password (the supabase/postgres image creates them without one).
\set pgpass `echo "$POSTGRES_PASSWORD"`
alter user authenticator with password :'pgpass';
alter user supabase_auth_admin with password :'pgpass';
alter user supabase_storage_admin with password :'pgpass';
