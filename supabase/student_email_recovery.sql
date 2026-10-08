-- Apply AFTER schema.sql (new project), or student_username_changes.sql and
-- admin_profile_edit_notifications.sql (existing project). Deploy Edge Function next.
begin;

alter table public.admin_notifications
  drop constraint if exists admin_notifications_type_check;
alter table public.admin_notifications
  add constraint admin_notifications_type_check check (type in (
    'student_registration', 'student_profile_updated', 'admin_contact_requested',
    'student_username_changed', 'student_password_changed'
  ));

-- Intentionally NO authenticated/text-only recovery RPC. Only trusted backend
-- may supply target_user_id, derived from server-side verifyOtp(type='recovery').
create or replace function public.recover_student_username(target_user_id uuid, requested_username text)
returns table (username text, username_changed_at timestamptz, next_change_at timestamptz)
language plpgsql
security definer set search_path = ''
as $$
declare
  normalized_username text := lower(trim(coalesce(requested_username, '')));
  current_profile public.profiles%rowtype;
  previous_flag text := current_setting('app.allow_username_change', true);
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Verified server request required' using errcode = '42501';
  end if;

  select * into current_profile from public.profiles
  where id = target_user_id for update;
  if current_profile.id is null or current_profile.role <> 'student' then
    raise exception 'Student account required';
  end if;
  if normalized_username !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then
    raise exception 'Username must be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens';
  end if;
  if normalized_username = current_profile.username then
    raise exception 'Choose a different username';
  end if;

  -- Email proof bypasses existing cooldown; next ordinary change waits 30 days.
  perform set_config('app.allow_username_change', 'true', true);
  update public.profiles p
  set username = normalized_username, username_changed_at = now()
  where p.id = target_user_id
  returning p.username, p.username_changed_at, p.username_changed_at + interval '30 days'
  into username, username_changed_at, next_change_at;
  perform set_config('app.allow_username_change', coalesce(previous_flag, ''), true);

  insert into public.admin_notifications (type, student_id, changed_fields)
  values ('student_username_changed', target_user_id, array['username']);
  return next;
exception when unique_violation then
  raise exception 'That username is already in use';
end;
$$;

revoke all on function public.recover_student_username(uuid, text) from public, anon, authenticated;
grant execute on function public.recover_student_username(uuid, text) to service_role;

-- Auth Admin password changes and notification insertion share one DB transaction.
-- Also covers student settings/admin password resets, not only email recovery.
-- Never copy password hashes (or plaintext) into public schema or notifications.
create or replace function public.notify_admins_of_student_password_change()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    insert into public.admin_notifications (type, student_id, changed_fields)
    select 'student_password_changed', p.id, array['password']
    from public.profiles p where p.id = new.id and p.role = 'student';
  end if;
  return new;
end;
$$;
revoke all on function public.notify_admins_of_student_password_change() from public, anon, authenticated;

drop trigger if exists auth_users_notify_student_password_change on auth.users;
create trigger auth_users_notify_student_password_change
  after update of encrypted_password on auth.users
  for each row execute function public.notify_admins_of_student_password_change();

commit;
