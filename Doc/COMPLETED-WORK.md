# MH Travel — Completed Work Record

**Last updated:** 23 November 2026
**Verified against:** `main` plus the Rental catalog data module and Rental Admin
panel, and the per-account Favorites, notification, and review wiring; earlier baseline `ecb231f` covers the Blog and Travel Guide admin
editors, admin-role accounts, the rental-category work of 20–22 November 2026,
and the same-day work on the guide route follower, the two owner dashboards,
and the Foreign Tourist section.

This document records the frontend features, preview workflows, backend preparation, and documentation work completed so far. Production/backend boundaries remain explicitly listed in [`REMAINING-WORK.md`](./REMAINING-WORK.md).

For the one-page view of what is finished versus open, read
[`STATUS.md`](./STATUS.md) first. This file is the detail behind its
**DONE** and **PREVIEW** marks.

## Product foundation and shared UI

- Vite + React + TypeScript + Tailwind CSS, React Router, Lucide icons, dark-first theme tokens, light mode, currency formatting, and Burmese/English translation support are in place.
- Shared responsive shell, sticky header, mobile drawer, fixed mobile bottom navigation, Home full footer, inner-page copyright footer, and standalone Admin layout are implemented.
- Shared listing cards, ad slots, currency, language, theme, authentication, and Favorites primitives are used throughout the application.
- Site-wide interaction guard prevents right-click and page-level keyboard/mouse-wheel zoom gestures. Browser menu/settings zoom remains outside website control.

## Traveler-facing application

- Home, Cities, Nearby, Rentals, Ticketing, Travel Plans, Travel Guide, Blogs, Search, Favorites, Account, Notifications, Restaurant, and Book Shop experiences are implemented with responsive layouts.
- City detail routes and category explorers are available with city-scoped search, category filters, business grids, and bilingual content.
- Travel Plan detail routes include generated itineraries, pricing summaries, request CTAs, and custom-plan builder support.
- Travel Guide listing/detail routes and aggregated Search are no longer placeholders.
- Ticketing preview supports Bus, Train, Events, and Cinema flows with route/venue matching, seat selection where applicable, validation, and order-confirmation states.
- Rentals supports city-specific availability, rental type selection, dates, customer type, delivery/branch pickup, pricing estimates, and submission handoff.
- Shared Favorites update immediately after save/unsave, synchronize across same-tab and browser storage events, and are scoped to the signed-in account.

## Rental catalog as data, with Rental Admin controls (Plan §8)

Plan §8 makes rentals the first-priority module and asks for two things the page
used to hardcode: per-type rules, and a Rental Admin that can change them.

- `src/data/rentalCatalog.ts` is the single record for the whole module: the 11
  rental types with bilingual label, detail, photo, icon, driver rule, minimum
  charged days, local and foreign daily rate, vehicle options and terms; the
  five cities with their branches; the city × type availability matrix; and the
  general terms text. `DEFAULT_RENTAL_CATALOG` is what ships.
- `src/lib/rentalCatalogStore.ts` holds the Admin's edits until the catalog
  tables exist, and broadcasts a change event so `/rentals` updates in the same
  tab without a reload.
- `RentalsPage.tsx` no longer owns any of that data. It reads the catalog for
  the type selector, the card grid, the city list, the branch list, the vehicle
  options and the policy cards, so adding a type is a data change, not page
  code. A type with no seed listing still renders a card: `cardMetrics()`
  derives a stable rating, distance and view count from its id, which keeps the
  Plan §4 card contract intact.
- Pricing is one shared function. `estimateRental()` charges the daily rate
  times inclusive days, enforces the type's `minDays` (so a car never bills a
  single day), and applies the foreign rate to a foreign visitor, with a vehicle
  option overriding the type rate. The page's estimate panel and the submitted
  request amount both call it.
- `rentalCatalogProblems()` is the guard the panel runs before saving: no types,
  no cities, duplicate ids, a missing label or rate, a non-positive minimum day
  count, a duplicate or unpriced vehicle option, a city with no branch, a city
  with no rentable type, an availability entry pointing at a removed type, or
  missing terms text. A failing catalog cannot be saved.
- The new **Rentals** view in the Super Admin dashboard edits all of it: each
  type's labels, photo, icon, rates, minimum days, driver rule, terms and
  vehicle options; the city × type availability matrix; the general terms; and
  a reset back to the shipped catalog.

Verified: typecheck PASS, ESLint PASS (0 errors, 7 pre-existing warnings),
`npm test` PASS (130 tests, 16 files), build PASS. In a headless browser an
Admin rate change reached `/rentals` in the same session, unticking Yangon's car
made the page offer Bagan instead, the car flow billed 2 days at the family-car
rate (378,000 Ks), and the page had no horizontal overflow at 390px or 1440px.

## Rental orders, voucher, and Rental Admin Orders (Plan §8, 22 November 2026)

Plan §8.2 settled the open conflicts, §8.5 defined the order lifecycle, §8.6 the
voucher, and §8.7 the server rules. This pass implements all four on the client
and writes the migrations that make the server the authority.

- **Catalog decisions applied.** `src/data/rentalCatalog.ts` drops motorbike and
  scooter from Yangon, seeds `self_drive_car` inactive, and makes car types,
  bicycle types and boat types data (`RentalVariant`) with the category rate as
  the default. `flow` is `simple` or `driver_vehicle`, `active` and `sortOrder`
  order the list, and `availableTypes(catalog, cityId)` answers what a city
  offers. `/rentals` now lists only those, so Yangon shows five categories, not
  eleven. `activeVariants()` and `findVariant()` drive the picker.
