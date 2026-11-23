-- Plan §16B.3: one notification service, two tables. `notification_feed` holds
-- the shared rows ("new blog post", "rental requested"); `notifications` holds
-- the per-user read state. Retention is 90 days (decision 32).
--
-- A row names its recipients instead of being copied per user, so one write
-- reaches a role, an account, an author or everyone, and the reader filters.
-- `src/lib/notificationFeed.ts` is the browser-side twin of this shape.

create table if not exists public.notification_feed (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  title text not null,
  body text not null default '',
  href text not null default '/',
  -- 'role' | 'user' | 'author' | 'everyone'; `recipient_value` is empty for
  -- 'everyone' and holds the role name, account id or author name otherwise.
  recipient_kind text not null check (recipient_kind in ('role', 'user', 'author', 'everyone')),
  recipient_value text not null default '',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '90 days'
);

create index if not exists notification_feed_created_idx
  on public.notification_feed (created_at desc);

create index if not exists notification_feed_recipient_idx
  on public.notification_feed (recipient_kind, recipient_value, created_at desc);

alter table public.notification_feed enable row level security;

/**
 * True when the signed-in reader is one of the row's recipients. A traveler
 * sees 'everyone' rows and their own account rows; an admin additionally sees
 * the rows addressed to their role. The author case matches the byline on the
 * profile, because guide earnings are paid to a name, not an account id.
 */
create or replace function public.can_read_feed_row(
  p_kind text,
  p_value text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case p_kind
    when 'everyone' then auth.uid() is not null
    when 'user' then p_value = auth.uid()::text
    when 'role' then p_value = public.current_role_name()
    -- The byline is a name, and the profile's name column is not fixed by this
    -- schema, so read whichever of the usual names the row carries.
    when 'author' then lower(btrim(p_value)) <> '' and lower(btrim(p_value)) = lower(btrim(coalesce(
      (select coalesce(
        to_jsonb(p) ->> 'display_name',
        to_jsonb(p) ->> 'full_name',
        to_jsonb(p) ->> 'name'
      ) from public.profiles p where p.id = auth.uid()),
      auth.jwt() -> 'user_metadata' ->> 'full_name',
      ''
    )))
    else false
  end;
$$;

drop policy if exists notification_feed_read on public.notification_feed;
create policy notification_feed_read on public.notification_feed
  for select using (
    expires_at > now()
    and public.can_read_feed_row(recipient_kind, recipient_value)
  );

-- Writers are the server functions that own each event (publishing a post,
-- accepting a rental, a failed job). A client may not invent a feed row, so
-- there is no insert policy; the service role bypasses RLS.

/**
 * Drops rows past their retention date. The §16B.7 schedule calls this hourly
 * so the table cannot grow without bound, and it is safe to run twice.
 */
create or replace function public.purge_expired_feed_rows()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  delete from public.notification_feed where expires_at <= now();
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;
