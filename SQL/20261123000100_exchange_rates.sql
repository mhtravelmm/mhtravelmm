-- Plan §16B.5: exchange rates are append-only rows. The current rate is the
-- latest row whose `effective_from` has passed, so an order priced yesterday can
-- always be explained by the row that was live on its day. `src/lib/exchangeRates.ts`
-- is the client mirror of this shape until the client reads the table.

create table if not exists public.exchange_rates (
  id uuid primary key default gen_random_uuid(),
  mmk_per_usd numeric(12, 2) not null check (mmk_per_usd > 0),
  effective_from timestamptz not null default now(),
  set_by uuid references auth.users (id) on delete set null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists exchange_rates_effective_idx
  on public.exchange_rates (effective_from desc);

alter table public.exchange_rates enable row level security;

-- Prices are public, so the rate is readable by anyone including a signed-out
-- traveler; only the two §16B.1 rows that own it may add a row.
drop policy if exists exchange_rates_read on public.exchange_rates;
create policy exchange_rates_read on public.exchange_rates
  for select using (true);

drop policy if exists exchange_rates_insert on public.exchange_rates;
create policy exchange_rates_insert on public.exchange_rates
  for insert with check (public.current_role_name() in ('Super Admin', 'Payment Admin'));

-- No update or delete policy: a correction is a new row, never an edit.

/** The rate in force, or null while no row has taken effect. */
create or replace function public.current_mmk_per_usd()
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select r.mmk_per_usd
  from public.exchange_rates r
  where r.effective_from <= now()
  order by r.effective_from desc
  limit 1;
$$;

/**
 * Plan §16B.5: USD keeps 2 decimals, MMK is shown rounded to the nearest 100.
 * Kept next to the rate so a caller cannot convert with one rounding and store
 * another. The 4,500 fallback stays until the first row exists.
 */
create or replace function public.round_mmk(p_amount numeric)
returns numeric
language sql
immutable
as $$
  select round(p_amount / 100) * 100;
$$;

create or replace function public.usd_to_mmk(p_usd numeric, p_at timestamptz default now())
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select public.round_mmk(
    p_usd * coalesce(
      (select r.mmk_per_usd from public.exchange_rates r
        where r.effective_from <= p_at
        order by r.effective_from desc limit 1),
      4500
    )
  );
$$;