- **`src/lib/rentalOrders.ts`** is the order module: the record (all §8.3
  columns), the status machine (`requested → accepted → paid/completed`,
  `expired`, `cancelled`), `paymentDeadlineFor()` for the 12-hour window,
  `markPaid()` which issues voucher version 1, `rescheduleOrder()` (once, 24
  hours ahead, same day count, version + 1), `expireOverdueOrders()` which is
  safe to run twice, and an append-only event log with an actor. A traveler sees
  only their own orders; staff see all.
- **Submission.** The form gained the guest name and special-requests fields the
  §6 voucher needs, and submitting requires a signed-in traveler. The order gets
  `RNT-YYMMDD-####`, appears under Account → My Bookings, and links straight to
  the voucher. The client total stays a preview; the migrations recompute it.
- **`RentalVoucherPage.tsx`** at `/account/bookings/:requestCode` prints the 17
  §6 fields, shows the QR code (the encoder is imported on demand, so the main
  bundle does not carry it), the payment countdown, the voucher version, and the
  one-date reschedule for a paid order.
- **`RentalOrdersPanel.tsx`** is the Rental Admin → Orders section: status
  filters with counts, search, an expandable row with the timeline and an
  internal note, the payment countdown on an accepted order, and the actions
  Accept, Record payment (with the method), Complete, Expire and Cancel. The
  `expireOverdue()` job is also exposed there as a manual run.
- **Migrations** under `supabase/migrations`: role helpers
  (`is_rental_staff`, `is_rental_editor`), the catalog tables with RLS, the
  order, event and extras tables with a `my_bookings` view, and the functions
  `submit_rental_order`, `set_rental_order_status`,
  `reschedule_rental_order`, `expire_overdue_rental_orders`. `rental_rate_for`
  ranks city + variant above the default rows, and every error is a stable code
  the page can translate.

Verified: typecheck PASS, ESLint PASS (0 errors, 7 pre-existing warnings),
`npm test` PASS (158 tests, 17 files), build PASS. In a headless browser a
traveler submitted a bicycle order (`RNT-261123-0001`), saw it under My
Bookings, printed the voucher with its QR, and after staff accepted and recorded
payment the reschedule moved the start date, kept the two-day span, and issued
voucher v2. Yangon's selector showed no motorbike or scooter.

## Per-account Favorites, notifications, and reviews (22 November 2026)

- `src/lib/userScope.ts` gives every browser-stored row an account-scoped key.
  `adoptLegacyKey` claims the old global favorite key once and deletes it, so
  existing local favorites are kept but stop leaking to the next account.
- `FavoritesProvider` reads and writes `public.favorites` when Supabase is
  configured, keeps an optimistic toggle, rolls it back on a failed write, and
  falls back to the scoped local map. `AuthProvider` now wraps it in
  `main.tsx`.
- `useNotificationFeed` keeps the seeded feed rows but stores read flags per
  account and syncs them to `public.notifications`.
- `usePlatformReviews` reads `public.reviews` for platform-level rows
  (`listing_id is null`) and falls back to seed data.
- `userScope.test.ts` covers scope isolation, guest separation, corrupt values,
  and legacy-key adoption (8 tests).

## Request records for Custom Plan, Rental, and Ticketing (22 November 2026)

- `src/lib/travelRequests.ts` gives every submission a record and a readable
  reference — `MHR-` for rentals, `MHT-` for tickets, `MHC-` for custom plans,
  then the date and a three-digit sequence (`MHR-20261122-001`). Records are
  written to the account-scoped storage from `userScope.ts`, so one account's
  requests never appear under another, and a guest keeps its own set.
- `useTravelRequests` returns the sorted list plus `addRequest`. When Supabase
  is configured it also inserts into `public.bookings` with
  `status: 'received'`. That insert is best-effort: a rejection is swallowed
  because losing a request the traveler just made is worse than a late
  back-office copy.
- All three forms now record on submit and show the reference. Rentals prints
  it under the submitted banner, Ticketing uses it as the order number, and the
  Custom Plan form shows it under the "request received" copy.
- The Account dashboard reads those records instead of seeded rows. The
  overview counts bookings and plans from real requests, the upcoming-trip card
  shows the newest one, and Bookings and Travel Plans list them with their
  reference, kind, date, and amount. Both panels show an empty state until the
  first request exists.
- `travelRequests.test.ts` covers reference formatting (including the
  sequence floor), newest-first ordering with a stable tie-break, and
  kind filtering (8 tests).

## Travel Guide route follower

- `/travel-guide/:guideId` has a "Follow this route" control. It walks the
  itinerary one stop at a time, showing the stop time, photo, description, and
  a Directions link, and marks the matching row in the full timeline with
  `aria-current="step"`.
- `src/lib/guideFollow.ts` holds the rule: the index is clamped to the route,
  the position is one-based, and stepping stops at both ends instead of
  wrapping. Unit-tested in `guideFollow.test.ts`.
- Bilingual copy for the follower is in `i18n.tsx` under `guide_follow_*`.

## Foreign Tourist section (Plan §13)

- `/foreign-tourist` covers post-arrival help only: emergency contacts, SIM
  cards, cultural etiquette, and currency/tipping. Visa content stays out
  because it is a pre-arrival matter.
