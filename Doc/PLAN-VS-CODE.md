# Plan vs Code — Verification Record

**Checked:** 20 November 2026; **re-checked** against `main` @ `abe2700`.
**Against:** `main` @ `abe2700` (re-check), originally `8cdcf4e`.
**Method:** every claim below was read in `Plan/PROJECT-PLAN.md` and then tested
against the source tree. Nothing here is inferred from earlier notes.

This file records where the Plan is accurate, where it has gone stale, and
where it contradicts itself. It does not change any code or any plan text.

---

## 1. Summary

| Result | Count |
|---|---|
| Plan claim **confirmed** by code | 5 (§2 rows 1, 2, 6, 8, 9) |
| Plan claim **stale** (code moved on) | 7 (§3.1–§3.7, one each) |
| Plan **internally contradictory** | 2 (§4.1 resolved 22 Nov; §4.2 still open) |
| Plan claim **still open / accurate as a gap** | 2 (one narrowed to reads) |

The Plan is broadly honest. Its weakness is age: the audit section is dated
2026-11-09, and seven claims in it have since been fixed in code without the
doc being updated. Four of those seven — the broken links, the dead CTAs, the
ignored `:id`, and the missing migration directory — were fixed on 20–29
November and are now guarded by tests or visible in the tree, so the Plan's gap
list is shorter than it reads.

The re-check at `abe2700` changed seven rows: §2 rows 3, 4, 5, 7 and 9 (the
migration directory, the exchange rate, the test runner, the Favorites key, and
the hero page count), §3.2 (nine Supabase modules, not three), §3.3 (the
manifest now matches exactly, 46 of 46), §3.5 (853 tests in 68 files, not 74 in
ten), and the new §3.6 (19 migrations are committed). §4.1 is now resolved in
the Plan itself; §4.2 is measured against the Plan's own width formula.

---

## 2. Confirmed — Plan matches code

| # | Plan claim | Where | Verified by |
|---|---|---|---|
| 1 | Cards always show rating, distance, favorite, views; enforced on the type | §4 | `CardListing` has `rating`, `distanceKm`, `isFavorited`, `views` as required fields |
| 2 | Five card sizes, max widths 150/190/240/300/340px | §4 table | `CARD_SIZES` in `ListingCard.tsx` matches exactly |
| 3 | ~~No `supabase/` migration directory in the checkout~~ | §2A audit | **Stale since 22 Nov:** 19 migrations are committed (see §3.6) |
| 4 | Currency uses hard-coded `MMK_PER_USD = 4500` | §2A audit | **Half stale:** `FALLBACK_MMK_PER_USD = 4500` in `exchangeRates.ts` is now only the fallback; the rate in force is the latest row from `exchange_rates` (browser store until applied), and `currency.tsx` reads it |
| 5 | ~~No automated test runner in `package.json`~~ | §2A audit | **Stale since 20 Nov:** `test` script + Vitest added (see §3.5) |
| 6 | Local preview store keeps plaintext passwords | §2A audit | `type StoredUser = AuthUser & { password: string }` |
| 7 | Favorites live in `mh-travel-favorite-overrides` only | §2A audit | **Stale:** that key is now `LEGACY_KEY`, adopted once; rows live per account (`mh-travel:<base>:<userId>`) and write through to `public.favorites` |
| 8 | Blog reader uses `/blogs?story=<slug>` | §2A audit | `searchParams.get('story')` |
| 9 | Shared hero utility: 190 / 230 / 250px | §16 | `.mh-page-hero` in `index.css`, used by 10 pages (Account, Ticketing, Nearby, Blogs, Travel Plans, City, Foreign Tourist, Category, Rentals, Travel Guide) |

---

## 3. Stale — code moved on, Plan did not

These are not code defects. They are documentation debt, and they matter
because a future reader will trust the Plan.

### 3.1 `/blogs/:id` links no longer fall through

**Plan says** (§2A, line 119 and line 143): legacy `/blogs/<id>` paths "do not
match the router" and fall to Not Found.

**Code says**: `src/App.tsx` line 104 registers `/blogs/:storyId` and
`LegacyBlogRedirect` (line 55) forwards it to `/blogs?story=:id`. The links
work.

**Fix**: drop `/blogs/:id` from both stale-link lists.

### 3.2 "Only Supabase calls are auth.tsx"

