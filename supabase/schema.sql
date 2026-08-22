-- SkillMatchPH database schema
-- Run this file in the Supabase SQL Editor of a new project.
-- Authentication users live in Supabase's managed auth.users table.
-- To load the starter university catalog afterwards, run
-- supabase/seed_top_ph_universities.sql.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  student_no text not null unique,
  grade_level smallint not null check (grade_level in (11, 12)),
  shs_track text not null,
  shs_strand text not null,
  role text not null default 'student' check (role in ('student', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  category text not null check (category in (
    'Technology', 'Business', 'Engineering', 'Health',
    'Arts & Humanities', 'Sciences', 'Education'
  )),
  description text not null,
  icon_name text not null default 'BookOpen',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text,
  website text,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A university can offer many programs, and a program can be offered by many universities.
create table public.program_universities (
  program_id uuid not null references public.programs(id) on delete cascade,
  university_id uuid not null references public.universities(id) on delete cascade,
  primary key (program_id, university_id)
);

create index profiles_role_status_idx on public.profiles (role, status);
create index program_universities_university_id_idx on public.program_universities (university_id);

-- Keep timestamp columns accurate on edits.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger programs_set_updated_at before update on public.programs
for each row execute function public.set_updated_at();

create trigger universities_set_updated_at before update on public.universities
for each row execute function public.set_updated_at();

-- Every new Auth user receives a student profile. Role is deliberately hard-coded:
-- user-editable Auth metadata must never be allowed to create an administrator.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, first_name, last_name, student_no, grade_level, shs_track, shs_strand, role, status
  ) values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'student_no', new.id::text),
    coalesce(nullif(new.raw_user_meta_data ->> 'grade_level', '')::smallint, 11),
    coalesce(new.raw_user_meta_data ->> 'shs_track', 'Academic'),
    coalesce(new.raw_user_meta_data ->> 'shs_strand', 'STEM'),
    'student',
    'pending'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Security helper. SECURITY DEFINER avoids circular RLS checks on profiles.
create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.universities enable row level security;
alter table public.program_universities enable row level security;

-- Students can view their own profile; admins can manage all profiles.
create policy "read own profile or all as admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "admin updates profiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- All signed-in users may browse the catalog; only admins may change it.
create policy "authenticated read programs" on public.programs
  for select to authenticated using (true);
create policy "admin manages programs" on public.programs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "authenticated read universities" on public.universities
  for select to authenticated using (true);
create policy "admin manages universities" on public.universities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "authenticated read program links" on public.program_universities
  for select to authenticated using (true);
create policy "admin manages program links" on public.program_universities
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Used by the Admin > Student Management delete action. It also removes auth.users.
create function public.delete_student(target_user_id uuid)
returns void
language plpgsql
security definer set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators can delete student accounts';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Administrators cannot delete their own account';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = target_user_id and role = 'student'
  ) then
    raise exception 'Student not found';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

revoke all on function public.delete_student(uuid) from public;
grant execute on function public.delete_student(uuid) to authenticated;

-- Bootstrap the first administrator after creating an account in Supabase Auth.
-- Replace the UUID with that user's id from Authentication > Users, then run:
-- update public.profiles set role = 'admin', status = 'approved'
-- where id = '00000000-0000-0000-0000-000000000000';
