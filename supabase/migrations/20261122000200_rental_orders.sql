-- Plan §8.3: rental orders, their append-only timeline and after-rental extras.
-- Status changes and submission go through the functions in the next migration,
-- so a traveler can never write a total or a status directly.

create table if not exists public.rental_orders (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  user_id uuid not null references auth.users (id) on delete cascade,
  customer_name text not null,
  phone text not null,
  city_id text not null references public.rental_cities (id),
  category_id text not null references public.rental_categories (id),
  variant_id text references public.rental_variants (id),
  start_date date not null,
  end_date date not null,
  original_start_date date not null,
  days integer not null check (days >= 1),
  participants integer not null default 1 check (participants >= 1),
  customer_type text not null check (customer_type in ('citizen', 'foreigner')),
  fulfillment text not null check (fulfillment in ('delivery', 'branch')),
  branch_id text references public.rental_branches (id),
  delivery_address text not null default '',
  special_requests text not null default '',
  terms_version text not null references public.rental_terms (version),
  rate_usd numeric(10, 2) not null check (rate_usd > 0),
  total_usd numeric(10, 2) not null check (total_usd > 0),
  display_currency text not null default 'MMK' check (display_currency in ('MMK', 'USD')),
  fx_mmk_per_usd numeric(12, 2) not null check (fx_mmk_per_usd > 0),
  status text not null default 'requested'
    check (status in ('requested', 'accepted', 'paid', 'completed', 'expired', 'cancelled')),
  accepted_at timestamptz,
  payment_deadline timestamptz,
  payment_method text check (payment_method in ('cash', 'bank_transfer', 'mobile_wallet')),
  payment_received_at timestamptz,
  received_by uuid references auth.users (id),
  voucher_version integer not null default 1,
  rescheduled_count integer not null default 0 check (rescheduled_count >= 0),
  handled_by uuid references auth.users (id),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rental_orders_dates check (end_date >= start_date),
  constraint rental_orders_branch_or_address check (
    (fulfillment = 'branch' and branch_id is not null) or
    (fulfillment = 'delivery' and length(trim(delivery_address)) >= 3)
  )
);

create index if not exists rental_orders_user_idx on public.rental_orders (user_id, created_at desc);
create index if not exists rental_orders_status_idx on public.rental_orders (status, created_at desc);
create index if not exists rental_orders_city_idx on public.rental_orders (city_id, created_at desc);

create table if not exists public.rental_order_events (
  id bigserial primary key,
  order_id uuid not null references public.rental_orders (id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid references auth.users (id),
  note text not null default '',
  at timestamptz not null default now()
);

create index if not exists rental_order_events_order_idx on public.rental_order_events (order_id, at);

-- Plan §8: travel guide accommodation, food and travel costs are charged on
-- top of the daily rate, so they need their own rows.
create table if not exists public.rental_order_extras (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.rental_orders (id) on delete cascade,
  description text not null,
  amount_usd numeric(10, 2) not null check (amount_usd > 0),
  added_by uuid references auth.users (id),
  at timestamptz not null default now()
);

create index if not exists rental_order_extras_order_idx on public.rental_order_extras (order_id);

alter table public.rental_orders enable row level security;
alter table public.rental_order_events enable row level security;
alter table public.rental_order_extras enable row level security;

-- Plan §8.12 acceptance 5: a traveler reads only their own order; staff read all.
drop policy if exists rental_orders_read on public.rental_orders;
create policy rental_orders_read on public.rental_orders
  for select using (user_id = auth.uid() or public.is_rental_staff());

-- Submission and status changes are function-only; no insert or update policy
-- is granted, so a client cannot write a total or skip a status.
drop policy if exists rental_order_events_read on public.rental_order_events;
create policy rental_order_events_read on public.rental_order_events
  for select using (
    exists (
      select 1 from public.rental_orders o
      where o.id = rental_order_events.order_id
        and (o.user_id = auth.uid() or public.is_rental_staff())
    )
  );

drop policy if exists rental_order_extras_read on public.rental_order_extras;
create policy rental_order_extras_read on public.rental_order_extras
  for select using (
    exists (
      select 1 from public.rental_orders o
      where o.id = rental_order_extras.order_id
        and (o.user_id = auth.uid() or public.is_rental_staff())
    )
  );

drop policy if exists rental_order_extras_write on public.rental_order_extras;
create policy rental_order_extras_write on public.rental_order_extras
  for all using (public.is_rental_staff()) with check (public.is_rental_staff());

-- Plan §8.3: Account → My Bookings reads one view over both products.
create or replace view public.my_bookings as
  select
    'rental'::text as product,
    o.id::text as id,
    o.request_code as reference,
    o.user_id,
    o.category_id as item_id,
    o.city_id,
    o.start_date,
    o.end_date,
    o.total_usd,
    o.display_currency,
    o.status,
    o.created_at
  from public.rental_orders o
  union all
  select
    'booking'::text as product,
    b.id::text as id,
    b.id::text as reference,
    b.user_id,
    null::text as item_id,
    null::text as city_id,
    null::date as start_date,
    null::date as end_date,
    null::numeric as total_usd,
    null::text as display_currency,
    b.status::text as status,
    b.created_at
  from public.bookings b
  where coalesce(b.kind, '') <> 'rental';

alter view public.my_bookings set (security_invoker = true);