**Plan says** (§2A): the only Supabase calls in source are Auth/session and
`public.profiles` lookup in `src/lib/auth.tsx`.

**Code says**: nine modules import the Supabase client and gate on
`isSupabaseConfigured` — `auth.tsx` (Auth, `profiles`), `mainOwnerApi.ts`
(branch accounts), `favorites.tsx` (`public.favorites`), `notifications.ts`
(read state), `reviews.ts` (`public.reviews`), `travelRequests.ts`
(`public.bookings`), `rentalOrders.ts` (order insert), `adServingApi.ts` and
`adClickApi.ts`. `mediaApi.ts` is a `fetch` to the R2 Worker endpoint, not
Supabase. Every one of these is best-effort: when the env is unset the browser
store answers instead, which is why the Plan's "no application API" claim read
as true for so long.

**Fix**: replace the three-module sentence with "nine Supabase modules, all
best-effort behind `isSupabaseConfigured`, plus `mediaApi.ts` for R2".

### 3.3 Route manifest "matches the concrete routes"

**Plan says** (§2A): `public/manus-routes.json` matches the concrete routes.

**Code says**: it matches exactly. `public/manus-routes.json` lists 46 paths
and `allPaths()` in `src/routes.ts` returns the same 46, including
`/blogs/:storyId`. `src/routes.manifest.test.ts` fails if the two lists differ,
if a path is untitled, or if a path appears twice, so the drift §3.3 recorded
cannot come back.

**Fix**: drop the row.

### 3.4 "City discovery rows use five desktop columns"

**Plan says** (line 701 and line 1074): City discovery rows were changed from
six to five columns to remove the empty sixth slot.

**Code says**: `columns={5}` is passed, and `ListingGridSection` renders
`w-[calc(50%-0.3125rem)] sm:w-[var(--card-w)]` inside a `flex flex-wrap`, so
the grid is **not** a five-column CSS grid — it is a flex row capped at
`5 × cardWidth + gaps`. On a wide screen with `md` cards the row is capped at
1230px, not stretched to five equal columns. The Plan describes a CSS grid
that the code does not use.

**Fix**: describe the cap, not the column count.

### 3.5 "No automated test runner"

**Plan says** (§2A audit): `package.json` has no `test` script and no
Vitest/Jest dependency, so nothing guards the tree.

**Code says**: `npm test` runs Vitest over 68 files (853 tests).
`src/routes.ts` is now the single route table; `App.tsx`, the tests, and
`public/manus-routes.json` all read from it. A seed link to an undeclared route,
a duplicated catalog id, or a manifest that drifts from the router fails the
suite.

**Fix**: drop the claim, and record `npm test` in the delivery checks.

### 3.6 "No `supabase/` migration directory"

**Plan says** (§2A audit, and it is listed as *confirmed* in §2 above): the
checkout has no `supabase/` directory, so nothing on the server side exists.

**Code says**: `supabase/migrations/` holds 19 committed migrations, from
`create_user_profiles_and_auth_policies` through
`20261129000100_shop_template_catalog_growth.sql`. What the Plan meant is still
true in a narrower sense — **none of them is applied**, so the browser store
remains the source of truth for every feature built on them — but "the directory
is absent" is now wrong, and a reader who trusts it would conclude the schema
work has not started.

**Fix**: replace the row with "19 migrations committed, none applied", and keep
the "not applied" fact, which is the part that matters.

### 3.7 "Restaurant/Book Shop CTAs are visual only" and ":id is ignored"

**Plan says** (§2A): the Directions, Call, and View-all buttons have no handler,
and the two detail pages ignore the route parameter.

**Code says**: both pages read `:id` through `useParams` and resolve the record
from the catalog, their category selectors filter the menu and book lists, and
Directions and Call build a Google Maps search URL and a `tel:` link from
`src/lib/placeActions.ts`.

**Fix**: move these three rows out of §5 into the fixed list.

---

## 4. Internally contradictory — Plan vs Plan, and Plan vs code

### 4.1 The column-count rule contradicts the size table — **resolved 22 Nov**

`Plan/PROJECT-PLAN.md` §4 used to contain both of these, eleven lines apart.
The 22 November edit deleted the second rule and wrote the exception into the
first, so the Plan now says five-column primary rows use `md`, six-column
Populars use `xs`, and only three-column rows may use `xl` — which is what the
code does. The evidence below is kept because it is the record of why the rule
changed:

