# MH Travel — Completed Work Record

**Last updated:** 20 November 2026
**Verified against:** `main` @ `5f3924b` plus the route, accessibility,
layout, and paging work of 20 November 2026.

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
- Rentals preview supports city-specific availability, rental type selection, dates, customer type, delivery/branch pickup, pricing estimates, and submission handoff.
- Shared Favorites persist locally, update immediately after save/unsave, and synchronize across same-tab and browser storage events.

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

`npm test` runs Vitest over four files, 23 tests:

| File | What it proves |
|---|---|
| `src/data/links.test.ts` | Every seed `href` resolves to a declared route; no duplicate route paths; every catalog id is unique within its catalog; a place href resolves to the record that owns it |
| `src/routes.manifest.test.ts` | `public/manus-routes.json` lists exactly the declared routes, each once, each with a title |
| `src/lib/categoryFilter.test.ts` | Category options and filtering, plus the map-search and phone-dial href builders |
| `src/lib/useGridColumnCount.test.ts` | Whole-row paging maths, including clamping the last page so no record is hidden |

The suite runs in under a second and needs no browser, so it can gate every
delivery check alongside typecheck, build, and lint.

## Code hygiene — verified 20 November 2026

- No `TODO`, `FIXME`, `XXX`, or `HACK` markers in source.
- No `console.log` left in source.
- ESLint has zero errors and seven pre-existing non-blocking warnings.
- Typecheck and production build pass on the audited commit.
- `npm test` passes: 23 tests over the route table, seed links, filters, and
  paging.

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

## Paging — fixed 20 November 2026

Blogs and Travel Guide each paged by a hard-coded six, which leaves a ragged
last row on a four-column grid. Both now share `src/lib/useGridColumnCount.ts`:
it reads the grid's real column count from the computed style, so no breakpoint
is duplicated in JavaScript, and `alignToRow` rounds each page up to a whole
row. The last page is clamped to what exists, so nothing is hidden.

Confirmed in the browser: Blogs renders 8 cards at 1440px and 6 at 390px;
Travel Guide renders 8 and 6 the same way.
