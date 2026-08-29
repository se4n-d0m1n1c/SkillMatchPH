-- Backward-compatible usernames for Supabase Auth accounts.
-- Existing users may continue signing in with email; new users choose a username.
-- Deploy supabase/functions/username-login after running this migration.

alter table public.profiles
  add column if not exists username text;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

alter table public.profiles
  drop constraint if exists profiles_username_format_check;
alter table public.profiles
  add constraint profiles_username_format_check
  check (username is null or username ~ '^[a-z0-9][a-z0-9._-]{2,29}$');

-- This companion Auth trigger keeps the migration compatible even if an older
-- handle_new_user definition is still installed. Trigger names execute in name
-- order, so it runs after on_auth_user_created has inserted the profile row.
create or replace function public.sync_new_user_username()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_username text := nullif(lower(trim(new.raw_user_meta_data ->> 'username')), '');
begin
  if requested_username is not null then
    update public.profiles
    set username = requested_username
    where id = new.id and username is null;
  end if;
  return new;
end;
$$;

drop trigger if exists zz_sync_new_user_username on auth.users;
create trigger zz_sync_new_user_username
  after insert on auth.users
  for each row execute function public.sync_new_user_username();

-- Preserve existing accounts without inventing credentials users do not know.
-- They retain email login and may be assigned usernames later.

create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    new.id := old.id;
    new.role := old.role;
    new.status := old.status;
    new.username := old.username;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;
