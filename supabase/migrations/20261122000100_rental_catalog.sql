-- Plan §8.3: rental catalog tables. The catalog is MH Travel's own data, so
-- every table here is read-only for travelers and writable by Rental Admin and
-- Super Admin only. `src/data/rentalCatalog.ts` is the seed source.

create table if not exists public.rental_categories (
  id text primary key,
  name_mm text not null,
  name_en text not null,
  detail_mm text not null default '',
  detail_en text not null default '',
  flow text not null check (flow in ('simple', 'driver_vehicle')),
  driver_required boolean not null default false,
  min_days integer not null default 1 check (min_days >= 1),
  image_key text not null default '',
  icon text not null default 'bike',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rental_variants (
  id text primary key,
  category_id text not null references public.rental_categories (id) on delete cascade,
  name_mm text not null,
  name_en text not null,
  seats integer check (seats is null or seats > 0),
  rules_mm text not null default '',
  rules_en text not null default '',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rental_variants_category_idx on public.rental_variants (category_id);

create table if not exists public.rental_cities (
  id text primary key,
  name_mm text not null,
  name_en text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.rental_branches (
  id text primary key,
  city_id text not null references public.rental_cities (id) on delete cascade,
  name_mm text not null,
  name_en text not null,
  address text not null default '',
  phone text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists rental_branches_city_idx on public.rental_branches (city_id);

-- The city × category matrix. A missing row and an inactive row mean the same
-- thing to the page, but the row is kept so an old order still resolves.
create table if not exists public.rental_availability (
  city_id text not null references public.rental_cities (id) on delete cascade,
  category_id text not null references public.rental_categories (id) on delete cascade,
  active boolean not null default true,
  primary key (city_id, category_id)
);

-- Plan §8.4 step 1: a null variant_id or city_id is the default row.
create table if not exists public.rental_rates (
  id uuid primary key default gen_random_uuid(),
  category_id text not null references public.rental_categories (id) on delete cascade,
  variant_id text references public.rental_variants (id) on delete cascade,
  city_id text references public.rental_cities (id) on delete cascade,
  rate_local_usd numeric(10, 2) not null check (rate_local_usd > 0),
  rate_foreign_usd numeric(10, 2) not null check (rate_foreign_usd > 0),
  effective_from date not null default current_date,
  effective_to date,
  created_at timestamptz not null default now(),
  constraint rental_rates_range check (effective_to is null or effective_to >= effective_from)
);

-- One rate per key per day: the unique index treats a null variant or city as
-- one value, so a default row cannot be inserted twice.
create unique index if not exists rental_rates_key_idx
  on public.rental_rates (category_id, coalesce(variant_id, ''), coalesce(city_id, ''), effective_from);

create table if not exists public.rental_terms (
  version text primary key,
  body_mm text not null,
  body_en text not null,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users (id)
);

alter table public.rental_categories enable row level security;
alter table public.rental_variants enable row level security;
alter table public.rental_cities enable row level security;
alter table public.rental_branches enable row level security;
alter table public.rental_availability enable row level security;
alter table public.rental_rates enable row level security;
alter table public.rental_terms enable row level security;

-- Plan §8.3 access: everyone reads active rows, staff writes.
do $$
declare
  catalog_tables text[] := array[
    'rental_categories', 'rental_variants', 'rental_cities',
    'rental_branches', 'rental_availability', 'rental_rates', 'rental_terms'
  ];
  table_name text;
begin
  foreach table_name in array catalog_tables loop
    execute format('drop policy if exists %I_read on public.%I', table_name, table_name);
    execute format('create policy %I_read on public.%I for select using (true)', table_name, table_name);
    execute format('drop policy if exists %I_write on public.%I', table_name, table_name);
    execute format(
      'create policy %I_write on public.%I for all using (public.is_rental_editor()) with check (public.is_rental_editor())',
      table_name, table_name
    );
  end loop;
end $$;

-- Plan §8.8 Settings: the two thresholds the dashboard and the booking form
-- read. A single row keeps them together, and the key stops a second row.
create table if not exists public.rental_settings (
  id boolean primary key default true check (id),
  highlight_after_hours integer not null default 2 check (highlight_after_hours >= 1),
  min_notice_days integer not null default 1 check (min_notice_days >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

insert into public.rental_settings (id) values (true) on conflict (id) do nothing;

alter table public.rental_settings enable row level security;

-- Everyone reads the thresholds; only Rental Admin and Super Admin change them.
drop policy if exists rental_settings_read on public.rental_settings;
create policy rental_settings_read on public.rental_settings for select using (true);

drop policy if exists rental_settings_write on public.rental_settings;
create policy rental_settings_write on public.rental_settings for all
  using (public.is_rental_staff()) with check (public.is_rental_staff());
