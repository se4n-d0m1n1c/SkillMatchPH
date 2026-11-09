-- Apply AFTER student_email_recovery.sql, then deploy complete-account-recovery.
-- Adds email-verified recovery for administrator and student usernames.
begin;

-- Intentionally NO authenticated/text-only recovery RPC. Only trusted backend
-- may supply target_user_id, derived from server-side verifyOtp(type='recovery').
create or replace function public.recover_account_username(target_user_id uuid, requested_username text)
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
  if current_profile.id is null or current_profile.role not in ('student', 'admin') then
    raise exception 'Student or administrator account required';
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

  -- These notifications and their UI describe students, not administrator accounts.
  if current_profile.role = 'student' then
    insert into public.admin_notifications (type, student_id, changed_fields)
    values ('student_username_changed', target_user_id, array['username']);
  end if;
  return next;
exception when unique_violation then
  raise exception 'That username is already in use';
end;
$$;

revoke all on function public.recover_account_username(uuid, text) from public, anon, authenticated;
grant execute on function public.recover_account_username(uuid, text) to service_role;

commit;
