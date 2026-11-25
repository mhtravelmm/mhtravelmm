-- Plan §16C.2: the shared `listings` table every module reads before its own
-- detail tables. Ids stay as they are today (`ph1`, `pre3`, `ta1`) so links,
-- tests and the guide's listing index keep working, which §16C.3 step 1 asks
-- for. `src/lib/listingRows.ts` is the browser twin of this shape and
-- `SEED_LISTING_ROWS` is the seed below, so an edit on one side without the
-- other fails `src/lib/listingRows.test.ts`.
--
-- Reads are public (a traveler browses without signing in). Writes are the
-- owner's own rows, or MH staff: §16C.3 step 2 says an Owner edits only their
-- own listing, and the first Admin approval is what moves a row to `active`.

create table if not exists public.listings (
  id text primary key,
  -- The §16C.2 category list. Kept as text with a check rather than an enum so
  -- a new category is a one-line migration.
  category text not null check (category in (
    'attraction', 'hotel', 'guesthouse', 'restaurant', 'cafe', 'bar', 'market',
    'book_shop', 'rental', 'transport', 'travel_guide', 'exchange', 'hospital',
    'clinic', 'gym'
  )),
  city_id text not null references public.rental_cities (id),
  -- Null for MH-managed content (§16C.1 rows 4 and 5 have no owner).
  owner_id uuid references auth.users (id) on delete set null,
  name_mm text,
  name_en text not null,
  description_mm text,
  description_en text,
  address text,
  latitude double precision,
  longitude double precision,
  open_time time,
  close_time time,
  -- Hotels only; a null pair means the listing does not have a check-in.
  checkin_time time,
  checkout_time time,
  price_display text not null default 'hidden'
    check (price_display in ('hidden', 'after_payment', 'public')),
  price_from_mmk integer check (price_from_mmk is null or price_from_mmk >= 0),
  price_from_usd numeric(10, 2) check (price_from_usd is null or price_from_usd >= 0),
  booking_flow_mode text not null default 'full_manual'
    check (booking_flow_mode in ('full_manual', 'instant')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'retired')),
  rating numeric(2, 1) check (rating is null or (rating >= 0 and rating <= 5)),
  review_count integer not null default 0 check (review_count >= 0),
  favorite_count integer not null default 0 check (favorite_count >= 0),
  views integer not null default 0 check (views >= 0),
  image_url text,
  -- §16C.2: the owner's photo count is bounded by an Admin-set quota. It sits
  -- on the listing rather than the subscription because the quota is per shop
  -- page, and 20 is the value `mediaRules.ts` uses until an Admin sets one.
  photo_quota integer not null default 20 check (photo_quota >= 0),
  -- Plan §9: "the Owner's edits go live immediately after the initial Admin
  -- approval". Stamped once, the first time a listing reaches `active`, and
  -- never cleared: it is what tells the update policy an owner has already
  -- passed approval and may therefore keep the row live on a later edit.
  first_approved_at timestamptz,
  -- The public path the card links to. Stored, not derived, because a retired
  -- row still has to keep its old href so a saved link does not 404 silently.
  href text not null default '/',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listings_category_city_idx
  on public.listings (category, city_id, status);

create index if not exists listings_owner_idx on public.listings (owner_id);

-- The search index (§16C.3 step 6) and the Nearby map both sort by rating, so
-- a partial index keeps a retired row out of it.
create index if not exists listings_active_rating_idx
  on public.listings (rating desc nulls last)
  where status = 'active';

alter table public.listings enable row level security;

/** Plan §16C.3 step 2: MH staff may read and write every listing. */
create or replace function public.is_listing_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in ('Super Admin', 'Admin');
$$;

-- A traveler reads what is live. A suspended or retired row stays hidden from
-- the public, but its owner and MH staff still read it, which is what makes an
-- edit-then-approve cycle possible.
drop policy if exists listings_read on public.listings;
create policy listings_read on public.listings
  for select using (
    status = 'active'
    or owner_id = auth.uid()
    or public.is_listing_staff()
  );

drop policy if exists listings_insert on public.listings;
create policy listings_insert on public.listings
  for insert with check (
    public.is_listing_staff()
    -- An owner may create their own row, and it starts Pending: the first
    -- Admin approval is what makes it live.
    or (owner_id = auth.uid() and status = 'pending')
  );

