# MH Travel — Completed Work Record

**Last updated:** 22 November 2026
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