| Line | Rule |
|---|---|
| 183 | `md` is the **default for every grid row**: Hotels, Book Shops, Rentals, Transport, Markets, Restaurants, Cafes, Nearby, City and Search |
| 193–194 | **five and six column rows use `xs` or `sm`**, four column rows use `lg` at most, only three column rows may use `xl` |

A five-column row of Hotels cannot simultaneously be the default `md` and be
required to use `xs`/`sm`. The code follows the table (line 183), not the rule
(line 193), in fifteen places:

| File | Section | Columns | Size |
|---|---|---|---|
| `HomePage.tsx` | Popular Hotels | 5 | `md` |
| `HomePage.tsx` | Book Shops | 5 | `md` |
| `HomePage.tsx` | Rentals | 5 | `md` |
| `HomePage.tsx` | Transport Operators | 5 | `md` |
| `HomePage.tsx` | Markets | 5 | `md` |
| `HomePage.tsx` | Top Attractions | 5 | `md` |
| `HomePage.tsx` | Restaurants | 5 | `md` |
| `HomePage.tsx` | Cafes | 5 | `md` |
| `CityPage.tsx` | Popular Hotels | 5 | `md` |
| `CityPage.tsx` | Restaurants | 5 | `md` |
| `CityPage.tsx` | Book Shops | 5 | `md` |
| `CityPage.tsx` | Rentals | 5 | `md` |
| `CityPage.tsx` | Transport Operators | 5 | `md` |
| `CityPage.tsx` | Cafes | 5 | `md` |
| `CityPage.tsx` | Markets | 5 | `md` |

Rows that **do** obey the rule: Blogs (`4 / sm`), Populars (`6 / xs`), Travel
Guide on Home (`4 / lg`), Travel Plans (`3 / xl`), City Travel Guide
(`3 / xl`), City Top Attractions (`5 / xs`), and the three bottom rows on
Blogs, Travel Guide (`5 / sm`).

**This was the single most important finding in this document.** Either the
rule at line 193 was wrong, or fifteen rows were wrong. It was settled on
22 November in favour of the rows: the rule is gone, the table stands.

### 4.2 Direct card grids declare `md` under a `sm` width cap — **fixed 24 Nov 2026**

Five page-level grids are true CSS grids (not the capped flex row of §3.4), so
they really do render five columns. All five carried `justify-items-center` and
a `max-w-`, which the Plan asks for — but three of the widths were the `sm`
number under a declared `md` card:

| File | Columns | Size | Was | Formula (`columns × maxWidth + gaps`) |
|---|---|---|---|---|
| `CityPage.tsx` (discovery row) | 5 at `md` | `md` | 1240px | 5 × 240 + 4 × 10 = 1240 — matched |
| `CityPage.tsx` (business explorer) | 4 at `md`, 5 at `lg` | `md` | 1240px | 1240 — matched |
| `FavoritesPage.tsx` | 5 | `md` | 990px | 1240 — this was the `sm` cap |
| `AccountPage.tsx` (two grids) | 5 | `md` | 998px | 1240 — `sm` cap with `gap-3` |
| `BlogsPage.tsx` (related hotels) | 5 | `md` | 982px | 1240 — `sm` cap with `gap-2` |

The cards did not stretch past their `maxWidth`; they were simply handed a
190px column while declared `md`, so the row read as `sm` and the size prop was
a dead letter.

**The fix computes the number instead of hand-writing it.** `src/lib/cardGrid.ts`
holds the pixel table (`CARD_MAX_WIDTH_PX`, mirroring `CARD_SIZES`),
`cardGridMaxWidth(columns, size, gap)` and `cardGridStyle()`. Every capped card
grid — Favorites, Account, Blogs related hotels, City (both), Category, Place,
Search and Travel Plans — now applies `cardGridStyle(...)` inline, because
Tailwind cannot see a class name built at runtime. `src/lib/cardGrid.test.ts`
fails if a page hand-writes a five-column cap again, and fails if the pixel
table drifts from the `maxWidth` classes in `ListingCard.tsx`.

