-- Allow administrators to reset a student's username for account recovery.

create or replace function public.update_student_username(target_student_id uuid, requested_username text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  normalized_username text := lower(trim(coalesce(requested_username, '')));
begin
  if not public.is_admin() then
    raise exception 'Only administrators can update student usernames';
  end if;

  if normalized_username !~ '^[a-z0-9][a-z0-9._-]{2,29}$' then
    raise exception 'Username must be 3-30 characters and use only letters, numbers, dots, underscores, or hyphens';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = target_student_id and role = 'student'
  ) then
    raise exception 'Student account not found';
  end if;

  update public.profiles
  set username = normalized_username
  where id = target_student_id and role = 'student';

  return normalized_username;
exception
  when unique_violation then
    raise exception 'That username is already in use';
end;
$$;

revoke all on function public.update_student_username(uuid, text) from public;
grant execute on function public.update_student_username(uuid, text) to authenticated;
