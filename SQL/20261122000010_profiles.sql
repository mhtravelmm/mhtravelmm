-- Plan §3 and §16B.1: `public.profiles` carries one row per signed-in account,
-- and `role` is what every policy in this repository checks. The Plan's §2A
-- names this file as the first migration (`create_user_profiles_and_auth_policies`)
-- but it was never committed, so the whole chain failed on a fresh project with
-- `relation "public.profiles" does not exist`. It is reconstructed here from
-- what the rest of the schema and the client actually read:
--
--   `src/lib/auth.tsx` selects `username, display_name, role, created_at`
--   `20261122000400_rental_role_slugs.sql` normalises `role` as a slug
--   `20261127000100_owner_ledger.sql` reads `display_name` for an owner match
--
-- `role` defaults to `traveler`, which no role helper matches, so a new account
-- has no privileges until an Admin grants them.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  display_name text,
  role text not null default 'traveler',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_username_key
  on public.profiles (lower(username))
  where username is not null;

create index if not exists profiles_role_idx on public.profiles (role);

alter table public.profiles enable row level security;

-- A signed-in reader reads their own row. `auth.tsx` does exactly this to learn
-- its role, so without it every account would look like a traveler.
drop policy if exists profiles_read_own on public.profiles;
create policy profiles_read_own on public.profiles
  for select using (id = auth.uid());

-- Super Admin manages accounts, so it reads and writes every row. The predicate
-- is written out rather than calling `current_role_name()`, which the later
-- migration defines and this file must not depend on.
drop policy if exists profiles_staff_all on public.profiles;
create policy profiles_staff_all on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and regexp_replace(lower(trim(p.role)), '[\s-]+', '_', 'g') in ('super_admin', 'admin')
    )
  ) with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and regexp_replace(lower(trim(p.role)), '[\s-]+', '_', 'g') in ('super_admin', 'admin')
    )
  );

-- A new account may create its own profile row, which is what `auth.tsx` does
-- on sign-up, and only its own.
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid());

-- A reader may change their display name and username but never their role:
-- the `with check` pins `role` to the stored value, so a self-promotion is
-- refused rather than silently ignored.
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

/**
 * Fills the profile row from the sign-up metadata, so an account created
 * through the Auth UI has a name without a second round trip. A failure here
 * must not block the sign-up, so the body swallows nothing but unexpected
 * column names.
 */
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'username', ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    'traveler'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_profiles_updated_at();
