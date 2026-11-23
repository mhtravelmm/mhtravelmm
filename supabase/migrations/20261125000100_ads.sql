-- Plan §16A.4 ads tables and §16A.5 serving rules.
--
-- The browser store in `src/lib/adStore.ts` mirrors these shapes, so moving
-- the Adsboard server-side replaces one seam rather than every call site.
--
-- Commercial model (§16A.12): a campaign carries an agreed flat fee, and
-- invoicing and payment are two separate ticks. There is no bid, no budget
-- burn and no auction — the Plan asks for a campaign that runs inside a window
-- at a priority, and the report answers impressions and clicks.

create table if not exists public.ad_advertisers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  -- The external invoice reference, so a payment can be matched by hand.
  billing_ref text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_campaigns (
  id text primary key,
  advertiser_id uuid references public.ad_advertisers (id) on delete set null,
  -- The advertiser name is copied onto the campaign because the reader-facing
  -- Sponsored label must survive an advertiser row being merged or renamed.
  advertiser_name text not null,
  name text not null,
  status text not null default 'Draft'
    check (status in ('Draft', 'Pending', 'Approved', 'Live', 'Paused', 'Ended', 'Rejected')),
  start_at timestamptz not null,
  end_at timestamptz not null,
  priority integer not null default 10,
  weight integer not null default 1 check (weight >= 1),
  -- §16A.12: agreed by hand, in MMK, and settled outside the app.
  agreed_fee_mmk integer not null default 0 check (agreed_fee_mmk >= 0),
  invoiced boolean not null default false,
  paid boolean not null default false,
  created_by uuid references auth.users (id),
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A campaign that ends before it starts can never serve.
  constraint ad_campaigns_window check (end_at > start_at),
  -- Approval is a fact with a time and an actor, so the two travel together.
  constraint ad_campaigns_approved_pair
    check ((approved_by is null) = (approved_at is null))
);

-- §16B.7 `ad_campaign_window` scans exactly this: Approved rows by start.
create index if not exists ad_campaigns_start_idx
  on public.ad_campaigns (start_at) where status = 'Approved';

create index if not exists ad_campaigns_end_idx
  on public.ad_campaigns (end_at) where status in ('Approved', 'Live');

create index if not exists ad_campaigns_serving_idx
  on public.ad_campaigns (status, start_at, end_at) where status = 'Live';

create table if not exists public.ad_creatives (
  id text primary key,
  campaign_id text not null references public.ad_campaigns (id) on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  media_url text not null,
  click_url text not null,
  alt_mm text not null,
  alt_en text not null,
  approval text not null default 'draft'
    check (approval in ('draft', 'pending', 'approved', 'rejected')),
  rejected_reason text not null default '',
  -- §16A.8: the size the upload Worker measured, kept for the report.
  bytes bigint not null default 0,
  -- §16A.8: a video is capped at 15 seconds, so its measured length is stored.
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- §16A.8: both languages are required, so an empty alt can never be stored.
  constraint ad_creatives_alt_present check (alt_mm <> '' and alt_en <> ''),
  -- §16A.8: https or an internal path, never javascript: or plain http.
  constraint ad_creatives_click_safe
    check (click_url like 'https://%' or (click_url like '/%' and click_url not like '//%'))
);

create index if not exists ad_creatives_campaign_idx on public.ad_creatives (campaign_id, approval);

create table if not exists public.ad_placements (
  key text primary key,
  page text not null,
  format text not null check (format in ('wide_banner', 'compact_banner')),
  -- §16A.1: a placement that is off serves nothing, not even a fallback.
  active boolean not null default true,
  -- §16A.1 order: Admin Ads, then AdSense/AdMob, then collapse.
  fallback_allowed boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_assignments (
  campaign_id text not null references public.ad_campaigns (id) on delete cascade,
  placement_key text not null references public.ad_placements (key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (campaign_id, placement_key)
);

-- The serving query reads assignments by placement, so the index runs that way.
create index if not exists ad_assignments_placement_idx on public.ad_assignments (placement_key);

create table if not exists public.ad_events (
  id uuid primary key default gen_random_uuid(),
  placement_key text not null,
  campaign_id text not null,
  creative_id text not null,
  kind text not null check (kind in ('impression', 'click')),
  at timestamptz not null default now(),
  -- One per page view; §16A.5 counts a creative once per session per view.
  session_hash text not null,
  user_id uuid references auth.users (id) on delete set null,
  -- §16A.5: the same creative cannot be counted twice on one page view.
  constraint ad_events_once unique (session_hash, placement_key, creative_id, kind)
);

-- §16B.7 `ad_events_purge` deletes by age; the roll-up groups by day.
create index if not exists ad_events_at_idx on public.ad_events (at);
create index if not exists ad_events_day_idx on public.ad_events (placement_key, campaign_id, at);

create table if not exists public.ad_stats_daily (
  day date not null,
  placement_key text not null,
  campaign_id text not null,
  impressions integer not null default 0,
  clicks integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (day, placement_key, campaign_id)
);

-- §16A.5: an impression is one per creative per session per page view, so the
-- duplicate refusal lives in the database as well as in the client.
create or replace function public.serve_ad(p_placement_key text)
returns table (
  creative_id text,
  campaign_id text,
  kind text,
  media_url text,
  click_url text,
  alt_mm text,
  alt_en text,
  advertiser_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, camp.id, c.kind, c.media_url, c.click_url, c.alt_mm, c.alt_en, camp.advertiser_name
  from public.ad_placements p
  join public.ad_assignments a on a.placement_key = p.key
  join public.ad_campaigns camp on camp.id = a.campaign_id
  join public.ad_creatives c on c.campaign_id = camp.id and c.approval = 'approved'
  where p.key = p_placement_key
    and p.active
    and camp.status = 'Live'
    and now() >= camp.start_at
    and now() < camp.end_at
  order by camp.priority desc, camp.weight desc, c.created_at asc
  limit 1;
$$;

-- §16A.6: the status machine, enforced at the table so a direct write cannot
-- skip a step. The client keeps the same table in `src/lib/adCampaigns.ts`.
create or replace function public.ad_campaign_status_guard()
returns trigger
language plpgsql
as $$
declare
  allowed text[];
begin
  if new.status = old.status then
    return new;
  end if;
  allowed := case old.status
    when 'Draft' then array['Pending']
    when 'Pending' then array['Approved', 'Rejected']
    when 'Approved' then array['Live']
    when 'Live' then array['Paused', 'Ended']
    when 'Paused' then array['Live']
    when 'Rejected' then array['Draft']
    else array[]::text[]
  end;
  if not (new.status = any (allowed)) then
    raise exception 'ad campaign cannot move % to %', old.status, new.status
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists ad_campaigns_status_guard on public.ad_campaigns;
create trigger ad_campaigns_status_guard
  before update of status on public.ad_campaigns
  for each row execute function public.ad_campaign_status_guard();

alter table public.ad_advertisers enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_creatives enable row level security;
alter table public.ad_placements enable row level security;
alter table public.ad_assignments enable row level security;
alter table public.ad_events enable row level security;
alter table public.ad_stats_daily enable row level security;

-- §16A.10: the public reads placements and serving rows only. Everything else
-- is written by the Adsboard through a staff-scoped policy, and raw events are
-- insert-only so a browser cannot rewrite history.
create policy ad_placements_public_read on public.ad_placements for select using (true);
create policy ad_events_insert_public on public.ad_events for insert with check (true);
create policy ad_stats_public_read on public.ad_stats_daily for select using (true);
