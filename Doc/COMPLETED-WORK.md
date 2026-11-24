# MH Travel — Completed Work Record

**Last updated:** 29 November 2026 (latest pass: the §4 catalog growth to
nineteen templates; below it the 24 November component-test seam, then the
detail-link and grid-cap fixes of the same day)
**Verified against:** `main` plus the Shop Page template layer (the lazy
template modules under `src/templates/`, the `/shops/:shopId` route and the
`scripts/a11y-audit.mjs` gate), the Rental catalog data module and Rental Admin
panel, the per-account Favorites, notification, and review wiring, and the
scheduled publishing seam that now sits between the Blog/Travel Guide editors
and their readers, with unpublish, soft delete, restore and the version guard
that refuses a stale save; earlier baseline `ecb231f` covers the Blog and Travel Guide
admin editors, admin-role accounts, the rental-category work of 20–22 November
2026, and the same-day work on the guide route follower, the two owner
dashboards, and the Foreign Tourist section.

This document records the frontend features, preview workflows, backend preparation, and documentation work completed so far. Production/backend boundaries remain explicitly listed in [`REMAINING-WORK.md`](./REMAINING-WORK.md).

For the one-page view of what is finished versus open, read
[`STATUS.md`](./STATUS.md) first. This file is the detail behind its
**DONE** and **PREVIEW** marks.

## Pages that are now rendered by a test — 24 November 2026

Every suite before this one read data or source text. None mounted a page, so a
filter, a tab or a form could break and leave the suite green; the docs said so
in `REMAINING-WORK.md` and `PLAN-VS-CODE.md` §6a, and every interaction check
was done by hand.

`src/test/renderWithProviders.tsx` renders a page inside the real provider
stack — `LanguageProvider` → `AuthProvider` → `CurrencyProvider` →
`FavoritesProvider` over a `MemoryRouter` — rather than mocks, because a page
that passes against a mocked `t()` or favourite store can still break in the
app. `src/test/setupDom.ts` fills the two jsdom gaps the pages touch:
`matchMedia` (read by the reduced-motion checks) and `IntersectionObserver`
(read by `AdSlot`). Both exist in a browser and in neither jsdom, so without
them a page would throw in the test and work in production.

Only `*.dom.test.tsx` gets a document (`environmentMatchGlobs` in
`vite.config.ts`), so the 68 node suites keep their speed. The two new suites:

| Suite | What it drives |
|---|---|
| `src/features/place/PlaceDetailPage.dom.test.tsx` | the not-found state on `PlaceDetailPage`, `RestaurantPage` and `BookShopPage`; a real hotel id renders its record instead; the text follows the chosen language |
| `src/features/blogs/BlogsPage.dom.test.tsx` | choosing a category chip narrows the list to that category's own stories, `aria-pressed` moves off All, and All restores the full list |
| `src/features/emptyStates.dom.test.tsx` | Blogs, Travel Guide, Travel Plans, Rentals, Nearby, a category page and Favorites each reach their empty state, with the MM/EN copy |

Both were mutation-checked before commit: reinstating `?? POPULAR_BOOK_SHOPS[0]`
in `BookShopPage` and deleting the category filter line each turn the suite red,
so the tests can fail. `jsdom`, `@testing-library/react` and
`@testing-library/user-event` are new dev dependencies; the react-refresh lint
rule is switched off for test files only, so the warning count stays at seven.

868 tests in 71 files pass; typecheck clean, lint 0 errors, build clean.

## Detail links that resolve, and grids that compute their cap — 24 November 2026

Two findings from the `a6b16ac` audit were code, not documentation, and both are
now closed and test-guarded.

**The seven dead detail ids.** `links.test.ts` proved a seed `href` matched a
*declared route*; it never proved the `:id` resolved to a *record*. Seven of the
47 detail hrefs named nothing: the Home **Populars** row (`pp1…pp6` spread over
`/hotels/`, `/book-shops/` and `/markets/`), a notification carrying the travel
plan id `tp1`, and — the worse half — two bespoke pages that answered an unknown
id with `?? LISTINGS[0]`, so `/book-shops/pp2` rendered the first book shop under
a URL naming another one.

- `src/lib/detailRoutes.ts` is now the one resolver: `resolveDetailRecord(slug,
  id)` reads the place catalog for the seven place slugs and the two city-page
  collections for restaurants and book shops, and `resolveDetailHref(href)`
  splits a `/slug/id` href. `PlaceDetailPage`, `RestaurantPage` and
  `BookShopPage` all read it, so there is no second definition of "which record
  does this URL mean".
- `src/components/ui/RecordNotFound.tsx` is the single not-found state, with
  `record_not_found` / `record_go_back` in both languages. The `?? [0]`
  fallbacks are gone.
- `POPULARS` links records that exist (`/hotels/sedona-yangon`,
  `/hotels/lotte`, `/book-shops/shwe`, `/book-shops/book-nook`,
  `/markets/bogyoke`, `/markets/junction-city`) and the notification points at
  `/hotels/sedona-yangon`.
- `links.test.ts` gained a record-level twin of the route test: every seed
  detail href goes through `resolveDetailHref()` and an unresolved one fails the
  suite.

Verified in the browser: `/hotels/lotte`, `/book-shops/shwe`,
`/markets/bogyoke` and `/restaurants/monsoon` render their record;
`/hotels/pp1` and `/book-shops/pp2` render the not-found state in Burmese and
English, with no console errors.

**The grid caps that contradicted their card size.** Favorites (990px), Account
(998px, two grids) and Blogs related hotels (982px) declared `size="md"` while
capping the grid at the `sm` width, so the size prop did nothing and the row
read smaller than declared. `src/lib/cardGrid.ts` now computes the number the
Plan §4 formula gives — `cardGridMaxWidth(columns, size, gap)` = `columns × max
width + gaps`, over a `CARD_MAX_WIDTH_PX` table that mirrors `CARD_SIZES` — and
`cardGridStyle()` applies it inline, because Tailwind cannot see a class name
built at runtime. Every capped card grid uses it now: Favorites, Account, Blogs
related hotels, City (both), Category, Place, Search and Travel Plans.
`src/lib/cardGrid.test.ts` fails if a page hand-writes a five-column cap again,
and fails if the pixel table drifts from the `maxWidth` classes.

Verified in the browser: `/favorites` renders six `md` cards under 1240px,
`/hotels` 1240px, `/travel-plans` 1230px (4 × 300 + 3 × 10), and no page
logged a console error.

`npm test` 68 files / 853 tests; typecheck clean, lint 0 errors (7 pre-existing
warnings), build clean.

## Template catalog growth to nineteen designs (Plan §4) — 29 November 2026

§4 asked for about ten hotel designs and, after the hotel category, a paid
alternative for the rest. This pass closes both.

- **Hotel reached ten paid designs.** Four new lazy modules beside the free
  default: `hotel_split_screen` (a fixed frame — icon rail, a half-screen photo
  that never scrolls, the catalog as an accordion, the booking ask in the always
  visible header), `hotel_board` (a masthead and a grid of bordered tiles, with
  the booking ask as a full-width strip between the rooms and the reviews),
  `hotel_panorama` (a full-screen hero with the name on the photo, an underlined
  tab row, the rooms as a comparison matrix, and a booking bar pinned to the
  bottom of the viewport) and `hotel_directory` (a directory entry — labelled
  rows, dotted leaders on the price list, no hero image, the phone number and
  address the most prominent things on the page).
- **Each other category gained one paid design.** `restaurant_menu_board` reads
  as a menu rather than a listing (dotted leaders, a dark header, a table-request
  strip). `cafe_photo_grid` leads with a tiled photo wall and puts the menu in a
  two-column chip grid. `attraction_ticket` replaces the catalog grid with a
  numbered "what you will see" sequence and a fact strip of hours and ticket
  price. `book_shop_shelf` is a shelf: a sticky sidebar of shop facts and a list
  of rows with a coloured spine rule, so a long catalog reads like a catalogue.
- **Every pair passes the axis test.** `templateProblems()` and the
  `shopTemplates.test.ts` seed test check every live pair in a category, and the
  migration trigger repeats the rule on the server. No design is a recolor: each
  differs from every other live template of its category on at least four of the
  seven axes.
- **The catalog and the SQL seed cannot drift.** `shopTemplates.test.ts` now
  reads `20261128000100_shop_templates.sql`, `20261128000200_shop_template_events.sql`
  and the new `20261129000100_shop_template_catalog_growth.sql` and fails when a
  template id, a category or a trait set exists on one side only.
- **The fixture now covers every category.** `shopPageData.ts` gained
  `yangon_teahouse` (restaurant), `bagan_roastery` (cafe) and
  `shwedagon_pagoda` (attraction), so each category has a real shop to render,
  and `shopTemplateStore.ts` seeds them alongside the hotel and the book shop.
- **The rendered gate covers the whole catalog.** `scripts/a11y-audit.mjs` now
  builds its cases from the catalog instead of a hard-coded hotel list: every
  active template as a preview on its own category's fixture shop, plus each
  shop on its served template, at 360/390/768/1440 in both themes. That is 192
  combinations, clean. One contrast failure was found and fixed on the way —
  `hotel_board` printed the contact line at `text-white/80` on the navy strip
  (4.23:1); it is plain white now.
- **Verification.** 67 test files, 849 tests pass; typecheck clean; lint 0 errors
  (the 7 pre-existing warnings stand); production build succeeds.

