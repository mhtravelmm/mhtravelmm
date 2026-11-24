-- Plan §9: the commission is deducted at payment time, its rate is snapshotted
-- on the transaction, and payouts run twice a month with a 50,000 MMK minimum
-- that carries over. These tables are what makes a payout run reproducible from
-- ledger rows (§16D Phase 3 gate); `src/lib/ownerLedger.ts` is the client mirror
-- of the rules below until the client reads them.

create table if not exists public.owner_commission_settings (
  shop_id text primary key,
  -- §9: fully Admin-discretion, differs shop by shop, 0% is allowed.
  percent numeric(5, 2) not null default 0 check (percent >= 0 and percent <= 100),
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.owner_ledger_rows (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'sale' check (kind in ('sale', 'refund')),
  shop_id text not null,
  shop_name text not null default '',
  owner_name text not null default '',
  booking_ref text not null,
  paid_day date not null,
  gross_mmk numeric(12, 2) not null,
  commission_percent numeric(5, 2) not null
    check (commission_percent >= 0 and commission_percent <= 100),
  commission_mmk numeric(12, 2) not null,
  net_mmk numeric(12, 2) not null,
  payout_id text,
  created_at timestamptz not null default now(),
  -- The row is the arithmetic; a stored net that disagrees would hide a bug.
  constraint owner_ledger_rows_net check (net_mmk = gross_mmk - commission_mmk),
  constraint owner_ledger_rows_commission
    check (commission_mmk = round(gross_mmk * commission_percent / 100))
);

-- A payment recorded twice must not pay the owner twice.
create unique index if not exists owner_ledger_rows_booking_ref_key
  on public.owner_ledger_rows (booking_ref);

create index if not exists owner_ledger_rows_shop_unpaid_idx
  on public.owner_ledger_rows (shop_id, paid_day) where payout_id is null;

create table if not exists public.owner_payout_runs (
  id text primary key,
  shop_id text not null,
  shop_name text not null default '',
  owner_name text not null default '',
  window_start_day date not null,
  window_end_day date not null,
  -- §9: 1-15 pays on the 20th, 16-end pays on the 5th of the next month.
  due_day date not null,
  row_ids uuid[] not null default '{}',
  gross_mmk numeric(12, 2) not null,
  commission_mmk numeric(12, 2) not null,
  net_mmk numeric(12, 2) not null,
  min_mmk numeric(12, 2) not null default 50000,
  run_at timestamptz not null default now(),
  run_by uuid references auth.users (id) on delete set null,
  constraint owner_payout_runs_minimum check (net_mmk >= min_mmk),
  constraint owner_payout_runs_window check (window_end_day >= window_start_day)
);

-- One run per shop per window, which is what stops a second click paying twice.
create unique index if not exists owner_payout_runs_shop_window_key
  on public.owner_payout_runs (shop_id, due_day);

alter table public.owner_commission_settings enable row level security;
alter table public.owner_ledger_rows enable row level security;
alter table public.owner_payout_runs enable row level security;

/**
 * §9: "Day 1 to 15 earnings are paid on the 20th, Day 16 to month end earnings
 * are paid on the 5th of the next month." One place computes it, so the run and
 * the panel cannot disagree about which window a sale belongs to.
 */
create or replace function public.owner_payout_due_day(p_paid_day date)
returns date
language sql
immutable
as $$
  select case
    when extract(day from p_paid_day) <= 15
      then make_date(extract(year from p_paid_day)::int, extract(month from p_paid_day)::int, 20)
    else (date_trunc('month', p_paid_day) + interval '1 month' + interval '4 days')::date
  end;
$$;

-- §16B.1: "Payments, payouts, exchange rates" is F for Super Admin and Payment
-- Admin, and `O (own earnings)` for Owner Admin; Admin reads nothing here. An
-- owner is matched on `owner_name`, the byline rule `shop_subscriptions` and
-- `notification_feed` already use.
create or replace function public.current_display_name()
returns text
language sql
stable
as $$
  select coalesce(
    (select coalesce(
       to_jsonb(p) ->> 'display_name',
       to_jsonb(p) ->> 'full_name',
       to_jsonb(p) ->> 'name'
     ) from public.profiles p where p.id = auth.uid()),
    auth.jwt() -> 'user_metadata' ->> 'full_name',
    ''
  );
$$;

drop policy if exists owner_commission_settings_read on public.owner_commission_settings;
create policy owner_commission_settings_read on public.owner_commission_settings
  for select using (
    public.current_role_name() in ('Super Admin', 'Payment Admin')
    or exists (
      select 1 from public.owner_ledger_rows r
       where r.shop_id = owner_commission_settings.shop_id
         and lower(btrim(r.owner_name)) = lower(btrim(public.current_display_name()))
    )
  );

drop policy if exists owner_commission_settings_write on public.owner_commission_settings;
create policy owner_commission_settings_write on public.owner_commission_settings
  for all using (public.current_role_name() in ('Super Admin', 'Payment Admin'))
  with check (public.current_role_name() in ('Super Admin', 'Payment Admin'));

drop policy if exists owner_ledger_rows_read on public.owner_ledger_rows;
create policy owner_ledger_rows_read on public.owner_ledger_rows
  for select using (
    public.current_role_name() in ('Super Admin', 'Payment Admin')
    or lower(btrim(owner_name)) = lower(btrim(public.current_display_name()))
  );

drop policy if exists owner_ledger_rows_insert on public.owner_ledger_rows;
create policy owner_ledger_rows_insert on public.owner_ledger_rows
  for insert with check (public.current_role_name() in ('Super Admin', 'Payment Admin'));

-- A run stamps the rows it settled, so the only permitted update is `payout_id`
-- moving from null to a run id. The amount columns are frozen by the trigger
-- below, which is what makes `verify_owner_payout` meaningful.
drop policy if exists owner_ledger_rows_settle on public.owner_ledger_rows;
create policy owner_ledger_rows_settle on public.owner_ledger_rows
  for update using (public.current_role_name() in ('Super Admin', 'Payment Admin'))
  with check (public.current_role_name() in ('Super Admin', 'Payment Admin'));

create or replace function public.freeze_ledger_amounts()
returns trigger
language plpgsql
as $$
begin
  if new.kind <> old.kind
     or new.shop_id <> old.shop_id
     or new.booking_ref <> old.booking_ref
     or new.paid_day <> old.paid_day
     or new.gross_mmk <> old.gross_mmk
     or new.commission_percent <> old.commission_percent
     or new.commission_mmk <> old.commission_mmk
     or new.net_mmk <> old.net_mmk then
    raise exception 'owner ledger amounts are append-only' using errcode = '42501';
  end if;
  if old.payout_id is not null and new.payout_id is distinct from old.payout_id then
    raise exception 'a settled ledger row cannot be re-run' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists owner_ledger_rows_freeze on public.owner_ledger_rows;
create trigger owner_ledger_rows_freeze
  before update on public.owner_ledger_rows
  for each row execute function public.freeze_ledger_amounts();

drop policy if exists owner_payout_runs_read on public.owner_payout_runs;
create policy owner_payout_runs_read on public.owner_payout_runs
  for select using (
    public.current_role_name() in ('Super Admin', 'Payment Admin')
    or lower(btrim(owner_name)) = lower(btrim(public.current_display_name()))
  );

drop policy if exists owner_payout_runs_write on public.owner_payout_runs;
create policy owner_payout_runs_write on public.owner_payout_runs
  for insert with check (public.current_role_name() in ('Super Admin', 'Payment Admin'));

/**
 * §9: "Minimum 50,000 MMK, carried over until met." Settles every unpaid row
 * whose own window is due by `p_due_day`, writing the run and stamping the rows
 * in one statement each. Returns the run id, or null when the shop is under the
 * minimum — the rows then stay unpaid and roll into the next run.
 */
create or replace function public.run_owner_payout(p_shop_id text, p_due_day date)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id text := 'payout-' || p_shop_id || '-' || p_due_day::text;
  v_ids uuid[];
  v_gross numeric(12, 2);
  v_commission numeric(12, 2);
  v_net numeric(12, 2);
  v_shop_name text;
  v_owner_name text;
  v_start date;
  v_end date;
begin
  if exists (select 1 from public.owner_payout_runs where id = v_run_id) then
    return v_run_id;
  end if;

  select array_agg(r.id order by r.paid_day, r.id),
         coalesce(sum(r.gross_mmk), 0),
         coalesce(sum(r.commission_mmk), 0),
         coalesce(sum(r.net_mmk), 0),
         min(r.shop_name),
         min(r.owner_name),
         min(r.paid_day),
         max(r.paid_day)
    into v_ids, v_gross, v_commission, v_net, v_shop_name, v_owner_name, v_start, v_end
    from public.owner_ledger_rows r
   where r.shop_id = p_shop_id
     and r.payout_id is null
     and public.owner_payout_due_day(r.paid_day) <= p_due_day;

  if v_ids is null or v_net < 50000 then
    return null;
  end if;

  insert into public.owner_payout_runs (
    id, shop_id, shop_name, owner_name, window_start_day, window_end_day,
    due_day, row_ids, gross_mmk, commission_mmk, net_mmk, run_by
  ) values (
    v_run_id, p_shop_id, v_shop_name, v_owner_name, v_start, v_end,
    p_due_day, v_ids, v_gross, v_commission, v_net, auth.uid()
  );

  update public.owner_ledger_rows
     set payout_id = v_run_id
   where id = any (v_ids) and payout_id is null;

  return v_run_id;
end;
$$;

/**
 * The §16D Phase 3 gate in SQL: replaying a run from its rows must give back
 * the totals it was created with. A false `matches` means the ledger moved
 * after the money left.
 */
create or replace function public.verify_owner_payout(p_run_id text)
returns table (row_count integer, gross_mmk numeric, commission_mmk numeric, net_mmk numeric, matches boolean)
language sql
stable
as $$
  select count(r.id)::int,
         coalesce(sum(r.gross_mmk), 0),
         coalesce(sum(r.commission_mmk), 0),
         coalesce(sum(r.net_mmk), 0),
         count(r.id) = cardinality(p.row_ids)
           and coalesce(sum(r.gross_mmk), 0) = p.gross_mmk
           and coalesce(sum(r.commission_mmk), 0) = p.commission_mmk
           and coalesce(sum(r.net_mmk), 0) = p.net_mmk
    from public.owner_payout_runs p
    left join public.owner_ledger_rows r on r.payout_id = p.id
   where p.id = p_run_id
   group by p.id, p.row_ids, p.gross_mmk, p.commission_mmk, p.net_mmk;
$$;