drop policy if exists listings_update on public.listings;
create policy listings_update on public.listings
  for update using (
    public.is_listing_staff() or owner_id = auth.uid()
  ) with check (
    public.is_listing_staff()
    -- An owner's write keeps the row live once an Admin has approved it once
    -- (Plan §9), and is held at Pending until then. `first_approved_at` is set
    -- only by the trigger below, so an owner cannot grant it to themselves.
    or (
      owner_id = auth.uid()
      and (status = 'pending' or first_approved_at is not null)
    )
  );

drop policy if exists listings_delete on public.listings;
create policy listings_delete on public.listings
  for delete using (public.is_listing_staff());

-- `updated_at` is what the Admin list sorts by, so keep it honest without
-- trusting the writer to send it.
create or replace function public.touch_listings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

/**
 * Stamps `first_approved_at` the first time a row reaches `active`, and refuses
 * to let anyone but MH staff write that column — otherwise an owner could set
 * it on a Pending row and then take their own listing live.
 */
create or replace function public.stamp_listing_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_listing_staff() then
    -- Only an approval stamps it. Doing this for anyone would hand an owner
    -- the stamp the update policy then accepts, which is self-approval.
    if new.status = 'active' and new.first_approved_at is null then
      new.first_approved_at := now();
    end if;
  else
    -- Everyone else writes the column back unchanged, so a forged value is
    -- discarded before the policy check sees it.
    new.first_approved_at := old.first_approved_at;
  end if;

  return new;
end;
$$;

drop trigger if exists listings_stamp_approval on public.listings;
create trigger listings_stamp_approval
  before update on public.listings
  for each row execute function public.stamp_listing_approval();

drop trigger if exists listings_touch_updated_at on public.listings;
create trigger listings_touch_updated_at
  before update on public.listings
  for each row execute function public.touch_listings_updated_at();

-- ---------------------------------------------------------------------------
-- The seed, generated from `SEED_LISTING_ROWS` in `src/lib/listingRows.ts`.
-- `on conflict do nothing` so a row an Admin has already edited — a price, a
-- status, an MM name — survives a rerun. Category and city are read back from
-- `rental_cities`, which the rental migrations own; if a city row is missing
-- the whole insert is skipped rather than failing the migration.
-- ---------------------------------------------------------------------------
insert into public.listings (
  id, category, city_id, owner_id, name_mm, name_en, description_mm,
  description_en, address, latitude, longitude, open_time, close_time,
  checkin_time, checkout_time, price_display, price_from_mmk, price_from_usd,
  booking_flow_mode, status, rating, review_count, favorite_count, views,
  image_url, href, first_approved_at
)
-- The values list types `owner_id` as text because it is all nulls, and a
-- bare null would otherwise be an untyped literal; cast the typed columns
-- once here instead of annotating 66 rows.
-- A `values` list types each column from its first non-null row, so a column
-- that is all nulls arrives as text. Cast the typed columns once here rather
-- than annotating every row.
select
  id::text, category::text, city_id::text, owner_id::uuid, name_mm::text,
  name_en::text, description_mm::text, description_en::text, address::text,
  latitude::double precision, longitude::double precision,
  open_time::time, close_time::time, checkin_time::time, checkout_time::time,
  price_display::text, price_from_mmk::integer, price_from_usd::numeric,
  booking_flow_mode::text, status::text, rating::numeric,
  review_count::integer, favorite_count::integer, views::integer,
  image_url::text, href::text,
  -- These rows come from the compiled catalog, which was reviewed when it was
  -- written, so the active ones carry the §9 approval stamp. Without it an
  -- Owner's first edit would drop a live row back to `pending`. A row seeded as
  -- pending must have no stamp, or the update policy would read it as approved.
  case when seed.status = 'active' then now() else null end