- Emergency numbers are real `tel:` links — police 199, ambulance 192, fire
  191, plus the MH Travel support line. SIM operator cards name the four
  networks and their coverage instead of quoting package prices, because those
  change; the page says so.
- The Home Emergency and Sim card tiles now land on the matching anchor; the
  Exchange tile still opens the Nearby exchange listings. The mobile drawer and
  footer Navigate lists link the page. Every string is bilingual, and
  `foreignTourist.test.ts` enforces that.

## Shop Owner and Main Owner localization

- Both dashboards now read every label through `useLanguage`, and both have a
  language control in the header. English is still the default; switching
  writes the shared `mh-travel-language` key, so the choice follows the user
  across the traveler pages.
- Numbers in both dashboards go through `Intl.NumberFormat`, so counts and
  amounts render with Burmese digits in MM mode.
- `mainOwnerApi.ts` returns translation keys instead of English sentences for
  validation failures, so branch-account errors and the submit message render
  in the active language. `validateBranchAccount` keeps the same rules.
- Copy for the two dashboards lives under the `owner_*` key group.

## Super Admin dashboard localization (Plan §14)

- The Super Admin shell, Overview, Quick Actions, Currency, Admin Management,
  Shop Owner Management and Ads Management all render through `useLanguage`.
  Nav items now carry a `labelKey` instead of an English `label`, so the
  sidebar, page titles and breadcrumbs cannot drift out of translation.
- Data values that the UI filters on stay in their original English form and
  are translated only at render time: `cityLabels` and `categoryLabels` map
  `Yangon`/`Restaurant`/`Book Shop` and friends to `sa_city_*` and `sa_cat_*`
  keys, and `slotLabels` does the same for ad placements. This keeps the
  filters, seed records and saved drafts consistent while the visible label
  follows the active language.
- Admin roles, permission groups, owner credentials, currency rate labels,
  placeholder text and validation messages are all keys under the `sa_*`
  group. `i18n.tsx` now holds 1,388 keys.

## Content editor localization (Plan §10, §14)

- `BlogPostsPanel.tsx` and `TravelGuidesPanel.tsx` were the last English-only
  screens; both now render through `useLanguage`. Every label, table header,
  placeholder, `aria-label`, status chip, notice and button reads from the
  `bp_*` and `tg_*` key groups, with the shared editor chrome under `cw_*`.
- The publish checks no longer return English sentences. `blogPublishCheck`,
  `guidePublishCheck` and `adSlotProblem` return a `PublishProblem`
  (`{ code, count? }`) defined in `src/lib/publishProblems.ts`, and the editor
  resolves it through `PUBLISH_PROBLEM_KEYS`. A code is stable for tests and
  for the server-side check that will mirror these rules.
- `blogMediaApi.ts` failures carry a `MediaErrorCode` instead of a message, so
  an upload error reads in the active language.
- `describeAction` became `actionLabelKey`, returning a `TranslationKey` for
  the audit line instead of English text.
- `fill()` in `src/lib/fill.ts` replaces `{count}`/`{title}`-style
  placeholders, so one key serves every count and title. It is unit-tested.

## Authentication and administrative interfaces

- Traveler Login and Signup are separate routes with username/display name/email/password fields and bilingual UI.
- Admin Login is separated from traveler login. Super Admin and Owner Admin preview routes are protected by role-aware route guards.
- Supabase Auth session hydration, email/password calls, OAuth initiation, profile lookup, role checks, signup metadata, and logout integration are implemented when environment configuration is available.
- Super Admin dashboard includes metrics, users, content/listings, bookings, settings, Ads Management, Shop Owner creation, Admin Management, language/theme controls, and logout.
- Shop Owner dashboard includes business profile, bookings/orders/reviews/revenue, menu, analytics, quick actions, and responsive navigation.
- Main Owner preview includes branch accounts, wallet/ledger views, ticket sales, revenue share, operator settings, and a Create Branch Account modal.
- Shop Owner creation supports generated/manual usernames and temporary credentials in local preview mode; the production replacement is documented as remaining work.
- Branch Account creation has field validation, duplicate preview username checks, async submission states, a Supabase adapter path, and local preview persistence.

## Blog/content management

- Super Admin Blog Post Management includes bilingual editor fields, categories, search, status filters, draft/publish/schedule actions, edit/preview actions, and summary metrics.
- Custom category creation normalizes slugs and rejects duplicates.
- Cover and gallery image uploads support JPEG/PNG/WebP input, resize/compress to WebP, and a maximum 450 KB output target.
- Inline bilingual text/image story blocks support interleaved photos, block removal, story preview, and separate schedule date/time controls.
- The editor now stores an ordered block list (text, photo, ad slot) rather than free-form HTML, so web and mobile render the same post and pasted markup cannot break an ad slot. Blocks move up and down, photos carry bilingual alt text plus an optional caption and credit, and the public reader labels a filled slot "Sponsored" and collapses an empty one.
- Ad slots are limited to three per post, never open the post, and never sit side by side; deleting a neighbouring block re-normalises the list.
- Publish checks cover both languages, the cover photo, a category, at least one paragraph, alt text on every photo, and a schedule date and time when scheduling. The editor shows what is still missing as you type.
- Every save records a revision and an audit entry, shown as a History panel with one-click restore of an earlier revision.
- The upload adapter supports a configured Cloudflare R2 endpoint and local preview fallback when no endpoint is configured.

## Backend preparation

