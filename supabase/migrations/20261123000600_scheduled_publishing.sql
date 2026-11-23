-- Plan §16B.7 `publish_due_content` and Plan §10 §4 Schedule.
--
-- Two jobs now have real data. This migration gives scheduled publishing a
-- table to run against once the jobs move server-side, and gives the client
-- store in `src/lib/contentStore.ts` the shape it mirrors. The columns match
-- the editor: `scheduled_for` is the UTC instant the editor's Myanmar wall
-- clock resolves to (`src/lib/scheduleRules.ts`), and `published_at` is only
-- set once the item is actually live.
--
-- Blog and Travel Guide share the publish/schedule/audit rules but not their
-- bodies, so the content lives in two tables with the same lifecycle columns.

create table if not exists public.blog_posts (
  id text primary key,
  slug text not null unique,
  status text not null check (status in ('Draft', 'Published', 'Scheduled')),
  category text not null,
  title_en text not null,
  title_mm text not null,
  excerpt_en text not null default '',
  excerpt_mm text not null default '',
  author_name text not null,
  location text not null default 'Myanmar',
  cover_key text,
  cover_url text not null default '',
  seo_tags text not null default '',
  -- The UTC instant the item goes live. Null for Draft and once published.
  scheduled_for timestamptz,
  published_at date,
  views integer not null default 0,
  version integer not null default 1,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- A Scheduled row must carry its instant; a Published row must carry its date.
  constraint blog_posts_schedule_present check (status <> 'Scheduled' or scheduled_for is not null),
  constraint blog_posts_published_dated check (status <> 'Published' or published_at is not null)
);

-- The publishing job scans exactly this: Scheduled rows by their instant.
create index if not exists blog_posts_due_idx
  on public.blog_posts (scheduled_for) where status = 'Scheduled';

create index if not exists blog_posts_public_idx
  on public.blog_posts (published_at desc) where status = 'Published' and deleted_at is null;

create table if not exists public.blog_blocks (
  id uuid primary key default gen_random_uuid(),
  post_id text not null references public.blog_posts (id) on delete cascade,
  position integer not null,
  kind text not null check (kind in ('text', 'image', 'ad')),
  text_en text not null default '',
  text_mm text not null default '',
  image_key text,
  image_url text not null default '',
  alt_en text not null default '',
  alt_mm text not null default '',
  caption text not null default '',
  credit text not null default '',
  unique (post_id, position)
);

create table if not exists public.travel_guides (
  id text primary key,
  slug text not null unique,
  status text not null check (status in ('Draft', 'Published', 'Scheduled')),
  category text not null check (category in ('myanmar', 'nature', 'adventure', 'culture', 'food', 'city_tour')),
  title_en text not null,
  title_mm text not null,
  summary_en text not null default '',
  summary_mm text not null default '',
  author_name text not null,
  author_id uuid references auth.users (id),
  cover_key text,
  cover_url text not null default '',
  duration_minutes integer,
  scheduled_for timestamptz,
  published_at date,
  views integer not null default 0,
  version integer not null default 1,
  needs_review boolean not null default false,
  created_by uuid references auth.users (id),
  updated_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint travel_guides_schedule_present check (status <> 'Scheduled' or scheduled_for is not null),
  constraint travel_guides_published_dated check (status <> 'Published' or published_at is not null)
);

create index if not exists travel_guides_due_idx
  on public.travel_guides (scheduled_for) where status = 'Scheduled';

create index if not exists travel_guides_public_idx
  on public.travel_guides (published_at desc) where status = 'Published' and deleted_at is null;

create table if not exists public.guide_stops (
  id uuid primary key default gen_random_uuid(),
  guide_id text not null references public.travel_guides (id) on delete cascade,
  position integer not null,
  -- Multi-day guides arrive later; the column exists from the start (Plan §3).
  day_number integer not null default 1,
  time_text text not null,
  time_minutes integer,
  listing_id text not null,
  title_en text not null,
  title_mm text not null,
  description_en text not null default '',
  description_mm text not null default '',
  image_key text,
  image_url text not null default '',
  unique (guide_id, day_number, position)
);

