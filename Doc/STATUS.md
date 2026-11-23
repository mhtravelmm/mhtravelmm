# MH Travel — Work Status Record

**Last audited:** 23 November 2026
**Audited against:** `main` plus the rental order rules in
`src/lib/rentalOrderRules.ts`, the Rental catalog data module, the Rental Admin
panel, the per-account Favorites/notification/review wiring, and the earlier
22 November work on the guide route follower, the two owner dashboards, the
Foreign Tourist section, and the Super Admin localization pass.

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
| `npm test` (vitest) | **PASS** (314 tests, 25 files) |
| Seed link audit | **PASS** (0 broken of 261 clickable targets) |
| Route audit | **PASS** (43 declared routes, all render) |

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
| Bilingual MM/EN provider | **DONE** | 1,610 keys in `src/lib/translations.ts`; every traveler page, dashboard shell, both content editors and the Rental Admin panel are localized |
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

All 43 declared routes resolve, verified by a headless crawl of every path and
by `src/routes.manifest.test.ts`. Every page below renders without a crash.

| Route | Status | Notes |
|---|---|---|
| `/` Home | **PREVIEW** | 12 sections, seed data, ad slots wired to local pipeline |
| `/cities` | **PREVIEW** | City grid + category explorer |
| `/cities/:cityId` | **PREVIEW** | Hero, facts, recommendations, category explorer |
| `/nearby` | **PREVIEW** | Geolocation with Yangon fallback, 13 categories |
| `/rentals` | **PARTIAL** | Categories come from `src/data/rentalCatalog.ts` with the Plan §8.2 decisions applied: Yangon offers no motorbike or scooter, self-drive car is retired, car types and bicycle types are data. The selector lists only what the chosen city offers. A signed-in traveler submits an order with a `RNT-YYMMDD-####` code and opens `/account/bookings/<code>` for the printable voucher. Rental Admin → Orders drives the lifecycle (accept, record payment, complete, expire, cancel), filters by status/city/type/date, searches code, name and phone, and requires a reason to cancel. The Rental Admin panel covers all seven Plan §8.8 sections: catalog, availability, rates by city × type × variant with effective dates and history, branches with address and phone, published terms versions, and settings. Rental notifications fire on every status change: Requested to staff, Accepted/Paid/Expired/Cancelled to the traveler, reschedules back to staff. Rental Admin → Rental reports adds status, city, type and day tallies, paid conversion, median accept time, settled value and a CSV export. Every catalog save and every order status change writes an audit-log row, the five-minute expiry job moves unpaid Accepted orders to Expired, and a travel guide's lodging, food and travel costs are added as lines on the order (§16). Order submission now mirrors the §8.7 server rules on the client: `src/lib/rentalOrderRules.ts` validates city availability, variant, branch, the Myanmar Time start, minimum days, name, phone, address, participants, terms version and the per-account hourly limit, and recomputes the total from the catalog so a tampered form cannot create a cheap order. Every rejection returns a `rental_error_*` code that the page shows in MM and EN — all 23 codes the migrations raise now have both texts, guarded by `src/lib/rentalErrorMessages.test.ts`. The voucher lookup is scoped to the viewer, so a guessed `/account/bookings/<code>` no longer reveals another traveller's order, and the reschedule notice and the request-code day are counted in Myanmar Time. Still browser storage rather than the catalog and order tables; migrations are committed but not applied |
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
| `/travel-guide/:guideId` | **DONE** | Guide reader with itinerary timeline and a stop-by-stop "Follow this route" stepper |
| `/blogs` | **PREVIEW** | Listing + in-page reader via `?story=` |
| `/blogs/:storyId` | **DONE** | Legacy path redirects to `/blogs?story=:id` |
| `/foreign-tourist` | **DONE** | Post-arrival help: emergency numbers, SIM, etiquette, money (Plan §13) |
| `/search` | **PREVIEW** | City/category/combined query modes |
| `/favorites` | **PREVIEW** | localStorage-backed |
| `/account` | **PREVIEW** | Dashboard shell, sample state |
| `/notifications` | **PREVIEW** | All/Unread/Read filters |
| `/account/notifications` | **PREVIEW** | Same inbox, account-scoped path |
| `/login` | **PARTIAL** | UI complete; local preview session |
| `/signup` | **PARTIAL** | UI complete; local preview session |
| `/admin/login` | **PARTIAL** | Separated from traveler login |
| `/super-admin` | **PARTIAL** | Guarded; shell, every panel and both content editors are bilingual |
| `/shop-owner` | **PARTIAL** | Guarded; bilingual labels, preview data |
| `/main-owner` | **PARTIAL** | Guarded; bilingual labels, preview data |

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

