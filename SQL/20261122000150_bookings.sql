-- Plan §16C.2: `bookings` is the universal booking record, and §16C.3 step 4
-- is the voucher that hangs off it. Two things already expected this table and
-- neither could ever have worked against a fresh project:
--
--   * `src/lib/travelRequests.ts` inserts `user_id`, `reference`, `kind`,
--     `title`, `status` and `amount_usd` into it on every Rental, Ticketing and
--     Custom Plan submission;
--   * `20261122000200_rental_orders.sql` unions it into the `my_bookings` view,
--     reading `id`, `user_id`, `kind`, `status` and `created_at`.
--
-- So the columns below are the union of what those two ask for, and the view
-- migration is the one that reads it. `kind` stays text rather than an enum
-- because Ticketing and Custom Plan add kinds without a schema change.
--
-- The status machine is the §6 Full Manual flow plus the §16C.2 Instant one.
-- Travelers cannot cancel (§6), so there is no `cancelled` transition they may
-- make — an Owner or MH staff moves a row there.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  -- `MHR-20261122-001` and its siblings; what the traveler reads over the phone.
  reference text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  -- 'rental' | 'ticket' | 'custom_plan' today, and open to more.
  kind text not null,
  title text not null default '',
  -- Full Manual: requested -> accepted -> payment_pending -> paid -> completed,
  -- plus expired and cancelled. Instant: paid -> completed. 'received' is what
  -- the client writes before an owner has seen it, and is the initial state.
  status text not null default 'received' check (status in (
    'received', 'requested', 'accepted', 'payment_pending', 'paid',
    'completed', 'expired', 'cancelled'
  )),
  amount_usd numeric(10, 2) check (amount_usd is null or amount_usd >= 0),
  -- The voucher (§16C.3 step 4) is keyed by reference, so it needs the money as
  -- charged and the currency it was shown in, not only the USD base.
  display_currency text not null default 'USD',
  total_display numeric(12, 2),
  -- Set when the traveler reschedules once (§6); the old date is kept so the
  -- voucher history stays readable.
  start_date date,
  end_date date,
  voucher_version integer not null default 0 check (voucher_version >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_user_idx on public.bookings (user_id, created_at desc);
create index if not exists bookings_kind_status_idx on public.bookings (kind, status);

alter table public.bookings enable row level security;

/** The traveler reads and creates their own requests; staff read all of them. */
create or replace function public.can_read_bookings()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role_name() in ('Super Admin', 'Admin', 'Payment Admin', 'Rental Admin');
$$;

drop policy if exists bookings_read on public.bookings;
create policy bookings_read on public.bookings
  for select using (user_id = auth.uid() or public.can_read_bookings());

-- A traveler may only create a row addressed to themselves, and it starts
-- Received: the reference and the status are not theirs to choose.
drop policy if exists bookings_insert on public.bookings;
create policy bookings_insert on public.bookings
  for insert with check (
    (user_id = auth.uid() and status = 'received')
    or public.can_read_bookings()
  );

-- §6: the traveler cannot cancel, and may reschedule once. Staff drive the
-- status machine, so the update policy is staff-only and the reschedule goes
-- through the server function that also checks the notice window.
drop policy if exists bookings_update on public.bookings;
create policy bookings_update on public.bookings
  for update using (public.can_read_bookings())
  with check (public.can_read_bookings());

create or replace function public.touch_bookings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bookings_touch_updated_at on public.bookings;
create trigger bookings_touch_updated_at
  before update on public.bookings
  for each row execute function public.touch_bookings_updated_at();
