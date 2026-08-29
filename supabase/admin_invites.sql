-- Secure, one-time administrator invitations.
-- Run this migration in the Supabase SQL Editor before using Admin Invites.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_by uuid references auth.users(id) on delete set null,
  used_at timestamptz,
  revoked_at timestamptz,
  check (expires_at > created_at)
);

create index if not exists admin_invites_active_idx
  on public.admin_invites (expires_at)
  where used_at is null and revoked_at is null;

alter table public.admin_invites enable row level security;

-- Invite hashes are deliberately unavailable through the REST API. Admins use
-- the narrow SECURITY DEFINER functions below instead.

create or replace function public.generate_admin_invite(valid_for_hours integer default 72)
returns table (invite_id uuid, invite_code text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  generated_code text;
  generated_id uuid;
  generated_expiry timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can create invitations';
  end if;

  if valid_for_hours < 1 or valid_for_hours > 168 then
    raise exception 'Invitation lifetime must be between 1 and 168 hours';
  end if;

  generated_code := 'SMPH-' || upper(encode(gen_random_bytes(6), 'hex'));
  generated_expiry := now() + make_interval(hours => valid_for_hours);

  insert into public.admin_invites (code_hash, created_by, expires_at)
  values (crypt(generated_code, gen_salt('bf')), auth.uid(), generated_expiry)
  returning id into generated_id;

  return query select generated_id, generated_code, generated_expiry;
end;
$$;

create or replace function public.list_admin_invites()
returns table (
  id uuid,
  created_at timestamptz,
  expires_at timestamptz,
  used_at timestamptz,
  revoked_at timestamptz,
  created_by_name text,
  used_by_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    invitation.id,
    invitation.created_at,
    invitation.expires_at,
    invitation.used_at,
    invitation.revoked_at,
    concat_ws(' ', creator.first_name, creator.last_name),
    concat_ws(' ', recipient.first_name, recipient.last_name)
  from public.admin_invites invitation
  join public.profiles creator on creator.id = invitation.created_by
  left join public.profiles recipient on recipient.id = invitation.used_by
  where public.is_admin()
  order by invitation.created_at desc;
$$;

create or replace function public.revoke_admin_invite(target_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can revoke invitations';
  end if;

  update public.admin_invites
  set revoked_at = now()
  where id = target_invite_id and used_at is null and revoked_at is null;
end;
$$;

-- Extend the existing Auth trigger. A supplied invite is validated and consumed
-- atomically; without one, signup retains the normal student behavior.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  submitted_invite text := upper(trim(coalesce(new.raw_user_meta_data ->> 'admin_invite_code', '')));
  matched_invite_id uuid;
begin
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
      id, username, first_name, last_name, student_no, grade_level, shs_track, shs_strand, role, status
    ) values (
      new.id,
      nullif(lower(trim(new.raw_user_meta_data ->> 'username')), ''),
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
      student_username text := nullif(lower(trim(new.raw_user_meta_data ->> 'username')), '');
      student_no text := nullif(trim(new.raw_user_meta_data ->> 'student_no'), '');
    begin
      if student_username is not null and exists (
        select 1 from public.profiles where lower(username) = student_username
      ) then
        raise exception 'That username is unavailable. Choose another username.';
      end if;

      if student_no is not null and exists (
        select 1 from public.profiles existing
        where lower(existing.student_no) = lower(student_no)
      ) then
        raise exception 'That student number is already in use.';
      end if;

      insert into public.profiles (
        id, username, first_name, last_name, student_no, grade_level, shs_track, shs_strand, role, status
      ) values (
        new.id,
        student_username,
        coalesce(new.raw_user_meta_data ->> 'first_name', ''),
        coalesce(new.raw_user_meta_data ->> 'last_name', ''),
        coalesce(student_no, new.id::text),
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

revoke all on function public.generate_admin_invite(integer) from public;
revoke all on function public.list_admin_invites() from public;
revoke all on function public.revoke_admin_invite(uuid) from public;
grant execute on function public.generate_admin_invite(integer) to authenticated;
grant execute on function public.list_admin_invites() to authenticated;
grant execute on function public.revoke_admin_invite(uuid) to authenticated;