The docs' earlier suggestion was to declare `size="sm"` instead. Widening to the
formula was chosen because the cards are drawn at `md` (larger type and image)
and the narrower cap was shrinking them, not the other way round. Verified in
the browser: `/favorites` renders six `md` cards under a 1240px cap, `/hotels`
under 1240px, `/travel-plans` under 1230px (4 × 300 + 3 × 10).

---

## 5. Still accurate — the Plan's open gaps are real

| Plan item | Status in code |
|---|---|
| Catalog, bookings, plans, notifications are compiled data, not API | **Half confirmed at `abe2700`.** The catalogs are still compiled data, and no module reads them from a table. But nine modules now *write* best-effort rows through `supabase` when the env is set (`favorites.tsx`, `notifications.ts`, `reviews.ts`, `travelRequests.ts`, `rentalOrders.ts`, `adServingApi.ts`, `adClickApi.ts`, plus `auth.tsx` and `mainOwnerApi.ts`). So "no query layer" is true for reads, false for writes. |
| Blog distances are seeded, not computed | **Confirmed.** Geolocation gates display only. |

The Plan's honesty here is a strength. These two items should stay, with the
first narrowed to reads.

A third gap row is also closed: Custom Plan, Rental, and Ticketing submissions
used to be local state only. Each one now writes a request record with a
readable reference, shows it on the confirmation screen, and lists it under the
account's Bookings or Travel Plans (see `COMPLETED-WORK.md`). Reading those
records back from `public.bookings` is still open.

A fourth gap row is closed: Plan §8 asked for per-type rental rules and a Rental
Admin who can change them, and the rentals page used to hardcode both. The
catalog now lives in `src/data/rentalCatalog.ts` (types, driver rule, minimum
days, vehicle options, local/foreign rates, city × type availability, branches,
terms) and is edited from the Super Admin **Rentals** view, with
`rentalCatalogProblems()` blocking an invalid save. `RentalsPage.tsx` reads it
instead of owning the data, and `estimateRental()` is the one pricing function
behind both the estimate panel and the submitted amount. The remaining gap is
storage: the record is browser-local until the catalog tables exist.

A seventh gap row is closed: Plan §9 states the owner money rules — commission
deducted at payment time with the rate snapshotted, twice-monthly payouts (1–15
on the 20th, 16–end on the 5th), a 50,000 MMK minimum that carries over, and a
rate that is Admin-discretion per shop including 0% — and §16D gates Phase 3 on
"a payout run is reproducible from ledger rows". All of that is now code:
`src/lib/ownerLedger.ts` (rules), `src/lib/ownerLedgerStore.ts` (rows),
`src/features/superAdmin/OwnerPayoutsPanel.tsx` (Super Admin and Payment Admin),
the Shop Owner Payments statement (`O (own earnings)`), and
`20261127000100_owner_ledger.sql` with `run_owner_payout()` and
`verify_owner_payout()`. The remaining gap is the same storage one as the other
rows: the browser store is authoritative until the migration is applied and
pointed at. What the Plan still leaves open in this area is the Main Owner
consolidated and Branch Owner ledgers, which depend on the operator hierarchy
in the second half of §9.

A sixth gap row is closed: Plan §10 §4 names Schedule, Unpublish, Delete and
Restore, and §7 acceptance 5 asks that two editors on one post never overwrite
each other. The first was wired earlier; the rest now live in
`src/lib/contentLifecycle.ts` and are called from both Admin panels, with the
reader dropping a withdrawn row and the seed it took over, and
`20261124000100_content_lifecycle.sql` carrying the same `version + 1` rule on
the server. The remaining gap is the same storage one as the other content
rows: the guard is enforced in the browser until the migration is applied.

A fifth row is closed: Plan §8.12 lists ten acceptance criteria for Rental and
four of them were unenforced. Criteria 1, 5, 9 and 10 are now checked in the
client preview — one order per submit, a voucher lookup scoped to the viewer
(staff read all, a traveller reads their own, a signed-out visitor reads none),
the 24-hour reschedule notice counted from Yangon midnight rather than a
browser-local one, and all 23 `rental_error_*` codes the migrations raise
carrying both an MM and an EN string, with `src/lib/rentalErrorMessages.test.ts`
reading the codes out of `supabase/migrations` so a new one cannot land
untranslated. Criteria 6–8 stay open until the migrations are applied, because
they describe what the server does.

