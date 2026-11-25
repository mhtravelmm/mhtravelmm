#!/usr/bin/env bash
# Applies every migration to an empty Postgres, then checks the row-level
# security rules the Plan's acceptance criteria name. Nothing here touches a
# real Supabase project: the container is throwaway and the `auth` schema is a
# stand-in for the two functions and one table the migrations read.
#
#   ./scripts/verify-migrations.sh
#
# Exit code is 0 only when the chain applies cleanly and every assertion holds.
set -uo pipefail

CONTAINER=${CONTAINER:-mh-migration-check}
IMAGE=${IMAGE:-postgres:16-alpine}
cd "$(dirname "$0")/.." || exit 1

DC="docker"
if ! docker info >/dev/null 2>&1; then
  DC="sudo docker"
fi

cleanup() { $DC rm -f "$CONTAINER" >/dev/null 2>&1; }
trap cleanup EXIT

echo "== starting $IMAGE"
$DC rm -f "$CONTAINER" >/dev/null 2>&1
$DC run -d --name "$CONTAINER" -e POSTGRES_PASSWORD=x -e POSTGRES_HOST_AUTH_METHOD=trust "$IMAGE" >/dev/null || exit 1

# The image starts a temporary server to run its init scripts, and that one
# answers on the unix socket but not on TCP. Waiting for a TCP query is what
# guarantees the real server is up, not the throwaway init one.
ready=0
for _ in $(seq 1 90); do
  if $DC exec "$CONTAINER" psql -h 127.0.0.1 -U postgres -tAc 'select 1' >/dev/null 2>&1; then
    ready=$((ready + 1))
    [ "$ready" -ge 2 ] && break
  fi
  sleep 1
done
if [ "$ready" -lt 2 ]; then
  echo "== postgres did not become ready"
  exit 1
fi

psql_q() { $DC exec -i "$CONTAINER" psql -U postgres -q "$@"; }
psql_t() { $DC exec -i "$CONTAINER" psql -U postgres -tA "$@"; }

echo "== creating the Supabase stand-in (auth schema, roles, auth.uid())"
psql_q <<'SQL'
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key,
  email text unique,
  raw_user_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create or replace function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
create or replace function auth.jwt() returns jsonb language sql stable
  as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb) $$;
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
end $$;
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
SQL

echo "== applying migrations in order"
fail=0
for file in supabase/migrations/*.sql; do
  # Each file is a psql script; `-v ON_ERROR_STOP=1` makes the first error fatal
  # so a partial apply cannot look like success.
  if out=$($DC exec -i "$CONTAINER" psql -U postgres -q -v ON_ERROR_STOP=1 -f - <"$file" 2>&1); then
    printf '  ok   %s\n' "$(basename "$file")"
  else
    printf '  FAIL %s\n' "$(basename "$file")"
    printf '%s\n' "$out" | grep -E '^(psql|ERROR)' | head -3 | sed 's/^/       /'
    fail=$((fail + 1))
  fi
done

if [ "$fail" -ne 0 ]; then
  echo "== $fail migration(s) failed to apply"
  exit 1
fi

echo "== checking the seeded catalog"
listings=$(psql_t -c "select count(*) from public.listings")
echo "  listings seeded: ${listings//[[:space:]]/}"
[ "${listings//[[:space:]]/}" = "67" ] || { echo "  FAIL expected 67 listings"; exit 1; }

echo "== checking Plan §9 and §16C.3 acceptance rules"

OWNER=aaaaaaaa-0000-0000-0000-000000000001
ADMIN=bbbbbbbb-0000-0000-0000-000000000002

psql_q >/dev/null <<SQL
insert into auth.users (id, email, raw_user_meta_data) values
  ('$OWNER', 'owner@example.test', '{"display_name":"Owner One"}'),
  ('$ADMIN', 'admin@example.test', '{"display_name":"Admin One"}');
update public.profiles set role = 'super_admin' where id = '$ADMIN';
-- A never-approved listing, inserted rather than demoted: the stamp trigger
-- pins first_approved_at on every update, so a pending fixture cannot be made
-- by updating a seeded row. ph3 is copied and held at Pending and unstamped.
insert into public.listings (
  id, category, city_id, owner_id, name_en, price_display, price_from_usd,
  booking_flow_mode, status, image_url, href
)
select 'pending-probe', category, city_id, '$OWNER', name_en, price_display,
       price_from_usd, booking_flow_mode, 'pending', image_url, '/pending-probe'
from public.listings where id = 'ph3';
delete from public.listings where id = 'ph3';
SQL

# Runs one statement as a signed-in account and prints the outcome line.
as_user() {
  local uid="$1" sql="$2"
  psql_t -c "set role authenticated; set request.jwt.claim.sub='$uid'; $sql" 2>&1 \
    | grep -oE 'ERROR:  new row violates.*|ERROR:  permission denied.*|UPDATE [0-9]+|^[0-9]+$' \
    | head -1
}

check() { # label expected actual
  if [ "$3" = "$2" ]; then printf '  ok   %s\n' "$1"
  else printf '  FAIL %s (expected %s, got %s)\n' "$1" "$2" "${3:-<empty>}"; fail=1; fi
}

# `set role` echoes `SET` on stdout, so keep only the number psql prints.
as_anon() { psql_t -c "set role anon; $1" 2>&1 | grep -oE '^[0-9]+$' | head -1; }

# The probe is Pending, so the public sees the other 66.
check "anon reads only active rows" "66" \
  "$(as_anon 'select count(*) from public.listings')"
pending_rows=$(as_anon "select count(*) from public.listings where id = 'pending-probe'")
check "anon cannot see a pending row" "0" "$pending_rows"
check "owner edits their own pending row" "UPDATE 1" \
  "$(as_user "$OWNER" "update public.listings set name_en='Lotte Hotel' where id='pending-probe';")"
check "owner cannot self-approve" "ERROR:  new row violates row-level security policy for table \"listings\"" \
  "$(as_user "$OWNER" "update public.listings set status='active' where id='pending-probe';")"
check "owner cannot forge the approval stamp" "ERROR:  new row violates row-level security policy for table \"listings\"" \
  "$(as_user "$OWNER" "update public.listings set first_approved_at=now(), status='active' where id='pending-probe';")"
check "staff approves" "UPDATE 1" \
  "$(as_user "$ADMIN" "update public.listings set status='active' where id='pending-probe';")"
check "owner edits go live after approval (§9)" "UPDATE 1" \
  "$(as_user "$OWNER" "update public.listings set name_en='Lotte Hotel Yangon' where id='pending-probe';")"
check "another owner cannot edit the row" "UPDATE 0" \
  "$(as_user "$OWNER" "update public.listings set name_en='Nope' where id='ph1';")"
check "the approval stamp survives the owner edit" "t" \
  "$(psql_t -c "select first_approved_at is not null from public.listings where id='pending-probe'")"

if [ "$fail" -ne 0 ]; then
  echo "== acceptance rules failed"
  exit 1
fi

echo "== all checks passed"
