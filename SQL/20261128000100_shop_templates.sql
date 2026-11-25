-- Plan §4: the Shop Owner template marketplace. A template is a presentation
-- layer over `ShopPageData`, so these tables hold the catalog, which template a
-- shop shows, and what the shop has paid for. `src/lib/shopTemplates.ts` is the
-- client mirror of the rules below until the client reads them, and §16D gates
-- Phase 3 on "a template switch and fallback work", which is
-- `resolve_shop_template()` below.

create table if not exists public.shop_templates (
  id text primary key,
  category text not null
    check (category in ('hotel', 'restaurant', 'cafe', 'book_shop', 'attraction')),
  name_mm text not null,
  name_en text not null,
  version integer not null default 1 check (version > 0),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'retired')),
  preview_image_key text not null default '',
  -- §4: 2,000 MMK per shop per month for every paid template, 0 for the free one.
  price_mmk_month integer not null default 2000 check (price_mmk_month >= 0),
  is_free boolean not null default false,
  -- The seven axes §4's "genuinely different" test measures.
  traits jsonb not null default '{}'::jsonb,
  previous_version_id text references public.shop_templates (id) on delete set null,
  replaced_by text references public.shop_templates (id) on delete set null,
  retire_notice_from timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_templates_free_price check (
    (is_free and price_mmk_month = 0) or (not is_free and price_mmk_month = 2000)
  )
);

-- §4: one free baseline per category, so a shop always has something to render.
create unique index if not exists shop_templates_one_free_per_category
  on public.shop_templates (category) where is_free;

create index if not exists shop_templates_active_idx
  on public.shop_templates (category, status);