## Template analytics and three more hotel designs (Plan §4) — 24 November 2026

§4 left two things unbuilt: template usage was not counted, and the catalog held
four hotel designs where the founder expects about ten.

- **Counting rules.** `src/lib/templateStats.ts` is the new seam. A view is one
  public render of a template; an apply is one switch that actually moved the
  shop; a preview is neither, because an owner reading their own data is not a
  shopper. A bot user agent is refused, a repeat inside the same page view is
  deduped on `session:template:kind`, the store keeps the newest 5,000 rows and
  the purge keeps 180 days.
- **Where the rows come from.** `ShopPage.tsx` records the view through a
  page-view session hash, so a re-render or a language switch is not a second
  view while a reload is. `OwnerTemplatePanel.tsx` records the apply only when
  `switchedFrom` differs from the chosen template, so re-picking the current one
  is not counted.
- **Where it is read.** The Super Admin catalog panel gained a *Template usage*
  section: views, applies, apply rate, share of all views and last seen, in both
  languages. `template_events_purge` joins the §16B.7 registry (daily, 00:15
  Myanmar Time) and `platformJobs.ts` binds it.
- **Storage.** `supabase/migrations/20261128000200_shop_template_events.sql`
  carries `shop_template_events`, its unique per-session index, a
  `template_usage()` report function and the purge. An anonymous shopper may
  insert a view of a live template and nothing else; an owner may insert an
  apply for their own shop.
- **Three new hotel designs.** `hotel/HotelBookingFocus` (booking panel, tab
  bar, bookable room cards), `hotel/HotelMapFirst` (map card, sticky sidebar,
  definition-list catalog) and `hotel/HotelStory` (typographic opening, no hero
  photo, interleaved photos, numbered rooms, one closing ask). Each differs from
  every other live hotel design on at least four of the seven axes, which the
  seed test now asserts for every pair.

Verified: typecheck 0 errors, lint 0 errors / 7 pre-existing warnings,
`npm test` 67 files / 829 tests, build clean, and `npm run a11y` clean across
72 combinations (seven hotel templates plus two free shops × four widths × two
themes).

## Shop Page templates and the rendered gate (Plan §4, §16D Phase 3) — 28 November 2026

§4 defines a template as "a presentation layer only" and gates Phase 3 on "a
template switch and fallback work". The catalog and the switch were committed on
24 November; this pass builds the layer that actually renders, so a template row
now reaches a page.

- **The route is fixed, the modules are lazy.** `src/features/shop/ShopPage.tsx`
  serves `/shops/:shopId`. It resolves the template id through
  `resolveTemplateForShop()`, then asks `src/templates/registry.ts` for the
  module, so adding a template is a new module and a new catalog row — never a
  route change, which is what §4 requires. An unknown id renders the free
  baseline instead of throwing.
- **Six modules, eight catalog rows.** `hotel/HotelClassic` (the free baseline),
  `hotel/HotelEditorial`, `hotel/HotelCompact`, `hotel/HotelGalleryFirst`,
  `bookShop/BookShopClassic` and `generic/SimpleClassic`, which the restaurant,
  cafe and attraction rows share because those three categories differ in data
  rather than in layout. Only hotels carry paid designs today, so the other
  categories have a free baseline and no alternative yet. The four hotel designs differ on the seven §4 axes that the
  catalog already records — layout, navigation, hero, catalog, CTA placement,
  gallery and mobile pattern — so the "genuinely different" test is visible in
  the markup rather than claimed in a row.
- **One data contract.** `src/templates/shopPageData.ts` is the fixture behind
  `ShopPageData`, with a hotel and a book shop. Every template receives exactly
  that shape, so a template has no path to the owner's business data and a
  switch cannot lose it.
- **Shared parts, not copies.** `src/templates/templateParts.tsx` holds
  `PriceCell` and `BookingCta`; `src/templates/templateHelpers.ts` holds the
  pure helpers (`averageRating`, `catalogName`, `photoAlt`, `priceVisible`).
  `PriceCell` formats through `src/lib/moneyFormat.ts`, so MMK is still rounded
  to the nearest 100 and USD still shows two decimals (decision 33) — no
  template does its own arithmetic.
- **Preview is the owner's, on real data.** `?preview=<template-id>` renders
  another template over the same shop, allowed only for that shop's owner or a
  Super Admin (`canPreviewTemplate()`), and every preview writes a `preview`
  audit row. The owner panel's Preview button opens it in a new tab, so the
  owner compares two live pages instead of a screenshot.
- **The gate is a script, not a claim.** `scripts/a11y-audit.mjs` (`npm run
  a11y`) drives headless Chromium over every hotel template plus the free shop,
  at 360/390/768/1440px, in dark and light, and fails on any WCAG 2.1 AA
  violation, any horizontal overflow, a page without exactly one `h1`, or a run
  whose theme did not actually apply — a "light" pass that silently rendered
  dark would otherwise satisfy every colour rule while testing nothing. Current
  result: **48 combinations clean**.
- **Colour comes from tokens.** The templates first carried hardcoded light-only
  values, which read as white-on-white in the light theme. They now use
  `text-text-primary`, `text-text-muted`, `text-link`, `bg-bg-card`,
  `border-border`, the new `ratingText` token for stars and `brand-navy` for the
  deep bar. `templates.test.ts` fails if a template reintroduces a
  `bg-[#…]`-style literal or a second `h1`, so the rule survives the next
  template.
- **Two repo-wide fixes came out of the sweep.** The header wordmark was
  `text-brand-blue` `#4d8dff` on the light background (3.2:1) and is now
  `text-link`; the owner and Main Owner language buttons carried an `aria-label`
  that did not contain their visible text, which is a WCAG 2.5.3 failure, so the
  label now starts with the visible word.

## Owner ledger and twice-monthly payouts (Plan §9, §16B.1, §16D Phase 3) — 27 November 2026

The owner money path is now real rather than a mock wallet card. §9 says the
commission is deducted at payment time, is fully Admin-discretion and differs
shop by shop (0% included), and that payouts run twice a month with a 50,000 MMK
minimum that carries over. §16D gates Phase 3 on one property: **a payout run is
reproducible from ledger rows.**

- **The rules are pure functions.** `src/lib/ownerLedger.ts` holds the window
  arithmetic (`payoutWindowFor()`, `recentWindows()`, `latestDueWindow()`),
  the commission snapshot (`createSaleRow()`, `commissionMmkFor()`), the run
  planner (`planPayout()`, `duePayouts()`), the settlement (`createPayoutRun()`,
  `markRowsPaid()`), the reproducibility check (`replayPayout()`), the owner
  statement (`statementFor()`) and the next two due dates (`upcomingDueDays()`).
- **The commission is frozen on the row.** A sale stores its own
  `commissionPercent`, so changing a shop's rate today never rewrites a payment
  taken last week. `createSaleRow()` refuses a `bookingRef` that already has a
  row, so recording the same payment twice cannot pay the owner twice.
- **The minimum carries over without a special case.** A run settles every
  unpaid row whose own window is due by the run's due day; a shop under 50,000
  MMK simply writes no run and its rows stay unpaid, so they are picked up by
  the next one. `createPayoutRun()` returns null rather than paying a partial
  amount.
- **A run is reproducible by construction.** It stores the ids of the rows it
  settled and the totals it settled them at, and `replayPayout()` recomputes
  those totals from the rows. The panel shows the verdict per run, and
  `verify_owner_payout()` is the same check in SQL.
- **The panels.** `src/features/superAdmin/OwnerPayoutsPanel.tsx` is the new
  Super Admin workspace section `payouts` (§16B.1: F for Super Admin and Payment
  Admin, `–` for Admin, so `canRunPayouts()`/`canSetCommission()` gate both
  writes). It shows owed vs carried vs paid, the shops due, the per-shop
  commission editor, the run history and the replay verdict, and every run
  writes an audit row plus a bilingual feed notice to the owner.
- **The owner reads a statement, not the platform ledger.** The Shop Owner
  Payments view (`OwnerEarningsPanel`) shows what the shop keeps after
  commission, what has been paid, the carry-over state, the next two payout
  dates and the sales and payout history — scoped by `shopId` through
  `statementFor()`, so the panel cannot ask for another shop's money (§16B.1
  `O (own earnings)`).
- **Storage.** `src/lib/ownerLedgerStore.ts` is the browser stand-in for
  `owner_commission_settings`, `owner_ledger_rows` and `owner_payout_runs`;
  `20261127000100_owner_ledger.sql` is the table set, with RLS per §16B.1, a
  unique index on `booking_ref`, a check that `net = gross - commission`, an
  append-only trigger that freezes the amount columns and refuses a second
  settlement, `run_owner_payout()` and `verify_owner_payout()`.
- **Verified.** 30 unit tests cover the window boundaries (the 20th and the 5th,
  a short February, the year roll-over), the frozen rate, the double-payment
  refusal, the minimum, the carry-over, the two-shop separation, the replay
  match and mismatch, and the owner statement. The panels were checked in the
  browser: a run moved four rows to paid, the replay read "matches the ledger",
  and the owner's statement showed 117,000 Ks still owed against 742,500 Ks paid.

## Owner and template subscriptions (Plan §9, §4, §16B.3, §16B.7) — 26 November 2026