- Supabase profile schema and role/RLS work were applied to the connected project and documented, including signup trigger, username uniqueness, role protection, and Super Admin management policies.
- Core RLS-protected tables were applied for favorites, custom plan requests, bookings, notifications, reviews, ads, and admin audit logs.
- Backend handoff details, daily implementation records, and the historical worklog are now consolidated into [`../Plan/PROJECT-PLAN.md`](../Plan/PROJECT-PLAN.md).

## Validation and delivery

- TypeScript typecheck and Vite production builds have passed for the latest feature work.
- `npm test` (Vitest) runs the route, link, and filter suite in under a second.
- `git diff --check` has passed before recent deliveries.
- ESLint has no errors; the repository retains seven existing non-blocking warnings.
- Recent frontend and documentation changes have been committed and pushed to the GitHub `main` branch.


## Currency management — 16 November 2026

The Super Admin Settings workspace now includes a USD-to-MMK exchange-rate field. The Admin can save a new rate, and shared public price formatting immediately uses the updated rate. The default preview rate is `1 USD = 4,500 MMK`.

The Shop Owner Settings workspace now lets each preview shop choose `MMK Main` or `USD Main`. The selected main currency is persisted locally and the screen shows the converted secondary amount using the current Admin rate. This keeps the shop's pricing-base choice separate from the visitor-facing display-currency toggle.


## Super Admin navigation and Shop Owner filtering — 16 November 2026

`Currency & Exchange Rate` is now a standalone Super Admin navigation item instead of appearing as a generic Settings destination. The Shop Owners management table now supports `All`, city, business-category, and application/status filtering. Pending applications can be shown separately from Active owners, and the table reports how many records match the selected filters.


## Shop Owner application notifications — 16 November 2026

When a new Shop Owner account/application is successfully created, the Super Admin notification bell now receives an unread notification containing the business name, city, category, and applicant name. The header badge shows the unread count, the dropdown supports opening individual notifications or marking all as read, and the preview notification list is persisted locally and synchronized across open browser tabs.


## Page-based Ads Management — 16 November 2026

The campaign inventory view was replaced with a page-oriented Ads Management workspace. Super Admin now selects a named website page, sees only the ad placements belonging to that page, and can add, edit, preview, publish, or pause each placement. The UI includes page paths, placement slots, advertiser names, and per-page ad counts.


## Card system and grid caps — verified 20 November 2026

The shared card system is the one place card dimensions are decided. Every
page selects a size; no page sets its own card width, image height, or type
scale.

- Five sizes exist and no others: `xs`, `sm`, `md`, `lg`, `xl`.
- Each size carries a hard `maxWidth` so a card can never stretch into a long
  bar when its grid cell is wider than the size intends.
- All direct card grids are capped to `columns × card width + gaps` with
  `justify-items-center`, covering Blogs, Favorites, Account, City, Search,
  Travel Plans, Travel Guide, and Nearby.
- `ListingGridSection` builds its rows from the same width map, so Home and
  City rows share the cap with the page-level grids.
- The Plan's card table in `PROJECT-PLAN.md` §4 matches `CARD_SIZES` in
  `src/components/ui/ListingCard.tsx` exactly.

An earlier rewrite that replaced the card structure with a fixed box and then
with a 3:2 scale was reverted in `5f3924b`; the tree is byte-identical to
`eef11a5`. That work is preserved on branch `backup/cards-3to2-35fcc5e` if it
is ever wanted back.

## Route integrity — verified 20 November 2026

All 42 routes declared in `public/manus-routes.json` resolve in `src/App.tsx`,
and every declared route is reachable. The `*` fallback renders a placeholder
rather than crashing.

The 48 broken links recorded in the earlier audit are fixed:

- Nine catalog routes (`/attractions`, `/hotels`, `/restaurants`, `/cafes`,
  `/markets`, `/book-shops`, `/rentals`, `/transport`, `/populars`) plus
  `/categories` as the index, all served by `CategoryPage` and
  `CategoryIndexPage`.
- Six place-detail families (`/hotels/:id`, `/cafes/:id`, `/markets/:id`,
  `/attractions/:id`, `/ticketing/:id`, `/rentals/:id`) served by one
  `PlaceDetailPage` that resolves its record through `placeCatalog.ts`.
- The `/book_shop` underscore typo now maps to `/book-shops`.
- `viewAllHref` was removed from Reviews, Partners, and Awards: those sections
  already render their full content inline, so the button led nowhere.

`src/routes.ts` is the single route table. `App.tsx` builds its catalog and
place routes from it, and the tests read it, so a route cannot be declared in
one place and forgotten in another.

## Link and route tests — 20 November 2026

`npm test` runs Vitest over five files, 29 tests:

| File | What it proves |
|---|---|
| `src/data/links.test.ts` | Every seed `href` resolves to a declared route; no duplicate route paths; every catalog id is unique within its catalog; a place href resolves to the record that owns it |
| `src/routes.manifest.test.ts` | `public/manus-routes.json` lists exactly the declared routes, each once, each with a title |
| `src/lib/categoryFilter.test.ts` | Category options and filtering, plus the map-search and phone-dial href builders |
| `src/lib/usePagedList.test.ts` | Paging maths: the page size divides evenly into every column count, batches are whole, the last batch is clamped, and Load More hides when exhausted |
| `src/lib/adminRoles.test.ts` | The eight product roles, their permission groups, ad management staying exclusive, and content split by type |

The suite runs in under a second and needs no browser, so it can gate every
delivery check alongside typecheck, build, and lint.