`/emergency` and `/sim_card` are not separate routes: the Home tiles that used
to imply them open the matching anchor on `/foreign-tourist` (Plan §13). The
Exchange tile keeps pointing at the Nearby exchange listings, which are real
places rather than advice.

---

## 6. Dashboards

| Area | Status | Notes |
|---|---|---|
| Super Admin metrics/users/content | **PARTIAL** | Seeded metrics; body localized through `useLanguage` |
| Super Admin Ads Management | **PREVIEW** | Page-oriented placements, local state |
| Shop Owner creation | **PREVIEW** | Local persistence, plaintext preview password |
| Admin Management | **PARTIAL** | Local state; form offers the eight Plan §3 roles and creates a real local admin account with the chosen role |
| Blog Post Management | **PARTIAL** | Ordered blocks with text, photo (alt/caption/credit) and ad slots, reorder, publish checks, revisions and audit log; upload falls back locally. Localized through `useLanguage` |
| Travel Guide Management | **PARTIAL** | Editor and itinerary builder with listing-linked stops, publish checks, revisions, audit log, and per-post earning rows; content is still local state. Localized through `useLanguage` |
| Shop Owner dashboard | **PARTIAL** | Bilingual through `useLanguage` with a header language control; data is still local |
| Main Owner dashboard | **PARTIAL** | Bilingual through `useLanguage`; branch-account validation messages are translation keys |
| Role guards | **DONE** | Super Admin, Shop Owner, Main Owner protected. Plan §3 and §16B.1 now scope one admin workspace per role: `src/lib/adminWorkspace.ts` lists the sections each role may open, and the Super Admin page filters its navigation through it, so Ads Admin sees only Ads, Payment Admin only orders/reports/currency, Blog Post Admin only Blogs, and Travel Guide Content Admin only Guides. `src/lib/roleMapping.ts` maps every one of the eight `profiles.role` slugs to a product role, and `auth.tsx` hydrates `adminRole` from the profile row, which is what the workspace reads |

---

## 7. Backend and persistence

| Item | Status | Notes |
|---|---|---|
| Supabase project + migrations | **DONE** | Profiles, favorites, plans, bookings, notifications, reviews, ads, audit logs |
| RLS policies | **DONE** | Owner/admin policies with helper + indexes |
| Auth session hydration | **PARTIAL** | Works when env is configured |
| Email/password + OAuth calls | **PARTIAL** | Provider secrets and redirect URLs still needed |
| Favorites persistence | **PARTIAL** | Per-account scope + `public.favorites` write-through; anon access still local |
| Bookings / plan requests | **PREVIEW** | UI only, no insert |
| Notifications | **PARTIAL** | Read state per account, synced to `public.notifications`; feed rows still seeded |
| Exchange rate | **PREVIEW** | `1 USD = 4,500 MMK` hard-coded default |
| Rental order rules (§8.7) | **PREVIEW** | All fifteen checks mirrored in `src/lib/rentalOrderRules.ts`; the migration holds the authoritative copy |
| Blog media (Cloudflare R2) | **PARTIAL** | Adapter exists, no deployed Worker |

`localStorage` is used across 9 files with 15 distinct keys. Every one of them
is a production replacement target, listed in `REMAINING-WORK.md`. The Favorites
and notification-read keys are now account-scoped (`mh-travel:<base>:<userId>`),
so they no longer leak between accounts on a shared browser.

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
| axe-core `color-contrast` | **64 nodes** on 17 routes; `/foreign-tourist` adds 0 in either theme |

Measured with axe-core in headless Chromium on 20 November 2026, at 1440px,
against 23 routes (every declared page plus the three dashboards). The
`/foreign-tourist` page added on 22 November was re-checked the same way in
dark and light, in both languages, and reports no violations; it uses the new
`text-link` token rather than `brand-blue` for small accent text, which is what
the light theme needed. The earlier "139 buttons without `aria-label`" figure
counted the attribute, not the accessible name — a button with visible text
needs no `aria-label`, so that number overstated the problem. Counting accessible names instead, six sponsored
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
2. **Load More.** The Plan now states the rule (§4) and the code follows it.
   Both pages share `src/lib/usePagedList.ts`:

   | Page | Page size | Columns | Helper |
   |---|---|---|---|
   | Blogs | 12 | 1 / 2 / 3 / 4 | `usePagedList` |
   | Travel Guide | 12 | 1 / 2 / 3 / 4 | `usePagedList` |

   Twelve divides evenly into two, three, four and six columns, so a revealed
   batch always fills its rows; the last batch is clamped to what exists so
   nothing is hidden, and the button disappears once everything is shown.
   Unit-tested in `usePagedList.test.ts`.

   The earlier row-reading version (`useGridColumnCount` + `alignToRow`) is
   gone: it needed a live measurement to page correctly, which the fixed page
   size removes.

---

## 10. Suggested next order

