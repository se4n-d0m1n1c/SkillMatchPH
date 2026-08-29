-- Password-verified student username changes with a 30-day cooldown.
-- Deploy functions/change-student-username after running this migration.

alter table public.profiles
  add column if not exists username_changed_at timestamptz;

alter table public.admin_notifications
  drop constraint if exists admin_notifications_type_check;
alter table public.admin_notifications
  add constraint admin_notifications_type_check
  check (type in (
    'student_registration',
    'student_profile_updated',
    'admin_contact_requested',
    'student_username_changed'
  ));

-- Generic profile updates cannot rename a username. The narrow RPC below sets a
-- transaction-local flag after the Edge Function has verified the password.
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
    if current_setting('app.allow_username_change', true) is distinct from 'true' then
      new.username := old.username;
      new.username_changed_at := old.username_changed_at;
    end if;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create or replace function public.change_student_username_after_verification(target_user_id uuid, requested_username text)
returns table (username text, username_changed_at timestamptz, next_change_at timestamptz)
language plpgsql
security definer set search_path = public
as $$
declare
  normalized_username text := lower(trim(coalesce(requested_username, '')));
  current_profile public.profiles%rowtype;
begin
  select * into current_profile
  from public.profiles
  where id = target_user_id
  for update;

  if current_profile.id is null or current_profile.role <> 'student' then
    raise exception 'Student account required';
  end if;

  if auth.role() <> 'service_role' then
    raise exception 'Verified server request required';
  end if;

  if normalized_username !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then
    raise exception 'Username must be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens';
  end if;

  if normalized_username = current_profile.username then
    raise exception 'Choose a different username';
  end if;

  if current_profile.username_changed_at is not null
     and current_profile.username_changed_at + interval '30 days' > now() then
    raise exception 'Username can be changed again on %',
      to_char(current_profile.username_changed_at + interval '30 days', 'Mon DD, YYYY');
  end if;

  perform set_config('app.allow_username_change', 'true', true);

  update public.profiles
  set username = normalized_username,
      username_changed_at = now()
  where id = target_user_id
  returning profiles.username, profiles.username_changed_at,
    profiles.username_changed_at + interval '30 days'
  into username, username_changed_at, next_change_at;

  insert into public.admin_notifications (type, student_id, changed_fields)
  values ('student_username_changed', target_user_id, array['username']);

  return next;
exception
  when unique_violation then
    raise exception 'That username is already in use';
end;
$$;

revoke all on function public.change_student_username_after_verification(uuid, text) from public;
grant execute on function public.change_student_username_after_verification(uuid, text) to service_role;