## Code hygiene — verified 20 November 2026

- No `TODO`, `FIXME`, `XXX`, or `HACK` markers in source.
- No `console.log` left in source.
- ESLint has zero errors and seven pre-existing non-blocking warnings.
- Typecheck and production build pass on the audited commit.
- `npm test` passes: 29 tests over the route table, seed links, filters,
  paging, and admin roles.

## Accessibility — measured 20 November 2026

axe-core run in headless Chromium at 1440px across 23 routes: every declared
page plus the Super Admin, Shop Owner, and Main Owner dashboards.

- **242 rendered images, 0 without `alt`.**
- **1120 interactive elements, 0 without an accessible name.**
- **0 violations of every rule except `color-contrast`.** That covers heading
  order, landmark structure, tab roles, form labels, and `html lang`.
- **64 `color-contrast` nodes on 17 routes**, down from 562 before the audit.
  Two pairs cause 55 of them and both are brand colours: white on
  `brand-blue #4d8dff` (3.2:1) and `brand-red #c0392b` as text on the dark card
  (3.3:1). Changing them changes the brand palette, so the decision is recorded
  in [`REMAINING-WORK.md`](./REMAINING-WORK.md) instead of being made silently.

Fixed along the way:

- Six sponsored ad links in `AdSlot` had no accessible name. They now carry
  `aria-label="Sponsored: <advertiser>"`, and the decorative ad video is
  `aria-hidden`.
- The notification bell read "Notifications" while its badge said "3", which
  axe flags as a name/content mismatch. The label now includes the unread count.
- `document.documentElement.lang` was set to `mm`, which is not a language code.
  Burmese is `my`, so the tag is now mapped.
- The viewport meta tag set `maximum-scale=1.0, user-scalable=no`, which blocks
  pinch zoom. Removed.
- Ticketing's category buttons used `role="tab"` with no `tablist` parent.
- `/account` nested a second `<main>` inside the shell's `<main>`.

## Layout — horizontal overflow fixed 20 November 2026

The document scrolled sideways by 21–37px at 820px. The header switched to its
desktop navigation at `md` (768px), but the nav plus search, language, currency,
theme, Favorites, notifications, and account controls need more width than that.
The nav now appears at `lg`. `/account` had the same problem from an
unconstrained grid column and is fixed too.

Verified at 360, 390, 414, 600, 768, 820, 900, 1024, 1180, and 1280px across 15
routes: no horizontal overflow anywhere.

## Paging — 20 November 2026, revised 22 November 2026

Blogs and Travel Guide each paged by a hard-coded six, which leaves a ragged
last row on a four-column grid. The first fix read the grid's rendered column
count and rounded each page to a whole row.

The Plan then fixed the page size at 12 (§4), which divides evenly into two,
three, four and six columns, so the measurement is no longer needed. Both pages
now share `src/lib/usePagedList.ts`: `usePagedList(items, resetKey)` returns
the visible slice, a `hasMore` flag and `loadMore`. The last batch is clamped
to what exists, so nothing is hidden, and the button disappears once everything
is shown. `useGridColumnCount` and `alignToRow` were removed.

## Admin roles — 22 November 2026

The Admin Management form offered five names that did not match the product
roles (Content Manager, Support Manager, Operations Admin, Finance Admin, Ads
Manager). `src/lib/adminRoles.ts` now holds the eight roles from Plan §3 and
the permission group each one starts with. The form lists the seven roles a
Super Admin can create (Super Admin itself is excluded because only it creates
accounts), and choosing a role sets its permission group; the group stays
editable, since it is what scopes the role.

## Rental categories — 22 November 2026

Plan §8 decided to add E-bike and Tricycle. E-bike was already present;
Tricycle is new: `RentalCategory` gained `tricycle`, the catalog gained a
`pre11` listing so Favorites and Account resolve it, the selector order places
it beside Scooter, and Yangon and Mandalay offer it. Boat stays one category,
with motorboat as its current type.

Yangon's motorbike and camping-tent restriction from the Plan is not applied
yet: the Plan lists it under "Still needing the founder's input", so the seed
data keeps Yangon's current list until that is confirmed.

## Blog editor — Plan §10 additions, 22 November 2026

`src/lib/blogBlocks.ts` holds the block schema and its rules: `moveBlock` for
reordering, `adSlotProblem` and `normalizeAdSlots` for placement, and
`blogPublishCheck` for the six publish conditions. The composer was rebuilt on
top of it, so the story is an ordered list rather than a text blob. A photo
block carries bilingual alt text, a caption and a credit; an ad slot renders as
a labelled placeholder that the Ads system fills, and it collapses when empty.

`src/lib/contentWorkflow.ts` adds the parts Blog and Travel Guide share:
revisions capped at twenty per item, an audit log, and the action names both
editors write when they save. Both editors show a History panel with the last
few audit entries and a Restore button for an earlier revision.

## Travel Guide editor — 22 November 2026

`TravelGuidesPanel` replaces the read-only Travel Guides nav entry with a real
editor for Super Admin and Travel Guide Content Admin. A guide is an ordered
list of stops; each stop has a time, a listing picked from MH Travel's own
catalogue, and bilingual title and description. `src/data/listingIndex.ts`
builds the catalogue the picker offers, so a stop cannot point at an outside
place.

Each stop also carries an optional photo, uploaded through the same WebP/R2
pipeline and rendered above the stop description in the public reader.