A seventh row is closed: Plan §16A.2 said the Adsboard was nine pages of local
state with a fixed Rentals banner and no serving function the pages could call.
§16A.1–§16A.9 are now implemented against one seam — `src/lib/adPlacements.ts`,
`adCampaigns.ts`, `adStats.ts`, `adCampaignJobs.ts`, `adClicks.ts` and the
browser stand-in in `adStore.ts` — with the §16A.4 DDL committed in
`supabase/migrations/20261125000100_ads.sql`, the serving and access SQL in
`20261125000200_ads_serving.sql`, and the §16A.7 seven sections in
`AdsManagementPanel.tsx`. One Plan detail still differs from the code and it is
deliberate: the fallback step is AdSense only until the mobile app ships
(§16A.12). The click now goes through `/ad/click/<creative_id>` as §16A.5 says —
the route records the click and then redirects, so a copied or shared link still
counts once. §16A.2's "columns must be checked before the schema is applied" is
still open: both migrations are written but not applied, so the browser storage
remains the source of truth.

The three gap rows this section used to carry are closed:

| Was | Now |
|---|---|
| Restaurant menu category selector did not filter dishes | `filterByCategory` in `src/lib/categoryFilter.ts`, unit-tested |
| Restaurant/Book Shop CTAs were visual only | Directions and Call build real URLs; dead View-all labels removed |
| Restaurant/Book Shop `:id` ignored the route parameter | Both pages resolve their record from `useParams` |

---

## 6. What the Plan does not mention at all

Gaps in the Plan's coverage, found while checking it:

