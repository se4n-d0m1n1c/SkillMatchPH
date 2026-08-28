-- Allow students to maintain their own profile and avatar safely.
-- Run this migration once in the Supabase SQL editor for an existing project.

alter table public.profiles
  add column if not exists avatar_url text;

-- Students may update their row, while the trigger below prevents privilege and
-- account-state changes. Admin updates continue to work as before.
drop policy if exists "students update own profile" on public.profiles;
create policy "students update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid() and role = 'student')
  with check (id = auth.uid() and role = 'student');

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
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_system_fields on public.profiles;
create trigger profiles_protect_system_fields
  before update on public.profiles
  for each row execute function public.protect_profile_system_fields();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Upserts need SELECT access to detect and replace an existing object. The
-- bucket is public for delivery, but Storage API operations still honor RLS.
drop policy if exists "users read own avatar" on storage.objects;
create policy "users read own avatar" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users upload own avatar" on storage.objects;
create policy "users upload own avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users update own avatar" on storage.objects;
create policy "users update own avatar" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "users delete own avatar" on storage.objects;
create policy "users delete own avatar" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