`src/lib/guideItinerary.ts` holds the itinerary rules: 24-hour time parsing,
sorting by time, moving a stop, and `guidePublishCheck`, which requires both
languages, a cover, an author, at least one stop, an existing listing on every
stop, ascending stop times, and a date and time when scheduling. Saving sorts
the stops by time so the published order always matches the clock.

Each published guide creates one earning row through
`src/lib/guideEarnings.ts`. The row starts without an amount because the
per-post rate is still undecided; an Admin types the amount and can then mark
it paid. A totals line sums what is payable per author and how many rows still
wait for an amount.

The public reader's per-stop Directions link now goes through the shared
`mapSearchUrl` helper, the same one the restaurant and book shop pages use.

## Admin accounts and content roles — 22 November 2026

Admin Management now creates a real local admin account instead of a table row:
the form gained an initial password, `createAdminAccount` in `src/lib/auth.tsx`
stores the account with `role: 'content_admin'` and the chosen Plan §3 role, and
the new admin signs in at the existing admin login.

`src/lib/contentAdminAccess.ts` states the rule from Plan §10 item 6: a Blog
Post Admin reaches the Blog editor and nothing else, a Travel Guide Content
Admin reaches the Guide editor and nothing else, and ad management stays with
Super Admin and Ads Admin. The admin shell reads the signed-in role, shows only
that editor in the sidebar, and opens it by default. Verified in the browser:
creating a Blog Post Admin, signing in as them, and seeing a single "Blogs" nav
item with no Ads entry.

## Rental Admin panel completed to Plan §8.8 — 22 November 2026

The Rental Admin panel previously covered types, rules, the city × type matrix
and the general terms. Plan §8.8 asks for seven sections; all seven now exist,
and the two shared data types they needed were added to the catalog model.

**Catalog model.** `RentalBranch` gained `address` and `phone`, because the
voucher prints both (Plan §8.6). `RentalRate` gained `effectiveFrom` and
`effectiveTo`, so a rate change keeps its history instead of overwriting the old
price. `RentalCatalog` gained `termsHistory` (the published versions, newest
first) and `settings` (`highlightAfterHours`, `minNoticeDays`). The five seeded
branches carry real-looking addresses and phone numbers, and
`rentalCatalogStore.ts` fills the new fields for a catalog saved by an older
build, so an existing Admin edit is not thrown away.

**Rates.** The new table lists one row per city × category × variant with local
and foreign amounts and effective dates. `rateInForce` and `newestRate` in
`src/data/rentalCatalog.ts` decide which row applies on a given day, so a rate
that starts next month does not change today's price. `rateHistory` groups the
rows for one key, and the panel lists any key that holds more than one row, so a
superseded price stays visible.

**Branches.** Each city's branches are edited in place with Burmese and English
names, an address and a phone. The voucher now prints the branch address and
adds the branch phone beside the traveler's own.

**Terms.** Publishing copies the current text into `termsHistory` and starts a
new version dated today (with a suffix if the day already has one). Every order
keeps the version it accepted, so an old voucher still prints its own policy.

**Settings.** The two thresholds are edited in the panel and both are read
elsewhere: `RentalOrdersPanel` flags a Requested order once it has waited longer
than `highlightAfterHours`, and `RentalsPage` uses `minNoticeDays` as the
earliest selectable start date.

**Orders.** Plan §8.8 also asks the Orders list to filter and search. It now
filters by status, city, category and rental-date range, searches the request
code, customer name and phone, offers a `tel:` Call button, and requires a
written reason before cancelling. A Requested order past the threshold shows a
red waiting badge.

**Validation and storage.** `rentalCatalogProblems` now rejects a branch without
an address or a phone, a rate row naming a variant its category does not define,
a rate row whose dates run backwards, and settings values the dashboard cannot
use. `supabase/migrations/20261122000100_rental_catalog.sql` gained a
`rental_settings` single-row table with RLS: everyone reads, Rental Admin and
Super Admin write.

**Verification.** `npx tsc --noEmit -p tsconfig.app.json` clean;
`npx vitest run` 17 files / 168 tests (10 new in
`src/data/rentalCatalog.test.ts` covering rate-in-force, history, branch
address/phone, terms history, variant and date-range rejection, and settings);
`npm run build` succeeds. Browser check at `/super-admin` → Rentals: all seven
sections render, adding a rate row and saving works, and `/rentals` still prices
from the type rates while the new dated row is not yet in force.

## Rental reports and the CSV export (Plan §8.9) — 22 November 2026

`src/lib/rentalReports.ts` holds the report maths as pure functions over the
order list, so the panel, the CSV and the tests read the same numbers.

Status, city, type and day tallies carry a count and a USD total. Day buckets use
Myanmar Time (UTC+6:30) rather than UTC, so an order placed at 20:00 UTC lands on
the next Myanmar day instead of the previous one. Conversion counts Paid and
Completed against every requested order, and median accept time uses only the
orders that were actually accepted. Settled value covers Paid and Completed, and
the MMK figure uses each order's own snapshotted rate, so a later exchange-rate
change never rewrites an old order's value.

`ordersToCsv` writes 21 columns and quotes per RFC 4180, so a name holding a
comma or a quote survives the round trip, and an absent variant or payment method
writes an empty cell instead of `null`.

`RentalReportsPanel` renders the four headline figures, the four tables, a 7/30/
90/365-day window and the CSV download, and it is wired into the admin sidebar as
**Rental reports** next to Rental orders. The window compares against each
order's start date, which is what a founder actually asks: what is booked in the
coming month.

