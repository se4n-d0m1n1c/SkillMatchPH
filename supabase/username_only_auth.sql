-- Switch to username-only login and assign usernames to every existing account.
-- Students use their normalized student number. Administrators use admin_<id>.
-- Existing collisions receive a stable numeric suffix.

alter table public.profiles
  add column if not exists username text;

alter table public.profiles
  drop constraint if exists profiles_username_format_check;
alter table public.profiles
  add constraint profiles_username_format_check
  check (username is null or username ~ '^[a-z0-9][a-z0-9._-]{2,29}$');

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

-- The normal profile-protection trigger deliberately prevents unauthenticated
-- username changes. The SQL Editor has no auth.uid(), so temporarily disable
-- that trigger for this controlled migration backfill.
do $$
begin
  if exists (
    select 1 from pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and tgname = 'profiles_protect_system_fields'
      and not tgisinternal
  ) then
    alter table public.profiles disable trigger profiles_protect_system_fields;
  end if;
end;
$$;

do $$
declare
  account record;
  base_username text;
  candidate text;
  suffix integer;
begin
  for account in
    select id, role, student_no
    from public.profiles
    where username is null
    order by created_at, id
  loop
    if account.role = 'student' then
      base_username := lower(regexp_replace(coalesce(account.student_no, ''), '[^a-zA-Z0-9._-]+', '_', 'g'));
      base_username := trim(both '._-' from base_username);
      if length(base_username) < 3 then
        base_username := 'student_' || left(replace(account.id::text, '-', ''), 8);
      end if;
    else
      base_username := 'admin_' || left(replace(account.id::text, '-', ''), 8);
    end if;

    base_username := left(base_username, 30);
    candidate := base_username;
    suffix := 1;

    while exists (select 1 from public.profiles where lower(username) = lower(candidate)) loop
      suffix := suffix + 1;
      candidate := left(base_username, 30 - length(suffix::text) - 1) || '_' || suffix;
    end loop;

    update public.profiles set username = candidate where id = account.id;
  end loop;
end;
$$;

do $$
begin
  if exists (
    select 1 from pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and tgname = 'profiles_protect_system_fields'
      and not tgisinternal
  ) then
    alter table public.profiles enable trigger profiles_protect_system_fields;
  end if;
end;
$$;

-- Fail with a useful diagnostic instead of PostgreSQL's generic NOT NULL error.
do $$
declare
  remaining_count bigint;
begin
  select count(*) into remaining_count
  from public.profiles
  where username is null;

  if remaining_count > 0 then
    raise exception 'Username backfill failed for % profile(s)', remaining_count;
  end if;
end;
$$;

alter table public.profiles
  alter column username set not null;

create or replace function public.update_own_admin_username(requested_username text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  normalized_username text := lower(trim(coalesce(requested_username, '')));
begin
  if not public.is_admin() then
    raise exception 'Only administrators can update an administrator username';
  end if;

  if normalized_username !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then
    raise exception 'Username must be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens';
  end if;

  update public.profiles
  set username = normalized_username
  where id = auth.uid() and role = 'admin';

  return normalized_username;
exception
  when unique_violation then
    raise exception 'That username is already in use';
end;
$$;

revoke all on function public.update_own_admin_username(text) from public;
grant execute on function public.update_own_admin_username(text) to authenticated;