An Owner pays a monthly fee for the shop account (§9, Admin-discretion, any
amount or none) and, separately, 2,000 MMK per month for a paid Shop Page
template (§4). Both run the same lifecycle — active, then a grace period after
the period ends, then expired — so both are one record with a `kind`.

- **The rules are pure functions.** `src/lib/ownerSubscriptions.ts` states
  `deriveStatus()` (active → grace → expired, with an unreadable `periodEnd`
  treated as expired so a broken row cannot grant free service),
  `daysUntilEnd()` counted on the Myanmar calendar rather than in hours,
  `graceDaysLeft()`, `blocksBooking()` (§9: the listing stays visible, booking
  and contact stop), `dueReminders()` and `markReminded()`. A reminder key is
  `id:periodEnd:daysLeft`, so renewing the period resets the count and a second
  run on the same day finds nothing.
- **The rows live in a store, not in a panel.** `src/lib/ownerSubscriptionStore.ts`
  is the browser stand-in for `shop_subscriptions`; `readSubscriptions()` returns
  the row as stored so the job can still see the old status, while
  `useSubscriptions()` derives the status as of now for the reader, because a
  stored status is up to an hour stale between two runs.
- **Two jobs are wired.** `src/lib/subscriptionJobs.ts` holds
  `runSubscriptionExpiry()` (Active → grace → expired, one audit row per row that
  actually moved, actor `system`) and `runRenewalReminders()` (one bilingual feed
  row per due threshold). Both write only what changed, so a rerun is silent.
  `src/lib/jobs.ts` marks `subscription_expiry` (`wired: true`, hourly) and
  `renewal_reminders` (`wired: true`, daily 09:00 Myanmar Time), and
  `src/lib/platformJobs.ts` binds them. All eight §16B.7 jobs now report a real
  result on the Super Admin jobs page.
- **Reminders reach the owner, not the staff bell.** §16B.3 addresses the
  reminder to the owner, so the feed row is written with an `author` recipient
  matching `ownerName` — the same byline rule guide earnings already use. The
  row stores both languages, so an owner who switches language before reading
  still reads their own copy.
- **Audit.** `'subscriptions'` is a new `adminAudit` source with MM and EN
  labels, so the §16B.2 log can be filtered by it.
- **Owner screen.** Shop Owner → Subscription shows the status, the days left or
  the grace remaining, the monthly fee, the period, the end date, the
  booking-blocked banner when expired, and the renewal instruction. It reads only
  the signed-in owner's own row (`subscriptionForOwner()`), so one owner never
  sees another shop's fee; Super Admin's `?preview=1` view falls back to the first
  owner row because it has no shop of its own.
- **Notification bell.** The Shop Owner header bell now reads the same
  `useFeedRows()` the platform writes, so a renewal reminder lands there instead
  of a hard-coded badge.
- **Migration committed.** `supabase/migrations/20261126000100_shop_subscriptions.sql`
  holds `shop_subscriptions` (`kind`, `template_id`, `amount_mmk`, `period_start`,
  `period_end`, `grace_days`, `status`, `reminded_keys`), the two indexes the
  jobs scan by, and RLS: Super Admin, Admin and Payment Admin read all rows, an
  owner reads the row matching their own byline, and only Super Admin and Payment
  Admin insert.

Verified in the browser: the panel renders active, grace and expired states, the
bell shows a seeded reminder in both languages, and the jobs page reports
`subscription_expiry` and `renewal_reminders` as wired. `npm test` 62 files /
699 tests; typecheck and lint clean (7 pre-existing warnings).

## Notification readers — 26 November 2026

A notification is written once and read later, in whatever language the reader
has chosen by then, so every row now stores both languages:

- `FeedRow.title` and `FeedRow.message` are `LocalizedTextLike` and
  `NotificationItem.title` is too. `useFeedItems()` no longer takes a `timeAgo`
  callback — it passes `createdAt` through, and the reader labels the age.
- `localizedOrFallback()` is the read, so the bell (`NotificationsDropdown`),
  the inbox (`NotificationsPage`), the account activity list (`ActivityFeed`)
  and the Admin bell all show the reader's language and fall back to the one the
  row was written in rather than a blank.
- `src/lib/timeAgo.ts` holds the age rule: `timeAgoSince()` returns a unit and a
  count, `timeAgoText()` translates it through `time_just_now` /
  `time_*_ago`, and `ageBucket()` groups the inbox by Myanmar calendar day.
  Before this the page grouped by whether the English label contained "hour",
  which broke the moment the page was read in Burmese.
- Every writer now stores both languages: the publish buttons in
  `BlogPostsPanel` and `TravelGuidesPanel` (`translatePair` / `fillPair`), the
  scheduled publishing job, the rental status feed row, and the guide earning
  rows. A writer that only has one string still passes a string and it is
  stored in both.
- The seed rows in `src/data/notifications.ts` are bilingual and carry
  `createdAt` instead of a hardcoded English `timeAgo`. A row written by an
  older build with a single string is lifted to both on read.

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
- `mediaApi.ts` (then `blogMediaApi.ts`) failures carry a `MediaErrorCode`
  instead of a message, so an upload error reads in the active language.
- `describeAction` became `actionLabelKey`, returning a `TranslationKey` for
  the audit line instead of English text.
- `fill()` in `src/lib/fill.ts` replaces `{count}`/`{title}`-style
  placeholders, so one key serves every count and title. It is unit-tested.

## Reader fallback for half-written copy (Plan §16B.4, 26 November 2026)

- `localizedOrFallback()` in `src/lib/translationCache.ts` is the read every grid
  and card uses. It returns the reader's language, else the language the text
  was actually written in, and returns `''` for a missing field. It never calls
  the Worker and never shows the auto-translated marker, which is the rule
  §16B.4 sets for a name, an address and a price: those are not translated, they
  are shown as written.
- Wired into the city page (`bestFor`, `stay`, `travel`, the category chips, the
  search label and placeholder, the result count, the empty state and
  Show more/less), the category pages, the place detail page, the restaurant page
  (dish name, description, badge, menu categories, amenities, nearby places and
  the address/hours/price/cuisine facts) and the book shop page (book categories,
  services, nearby places and the same facts). The rental admin panel already
  used it for type and variant labels.
- A grid resolves per card, so a twelve-card page does not fire twelve Worker
  requests; the single-item reader (a blog story, a travel guide) still goes
  through `useLocalizedText()` and keeps the marker. `localizedOrFallback` is
  unit-tested for the blank-language, written-language and missing-field cases.
- Restaurant and book-shop filter keys stay English (`category.en`) while the
  button shows the reader's language, so switching language no longer drops the
  selected category and the list never empties unexpectedly.
- The four readers no longer index `text[language]` directly, so a record written
  in one language renders that language instead of a blank.

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
stores the account with `role: 'admin_staff'` and the chosen Plan §3 role, and
the new admin signs in at the existing admin login. Sessions and accounts
written before the rename (`content_admin`) are remapped on read, so an older
stored admin keeps the workspace instead of reading as a traveler.

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
  the dictionary (2,001 keys at the move, 2,198 when counted at `abe2700`),
  `TranslationKey` and `translate()`; `i18n.tsx` is 47 lines of provider and
  re-exports the type, so no import site changed.
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

## One role-scoped admin workspace (Plan §3, §16B.1) — 23 November 2026

Two spellings of the same role were in play: `profiles.role` stores a slug
(`rental_admin`), while the Admin Management form, the UI and the permission
matrix speak the product name (`Rental Admin`). The rental migrations compared
product names against the slug column, so `is_rental_staff()` never matched a
real account and every rental write was rejected as forbidden. On the client the
same mismatch made a staff account fall back to `traveler`.

- **`src/lib/roleMapping.ts`** holds `ROLE_SLUGS` (all eight product roles) and
  `adminRoleFrom()`, which accepts either spelling in any case and separator
  style, so `rental_admin`, `Rental Admin` and `rental-admin` resolve alike.
  `normalizeStoredRole()` maps the retired `content_admin` to `admin_staff`.
- **`src/lib/adminWorkspace.ts`** turns §16B.1 into data: `sectionsForRole()`
  lists the sections a role may open, `canOpenSection()` answers for one, and
  `canHandleOrders()` / `canRecordPayment()` split the rental-order row into its
  two rights, so a Payment Admin records a payment and changes nothing else.
- **`auth.tsx`** hydrates `adminRole` from the profile row and signs every
  recognised staff role in as `admin_staff` rather than as a traveler. Sessions
  and accounts written before the rename are remapped on read.
- **`SuperAdminPage.tsx`** filters its navigation through `sectionsForRole()`,
  so each role lands on its own first section; a super admin without a hydrated
  role keeps the full workspace, and any other role without one sees nothing.
- **`RentalOrdersPanel.tsx`** shows only the status buttons the role may press,
  hides the guide-cost form and the expiry job from a payment-only account, and
  makes the admin note read-only for it.
- **`supabase/migrations/20261122000400_rental_role_slugs.sql`** normalises the
  slug once in `current_role_name()`, adds `can_handle_rental_orders()` for
  writes, restricts Payment Admin to the `accepted → paid` step, points
  `is_rental_editor()` at the handler predicate, and repoints the
  `rental_order_extras` write policy at it too.

