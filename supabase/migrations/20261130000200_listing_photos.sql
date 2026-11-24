-- Plan §16C.2: `listing_photos` holds a listing's gallery, one row per photo,
-- ordered by `position`, stored under `shops/<shop-id>/`. The count is bounded
-- by the owner's Admin-set quota, which `src/lib/mediaRules.ts` already
-- encodes for the client (`DEFAULT_SHOP_PHOTO_QUOTA` is 20 until a shop has
-- its own).
--
-- `key` is the R2 object key, not a URL: the bucket host can change, and the
-- reader builds the URL. `media_objects` already tracks the object's size and
-- type, so this table only records which objects a listing shows and in what
-- order.

create table if not exists public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id text not null references public.listings (id) on delete cascade,
  key text not null,
  -- 0-based, so `order by position` needs no offset. Unique per listing so two
  -- photos cannot claim one slot and leave the gallery order ambiguous.
  position integer not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  unique (listing_id, position)
);

create index if not exists listing_photos_listing_idx
  on public.listing_photos (listing_id, position);

alter table public.listing_photos enable row level security;

-- A photo is visible exactly when its listing is: the policy defers to the
-- listing row rather than repeating the status test, so the two cannot drift.
drop policy if exists listing_photos_read on public.listing_photos;
create policy listing_photos_read on public.listing_photos
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and (l.status = 'active' or l.owner_id = auth.uid() or public.is_listing_staff())
    )
  );

drop policy if exists listing_photos_write on public.listing_photos;
create policy listing_photos_write on public.listing_photos
  for all using (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and (l.owner_id = auth.uid() or public.is_listing_staff())
    )
  ) with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_photos.listing_id
        and (l.owner_id = auth.uid() or public.is_listing_staff())
    )
  );

/**
 * Refuses the insert that would take a listing past its Admin-set quota. The
 * quota lives on the listing row (`photo_quota`), which defaults to the same
 * 20 `DEFAULT_SHOP_PHOTO_QUOTA` in `src/lib/mediaRules.ts` uses in the browser.
 */
create or replace function public.enforce_listing_photo_quota()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quota integer;
  v_count integer;
begin
  select l.photo_quota into v_quota
    from public.listings l where l.id = new.listing_id;

  select count(*) into v_count
    from public.listing_photos p
    where p.listing_id = new.listing_id;

  if v_count >= v_quota then
    raise exception 'listing_photo_quota_reached: % of % photos', v_count, v_quota
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists listing_photos_quota on public.listing_photos;
create trigger listing_photos_quota
  before insert on public.listing_photos
  for each row execute function public.enforce_listing_photo_quota();