1. ~~**48 broken internal links.**~~ **Fixed 20 Nov** and now enforced by
   `npm test`. See [`STATUS.md` §5](./STATUS.md#5-internal-links--done-at-route-level-0-broken-routes).
2. ~~**`/book_shop` typo.**~~ **Fixed.** It maps to `/book-shops`.
3. ~~**Load More behaviour.**~~ **Fixed 20 Nov; rule added to the Plan 22 Nov.**
   Both lists share `src/lib/usePagedList.ts` with a fixed page size of 12,
   which divides evenly into every column count the app uses.
4. ~~**Tablet horizontal overflow at 820px.**~~ **Fixed 20 Nov.** The header
   switched to its desktop nav at `md` before it had room; it now switches at
   `lg`, and `/account` got a constrained grid column. Verified clean at ten
   widths from 360px to 1280px.
5. **`xs` card readability on phones** (145×67px, 9px/7px type). Not mentioned.
6. ~~**Shop Owner and Main Owner have no `useLanguage`.**~~ **Fixed 22 Nov.**
   Both dashboards are bilingual now; Super Admin body copy is the only one
   still mostly English.
7. ~~**`Doc/` and `Plan/` overlap.**~~ **Resolved.** The Plan's first line now
   names `Doc/STATUS.md` as the status view, and `Doc/README.md` names it as
   the file to read first. `COMPLETED-WORK.md` and `REMAINING-WORK.md` are the
   detail behind it, not a second answer.

### 6a. Detail ids that no catalog resolves — **fixed 24 Nov 2026**

`links.test.ts` proves every seed `href` matches a *declared route*. It did not
prove the `:id` resolved to a *record*, and **7 of the 47** detail hrefs did not:

| Href | Page reached | What the reader saw |
|---|---|---|
| `/hotels/pp1`, `/hotels/pp4` | `PlaceDetailPage` | the not-found state |
| `/markets/pp3`, `/markets/pp6` | `PlaceDetailPage` | the not-found state |
| `/hotels/tp1` (notification) | `PlaceDetailPage` | the not-found state |
| `/book-shops/pp2`, `/book-shops/pp5` | `BookShopPage` | **the first book shop**, silently |

Six were the Home **Populars** row: `POPULARS` in `homeData.ts` linked `pp1…pp6`
across `/hotels/`, `/book-shops/` and `/markets/`, and none of those ids existed
in `placeCatalog.ts`. `/hotels/tp1` was a notification whose href had been
copied from the travel plan `tp1`.

Two faults, and the second was the worse one:

1. The Populars row linked ids that did not exist.
2. `RestaurantPage.tsx` and `BookShopPage.tsx` both ended in `?? LISTINGS[0]`.
   An unknown id therefore rendered a real record instead of a not-found state,
   so the URL silently lied about what the reader was looking at.

**Both are fixed.** Populars now links `/hotels/sedona-yangon`,
`/hotels/lotte`, `/book-shops/shwe`, `/book-shops/book-nook`,
`/markets/bogyoke` and `/markets/junction-city`; the notification points at
`/hotels/sedona-yangon`. `src/lib/detailRoutes.ts` is the one resolver every
detail page reads — `resolveDetailRecord(slug, id)` (place catalog for the seven
place slugs, the two city-page collections for restaurants and book shops) and
`resolveDetailHref(href)` — and `src/components/ui/RecordNotFound.tsx` is what an
unknown id renders. `links.test.ts` now walks every seed detail href through
`resolveDetailHref()` and fails on any that resolves to nothing, which is the
record-level twin of the route test.

---

## 7. Recommended plan edits

Ordered by how much confusion each removes. None of these are code changes.
The re-check at `abe2700` marked six of them done, because the Plan text was
edited on 22–24 November. **All eleven are closed as of 24 November 2026:** the
last five were inside the §2A audit record, which had not been touched since
2026-11-09, so every claim in it was re-checked against the tree and rewritten.
The §2A record now dates each correction and names the file or test that holds
it.

| # | Edit | State |
|---|---|---|
| 1 | Resolve §4.1 — pick one column rule | ~~Done 22 Nov~~: §4 now says five-column rows use `md` and only three-column rows may use `xl`, matching the code |
| 2 | Delete the `/blogs/:id` stale claim | ~~Done~~: §2A now says the redirect forwards to the reader |
| 3 | Name the Supabase-touching modules | ~~Done 24 Nov~~: §2A names all nine modules that import the client (§3.2) |
| 4 | Add `/blogs/:storyId` to the route manifest | ~~Done~~: it is listed, and `routes.manifest.test.ts` keeps it there (§3.3) |
| 5 | Rewrite the "five desktop columns" sentences | ~~Done~~: §16 now describes the width cap (§3.4) |
| 6 | Add a Load More rule to §4 | ~~Done 22 Nov~~ |
| 7 | Point the Plan at `Doc/STATUS.md` | ~~Done~~: the Plan's first line names it as the status view |
| 8 | **Replace "no `supabase/` migration directory"** with "19 migrations committed, none applied" | ~~Done 24 Nov~~: §2A lists all 19 migrations by table (§3.6) |
| 9 | **Drop "no automated test runner"** and record `npm test` | ~~Done 24 Nov~~: §2A records 868 tests in 71 files, 15 of them rendering a page |
| 10 | **Drop the 48-broken-links count** and the visual-CTA rows | ~~Done 24 Nov~~: §2A strikes both and says what guards them |
| 11 | **Narrow "catalog data is not API"** to reads | ~~Done 24 Nov~~: §2A splits reads from writes (§5) |

The only **code** items on this list are now closed: the seven detail hrefs that
reached a page unable to resolve their id (§6a) and the three grid caps that
contradicted their declared card size (§4.2). Both are test-guarded, and §6a now
has a component test that renders the three detail pages and reads the DOM, so
the not-found state no longer rests on a unit test alone.

### 6b. No page was ever rendered by a test — **started 24 Nov 2026**

`npm test` guarded routes, seed links, the manifest, the domain rules and the
dictionary, but no test mounted a page, so a filter, tab or form could break
without a red suite. Two page suites exist now, both run under jsdom in
`*.dom.test.tsx` files and both mutation-checked (break the code, watch the test
fail):

| Suite | Covers |
|---|---|
| `src/features/place/PlaceDetailPage.dom.test.tsx` | the not-found state on `PlaceDetailPage`, `RestaurantPage` and `BookShopPage`, in MM and EN |
| `src/features/blogs/BlogsPage.dom.test.tsx` | the category filter narrows to its own stories, `aria-pressed` moves, and All restores the list |

Still hand-checked: the Account tab sets, the Search chips, the rental order form,
and every admin panel form.

A third suite, `src/features/emptyStates.dom.test.tsx`, closes the backlog item
that said no list was audited for an empty state: it drives Blogs, Travel Guide,
Travel Plans, Rentals, Nearby, a category page and Favorites each to the state
they show when nothing matches, and asserts the MM/EN copy.

Items 8–11 are mechanical, and each one currently understates the project. Item
3 is mechanical too but needs the list of nine modules from §3.2.