**Verification.** `npx tsc --noEmit` clean; `npx vitest run` 25 files / 314
tests; `npm run build` succeeds; `npx eslint src` reports the same 7 pre-existing
warnings. Browser check at `/super-admin` in Burmese: Super Admin saw all 18 nav
entries, Rental Admin only Rentals, Rental Orders and Rental Reports, Payment
Admin only Orders, Reports and Currency, Blog Post Admin only Blogs, and a
session still holding `content_admin` kept the workspace instead of being sent
to `/account`. On an accepted order the Payment Admin saw the record-payment
control alone, and the Rental Admin saw the full action set.

## Guide earnings as its own section (Plan §16B.1) — 23 November 2026

The §16B.1 row `| Guide earnings | F | – | R | – | F (set amount, mark paid) | O (read) | – | – |`
had no home: the earnings table was rendered inside `TravelGuidesPanel`, which
a Payment Admin cannot open, so the role the matrix gives the write could never
reach it. The rows also lived in component state, so they vanished on reload and
a second role could never see them.

- **`src/lib/guideEarningsStore.ts`** (new) owns the rows: `readGuideEarnings()`
  seeds one row per published guide, `addEarningForGuide()` adds a row when a
  guide is published and leaves an existing one alone, and `useGuideEarnings()`
  gives the panel `rows`, `setAmount` and `markPaid`. This is the seam where the
  `guide_earnings` table replaces browser storage.
- **`src/lib/guideEarnings.ts`** gained `guideTitle`, `amountSetAt` and `paidAt`,
  `earningsForAuthor()` to narrow the list for a Guide Content Admin, and a
  `paidUsd` total in `authorTotals()` so settled money is separate from payable.
- **`src/lib/adminWorkspace.ts`** adds the `guideEarnings` section to Super
  Admin, Admin, Payment Admin and Travel Guide Content Admin, plus
  `canSetEarningAmount()` / `canMarkEarningPaid()` / `canReadAllEarnings()`.
- **`src/features/superAdmin/GuideEarningsPanel.tsx`** (new) is the section:
  payable, settled and waiting-for-amount totals, a search box, four state
  filters, and a table where the amount input and the "mark paid" button appear
  only for a role that may write. A Guide Content Admin sees its own byline's
  rows and read-only amounts.
- **`TravelGuidesPanel.tsx`** no longer keeps earnings in state; publishing calls
  `addEarningForGuide()` so the row lands in the shared store.

**Verification.** `npx tsc --noEmit` clean; `npx vitest run` 25 files / 320
tests; `npm run build` succeeds; `npx eslint src` reports the same 7 pre-existing
warnings. Browser check at `/super-admin` in Burmese: Payment Admin saw only
Orders, Reports, Guide earnings and Currency, typed 25 into the Bagan row (the
payable total moved to $25.00 and the row offered "mark paid"), then settled it
(payable $0.00, settled $25.00); Admin saw the same rows with the amount as text
and no button; a Travel Guide Content Admin signed in as Min Htet saw only that
byline's three rows, read-only.

## Admin accounts persist, and every admin decision writes an audit row (Plan §16B.1, §16B.2) — 23 November 2026

Two gaps sat behind the Admin Management table. A created admin lived in
`useState`, so the row disappeared on reload while the account it created
stayed in `localStorage` — the list and the login disagreed. And §16B.2 asks
for one audit row per create, role change, payment and publish, with no table
to write them to yet.

- **`src/lib/adminAccounts.ts`** (new) turns a stored auth user into a table row
  (`adminRowFromUser()`), derives the counters (`adminSummary()`) and merges the
  seeded rows with the live ones (`mergeAdminRows()`), so a stored account
  appears once and keeps its own role. `permissionsForRole()` maps a role to the
  §16B.1 permission label.
- **`src/lib/auth.tsx`** exposes `adminAccounts`, the stored users with an admin
  role, which is what the table now reads.
- **`AdminManagementPanel`** computes its rows with `useMemo` over
  `mergeAdminRows(seeded, adminAccounts)` instead of holding them in state, so a
  created admin survives a reload and cannot be created twice.
- **`src/lib/adminAudit.ts`** (new) is the §16B.2 store: one append-only row with
  actor, actor role, action, object type, object id, a one-line summary, UTC time
  and source; 500 rows kept, and `useAdminAudit()` re-reads on a change event and
  on a `storage` event so a second tab sees the same log. This is the seam where
  `admin_audit_logs` replaces browser storage.
- **`src/features/superAdmin/AuditLogPanel.tsx`** (new) is the reader: totals for
  rows, today's rows, actors and object types, a search box, an action filter and
  the table. §16B.1 keeps "Settings and roles" with Super Admin, so
  `canReadAuditLog()` and the `audit` section are Super Admin only.
- Writes are recorded at the three sites that exist today: creating an admin
  account (`created`), setting a guide earning amount (`updated`) and marking it
  paid (`payment`).