**Verification.** `npx tsc --noEmit -p tsconfig.app.json` clean; `npx vitest run`
18 files / 182 tests (14 new in `src/lib/rentalReports.test.ts` covering the
Myanmar day boundary, the tallies, conversion, median accept time, settled value,
and CSV quoting); `npm run build` succeeds. Browser check with two seeded orders:
2 orders, 50% conversion, 2h median accept, $16.00 / 72,000 Ks settled, and the
city, type and day tables matching the seeded rows.

## Rental notifications (Plan §8.9) — 22 November 2026

`src/lib/rentalNotifications.ts` decides who hears about a change and writes the
row. Requested goes to the Rental Admin, Accepted, Paid, Expired and Cancelled go
to the traveler, a reschedule goes back to the Rental Admin, and Completed goes
to nobody because the traveler just lived through it.

`deliverRentalNotices` in `src/lib/rentalOrders.ts` is called from `createOrder`,
`setStatus`, `recordPayment`, `reschedule` and `expireOverdue`, so a notice is
written wherever the status actually moves rather than in the panel that happened
to click the button. Staff rows share the admin bell's existing record shape and
key, so the Super Admin page needed no second list. Traveler rows are stored per
account through `userScope`, so one traveler's notices never appear under the next
account's badge, and both bells cap at 50 rows.

The traveler bell merges these notices ahead of the seeded feed items, so a paid
voucher sits at the top of `/notifications` and the header dropdown. Titles are
translated in both languages and carry the request code, and the row links to the
traveler's own voucher.

**Verification.** `npx tsc --noEmit -p tsconfig.app.json` clean; `npx vitest run`
19 files / 195 tests (13 new in `src/lib/rentalNotifications.test.ts` covering the
audience per status, the reschedule notice, deduplication, the 50-row cap, per-
account isolation and the age labels); `npm run build` succeeds. Browser check:
accepting order `RNT-261120-0002` as Super Admin wrote a traveler notice that
appears at the top of `/notifications` for `traveler-2` and links to the voucher,
and a staff row renders in the Super Admin bell with the traveler's name, phone
and request code.

## The rental expiry job and the audit log (Plan §8.8, §8.9) — 23 November 2026

`expireOverdueNow` in `src/lib/rentalOrders.ts` is now the one place that moves an
unpaid Accepted order to Expired: it rewrites storage, writes the event, and sends
the traveler the notice. `useRentalExpiryJob` runs it on the Plan's five-minute
cadence and once on mount, so a tab left open overnight catches up the moment it
loads, and `AppRoutes` mounts it for the whole app. A browser cannot wake itself
up, so the real schedule still belongs to the server job once orders move into the
tables.

`src/lib/rentalAudit.ts` answers Plan §8.8's "every write goes to the audit log"
and §8.5's "every change writes an admin audit-log row". A catalog save is diffed
field by field, so the log reads as decisions — `types[bicycle].terms.en` went
from this to that — rather than as a copy of the whole catalog. Publish timestamps
and the terms history are skipped, or every save would look like a terms change.
A status change or reschedule writes a row carrying the request code. The log caps
at 200 rows and the Rental Admin panel lists it under Settings.

**Verification.** `npx tsc --noEmit -p tsconfig.app.json` clean; `npx vitest run`
20 files / 210 tests (4 new in `src/lib/rentalOrders.test.ts` for the job, 11 in
`src/lib/rentalAudit.test.ts` for the diff and the log); `npm run build` succeeds;
`npx eslint src` reports 0 errors. Browser check: an Accepted order past its
deadline was Expired on page load, with the traveler notice written and a
`status: accepted → expired` audit row; editing one type's English terms and
saving wrote one audit row naming the field, its old text and its new text.

## Guide costs on a rental order (Plan §16) — 23 November 2026

A travel guide's lodging, food and travel costs are charged on top of the daily
rate, so they are rows on the order rather than a bigger rate. `RentalOrder` now
carries `extras`, and `addRentalExtra` in `src/lib/rentalOrders.ts` appends one
with a description, an amount, who added it and when. `extrasTotalUsd` and
`orderTotalUsd` are the only places a total is computed, so the panel, the
voucher, the reports and the CSV cannot disagree.

The Rental Admin orders panel has a Guide costs block on every order: the rows
already added, a description and amount field, and the daily total, the costs
added and the total due underneath. Adding a cost writes a timeline event, an
audit row and a traveler notice. The voucher lists the costs and shows the total
due, and the reports and CSV count the costs in the settled value.

An order saved before `extras` existed still opens, because `normalizeOrder`
fills an empty list.

**Verification.** `npx tsc --noEmit -p tsconfig.app.json` clean; `npx vitest run`
20 files / 218 tests (5 new in `src/lib/rentalOrders.test.ts` for the total, the
rows, rounding and the timeline event, 2 in `src/lib/rentalReports.test.ts` for
the settled value and the new CSV columns, 1 for the notice with no status audit
row); `npm run build` succeeds; `npx eslint src` reports 0 errors. Browser check:
adding "Lodging in Bagan" at $30 to paid order `RNT-261120-0010` moved the total
due from $70 to $100, wrote the timeline event, wrote the traveler notice under
`traveler-10` only, and the voucher showed `Total due 450,000 Ks / $100.00`.

## Rental server rules mirrored on the client (Plan §8.7, §8.12) — 23 November 2026