Steps 1 and 2 are now done, so the list starts where the frontend stops:

1. Decide the two brand-palette contrast values, then re-run axe to zero.
2. ~~Localize Shop Owner and Main Owner.~~ **Done 22 November 2026.**
3. ~~Localize the remaining Super Admin body copy.~~ **Done 22 November 2026.**
   ~~Localize the Blog and Travel Guide editor panels.~~ **Done.** Frontend
   localization is complete; the remaining gap is the backend.
4. ~~Wire Favorites, Notifications, and Reviews to the tables that already
   exist.~~ **Done 22 November 2026.** Favorites and notification read-state
   are per-account and write through to `public.favorites` and
   `public.notifications`; the platform reviews section reads
   `public.reviews`. Feed rows and the seeded review copy still come from
   local data, so the remaining work there is Admin authoring, not plumbing.
5. ~~Turn the rental catalog into data with a Rental Admin panel.~~ **Done 22
   November 2026.** Types, per-type rules, city × type availability, branches,
   local and foreign rates and terms live in `src/data/rentalCatalog.ts` and are
   edited from the Super Admin **Rentals** view. Pricing is one function shared
   by the estimate panel and the request. Moving the record from browser storage
   to catalog tables is the remaining step.

   **Rental order lifecycle (Plan §8.3–§8.7), 22 November 2026.** `src/lib/rentalOrders.ts`
   holds the order record, the status machine (`requested → accepted → paid →
   completed`, plus `expired` and `cancelled`), the 12-hour payment window, the
   one reschedule after payment and the voucher version. The traveler submits from
   `/rentals` and prints the voucher at `/account/bookings/<request_code>`;
   Rental Admin → Orders accepts, records payment, completes, expires and cancels.
   `supabase/migrations/` carries the five migrations that make the server the
   authority (`submit_rental_order`, `set_rental_order_status`,
   `reschedule_rental_order`, `expire_overdue_rental_orders`); they are not
   applied yet, so the browser record is still authoritative.

   **§8.7 rules mirrored, 23 November 2026.** `src/lib/rentalOrderRules.ts`
   repeats all fifteen `submit_rental_order` checks in the server's order
   (category, city availability, variant, branch, Myanmar Time start, end,
   minimum days, name, phone, address, participants, terms version, hourly
   limit, rate present) and returns one `rental_error_*` code each; the page
   renders it in MM and EN. `quoteRentalOrder()` is the only quote, so the
   estimate panel and the stored total cannot disagree, and `buildRentalOrder()`
   ignores the client total entirely (§8.12 acceptance 2–4).

   **§8.12 acceptance 1, 5, 9 and 10, 23 November 2026.** Submitting is spent
   once the code is shown, so one click makes one order. `orderForViewer()` and
   `canReadAllOrders()` scope the voucher to the viewer: staff (Rental Admin,
   Admin, Payment Admin, Super Admin) read every order, a traveller reads their
   own, a signed-out visitor reads none. `myanmarDayStartMs()` counts the
   reschedule notice from Yangon midnight, and `rentalRequestCode()` stamps the
   Myanmar day. The dictionary moved to `src/lib/translations.ts` and holds all
   23 `rental_error_*` codes in MM and EN; `translate()` returns `undefined` for
   a code this build does not know, so a newer server code reads as missing
   instead of crashing, and the test reads the codes out of the migrations.

   **§3 role slugs and the §16B.1 workspace.** `profiles.role` stores a slug,
   but the rental migrations compared product names, so no staff account ever
   passed `is_rental_staff()` and every rental write failed as forbidden.
   `supabase/migrations/20261122000400_rental_role_slugs.sql` normalises the
   slug once in `current_role_name()`, so the rest of the schema keeps comparing
   product names, and adds `can_handle_rental_orders()` for writes, so a Payment
   Admin records a payment and changes nothing else. On the client,
   `src/lib/roleMapping.ts` maps all nine slugs to a product role, `auth.tsx`
   hydrates `adminRole` from the profile row, and `src/lib/adminWorkspace.ts`
   turns the §16B.1 matrix into the sections each role may open. The Super Admin
   page filters its navigation through it, and the order panel offers only the
   actions the role may take.

6. ~~Connect the Custom Plan, Rental, and Ticketing submissions to request
   records with an ID and a confirmation.~~ **Done 22 November 2026.** Each
   submission now writes a request record with a reference such as
   `MHR-20261122-001`, shows it on the confirmation screen, and lists it under
   the account's Bookings or Travel Plans. The record is account-scoped browser
   storage with a best-effort `public.bookings` insert; reading requests back
   from the table is still open.
7. Replace seeded catalog data with city-scoped Supabase queries.

Steps 1, 3, 4 and 5 are frontend work with no new infrastructure. Step 7 needs
the backend push.