- **`src/lib/adminNotices.ts`** (new) raises the §16B.3 notification for the same
  three decisions, in the bell the rental staff notices already use, so the
  §16D Phase 0 gate ("Super Admin creates a Blog Post Admin and the audit row and
  a notification appear") is met in one step. The per-recipient rows wait for
  `notification_feed`.
- The "Audit log ကြည့်ရန်" link on the Admin Management table used to write a
  toast instead of opening the log; it now switches the workspace to the `audit`
  section.

**Verification.** `npx tsc --noEmit` clean; `npx vitest run` 28 files / 338
tests (including `src/lib/adminAudit.test.ts`, `src/lib/adminAccounts.test.ts`,
`src/lib/adminNotices.test.ts` and the new `canReadAuditLog` cases);
`npm run build` succeeds; `npx eslint src` reports the same 7 pre-existing
warnings. Browser check at `/super-admin` in Burmese: after creating
"May Myat Noe" the row was still in the table after a reload; "Khin Su" and
"Nilar Win" appeared at once with the Ads Admin permission label; creating
Nilar Win raised the bell notice "Admin အကောင့် အသစ် — Nilar Win ကို Ads Admin
အဖြစ် ဖန်တီးပြီး" with the badge at 1; the "Audit log ကြည့်ရန်" link opened the
"စစ်ဆေးမှု မှတ်တမ်း" section, which listed 2 rows — actor
`MH Travel Super Admin`, role Super Admin, action ဖန်တီးပြီး, object Admin အကောင့်
`nilar.win@mhtravel.com`, summary `Nilar Win · Ads Admin · Ads Management`,
source Admin လုပ်ငန်းခွင်.

## Audit coverage, exchange-rate history, and money formatting — 23 November 2026

Three Plan sections moved forward together, because each one was a "the rule
exists in the Plan but only half of it is in code" gap.

**§16B.2 audit coverage.** `src/lib/adminAudit.ts` gained `useAuditRecorder()`,
a hook that fills actor and actor role from `useAuth()` so a panel records with
one call and cannot forget who did it. The remaining write paths now write a row:

| Write | Action | Source |
|---|---|---|
| Shop Owner created | `created` | `admin_workspace` |
| Exchange rate set | `updated` | `currency` |
| Blog post saved / published / deleted | `updated` / `published` / `deleted` | `content` |
| Travel guide saved / scheduled / published | `created` / `updated` / `published` | `content` |
| Rental order accepted, completed, cancelled | `updated` | `rental_orders` |
| Rental order paid | `payment` | `rental_orders` |
| Rental extra added | `updated` | `rental_orders` |
| Admin role changed | `role_change` | `admin_workspace` |

The label maps moved out of the panel into `src/lib/adminAuditLabels.ts`, and
`src/lib/adminAuditLabels.test.ts` walks every action, object type and source and
fails if any of them has no MM or EN text — so adding a member to a union cannot
ship an untranslated cell.

**Role change (§16B.1 + §16B.2).** Admin Management now offers a role select per
row, backed by `changeAdminRole()` in `src/lib/auth.tsx`. The rules live in
`src/lib/adminRoleChange.ts` rather than in the panel: only a Super Admin may
change a role, nobody may change their own, the Super Admin row is locked, an
unknown value is refused, and a no-op writes nothing. The last two exist because
the first browser check proved they were needed: an empty value wrote the audit
row `Nilar Win · Ads Admin → ` with nothing after the arrow. Seeded rows are
disabled too (`AdminRow.stored`), because they have no stored record to rewrite.

**§16B.5 currency.** `src/lib/exchangeRates.ts` stores rates as append-only rows
(`mmkPerUsd`, `effectiveFrom`, `setBy`, `note`); the rate in force is the latest
row whose `effective_from` has passed, and the Plan's 4,500 remains the fallback
until the first row exists. Super Admin → Currency takes an optional note and
shows the history table, so the reason for a change survives. `supabase/migrations/20261123000100_exchange_rates.sql`
commits the matching table, its RLS (public read; insert only for Super Admin and
Payment Admin; no update or delete policy) and the `current_mmk_per_usd()`,
`round_mmk()` and `usd_to_mmk()` functions.

**Decision 33.** `src/lib/moneyFormat.ts` is the single formatter: USD to 2
decimals, MMK rounded to the nearest 100. `currency.tsx` now delegates to it
instead of rounding MMK itself, so the voucher, the rentals page and the admin
preview cannot disagree.

**Verification.** `npm run typecheck` clean; `npm test` 32 files / 359 tests
(new: `adminAuditLabels`, `adminRoleChange`, `exchangeRates`, `moneyFormat`);
`npm run build` succeeds; `npx eslint src` still 7 pre-existing warnings. Browser
check at `/super-admin` in Burmese: saving `3,800` with the note "CBM reference
rate" showed the new rate in the preview (`1 USD = 3,800 Ks`), appended one row
to the history, and wrote the audit row `4,500 → 3,800 MMK per USD · CBM
reference rate`; changing Nilar Win from Ads Admin to Payment Admin updated the
row and its permission label to `Payments, Reports` and wrote the
`role_change` audit row; selecting the role a row already has shows no error.

## Scheduled jobs runner — Plan §16B.7, 23 November 2026

The §16D Phase 0 gate asks for a jobs runner whose failure alerts Super Admin.
`src/lib/jobs.ts` now holds the whole schedule as data: the eight Plan jobs, each
with its cadence (an interval, or a daily wall-clock time in Myanmar Time) and a
`wired` flag. `nextDailyRun` shifts into Myanmar Time, floors to the day and
shifts back, so the answer needs no timezone database and does not move when the
viewer's own zone changes for DST. `dueJobs` compares each job against its own
last run, so one job's row can never delay another.

`runDueJobs` executes what is due, appends one row per attempt to `job_runs`
(`id`, `job`, `at`, `outcome`, `detail`), and returns the failures.
`alertJobFailures` turns each failure into a bell notice in the same list the
rental staff notices use, so the Super Admin sees it without a second inbox. A
job that throws becomes a `failed` row instead of stopping the tick, and an
unwired job is skipped rather than logged, so seven unbuilt jobs cannot bury the
real runs.

`src/lib/platformJobs.ts` binds the handlers and `src/App.tsx` ticks the schedule
once a minute; the rental payment expiry inside it keeps its §8.9 five-minute
cadence, and `useRentalExpiryJob` was removed now that the runner owns the timer.

Super Admin → Scheduled jobs (`JobsPanel`) lists every job with its cadence, last
run, next due time, state and result, plus the recent run log. An unwired job
reads "Not wired" rather than "Ready", so the page states how much of the
schedule is real (`2/8` today, after scheduled publishing was wired on
24 November) instead of implying the work is finished.

`supabase/migrations/20261123000200_job_runs.sql` commits the `job_runs` table,
its Super Admin-only read policy, a `run_platform_job(job, work)` wrapper that
logs the outcome and re-raises on failure, and a `pg_cron` entry for the rental
expiry job that is created only when the extension exists.

**Verification.** `npm run typecheck` clean; `npm test` 34 files / 379 tests
(new: `jobs`, `jobLabels`, and `myanmarClock` in `myanmarTime`); `npm run build`
succeeds; `npx eslint src` unchanged at 7 pre-existing warnings. Browser check at
`/super-admin` in Burmese: the nav shows "အလိုအလျောက် အလုပ်များ", the table lists
all eight jobs, the rental expiry job reads `16:03 · 2026-11-23` with next due
`16:08` and the result "ပြောင်းလဲမှု မရှိပါ", the other seven read "မချိတ်ရသေး",
and the run log shows the same row.

## Media and storage rules for the five R2 folders — Plan §16B.6, 24 November 2026

The Plan names five folders — `blog-posts/`, `guide-stops/`, `ads/`,
`rentals/`, `shops/<shop-id>/` — and gives each a type, a size and, for an ad
video, a length. Only the blog cover had a rule, hard-coded inside the upload
call, so a guide photo and an ad creative were measured by a blog rule.

`src/lib/mediaRules.ts` is now the one table. `MEDIA_RULES` states each folder's
prefix, accepted types, stored format, byte ceiling and longest edge;
`AD_VIDEO` carries the §16A.8 video limits (MP4, 3 MB, 15 s);
`folderPrefix()` builds the path and refuses a missing or path-like shop id, so
`shops/../admin` cannot escape the folder. `checkMedia()` returns one answer for
every upload and names the reason with a code the editor already translates
(`unsupported_type`, `too_large`, `video_too_long`, `shop_required`,
`quota_reached`). It takes a `stage`: an `original` image is only held to the
12 MB source ceiling because it is compressed next, and the folder's own ceiling
is applied a second time to the compressed result.

`src/lib/mediaApi.ts` replaces `blogMediaApi.ts`. It converts an image to WebP
and walks the quality down; when a detailed photo still misses 450 KB at full
size the longest edge is halved twice more before the upload is refused, which
is what turned a 5.6 MB test photo into a 447 KB cover. An ad video is sent as
MP4 unchanged, with its measured length in the request, because re-encoding it
in the browser would take seconds and lose quality. The editors name their
folder: `uploadContentImage(file, 'blog-posts')` in Blog Post Management and
`uploadContentImage(file, 'guide-stops')` in Travel Guide Management, and the
success message now reports the real folder instead of a fixed `R2/blog-posts`.

`supabase/migrations/20261123000500_media_objects.sql` adds `media_objects`, one
row per object, with the five folder values, the `shops/<id>/` key check, the
size checks that repeat the client table, and `last_referenced_at` — the cleanup
reads that column rather than `created_at`, so an old file still in use is kept.
It also adds `register_media_object()`, `touch_media_object()`,
`shop_media_count()` (the server-side count behind a shop's quota),
`orphan_media_objects(days)` for the §16B.7 nightly job, and
`delete_media_object()`. There is no client insert or delete policy: the
authenticated Worker writes and the cleanup deletes, so a browser cannot claim an
object it did not upload.

**Verification.** `npm run typecheck` clean; `npm test` 38 files / 446 tests
(new: `mediaRules`, 30 tests); `npm run build` succeeds; `npx eslint src`
unchanged at 7 pre-existing warnings. Browser check: the rules answered inside
the running app (`blog-posts` 450 KB, `ads` image 300 KB, `ads` video 3 MB / 15 s,
`shops` needs an id); a 1 KB PNG uploaded as a blog cover and a guide cover and
showed in both editors; a 5.6 MB 1600×1200 PNG compressed to 447 KB and was
accepted; a 16-second ad video was refused with `video_too_long`; a shop photo
without an id was refused with `shop_required`. No page errors on any of the
routes checked.

## Translation fallback with an Admin review queue — Plan §16B.4, 24 November 2026

The Plan asks for one behaviour when a text exists in only one language: the
reader asks for a translation, the answer is cached in `translation_cache`, and
the text carries an "Auto-translated" marker until an Admin approves or edits it.
Names, addresses and prices are never translated.

`src/lib/translationCache.ts` holds the rules with no browser or network in
them, so they can be tested: `isTranslatable()` refuses `name`, `address` and
`price`; `sourceHash()` keys one text per direction, so two readers asking for
the same paragraph share a row; `resolveLocalized()` returns the reader's own
text first, then a cached translation, then the source language with `needs` set
so the caller can ask the provider; `reviewTranslation()` turns an `auto` row
into `approved` (text kept) or `edited` (text replaced) and `reviewQueue()` ranks
the automatic rows by views, busiest first. A reviewed row is never overwritten
by a later machine one, which is why `rememberTranslation()` returns the existing
row instead of adding a second.

`src/lib/translationApi.ts` posts to the Cloudflare Worker named by
`VITE_TRANSLATION_ENDPOINT` and stores what comes back. Without the endpoint it
returns `not_configured` rather than inventing text, so a preview build shows the
source language. `useLocalizedText()` is the single reader seam and
`AutoTranslatedMark` is the marker. The blog reader uses it for the title, the
excerpt, every paragraph and every image `alt`; the travel guide reader uses it
for the title, the summary, and each stop's title and description.

`TranslationReviewPanel` is the Admin queue, reachable from the new
`translations` workspace section (Super Admin and Admin, per the §16B.1 content
rows). Each approval or edit writes one `adminAudit` row with object type
`translation`.

`supabase/migrations/20261123000400_translation_cache.sql` commits the table with
its status check and one unique index per text and direction, RLS (public read,
automatic insert by a signed-in reader, review by Admin and Super Admin only,
no delete), and the functions `cache_translation`, `record_translation_view`,
`review_translation` and `translation_review_queue`.

**Verification.** `npm run typecheck` clean; `npm test` 37 files / 416 tests
(new: `translationCache`, `translationApi`); `npm run build` succeeds; `npx
eslint src` unchanged at 7 pre-existing warnings. Browser check at
`/super-admin` with one automatic and one approved row seeded: the nav entry
appeared, the queue showed the automatic row with "Seen 7 times" and hid the
approved one, and Approve flipped the row to `approved` with reviewer
`MH Travel Super Admin`, emptied the queue and wrote one `translation` audit
row. `/blogs?story=bagan-first-light` and `/travel-guide` both rendered with no
page errors.

## Notification service with named recipients — Plan §16B.3, 23 November 2026

The Plan asks for one notification service: a shared `notification_feed` plus the
existing per-user read state, delivered to the bell, kept 90 days. The bell
previously showed one flat list to every admin, so a Rental Admin saw ad
approvals and a Super Admin saw rental requests.

`src/lib/notificationFeed.ts` states the §16B.3 table as data. Each event names
its default recipients — a product role, an account id, an author byline, or
`everyone` — and one occurrence may narrow that list. `canSee()` answers the
question per row, so the writer names the audience once and the reader filters;
`feedFor()` adds the retention cut and the newest-first order. `pushFeedEvent()`
refuses to write a row with no recipient, because an event nobody owns is a
wiring mistake, not a broadcast.

The writers now use it: a rental request and a reschedule go to Rental Admin and
Super Admin, a rental status change goes to the traveler's own account and links
their voucher, a published blog or guide is a row for everyone, a guide earning
amount or payment is addressed to the guide's author by byline, a shop-owner
application goes to Admin and Super Admin, and a failed job goes to Super Admin.
The admin bell reads the feed beside the staff notices, narrowed by
`useFeedRows()` to the signed-in role and account, so the badge counts only what
that person may act on. The traveler's notifications page shows the same rows
with the shared read map.

`supabase/migrations/20261123000300_notification_feed.sql` commits the table,
`can_read_feed_row()` (role, account, author-byline or everyone), a read policy
that also hides an expired row, and `purge_expired_feed_rows()` for the §16B.7
schedule. There is no insert policy: only the server functions that own an event
may write a row.

**Verification.** `npm run typecheck` clean; `npm test` 35 files / 399 tests
(new: `notificationFeed`, plus feed assertions in `rentalOrders`, `adminNotices`
and `jobs`); `npm run build` succeeds; `npx eslint src` unchanged at 7
pre-existing warnings. Browser check at `/super-admin` with one row of each kind
seeded: the Super Admin bell showed the job failure, the ad approval and the
published post but not the Rental Admin row; a Rental Admin session showed the
rental request and the published post but neither the job failure nor the ad
approval; an Ads Admin session showed the published post only.


## Scheduled publishing, and a reader that reads what Admin wrote — Plan §10 §4, §16B.7, 24 November 2026

The Blog and Travel Guide editors held their rows in component state, so a
scheduled post was thrown away by the first reload and `publish_due_content` had
nothing to read. The §16D Phase 0 gate asks for that job end to end, so this
change puts a store behind both panels, a projection in front of both readers,
and the job between them.

`src/lib/contentStore.ts` is the seam: `blog_posts` and `travel_guides` are one
record each, read through `useBlogPosts()` / `useGuides()` and written through
`setPosts` / `setGuides`, with revisions and the content audit log beside them
(`useRevisions(kind)`, `useContentAudit(kind)`). A row saved before
`scheduledFor` existed is migrated on read, so an older browser record still
publishes instead of sitting in `Scheduled` forever. `AdminPost` gained the
required `excerptEn` / `excerptMm` the editor already collected but never saved.

`src/lib/scheduleRules.ts` owns the clock. `myanmarWallClockToUtc()` turns the
Myanmar Time the editor types into the UTC instant the row stores, and rejects a
date that does not exist (`2026-02-31` rolls into March, so the round trip is
what refuses it) rather than shifting a half-typed schedule into the wrong hour.
`utcToMyanmarWallClock()` fills the editor again, `isDue()` treats an empty or
unreadable schedule as never due, and `formatScheduleLabel()` renders the
Admin table's schedule in `Asia/Yangon`. The panels show that label under the
`Scheduled` pill, which is what makes a scheduled row legible at a glance.

`src/lib/scheduledPublishing.ts` is the job body. It publishes every due post,
then every due guide, writing one audit row with the actor `system`, one
notification feed row, and — for a guide — its first earning row. It is safe to
run twice because a published item has left `Scheduled`, so the second pass
finds nothing due. `publish_due_content` is now `wired: true` in
`src/lib/jobs.ts` and bound in `src/lib/platformJobs.ts`, so it runs on the
one-minute tick and reports `<blog>/<guide>` in the run log; the jobs page now
reads `2/8` instead of `1/8`. That run detail needed its own wording — the Result
column said "1 order(s) expired" for every job, so `sa_jobs_detail_published`
now reads "Published 1 blog post(s) and 0 guide(s)", and a `0/0` run still says
"Nothing to change".

`src/lib/contentReader.ts` is the projection the readers use. `adminPostToReader`
and `adminGuideToReader` turn an Admin row into the card shape the pages already
render: blocks become paragraphs, images and ad slots in order, read time is
English words ÷ 200 rounded up, and the slug is created from the English title
on first publish and then fixed. `publishedBlogPosts` / `publishedGuides` keep
only `Published` rows, replace a seeded story the editor has taken over instead
of duplicating it (keeping its slug, so a shared link survives, and its sample
rating and distance, which the editor does not collect), and append the
untouched seeds. `BlogsPage` and `TravelGuidePage` read through it, and both
accept a link by slug or by id.

Per Plan §10 §8 a post with no rating and no coordinates hides those two
metrics instead of printing `0`, on the listing card and on the guide detail
panel. The publish check in `BlogPostsPanel` now passes the post's real excerpt
rather than the `'ok'` placeholder it used to.

`supabase/migrations/20261123000600_scheduled_publishing.sql` commits
`blog_posts` and `travel_guides` with the lifecycle columns the editor and the
job share: `scheduled_for` (the UTC instant), `published_at` (only once live),
`version` for optimistic concurrency, and check constraints that refuse a
`Scheduled` row without an instant or a `Published` row without a date. The
role check accepts `Super Admin` and `Blog Post Admin` for blog rows and adds
`Travel Guide Content Admin` for guides.

**Verification.** `npm run typecheck` clean; `npm test` 41 files / 487 tests
(new: `contentReader`, `scheduledPublishing`, `scheduleRules`; `jobs` updated
for the second wired job); `npm run build` succeeds; `npx eslint src` unchanged
at 7 pre-existing warnings. Browser check at `/super-admin` with a post seeded
as `Scheduled` for a past instant: the table showed the schedule label
`1 Dec 2026, 09:00` for a future row, the tick moved the past one to
`Published` with run detail `1/0`, the audit log showed the actor `system`, the
feed gained one row, and `/blogs?story=admin-blog-e2e` opened the story with its
image, location and author. A second reload published nothing and wrote no
duplicate feed row. A future-dated post stayed invisible to the reader, and an
Admin-authored guide appeared in `/travel-guide` and at
`/travel-guide/<id>` with its stops in time order and a computed duration.

## Unpublish, delete, restore and a stale save — Plan §10 §4, §7 acceptance 5–6, 24 November 2026

The editor could publish and schedule, but Plan §10 §4 also names Unpublish,
Delete and Restore, and §7 acceptance 5 asks that two editors saving one post
never silently overwrite each other. Both panels now do all four.

`src/lib/contentLifecycle.ts` holds the rules once, so Blog and Travel Guide
cannot drift: `unpublishPost` / `unpublishGuide` return the row to `Draft` and
clear `publishedAt` and `scheduledFor`; `softDeletePost` / `softDeleteGuide`
set `deletedAt` and keep the row, its revisions and its audit trail;
`restorePost` / `restoreGuide` clear that marker again. Every one of them bumps
`version`, and `isStaleSave(row, loadedVersion)` is what makes a save from an
older row detectable.

`AdminPost` and `AdminGuide` gained `deletedAt` and `version`, filled in for a
row stored before they existed. The Blog and Guide tables gained a delete
button that becomes a restore button on a deleted row, an unpublish button on a
published one, and a `Deleted` marker with a dimmed row, so the table still
lists what Admin removed. Publish, unpublish and restore are hidden on a
deleted row, so a stray click cannot bring it back half-way.

The editor records the version it loaded. On save, a row that has moved on is
refused with `cw_problem_version_conflict` and the editor shows its own banner
with a `Reload` button, because the panel notice renders under the modal
overlay. `Reload` reopens the row as the other editor left it, and a row that
has since been deleted closes the editor with an explanation instead. A
revision restored from the history is now recorded as `restored` in the audit
trail rather than as a plain save, which is what §7 acceptance 6 describes.

`src/lib/contentReader.ts` drops a soft-deleted row, and — the part that was
easy to miss — also drops the *seed* a row has taken over when that row is no
longer published. Without that, unpublishing or deleting a seeded story left it
live on `/blogs` and `/travel-guide`, because the seed was never overridden by
a published row and so fell through to the untouched-seed branch.

`publish_due_content` skips a soft-deleted row (`publishDueItems` gained an
eligibility predicate rather than losing the row from the store) and bumps the
version it publishes, so an editor left open on a scheduled post is told the
row moved instead of overwriting the job's publish.

`supabase/migrations/20261124000100_content_lifecycle.sql` puts the same rule
on the server: a `before update` trigger on both tables refuses any write that
does not claim exactly `old.version + 1` and raises `version_conflict`
(`40001`), and `unpublish_blog_post`, `soft_delete_content` and
`restore_content` are the version-checked wrappers. `publish_due_content` is
redefined there so the job's own update claims the next version too.

**Verification.** `npm run typecheck` clean; `npm test` 42 files / 501 tests
(new: `contentLifecycle`; `contentReader` gained the five withdrawal cases;
`scheduledPublishing` gained the deleted-row and version-bump cases);
`npm run build` succeeds; `npx eslint src` unchanged at 7 pre-existing
warnings. Browser check on a seeded published post: Delete wrote
`deletedAt` and `version 2`, the row showed `Deleted`, and `/blogs?story=lc-post`
dropped the story and cleared the query; Restore wrote `version 3` and the
story came back; Unpublish left `Draft` with an empty `publishedAt` at
`version 4` and the story left the reader again. The same three steps passed for
a guide on `/travel-guide/gg-post`. A second editor moving the stored row to
`version 9` made the open editor's save fail with the conflict banner, the
other editor's title survived, and `Reload` refilled the form from the newer
row. Restoring an older revision wrote a `restored` audit row and a new
revision. `/super-admin`, `/blogs` and `/travel-guide` showed zero horizontal
overflow at 360, 768 and 1440 px.

## The Ads system and Adsboard (Plan §16A) — 25 November 2026

Plan §16A was written against the old console: nine pages of local state, a
fixed Rentals banner, and no serving function the public pages could call. The
work below closes that gap end to end — one seam for the Adsboard, the pages and
the jobs.

**Data (§16A.4).** `supabase/migrations/20261125000100_ads.sql` creates
`ad_advertisers`, `ad_campaigns`, `ad_creatives`, `ad_placements`,
`ad_assignments`, `ad_events` and `ad_stats_daily` with RLS and the indexes the
serving query needs. The click URL is checked by a `check` constraint as well as
in code, both alt languages are required, and `bytes` plus `duration_seconds`
carry the §16A.8 measurements. `src/lib/adStore.ts` is the browser stand-in with
the same shapes, so the tables replace it without moving a call site.

**Serving (§16A.1, §16A.5).** `src/lib/adCampaigns.ts` holds the rules: the
status machine, `canServe` (Live and inside the window), `campaignServesPlacement`
(assigned, on, with an approved creative), `pickCampaign` (highest priority, then
weighted rotation seeded on the placement and the minute) and `serveAd`, which
answers `null` for every reason a slot must collapse. `AdSlot` now walks the full
§16A.1 order: Admin ad, then AdSense when the placement allows fallback and a
client id is set, then nothing. An impression is counted once the ad is half
visible for a second, once per creative per session per page view; a click is
counted as the link opens; bot user agents are ignored.

**Adsboard (§16A.7).** `src/features/superAdmin/AdsManagementPanel.tsx` is the
seven sections the Plan names:

| Section | What it does |
|---|---|
| Overview | Active campaigns, live placements, impressions, clicks, CTR, pending creatives, campaigns ending in 7 days |
| Pages and placements | Per-page placements with the on/off and fallback toggles, the current ad preview, the health state and the 24-hour fill rate |
| Campaigns | Status, advertiser, placement and day filters; one create-edit form with the window, priority, weight, placements, fee and invoiced/paid flags |
| Creatives and approvals | The Pending queue with preview, approve, and reject with a reason |
| Advertisers | Contact details and campaign history; a rename follows the campaigns that carry the old name |
| Reports | Totals and by day, placement and campaign, 7 / 30 / all, CSV export |
| Settings | AdSense client and slot, the §16A.8 limits, and the blocked-domain list |

`filterCampaigns` lives in the domain module rather than the panel, so the filter
rule is tested on its own; a day filter matches a campaign whose window overlaps
that day, not only one that starts on it.

**Creative rules (§16A.8).** `creativeProblem` now takes the Settings limits and
the blocked-domain list. A measured size over 300 KB (image) or 3 MB (video), a
video longer than 15 seconds, or a click URL on a blocked host is refused with
its own code; a size that is still unknown is not refused, because the browser
stand-in has no upload Worker to measure it. `isSafeClickUrl` keeps `https` and
internal paths and adds the host block list, with subdomain matching.

**Access (§16A.9).** `canReadAdReports()` is separate from `canManageAds()`:
Payment Admin opens the Ads section and sees Reports only, with a note that
editing is not permitted, which is what the §16B.1 `R (reports)` row says.

**Jobs (§16B.7).** `ad_campaign_window` is wired to the one-minute tick: it
starts a campaign whose window opened, ends one past its `end_at`, and raises the
ending-soon and ended notices once.

**Placement pass.** Every §16A.3 key now has a live `AdSlot`: `cities_top` and
`city_detail_after_restaurants` on the two city pages, `travel_plans_top` and
`travel_plan_detail_inline` on the plan pages, `nearby_top` and `account_top`.
`home_after_blogs` sits directly after the blog grid rather than after the
popular-searches strip, so the key means what its name says.
`src/lib/adPlacementWiring.test.ts` reads the pages and fails when a slot names a
key the catalog does not declare, and it also fails when a seeded creative points
at a file that is not under `public/` — four seeds did, so they were repointed to
images the repository actually ships.

**Verification.** `npm run typecheck` clean; `npm test` 49 files / 570 tests;
`npm run build` succeeds; `npx eslint src` unchanged at 7 pre-existing warnings.
Browser check at `/super-admin` in Burmese: the Advertisers tab listed six
advertisers with their campaign and live counts; Campaigns showed `7/7` with the
four filters and an empty-state message; Pages and placements showed the 24-hour
fill rate in the panel title and the per-slot health. On `/`, `/cities`,
`/nearby`, `/account` and `/travel-plans/tp4` the ad slots rendered with the
`ကြော်ငြာ` label, and `/ad/click/cr-home-hero?p=home_hero&s=test-session-1`
recorded the click and then redirected to `/travel-plans`.

## Blog content in both languages, and no more gallery list — Plan §10 §2, 26 November 2026

Plan §10 §2 decided three things about the Blog model that the code had not
taken up: the byline and the place are bilingual, a photo caption is bilingual,
and `galleryUrls` is removed because an extra photo is an image block. All three
are now in the code, with the stored browser rows migrated on read.

**The model.** `AdminPost` carries `authorEn`/`authorMm` and
`locationEn`/`locationMm` instead of `author` and `location`, and `galleryUrls`
is gone. An image block carries `captionEn`/`captionMm` instead of `caption`.
The reader already spoke this language — `BlogPost.author`, `location` and
`BlogBlock.caption` are `LocalizedText` — so the editor was the only side that
had to change; `contentReader.ts` now passes the two sides through instead of
copying one string into both.

**The migration.** These rows live in browser storage, so there is no database
to migrate. `normalizePost` in `contentStore.ts` reads a row saved in the
single-language era and fills both languages from the one value that was
written, and `normalizeBlock` does the same for a caption. A gallery list is
dropped rather than carried forward. That is deliberately the only place the old
shape is understood.

**The empty side.** A byline or caption written in one language only is not
blank on the other side of the site: the editor fills the second language on
save, and the reader falls back to the language that was written. A caption that
is whitespace in both is treated as absent, so a photo does not render an empty
`figcaption`.

**The editor.** Author and location are two fields each, side by side; a caption
is two inputs under the photo, with `credit` on its own row. The gallery picker
and its thumbnail strip are gone, and the table's second line now counts image
blocks instead of gallery photos, so a post's photo count still reads at a
glance. Five translation keys were replaced by the pairs they need, and four
keys that only the gallery used were deleted.

**The tables.** `20261123000600_scheduled_publishing.sql` gains
`author_name_mm`, `location_mm` and `caption_en`/`caption_mm`, so the committed
schema still mirrors the client shape it will be swapped for.

**Verification.** `npm run typecheck` clean; `npm test` 53 files / 597 tests
(5 new in `contentStore.test.ts`, 3 new and 2 updated in
`contentReader.test.ts`); `npm run build` succeeds; `npx eslint src` back to 7
pre-existing warnings. Browser check at `/super-admin` in Burmese: the Blogs
table listed the four posts with the image-block count, and the editor showed
အမျိုးအစား, the four `ရေးသားသူ`/`တည်နေရာ` fields in two columns each, the
cover picker, the new note about adding extra photos as image blocks, and no
gallery strip.

## A card hides the rating and the distance it does not have — Plan §4, §10 §8, 26 November 2026

Plan §4 said every card always shows rating, distance, favourites and views.
Plan §10 §8 and the decision register's row 16 said the opposite for two of the
four: a post with no rating shows no rating, and a distance shows only when the
item has coordinates and the reader allowed location. Both were true of the
code — Blogs and Travel Guide guarded correctly, the shared `ListingCard` and
five other card surfaces printed `0.0` and `0 km`.

**One rule.** `src/lib/cardMeta.ts` holds `hasRating` and `hasDistance`, plus
`formatRating` and `formatDistance`. A zero, a negative or a `NaN` counts as
absent, so a missing value can never reach the screen as a number. The card asks
the rule, it does not re-derive it.

**Where it applies.** The shared `ListingCard` (which every grid uses), and the
page-level cards that draw their own meta row instead: `NearbyPlaceCard`,
`RentalsPage`, `PlaceDetailPage`, `RestaurantPage`, `BookShopPage`, `CityPage`
and the Travel Plan hero. `BlogsPage` and `TravelGuidePage` already had the
guard and were left alone.

**One number convention.** The new formatters go through `Intl.NumberFormat`
with the `my-MM` locale, which is what the app already uses, so Myanmar readers
see `၄.၉` and `၁.၂ ကီလိုမီတာ` while English readers see `4.9` and `1.2 km`.
`NearbyPlaceCard` gained a `language` prop for this; `NearbyPage` already had
the hook.

**Plan corrected.** §4's "always shows all four, no exceptions" was the line
that produced the bug, so it now says the four are always *carried* and two are
*hidden when absent*, with the file that implements it.

**Verification.** `npm run typecheck` clean; `npm test` 54 files / 604 tests
(7 new in `cardMeta.test.ts`, covering zero, `NaN`, negative, and both
languages); `npm run build` succeeds; `npx eslint src` back to 7 pre-existing
warnings. Browser check at `/nearby` in Burmese: every card read `၁.၂
ကီလိုမီတာ`-style distances with Myanmar digits and no card showed a zero.

## SEO tags are a list, and opening the editor no longer erases content — Plan §10 §1, 26 November 2026

Plan §10 §1 listed `seoTags` as a list. The editor held one comma-separated
text field, so a tag containing a comma could not exist and every read had to
re-split a string. `AdminPost.seoTags` is now `string[]` and the editor draws
chips: type a tag, press Add or Enter, press `×` to remove one. A duplicate that
differs only in case is refused, so `Inle Lake` and `inle lake` cannot both
exist.

**One parser.** `src/lib/tagList.ts` holds `normalizeTags`, `tagToAdd` and
`removeTag`. `normalizeTags` takes the array or the old comma-separated string,
because a row in browser storage outlives the code that wrote it, and drops
blanks, duplicates and non-strings. `contentStore` uses it on the seed data and
on every row it loads; `contentReader` uses it for the reader projection.

**Two data-loss bugs fixed on the way.** Opening the editor to edit an existing
post built its form from `emptyForm` and copied the title, category, author and
location — but not `excerptEn`, `excerptMm` or `seoTags`. Saving then wrote the
blank values back, so editing a published post silently erased its excerpt and
its tags. Both are now carried into the form. Verified in the browser: open the
Bagan post, the excerpt and its three tags are present, add `Temple sunrise`,
save, reopen — four tags, excerpt intact.

**Verification.** `npm run typecheck` clean; `npm test` 55 files / 614 tests
(10 new in `tagList.test.ts`: array, legacy string, blanks, case-insensitive
duplicates, non-string entries, add, remove, join); `npm run build` succeeds.

## Blog draft autosave — Plan §10 §4 "Draft save", 26 November 2026

The Plan's draft-save rule is now in the editor: a draft is written every 30
seconds with no revision and no audit row, and an explicit Save adds both.

**The rule lives in `src/lib/draftAutosave.ts`, not in a timer.** It states the
interval (`AUTOSAVE_INTERVAL_MS`), `formFingerprint` (a stable digest of the
editable fields), `shouldAutosave` (nothing changed, or the interval has not
elapsed, means no write) and `isWritableDraft` (an untouched editor creates no
nameless row). Twelve unit tests cover the interval boundary, an unchanged
form, a tab that slept for hours writing once on wake rather than in a burst,
and the empty editor.

**Only a Draft is autosaved.** A Published or Scheduled post changes through
the explicit Save, because that path runs `blogPublishCheck` and the version
guard; an autosave that skipped them could put an unchecked post in front of
readers.

**Two details that decide whether it works at all.** The panel reads the form
through a ref, so the timer is not restarted on every keystroke — with the form
in the dependency list a continuous typist would never reach the 30-second
mark. And a write advances `editingVersion`, otherwise the Save that follows
would be refused as stale against the autosave's own write.

**Shared row builder.** `composeRow` builds the row for both paths, so an
autosaved draft and a saved one cannot disagree about a field.

**Verified in the browser.** A new post with a title typed and nothing else
appeared in the table as a Draft within the interval, the editor showed
"မူကြမ်းကို 03:21 PM တွင် အလိုအလျောက် သိမ်းထားသည်။", and the explicit Save
afterwards reached the publish check instead of raising `version_conflict`.
Opening a Published post showed no autosave line, which is the draft-only rule
holding.

`npm run typecheck` clean; `npm test` 56 files / 626 tests; `npm run build`
succeeds.

## Guide author is bilingual — Plan §10 §2, 26 November 2026

A guide carried one `author` string, so the reader showed the English byline to
a Myanmar reader: `adminGuideToReader` copied it into both languages. The seed
data already had both (`{ mm: 'မင်းထက်', en: 'Min Htet' }`); the editor and the
store threw the Myanmar one away.

`GuideDraft.authorEn` / `authorMm` replace the single field. The editor has two
fields, `guidePublishCheck` asks for both (`author_languages`), the reader maps
each one through, and the audit and earnings paths keep the English name
because that is what an operator and a payout row read.

`normalizeGuide` keeps a guide saved with the old single field: the value goes
into both languages rather than leaving one byline empty.

Verified in the browser: the guide editor shows both author fields, and
`/travel-guide/tg1` shows "မင်းထက်" under ရေးသားသူ where it used to show
"Min Htet". `npm test` 56 files / 630 tests; typecheck and build clean.

## Guide draft autosave — Plan §10 §4, 26 November 2026

The 30-second draft save already ran in the Blog editor; the Travel Guide
editor had no autosave at all, so a guide being written was held only in the
browser tab. `TravelGuidesPanel.tsx` now runs the same rule from
`src/lib/draftAutosave.ts`: the row is written every 30 seconds with no
revision and no audit row, the first write creates the guide row, and an
untouched editor creates nothing.

Only a `Draft` is autosaved. A Published or Scheduled guide is left alone,
because those rows change through the explicit Save that runs
`guidePublishCheck` and the version guard. A write advances `editingVersion`
so the Save that follows is not refused as stale against our own write, and the
editor header shows the last autosave time.

Verified in the browser: a new guide typed for one tick appeared as a မူကြမ်း
row with the timestamp in the editor; editing a Published guide for the same
length wrote nothing and kept its published title. `npm test` 56 files /
630 tests; typecheck and build clean.

## Guide slug — Plan §10 §2, 26 November 2026

A guide was read at its row id, so the URL said nothing and could not be shared
with confidence. `AdminGuide.slug` now holds the URL name and
`src/lib/guideSlug.ts` is the single rule for it: the lowercase hyphenated
English title, numbered when another guide already holds it, and fixed at the
first publish so a link keeps working when the title is later edited.

The editor assigns it on Save and on Publish; the scheduled publish job assigns
it across the whole list in one pass, so two guides released in the same run
cannot collide. `contentReader.adminGuideToReader` and the guide cards link
through the slug, and the notification feed row carries
`/travel-guide/<slug>`.

A guide with no slug still answers on its row id: seeded guides keep their
existing `tg1`-style URLs, and a row written before slugs existed keeps its
link. `slugify` and `uniqueSlug` moved to `src/lib/slug.ts`, re-exported from
`contentReader.ts`, because the guide code must not import the reader.

Verified in the browser: publishing "Slug Check Guide" produced
`/travel-guide/slug-check-guide`, the feed row pointed at it, the reader
resolved the slug, and `/travel-guide/tg1` still resolved by id. `npm test`
57 files / 639 tests; typecheck and build clean.

## A removed listing flags a guide, never hides it — Plan §10 §5 acceptance 7, 26 November 2026

A guide stop points at a listing that already exists in MH Travel. When that
listing leaves the catalog, the guide must not disappear and must not show the
dead id as a place name.

`src/lib/guideListingHealth.ts` holds the rule: `stopListingMissing()` checks a
stop's `listingId` against `LISTING_IDS`, `missingListingStops()` names the stops
that fail, and `guideNeedsReview()` answers for a whole guide. The flag is
derived on read rather than stored on the row, so a listing that comes back
clears the flag without anyone opening the guide — the opposite of a column that
would need a cleanup pass.

What each surface does with it:

- Travel Guide panel: a "Needs review N" section above the table lists each
  affected guide and the titles of the stops that lost their listing, and each
  row links straight into the editor. The stop editor says the listing was
  removed and asks for a current one.
- Reader: the guide stays published. `contentReader.adminGuideToReader` keeps
  the stop's own stored title as `place` instead of the missing id, and marks the
  stop `listingMissing`. The page then shows "Directions unavailable" in place
  of the map link, in both the itinerary rows and follow mode.

Verified in the browser: pointing "3 Days in Bagan" at a removed listing raised
the panel banner with the guide and stop name, and `/travel-guide/tg1` still
rendered the guide with one stop's Directions replaced. `npm test` 58 files /
648 tests; typecheck, lint and build clean.

## The nightly orphan media job is wired — Plan §16B.6, 26 November 2026

`media_objects` is one row per stored file, carrying when a row last referenced
it. The table is committed in `supabase/migrations/20261123000500_media_objects.sql`
but not applied, so the job had nothing to read and stayed `wired: false`.

`src/lib/mediaObjects.ts` is now the browser stand-in for that table, and the
three calls map one-to-one onto the SQL functions: `registerMediaObject()` is
`register_media_object()`, `touchMediaUrls()` is `touch_media_object()`, and
`cleanupOrphanMedia()` is `orphan_media_objects(30)` plus the delete.

- **Register:** both editors call it after an upload, and only when the file
  actually reached R2. A preview data URL is not in the bucket, so a row for it
  would describe nothing.
- **Touch:** the explicit Save in Blog Post Management and Travel Guide
  Management passes the photos the row still uses — the cover and every image
  block, or the cover and every stop photo. A photo the editor replaced is the
  only one that stops being touched, so it is the only one that can age out.
- **Clean up:** `orphan_media_cleanup` is `wired: true` and bound in
  `platformJobs.ts`. It removes what nothing has referenced for more than 30
  days, reports the count, and finds nothing on a second run.

A URL with no row is ignored rather than kept alive, so a seeded image or a
hand-typed path cannot become immortal. A photo referenced exactly 30 days ago
is kept: the rule is "more than", matching `isOrphan` and the SQL function.

Verified in the browser: two registered objects with one aged past 40 days left
one row after `cleanupOrphanMedia()`, and the job registry reports
`orphan_media_cleanup` as wired. `npm test` 59 files / 660 tests at that date
(849 in 67 files at `abe2700`); typecheck, lint and build clean.
