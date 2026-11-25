-- Plan §16H, ticket M-50. One index table so one query covers every kind, one
-- normalizer so the client and the server agree on what "the same text" means,
-- and the six functions of §16G.3. `src/lib/searchIndex.ts` is the browser twin
-- of this file: it builds the same rows from the seed modules, scores with the
-- same table and returns the same `interpreted` / `counts` / `city_counts`
-- shape, so the page moves between the two without changing what it renders.
--
-- Reads are public (§16H.8: "callable by anyone and read only active, published
-- rows"), so everything goes through the functions below. A direct select on
-- `search_index` is staff only: the rows carry every source's text in one place,
-- and a public policy there would be a second, unreviewed read path.

create extension if not exists pg_trgm;
create extension if not exists unaccent;

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- One definition of "the same text" (§16H.5), mirrored by `normalizeSearchText`
-- in `src/lib/searchText.ts`. The two are held to the same vectors: a Zawgyi
-- word and its Unicode spelling, a word with its marks typed in a different
-- order, a Myanmar number and its ASCII form, and text with a zero-width space.
-- ---------------------------------------------------------------------------

/** `unaccent()` is only stable, so it cannot sit in an index expression. */
create or replace function private.unaccent_immutable(p_text text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select public.unaccent('public.unaccent'::regdictionary, p_text);
$$;

/**
 * The combining marks the order step knows about, and the rank each is stored
 * at (Unicode Technical Note 11): the stacking virama, the four medials, the
 * vowel signs, then the register and tone marks. A mark outside this list keeps
 * its typed position, which is what makes the step harmless on text it does not
 * understand.
 */
create or replace function private.myanmar_mark_rank(p_mark text)
returns integer
language sql
immutable
as $$
  select case p_mark
    when E'\u1039' then 0  -- virama, stacks the next consonant
    when E'\u103B' then 1  -- medial ya
    when E'\u103C' then 2  -- medial ra
    when E'\u103D' then 3  -- medial wa
    when E'\u103E' then 4  -- medial ha
    when E'\u1031' then 5  -- vowel e
    when E'\u102D' then 6
    when E'\u102E' then 7
    when E'\u102F' then 8
    when E'\u1030' then 9
    when E'\u1032' then 10
    when E'\u102B' then 11
    when E'\u102C' then 12
    when E'\u1036' then 13
    when E'\u1037' then 14
    when E'\u103A' then 15
    when E'\u1038' then 16
    else null
  end;
$$;

/** Any of the seventeen marks above. */
create or replace function private.is_myanmar_mark(p_char text)
returns boolean
language sql
immutable
as $$
  select private.myanmar_mark_rank(p_char) is not null;
$$;

/**
 * Sorts one cluster's marks into rank order. The base character stays first; a
 * cluster that is nothing but marks (a leading vowel, which only a Zawgyi-era
 * habit produces) is returned untouched so the conversion step can move it.
 */
create or replace function private.sort_myanmar_cluster(p_cluster text)
returns text
language plpgsql
immutable
as $$
declare
  v_chars text[] := regexp_split_to_array(p_cluster, '');
  v_base text := v_chars[1];
  v_marks text[] := '{}';
  v_ranked text[] := '{}';
  v_rank integer;
  i integer;
  j integer;
begin
  if coalesce(array_length(v_chars, 1), 0) < 2 then
    return p_cluster;
  end if;
  for i in 2 .. array_length(v_chars, 1) loop
    v_marks := v_marks || v_chars[i];
  end loop;
  -- Insertion sort: seventeen ranks and a handful of marks per syllable, and a
  -- stable order matters more than the algorithm.
  for i in 1 .. array_length(v_marks, 1) loop
    v_rank := private.myanmar_mark_rank(v_marks[i]);
    if v_rank is null then
      v_ranked := v_ranked || v_marks[i];
      continue;
    end if;
    j := array_length(v_ranked, 1);
    while j >= 1 and coalesce(private.myanmar_mark_rank(v_ranked[j]), 99) > v_rank loop
      j := j - 1;
    end loop;
    v_ranked := v_ranked[1:j] || v_marks[i] || v_ranked[j + 1:array_length(v_ranked, 1)];
  end loop;
  return v_base || array_to_string(v_ranked, '');
end;
$$;

/** Step 5: put every syllable's marks into the standard order. */
create or replace function private.order_myanmar_marks(p_text text)
returns text
language plpgsql
immutable
as $$
declare
  v_chars text[] := regexp_split_to_array(p_text, '');
  v_out text := '';
  v_cluster text := '';
  c text;
  i integer;
begin
  if p_text = '' then
    return '';
  end if;
  for i in 1 .. array_length(v_chars, 1) loop
    c := v_chars[i];
    if private.is_myanmar_mark(c) then
      v_cluster := v_cluster || c;
    else
      if v_cluster <> '' then
        v_out := v_out || private.sort_myanmar_cluster(v_cluster);
      end if;
      v_cluster := c;
    end if;
  end loop;
  if v_cluster <> '' then
    v_out := v_out || private.sort_myanmar_cluster(v_cluster);
  end if;
  return v_out;
end;
$$;

/**
 * Step 3, the part SQL can do safely: the code points Zawgyi uses in place of a
 * Unicode sequence, each of which has exactly one reading. `\u108F` is `န္`,
 * `\u1072` is `တ`, and `\u1060` is a stacked `က`; a substitution table is
 * unambiguous for these.
 *
 * A general Zawgyi reading — `ရန်ကုန်`, where `\u1039` is an asat and the same
 * two code points open the next syllable — is *not* a substitution: it needs the
 * syllable grammar and the detector, which `src/lib/zawgyi.ts` has from the
 * reference implementation. §16H.5 asks for one definition, so it lives there
 * and `search_all` receives a query the client has already normalized. What the
 * server must never do is guess, because a wrong conversion silently rewrites a
 * correct Unicode query into nonsense.
 */
create or replace function private.zawgyi_extended_to_unicode(p_text text)
returns text
language sql
immutable
as $$
  select replace(replace(replace(replace(
           replace(replace(p_text,
             E'\u108F', E'\u1014\u103A'),  -- န်
             E'\u1072', E'\u1010'),            -- တ
             E'\u1076', E'\u1012\u103A'),  -- ဒ်
             E'\u107E', E'\u101E\u103A'),  -- သ်
             E'\u1064', E'\u1004\u103A'),  -- င် (kinzi)
           E'\u1060', E'\u1000\u1039');     -- က္
$$;

/**
 * §16H.5, all seven steps. The output is what is compared, stored and logged —
 * never the typed text, because §16H.11 says `search_log` keeps the normalized
 * query only.
 */
create or replace function public.normalize_search_text(p_text text)
returns text
language plpgsql
immutable
as $$
declare
  v_text text;
begin
  if p_text is null or p_text = '' then
    return '';
  end if;

  -- 1. NFC. 2. Latin lower-case and accents stripped. 3. Zawgyi: the extended
  -- code points here, the general conversion in the client (`src/lib/zawgyi.ts`),
  -- which is what a query arriving at `search_all` has already been through.
  v_text := normalize(p_text, NFC);
  v_text := lower(private.unaccent_immutable(v_text));
  v_text := private.zawgyi_extended_to_unicode(v_text);

  -- 4. Zero-width characters, which a copy from a web page or a phone keyboard
  -- leaves behind and which make two identical strings compare unequal.
  v_text := translate(v_text, E'\u200B\u200C\u200D\u2060\uFEFF', '');

  -- 5. Combining marks into the standard order.
  v_text := private.order_myanmar_marks(v_text);

  -- 6. Myanmar digits ၀–၉ to ASCII. Shan digits (U+1090–U+1097) are left alone:
  -- they are also Zawgyi letters, so mapping them would corrupt text the
  -- detector declined to convert.
  v_text := translate(v_text, E'\u1040\u1041\u1042\u1043\u1044\u1045\u1046\u1047\u1048\u1049', '0123456789');

  -- 7. `,` `၊` `။` `.` `-` `/` become spaces, then collapse and trim.
  v_text := regexp_replace(v_text, '[,၊။.\-/]', ' ', 'g');
  v_text := regexp_replace(v_text, '[[:space:]]+', ' ', 'g');
  return btrim(v_text);
end;
$$;

-- ---------------------------------------------------------------------------
-- The distance formula (§16H.4). No PostGIS: one haversine keeps the deploy to
-- two extensions.
-- ---------------------------------------------------------------------------

create or replace function private.haversine_km(
  p_lat1 double precision,
  p_lng1 double precision,
  p_lat2 double precision,
  p_lng2 double precision
) returns double precision
language sql
immutable
as $$
  select round((
    6371 * 2 * asin(least(1, sqrt(
      power(sin(radians(p_lat2 - p_lat1) / 2), 2)
      + cos(radians(p_lat1)) * cos(radians(p_lat2))
        * power(sin(radians(p_lng2 - p_lng1) / 2), 2)
    )))
  )::numeric, 1)::double precision;
$$;

/**
 * §16H.9: Open Now in Myanmar Time, handles an overnight close, and treats an
 * unknown schedule as unknown — never as open. A listing whose opening and
 * closing times are equal is a 24-hour listing and always open.
 */
create or replace function private.is_open_now(
  p_open_time time,
  p_close_time time,
  p_at timestamptz default now()
) returns boolean
language sql
stable
as $$
  with local_time as (
    select (p_at at time zone 'Asia/Yangon')::time as t
  )
  select case
    when p_open_time is null or p_close_time is null then false
    when p_open_time = p_close_time then true
    when p_open_time < p_close_time then
      (select t >= p_open_time and t < p_close_time from local_time)
    else
      -- An overnight close: `22:00`–`02:00` is open either side of midnight.
      (select t >= p_open_time or t < p_close_time from local_time)
  end;
$$;

/** The same clock reading the page shows next to "closes at". */
create or replace function private.local_time_mmt(p_at timestamptz default now())
returns time
language sql
stable
as $$
  select (p_at at time zone 'Asia/Yangon')::time;
$$;

-- ---------------------------------------------------------------------------
-- The index (§16H.4).
-- ---------------------------------------------------------------------------

create table if not exists public.search_index (
  -- `<kind>:<ref_id>` for a row that belongs to one city, `<kind>:<ref_id>` with
  -- no city for a row that is national. Built here rather than derived on read
  -- so the primary key stays usable and a delete knows exactly what to remove.
  id text primary key,
  -- §16H.3's kinds, plus the four the Nearby reference (§12) also chips:
  -- guesthouses, bars, exchange, hospitals, clinics and gyms. A guesthouse and a
  -- hotel are different chips to a reader even though both sell a bed.
  kind text not null check (kind in (
    'hotels', 'guesthouses', 'restaurants', 'cafes', 'bars', 'attractions',
    'markets', 'bookshops', 'transport', 'rentals', 'exchange', 'hospitals',
    'clinics', 'gyms', 'blogs', 'guides', 'plans', 'cities'
  )),
  ref_id text not null,
  city_id text,
  category text,
  title_mm text not null default '',
  title_en text not null default '',
  subtitle_mm text not null default '',
  subtitle_en text not null default '',
  keywords text not null default '',
  -- §16H.4's `norm_text`: the normalized title, subtitle, keywords and body.
  norm_text text not null default '',
  -- The normalized title alone. §16H.7 scores the title's trigram similarity
  -- separately from the whole text's, and `norm_text` has both mixed together,
  -- so the title needs its own copy.
  norm_title text not null default '',
  tsv_en tsvector,
  boost_weight integer not null default 0 check (boost_weight between -20 and 50),
  rating numeric(2, 1),
  views integer not null default 0,
  latitude double precision,
  longitude double precision,
  open_time time,
  close_time time,
  thumbnail_url text,
  href text not null default '/',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists search_index_norm_text_idx
  on public.search_index using gin (norm_text gin_trgm_ops);
create index if not exists search_index_tsv_idx
  on public.search_index using gin (tsv_en);
create index if not exists search_index_kind_city_idx
  on public.search_index (kind, city_id);

alter table public.search_index enable row level security;

/** Tuning is staff work; the app reads the index through the functions below. */
drop policy if exists search_index_staff_read on public.search_index;
create policy search_index_staff_read on public.search_index
  for select using (
    public.current_role_name() in ('Super Admin', 'Admin', 'Rental Admin', 'Travel Guide Content Admin', 'Blog Post Admin')
  );

-- ---------------------------------------------------------------------------
-- Aliases (§16H.6: "aliases are data"). The same rows the browser seeds from
-- `SEED_SEARCH_ALIASES`, so an Admin edit moves both once the client reads the
-- table.
-- ---------------------------------------------------------------------------

create table if not exists public.search_aliases (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('city', 'category', 'synonym')),
  term text not null check (length(btrim(term)) > 0),
  target text not null check (length(btrim(target)) > 0),
  active boolean not null default true,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per term and role, so `hotel` cannot name two categories at once.
create unique index if not exists search_aliases_term_idx
  on public.search_aliases (kind, lower(btrim(term)));

alter table public.search_aliases enable row level security;

/** Admin and Super Admin hold the alias table (§16H.11). */
create or replace function public.is_search_tuner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in ('Super Admin', 'Admin');
$$;

drop policy if exists search_aliases_read on public.search_aliases;
create policy search_aliases_read on public.search_aliases
  for select using (true);

drop policy if exists search_aliases_write on public.search_aliases;
create policy search_aliases_write on public.search_aliases
  for all to authenticated
  using (public.is_search_tuner())
  with check (public.is_search_tuner());

/**
 * The table's `updated_at` only defaults, so an edit would keep the timestamp of
 * the insert and the tuning screen would show a row as unchanged after a save.
 */
create or replace function public.touch_search_alias()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists search_aliases_touch_updated_at on public.search_aliases;
create trigger search_aliases_touch_updated_at
  before update on public.search_aliases
  for each row execute function public.touch_search_alias();

-- ---------------------------------------------------------------------------
-- The log (§16H.11). The normalized query only: no user id, no IP.
-- ---------------------------------------------------------------------------

create table if not exists public.search_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  q_normalized text not null check (length(btrim(q_normalized)) > 0),
  lang text not null default 'en' check (lang in ('mm', 'en')),
  kind text,
  result_count integer not null default 0 check (result_count >= 0),
  clicked_ref text
);

create index if not exists search_log_at_idx on public.search_log (at desc);
create index if not exists search_log_query_idx on public.search_log (q_normalized);

alter table public.search_log enable row level security;

drop policy if exists search_log_staff_read on public.search_log;
create policy search_log_staff_read on public.search_log
  for select using (public.is_search_tuner());

-- ---------------------------------------------------------------------------
-- Writing the index. One helper per shape, called by the triggers below and by
-- `rebuild_search_index()`, so a rebuild and a trigger cannot disagree.
-- ---------------------------------------------------------------------------

/**
 * Inserts or updates one row. `boost_weight` is not overwritten: an Admin set
 * it, and a re-publish must not quietly undo the tuning.
 */
create or replace function private.search_put(
  p_id text,
  p_kind text,
  p_ref_id text,
  p_city_id text,
  p_category text,
  p_title_mm text,
  p_title_en text,
  p_subtitle_mm text,
  p_subtitle_en text,
  p_keywords text,
  p_body text,
  p_rating numeric,
  p_views integer,
  p_latitude double precision,
  p_longitude double precision,
  p_open_time time,
  p_close_time time,
  p_thumbnail_url text,
  p_href text,
  p_published_at timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_norm_title text;
  v_norm_text text;
  v_keep public.search_index;
begin
  v_norm_title := public.normalize_search_text(coalesce(p_title_mm, '') || ' ' || coalesce(p_title_en, ''));
  v_norm_text := public.normalize_search_text(
    concat_ws(' ',
      p_title_mm, p_title_en, p_subtitle_mm, p_subtitle_en, p_keywords,
      left(coalesce(p_body, ''), 2000)
    )
  );

  -- One object is one result. Two seed rows can carry the same URL under
  -- different ids (a Populars row and the catalogue row), and the browser index
  -- keys on the href for the same reason. Scoped to the city so a rental's
  -- per-city rows, which share one `/rentals?category=` link, both survive; the
  -- live edit wins, which is what an editor expects.
  --
  -- The row being replaced is read first because it may be the one that carries
  -- the pin: a Nearby seed row and a catalogue row share a URL, and only the
  -- first has a latitude. Deleting it outright left `search_nearby` answering 6
  -- rows where the page shows 18. The pin and the opening hours therefore carry
  -- over to whichever row survives, and a real coordinate always wins.
  select * into v_keep
    from public.search_index
   where kind = p_kind
     and href = coalesce(p_href, '/')
     and coalesce(city_id, '') = coalesce(p_city_id, '')
     and id <> p_id
   order by (latitude is not null) desc, (open_time is not null) desc
   limit 1;

  delete from public.search_index
   where kind = p_kind
     and href = coalesce(p_href, '/')
     and coalesce(city_id, '') = coalesce(p_city_id, '')
     and id <> p_id;

  insert into public.search_index (
    id, kind, ref_id, city_id, category, title_mm, title_en, subtitle_mm, subtitle_en,
    keywords, norm_text, norm_title, tsv_en, rating, views, latitude, longitude,
    open_time, close_time, thumbnail_url, href, published_at, updated_at
  ) values (
    p_id, p_kind, p_ref_id, p_city_id, p_category, coalesce(p_title_mm, ''), coalesce(p_title_en, ''),
    coalesce(p_subtitle_mm, ''), coalesce(p_subtitle_en, ''), coalesce(p_keywords, ''),
    v_norm_text, v_norm_title,
    to_tsvector('simple', coalesce(p_title_en, '') || ' ' || coalesce(p_subtitle_en, '') || ' ' || coalesce(p_keywords, '')),
    p_rating, coalesce(p_views, 0),
    coalesce(p_latitude, v_keep.latitude),
    coalesce(p_longitude, v_keep.longitude),
    coalesce(p_open_time, v_keep.open_time),
    coalesce(p_close_time, v_keep.close_time),
    p_thumbnail_url, coalesce(p_href, '/'), p_published_at, now()
  )
  on conflict (id) do update set
    kind = excluded.kind,
    ref_id = excluded.ref_id,
    city_id = excluded.city_id,
    category = excluded.category,
    title_mm = excluded.title_mm,
    title_en = excluded.title_en,
    subtitle_mm = excluded.subtitle_mm,
    subtitle_en = excluded.subtitle_en,
    keywords = excluded.keywords,
    norm_text = excluded.norm_text,
    norm_title = excluded.norm_title,
    tsv_en = excluded.tsv_en,
    rating = excluded.rating,
    views = excluded.views,
    -- A later row that carries no pin must not wipe the one the first had.
    latitude = coalesce(excluded.latitude, search_index.latitude),
    longitude = coalesce(excluded.longitude, search_index.longitude),
    open_time = coalesce(excluded.open_time, search_index.open_time),
    close_time = coalesce(excluded.close_time, search_index.close_time),
    thumbnail_url = excluded.thumbnail_url,
    href = excluded.href,
    published_at = excluded.published_at,
    updated_at = now();
end;
$$;

/**
 * A listing category as the kind it is searched under. One category is one kind,
 * so a chip's count and the chip's list can never disagree; `travel_guide` is
 * left out because the `travel_guides` table already indexes that content and
 * counting both would show the same page twice.
 */
create or replace function private.search_kind_for_category(p_category text)
returns text
language sql
immutable
as $$
  select case p_category
    when 'hotel' then 'hotels'
    when 'guesthouse' then 'guesthouses'
    when 'restaurant' then 'restaurants'
    when 'cafe' then 'cafes'
    when 'bar' then 'bars'
    when 'attraction' then 'attractions'
    when 'market' then 'markets'
    when 'book_shop' then 'bookshops'
    when 'rental' then 'rentals'
    when 'transport' then 'transport'
    when 'exchange' then 'exchange'
    when 'hospital' then 'hospitals'
    when 'clinic' then 'clinics'
    when 'gym' then 'gyms'
    else null
  end;
$$;

/**
 * One function per source table, so a publish, an edit, an unpublish and a
 * delete all reach the index the same way and within the same statement — which
 * is what makes §16H.13's five-second rule hold without a job (§16H.4).
 */

create or replace function private.search_sync_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kind text;
begin
  if tg_op = 'DELETE' then
    delete from public.search_index where ref_id = old.id and kind <> 'rentals';
    return old;
  end if;

  v_kind := private.search_kind_for_category(new.category);
  -- §16H.3: a draft, scheduled, suspended or failed item never enters the
  -- index, and a row that stops being active leaves it on the same write.
  if v_kind is null or new.status <> 'active' then
    delete from public.search_index where ref_id = new.id and kind <> 'rentals';
    return new;
  end if;

  perform private.search_put(
    v_kind || ':' || new.id,
    v_kind,
    new.id,
    new.city_id,
    new.category,
    new.name_mm,
    new.name_en,
    new.address,
    '',
    '',
    coalesce(new.description_mm, '') || ' ' || coalesce(new.description_en, ''),
    new.rating,
    new.views,
    new.latitude,
    new.longitude,
    new.open_time,
    new.close_time,
    new.image_url,
    new.href,
    null
  );
  return new;
end;
$$;

create or replace function private.search_sync_blog()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' or new.status <> 'Published' or new.deleted_at is not null
     or new.published_at is null or new.published_at > current_date then
    delete from public.search_index
     where kind = 'blogs' and ref_id = case when tg_op = 'DELETE' then old.id else new.id end;
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  perform private.search_put(
    'blogs:' || new.id, 'blogs', new.id, null, new.category,
    new.title_mm, new.title_en, new.excerpt_mm, new.excerpt_en,
    new.seo_tags, '', null, new.views, null, null, null, null,
    new.cover_url, '/blogs?story=' || new.slug, new.published_at::timestamptz
  );
  return new;
end;
$$;

create or replace function private.search_sync_guide()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' or new.status <> 'Published' or new.deleted_at is not null
     or new.published_at is null or new.published_at > current_date then
    delete from public.search_index
     where kind = 'guides' and ref_id = case when tg_op = 'DELETE' then old.id else new.id end;
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  perform private.search_put(
    'guides:' || new.id, 'guides', new.id, null, new.category,
    new.title_mm, new.title_en, new.summary_mm, new.summary_en, '',
    '', null, new.views, null, null, null, null,
    new.cover_url, '/travel-guide/' || new.id, new.published_at::timestamptz
  );
  return new;
end;
$$;

create or replace function private.search_sync_city()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' or new.active is not true then
    delete from public.search_index
     where kind = 'cities' and ref_id = case when tg_op = 'DELETE' then old.id else new.id end;
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  perform private.search_put(
    'cities:' || new.id, 'cities', new.id, new.id, 'city',
    new.name_mm, new.name_en, '', '', 'city destination',
    '', null, null, null, null, null, null, null, '/cities/' || new.id, null
  );
  return new;
end;
$$;

/**
 * A rental is searchable per city it is offered in (§16H.3), so the row id
 * carries the city and an availability change rewrites exactly those rows.
 */
create or replace function private.search_sync_rental_category()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.search_index where kind = 'rentals' and ref_id = old.id;
    return old;
  end if;

  delete from public.search_index where kind = 'rentals' and ref_id = new.id;
  if new.active is not true then
    return new;
  end if;

  insert into public.search_index (
    id, kind, ref_id, city_id, category, title_mm, title_en, subtitle_mm, subtitle_en,
    keywords, norm_text, norm_title, tsv_en, href, updated_at
  )
  select
    'rentals:' || new.id || ':' || a.city_id,
    'rentals',
    new.id,
    a.city_id,
    new.id,
    new.name_mm,
    new.name_en,
    '',
    '',
    'rental hire',
    public.normalize_search_text(new.name_mm || ' ' || new.name_en || ' rental hire ' || a.city_id),
    public.normalize_search_text(new.name_mm || ' ' || new.name_en),
    to_tsvector('simple', new.name_en || ' rental hire'),
    '/rentals?category=' || new.id,
    now()
  from public.rental_availability a
  where a.category_id = new.id
    and a.active is true;
  return new;
end;
$$;

/** An availability change moves the rental's city rows without touching others. */
create or replace function private.search_sync_rental_availability()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.search_index
     where kind = 'rentals' and ref_id = old.category_id
       and id = 'rentals:' || old.category_id || ':' || old.city_id;
    return old;
  end if;

  delete from public.search_index
   where kind = 'rentals' and ref_id = new.category_id
     and id = 'rentals:' || new.category_id || ':' || new.city_id;

  insert into public.search_index (
    id, kind, ref_id, city_id, category, title_mm, title_en, subtitle_mm, subtitle_en,
    keywords, norm_text, norm_title, tsv_en, href, updated_at
  )
  select
    'rentals:' || c.id || ':' || new.city_id,
    'rentals', c.id, new.city_id, c.id, c.name_mm, c.name_en, '', '', 'rental hire',
    public.normalize_search_text(c.name_mm || ' ' || c.name_en || ' rental hire ' || new.city_id),
    public.normalize_search_text(c.name_mm || ' ' || c.name_en),
    to_tsvector('simple', c.name_en || ' rental hire'),
    '/rentals?category=' || c.id,
    now()
  from public.rental_categories c
  where c.id = new.category_id
    and c.active is true
    and new.active is true;
  return new;
end;
$$;

drop trigger if exists search_sync_listing on public.listings;
create trigger search_sync_listing
  after insert or update or delete on public.listings
  for each row execute function private.search_sync_listing();

drop trigger if exists search_sync_blog on public.blog_posts;
create trigger search_sync_blog
  after insert or update or delete on public.blog_posts
  for each row execute function private.search_sync_blog();

drop trigger if exists search_sync_guide on public.travel_guides;
create trigger search_sync_guide
  after insert or update or delete on public.travel_guides
  for each row execute function private.search_sync_guide();

drop trigger if exists search_sync_city on public.rental_cities;
create trigger search_sync_city
  after insert or update or delete on public.rental_cities
  for each row execute function private.search_sync_city();

drop trigger if exists search_sync_rental_category on public.rental_categories;
create trigger search_sync_rental_category
  after insert or update or delete on public.rental_categories
  for each row execute function private.search_sync_rental_category();

drop trigger if exists search_sync_rental_availability on public.rental_availability;
create trigger search_sync_rental_availability
  after insert or update or delete on public.rental_availability
  for each row execute function private.search_sync_rental_availability();

/**
 * §16H.4: the whole index from the sources, for the Super Admin screen and for
 * the first deploy. It runs in one transaction, so a reader never sees half an
 * index, and it calls the same `search_put` the triggers call — a rebuild and a
 * publish therefore cannot disagree about what a row looks like.
 *
 * `boost_weight` survives a rebuild: an Admin set it and the sources do not
 * know about it. The table is emptied into a temporary copy of the weights
 * first and the weights are put back at the end.
 */
create or replace function private.rebuild_search_index_rows()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_row record;
begin
  create temporary table if not exists pg_temp.boost_keep on commit drop as
    select id, boost_weight from public.search_index where boost_weight <> 0;

  delete from public.search_index;

  for v_row in
    select l.* from public.listings l
    where l.status = 'active' and private.search_kind_for_category(l.category) is not null
    order by l.id
  loop
    perform private.search_put(
      private.search_kind_for_category(v_row.category) || ':' || v_row.id,
      private.search_kind_for_category(v_row.category),
      v_row.id, v_row.city_id, v_row.category, v_row.name_mm, v_row.name_en,
      v_row.address, '', '',
      coalesce(v_row.description_mm, '') || ' ' || coalesce(v_row.description_en, ''),
      v_row.rating, v_row.views, v_row.latitude, v_row.longitude,
      v_row.open_time, v_row.close_time, v_row.image_url, v_row.href, null
    );
  end loop;

  for v_row in
    select b.* from public.blog_posts b
    where b.status = 'Published' and b.deleted_at is null and b.published_at <= current_date
    order by b.id
  loop
    perform private.search_put(
      'blogs:' || v_row.id, 'blogs', v_row.id, null, v_row.category,
      v_row.title_mm, v_row.title_en, v_row.excerpt_mm, v_row.excerpt_en,
      v_row.seo_tags, '', null, v_row.views, null, null, null, null,
      v_row.cover_url, '/blogs?story=' || v_row.slug, v_row.published_at::timestamptz
    );
  end loop;

  for v_row in
    select g.* from public.travel_guides g
    where g.status = 'Published' and g.deleted_at is null and g.published_at <= current_date
    order by g.id
  loop
    perform private.search_put(
      'guides:' || v_row.id, 'guides', v_row.id, null, v_row.category,
      v_row.title_mm, v_row.title_en, v_row.summary_mm, v_row.summary_en,
      '', '', null, v_row.views, null, null, null, null,
      v_row.cover_url, '/travel-guide/' || v_row.id, v_row.published_at::timestamptz
    );
  end loop;

  for v_row in select c.* from public.rental_cities c where c.active order by c.id loop
    perform private.search_put(
      'cities:' || v_row.id, 'cities', v_row.id, v_row.id, 'city',
      v_row.name_mm, v_row.name_en, '', '', 'city destination',
      '', null, null, null, null, null, null, null, '/cities/' || v_row.id, null
    );
  end loop;

  insert into public.search_index (
    id, kind, ref_id, city_id, category, title_mm, title_en, subtitle_mm, subtitle_en,
    keywords, norm_text, norm_title, tsv_en, href, updated_at
  )
  select
    'rentals:' || c.id || ':' || a.city_id, 'rentals', c.id, a.city_id, c.id,
    c.name_mm, c.name_en, '', '', 'rental hire',
    public.normalize_search_text(c.name_mm || ' ' || c.name_en || ' rental hire ' || a.city_id),
    public.normalize_search_text(c.name_mm || ' ' || c.name_en),
    to_tsvector('simple', c.name_en || ' rental hire'),
    '/rentals?category=' || c.id, now()
  from public.rental_categories c
  join public.rental_availability a on a.category_id = c.id and a.active
  where c.active;

  update public.search_index s
     set boost_weight = k.boost_weight
    from pg_temp.boost_keep k
   where k.id = s.id;

  select count(*) into v_count from public.search_index;
  return v_count;
end;
$$;

/**
 * §16H.4's Super Admin rebuild. The row work is `private` so the migration can
 * seed the first index without a signed-in account — `current_role_name()` is
 * empty during a migration, and a role check there would make the file
 * unapplicable.
 */
create or replace function public.rebuild_search_index()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role_name() <> 'Super Admin' then
    raise exception 'common_error_forbidden' using errcode = 'P0001';
  end if;
  return private.rebuild_search_index_rows();
end;
$$;

revoke all on function public.rebuild_search_index() from public;
grant execute on function public.rebuild_search_index() to authenticated;

-- ---------------------------------------------------------------------------
-- Searching (§16H.6 to §16H.8).
-- ---------------------------------------------------------------------------

/** §16H.6: the query limit, and the one place it is written in SQL. */
create or replace function private.search_max_query_length()
returns integer
language sql
immutable
as $$
  select 80;
$$;

/**
 * Damerau–Levenshtein within one edit, so a single mistyped letter still names
 * its alias (§16H.6 "common variants", §16H.13 criterion 4: `hotle` finds
 * hotels). Only Latin words of four or more letters are considered — a Myanmar
 * syllable is several code points, so one edit there is far more likely to be a
 * different word.
 */
create or replace function private.within_one_edit(p_a text, p_b text)
returns boolean
language plpgsql
immutable
as $$
declare
  v_a text[] := regexp_split_to_array(p_a, '');
  v_b text[] := regexp_split_to_array(p_b, '');
  v_rows integer;
  v_cols integer;
  v_grid integer[][];
  i integer;
  j integer;
  v_cost integer;
begin
  if p_a = p_b then return true; end if;
  if abs(length(p_a) - length(p_b)) > 1 then return false; end if;
  v_rows := coalesce(array_length(v_a, 1), 0) + 1;
  v_cols := coalesce(array_length(v_b, 1), 0) + 1;
  v_grid := array_fill(0, array[v_rows, v_cols]);
  for i in 1 .. v_rows loop
    v_grid[i][1] := i - 1;
  end loop;
  for j in 1 .. v_cols loop
    v_grid[1][j] := j - 1;
  end loop;
  for i in 2 .. v_rows loop
    for j in 2 .. v_cols loop
      v_cost := case when v_a[i - 1] = v_b[j - 1] then 0 else 1 end;
      v_grid[i][j] := least(v_grid[i - 1][j] + 1, v_grid[i][j - 1] + 1, v_grid[i - 1][j - 1] + v_cost);
      if i > 2 and j > 2 and v_a[i - 1] = v_b[j - 2] and v_a[i - 2] = v_b[j - 1] then
        v_grid[i][j] := least(v_grid[i][j], v_grid[i - 2][j - 2] + 1);
      end if;
    end loop;
  end loop;
  return v_grid[v_rows][v_cols] <= 1;
end;
$$;

/**
 * §16H.6: a city alias and a category alias found in the query become filters
 * and are removed from the text part, longest term first so `hotels` does not
 * leave a stray `s`. The answer is one row: what is left to match on, and what
 * the aliases named.
 */
create or replace function private.interpret_search_query(p_q text)
returns table (q_city text, q_kind text, q_text text, q_mode text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_rest text;
  v_city text;
  v_kind text;
  v_alias record;
  v_word text;
  v_hits integer;
  v_hit_kind text;
  v_hit_target text;
begin
  v_rest := ' ' || public.normalize_search_text(p_q) || ' ';

  for v_alias in
    select a.kind as a_kind, a.target as a_target,
           public.normalize_search_text(a.term) as norm
    from public.search_aliases a
    where a.active
    order by length(public.normalize_search_text(a.term)) desc
  loop
    continue when v_alias.norm = '';
    continue when v_city is not null and v_kind is not null;

    -- A Latin alias must stand alone, or `bar` would fire inside `bagan`.
    if v_alias.norm ~ '^[a-z0-9 ]+$' then
      continue when position(' ' || v_alias.norm || ' ' in v_rest) = 0;
      if v_alias.a_kind = 'city' and v_city is null
         and exists (select 1 from public.rental_cities c where c.id = v_alias.a_target) then
        v_city := v_alias.a_target;
        v_rest := replace(v_rest, ' ' || v_alias.norm || ' ', ' ');
      elsif v_alias.a_kind = 'category' and v_kind is null then
        v_kind := v_alias.a_target;
        v_rest := replace(v_rest, ' ' || v_alias.norm || ' ', ' ');
      end if;
    else
      continue when position(v_alias.norm in v_rest) = 0;
      if v_alias.a_kind = 'city' and v_city is null
         and exists (select 1 from public.rental_cities c where c.id = v_alias.a_target) then
        v_city := v_alias.a_target;
        v_rest := replace(v_rest, v_alias.norm, ' ');
      elsif v_alias.a_kind = 'category' and v_kind is null then
        v_kind := v_alias.a_target;
        v_rest := replace(v_rest, v_alias.norm, ' ');
      end if;
    end if;
  end loop;

  -- §16H.6's "common variants": a single mistyped letter still names the alias,
  -- so `hotle` is the hotels category rather than a word that matches nothing.
  -- The answer has to be unambiguous, or a word sitting between two targets
  -- names neither.
  if v_city is null or v_kind is null then
    for v_word in select unnest(regexp_split_to_array(btrim(v_rest), '[[:space:]]+')) loop
      exit when v_city is not null and v_kind is not null;
      continue when v_word !~ '^[a-z]{4,}$';
      select count(distinct a.kind || ':' || a.target),
             min(a.kind), min(a.target)
        into v_hits, v_hit_kind, v_hit_target
      from public.search_aliases a
      where a.active
        and public.normalize_search_text(a.term) ~ '^[a-z]{4,}$'
        and private.within_one_edit(public.normalize_search_text(a.term), v_word);
      continue when v_hits <> 1;
      if v_hit_kind = 'city' and v_city is null
         and exists (select 1 from public.rental_cities c where c.id = v_hit_target) then
        v_city := v_hit_target;
      elsif v_hit_kind = 'category' and v_kind is null then
        v_kind := v_hit_target;
      else
        continue;
      end if;
      v_rest := replace(v_rest, v_word, ' ');
    end loop;
  end if;

  q_text := btrim(regexp_replace(v_rest, '[[:space:]]+', ' ', 'g'));
  q_city := v_city;
  q_kind := v_kind;
  q_mode := case
    when v_city is not null and v_kind is not null then 'city_category'
    when v_city is not null then 'city'
    when v_kind is not null then 'category'
    when q_text = '' then 'browse'
    else 'text'
  end;
  return next;
end;
$$;

/**
 * §16H.7's score table, in its order. Every part is a sum, so a boosted item
 * still wins on relevance rather than on the boost alone. `similarity()` is
 * `pg_trgm`'s, which is the only fuzzy match that works on Myanmar text.
 */
create or replace function private.search_score(
  p_row public.search_index,
  p_text text,
  p_city text,
  p_kind text,
  p_now timestamptz
) returns double precision
language sql
stable
as $$
  select
    case
      when p_text is null or p_text = '' then 0
      else
        (case when p_row.norm_title = p_text then 100 else 0 end)
      + (case when p_row.norm_title like p_text || '%' then 60 else 0 end)
      + similarity(p_row.norm_title, p_text) * 50
      + similarity(p_row.norm_text, p_text) * 20
      + coalesce(ts_rank(p_row.tsv_en, plainto_tsquery('simple', p_text)), 0) * 20
    end
  + (case when p_city is not null and p_row.city_id = p_city then 10 else 0 end)
  + (case when p_kind is not null and p_row.kind = p_kind then 10 else 0 end)
  + coalesce(p_row.rating, 0) * 2
  + least(8, log(greatest(p_row.views, 0) + 1) * 2)
  + (case
       when p_row.kind in ('blogs', 'guides')
        and coalesce(p_row.published_at, p_now) >= p_now - interval '30 days'
       then 5 else 0
     end)
  + p_row.boost_weight;
$$;

/**
 * §16H.7's candidate test: the query is a substring of `norm_text`, the title's
 * trigram similarity is at least 0.3, or the English full-text query matches.
 */
create or replace function private.search_is_candidate(p_row public.search_index, p_text text)
returns boolean
language sql
stable
as $$
  select p_text is null or p_text = ''
    or position(p_text in p_row.norm_text) > 0
    or similarity(p_row.norm_title, p_text) >= 0.3
    or p_row.tsv_en @@ plainto_tsquery('simple', p_text);
$$;

/**
 * `search_all()` (§16G.3). One function for every kind, so the page's chips,
 * cards and counts all read the same rows. `counts` and `city_counts` are taken
 * after the filters, so a chip never promises more than its list shows.
 *
 * `p_lang` picks the title and subtitle language, falling back to the other, so
 * a row with only an English title still answers a Myanmar query.
 */
create or replace function public.search_all(
  p_q text default '',
  p_lang text default 'en',
  p_city text default null,
  p_kinds text[] default null,
  p_sort text default 'relevance',
  p_lat numeric default null,
  p_lng numeric default null,
  p_limit integer default 20,
  p_offset integer default 0
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_q text := coalesce(p_q, '');
  v_interpreted record;
  v_text text;
  v_city text := nullif(btrim(coalesce(p_city, '')), '');
  v_kind text;
  v_sort text := coalesce(nullif(btrim(coalesce(p_sort, '')), ''), 'relevance');
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_items jsonb;
  v_counts jsonb;
  v_city_counts jsonb;
  v_total integer;
begin
  -- §16H.6 and §16G.2's search codes. A refusal is a code for `t()`, never an
  -- empty list that would read as "no matches".
  if length(v_q) > private.search_max_query_length() then
    raise exception 'search_error_query_too_long' using errcode = 'P0001';
  end if;
  if v_sort not in ('relevance', 'rating', 'nearest', 'newest') then
    raise exception 'search_error_bad_sort' using errcode = 'P0001';
  end if;
  if v_sort = 'nearest' and (p_lat is null or p_lng is null) then
    raise exception 'search_error_location_required' using errcode = 'P0001';
  end if;

  select * into v_interpreted from private.interpret_search_query(v_q);
  v_text := v_interpreted.q_text;
  v_kind := v_interpreted.q_kind;

  -- §16H.6: a category-only query plus a chosen city is that category in that
  -- city, the same as typing both. Without this the page re-renders its own
  -- city cards when the reader clicks one.
  if v_city is not null and v_kind is not null and v_interpreted.q_city is null then
    v_interpreted.q_city := v_city;
    v_interpreted.q_mode := 'city_category';
  end if;

  -- The filtered set, built once and read four times: the page, the total, the
  -- per-kind counts and the per-city counts. Counts are taken after the filters,
  -- so a chip never promises more than its list shows (§16H.13 criterion 10).
  with matched as (
    select s.*,
           case
             when p_lat is not null and p_lng is not null then
               private.haversine_km(p_lat::double precision, p_lng::double precision,
                                    coalesce(s.latitude, 0), coalesce(s.longitude, 0))
             else null
           end as distance_km,
           private.search_score(s, v_text, v_interpreted.q_city, v_kind, now()) as score
    from public.search_index s
    where (v_kind is null or s.kind = v_kind)
      and (v_interpreted.q_city is null or s.city_id = v_interpreted.q_city)
      and (v_city is null or s.city_id = v_city)
      and (p_kinds is null or s.kind = any (p_kinds))
      and private.search_is_candidate(s, v_text)
  )
  select coalesce(jsonb_agg(
           jsonb_build_object(
             'kind', p.kind, 'ref_id', p.ref_id,
             'title', case when p_lang = 'mm' then coalesce(nullif(p.title_mm, ''), p.title_en)
                           else coalesce(nullif(p.title_en, ''), p.title_mm) end,
             'title_mm', p.title_mm, 'title_en', p.title_en,
             'subtitle', case when p_lang = 'mm' then coalesce(nullif(p.subtitle_mm, ''), p.subtitle_en)
                              else coalesce(nullif(p.subtitle_en, ''), p.subtitle_mm) end,
             'href', p.href, 'thumbnail_url', p.thumbnail_url, 'city_id', p.city_id,
             'rating', p.rating, 'distance_km', p.distance_km, 'score', p.score,
             'open_now', private.is_open_now(p.open_time, p.close_time, now()),
             'closes_at', p.close_time,
             'published_at', p.published_at
           ) order by p.rank_key
         ), '[]'::jsonb),
         (select count(*) from matched)
    into v_items, v_total
  from (
    select m.*,
           row_number() over (
             order by
               case when v_sort = 'rating' then m.rating end desc nulls last,
               case when v_sort = 'nearest' then m.distance_km end asc nulls last,
               case when v_sort = 'newest' then m.published_at end desc nulls last,
               m.score desc,
               case when v_sort = 'relevance' and p_lat is not null then m.distance_km end asc nulls last,
               m.rating desc nulls last,
               m.title_en asc
           ) as rank_key
    from matched m
  ) p
  where p.rank_key > v_offset and p.rank_key <= v_offset + v_limit;

  select coalesce(jsonb_object_agg(k.kind, k.n), '{}'::jsonb)
    into v_counts
  from (
    select s.kind, count(*) as n
    from public.search_index s
    where (v_kind is null or s.kind = v_kind)
      and (v_interpreted.q_city is null or s.city_id = v_interpreted.q_city)
      and (v_city is null or s.city_id = v_city)
      and (p_kinds is null or s.kind = any (p_kinds))
      and private.search_is_candidate(s, v_text)
    group by s.kind
  ) k;

  select coalesce(jsonb_object_agg(c.city_id, c.n), '{}'::jsonb)
    into v_city_counts
  from (
    select s.city_id, count(*) as n
    from public.search_index s
    where s.city_id is not null
      and (v_kind is null or s.kind = v_kind)
      and (v_city is null or s.city_id = v_city)
      and (p_kinds is null or s.kind = any (p_kinds))
      and private.search_is_candidate(s, v_text)
    group by s.city_id
  ) c;

  return jsonb_build_object(
    'items', v_items,
    'counts', v_counts,
    'interpreted', jsonb_build_object(
      'mode', v_interpreted.q_mode,
      'city', v_interpreted.q_city,
      'kind', v_kind,
      'text', v_text
    ),
    'city_counts', v_city_counts,
    'next_offset', case when v_offset + v_limit < v_total then v_offset + v_limit else null end
  );
end;
$$;

/**
 * `search_suggest()` (§16H.8): the two-character prefix suggestions the page
 * offers, plus a matching alias, best first.
 */
create or replace function public.search_suggest(
  p_prefix text,
  p_lang text default 'en',
  p_limit integer default 8
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_norm text := public.normalize_search_text(coalesce(p_prefix, ''));
  v_limit integer := least(greatest(coalesce(p_limit, 8), 1), 20);
  v_rows jsonb;
begin
  if length(v_norm) < 2 then
    return '[]'::jsonb;
  end if;

  with hits as (
    select
      case when p_lang = 'mm' then coalesce(nullif(s.title_mm, ''), s.title_en)
                               else coalesce(nullif(s.title_en, ''), s.title_mm) end as text,
      s.kind,
      s.href,
      1000 as weight
    from public.search_index s
    where s.norm_text like '%' || v_norm || '%'
       or similarity(s.norm_title, v_norm) >= 0.3
    union all
    select a.term, a.kind, null, 2000
    from public.search_aliases a
    where a.active and public.normalize_search_text(a.term) like v_norm || '%'
  ), ranked as (
    select distinct on (text) text, kind, href, weight
    from hits
    where text is not null and text <> ''
    order by text, weight desc
  )
  select coalesce(jsonb_agg(jsonb_build_object('text', r.text, 'kind', r.kind, 'href', r.href) order by r.weight desc, r.text), '[]'::jsonb)
    into v_rows
  from (select * from ranked order by weight desc, text limit v_limit) r;

  return v_rows;
end;
$$;

/**
 * `search_nearby()` (§16H.9): the items inside the radius, nearest first, with
 * `distance_km`, `open_now` and `closes_at`. Open Now is computed in Myanmar
 * Time; an unknown schedule is never open.
 */
create or replace function public.search_nearby(
  p_lat numeric,
  p_lng numeric,
  p_radius_km numeric default 10,
  p_kinds text[] default null,
  p_open_now boolean default false,
  p_limit integer default 20,
  p_offset integer default 0,
  p_lang text default 'en'
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_radius numeric := greatest(coalesce(p_radius_km, 10), 0.1);
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_items jsonb;
begin
  if p_lat is null or p_lng is null then
    raise exception 'search_error_location_required' using errcode = 'P0001';
  end if;

  with near as (
    select s.*,
           private.haversine_km(p_lat::double precision, p_lng::double precision,
                                coalesce(s.latitude, 0), coalesce(s.longitude, 0)) as distance_km,
           private.is_open_now(s.open_time, s.close_time, now()) as open_now
    from public.search_index s
    where s.latitude is not null
      and s.longitude is not null
      and (p_kinds is null or s.kind = any (p_kinds))
  ), inside as (
    select * from near where distance_km <= v_radius
  )
  -- The item shape is `search_all`'s (§16H.7) plus `distance_km`, `open_now`
  -- and `closes_at`. It is built field by field rather than by stripping the
  -- row: `to_jsonb(i)` carried `title_en`/`title_mm` and no `title`, so a page
  -- reading the documented shape drew a card with no name on it.
  select coalesce(jsonb_agg(
           jsonb_build_object(
             'kind', i.kind,
             'ref_id', i.ref_id,
             'title', case when p_lang = 'mm' then coalesce(nullif(i.title_mm, ''), i.title_en)
                           else coalesce(nullif(i.title_en, ''), i.title_mm) end,
             'subtitle', case when p_lang = 'mm' then coalesce(nullif(i.subtitle_mm, ''), i.subtitle_en)
                              else coalesce(nullif(i.subtitle_en, ''), i.subtitle_mm) end,
             'address', coalesce(nullif(i.subtitle_mm, ''), nullif(i.subtitle_en, '')),
             'href', i.href,
             'thumbnail_url', i.thumbnail_url,
             'city_id', i.city_id,
             'rating', i.rating,
             'latitude', i.latitude,
             'longitude', i.longitude,
             'distance_km', round(i.distance_km::numeric, 1),
             'open_now', i.open_now,
             'closes_at', case when i.close_time is null then null else to_char(i.close_time, 'HH24:MI') end
           ) order by i.distance_km, i.rating desc nulls last
         ), '[]'::jsonb)
    into v_items
  from (
    select * from inside
    where (not p_open_now) or open_now
    order by distance_km, rating desc nulls last
    offset v_offset limit v_limit
  ) i;

  return jsonb_build_object('items', v_items);
end;
$$;

/** §16H.11: an Admin pins one item up or down in the ranking, −20…50. */
create or replace function public.set_search_boost(
  p_kind text,
  p_ref_id text,
  p_boost integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
begin
  if not public.is_search_tuner() then
    raise exception 'common_error_forbidden' using errcode = 'P0001';
  end if;
  if p_boost is null or p_boost < -20 or p_boost > 50 then
    raise exception 'search_error_bad_sort' using errcode = 'P0001';
  end if;

  update public.search_index
     set boost_weight = p_boost, updated_at = now()
   where kind = p_kind and ref_id = p_ref_id
  returning to_jsonb(search_index) - 'norm_text' - 'norm_title' - 'tsv_en' into v_row;

  if v_row is null then
    raise exception 'common_error_not_found' using errcode = 'P0001';
  end if;
  return v_row;
end;
$$;

/**
 * §16H.11: `get_search_report`. No events means no rows, never a sample
 * (§3A.2 rule 4), and a click-through of zero is zero, not an error.
 */
create or replace function public.get_search_report(
  p_from date,
  p_to date
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_top jsonb;
  v_zero jsonb;
  v_impressions integer;
  v_clicks integer;
begin
  if not public.is_search_tuner() then
    raise exception 'common_error_forbidden' using errcode = 'P0001';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('query', t.q, 'searches', t.n, 'clicks', t.clicks) order by t.n desc), '[]'::jsonb)
    into v_top
  from (
    select l.q_normalized as q, count(*) as n,
           count(l.clicked_ref) as clicks
    from public.search_log l
    where l.at >= p_from::timestamptz and l.at < (p_to + 1)::timestamptz
    group by l.q_normalized
    order by n desc
    limit 10
  ) t;

  select coalesce(jsonb_agg(jsonb_build_object('query', z.q, 'searches', z.n) order by z.n desc), '[]'::jsonb)
    into v_zero
  from (
    select l.q_normalized as q, count(*) as n
    from public.search_log l
    where l.at >= p_from::timestamptz and l.at < (p_to + 1)::timestamptz
      and l.result_count = 0
    group by l.q_normalized
    order by n desc
    limit 10
  ) z;

  select count(*), count(clicked_ref) into v_impressions, v_clicks
  from public.search_log l
  where l.at >= p_from::timestamptz and l.at < (p_to + 1)::timestamptz;

  return jsonb_build_object(
    'top_queries', v_top,
    'zero_result_queries', v_zero,
    'click_through', case when v_impressions = 0 then 0
                          else round(v_clicks::numeric * 100 / v_impressions, 1) end
  );
end;
$$;

/**
 * §16H.11: the page records what was searched, without a user id or an IP. A
 * click is a later update on the row the search wrote, keyed by its id, so the
 * log can never be joined back to a reader.
 */
create or replace function public.log_search(
  p_q text,
  p_lang text default 'en',
  p_kind text default null,
  p_result_count integer default 0
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_norm text := public.normalize_search_text(coalesce(p_q, ''));
  v_id uuid;
begin
  if v_norm = '' or length(v_norm) > private.search_max_query_length() + 20 then
    return null;
  end if;

  insert into public.search_log (q_normalized, lang, kind, result_count)
  values (v_norm, case when p_lang = 'mm' then 'mm' else 'en' end, p_kind, greatest(coalesce(p_result_count, 0), 0))
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.log_search_click(p_id uuid, p_ref text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.search_log set clicked_ref = left(coalesce(p_ref, ''), 120) where id = p_id;
end;
$$;

/** §16H.11: the log is kept 90 days. Safe to run twice. */
create or replace function public.purge_old_search_log()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.search_log where at < now() - interval '90 days';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'search-log-retention',
      '17 3 * * *',
      $cron$select public.purge_old_search_log();$cron$
    );
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- The seed (§16H.6): the city and category aliases the client already carries,
-- plus the common variants the Plan names. `on conflict do nothing` so an Admin
-- edit survives a rerun.
-- ---------------------------------------------------------------------------

insert into public.search_aliases (kind, term, target) values
  ('category', 'hotel', 'hotels'), ('category', 'hotels', 'hotels'),
  ('category', 'ဟိုတယ်', 'hotels'), ('category', 'ဟိုတယ်များ', 'hotels'),
  ('category', 'restaurant', 'restaurants'), ('category', 'restaurants', 'restaurants'),
  ('category', 'စားသောက်ဆိုင်', 'restaurants'),
  ('category', 'book', 'bookshops'), ('category', 'bookshop', 'bookshops'),
  ('category', 'bookshops', 'bookshops'),
  ('category', 'cafe', 'cafes'), ('category', 'cafes', 'cafes'),
  ('category', 'ကဖေး', 'cafes'),
  ('category', 'rental', 'rentals'), ('category', 'rentals', 'rentals'),
  ('category', 'ငှားရမ်း', 'rentals'),
  ('category', 'attraction', 'attractions'), ('category', 'attractions', 'attractions'),
  ('category', 'market', 'markets'), ('category', 'markets', 'markets'),
  ('category', 'ဈေး', 'markets'),
  ('category', 'guesthouse', 'guesthouses'), ('category', 'guesthouses', 'guesthouses'),
  ('category', 'bar', 'bars'), ('category', 'bars', 'bars'),
  ('category', 'exchange', 'exchange'), ('category', 'hospital', 'hospitals'),
  ('category', 'hospitals', 'hospitals'), ('category', 'clinic', 'clinics'),
  ('category', 'clinics', 'clinics'), ('category', 'gym', 'gyms'), ('category', 'gyms', 'gyms'),
  ('category', 'plan', 'plans'), ('category', 'plans', 'plans'),
  ('category', 'guide', 'guides'), ('category', 'guides', 'guides'),
  ('category', 'blog', 'blogs'), ('category', 'blogs', 'blogs'),
  ('city', 'yangon', 'yangon'), ('city', 'ရန်ကုန်', 'yangon'), ('city', 'rangoon', 'yangon'),
  ('city', 'bago', 'bago'), ('city', 'ပဲခူး', 'bago'),
  ('city', 'naypyidaw', 'naypyidaw'), ('city', 'nay pyi taw', 'naypyidaw'),
  ('city', 'နေပြည်တော်', 'naypyidaw'),
  ('city', 'mandalay', 'mandalay'), ('city', 'မန္တလေး', 'mandalay'),
  ('city', 'bagan', 'bagan'), ('city', 'pagan', 'bagan'), ('city', 'ပုဂံ', 'bagan'),
  ('city', 'inle', 'inle'), ('city', 'အင်းလေး', 'inle')
on conflict do nothing;

-- The first index, so a freshly applied project can search before any row is
-- written. The same rows a rebuild writes, so this is not a second code path.
select private.rebuild_search_index_rows();
