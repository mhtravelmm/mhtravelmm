-- Plan §16A.5 serving, §16A.9 access and §16B.7 the two ad jobs.
--
-- `20261125000100_ads.sql` carries the tables. This one adds the calls the
-- pages and the jobs make, and the staff policies the Adsboard needs: the
-- first migration turned RLS on but only gave the public a read, so an Ads
-- Admin could not write a campaign through the table at all.
--
-- The rules here are the server twin of `src/lib/adCampaigns.ts` and
-- `src/lib/adStats.ts`; `src/lib/adServing.test.ts` compares the two so an
-- edit on one side cannot leave the other behind.

-- ---------------------------------------------------------------------------
-- §16A.3 the placement catalog, seeded once. `on conflict do nothing` keeps a
-- toggle an admin already flipped: re-running the migration must not turn a
-- switched-off placement back on.
-- ---------------------------------------------------------------------------
insert into public.ad_placements (key, page, format, active, fallback_allowed, sort_order) values
  ('home_hero', 'home', 'wide_banner', true, true, 10),
  ('home_after_travel_plans', 'home', 'wide_banner', true, true, 20),
  ('home_after_hotels', 'home', 'wide_banner', true, true, 30),
  ('home_after_blogs', 'home', 'wide_banner', true, true, 40),
  ('home_after_reviews', 'home', 'wide_banner', true, true, 50),
  ('home_after_partners', 'home', 'wide_banner', true, true, 60),
  ('blog_post_top', 'blogs', 'wide_banner', true, true, 70),
  ('blog_inline', 'blogs', 'wide_banner', true, true, 80),
  ('blog_post_bottom', 'blogs', 'wide_banner', true, true, 90),
  ('rentals_top', 'rentals', 'compact_banner', true, true, 100),
  ('cities_top', 'cities', 'wide_banner', true, true, 110),
  ('city_after_cities', 'cities', 'wide_banner', true, true, 120),
  ('city_after_attractions', 'cities', 'wide_banner', true, true, 130),
  ('city_after_shopping', 'cities', 'wide_banner', true, true, 140),
  ('city_detail_after_restaurants', 'city_detail', 'wide_banner', true, true, 150),
  ('travel_plans_top', 'travel_plans', 'wide_banner', true, true, 160),
  ('travel_plan_detail_inline', 'travel_plan_detail', 'wide_banner', true, true, 170),
  ('nearby_top', 'nearby', 'wide_banner', true, true, 180),
  ('account_top', 'account', 'wide_banner', true, true, 190)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- §16A.5 step 1-3: one creative or nothing.
--
-- Step 1 is the placement's own toggle, so a switched-off placement serves
-- nothing even when a Live campaign is assigned to it. Step 2 is the window
-- and the approved creative. Step 3 takes the highest priority and, among
-- equals, draws by weight — the exponential race below is weighted sampling
-- without a loop, and `now()` is truncated to the minute so two requests in
-- the same minute see the same ad.
--
-- `fallback_allowed` comes back with the row because §16A.1 step 2 is the
-- page's decision: with no Admin ad and fallback on, the page asks AdSense.
--
-- `p_language` is the second argument the Plan names. It only chooses which
-- alt text comes back in `alt_text`; both languages are still required by
-- §16A.8 and both are still returned, so a reader that switches language
-- mid-session does not need a second round trip. An unknown value falls back
-- to Burmese rather than returning a null alt.
-- ---------------------------------------------------------------------------
drop function if exists public.serve_ad(text);
drop function if exists public.serve_ad(text, text);

