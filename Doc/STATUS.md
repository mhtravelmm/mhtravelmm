# MH Travel — Work Status Record

**Last audited:** 20 November 2026
**Audited against:** `main` @ `8cdcf4e` plus the audit commit that carries
this file's 20 November findings.

This file is the single status view for the project. It replaces guesswork about
what is finished: every item below was checked against the actual source tree,
not against earlier notes. Two companion files hold the detail:

- [`COMPLETED-WORK.md`](./COMPLETED-WORK.md) — what is built and verified.
- [`REMAINING-WORK.md`](./REMAINING-WORK.md) — what is not built yet, grouped by
  the layer it belongs to.
- [`PLAN-VS-CODE.md`](./PLAN-VS-CODE.md) — every Plan claim tested against the
  source tree: what is confirmed, what has gone stale, and where the Plan
  contradicts itself.

The authoritative product plan stays in
[`../Plan/PROJECT-PLAN.md`](../Plan/PROJECT-PLAN.md).

---

## 1. How to read the status marks

| Mark | Meaning |
|---|---|
| **DONE** | Implemented in code and verified in this audit. |
| **PARTIAL** | Implemented but with a known gap, listed in the item notes. |
| **PREVIEW** | Works, but on local/seed data instead of a backend. |
| **NOT DONE** | Planned, not implemented, or actively broken. |

`PREVIEW` is not a failure. The project was built frontend-first, so most
traveler features are intentionally preview-quality until the backend wiring
lands. The distinction matters because a preview feature can look finished
while still having no persistence.

---

## 2. Delivery checks

Verified on this audit:

| Check | Result |
|---|---|
| TypeScript typecheck | **PASS** (0 errors) |
| Vite production build | **PASS** |
| ESLint | **PASS** (0 errors, 7 pre-existing warnings) |
| `npm test` (vitest) | **PASS** (23 tests, 4 files) |
| Seed link audit | **PASS** (0 broken of 261 clickable targets) |
| Route audit | **PASS** (42 declared routes, all render) |

The test runner is the change that keeps this list honest: `npm test` fails if
a seed link, a catalog id, or the route manifest drifts from the routes the
app declares.

---

## 3. Design system

| Item | Status | Notes |
|---|---|---|
| Five card sizes, no others | **DONE** | `xs/sm/md/lg/xl` in `src/components/ui/ListingCard.tsx` |
| Card width cap (no long bars) | **DONE** | `maxWidth` per size: 150/190/240/300/340px |
| Grid cap per page | **DONE** | Blogs, Favorites, Account, City, Search, Travel Plans |
| Plan doc matches code | **DONE** | Card table in `PROJECT-PLAN.md` §4 matches `CARD_SIZES` |
| Dark theme base + light theme | **DONE** | `.light` class on `<html>`, tokens in `tailwind.config.js` |
| Bilingual MM/EN provider | **PARTIAL** | 761 keys; dashboards lag (see §6) |
| Site-wide right-click / zoom guard | **DONE** | Interaction guard component |

### Card size reference (verified against code)

| Size | Max width | Image height | Title | Body padding |
|---|---|---|---|---|
| `xs` | 150px | 32px | 9px | 4px |
| `sm` | 190px | 40px | 10px | 6px |
| `md` | 240px | 52px phone / 56px web | 11px / 12px | 8px |
| `lg` | 300px | 60px phone / 64px web | 12px / 13px | 8px |
| `xl` | 340px | 68px phone / 72px web | 13px / 14px | 10px |

---

## 4. Traveler-facing pages

All 42 declared routes resolve, verified by a headless crawl of every path and
by `src/routes.manifest.test.ts`. Every page below renders without a crash.

