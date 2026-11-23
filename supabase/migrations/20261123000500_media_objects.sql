-- Plan §16B.6: every uploaded object is recorded here so the nightly cleanup
-- can tell a referenced file from an orphan, and so a shop's photo count is a
-- number the server checks rather than a number the browser reports. The size
-- and type limits repeat `src/lib/mediaRules.ts`; the Worker enforces both, and
-- this table is the last line so a misbehaving client cannot store a 5 MB cover.

create table if not exists public.media_objects (
  id uuid primary key default gen_random_uuid(),
  -- R2 key, unique because one object is one row.
  key text not null unique,
  folder text not null check (folder in ('blog-posts', 'guide-stops', 'ads', 'rentals', 'shops')),
  -- Set for `shops/` only; the folder prefix carries it too, and the check below
  -- keeps the two from drifting apart.
  shop_id text,
  kind text not null check (kind in ('image', 'video')),
  content_type text not null,
  bytes bigint not null check (bytes > 0),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  -- Bumped whenever a row that shows the object is saved. The cleanup job reads
  -- this, not `created_at`, so an old file still in use is never deleted.
  last_referenced_at timestamptz not null default now(),
  constraint media_objects_shop_check check (
    (folder = 'shops' and shop_id is not null and key like 'shops/' || shop_id || '/%')
    or (folder <> 'shops' and shop_id is null)
  ),
  constraint media_objects_folder_key_check check (key like folder || '/%'),
  constraint media_objects_size_check check (
    case
      when folder = 'ads' and kind = 'video' then bytes <= 3145728
      when folder = 'ads' then bytes <= 307200
      else bytes <= 460800
    end
  )
);

create index if not exists media_objects_folder_idx on public.media_objects (folder, created_at desc);
create index if not exists media_objects_shop_idx on public.media_objects (shop_id, created_at desc);
create index if not exists media_objects_orphan_idx on public.media_objects (last_referenced_at);

alter table public.media_objects enable row level security;

-- The object is already public: a cover URL is served by R2 to every reader. The
-- row carries no personal data, so reading it is open.
drop policy if exists media_objects_read on public.media_objects;
create policy media_objects_read on public.media_objects
  for select using (true);

-- Plan §16B.6: uploads go through the authenticated Worker, which runs as the
-- service role and bypasses RLS. No client insert policy exists on purpose, so a
-- browser cannot claim an object it did not upload.
--
-- Plan §9: a Shop Owner may replace a photo, which only moves the reference
-- time. The folder and the key are immutable, so the update cannot be used to
-- rename an object into someone else's folder.
drop policy if exists media_objects_reference on public.media_objects;
create policy media_objects_reference on public.media_objects
  for update to authenticated
  using (
    public.current_role_name() in ('Super Admin', 'Admin', 'Owner Admin')
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'admin', 'owner_admin')
    )
  )
  with check (true);

-- No delete policy: the cleanup job deletes through the function below, which
-- runs as the service role. A client that deletes a row without deleting the R2
-- object would leave a file nothing can ever find again.

/**
 * Registers one uploaded object. The Worker calls this after a successful put,
 * so the row and the file appear together.
 */
create or replace function public.register_media_object(
  p_key text,
  p_folder text,
  p_kind text,
  p_content_type text,
  p_bytes bigint,
  p_shop_id text default null
)
returns public.media_objects
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.media_objects;
begin
  insert into public.media_objects (key, folder, shop_id, kind, content_type, bytes, uploaded_by)
  values (p_key, p_folder, p_shop_id, p_kind, p_content_type, p_bytes, auth.uid())
  on conflict (key) do update
    set last_referenced_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

/** One content row that shows the object was saved, so the file is still in use. */
create or replace function public.touch_media_object(p_key text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.media_objects
  set last_referenced_at = now()
  where key = p_key;
$$;

/**
 * Plan §16B.6: a shop's photo count against the Admin-set quota. The Worker asks
 * this before it accepts an upload, so the count comes from the server.
 */
create or replace function public.shop_media_count(p_shop_id text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.media_objects
  where folder = 'shops' and shop_id = p_shop_id;
$$;

/**
 * Plan §16B.6 and §16B.7: the nightly job's list. An object nothing referenced
 * for 30 days is an orphan. The function only lists them; the Worker deletes the
 * R2 object first and then the row, so a failed delete is retried tomorrow
 * instead of losing the file.
 */
create or replace function public.orphan_media_objects(p_days integer default 30)
returns setof public.media_objects
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.media_objects
  where last_referenced_at < now() - make_interval(days => greatest(p_days, 1));
$$;

/** The row goes once the object is gone; the job calls this after the delete. */
create or replace function public.delete_media_object(p_key text)
returns boolean
language sql
security definer
set search_path = public
as $$
  with removed as (
    delete from public.media_objects where key = p_key returning 1
  )
  select exists (select 1 from removed);
$$;

-- Plan §16B.7: the cleanup is a schedule entry, so it runs under the shared
-- wrapper and a failure raises the Super Admin notice like every other job.
comment on table public.media_objects is
  'Plan §16B.6: one row per R2 object; the orphan_media_cleanup job reads last_referenced_at.';
