# MH Travel — Completed Work Record

**Last updated:** 20 November 2026
**Verified against:** `main` @ `5f3924b`

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

All 26 routes declared in `public/manus-routes.json` resolve in `src/App.tsx`,
and every declared route is reachable. The `*` fallback renders a placeholder
rather than crashing.

This does not mean every link works. Links inside seed data point at routes
that are not declared; those are recorded in
[`STATUS.md` §5](./STATUS.md#5-broken-internal-links--not-done-48-links).

## Code hygiene — verified 20 November 2026

- No `TODO`, `FIXME`, `XXX`, or `HACK` markers in source.
- No `console.log` left in source.
- ESLint has zero errors and seven pre-existing non-blocking warnings.
- Typecheck and production build pass on the audited commit.