| Route | Status | Notes |
|---|---|---|
| `/` Home | **PREVIEW** | 12 sections, seed data, ad slots wired to local pipeline |
| `/cities` | **PREVIEW** | City grid + category explorer |
| `/cities/:cityId` | **PREVIEW** | Hero, facts, recommendations, category explorer |
| `/nearby` | **PREVIEW** | Geolocation with Yangon fallback, 13 categories |
| `/rentals` | **PREVIEW** | 10 rental records, booking form is local state |
| `/restaurants` | **PREVIEW** | Menu, category filter, reviews, photos, CTA links |
| `/restaurants/:id` | **PREVIEW** | Resolves the record from `:id` |
| `/book-shops` | **PREVIEW** | Books, stationery, gifts, reviews, CTA links |
| `/book-shops/:id` | **PREVIEW** | Resolves the record from `:id` |
| `/attractions`, `/hotels`, `/cafes`, `/markets`, `/book-shops`, `/rentals`, `/transport`, `/populars` | **PREVIEW** | Catalog list with search and Show more |
| `/categories` | **DONE** | Category index linking all nine catalogs |
| `/:slug/:id` place detail | **PREVIEW** | Shared detail page for seven catalogs |
| `/ticketing` | **PREVIEW** | Bus/train/events/cinema flows, seat selection |
| `/travel-plans` | **PREVIEW** | Search, filters, custom-plan builder |
| `/travel-plans/:planId` | **PREVIEW** | Generated itinerary, pricing, CTA |
| `/travel-guide` | **PREVIEW** | Category + search filters |
| `/travel-guide/:guideId` | **DONE** | Full guide reader with itinerary timeline |
| `/blogs` | **PREVIEW** | Listing + in-page reader via `?story=` |
| `/blogs/:storyId` | **DONE** | Legacy path redirects to `/blogs?story=:id` |
| `/search` | **PREVIEW** | City/category/combined query modes |
| `/favorites` | **PREVIEW** | localStorage-backed |
| `/account` | **PREVIEW** | Dashboard shell, sample state |
| `/notifications` | **PREVIEW** | All/Unread/Read filters |
| `/account/notifications` | **PREVIEW** | Same inbox, account-scoped path |
| `/login` | **PARTIAL** | UI complete; local preview session |
| `/signup` | **PARTIAL** | UI complete; local preview session |
| `/admin/login` | **PARTIAL** | Separated from traveler login |
| `/super-admin` | **PARTIAL** | Guarded; English-only body copy |
| `/shop-owner` | **PARTIAL** | Guarded; no i18n at all |
| `/main-owner` | **PARTIAL** | Guarded; no i18n at all |

---

## 5. Internal links — **DONE** (0 broken)

The 48 broken links recorded in the previous audit are fixed and the fix is now
guarded by tests. `npm test` fails if a seed `href` stops resolving.

### 5a. Category pages — added (9)

`/attractions`, `/hotels`, `/restaurants`, `/cafes`, `/markets`,
`/book-shops`, `/rentals`, `/transport`, `/populars` are real routes served by
`CategoryPage`, plus `/categories` as the index. Each renders its own catalog
with search and a Show more control.

The previous "View all" targets `/reviews`, `/partners`, and `/awards` were
removed rather than routed: those three Home sections already render their
full content inline, so the button led nowhere useful.

### 5b. Detail pages — added (35)

| Pattern | Count | Example |
|---|---|---|
| `/hotels/:id` | 8 | `/hotels/lotte` |
| `/cafes/:id` | 5 | `/cafes/java` |
| `/markets/:id` | 7 | `/markets/bogyoke` |
| `/attractions/:id` | 5 | `/attractions/ta1` |
| `/ticketing/:id` | 5 | `/ticketing/jj-express` |
| `/rentals/:id` | 5 | `/rentals/pre1` |

All are served by `PlaceDetailPage`, which resolves the record from
`placeCatalog.ts` by id or by the trailing href segment. A record whose tail
matches no entry renders the not-found state rather than a blank page.

`/book_shop` (underscore) now maps to `/book-shops`.

### 5c. What the tests lock down

`src/data/links.test.ts` walks every seed `href` in the data modules and fails
if one does not resolve against `src/routes.ts`. `src/routes.manifest.test.ts`
fails if `public/manus-routes.json` drifts from the declared routes. Adding a
link without a route is now a test failure, not a silent 404.

Still open, and not a link problem: `/emergency`, `/exchange`, and `/sim_card`
are referenced by the Plan as future utility pages. No seed data links to them.

---

## 6. Dashboards

| Area | Status | Notes |
|---|---|---|
| Super Admin metrics/users/content | **PARTIAL** | Seeded metrics, English body |
| Super Admin Ads Management | **PREVIEW** | Page-oriented placements, local state |
| Shop Owner creation | **PREVIEW** | Local persistence, plaintext preview password |
| Admin Management | **PREVIEW** | Local state |
| Blog Post Management | **PARTIAL** | Editor complete, upload falls back locally |
| Shop Owner dashboard | **PARTIAL** | English-only, no `useLanguage` |
| Main Owner dashboard | **PARTIAL** | English-only, no `useLanguage` |
| Role guards | **DONE** | Super Admin, Shop Owner, Main Owner protected |

