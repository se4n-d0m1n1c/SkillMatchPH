-- Repair the trigger that creates a public profile when a user signs up.
-- Run this in Supabase Dashboard → SQL Editor.
-- If `public.profiles` does not exist, run `supabase/schema.sql` first.

do $$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'public.profiles is missing. Run supabase/schema.sql before this repair.';
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  provided_username text := nullif(lower(trim(new.raw_user_meta_data ->> 'username')), '');
  provided_student_no text := nullif(trim(new.raw_user_meta_data ->> 'student_no'), '');
begin
  if provided_username is not null and exists (
    select 1 from public.profiles where lower(username) = provided_username
  ) then
    raise exception 'That username is unavailable. Choose another username.';
  end if;

  if provided_student_no is not null and exists (
    select 1 from public.profiles where lower(student_no) = lower(provided_student_no)
  ) then
    raise exception 'That student number is already in use.';
  end if;

  insert into public.profiles (
    id, username, first_name, last_name, student_no, grade_level, shs_track, shs_strand, role, status
  ) values (
    new.id,
    provided_username,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(provided_student_no, new.id::text),
    coalesce(nullif(new.raw_user_meta_data ->> 'grade_level', '')::smallint, 11),
    coalesce(new.raw_user_meta_data ->> 'shs_track', 'Academic'),
    coalesce(new.raw_user_meta_data ->> 'shs_strand', 'STEM'),
    'student',
    'pending'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
