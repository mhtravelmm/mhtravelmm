-- Plan §4 analytics: "views and applies per template" was the one part of the
-- template system the rendered page did not record. `src/lib/templateStats.ts`
-- is the client mirror of the counting rules below and
-- `src/lib/shopTemplateStore.ts` is the browser stand-in for this table.

create table if not exists public.shop_template_events (
  id text primary key,
  template_id text not null references public.shop_templates (id) on delete cascade,
  shop_id text not null,
  kind text not null check (kind in ('view', 'apply')),
  -- One per page view, so a re-render or a language switch is not a second
  -- view. The client dedupes on this key before it writes.
  session_hash text not null,
  language text check (language in ('mm', 'en')),
  at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- §4: one view per template per page view, and one apply per switch. A unique
-- index makes a retried beacon a no-op rather than a double count.
create unique index if not exists shop_template_events_once_per_session
  on public.shop_template_events (session_hash, template_id, kind);

create index if not exists shop_template_events_template_idx
  on public.shop_template_events (template_id, at desc);

create index if not exists shop_template_events_shop_idx
  on public.shop_template_events (shop_id, at desc);

-- The purge job reads this one: everything older than the retention window.
create index if not exists shop_template_events_at_idx
  on public.shop_template_events (at);

-- §4 analytics: the per-template totals the catalog report shows. A security
-- definer function, because the public page that records a view cannot read
-- every row and should not be able to.
create or replace function public.template_usage(p_since timestamptz default now() - interval '180 days')
returns table (
  template_id text,
  views bigint,
  applies bigint,
  apply_rate numeric,
  last_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select e.template_id,
         count(*) filter (where e.kind = 'view') as views,
         count(*) filter (where e.kind = 'apply') as applies,
         case
           when count(*) filter (where e.kind = 'view') = 0 then 0
           else round(
             100.0 * count(*) filter (where e.kind = 'apply')
             / count(*) filter (where e.kind = 'view'),
             1)
         end as apply_rate,
         max(e.at) as last_at
    from public.shop_template_events e
   where e.at >= p_since
   group by e.template_id
   order by views desc, e.template_id;
$$;

-- §16B.7 `template_events_purge`: keeps 180 days and nothing older, so the
-- report stays a recent-usage view rather than an archive.
create or replace function public.purge_template_events(p_days integer default 180)
returns integer
language plpgsql
as $$
declare
  removed integer;
begin
  delete from public.shop_template_events
   where at < now() - make_interval(days => p_days);
  get diagnostics removed = row_count;
  return removed;
end;
$$;

-- §16B.7: the daily purge job calls this, so the count lands in `job_runs`
-- instead of a browser's local storage.
grant execute on function public.purge_template_events(integer) to service_role;

alter table public.shop_template_events enable row level security;

-- A shopper records a view without being signed in, so an anonymous insert is
-- allowed — but only a view, and only for a template that is live. Everything
-- that reads the rows is staff or the definer function above.
drop policy if exists shop_template_events_insert on public.shop_template_events;
create policy shop_template_events_insert on public.shop_template_events
  for insert to anon, authenticated
  with check (
    kind = 'view'
    and exists (
      select 1 from public.shop_templates t
       where t.id = template_id and t.status <> 'draft'
    )
  );

-- §16B.1: an owner records an apply for their own shop and reads their own
-- rows; Super Admin and Payment Admin read everything.
drop policy if exists shop_template_events_apply on public.shop_template_events;
create policy shop_template_events_apply on public.shop_template_events
  for insert to authenticated
  with check (
    kind = 'apply'
    and exists (
      select 1 from public.shop_page_settings s
       where s.shop_id = shop_id and public.owns_shop(s.owner_name)
    )
  );

drop policy if exists shop_template_events_read on public.shop_template_events;
create policy shop_template_events_read on public.shop_template_events
  for select using (
    public.current_role_name() in ('Super Admin', 'Payment Admin')
    or exists (
      select 1 from public.shop_page_settings s
       where s.shop_id = shop_id and public.owns_shop(s.owner_name)
    )
  );

-- §4's catalog grows toward the ten hotel designs the founder expects. Three
-- more rows, each differing from every other live hotel template on at least
-- four of the seven axes, which the trigger above enforces.
insert into public.shop_templates
  (id, category, name_mm, name_en, version, status, preview_image_key, price_mmk_month, is_free, traits)
values
  ('hotel_booking_focus', 'hotel', 'ကြိုတင်မှာယူမှု ဦးစား', 'Booking Focus', 1, 'active',
   'templates/hotel-booking-focus.webp', 2000, false,
   '{"layout":"booking_panel","navigation":"segmented_tabs","hero":"no_hero","catalog":"bookable_cards","bookingCta":"per_item_button","gallery":"horizontal_scroll","mobile":"segmented_tabs"}'),
  ('hotel_map_first', 'hotel', 'တည်နေရာ ဦးစား', 'Map First', 1, 'active',
   'templates/hotel-map-first.webp', 2000, false,
   '{"layout":"map_sidebar","navigation":"sticky_map","hero":"map_card","catalog":"definition_list","bookingCta":"sidebar_box","gallery":"side_thumbnails","mobile":"sidebar_collapsed"}'),
  ('hotel_story', 'hotel', 'ပုံပြင်', 'Story', 1, 'active',
   'templates/hotel-story.webp', 2000, false,
   '{"layout":"long_read","navigation":"none","hero":"no_hero_typographic","catalog":"numbered_list","bookingCta":"end_of_story","gallery":"interleaved","mobile":"long_read"}')
on conflict (id) do nothing;