---

## 7. Backend and persistence

| Item | Status | Notes |
|---|---|---|
| Supabase project + migrations | **DONE** | Profiles, favorites, plans, bookings, notifications, reviews, ads, audit logs |
| RLS policies | **DONE** | Owner/admin policies with helper + indexes |
| Auth session hydration | **PARTIAL** | Works when env is configured |
| Email/password + OAuth calls | **PARTIAL** | Provider secrets and redirect URLs still needed |
| Favorites persistence | **PREVIEW** | localStorage; table exists, form not wired |
| Bookings / plan requests | **PREVIEW** | UI only, no insert |
| Notifications | **PREVIEW** | localStorage, tab-synced |
| Exchange rate | **PREVIEW** | `1 USD = 4,500 MMK` hard-coded default |
| Blog media (Cloudflare R2) | **PARTIAL** | Adapter exists, no deployed Worker |

`localStorage` is used across 8 files with 14 distinct keys. Every one of them
is a production replacement target, listed in `REMAINING-WORK.md`.

---

## 8. Code hygiene

| Check | Result |
|---|---|
| `TODO` / `FIXME` / `HACK` markers | 0 |
| `console.log` in source | 0 |
| Images without `alt` | **0** of 242 rendered images |
| Interactive elements without an accessible name | **0** of 1120 |
| Duplicate `<h1>` per page | 0 |
| Duplicate or missing `<main>` landmark | 0 |
| axe-core violations, all rules except contrast | **0** across 23 routes |
| axe-core `color-contrast` | **64 nodes** on 17 routes |

Measured with axe-core in headless Chromium on 20 November 2026, at 1440px,
against 23 routes (every declared page plus the three dashboards). The earlier
"139 buttons without `aria-label`" figure counted the attribute, not the
accessible name — a button with visible text needs no `aria-label`, so that
number overstated the problem. Counting accessible names instead, six sponsored
ad links and the notification bell were the only real gaps; all are fixed.

The 64 contrast failures are a palette decision, not 64 bugs. Two pairs account
for 55 of them: white on `brand-blue` `#4d8dff` (3.2:1, 38 nodes) and
`brand-red` `#c0392b` as text on the dark card (3.3:1, 17 nodes). Both pass as
large or bold display type and fail at 9–12px. The remaining nine sit on the
admin dashboards, which use their own navy/cyan surfaces. Fixing the two main
pairs means darkening the blue to about `#356fe0` and using a lighter red for
text, which changes the brand palette, so it is left as a deliberate decision
rather than slipped in with a documentation pass.

---

## 9. What the Plan says vs what the code does

Two places where the doc and the tree disagreed, now reconciled:

1. **Card sizes.** The Plan table and `CARD_SIZES` match after the revert.
   Earlier rewrites (fixed-box, 3:2 scale) were reverted in `5f3924b` and
   preserved on branch `backup/cards-3to2-35fcc5e`.
2. **Load More.** The Plan still does not describe Load More behaviour, so the
   code defined it twice. Both pages now share one helper
   (`src/lib/useGridColumnCount.ts`), which reads the grid's real column count
   from the computed style and rounds each page up to a whole row:

   | Page | Page size | Columns | Row-full check |
   |---|---|---|---|
   | Blogs | 6, rounded to the row | 1 / 2 / 3 / 4 | `alignToRow` |
   | Travel Guide | 6, rounded to the row | 1 / 2 / 3 / 4 | `alignToRow` |

   Six items in a four-column grid now render as eight, so no row is left half
   empty, and the final page is clamped to what exists so nothing is hidden.
   Unit-tested in `useGridColumnCount.test.ts`.

   **Still open on the Plan side.** `PROJECT-PLAN.md` §4 does not state the
   rule, so a third list could still be written without it.

---

## 10. Suggested next order

Steps 1 and 2 are now done, so the list starts where the frontend stops:

1. Decide the two brand-palette contrast values, then re-run axe to zero.
2. Localize Shop Owner and Main Owner.
3. Wire Favorites, Notifications, and Reviews to the tables that already exist.
4. Connect the Custom Plan, Rental, and Ticketing submissions to request
   records with an ID and a confirmation.
5. Replace seeded catalog data with city-scoped Supabase queries.

The first three are frontend work with no new infrastructure. Steps 4 and 5
need the backend push.