-- There is no public.shops table yet, so an owner is scoped by the byline rule
-- `shop_subscriptions` and the notification feed already use.
create table if not exists public.shop_page_settings (
  shop_id text primary key,
  owner_name text not null default '',
  active_template_id text not null references public.shop_templates (id),
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_template_entitlements (
  id text primary key,
  shop_id text not null,
  owner_name text not null default '',
  template_id text not null references public.shop_templates (id),
  status text not null default 'active'
    check (status in ('active', 'grace', 'expired', 'cancelled')),
  period_start timestamptz not null,
  period_end timestamptz not null,
  grace_days integer not null default 7 check (grace_days >= 0),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint shop_template_entitlements_period check (period_end > period_start)
);

-- §4: the subscription grants one paid template at a time, so a shop holds one
-- live entitlement and switching templates reuses it.
create unique index if not exists shop_template_entitlements_live_per_shop
  on public.shop_template_entitlements (shop_id)
  where status in ('active', 'grace');

create table if not exists public.template_invoices (
  id text primary key,
  shop_id text not null,
  owner_name text not null default '',
  template_id text not null references public.shop_templates (id),
  amount_mmk integer not null check (amount_mmk >= 0),
  period_start timestamptz not null,
  period_end timestamptz not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  paid_at timestamptz,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint template_invoices_paid_stamp check (
    (status = 'paid' and paid_at is not null) or (status = 'unpaid' and paid_at is null)
  )
);

create index if not exists template_invoices_shop_idx
  on public.template_invoices (shop_id, period_end desc);

-- §16B.1 "O (own earnings)": an owner reads and writes only their own rows.
create or replace function public.owns_shop(p_owner_name text)
returns boolean
language sql
stable
as $$
  select coalesce(p_owner_name, '') <> ''
     and lower(btrim(p_owner_name)) = lower(btrim(public.current_display_name()));
$$;

create or replace function public.touch_shop_template()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists shop_templates_touch on public.shop_templates;
create trigger shop_templates_touch
  before update on public.shop_templates
  for each row execute function public.touch_shop_template();

drop trigger if exists shop_page_settings_touch on public.shop_page_settings;
create trigger shop_page_settings_touch
  before update on public.shop_page_settings
  for each row execute function public.touch_shop_template();

-- §4 "genuinely different": a template cannot go live until it differs from
-- every other live template of its category on four of the seven axes. A
-- recolor changes none of them, so the check refuses it rather than relying on
-- a reviewer remembering.
create or replace function public.assert_template_differentiated()
returns trigger
language plpgsql
as $$
declare
  other record;
  differing integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  for other in
    select id, traits from public.shop_templates
     where category = new.category
       and status = 'active'
       and id <> new.id
  loop
    select count(*) into differing
      from jsonb_object_keys(new.traits) as axis
     where new.traits ->> axis is distinct from other.traits ->> axis;

    if differing < 4 then
      raise exception
        'template % is too close to %: % differing axes, 4 required',
        new.id, other.id, differing
        using errcode = 'check_violation';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists shop_templates_differentiated on public.shop_templates;
create trigger shop_templates_differentiated
  before insert or update of status, traits on public.shop_templates
  for each row execute function public.assert_template_differentiated();

-- §4: the one read a shop page makes. The fallback chain is, in order: the
-- shop's own template while it is live and paid for, the previous version if it
-- was rolled back to `draft`, the replacement if it was retired past its 30-day
-- notice, and otherwise the free template. A retired or unpaid template never
-- breaks a shop, which is what §4 asks for.
create or replace function public.resolve_shop_template(p_shop_id text)
returns table (template_id text, reason text, notice_ends_on date)
language plpgsql
stable
as $$
declare
  settings_row public.shop_page_settings;
  active_template public.shop_templates;
  free_row public.shop_templates;
  fallback public.shop_templates;
  ent public.shop_template_entitlements;
  notice_end timestamptz;
begin
  select * into settings_row from public.shop_page_settings where shop_id = p_shop_id;
  select * into active_template from public.shop_templates where id = settings_row.active_template_id;

  if active_template.id is null then
    select * into free_row from public.shop_templates where is_free order by category limit 1;
    return query select coalesce(free_row.id, ''), 'free_default'::text, null::date;
    return;
  end if;

  select * into free_row from public.shop_templates
   where is_free and category = active_template.category;

  if active_template.status = 'draft' then
    select * into fallback from public.shop_templates
     where id = active_template.previous_version_id and status = 'active';
    if fallback.id is not null then
      return query select fallback.id, 'rolled_back'::text, null::date;
    else
      return query select coalesce(free_row.id, ''), 'free_default'::text, null::date;
    end if;
    return;
  end if;

  if active_template.status = 'retired' then
    notice_end := coalesce(active_template.retire_notice_from, now()) + interval '30 days';
    if now() < notice_end then
      return query select active_template.id, 'served'::text, notice_end::date;
      return;
    end if;
    select * into fallback from public.shop_templates
     where id = active_template.replaced_by and status = 'active';
    return query select coalesce(fallback.id, free_row.id, ''), 'retired_moved'::text, null::date;
    return;
  end if;

  if not active_template.is_free then
    select * into ent from public.shop_template_entitlements
     where shop_id = p_shop_id and status in ('active', 'grace')
     order by period_end desc limit 1;
    if ent.id is null or now() >= ent.period_end + make_interval(days => ent.grace_days) then
      return query select coalesce(free_row.id, ''), 'entitlement_lapsed'::text, null::date;
      return;
    end if;
  end if;

  return query select active_template.id, 'served'::text, null::date;
end;
$$;

-- §4: applying a paid template needs a live entitlement; switching between two
-- paid templates does not buy a second one.
create or replace function public.apply_shop_template(p_shop_id text, p_template_id text)
returns table (ok boolean, reason text)
language plpgsql
as $$
declare
  target public.shop_templates;
  current_template public.shop_templates;
  ent public.shop_template_entitlements;
begin
  select * into target from public.shop_templates where id = p_template_id;
  if target.id is null then
    return query select false, 'unknown_template'::text;
    return;
  end if;
  if target.status <> 'active' then
    return query select false, 'not_active'::text;
    return;
  end if;

  select t.* into current_template
    from public.shop_page_settings s
    join public.shop_templates t on t.id = s.active_template_id
   where s.shop_id = p_shop_id;

  if current_template.id is not null and current_template.category <> target.category then
    return query select false, 'wrong_category'::text;
    return;
  end if;

  if not target.is_free then
    select * into ent from public.shop_template_entitlements
     where shop_id = p_shop_id and status in ('active', 'grace')
     order by period_end desc limit 1;
    if ent.id is null or now() >= ent.period_end + make_interval(days => ent.grace_days) then
      return query select false, 'needs_payment'::text;
      return;
    end if;
  end if;

  insert into public.shop_page_settings (shop_id, owner_name, active_template_id, applied_at)
  values (p_shop_id, coalesce(current_template.owner_name, ''), p_template_id, now())
  on conflict (shop_id) do update
    set active_template_id = excluded.active_template_id,
        applied_at = excluded.applied_at;

  return query select true, 'applied'::text;
end;
$$;

-- §4: Payment Admin records a payment and the entitlement gains one month,
-- counted from the end of the period already paid for so paying early does not
-- shorten what the owner bought.
create or replace function public.record_template_payment(
  p_shop_id text,
  p_template_id text,
  p_invoice_id text
)
returns public.template_invoices
language plpgsql
as $$
declare
  template_row public.shop_templates;
  ent public.shop_template_entitlements;
  shop_owner text;
  start_at timestamptz;
  end_at timestamptz;
  invoice public.template_invoices;
begin
  select * into template_row from public.shop_templates where id = p_template_id;
  if template_row.id is null or template_row.is_free then
    raise exception 'template % cannot be paid for', p_template_id
      using errcode = 'check_violation';
  end if;

  select owner_name into shop_owner from public.shop_page_settings where shop_id = p_shop_id;

  select * into ent from public.shop_template_entitlements
   where shop_id = p_shop_id and status in ('active', 'grace')
   order by period_end desc limit 1;

  start_at := greatest(now(), coalesce(ent.period_end, now()));
  end_at := start_at + interval '30 days';

  if ent.id is null then
    insert into public.shop_template_entitlements
      (id, shop_id, owner_name, template_id, status, period_start, period_end, grace_days)
    values
      ('tent-' || p_shop_id, p_shop_id, coalesce(shop_owner, ''),
       p_template_id, 'active', start_at, end_at, 7);
  else
    update public.shop_template_entitlements
       set template_id = p_template_id,
           status = 'active',
           period_start = start_at,
           period_end = end_at,
           cancelled_at = null
     where id = ent.id;
  end if;

  insert into public.template_invoices
    (id, shop_id, owner_name, template_id, amount_mmk, period_start, period_end, status, paid_at, recorded_by)
  values
    (p_invoice_id, p_shop_id, coalesce(shop_owner, ''),
     p_template_id, template_row.price_mmk_month,
     start_at, end_at, 'paid', now(), auth.uid())
  returning * into invoice;

  return invoice;
end;
$$;

-- Row-level security (§16B.1): an owner changes only their own Shop Page, the
-- catalog belongs to Super Admin, and a payment is recorded by Super Admin or
-- Payment Admin.
alter table public.shop_templates enable row level security;
alter table public.shop_page_settings enable row level security;
alter table public.shop_template_entitlements enable row level security;
alter table public.template_invoices enable row level security;

drop policy if exists shop_templates_read on public.shop_templates;
create policy shop_templates_read on public.shop_templates
  for select using (status <> 'draft' or public.current_role_name() = 'Super Admin');

drop policy if exists shop_templates_write on public.shop_templates;
create policy shop_templates_write on public.shop_templates
  for all using (public.current_role_name() = 'Super Admin')
  with check (public.current_role_name() = 'Super Admin');

drop policy if exists shop_page_settings_read on public.shop_page_settings;
create policy shop_page_settings_read on public.shop_page_settings
  for select using (
    public.current_role_name() in ('Super Admin', 'Payment Admin')
    or public.owns_shop(owner_name)
  );

drop policy if exists shop_page_settings_write on public.shop_page_settings;
create policy shop_page_settings_write on public.shop_page_settings
  for all using (
    public.current_role_name() = 'Super Admin'
    or public.owns_shop(owner_name)
  )
  with check (
    public.current_role_name() = 'Super Admin'
    or public.owns_shop(owner_name)
  );

drop policy if exists shop_template_entitlements_read on public.shop_template_entitlements;
create policy shop_template_entitlements_read on public.shop_template_entitlements
  for select using (
    public.current_role_name() in ('Super Admin', 'Payment Admin')
    or public.owns_shop(owner_name)
  );

drop policy if exists shop_template_entitlements_write on public.shop_template_entitlements;
create policy shop_template_entitlements_write on public.shop_template_entitlements
  for all using (public.current_role_name() in ('Super Admin', 'Payment Admin'))
  with check (public.current_role_name() in ('Super Admin', 'Payment Admin'));

drop policy if exists template_invoices_read on public.template_invoices;
create policy template_invoices_read on public.template_invoices
  for select using (
    public.current_role_name() in ('Super Admin', 'Payment Admin')
    or public.owns_shop(owner_name)
  );

drop policy if exists template_invoices_write on public.template_invoices;
create policy template_invoices_write on public.template_invoices
  for all using (public.current_role_name() in ('Super Admin', 'Payment Admin'))
  with check (public.current_role_name() in ('Super Admin', 'Payment Admin'));

-- §4's launch set: the free baseline for every category, then the three paid
-- hotel designs, which are the ones §4 ships first.
insert into public.shop_templates
  (id, category, name_mm, name_en, version, status, preview_image_key, price_mmk_month, is_free, traits)
values
  ('hotel_classic', 'hotel', 'ဂန္ထဝင်', 'Classic', 1, 'active', 'templates/hotel-classic.webp', 0, true,
   '{"layout":"single_column","navigation":"top_bar","hero":"single_photo","catalog":"card_grid","bookingCta":"sticky_footer","gallery":"masonry","mobile":"stacked"}'),
  ('hotel_editorial', 'hotel', 'အယ်ဒီတိုရီရယ်', 'Editorial', 1, 'active', 'templates/hotel-editorial.webp', 2000, false,
   '{"layout":"editorial_columns","navigation":"side_rail","hero":"full_bleed_video","catalog":"long_list","bookingCta":"inline_section","gallery":"full_bleed_carousel","mobile":"swipe_cards"}'),
  ('hotel_compact', 'hotel', 'ကျစ်လစ်', 'Compact', 1, 'active', 'templates/hotel-compact.webp', 2000, false,
   '{"layout":"two_column","navigation":"bottom_tabs","hero":"split_panel","catalog":"price_table","bookingCta":"floating_button","gallery":"thumbnail_strip","mobile":"bottom_tabs"}'),
  ('hotel_gallery_first', 'hotel', 'ဓာတ်ပုံဦးစား', 'Gallery First', 1, 'active', 'templates/hotel-gallery-first.webp', 2000, false,
   '{"layout":"gallery_hero","navigation":"overlay_menu","hero":"photo_collage","catalog":"horizontal_carousel","bookingCta":"inline_bar","gallery":"grid_lightbox","mobile":"full_screen"}'),
  ('restaurant_classic', 'restaurant', 'ဂန္ထဝင်', 'Classic', 1, 'active', 'templates/restaurant-classic.webp', 0, true,
   '{"layout":"single_column","navigation":"top_bar","hero":"single_photo","catalog":"card_grid","bookingCta":"sticky_footer","gallery":"masonry","mobile":"stacked"}'),
  ('cafe_classic', 'cafe', 'ဂန္ထဝင်', 'Classic', 1, 'active', 'templates/cafe-classic.webp', 0, true,
   '{"layout":"single_column","navigation":"top_bar","hero":"single_photo","catalog":"card_grid","bookingCta":"sticky_footer","gallery":"masonry","mobile":"stacked"}'),
  ('book_shop_classic', 'book_shop', 'ဂန္ထဝင်', 'Classic', 1, 'active', 'templates/book-shop-classic.webp', 0, true,
   '{"layout":"single_column","navigation":"top_bar","hero":"single_photo","catalog":"card_grid","bookingCta":"sticky_footer","gallery":"masonry","mobile":"stacked"}'),
  ('attraction_classic', 'attraction', 'ဂန္ထဝင်', 'Classic', 1, 'active', 'templates/attraction-classic.webp', 0, true,
   '{"layout":"single_column","navigation":"top_bar","hero":"single_photo","catalog":"card_grid","bookingCta":"sticky_footer","gallery":"masonry","mobile":"stacked"}')
on conflict (id) do nothing;