from (values
  ('ta1', 'attraction', 'yangon', null, null, 'Shwedagon pagoda', null, null, null, null, null, '08:00', '17:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.6, 0, 0, 1500, '/images/blog/shwedagon-evening.webp', '/attractions/ta1'), 
  ('ta2', 'attraction', 'yangon', null, null, 'People''s park', null, null, null, null, null, '08:00', '17:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.5, 0, 0, 1500, '/images/blog/inle-stilt-houses.webp', '/attractions/ta2'), 
  ('ta3', 'attraction', 'yangon', null, null, 'Shwe Chaw thar pagoda', null, null, null, null, null, '08:00', '17:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.7, 0, 0, 1500, '/images/blog/bagan-sunrise.webp', '/attractions/ta3'), 
  ('ta4', 'attraction', 'yangon', null, null, 'Sule pagoda', null, null, null, null, null, '08:00', '17:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.4, 0, 0, 1500, '/images/blog/shwedagon-evening.webp', '/attractions/ta4'), 
  ('ta5', 'attraction', 'mandalay', null, null, 'U Bein bridge', null, null, null, null, null, '08:00', '17:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.3, 0, 0, 1500, '/images/blog/ubein-evening.webp', '/attractions/ta5'), 
  ('ph1', 'hotel', 'yangon', null, null, 'Sedona hotel Yangon', null, null, null, null, null, '00:00', '23:59', '14:00', '12:00', 'public', null, 120, 'full_manual', 'active', 4.8, 0, 0, 1500, '/images/blog/inle-stilt-houses.webp', '/hotels/sedona-yangon'), 
  ('ph2', 'hotel', 'yangon', null, null, 'Pan Pacific Yangon', null, null, null, null, null, '00:00', '23:59', '14:00', '12:00', 'public', null, 105, 'full_manual', 'active', 4.7, 0, 0, 1500, '/images/blog/shwedagon-evening.webp', '/hotels/pan-pacific'), 
  ('ph3', 'hotel', 'yangon', null, null, 'Lotte hotel Yangon', null, null, null, null, null, '00:00', '23:59', '14:00', '12:00', 'public', null, 95, 'full_manual', 'active', 4.6, 0, 0, 1500, '/images/blog/bagan-sunrise.webp', '/hotels/lotte'), 
  ('ph4', 'hotel', 'yangon', null, null, 'Melia Yangon', null, null, null, null, null, '00:00', '23:59', '14:00', '12:00', 'public', null, 88, 'full_manual', 'active', 4.5, 0, 0, 1500, '/images/blog/ubein-evening.webp', '/hotels/melia'), 
  ('ph5', 'hotel', 'yangon', null, null, 'Wyndham grand', null, null, null, null, null, '00:00', '23:59', '14:00', '12:00', 'public', null, 76, 'full_manual', 'active', 4.4, 0, 0, 1500, '/images/blog/inle-stilt-houses.webp', '/hotels/wyndham'), 
  ('pr1', 'restaurant', 'yangon', null, null, 'The Rangoon house', null, null, null, null, null, '10:00', '22:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.6, 0, 0, 1500, '/images/blog/shwedagon-evening.webp', '/restaurants/rangoon-house'), 
  ('pr2', 'restaurant', 'yangon', null, null, 'Shan Yoe Yar', null, null, null, null, null, '10:00', '22:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.4, 0, 0, 1500, '/images/blog/ubein-evening.webp', '/restaurants/shan-yoe-yar'), 
  ('pr3', 'restaurant', 'yangon', null, null, 'Monsoon restaurant', null, null, null, null, null, '10:00', '22:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.3, 0, 0, 1500, '/images/blog/inle-stilt-houses.webp', '/restaurants/monsoon'), 
  ('pr4', 'restaurant', 'yangon', null, null, 'Feel Myanmar food', null, null, null, null, null, '10:00', '22:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.5, 0, 0, 1500, '/images/blog/bagan-sunrise.webp', '/restaurants/feel-myanmar'), 
  ('pr5', 'restaurant', 'yangon', null, null, 'Boo''s kitchen', null, null, null, null, null, '10:00', '22:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.2, 0, 0, 1500, '/images/blog/shwedagon-evening.webp', '/restaurants/boos-kitchen'), 
  ('pc1', 'cafe', 'yangon', null, null, 'Sharky''s cafe', null, null, null, null, null, '07:00', '20:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.5, 0, 0, 1500, null, '/cafes/sharkys'), 
  ('pc2', 'cafe', 'yangon', null, null, 'Rangoon tea house', null, null, null, null, null, '07:00', '20:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.7, 0, 0, 1500, null, '/cafes/rangoon-tea-house'), 
  ('pc3', 'cafe', 'yangon', null, null, 'Coffee circles', null, null, null, null, null, '07:00', '20:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.4, 0, 0, 1500, null, '/cafes/coffee-circles'), 
  ('pc4', 'cafe', 'yangon', null, null, 'Sky bistro', null, null, null, null, null, '07:00', '20:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.3, 0, 0, 1500, null, '/cafes/sky-bistro'), 
  ('pc5', 'cafe', 'yangon', null, null, 'Java cafe', null, null, null, null, null, '07:00', '20:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.2, 0, 0, 1500, null, '/cafes/java'), 
  ('pm1', 'market', 'yangon', null, null, 'Bogyoke market', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.6, 0, 0, 1500, null, '/markets/bogyoke'), 
  ('pm2', 'market', 'yangon', null, null, 'Theingyi market', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.4, 0, 0, 1500, null, '/markets/theingyi'), 
  ('pm3', 'market', 'yangon', null, null, 'Junction city mall', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.5, 0, 0, 1500, null, '/markets/junction-city'), 
  ('pm4', 'market', 'mandalay', null, null, 'Scott market', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.3, 0, 0, 1500, null, '/markets/scott'), 
  ('pm5', 'market', 'yangon', null, null, 'Myanmar plaza', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.1, 0, 0, 1500, null, '/markets/myanmar-plaza'), 
  ('pb1', 'book_shop', 'yangon', null, null, 'Book Nook Yangon', null, null, null, null, null, '09:00', '19:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.8, 0, 0, 1500, '/images/blog/ubein-evening.webp', '/book-shops/book-nook'), 
  ('pb2', 'book_shop', 'yangon', null, null, 'Shwe Book shop', null, null, null, null, null, '09:00', '19:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.5, 0, 0, 1500, '/images/blog/inle-stilt-houses.webp', '/book-shops/shwe'), 
  ('pb3', 'book_shop', 'yangon', null, null, 'City Book center', null, null, null, null, null, '09:00', '19:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.3, 0, 0, 1500, '/images/blog/bagan-sunrise.webp', '/book-shops/city-center'), 
  ('pb4', 'book_shop', 'yangon', null, null, 'Innwa bookstore', null, null, null, null, null, '09:00', '19:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.4, 0, 0, 1500, '/images/blog/shwedagon-evening.webp', '/book-shops/innwa'), 
  ('pb5', 'book_shop', 'yangon', null, null, 'Pansodan books', null, null, null, null, null, '09:00', '19:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.6, 0, 0, 1500, '/images/blog/ubein-evening.webp', '/book-shops/pansodan'), 
  ('pre1', 'rental', 'yangon', null, null, 'Toyota car rental', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.5, 0, 0, 1500, '/images/blog/ubein-evening.webp', '/rentals/pre1'), 
  ('pre2', 'rental', 'yangon', null, null, 'Honda motorbike', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.6, 0, 0, 1500, '/images/blog/shwedagon-evening.webp', '/rentals/pre2'), 
  ('pre3', 'rental', 'yangon', null, null, 'Yangon bicycle hub', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.4, 0, 0, 1500, '/images/blog/bagan-sunrise.webp', '/rentals/pre3'), 
  ('pre4', 'rental', 'yangon', null, null, 'Guide - Ko Aung Aung', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.8, 0, 0, 1500, '/images/blog/inle-stilt-houses.webp', '/rentals/pre4'), 
  ('pre5', 'rental', 'yangon', null, null, 'Motorboat rental', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.3, 0, 0, 1500, '/images/blog/ubein-evening.webp', '/rentals/pre5'), 
  ('pre6', 'rental', 'yangon', null, null, 'Yangon E-Bike', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.7, 0, 0, 980, '/images/blog/shwedagon-evening.webp', '/rentals'), 
  ('pre7', 'rental', 'yangon', null, null, 'City Scooter', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.6, 0, 0, 875, '/images/blog/ubein-evening.webp', '/rentals'), 
  ('pre8', 'rental', 'yangon', null, null, 'Self-drive SUV', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.8, 0, 0, 1120, '/images/blog/bagan-sunrise.webp', '/rentals'), 
  ('pre9', 'rental', 'bagan', null, null, 'Bagan horse carriage', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.5, 0, 0, 760, '/images/blog/bagan-sunrise.webp', '/rentals'), 
  ('pre10', 'rental', 'inle', null, null, 'Inle camping tent', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.4, 0, 0, 690, '/images/blog/inle-stilt-houses.webp', '/rentals'), 
  ('pre11', 'rental', 'mandalay', null, null, 'Mandalay tricycle', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.3, 0, 0, 720, '/images/blog/ubein-evening.webp', '/rentals'), 
  ('pt1', 'transport', 'yangon', null, null, 'JJ Express', null, null, null, null, null, '05:00', '21:00', null, null, 'hidden', null, null, 'instant', 'active', 4.6, 0, 0, 1500, null, '/ticketing/jj-express'), 
  ('pt2', 'transport', 'yangon', null, null, 'Elite Express', null, null, null, null, null, '05:00', '21:00', null, null, 'hidden', null, null, 'instant', 'active', 4.5, 0, 0, 1500, null, '/ticketing/elite-express'), 
  ('pt3', 'transport', 'yangon', null, null, 'Malikha Travels', null, null, null, null, null, '05:00', '21:00', null, null, 'hidden', null, null, 'instant', 'active', 4.4, 0, 0, 1500, null, '/ticketing/malikha'), 
  ('pt4', 'transport', 'yangon', null, null, 'Myanmar airways', null, null, null, null, null, '05:00', '21:00', null, null, 'hidden', null, null, 'instant', 'active', 4.5, 0, 0, 1500, null, '/ticketing/myanmar-airways'), 
  ('pt5', 'transport', 'inle', null, null, 'Inle ferry lines', null, null, null, null, null, '05:00', '21:00', null, null, 'hidden', null, null, 'instant', 'active', 4.2, 0, 0, 1500, null, '/ticketing/inle-ferry'), 
  ('ctg1', 'travel_guide', 'yangon', null, null, 'Yangon in 5 places, 1 day', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.3, 0, 0, 1500, null, '/travel-guide/ctg1'), 
  ('ctg2', 'travel_guide', 'yangon', null, null, 'Yangon in 5 places, 1 day', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.1, 0, 0, 1500, null, '/travel-guide/ctg2'), 
  ('ctg3', 'travel_guide', 'yangon', null, null, 'Yangon in 5 places, 1 day', null, null, null, null, null, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.6, 0, 0, 1500, null, '/travel-guide/ctg3'), 
  ('near-guesthouse-1', 'guesthouse', 'yangon', null, null, 'Pansodan Guesthouse', null, 'A walkable downtown stay', 'Pansodan Street, Downtown', 16.7782, 96.1575, '00:00', '23:59', '14:00', '12:00', 'hidden', null, null, 'full_manual', 'active', 4.5, 0, 0, 890, '/images/blog/inle-stilt-houses.webp', '/hotels'), 
  ('near-bar-1', 'bar', 'yangon', null, null, 'Yangon Rooftop Bar', null, 'Evening drinks and city views', 'Shwedagon Pagoda Road', 16.79, 96.15, '17:00', '23:30', null, null, 'hidden', null, null, 'full_manual', 'active', 4.4, 0, 0, 760, '/images/blog/myanmar-food.webp', '/restaurants'), 
  ('near-exchange-1', 'exchange', 'yangon', null, null, 'Downtown Currency Exchange', null, 'Currency exchange service', 'Maha Bandula Road', 16.777, 96.159, '09:00', '17:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.2, 0, 0, 430, '/images/blog/ubein-evening.webp', '/nearby'), 
  ('near-hospital-1', 'hospital', 'yangon', null, null, 'Yangon Central Hospital', null, 'General hospital and emergency care', 'Lanmadaw Township', 16.779, 96.14, '00:00', '23:59', null, null, 'hidden', null, null, 'full_manual', 'active', 4.5, 0, 0, 980, '/images/blog/myanmar-wellness.webp', '/nearby'), 
  ('near-clinic-1', 'clinic', 'yangon', null, null, 'Family Health Clinic', null, 'Primary care and consultations', 'Bahan Township', 16.813, 96.157, '08:00', '17:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.3, 0, 0, 570, '/images/blog/myanmar-wellness.webp', '/nearby'), 
  ('near-gym-1', 'gym', 'yangon', null, null, 'Downtown Fitness Club', null, 'Fitness and training', 'Kyauktada Township', 16.78, 96.16, '06:00', '22:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.4, 0, 0, 640, '/images/blog/myanmar-wellness.webp', '/nearby'), 
  ('near-hotel-1', 'hotel', 'yangon', null, null, 'Sedona Hotel Yangon', null, 'A comfortable city stay', 'Kabar Aye Pagoda Road', 16.833, 96.158, '00:00', '23:59', '14:00', '12:00', 'hidden', null, null, 'full_manual', 'active', 4.8, 0, 0, 1500, '/images/blog/inle-stilt-houses.webp', '/hotels/sedona-yangon'), 
  ('near-hotel-2', 'hotel', 'yangon', null, null, 'Pan Pacific Yangon', null, 'Hotel near downtown Yangon', 'Shwedagon Pagoda Road', 16.778, 96.161, '00:00', '23:59', '14:00', '12:00', 'hidden', null, null, 'full_manual', 'active', 4.7, 0, 0, 1500, '/images/blog/shwedagon-evening.webp', '/hotels/pan-pacific'), 
  ('near-restaurant-1', 'restaurant', 'yangon', null, null, 'The Rangoon House', null, 'Local and international dining', 'Inya Road, Kamayut', 16.823, 96.135, '10:00', '22:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.6, 0, 0, 1500, '/images/blog/myanmar-food.webp', '/restaurants/rangoon-house'), 
  ('near-restaurant-2', 'restaurant', 'yangon', null, null, 'Shan Yoe Yar', null, 'Traditional Shan cuisine', 'Yankin Road, Yangon', 16.838, 96.174, '10:00', '22:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.4, 0, 0, 1500, '/images/blog/myanmar-food.webp', '/restaurants/shan-yoe-yar'), 
  ('near-restaurant-3', 'restaurant', 'yangon', null, null, 'Monsoon Restaurant', null, 'Myanmar and Southeast Asian food', 'Thein Phyu Road', 16.771, 96.171, '10:00', '22:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.3, 0, 0, 1500, '/images/blog/myanmar-food.webp', '/restaurants/monsoon'), 
  ('near-cafe-1', 'cafe', 'yangon', null, null, 'Sharky''s Cafe', null, 'Coffee and light bites', 'Golden Valley, Yangon', 16.818, 96.146, '07:00', '20:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.5, 0, 0, 1500, '/images/blog/bagan-sunrise.webp', '/cafes/sharkys'), 
  ('near-cafe-2', 'cafe', 'yangon', null, null, 'Rangoon Tea House', null, 'Tea, coffee, and local snacks', 'Pansodan Street', 16.774, 96.158, '07:00', '20:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.7, 0, 0, 1500, '/images/blog/inle-stilt-houses.webp', '/cafes/rangoon-tea-house'), 
  ('near-market-1', 'market', 'yangon', null, null, 'Bogyoke Market', null, 'A lively traditional market', 'Bogyoke Aung San Road', 16.779, 96.153, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.6, 0, 0, 1500, '/images/blog/ubein-evening.webp', '/markets/bogyoke'), 
  ('near-market-2', 'market', 'yangon', null, null, 'Junction City Mall', null, 'Shopping and city services', 'Bogyoke Aung San Road', 16.778, 96.157, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.5, 0, 0, 1500, '/images/blog/inle-stilt-houses.webp', '/markets/junction-city'), 
  ('near-book-1', 'book_shop', 'yangon', null, null, 'Book Nook Yangon', null, 'Independent bookshop', 'Pansodan Street', 16.776, 96.158, '09:00', '19:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.8, 0, 0, 1500, '/images/blog/bagan-sunrise.webp', '/book-shops/book-nook'), 
  ('near-attraction-1', 'attraction', 'yangon', null, null, 'Shwedagon Pagoda', null, 'The most famous pagoda in Myanmar', 'Ar Zar Ni Road, Dagon', 16.798, 96.149, '08:00', '17:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.9, 0, 0, 1500, '/images/blog/shwedagon-evening.webp', '/attractions/ta1'), 
  ('near-rental-1', 'rental', 'yangon', null, null, 'Yangon Bicycle Hub', null, 'Bicycle rentals in downtown', 'Downtown Yangon', 16.781, 96.16, '08:00', '18:00', null, null, 'hidden', null, null, 'full_manual', 'active', 4.4, 0, 0, 1500, '/images/blog/ubein-evening.webp', '/rentals/pre3')
) as seed (
  id, category, city_id, owner_id, name_mm, name_en, description_mm,
  description_en, address, latitude, longitude, open_time, close_time,
  checkin_time, checkout_time, price_display, price_from_mmk, price_from_usd,
  booking_flow_mode, status, rating, review_count, favorite_count, views,
  image_url, href
)
where exists (select 1 from public.rental_cities c where c.id = seed.city_id)
on conflict (id) do nothing;