create or replace function public.serve_ad(p_placement_key text, p_language text default 'mm')
returns table (
  creative_id text,
  campaign_id text,
  kind text,
  media_url text,
  click_url text,
  alt_mm text,
  alt_en text,
  alt_text text,
  advertiser_name text,
  fallback_allowed boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with placement as (
    select p.key, p.fallback_allowed
    from public.ad_placements p
    where p.key = p_placement_key and p.active
  ),
  candidates as (
    select
      c.id as creative_id,
      camp.id as campaign_id,
      c.kind,
      c.media_url,
      c.click_url,
      c.alt_mm,
      c.alt_en,
      camp.advertiser_name,
      camp.priority,
      camp.weight,
      -- Exponential race: the smallest key wins, in proportion to weight.
      -ln(1 - random()) / greatest(camp.weight, 1) as draw
    from placement
    join public.ad_assignments a on a.placement_key = placement.key
    join public.ad_campaigns camp on camp.id = a.campaign_id
    join public.ad_creatives c on c.campaign_id = camp.id and c.approval = 'approved'
    where camp.status = 'Live'
      and now() >= camp.start_at
      and now() < camp.end_at
      and c.kind in ('image', 'video')
  )
  select
    candidates.creative_id,
    candidates.campaign_id,
    candidates.kind,
    candidates.media_url,
    candidates.click_url,
    candidates.alt_mm,
    candidates.alt_en,
    case when p_language = 'en' then candidates.alt_en else candidates.alt_mm end,
    candidates.advertiser_name,
    placement.fallback_allowed
  from candidates, placement
  order by candidates.priority desc, candidates.draw asc
  limit 1;
$$;

-- The public calls `serve_ad` and nothing else: the ad tables stay closed.
revoke all on function public.serve_ad(text) from public;
revoke all on function public.serve_ad(text, text) from public;
grant execute on function public.serve_ad(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- §16A.5 click-through. The endpoint resolves the creative here so the click
-- is recorded by the database rather than by the browser, and a creative that
-- no longer exists returns no URL and the reader goes home.
-- ---------------------------------------------------------------------------
create or replace function public.record_ad_click(
  p_creative_id text,
  p_session_hash text,
  p_placement_key text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_creative public.ad_creatives;
  v_placement text;
begin
  select * into v_creative from public.ad_creatives where id = p_creative_id;
  if not found then
    return null;
  end if;

  -- A click is attributed to the placement the page passed, and to the
  -- campaign's first placement when it passed none, so a report never shows a
  -- click with no placement.
  v_placement := coalesce(
    nullif(p_placement_key, ''),
    (select a.placement_key from public.ad_assignments a where a.campaign_id = v_creative.campaign_id order by a.placement_key limit 1),
    ''
  );

  insert into public.ad_events (placement_key, campaign_id, creative_id, kind, session_hash, user_id)
  values (v_placement, v_creative.campaign_id, v_creative.id, 'click', coalesce(nullif(p_session_hash, ''), 'anonymous'), auth.uid())
  on conflict (session_hash, placement_key, creative_id, kind) do nothing;

  return v_creative.click_url;
end;
$$;

revoke all on function public.record_ad_click(text, text, text) from public;
grant execute on function public.record_ad_click(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- §16B.7 `ad_stats_rollup`: replaces every day it recomputes, so a rerun is
-- safe. Days are Myanmar Time, matching `myanmarDay()` in the client.
-- ---------------------------------------------------------------------------
create or replace function public.ad_stats_rollup(p_days integer default 2)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from date := ((now() at time zone 'Asia/Yangon')::date - greatest(p_days, 1));
  v_rows integer;
begin
  delete from public.ad_stats_daily where day >= v_from;

  insert into public.ad_stats_daily (day, placement_key, campaign_id, impressions, clicks)
  select
    (e.at at time zone 'Asia/Yangon')::date as day,
    e.placement_key,
    e.campaign_id,
    count(*) filter (where e.kind = 'impression')::integer,
    count(*) filter (where e.kind = 'click')::integer
  from public.ad_events e
  where (e.at at time zone 'Asia/Yangon')::date >= v_from
  group by 1, 2, 3
  on conflict (day, placement_key, campaign_id) do update
    set impressions = excluded.impressions,
        clicks = excluded.clicks,
        updated_at = now();

  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

-- ---------------------------------------------------------------------------
-- §16B.7 `ad_events_purge` and §16A.4: raw events are kept 90 days and no
-- more. The roll-up is the record after that.
-- ---------------------------------------------------------------------------
create or replace function public.ad_events_purge(p_days integer default 90)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rows integer;
begin
  delete from public.ad_events where at < now() - make_interval(days => greatest(p_days, 1));
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

revoke all on function public.ad_stats_rollup(integer) from public;
revoke all on function public.ad_events_purge(integer) from public;

-- ---------------------------------------------------------------------------
-- §16A.9 access. §16A.1 names exactly two roles that manage ads — Super Admin
-- and Ads Admin — so `Admin` is deliberately absent here even though it can
-- write other modules. Payment Admin reads the reports (events and the daily
-- roll-up) and writes nothing. Everyone else sees nothing at all, and the
-- public reaches ads only through `serve_ad` and `record_ad_click`.
-- ---------------------------------------------------------------------------
create or replace function public.can_manage_ads()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in ('Super Admin', 'Ads Admin');
$$;

create or replace function public.can_read_ad_reports()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_ads() or public.current_role_name() = 'Payment Admin';
$$;

drop policy if exists ad_advertisers_staff on public.ad_advertisers;
create policy ad_advertisers_staff on public.ad_advertisers
  for all to authenticated
  using (public.can_manage_ads())
  with check (public.can_manage_ads());

drop policy if exists ad_campaigns_staff on public.ad_campaigns;
create policy ad_campaigns_staff on public.ad_campaigns
  for all to authenticated
  using (public.can_manage_ads())
  with check (public.can_manage_ads());

drop policy if exists ad_creatives_staff on public.ad_creatives;
create policy ad_creatives_staff on public.ad_creatives
  for all to authenticated
  using (public.can_manage_ads())
  with check (public.can_manage_ads());

drop policy if exists ad_assignments_staff on public.ad_assignments;
create policy ad_assignments_staff on public.ad_assignments
  for all to authenticated
  using (public.can_manage_ads())
  with check (public.can_manage_ads());

drop policy if exists ad_placements_staff on public.ad_placements;
create policy ad_placements_staff on public.ad_placements
  for update to authenticated
  using (public.can_manage_ads())
  with check (public.can_manage_ads());

-- Payment Admin is the read-only row of the §16B.1 matrix, so the report
-- tables are readable by that role and writable by nobody but the roll-up job.
drop policy if exists ad_events_report_read on public.ad_events;
create policy ad_events_report_read on public.ad_events
  for select to authenticated
  using (public.can_read_ad_reports());

drop policy if exists ad_stats_report_read on public.ad_stats_daily;
create policy ad_stats_report_read on public.ad_stats_daily
  for select to authenticated
  using (public.can_read_ad_reports());
