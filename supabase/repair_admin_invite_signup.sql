-- Restore invite-aware signup handling after any older schema script replaced
-- public.handle_new_user(), and repair accounts created as students despite
-- providing a valid, unused administrator invitation.
-- Run once in the Supabase SQL Editor.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  submitted_invite text := upper(trim(coalesce(new.raw_user_meta_data ->> 'admin_invite_code', '')));
  matched_invite_id uuid;
  submitted_username text := nullif(lower(trim(new.raw_user_meta_data ->> 'username')), '');
begin
  if submitted_username is null then
    raise exception 'A username is required';
  end if;

  if exists (select 1 from public.profiles where lower(username) = submitted_username) then
    raise exception 'That username is unavailable. Choose another username.';
  end if;

  if submitted_invite <> '' then
    select invitation.id
    into matched_invite_id
    from public.admin_invites invitation
    where invitation.used_at is null
      and invitation.revoked_at is null
      and invitation.expires_at > now()
      and crypt(submitted_invite, invitation.code_hash) = invitation.code_hash
    for update skip locked
    limit 1;

    if matched_invite_id is null then
      raise exception 'This administrator invite is invalid, expired, or already used';
    end if;

    insert into public.profiles (
      id, username, first_name, last_name, student_no,
      grade_level, shs_track, shs_strand, role, status
    ) values (
      new.id,
      submitted_username,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''), 'Admin'),
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''), 'User'),
      'ADMIN-' || new.id::text,
      11,
      'Academic',
      'STEM',
      'admin',
      'approved'
    );

    update public.admin_invites
    set used_by = new.id, used_at = now()
    where id = matched_invite_id;
  else
    declare
      submitted_student_no text := nullif(trim(new.raw_user_meta_data ->> 'student_no'), '');
    begin
      if submitted_student_no is not null and exists (
        select 1 from public.profiles existing
        where lower(existing.student_no) = lower(submitted_student_no)
      ) then
        raise exception 'That student number is already in use.';
      end if;

      insert into public.profiles (
        id, username, first_name, last_name, student_no,
        grade_level, shs_track, shs_strand, role, status
      ) values (
        new.id,
        submitted_username,
        coalesce(new.raw_user_meta_data ->> 'first_name', ''),
        coalesce(new.raw_user_meta_data ->> 'last_name', ''),
        coalesce(submitted_student_no, new.id::text),
        coalesce(nullif(new.raw_user_meta_data ->> 'grade_level', '')::smallint, 11),
        coalesce(new.raw_user_meta_data ->> 'shs_track', 'Academic'),
        coalesce(new.raw_user_meta_data ->> 'shs_strand', 'STEM'),
        'student',
        'pending'
      );
    end;
  end if;

  return new;
end;
$$;

-- Repair previously created, misclassified accounts only when their submitted
-- invitation is still valid and unused. This preserves deliberate student roles.
do $$
declare
  candidate record;
begin
  for candidate in
    select
      profile.id as user_id,
      invitation.id as invite_id
    from public.profiles profile
    join auth.users auth_user on auth_user.id = profile.id
    join public.admin_invites invitation
      on invitation.used_at is null
      and invitation.revoked_at is null
      and invitation.expires_at > now()
      and crypt(
        upper(trim(coalesce(auth_user.raw_user_meta_data ->> 'admin_invite_code', ''))),
        invitation.code_hash
      ) = invitation.code_hash
    where profile.role = 'student'
      and coalesce(auth_user.raw_user_meta_data ->> 'admin_invite_code', '') <> ''
    for update of profile, invitation
  loop
    update public.profiles
    set role = 'admin',
        status = 'approved',
        student_no = 'ADMIN-' || candidate.user_id::text
    where id = candidate.user_id;

    update public.admin_invites
    set used_by = candidate.user_id,
        used_at = now()
    where id = candidate.invite_id;
  end loop;
end;
$$;
