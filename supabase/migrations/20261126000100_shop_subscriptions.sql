-- Plan §9: an Owner pays a monthly account fee, and §4: a paid Shop Page
-- template costs 2,000 MMK per shop per month. Both follow the same lifecycle
-- (active, then a grace period after the period ends, then expired), so one
-- table carries both kinds. `src/lib/ownerSubscriptions.ts` is the client mirror
-- of the rules below until the client reads this table.

create table if not exists public.shop_subscriptions (
  id uuid primary key default gen_random_uuid(),
  shop_id text not null,
  kind text not null check (kind in ('owner', 'template')),
  template_id text,
  owner_name text not null,
  amount_mmk numeric(12, 2) not null check (amount_mmk >= 0),
  period_start timestamptz not null,
  period_end timestamptz not null,
  grace_days integer not null default 7 check (grace_days >= 0),
  status text not null default 'active' check (status in ('active', 'grace', 'expired')),
  -- Reminder thresholds already sent for this period, so a rerun is silent.
  reminded_keys text[] not null default '{}',
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shop_subscriptions_period_order check (period_end > period_start),
  -- §4 keeps a template entitlement attached to a template row.
  constraint shop_subscriptions_template_id check (kind = 'owner' or template_id is not null)
);

create index if not exists shop_subscriptions_shop_kind_idx
  on public.shop_subscriptions (shop_id, kind, period_end desc);

-- The expiry job and the reminder job scan by period end.
create index if not exists shop_subscriptions_period_end_idx
  on public.shop_subscriptions (period_end);

alter table public.shop_subscriptions enable row level security;

-- §16B.1: Super Admin holds "Owner accounts and listing approval" as F, Payment
-- Admin records the payment, and an owner reads only their own row. An owner is
-- matched on `owner_name`, the same byline rule `notification_feed` uses for an
-- author recipient, because `profiles` does not carry a fixed shop column.
drop policy if exists shop_subscriptions_read on public.shop_subscriptions;
create policy shop_subscriptions_read on public.shop_subscriptions
  for select using (
    public.current_role_name() in ('Super Admin', 'Admin', 'Payment Admin')
    or lower(btrim(owner_name)) = lower(btrim(coalesce(
      (select coalesce(
        to_jsonb(p) ->> 'display_name',
        to_jsonb(p) ->> 'full_name',
        to_jsonb(p) ->> 'name'
      ) from public.profiles p where p.id = auth.uid()),
      auth.jwt() -> 'user_metadata' ->> 'full_name',
      ''
    )))
  );

drop policy if exists shop_subscriptions_write on public.shop_subscriptions;
create policy shop_subscriptions_write on public.shop_subscriptions
  for insert with check (public.current_role_name() in ('Super Admin', 'Payment Admin'));

-- A renewal is a new row, so the only update is the status the jobs write.
drop policy if exists shop_subscriptions_update on public.shop_subscriptions;
create policy shop_subscriptions_update on public.shop_subscriptions
  for update using (public.current_role_name() in ('Super Admin', 'Payment Admin'));

create or replace function public.touch_shop_subscription()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists shop_subscriptions_touch on public.shop_subscriptions;
create trigger shop_subscriptions_touch
  before update on public.shop_subscriptions
  for each row execute function public.touch_shop_subscription();

/**
 * Plan §9 and §4: Active to grace to expired, computed from `period_end` and
 * `grace_days` rather than from a stored flag, so a missed job run cannot leave
 * a lapsed shop looking current. Idempotent: a second call moves nothing.
 */
create or replace function public.expire_shop_subscriptions()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_moved integer;
begin
  with derived as (
    select id,
           case
             when now() < period_end then 'active'
             when now() < period_end + make_interval(days => grace_days) then 'grace'
             else 'expired'
           end as next_status
    from public.shop_subscriptions
  )
  update public.shop_subscriptions s
     set status = d.next_status
    from derived d
   where s.id = d.id
     and s.status <> d.next_status;

  get diagnostics v_moved = row_count;
  return v_moved;
end;
$$;

/**
 * Plan §16B.3: the 7, 3 and 1-day renewal notices, one per threshold per
 * period. The row is written to `notification_feed` with the owner as the
 * recipient and returned, so the caller can deliver it.
 */
create or replace function public.subscription_renewal_due()
returns table (
  subscription_id uuid,
  shop_id text,
  owner_name text,
  days_left integer
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id,
         s.shop_id,
         s.owner_name,
         (s.period_end::date - (now() at time zone 'Asia/Yangon')::date)
  from public.shop_subscriptions s
  where s.status <> 'expired'
    and (s.period_end::date - (now() at time zone 'Asia/Yangon')::date) in (7, 3, 1)
    and not (s.reminded_keys @> array[s.id::text || ':' || s.period_end || ':' ||
             (s.period_end::date - (now() at time zone 'Asia/Yangon')::date)::text]);
$$;

/** Marks one threshold as sent, so the next run of the job skips it. */
create or replace function public.mark_subscription_reminded(p_id uuid, p_days integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.shop_subscriptions
     set reminded_keys = reminded_keys || (id::text || ':' || period_end || ':' || p_days::text)
   where id = p_id
     and not (reminded_keys @> array[id::text || ':' || period_end || ':' || p_days::text]);
$$;

/**
 * Plan §9: an expired Owner keeps the listing visible but loses booking and
 * contact. The public shop page asks this rather than reading the status, so
 * one rule decides for every category.
 */
create or replace function public.shop_accepts_bookings(p_shop_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select s.status <> 'expired'
      from public.shop_subscriptions s
      where s.shop_id = p_shop_id
        and s.kind = 'owner'
      order by s.period_end desc
      limit 1
    ),
    true
  );
$$;