Plan §8.7 says the server is the authority and the client rules mirror them, and
§8.12 acceptance 2–4 test the mirror: a tampered total is ignored, a type the
city does not offer is rejected, and a car order shorter than its minimum days
or a start before tomorrow in Myanmar Time is rejected. The page enforced none
of those; it computed a total and stored whatever it displayed.

- `src/lib/rentalOrderRules.ts` is the rule set, in the order
  `submit_rental_order` checks it: category active, city × type available,
  variant belongs to the category, branch belongs to the city, start at least
  tomorrow in Myanmar Time (or the Settings notice period, whichever is later),
  end not before start, `minDays` honoured, name at least 2 characters, phone at
  least 7 digits, delivery address at least 3 characters when delivering,
  participants at least 1, current terms version, then the per-account limit of
  `RENTAL_SUBMIT_LIMIT_PER_HOUR` (10). Each failure returns one stable
  `rental_error_*` code.
- `quoteRentalOrder()` is the single quote. The estimate panel calls it to
  preview and `buildRentalOrder()` calls it to store, so the two cannot drift.
- `buildRentalOrder()` in `src/lib/rentalOrders.ts` is the pure order builder:
  it validates, then writes `rateUsd`, `totalUsd` and `days` from the quote and
  never from the form. `createOrder` now only reads storage, calls the builder,
  writes, persists and notifies, so the rules are testable without a hook.
- `src/lib/myanmarTime.ts` holds `myanmarToday()` and `addDaysToDay()` (UTC+6:30,
  no DST). `rentalReports.ts` and `rentalCatalog.ts` use it instead of their own
  copies, so "today" means the same day in the reports, the rules and the form.
- `RentalsPage.tsx` shows a rejection in an alert above the submit button, keyed
  by the returned code, so a server error and a client error read the same in
  both languages. The 15 `rental_error_*` keys are in MM and EN.

**Verification.** `npx tsc --noEmit -p tsconfig.app.json` clean; `npx vitest run`
21 files / 248 tests, including 23 in `src/lib/rentalOrderRules.test.ts` and 7
new ones in `src/lib/rentalOrders.test.ts` for the tampered total, the request
code, city availability, minimum days, the Myanmar Time start, and the per-account
hourly limit; `npm run build` succeeds; `npx eslint .` reports 0 errors.
Browser check: a Yangon bicycle order submitted and produced
`RNT-261123-0001` at 36,000 Ks on `/account/bookings/RNT-261123-0001`, and a
forced `rental_error_city_availability` rendered in Burmese above the button.

## Rental acceptance items 1, 5, 9 and 10 (Plan §8.12) — 23 November 2026

The rule mirror above covered criteria 2–4. This pass closes the four that were
still open, and moves the dictionary out of the provider so a missing string is
visible to a test instead of hidden behind a cast.

- **Acceptance 10 — every server error reads in MM and EN.** The migrations
  raise 23 distinct `rental_error_*` codes; the dictionary had 15. The eight
  missing ones (rate missing, participants, terms version, the staff-action
  codes and the reschedule codes) are now filled in both languages.
  `translate(key: string, language)` accepts a plain string and returns
  `undefined` for a code this build does not know, so a newer server code reads
  as missing rather than as a type error or a crash. `t()` falls back to the key
  itself. `src/lib/rentalErrorMessages.test.ts` reads the codes straight out of
  `supabase/migrations`, so a migration that adds a code fails the suite until
  the text exists.
- **The dictionary moved to `src/lib/translations.ts`.** `i18n.tsx` was 1,727
  lines and exported both the dictionary and the provider, which the
  `react-refresh/only-export-components` rule flags. `translations.ts` now holds
  the 1,610 keys, `TranslationKey` and `translate()`; `i18n.tsx` is 47 lines of
  provider and re-exports the type, so no import site changed.
- **Acceptance 1 — exactly one order per submit.** `canSubmit` on `/rentals`
  requires `!submittedCode`, so a second click cannot create a duplicate before
  the traveller edits a field.
- **Acceptance 5 — the voucher lookup is scoped to the viewer.** `canReadAllOrders()`
  and `orderForViewer()` in `src/lib/rentalOrders.ts` decide who may read an
  order: Super Admin and the order-handling roles (Rental Admin, Admin, Payment
  Admin) read every voucher, a traveller reads only their own, and a signed-out
  visitor reads none. `/account/bookings/<code>` used to union the two lists, so
  a guessed code reached another traveller's booking.
- **Acceptance 9 — the notice is counted in Myanmar Time.** `rescheduleOrder()`
  measured the 24-hour notice from a browser-local midnight and took "tomorrow"
  from UTC. `myanmarDayStartMs()` (new in `src/lib/myanmarTime.ts`) gives the
  Yangon midnight the server uses, and the new start date comes from
  `myanmarToday()`, so the boundary no longer moves with the browser's timezone.
- **Request codes are stamped in Myanmar Time.** `rentalRequestCode()` sliced
  the UTC date, so an order placed after 17:30 UTC carried yesterday's day.
  `findRate()`, the Rental Admin terms version and the report window and CSV
  filename use the same helper.

**Verification.** `npx tsc --noEmit -p tsconfig.app.json` clean; `npx vitest run`
23 files / 291 tests; `npm run build` succeeds; `npx eslint .` reports 0 errors
and the same 7 pre-existing warnings. Browser check in Burmese and English: the
`RNT-261120-0001` voucher rendered all 17 fields in both languages, and the
reschedule panel rejected a past date with its translated message.
