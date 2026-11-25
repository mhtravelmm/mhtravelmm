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
for file in SQL/*.sql; do
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

echo "== checking Plan §16H.13, the search criteria the database owns"

# 1 and 5: the aliases resolve, so `bagan`, `pagan` and `ပုဂံ` are one city and
# `hotels yangon` is one kind in one city. The text is normalized on the way in,
# which is what `searchRpcArgs()` does before it calls the function.
search_title() { psql_t -c "select public.search_all('$1','$2',null,null,'relevance',null,null,5,0)::jsonb->'items'->0->>'title'"; }
check "bagan finds Bagan" \
  "$(search_title bagan en)" "$(search_title pagan en)"
check "ပုဂံ finds the same" \
  "$(search_title bagan en)" "$(search_title 'ပုဂံ' mm)"
check "hotels yangon is one kind in one city" "city_category" \
  "$(psql_t -c "select public.search_all('hotels yangon','en',null,null,'relevance',null,null,5,0)::jsonb->'interpreted'->>'mode'")"

# 3: a draft never enters the index, and publishing puts it there and takes it
# back out — 9 is the same trigger seen from the other side.
psql_q >/dev/null <<'SQL'
insert into public.blog_posts (id, slug, status, category, title_en, title_mm, excerpt_en,
  excerpt_mm, author_name, author_name_mm, location, location_mm, cover_url, seo_tags, version)
values ('search-probe','search-probe','Draft','nature','Search Probe','ရှာဖွေ','','','MH','',
  'Myanmar','','','',1);
SQL
check "a draft is not indexed" "0" \
  "$(psql_t -c "select count(*) from public.search_index where ref_id = 'search-probe'" | tr -d '[:space:]')"
psql_q >/dev/null -c "update public.blog_posts set status='Published', published_at='2026-11-01', version=2 where id='search-probe'"
check "publishing indexes it" "1" \
  "$(psql_t -c "select count(*) from public.search_index where ref_id = 'search-probe'" | tr -d '[:space:]')"
psql_q >/dev/null -c "update public.blog_posts set status='Draft', version=3 where id='search-probe'"
check "unpublishing removes it" "0" \
  "$(psql_t -c "select count(*) from public.search_index where ref_id = 'search-probe'" | tr -d '[:space:]')"

# 7: Open Now is judged on the Myanmar clock, an overnight close crosses
# midnight, an unknown schedule is never open, and equal times mean 24 hours.
check "Open Now reads the Myanmar clock" "true|false|true|false|true" \
  "$(psql_t -c "select private.is_open_now('09:00','17:00','2026-11-20 04:00:00+00') || '|' ||
                      private.is_open_now('09:00','17:00','2026-11-20 14:00:00+00') || '|' ||
                      private.is_open_now('20:00','02:00','2026-11-20 18:00:00+00') || '|' ||
                      private.is_open_now(null,null,now()) || '|' ||
                      private.is_open_now('00:00','00:00',now())")"

# 10: a chip's count is the list's length, taken after the same filters. The
# page asks for 50 at a time, so the answer is compared with itself rather than
# with a number that moves whenever a seed row is added.
check "counts equal the list" "t" \
  "$(psql_t -c "with r as (select public.search_all('','en','yangon',null,'relevance',null,null,50,0)::jsonb as j)
                select (select coalesce(sum(value::int),0) from jsonb_each_text(j->'counts'))
                     = jsonb_array_length(j->'items') from r" | tr -d '[:space:]')"

# 6 and 8: the two refusals the function must make, as codes for `t()`.
check "nearest without a point is refused" "search_error_location_required" \
  "$(psql_t -c "do \$\$ begin perform public.search_all('hotels','en',null,null,'nearest',null,null,5,0);
                exception when others then raise notice '%', sqlerrm; end \$\$" 2>&1 | grep -oE 'search_error_[a-z_]+' | head -1)"
check "an over-long query is refused" "search_error_query_too_long" \
  "$(psql_t -c "do \$\$ begin perform public.search_all(repeat('a',81),'en',null,null,'relevance',null,null,5,0);
                exception when others then raise notice '%', sqlerrm; end \$\$" 2>&1 | grep -oE 'search_error_[a-z_]+' | head -1)"

# `search_nearby` answers in `search_all`'s shape plus the distance fields. It
# used to hand back the raw row — `title_en` and no `title`, no `ref_id` — so a
# card drew no name.
check "a Nearby item has the documented shape" "0" \
  "$(psql_t -c "select count(*) from jsonb_array_elements(public.search_nearby(16.8,96.1,10,null,false,50,0)::jsonb->'items') e
                where e->>'title' is null or e->>'title' = '' or e->>'ref_id' is null or e->>'kind' is null" | tr -d '[:space:]')"
check "a Nearby item carries its distance and hours" "0" \
  "$(psql_t -c "select count(*) from jsonb_array_elements(public.search_nearby(16.8,96.1,10,null,false,50,0)::jsonb->'items') e
                where (e->>'distance_km')::numeric > 10 or e->>'open_now' is null" | tr -d '[:space:]')"


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