alter table public.blog_posts enable row level security;
alter table public.blog_blocks enable row level security;
alter table public.travel_guides enable row level security;
alter table public.guide_stops enable row level security;

-- The public reads published rows only, and never a scheduled one before its
-- time, which is what keeps a future post out of the site.
drop policy if exists blog_posts_public_read on public.blog_posts;
create policy blog_posts_public_read on public.blog_posts
  for select using (status = 'Published' and deleted_at is null);

drop policy if exists blog_blocks_public_read on public.blog_blocks;
create policy blog_blocks_public_read on public.blog_blocks
  for select using (
    exists (
      select 1 from public.blog_posts post
      where post.id = blog_blocks.post_id
        and post.status = 'Published'
        and post.deleted_at is null
    )
  );

drop policy if exists travel_guides_public_read on public.travel_guides;
create policy travel_guides_public_read on public.travel_guides
  for select using (status = 'Published' and deleted_at is null);

drop policy if exists guide_stops_public_read on public.guide_stops;
create policy guide_stops_public_read on public.guide_stops
  for select using (
    exists (
      select 1 from public.travel_guides guide
      where guide.id = guide_stops.guide_id
        and guide.status = 'Published'
        and guide.deleted_at is null
    )
  );

-- Plan §16B.1: the two content roles write their own content; Super Admin
-- writes both. Everyone else reads the published view.
create or replace function public.can_write_blog()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in ('Super Admin', 'Blog Post Admin');
$$;

create or replace function public.can_write_guides()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in ('Super Admin', 'Travel Guide Content Admin');
$$;

drop policy if exists blog_posts_editor_write on public.blog_posts;
create policy blog_posts_editor_write on public.blog_posts
  for all using (public.can_write_blog()) with check (public.can_write_blog());

drop policy if exists blog_blocks_editor_write on public.blog_blocks;
create policy blog_blocks_editor_write on public.blog_blocks
  for all using (public.can_write_blog()) with check (public.can_write_blog());

drop policy if exists travel_guides_editor_write on public.travel_guides;
create policy travel_guides_editor_write on public.travel_guides
  for all using (public.can_write_guides()) with check (public.can_write_guides());

drop policy if exists guide_stops_editor_write on public.guide_stops;
create policy guide_stops_editor_write on public.guide_stops
  for all using (public.can_write_guides()) with check (public.can_write_guides());

/**
 * Plan §16B.7 `publish_due_content`: flips every due row to Published and
 * returns how many of each it released. `security definer` because the job runs
 * as a role with no write policy of its own, and idempotent because the second
 * call finds nothing left in `Scheduled`.
 *
 * `published_at` is taken in Myanmar Time, so a post released at 00:30 local
 * does not carry yesterday's date from the UTC clock.
 */
create or replace function public.publish_due_content(p_now timestamptz default now())
returns table (blog integer, guide integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_blog integer;
  v_guide integer;
begin
  with due as (
    update public.blog_posts
       set status = 'Published',
           published_at = (p_now at time zone 'Asia/Yangon')::date,
           scheduled_for = null,
           updated_at = now()
     where status = 'Scheduled'
       and scheduled_for <= p_now
       and deleted_at is null
    returning 1
  )
  select count(*) into v_blog from due;

  with due as (
    update public.travel_guides
       set status = 'Published',
           published_at = (p_now at time zone 'Asia/Yangon')::date,
           scheduled_for = null,
           updated_at = now()
     where status = 'Scheduled'
       and scheduled_for <= p_now
       and deleted_at is null
    returning 1
  )
  select count(*) into v_guide from due;

  return query select v_blog, v_guide;
end;
$$;

-- Only the scheduler and the wrapper may publish; a signed-in editor publishes
-- by hand through the normal update policy and the audit trail it writes.
revoke all on function public.publish_due_content(timestamptz) from public;
grant execute on function public.publish_due_content(timestamptz) to service_role;
