# MH Travel — Consolidated Project Plan
> **Authoritative single-file plan.** Consolidated on 16 November 2026 from the root roadmap, Plan notes, backend handoff, daily records, and implementation worklog.
## Document organization

- `Plan/PROJECT-PLAN.md` is now the single source of truth for product requirements, implementation history, backend handoff, and remaining plan context.
- `Doc/COMPLETED-WORK.md` records completed work in a concise delivery-oriented format.
- `Doc/REMAINING-WORK.md` records open production, backend, UX, and configuration work.
- `Doc/STATUS.md` is the one-page DONE / PARTIAL / PREVIEW / NOT DONE view and the place to start; `Doc/PLAN-VS-CODE.md` checks this Plan against the code.
- Division of roles: this Plan holds product requirements and decisions; `Doc/` holds what is done and open. Working order: read `Doc/` (STATUS first), then this Plan, then write the Plan additions and improvements; code is written from the Plan; afterwards `Doc/` records the completed parts and how they were implemented.
- Supporting non-plan documentation such as blog image licensing remains outside this consolidated plan.


---

## Consolidated source: Product roadmap and verified implementation inventory

> Living document. Added to section by section, and refined further as
> decisions develop during actual development.

---

## 1. Overview

- All-in-one web + mobile app for Myanmar travel, serving both foreign
  tourists visiting Myanmar and local Myanmar travelers.
- Mobile app stays synced with the web app through a shared backend.
- Development approach: finish the user-facing side completely before
  designing Owner/Admin dashboards, since user-facing requirements define
  what the dashboards need to manage.
- Home Page design is complete (confirmed 2026-11-21); it no longer blocks
  other modules and fills out as they arrive.
- Build priority (2026-11-21): MH Travel's own modules first: **Rentals**,
  then **Blog posts** and **Travel Guide posts**. MH Travel must be able to
  fully control each of them from both the system side and the Admin side
  before other modules are worked on. All other modules (hotels, restaurants,
  cafes, book shops, ticketing and so on) are filled in one by one,
  gradually, afterwards.
- The Shop Page template system (section 4) and the Operator system for
  outside businesses (section 9) are planned capabilities, built in Phases 3
  and 4 of the roadmap (section 16D), after the MH-owned modules and the core
  listings. Decisions made on the founder's behalf are listed in section 16E
  for review after testing.

---

## 2. Tech Stack and Workflow

- Frontend: Vite + React + TypeScript + Tailwind CSS.
- Backend, database and auth: Supabase.
- Deployment: Cloudflare Worker serving the built site as static assets
  (`wrangler.jsonc`, `assets.directory = ./dist`,
  `not_found_handling = single-page-application`). Pushes to `main` on
  GitHub deploy automatically.
- Cloudflare Workers/static hosting are part of the target deployment architecture.
  The checked-out repository currently contains the static Wrangler asset
  configuration, but no Worker JSON API or R2 data-access implementation.
- Application code is written in Cursor, step by step. Claude's job is the
  Plan: read `Doc/` first, then this Plan, then write the additions and
  improvements the Plan needs. Claude does not write application code.
  (This replaces the earlier line saying Claude writes the code directly.)
- Secrets (Supabase keys, tokens) live in a local, gitignored `.env` and in
  Cloudflare's build environment variables. They are never committed.

---

## 2A. Completed Implementation Inventory (verified 2026-11-10)

This section records what is already implemented in the repository. It is intentionally separate from the roadmap below so that completed work is not mistaken for planned work.

### Application foundation and shared UI

- Vite + React + TypeScript + Tailwind CSS, React Router, Lucide icons, dark-first theme tokens, light-mode toggle, currency formatting, and Burmese/English translations are in use.
- The responsive shell, sticky header, mobile partial-width sidebar, fixed mobile bottom navigation, full Home footer, inner-page copyright footer, and standalone Admin layout are implemented.
- Shared `CardListing`, `ListingCard`, ad-slot, currency, language, theme, authentication, and Favorites primitives are used across feature pages.
- Header, mobile menu, account access, search entry point, notifications, language, currency, theme, Favorites, and logout interactions are wired to routes or shared state.

### Traveler-facing pages

- Home is implemented with categories, marquee discovery, travel plans, Travel Guide, Blogs, Populars, reviews, awards, partners, ads, Top Attractions, Restaurants, Cafes, and the requested responsive card sizing.
- Cities includes a persistent bilingual Shwedagon hero banner with an Explore cities anchor CTA, followed by discovery sections for attractions, hotels, restaurants, book shops, rentals, transport, cafes, and markets. The hero is independent of the optional ad response so it cannot disappear when no ad creative is returned.
- Nearby supports browser location permission, fallback distance, direct search, category, rating, distance filters, closest results, and higher-rated recommendations.
- Blogs has a bilingual listing and in-app article reader, compact cards, categories, search, sorting, share, view count, rating, geolocation-gated distance, related stories, related hotels, and ad slots.
- Travel Plans has search, duration filtering, sorting, compact route cards, currency-aware prices, Favorites, and a detailed Custom Plan builder covering start point, MH Travel destinations, days, travelers, nationality, budget, transport, accommodation, optional hotel selection, and notes.
- Custom Plan messaging explains that MH Travel reviews the request, calculates the quotation, contacts the traveler, and negotiates destinations/services.
- Restaurants and Book Shops have listing/detail experiences based on the supplied references, including hero/info sections, photos, services or menus, reviews, nearby attractions, and CTAs.
- Rentals has a bilingual city-first flow with city-specific availability, motorbike, bicycle, car, horse carriage, camping tent, motorboat, and guide categories where available; car seat-size options; citizen/foreigner pricing; start/end date duration calculation; advance-date rules; delivery or branch pickup; phone validation; estimates; and MH Travel follow-up confirmation.
- Ticketing has Bus, Train, Events, and Cinema categories with city/township or venue search, two-step result-to-booking flow, route/venue matching, bus passenger count, nationality, time, boarding point, drop-off point, seat selection, cinema movie/hall/seat selection, currency-aware prices, validation, and order confirmation state.
- Travel Guide now has a bilingual catalog, categories, search, compact responsive cards, Favorites, guide detail routes, itinerary stops, maps/directions links, metrics, related content, and discovery rows.
- Search now has a bilingual aggregated search page across Travel Plans, Guides, Blogs, and Popular listings with category filters, clearable query input, result counts, empty state, and shared Favorites cards.
- Account Dashboard and Notifications pages are implemented with bookings, custom plans, Favorites, reviews, messages, settings, support/legal, recent activity, read/unread notification filters, and logout behavior.

### Favorites and shared interactions

- Favorites persist in localStorage through a shared provider and are used by Home, Travel Plans, Nearby, Blogs, Travel Guide, related listings, Restaurant, Book Shop, and detail cards.
- The `/favorites` page has an All tab and grouped tabs for Blogs, Travel Plans, Guides, Hotels, Restaurants, Book Shops, Rentals, Transport, Cafes, Markets, and Attractions, with live item counts and bilingual labels.
- Unsave removes a card immediately from the active list and updates category/All counts. Saving a card from another page or browser tab synchronizes into an open Favorites page through same-tab and browser storage events.

### Authentication and Super Admin

- Traveler Login and Signup are separate routes. Signup supports username, display name, email, password, confirmation, and branded Google/Facebook entry points; Login accepts username or email plus password.
- Traveler logout clears session/local state and returns to Login. Traveler access and Super Admin access are kept separate.
- `/admin/login` is a standalone protected entry point and `/super-admin` is a role-protected dashboard with metrics, users, content/listings, bookings, settings, activity, Ads Management, Shop Owner creation, Admin Management, language toggle, dark/light toggle, and visible logout. The separate `/shop-owner` frontend dashboard route is also implemented for Owner Admin preview.
- Supabase session hydration, auth-state listening, email signup/login, sign-out, OAuth calls, profile-role checks, and signup metadata wiring exist in the frontend.

### Supabase/backend work already applied

- `public.profiles` exists with Auth-user linkage, username uniqueness, display name, role, avatar URL, timestamps, RLS, own-profile policies, and Super Admin management policies.
- Signup profile trigger, username derivation, role checks, and Super Admin role-management protections were applied through migrations.
- The repository keeps backend handoff notes and does not store OAuth secrets or raw SQL in the Plan notes.

### Verified delivery

- Recent feature work has been committed and pushed to GitHub `main`, including categorized Favorites, real-time Favorites synchronization, Ticketing completion, Travel Guide completion, and Search completion.
- TypeScript typecheck, Vite production builds, and whitespace checks have passed for the latest feature work. The existing `caniuse-lite` freshness message is a non-blocking warning.

### Not yet production-complete

- Favorites, bookings, custom-plan requests, notifications, reviews, views, and Ticketing inventory/seat locking still need real user-scoped Supabase tables, RLS, or provider APIs.
- Ticketing availability, payment, final booking persistence, and live seat locking are still preview/handoff behavior.
- Google and Facebook OAuth provider credentials and callback configuration still need to be completed in the Supabase Dashboard.
- Username-to-auth identity lookup/login and real traveler/Super Admin account provisioning still need production verification.
- Admin-managed content, rental ads, owner/admin account provisioning, audit-log persistence, payouts, and the broader Owner/Admin business model still need backend/API integration. Their frontend dashboard workflows and preview states are implemented and documented in the 2026-11-10 dashboard work record below.

### Code-level audit record (2026-11-09)

The following findings were checked against the source files, not inferred from screenshots or earlier notes.

#### Runtime and route verification

- `src/App.tsx` is the authoritative route table. It currently declares the Home, Cities, Nearby, Rentals, Restaurants (including `:id`), Book Shops (including `:id`), Ticketing, Travel Plans (including `:planId` details), Travel Guide (including `:guideId`), Blogs, Search, Account, Login, Signup, Admin Login, Super Admin, Shop Owner, Notifications, Account Notifications, and Favorites routes, plus a wildcard Not Found page.
- `public/manus-routes.json` lists the concrete routes except the legacy redirect `/blogs/:storyId` (25 of 26 on 2026-11-20, `Doc/PLAN-VS-CODE.md` §3.3). It intentionally does not describe the wildcard route. Either add `/blogs/:storyId` to it or record that redirect paths are intentionally omitted.
- City cards now resolve through `/cities/:cityId`; the remaining undeclared catalog paths include `/attractions/:id`, `/hotels`, `/hotels/:id`, `/cafes/:id`, `/markets/:id`, `/rentals/:id`, `/ticketing/:id`, and legacy `/travel-plans/:id` links. Static links to those remaining paths fall through to the Not Found page.
- `src/features/blogs/BlogsPage.tsx` uses the implemented query-string reader format `/blogs?story=<slug>`. Legacy `/blogs/<id>` hrefs still in `CardListing` data work: `src/App.tsx` registers `/blogs/:storyId` and `LegacyBlogRedirect` forwards it to `/blogs?story=<id>`.
- Restaurant and Book Shop dynamic URLs currently render the same static page regardless of the `:id`; they do not select records by route parameter. The same limitation applies to the static detail content shown by those pages.

#### Persistence and backend boundary

- The app contains no `supabase/` migration directory or SQL source. The profile migration and RLS status are recorded in the backend/auth section of `Plan/PROJECT-PLAN.md` as work applied directly to the connected Supabase project; they are not independently reproducible from this checkout.
- Application Supabase/API calls in source are limited to `src/lib/auth.tsx` (optional Auth/session and `public.profiles` lookup), `src/lib/mainOwnerApi.ts` (branch-account work) and `src/lib/blogMediaApi.ts` (fetch to the R2 upload endpoint). Catalogs, bookings, custom-plan requests, notifications, reviews, views, Favorites, Ticketing inventory, payments, and admin metrics do not call Supabase or another application API.
- Home, City, Nearby, Travel Plan, Blog, Restaurant, Book Shop, Rental, Travel Guide, and Ticketing records are compiled TypeScript data or page-local arrays. Search deliberately searches only the imported Travel Plans, Travel Guides, Blogs, and Popular arrays.
- Favorites are shared and synchronized, but only through the browser `localStorage` key `mh-travel-favorite-overrides` and same-tab/storage events in `src/lib/favorites.tsx`. They are not user-scoped and remain after logout or when another local user uses the same browser.
- Custom Plan submission, Rental submission, and Ticketing order confirmation change local React state only. They do not create request IDs, persist payloads, notify MH Travel, reserve inventory, lock seats, take payment, or send contact requests.
- Blog views use local storage and seeded metrics. Blog geolocation permission gates display behavior, but the code does not calculate a distance from the user to each article; displayed distances are seeded data.
- Currency uses a persisted MMK/USD choice with a hard-coded `MMK_PER_USD = 4500` in `src/lib/currency.tsx`; there is no Admin-managed exchange-rate read/write path.

#### Auth and admin verification

- `src/lib/auth.tsx` is hybrid: configured Supabase environments use Auth session hydration, email/password auth, OAuth initiation, profile lookup, role checks, and sign-out; unconfigured environments use a localStorage preview store.
- The local preview store keeps demo users and plaintext passwords in localStorage and contains a frontend demo Super Admin credential. This path is not production authentication.
- Configured Supabase login supports an email identifier; username-only login still falls back to local preview lookup. Secure username-to-email resolution is not implemented.
- `/super-admin` is client-side role guarded. `/admin/login` is a public login form in a standalone layout, not itself a protected route. The Super Admin dashboard metrics and management sections are frontend preview/local state and are not wired to management APIs yet.
- The frontend role type now includes `traveler | super_admin | owner_admin`; scoped platform-admin roles documented by the backend handoff are still not separately authorized in the UI. `/shop-owner` uses a local `owner_admin` guard until production Supabase authorization is connected.
- Google and Facebook buttons call `signInWithOAuth` only when Supabase is configured. Provider credentials, callback configuration, OAuth username completion, and production verification remain external setup work.

#### Verified source-level issues to keep in the backlog

- Home, Blog, Nearby, ad, and static catalog links still point to several routes that are not declared, especially `/hotels`, `/markets`, `/cafes`, `/attractions`, and `/travel-plans/:id` (legacy `/blogs/:id` now redirects to the Blog reader); the full count is 48 broken links, listed in `Doc/STATUS.md` §5. City card links now resolve to the implemented `/cities/:cityId` detail route.
- The Restaurant menu category selector changes state but the displayed dish list is not filtered by category. The Book Shop category selector similarly changes state without filtering the displayed books.
- Restaurant and Book Shop directions, call, map, view-all, and related CTA controls are mostly visual buttons without navigation or external-action handlers.
- Account, Notifications, and Super Admin screens render useful UI sections, but their visible bookings, messages, reviews, activity, metrics, and notification data are sample/frontend state until backend data sources are connected.
- No automated test runner is defined in `package.json`. The repository has typecheck, build, and lint evidence, but no automated behavioral test evidence. The latest lint audit passed with warnings only; the existing Browserslist and bundle-size warnings are non-blocking.

---

## 3. Roles

Super Admin, Ads Admin, Admin, Rental Admin, Payment Admin,
Travel Guide Content Admin, Blog Post Admin, Owner Admin.

- Traveler (user) accounts are completely separate from every Admin, Owner
  Admin and Content Admin account. No merging. A person who is both a
  traveler and a business owner needs a distinct Owner Admin account,
  created by an Admin.
- Only Super Admin and Ads Admin manage ad content. Super Admin creates the
  other admin accounts.
- Role names (decided 2026-11-22): the names above are the product roles. The
  Admin Management form must offer these names, not its earlier choices.
  Mapping from the earlier form choices: Content Manager → Blog Post Admin
  and Travel Guide Content Admin (two roles, one per content type); Support
  Manager → Admin; Operations Admin → Admin, or Rental Admin for rentals;
  Finance Admin → Payment Admin; Ads Manager → Ads Admin. Permission groups
  stay as the way to scope each role.
- Admin workspace (decided 2026-11-22): Blog Post Admin and Travel Guide
  Content Admin already reach only their own editor
  (`src/lib/contentAdminAccess.ts`). Still to build, in one role-guarded
  workspace that reuses the Super Admin panels: Rentals for Rental Admin, Ads
  for Ads Admin, earnings and payouts for Payment Admin, users and support for
  Admin, and bookings for Owner Admin. Super Admin keeps all sections. Route
  guards only hide menus; the server must check the role on every write
  (sections 8, 10 and 16A; the permission matrix is in section 16B.1).

---

## 4. Design System Rules

- Every listing/content card (Travel Plans, Travel Guide, Blogs, Populars,
  Nearby results, City cards, business listings) always shows all four:
  rating, distance, favorite state, views. No exceptions. This is enforced
  by making them required fields on the shared `CardListing` type.

### Card sizes — exactly five, no others

There are only **five** Box Card sizes in the whole application. No page may
introduce a sixth size, a page-local card dimension, or an oversized variant.
The five sizes are defined once in the shared card components and every page
selects one of them; a page never overrides the internal dimensions itself.

| Size | Use | Max width | Image height | Title | Body padding | Price / meta |
|---|---|---|---|---|---|---|
| `xs` | Densest rows: Populars, City "top attractions" strip | 150px | 32px | 9px | 4px | 9px |
| `sm` | Dense rows: Home Blogs row, single-row strips on Blogs, Travel Guide and City pages | 190px | 40px | 10px | 6px | 10px |
| `md` | Default for every grid row: Hotels, Book Shops, Rentals, Transport, Markets, Restaurants, Cafes, Nearby results, City and Search results | 240px | 52px phone / 56px web | 11px / 12px | 8px | 10px |
| `lg` | Emphasised rows: Travel Plans, Home Travel Guide | 300px | 60px phone / 64px web | 12px / 13px | 8px | 11px |
| `xl` | Widest single row: Home Travel Plans, City Travel Guide (3-column rows only) | 340px | 68px phone / 72px web | 13px / 14px | 10px | 11px |

- `md` is the default. `sm` and `xs` are for dense or secondary rows, `lg` for
  a primary discovery row, and `xl` only for a three-column row where the card
  is wide enough to carry a slightly larger image.
- Even `xl` stays compact: it is a slightly larger card, not a hero panel.
  No card may exceed the `xl` values above, and no size may be applied outside
  this table.
- A row picks its size from its role in the table above, with two limits from
  its column count: four column rows use `lg` at most, and only three column
  rows may use `xl`. Five column rows of primary listings (Hotels,
  Restaurants, Book Shops, Rentals, Transport, Markets, Cafes and Attractions
  on Home and City) use `md`; six column Populars use `xs`; City's Top
  attractions strip stays `xs`. Decided 2026-11-22, resolving
  `Doc/PLAN-VS-CODE.md` §4.1: the Plan now matches the code and no row needs
  to change. `xs` readability on phones stays on the UI backlog.
- A card has a hard maximum width, given by its size (`maxWidth` in
  `CARD_SIZES`). A card must never stretch to fill a wide container: no card
  may render as a long bar. The maximum for `xs`/`sm`/`md`/`lg`/`xl` is
  150/190/240/300/340px, and no page may exceed the value for its size.
- Row width is `columns × the size's max width + gaps`, so a row of `columns`
  cards fills its width exactly and a card sits at its size's maximum. A row
  with fewer items than its column count leaves the unused space at the end;
  pick the column count so the row is filled.
- Column counts rise on wide screens rather than letting cards grow: five or
  six column rows stay five or six, and three column rows become four at
  `xl` (Nearby results, Travel Guide grid). A row must never be widened by
  stretching its cards.
- Horizontal single-row strips keep a fixed card width and scroll sideways on
  phones.
- Load More (decided 2026-11-22): the page size is 12, which divides evenly
  into two, three, four and six columns, so a revealed batch always fills its
  rows. The button appears only while matching items remain beyond those
  shown, and it reveals a whole batch. Blogs and Travel Guide share one helper
  instead of the two separate implementations they have now.
- A grid that hosts cards directly (Search, City, Favorites, Account,
  Blogs-related, Travel Plans) repeats the same cap: `justify-items-center`
  plus `max-w-[columns × the size's max width + gaps]`, so no page can
  reintroduce a stretching card. Phones always show two cards per row.
- The same five sizes apply to the Nearby place card (`variant` accepts
  `xs`, `sm`, `md`, `lg`, `xl`); it keeps a square thumbnail on phones and
  uses the matching image height from `md` upward.
- The card size table lives in `src/components/ui/ListingCard.tsx`
  (`CARD_SIZES`, including `maxWidth`) and
  `src/features/nearby/NearbyPlaceCard.tsx` (`CARD_SIZES`). Change a size
  there, not in a page.

- Dark theme is the base, with a light theme available. Colors are defined
  as theme tokens (surfaces, text levels, brand blue for links and accents,
  brand red for CTAs and prices, status colors, ad-slot colors).
- The Home Page hero banner is an ad slot (Admin Ads or Google
  AdSense/AdMob), not static branding. If no ad is available it collapses
  to nothing. No empty placeholder boxes anywhere.
- Header nav order: Cities | Nearby | Rentals | Ticketing | Travel Plans |
  Travel Guide | Blogs.
- Header icons in order: Search, Language, Currency, Theme, Favorite,
  Notifications, Account. The header is sticky.
- Search expands inline inside the header; it does not navigate on open.
- Notifications are a YouTube-style dropdown: bell with unread badge, panel
  with thumbnail/title/timestamp, mark-all-read, opening an item marks it
  read and navigates, "See all" link, closes on outside click.
- Mobile/tablet: a hamburger menu opens a partial-width sidebar drawer, so
  a strip of the page stays visible on the right with a divider line (not a
  full opaque overlay). On every route the phone drawer holds the MH Travel
  tagline; complete Legal, Help and Support, Navigate, and Content/contact
  sections; Myanmar and international payment options; App Store/Google Play;
  Favorites, language/currency/theme controls, and copyright. The Navigate
  list includes Cities, Nearby, Rentals, Ticketing, Travel Plans, Travel
  Guide, and the existing Blogs shortcut. The drawer remains scrollable and
  ends with the copyright line. Its panel and backdrop stop above the fixed
  bottom navigation so all five tabs remain visible and clickable while the
  sidebar is open; selecting a tab closes the sidebar.
- The implemented drawer order is now Navigate, Favorites plus
  language/currency/theme controls, Help & Support, Content/contact, Myanmar
  payments, app downloads, international payments, Legal, and copyright. The
  Account Dashboard or Login / Registration destination appears only in the
  fixed bottom navigation, not in the drawer. Notifications stay in the phone
  header and are not duplicated in the drawer. The duplicate MH Travel tagline
  block was removed because the fixed phone header already provides the brand
  identity.
- Phone views keep a fixed bottom navigation visible on every public page,
  including Blog reading, with exactly Home, Nearby, Ticketing, Travel Plans,
  and User Account. The phone drawer may also contain Nearby, Ticketing, and
  Travel Plans under its requested Navigate section, but Home and User Account
  remain only in the bottom bar. Content reserves bottom safe-area space so the
  bar does not cover reading text.
- On desktop the Home Page alone renders the full shared footer, including its
  copyright row. Every other page renders only the copyright line at the
  bottom. On phones, the page-flow footer is hidden and copyright is placed at
  the bottom of the mobile drawer.
- Category-based template system: all pages of the same category share an
  identical design, while different categories can look completely
  different from each other.
- Load More rule: the page size is 12, which divides evenly into two, three,
  four and six columns, so every revealed batch fills its rows. The button
  appears only while matching items remain beyond those shown, and the last
  batch is clamped to the records that exist. The implementation is
  `src/lib/usePagedList.ts`; any new paged list uses it rather than a
  hard-coded page size.
- Header breakpoint rule: the desktop navigation appears at `lg`, not `md`,
  because the nav plus the search, language, currency, theme, Favorites,
  notification, and account controls do not fit at 768–1023px. Verified with no
  horizontal overflow from 360px to 1280px.

### Shop Owner Web UI/UX template marketplace

- Every Shop Owner receives one default Shop Page Web UI/UX template at no
  additional cost. The free template is the baseline experience and remains
  available even when an Owner does not subscribe to a paid template.
- MH Travel will provide multiple alternative Shop Page templates with
  materially different layouts, visual systems, navigation patterns, hero
  treatments, menus/catalog presentation, booking CTAs, galleries, and mobile
  experiences. Templates are presentation layers only: the Shop Owner's
  business profile, menu/products, photos, services, prices, reviews, and
  booking data must remain reusable when switching templates.
- An Owner may preview available templates before applying one. Switching
  from the included free template to an alternative template requires a
  monthly subscription of **2,000 MMK per Shop Owner shop**. The subscription
  grants access to one selected paid template at a time; changing to another
  paid template keeps the same monthly entitlement and does not duplicate
  shop content.
- Owners may switch back to the free template at any time. If a paid
  subscription is cancelled, expires, or remains unpaid after the defined
  grace period, the Shop Page falls back to the free template without deleting
  the Owner's content or booking data.
- The template selector must show Free/Paid status, the 2,000 MMK monthly
  price, active template, preview, apply/switch, renewal, cancellation, and
  subscription status. It must clearly distinguish Shop Page appearance
  changes from business-data changes.
- Platform Admin controls the template catalog, availability, versioning,
  screenshots/previews, compatibility by business category, pricing, and
  retirement/rollback. A retired template must not break Shops already using
  it; affected Owners need a migration notice and a safe replacement path.
- Production implementation requires Shop Owner template entitlements,
  subscription/invoice/payment records, renewal and grace-period states,
  template version records, preview/apply audit events, and RLS so an Owner
  can change only their own Shop Page. The UI/UX work is planned separately
  from the existing Shop Owner dashboard and does not change the standard
  `/shop-owner` management workspace.
- Status (2026-11-21): design and build of the templates are deferred to a
  later stage; this section records that the system will exist. Founder's
  expectation: a hotel page gets about 10 designs plus one MH Travel default,
  with genuinely different UI/UX rather than recolors. The open points
  (categories first, price, grace period) are decided in the specification
  below.
- **Specification (2026-11-22).** The build is deferred, but the system is defined so nothing built before it has to change.

  **Contract.** Every Shop Page template receives the same typed data (`ShopPageData`): business profile (name MM/EN, description, address, coordinates, open and close times, check-in and check-out for hotels), photos, catalog (rooms, menu items or products with prices under the owner's price-display mode), reviews, contact and booking CTA, and the booking-flow mode. A template only decides how that data is laid out. Switching templates never touches business data.

  **Registry and code.** Each template is a lazy module (`src/templates/<category>/<template-id>`) plus a row in `shop_templates`. Adding a template is a new module and a new row, with no change to the Shop Page route.

  **Tables:** `shop_templates` (`id`, `category`, `name_mm`, `name_en`, `version`, `status` draft / active / retired, `preview_image_key`, `price_mmk_month` default 2,000, `is_free`), `shop_page_settings` (`shop_id`, `active_template_id`, `applied_at`), `shop_template_entitlements` (`shop_id`, `template_id`, `status` active / grace / expired / cancelled, `period_start`, `period_end`, `grace_until`), `template_invoices` (`id`, `shop_id`, `template_id`, `amount_mmk`, `period_start`, `period_end`, `status`, `paid_at`, `recorded_by`).

  **Rules (decided).**
  - Price: 2,000 MMK per shop per month for every category.
  - Grace period: 7 days after `period_end`, then the Shop Page falls back to the free template; content and bookings are untouched, and the entitlement becomes `expired`.
  - Renewal reminders go to the owner 7, 3 and 1 days before `period_end`.
  - Preview: an owner can preview any template on their own real data (`?preview=<template-id>`, visible only to that owner); applying a paid template needs an active entitlement.
  - Payment in this phase is recorded by Admin or Payment Admin when received (an invoice row and an entitlement extension); an online gateway comes later.
  - Retirement: owners using the template get 30 days of notice; at the end they move to the free template or a replacement they choose. A retired template never breaks a shop.
  - Rollback: Admin can mark a template version `draft` again; shops on it fall back to the previous version.
  - Access: an owner changes only their own Shop Page; Super Admin manages the catalog; Payment Admin records payments.

  **"Genuinely different" test.** Before a template is set `active` it must differ from every other template of its category in at least four of: layout skeleton, navigation pattern, hero treatment, catalog presentation, booking-CTA placement, gallery type, mobile pattern. The founder reviews it first. A recolor fails.

  **Order and count (decided).** Hotel first, since it has the most data. Launch with the free default plus 3 paid designs, then grow toward about 10 for hotels, then Restaurant and the other categories.

  **Each template must pass:** renders the fixture shop with every section (hero, catalog, gallery, reviews, contact, booking CTA) at phone and desktop widths, in both languages and both themes, with no horizontal overflow and no axe violation except the known contrast pair.

  **Owner screen:** Free or Paid label, the 2,000 MMK price, active template, preview, apply or switch, renewal, cancellation and status, separate from business-data editing.

---

## 5. Home Page

Sections in order: header, hero ad slot, Categories, Travel Plans, ad,
Travel Guide, Blogs, ad, Populars, Reviews, ad, Awards, Partners, ad, full
footer.

- Categories is an infinite auto-scrolling marquee (seamless loop, pauses
  on hover), not a manual swipe strip.
- Ad slots sit at natural break points between sections.
- Favorite hearts on cards actually toggle (client-side for now, to be
  backed by Supabase later).
- Before the Home-only full footer/copyright, place the final discovery rows
  in this order: Top Attractions, Restaurants, Cafes. Reuse the existing
  Home listing data and favorite state, move the existing sections rather
  than duplicate them, and keep each row horizontal on phones with swipe
  scrolling and five cards across on wide screens.
- Prices on cards are stored as a USD base value and formatted live by the
  selected currency.
- All visible text goes through the translation system (EN/MM), including
  the full footer.

---

## 6. Booking Flow

A universal setting, chosen by each Owner, across all categories (Hotel,
Restaurant, Rental, Ticketing and so on):

- Full Manual: request, then Owner accepts, then payment window opens, then
  Owner confirms payment received, then voucher or ticket is issued.
- Instant: select, pay, and the voucher or ticket is issued immediately;
  the Owner just sees the record.

Common rules:

- In Full Manual mode, if payment is not completed within 12 hours of
  acceptance the booking auto-cancels.
- Users cannot cancel. After full payment they can only reschedule the date.
- Booking voucher has 17 fields (booking ID, business name and address,
  dates, guest name, amount paid, QR code, contact, room or item type,
  guests, nights, payment method, booking date, status, special requests,
  owner name, cancellation policy, branding).
- MH Travel does not mediate disputes between a user and an Owner. It
  investigates and removes violating Owners.
- Hotel detail uses progressive disclosure: the hero shows only
  "From $X/night + Book Now"; tapping reveals the date and guest form, then
  the price breakdown, then confirm.

---

## 7. Ticketing, Bus and Related Products

- Bus means local city public transit (for example Yangon YBS). It is
  static route and stop reference data with no seat booking, separate from
  Express Bus.
- A multi-leg Bus Route Planner is planned: walk to nearest stop, ride,
  transfer, walk to destination, using Admin-entered stop coordinates and
  line data. The Bus option only appears on a listing if that Owner has
  enabled it.
- Ticketing (Express Bus, Ferry, Airline, Cinema, Events) is MH Travel's
  own separate product with its own web app, integrated through an API
  rather than duplicated in the main database. Train is a future phase.
- MH Ride (taxi and motorbike) and the YBS system are also separate own
  products, integrated through APIs.
- Plan: a Central Identity Service so one MH Travel account works across MH
  Travel, MH Ride, YBS and Ticketing. Identity data syncs; business data
  stays local to each product.
- Ticket booking starts either from an operator's own profile page or from
  the central Ticketing hub (route and date search across operators). Both
  lead to the same seat-selection and purchase flow.
- Seat map status is queried live when the booking flow opens, never
  pre-cached.
- User-provided UI reference: [MH Travel Ticketing Experience.png](https://drive.google.com/file/d/1e1ZsDTFRMX65GZOPAx9AGAfnHnhGomnz/view?usp=sharing).
  It shows a dark navy/cyan ticket hub, an airplane-and-Shwedagon hero with
  search CTA, primary Flights / Hotels / Car Rentals / Bus Tickets tabs, a
  route/date/return/passenger search form, Popular Routes cards, and Best Deals
  rows with operator, departure/arrival, duration, fare, and Book Now. On phones,
  keep the hero compact, stack the booking fields, allow route cards to swipe
  horizontally, and retain the project's fixed five-tab navigation. The global
  rule still reserves the full footer for Home and shows copyright elsewhere.
- User correction (2026-11-08) supersedes the reference's Hotels / Car Rentals
  tabs: the Ticketing hub is for tickets only, with five primary products—Flight
  Tickets, Bus Tickets, Event Tickets, Cinema Tickets, and Train Tickets. Do not
  show hotels or vehicle rentals in Ticketing; vehicle rental remains on the
  separate `/rentals` page. Bus Tickets means coach/express bus tickets, not the
  local YBS route-reference product. Keep ticket-specific search and purchase
  flows; train provider integration may remain separate from the current mock UI.

---

## 8. Rental

- Owned and operated by MH Travel itself, managed by Rental Admin (not
  third-party Owner Admins).
- Categories are dynamic and manageable by Admin and Super Admin. The current
  list, with cars, boats and bicycles as variants, is in the Rental system
  specification below.
- Daily-rate pricing. Terms must be accepted before booking.
- Full-day car rental requires a driver. This rule is configurable per
  category (for example motorbike and bicycle stay self-drive).
- Long-distance rentals are priced by round-trip day count (daily rate
  times total days including the return leg), not by distance.
- Travel guide hire: the user covers the guide's actual accommodation, food
  and travel costs on top of the daily rate. Exact mechanics to be
  finalized later.

### Rental: system specification (2026-11-22)

Verified against `src/features/rentals/RentalsPage.tsx`, `src/types/index.ts` and `Doc/STATUS.md` (main @ `74b80fa`). Rental is owned and operated by MH Travel, so there is no Owner commission and no Owner subscription on it. It follows the universal **Full Manual** flow of section 6: request → MH Travel accepts → a 12-hour payment window → MH Travel confirms payment → voucher → completed. Payment is recorded by staff (cash at pickup, bank transfer or mobile wallet); there is no online gateway in this phase.

#### 1. As built (PREVIEW, local state)

- **11 categories:** bicycle, e-bike, motorbike, scooter, tricycle (သုံးဘီး), car (with driver), self-drive car, horse carriage, camping tent (ရွက်ဖျင်တဲ), motorboat, travel guide. The catalog shows one card per category (records `pre1` to `pre11`), not one per vehicle.
- **City availability (one MH Travel branch per city):**

| City | Categories offered |
|---|---|
| Yangon | bicycle, e-bike, motorbike, scooter, tricycle, car, self-drive car, travel guide |
| Bagan | bicycle, e-bike, motorbike, scooter, car, self-drive car, horse carriage, camping tent, travel guide |
| Mandalay | bicycle, e-bike, motorbike, scooter, tricycle, car, self-drive car, travel guide |
| Inle Lake | bicycle, e-bike, motorbike, motorboat, camping tent, travel guide |
| Ngapali | bicycle, e-bike, motorbike, scooter, motorboat, camping tent |

- **Sample rates in code** (USD per day, local / foreigner; sample values, not confirmed prices): bicycle 8 / 10, e-bike 12 / 15, motorbike 18 / 22, scooter 10 / 13, tricycle 14 / 18, car with driver 42 / 55, self-drive car 32 / 42, horse carriage 28 / 34, camping tent 12 / 15, motorboat 55 / 68, travel guide 35 / 45. Car types: family car (4–5 seats) 42 / 55, 35-seat minibus 180 / 225, 45-seat bus 240 / 295.
- **Order form:** city, category, car type (car only), start and end date, participants, customer type (citizen / foreigner), delivery or branch pickup, delivery address or branch, phone, terms checkbox. Car and self-drive car need an end date at least start + 1. Total = rate × inclusive days, in USD base, shown in MMK or USD by the display currency toggle. The page asks for booking at least 1 day ahead.
- **Submission:** sets a local `submitted` flag. Nothing is recorded: no order row, no request code, no notification, no voucher. The form has no guest name and no special-requests field, both of which the section 6 voucher needs.

#### 2. Decisions on the open conflicts (decided 2026-11-22)

| Question | Decision |
|---|---|
| Yangon motorbike | Remove **motorbike and scooter** from Yangon (the founder says Yangon has no motorbike rental, and a scooter is a motorbike). E-bike and tricycle stay. Tents are already absent. |
| Self-drive car | **Retire** the self-drive category (set inactive, keep history). A car is always booked with a driver (`driver_required = true`). |
| "Express" and "အာတာဖတ်" vehicles | Car vehicle types are **data**. Rental Admin adds them with seats, rules and rates when defined; nothing is hard-coded. Seed only the three existing types. |
| Bicycle types | Data too. Seed one "Standard bicycle" so the flow works; Rental Admin adds the rest. |
| Boats | One **Boat** category; "Motorboat" is its seeded variant; others are added as variants. |
| E-bike, tricycle | Same data model, no special flow. |
| Price | One rate per city × category × variant, with the category rate as the default. |
| Guests | A traveler must **sign in** to submit, so the order appears in Account → My Bookings. |

#### 3. Data model (Supabase)

| Table | Key columns | Notes |
|---|---|---|
| `rental_categories` | `id` (slug), `name_mm`, `name_en`, `detail_mm`, `detail_en`, `flow` (`simple` / `driver_vehicle`), `driver_required`, `min_days`, `image_key`, `active`, `sort_order` | 11 rows seeded from `RentalCategory`; `self_drive_car` seeded inactive |
| `rental_variants` | `id`, `category_id`, `name_mm`, `name_en`, `seats` (nullable), `rules_mm`, `rules_en`, `active`, `sort_order` | Car types, bicycle types, boat types |
| `rental_cities` | `id`, `name_mm`, `name_en`, `active` | Five cities today |
| `rental_branches` | `id`, `city_id`, `name_mm`, `name_en`, `address`, `phone`, `active` | One per city today |
| `rental_availability` | primary key (`city_id`, `category_id`), `active` | The city × category matrix |
| `rental_rates` | `id`, `category_id`, `variant_id` (nullable), `city_id` (nullable = default), `rate_local_usd`, `rate_foreign_usd`, `effective_from`, `effective_to` | `numeric(10,2)`; ranges for one key never overlap |
| `rental_terms` | `version` (primary key), `body_mm`, `body_en`, `published_at`, `published_by` | Each order stores the version accepted; it is also the cancellation policy on the voucher |
| `rental_orders` | `id`, `request_code` (unique), `user_id`, `customer_name`, `phone`, `city_id`, `category_id`, `variant_id`, `start_date`, `end_date`, `original_start_date`, `days`, `participants`, `customer_type`, `fulfillment`, `branch_id`, `delivery_address`, `special_requests`, `terms_version`, `rate_usd`, `total_usd`, `display_currency`, `fx_mmk_per_usd`, `status`, `accepted_at`, `payment_deadline`, `payment_method`, `payment_received_at`, `received_by`, `voucher_version`, `rescheduled_count`, `handled_by`, `admin_note`, `created_at`, `updated_at` | Rate, total and deadline are set by the server |
| `rental_order_events` | `id`, `order_id`, `from_status`, `to_status`, `actor_id`, `note`, `at` | Append-only timeline |
| `rental_order_extras` | `id`, `order_id`, `description`, `amount_usd`, `added_by`, `at` | Travel guide expenses and other after-rental charges |
| `my_bookings` (view) | union of `bookings` and `rental_orders` for one user | Account → My Bookings reads this view |

**Access (RLS).** Catalog tables: everyone reads active rows; Rental Admin and Super Admin write. Orders: a traveler reads their own and creates one only through `submit_rental_order`; Rental Admin, Admin and Super Admin read all; Payment Admin reads totals and payment fields; status changes only through `set_rental_order_status`. Roles come from `public.profiles` and are checked on the server; client role helpers only hide menus.

#### 4. Pricing

1. Find the rate row, most specific first: city + category + variant, then city + category, then default (no city) + category + variant, then default + category.
2. Pick the local or foreigner column by customer type.
3. Total = rate × inclusive days (end − start + 1). Keep USD to 2 decimals.
4. Snapshot `rate_usd`, `total_usd`, `display_currency` and the exchange rate on the order, so later changes never alter an old order. MMK display rounds to the nearest 100 (section 16B).
5. Travel guide hire: the guide's accommodation, food and travel costs are paid on top of the daily rate (section 8); the voucher states this in its notes line.

#### 5. Order lifecycle (matches section 6)

| Status | Set by | Next |
|---|---|---|
| Requested | the traveler's submit | Accepted, Cancelled |
| Accepted | Rental Admin, Admin, Super Admin. Opens the payment window: `payment_deadline = accepted_at + 12 hours` | Paid, Expired, Cancelled |
| Paid | the same staff, after recording the payment (method, amount, time). The voucher is issued automatically | Completed, Cancelled |
| Completed | the same staff, after the rental period | none |
| Expired | the system, when the window passes unpaid | none |
| Cancelled | staff only, with a reason. **Travelers cannot cancel** (section 6) | none |

- **Reschedule.** After payment the traveler may change the date once (`rescheduled_count` < 1), at least 24 hours before the original start, to a start date of at least tomorrow, keeping the same number of days. The server re-checks that the category is still offered in the city, writes an event, issues voucher version 2, and notifies Rental Admin.
- Every change writes a `rental_order_events` row and an admin audit-log row. An order still Requested after a threshold in settings (default 2 hours) is highlighted for staff.

#### 6. Voucher (the 17 fields of section 6)

Shown at `/account/bookings/<request_code>` as a printable page with a QR code that encodes the request code; staff open the same page to print it.

| Voucher field | Rental source |
|---|---|
| Booking ID, QR | `request_code` |
| Business name and address | "MH Travel Rental" and the branch name and address |
| Dates, nights | start–end, days |
| Guest name, contact | `customer_name`, phone, and the branch phone |
| Item type | category and variant ("with driver" for cars) |
| Guests | participants |
| Amount paid, payment method | total in the order currency and USD; `payment_method` |
| Booking date, status | `created_at`, current status |
| Special requests | `special_requests` |
| Owner name | MH Travel |
| Cancellation policy | the terms version accepted |
| Branding | MH Travel logo and colors |

#### 7. Server rules (the server is the authority; the client rules mirror them)

- The category must be active in the chosen city; the variant must belong to the category; a branch must belong to the city.
- Start date at least tomorrow in Myanmar Time; end date not before start; for categories with `min_days` 2 (car), end at least start + 1.
- Participants at least 1; `customer_name` at least 2 characters; phone at least 7 characters, tightened to digits with an optional leading `+`; delivery address at least 3 characters when delivering; a branch when picking up.
- `terms_version` must be the current published version. The client's total is ignored; the server recomputes it. Rate-limit submissions per account.
- Errors return stable codes that the page translates through `t()` (MM/EN), as the content editors do.

#### 8. Rental Admin dashboard

| Section | What it does |
|---|---|
| Orders | List with filters (status, city, category, date range) and search by request code, name or phone. Detail with timeline, a Call button (`tel:`), and the actions Accept, Record payment, Complete, Cancel (reason), plus an internal note. Shows the payment countdown for Accepted orders. |
| Catalog | Categories and variants: names (MM/EN), images, flow, driver required, minimum days, active. |
| Availability | The city × category matrix with on/off toggles. Turning a cell off hides it and keeps old orders. |
| Rates | Rate table by city × category × variant, local and foreigner, with effective dates and history. |
| Branches | Per-city branch name, address, phone. |
| Terms | Publish a new MM/EN terms version. |
| Settings | Highlight threshold; minimum notice days (default 1). |

Every write goes to the audit log. Roles: Rental Admin and Super Admin edit; Admin reads and handles orders; Payment Admin reads totals and records payments.

#### 9. Notifications, jobs and reports

- **Notifications** (section 16B): Requested → Rental Admin; Accepted (with the payment deadline), Paid (voucher ready), Expired, Cancelled → traveler; Rescheduled → Rental Admin.
- **Job:** every 5 minutes, set Accepted orders past `payment_deadline` to Expired (safe to run twice).
- **Reports:** orders by status, city, category and day (Myanmar Time); share of Requested orders reaching Paid; median time from Requested to Accepted; value of Paid and Completed orders (USD and MMK at the order's snapshot); CSV export.

#### 10. Not in this phase

Online payment and deposits, ID or licence checks, per-date stock, driver assignment, delivery tracking, multi-item orders. Rental reviews come after Completed, in the reviews work of Phase 2 (section 16D).

#### 11. Build steps (for Cursor)

1. Migrations for the catalog tables and orders, with RLS, committed under `supabase/migrations`. 2. Seed them from `RentalsPage.tsx` and apply the section 2 decisions. 3. Make the page read catalog, availability and rates from Supabase instead of constants; add name and special-requests fields. 4. `submit_rental_order` and the confirmation with the request code. 5. My Bookings view and the voucher page. 6. Rental Admin Orders with the status actions and the expiry job. 7. Rental Admin Catalog, Availability, Rates, Branches and Terms. 8. Notifications. 9. Reschedule. 10. Reports.

#### 12. Acceptance criteria

1. Submitting creates exactly one order with a `RNT-YYMMDD-####` code and shows the code.
2. A tampered client total is ignored.
3. A category not offered in the chosen city is rejected; Yangon no longer offers motorbike or scooter.
4. A car order with end before start + 1, or a start before tomorrow (Myanmar Time), is rejected.
5. A traveler sees only their own orders and cannot cancel; Rental Admin sees all.
6. Accept sets a 12-hour deadline; an unpaid order becomes Expired by itself; recording payment issues the voucher.
7. Each status change writes a timeline event, an audit row and the right notification.
8. Changing a rate does not change existing orders' totals.
9. Reschedule works once, at least 24 hours ahead, and issues a new voucher version.
10. Every message, including server errors, shows in Myanmar and English.

---

## 9. Owner Business Model

- Owner onboarding: field visits, no document verification. Admin creates
  Owner accounts manually. Both Admin and Owner can manage a listing; the
  Owner's edits go live immediately after the initial Admin approval.
- Subscription fee and subscription duration are fully Admin-discretion per
  Owner (free, 1,000 MMK/month, 3,000 MMK/month, any custom term).
- Expired Owners: the listing stays visible, but booking and contact are
  blocked with a message asking the user to choose another option. The
  Owner's dashboard shows only a renewal reminder until renewed.
- Commission: deducted instantly at payment time, fully Admin-discretion
  with no default or range, can differ shop by shop including 0%. The rate
  is snapshotted on each transaction for audit.
- Payouts run twice a month: Day 1 to 15 earnings are paid on the 20th, Day
  16 to month end earnings are paid on the 5th of the next month. Minimum
  50,000 MMK, carried over until met.
- Photo uploads: each Owner has an Admin-set photo quota per listing. The
  backend auto-resizes and compresses uploads. Each Owner's photos live in
  their own R2 folder.
- Price display, chosen per listing by the Owner: hidden, shown after
  payment, or public.
- Every listing has open and close times; hotels also have check-in and
  check-out times.

### Ticketing operator Main Owner and Branch Owner model

- A ticket operator such as JJ Express may have one **Main Owner** shop
  account. The Main Owner represents the operator/company and owns the
  relationship with MH Travel.
- The Main Owner can create and manage scoped **Branch Owner** accounts for
  its own stations, for example `JJ Express · Yangon Hlaing Tharyar Gate`
  and `JJ Express · Aung Mingalar Gate`. A Branch Owner account must not be
  able to see or manage another operator's data or another branch's private
  operations.
- Each Branch Owner account costs **10,000 MMK per month**, billed to the
  Main Owner/operator. The branch-account subscription is separate from the
  Shop Page UI/UX template subscription and from ticket transaction
  commissions. Creating, activating, suspending, renewing, and removing a
  branch account must have an explicit status and audit history.
- Main Owner permissions include creating/deactivating Branch Owners,
  assigning a station, viewing branch bookings and ticket sales, managing
  operator-level schedules/fares/inventory, viewing consolidated earnings,
  and reviewing branch performance. Branch Owners are limited to their
  assigned station, staff/operations, schedules, inventory, bookings, and
  branch reports.
- Ticket sales and other revenue must retain both the operator/Main Owner
  attribution and the selling Branch Owner/station attribution. Revenue
  sharing is planned as a configurable percentage or rule per operator or
  branch, with the applied percentage snapshotted on each transaction for
  audit and dispute handling.
- The wallet model has separate ledgers/views: an MH Platform wallet for MH
  fees, branch-account subscription charges, commissions, refunds, and
  settlement adjustments; a Main Owner consolidated wallet showing the
  operator's total earnings and all branch earnings; and branch-level wallet
  ledgers showing the amount attributable to each station. The Main Owner
  can see the branch wallets and consolidated balance, while a Branch Owner
  sees only its own branch wallet and permitted reports.
- The final commission percentage, branch revenue-share formula, payout
  schedule, minimum payout, refund/chargeback responsibility, wallet
  withdrawal rules, and whether a branch can receive direct settlement are
  intentionally left for the next ticketing business discussion. Until
  finalized, these values must remain Admin-configurable rather than being
  hard-coded.
- Production implementation requires a parent-child operator/branch data
  model, `main_owner` and `branch_owner` scoped roles, branch-level RLS,
  branch-account subscription records, transaction attribution, wallet
  ledgers, revenue-share snapshots, payout/adjustment records, and an
  auditable Main Owner branch-management flow.
- Frontend preview delivered at `/main-owner`: a responsive Main Owner
  control center with Overview, Branch Accounts, Wallets & Ledger, Ticket
  Sales, Revenue Share, and Operator Settings sections. The Branch Account
  modal captures station, city, address, Branch Owner, username, phone,
  fixed 10,000 MMK monthly fee, and configurable revenue-share percentage;
  newly created branches enter a Pending state in local preview data.
- The panel also previews separate MH Platform, Main Owner consolidated, and
  Branch Wallet balances, settlement/activity ledger rows, branch sales and
  share summaries, wallet activity, and a branch management table. This UI
  is preview/local-state only until the planned parent-child backend,
  billing, RLS, revenue-share, and wallet services are connected.
- Branch Account creation now has a shared API service with client-side
  validation for station/city/name lengths, username format and uniqueness,
  Myanmar phone format, address length, and 0–100% revenue share. When
  Supabase is configured it inserts into `operator_branches` with a fixed
  10,000 MMK monthly fee and Pending status; without Supabase it uses a
  local preview store so the form remains testable. API, validation, loading,
  duplicate, and server-error states are shown in the modal. The
  `operator_branches` migration and RLS policies remain required for
  production.
- Status: **frontend validation and API adapter complete**; production
  persistence, authentication, uniqueness enforcement, and authorization
  remain open backend work.

### Operator system and Ticketing integration: specification (planned, not scheduled; 2026-11-22)

This turns the founder's 2026-11-21 notes into a specification. It builds on section 7 (Ticketing is MH Travel's own product with its own web app, reached by API) and the Main Owner and Branch Owner model above. Business numbers stay Admin-configurable, as section 9 already requires.

**Position.** Ticketing is a separate product, the **MH Ticketing operator system**. An operator (for example JJ Express) uses it as its own system: its admin account sells and cuts tickets, runs counter sales, and designs its vouchers. The MH Travel app and its Ticketing hub are one more sales channel that talks to each operator system through the API below. Outside businesses and MH Travel's own ticketing use the same system.

#### 1. Who owns which data

| Data | Stays in the operator's system | Shared with MH Travel |
|---|---|---|
| Staff accounts, branches, counter sales, counter customers | yes | never |
| Routes, vehicles, schedules, fares, seat layouts | yes | trips and fares offered to the hub, seat status live |
| Voucher and ticket designs | yes | never (the traveler receives the rendered ticket) |
| Internal reports and finances | yes | never |
| A sale made through MH Travel | the full booking | a minimal record: operator, branch, trip, travel date, seat numbers, seat count, amount, `booking_ref`, status, traveler account id |

The traveler's name and phone are sent to the operator with the booking, because the ticket needs them. MH Travel receives nothing about the operator's other customers or sales.

#### 2. API between MH Travel and an operator system

Every request is signed with a per-operator key and carries an idempotency key on writes.

| Call | Purpose |
|---|---|
| `GET /trips?from&to&date` | Trips with times, fares and free-seat counts |
| `GET /trips/{id}/seats?date` | Seat map: free, taken, held. **Queried live when the booking flow opens, never cached** (section 7) |
| `POST /holds` | Hold chosen seats (trip, date, seats, traveler name and phone). Returns `hold_id` and `expires_at` (10 minutes) |
| `POST /holds/{id}/confirm` | After payment: returns `booking_ref` and the ticket |
| `DELETE /holds/{id}` | Release seats |
| `POST /bookings/{ref}/reschedule` | Change the date (the only change a traveler may make, section 6) |
| Webhook `booking.updated` | Operator-side changes (trip cancelled, seats moved) |

The operator system is the authority on seats: a seat conflict returns 409 and the traveler goes back to seat selection.

#### 3. Booking and money flow

Tickets use the **Instant** flow of section 6: choose seats → hold → pay → confirm → ticket issued.

- The traveler **pays MH Travel**. MH Travel records the transaction with the commission rate snapshotted (section 9: Admin-configurable per operator or branch, no default) and settles to the operator on the section 9 schedule (the 20th for days 1 to 15, the 5th for days 16 to month end, minimum 50,000 MMK carried over).
- Travelers cannot cancel. If the operator cancels a trip, the traveler is refunded in full and the amount is deducted from that operator's next settlement.
- **Failures:** if the operator system is unreachable, its trips are hidden in the hub with a short "temporarily unavailable" note, and nothing is cached. If confirm fails after payment, the call is retried 3 times over 5 minutes; if it still fails the payment is refunded and an Admin alert is raised. An expired hold blocks payment.

#### 4. Vouchers and tickets

An operator designs its own voucher inside fixed limits, so the booking ID, QR and legal fields can never be removed.

- **Fixed fields:** booking ID, operator name, route, date and time, passenger name, seats, amount paid, QR code (always `booking_ref`), contact, payment method, booking date, status, cancellation and reschedule policy.
- **Operator controls:** logo, brand colors, header and footer text, terms text, and one of three layouts.
- Designs are versioned and previewed with sample data. The same renderer prints counter sales and MH Travel sales.

#### 5. Operator console sections

Dashboard; Trips and schedules; Fares; Seat layouts; Counter sales (sell and print a ticket); Bookings (MH Travel and counter, with the channel shown); Voucher designer; Branches and staff; Reports; Settlement (statements for MH Travel sales); Settings.

#### 6. Accounts

The Main Owner and Branch Owner model above applies: Branch Owner accounts cost 10,000 MMK per month per branch, billed to the operator, and an outside operator pays the same unless Admin sets another term (section 9 leaves subscriptions to Admin). Inside the operator system there are three roles: owner, branch manager, and counter staff (sell only). Each is scoped to its own operator and, for branch roles, its own branch.

#### 7. MH Travel side tables

| Table | Key columns |
|---|---|
| `operators` | `id`, `name`, `status`, `api_base_url`, `api_key_ref`, `commission_pct`, `subscription_note`, `created_at` |
| `operator_branches` | `id`, `operator_id`, `station`, `city`, `monthly_fee_mmk` (10,000), `status`, `revenue_share_pct` (the migration that section 9 says is still required) |
| `ticket_transactions` | `id`, `operator_id`, `branch_id`, `booking_ref`, `trip_ref`, `travel_date`, `seats`, `traveler_id`, `amount_mmk`, `commission_pct`, `commission_mmk`, `net_mmk`, `status` (held, confirmed, refunded, rescheduled), `created_at` |
| `wallet_ledger_entries` | `id`, `wallet` (platform, main owner, branch), `owner_id`, `entry_type`, `amount_mmk`, `ref`, `at` |
| `settlement_batches` | `id`, `operator_id`, `period_start`, `period_end`, `gross_mmk`, `commission_mmk`, `adjustments_mmk`, `net_mmk`, `status`, `paid_at` |

#### 8. Build steps and acceptance

Build the operator system's seat and hold logic and the signed API first; then the hub's search and live seat map; then payment and confirm; then settlement and wallets; then the voucher designer and counter sales. Acceptance: a seat held by one traveler cannot be held by another; a confirmed booking appears on both sides with the same `booking_ref`; an unreachable operator disappears from the hub without errors; a refund leaves the settlement statement correct; the MH Travel side never stores anything from the operator's counter sales.

---

## 10. Content: Blog and Travel Guide

Blog:

- Written by Admin or Blog Post Admin. No per-post payout at launch.
- Block-based editor mixing text, images and ad blocks. Title and body are
  dual-language (MM/EN).
- Editorial categories are visible filter controls in the Blogs page, separate
  from SEO tags. SEO tags remain backend-only and are never shown in the app.
- On phone screens, keep the All filter stationary on the left and place the
  other categories in one compact, single-row horizontal scroller; chips stay
  small and do not wrap into a large grid. Desktop may retain its wrapped row.
- Interactions: favorite, share, view count.
- On phones, place Latest stories and the Newest sort selector on one row,
  with the Search bar directly below; preserve the desktop inline controls.
- After the Blogs listing's Load More control and before its page-bottom
  copyright, show Top Attractions, Restaurants, then Cafes as three one-row
  discovery sections. Reuse Home listings/favorite behavior, and keep the same
  sections on Home as well.
- Blogs Page follows the supplied responsive reference: an image-led Myanmar
  editorial hero and visible category filters, using nearly all available
  viewport width with only narrow responsive edge gutters rather than a
  restrictive centered max-width. Compact story cards use a denser desktop
  grid and short horizontal layout on phones. Every card has a prominent,
  accessible heart toggle on its image, with favorite counts and the other
  metrics still visible. Keep search and sorting, present categories
  independently from SEO tags, and open articles in the bilingual reader with
  shareable story URLs and client-side favorite/view interactions until the
  backend is connected. The reader's title, author/metadata, excerpt, ads,
  article text/media, and related content span the available viewport instead
  of a centered max-width column; keep only small responsive gutters and avoid
  horizontal overflow on phones.

### Blog: system specification (2026-11-22)

Verified against `src/lib/blogBlocks.ts`, `src/lib/contentWorkflow.ts`, `src/lib/publishProblems.ts`, `src/lib/blogMediaApi.ts`, `src/lib/contentAdminAccess.ts` and `src/features/superAdmin/BlogPostsPanel.tsx` (main @ `74b80fa`).

#### 1. As built (PARTIAL: editor works on local state)

- **Access:** Super Admin and Blog Post Admin (`canManageBlogs`). Posts, revisions and the audit log are component state, so nothing survives a reload and nothing reaches the public reader.
- **Blocks, in reading order:** `text` (`textEn`, `textMm`), `image` (`imageUrl`, `altEn`, `altMm`, `caption`, `credit`), `ad` (no content). Blocks can be inserted, moved up or down (`moveBlock`) and removed.
- **Ad rules in code:** at most 3 ad blocks per post (`MAX_AD_SLOTS_PER_POST`), not first, not next to another ad. `normalizeAdSlots` removes slots that break the rules after an edit.
- **Statuses:** Draft, Scheduled, Published, with a schedule date and time.
- **Publish check** (`blogPublishCheck`, stable codes): `title_languages`, `excerpt_languages`, `category`, `cover`, `story_text` (at least one text block with text in either language), `alt_missing` (every image needs alt text in both languages), `schedule`; ad codes `ad_first`, `ad_adjacent`, `ad_max`.
- **Revisions and audit** (`contentWorkflow.ts`): a revision on every save, at most 20 per post, with a Restore button; audit actions `created`, `saved`, `published`, `scheduled`, `restored`, each with the actor and time.
- **Media:** the source image may be up to 12 MB; the browser resizes it to at most 1600 px, converts to WebP trying quality 0.82, 0.68, 0.54, 0.4 until it is at most 450 KB. With `VITE_BLOG_MEDIA_UPLOAD_ENDPOINT` set it posts to the endpoint; without it, it keeps a preview data URL. Failures return codes that the editor translates.
- **Not built:** slug, read time, MM/EN author and location (both are plain strings), autosave, bilingual captions. `galleryUrls` still exists with no reader field. `seoTags` is one text field.

Corrections to what the Plan said earlier today: the ad limit is 3, not 2 (code wins); a caption is one string, not MM/EN; the story check needs one non-empty text block in either language, not every paragraph in both.

#### 2. Decisions for the system

- Keep the limit of 3 ad blocks per post, never first, never adjacent. The top and bottom reader slots stay automatic (`blog_post_top`, `blog_post_bottom`).
- Captions become bilingual (`captionEn`, `captionMm`) to match the reader's `LocalizedText`; `credit` stays one string (photographer or source).
- A text block with only one language filled is allowed; the editor warns. The reader shows an auto-translation of the missing language, cached and queued for Admin review (section 14 and the translation service in section 16B).
- `galleryUrls` is removed. Extra photos are image blocks.
- A post's reader fields are the canonical model: slug, MM/EN title, excerpt, author and location, blocks, category, read time, counters.

#### 3. Data model (Supabase)

| Table | Key columns | Notes |
|---|---|---|
| `blog_posts` | `id`, `slug` (unique), `status`, `category_slug`, `cover_key`, `cover_url`, `title_mm`, `title_en`, `excerpt_mm`, `excerpt_en`, `author_mm`, `author_en`, `location_mm`, `location_en`, `blocks` (jsonb), `seo_tags` (text[]), `read_minutes`, `latitude`, `longitude`, `rating` (nullable), `scheduled_for` (timestamptz), `published_at`, `views`, `version`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at` | `blocks` mirrors `BlogBlock`; `version` is for optimistic concurrency |
| `blog_categories` | `slug`, `label_mm`, `label_en`, `sort_order`, `active` | Seed the seven current categories; adding one needs both labels |
| `blog_revisions` | `id`, `post_id`, `saved_at`, `status`, `snapshot` (jsonb), `saved_by` | Keep 20 per post (trigger) |
| audit | `kind` (`blog` / `guide`), `content_id`, `action`, `actor_id`, `at` | Reuse `admin_audit_logs` after checking its columns; actions as in `ContentAction` |
| `blog_media` | `key`, `post_id`, `bytes`, `content_type`, `created_by`, `created_at`, `last_referenced_at` | For orphan cleanup |

**Access (RLS).** The public reads only posts where `status = 'Published'`, `published_at <= now()` and `deleted_at is null`, through a view that exposes reader fields only (no `created_by`, no `seo_tags` for display). Super Admin and Blog Post Admin write through `save_blog_post(post, expected_version)`; no other role touches the table. Roles are checked on the server.

#### 4. Flows

- **Draft save.** Autosave every 30 seconds writes the draft row only: no revision and no audit row. An explicit Save adds a revision and an audit row.
- **Concurrency.** Saves carry the `version` they loaded. A stale save fails with `version_conflict` and the editor offers Reload.
- **Publish.** The server runs the same checks as `blogPublishCheck` and `adSlotProblem` and returns the problem codes. On success it sets `published_at`, creates the slug if empty (lowercase, hyphenated English title; a number suffix if taken; fixed after first publish), computes `read_minutes` (English words ÷ 200, rounded up, at least 1), writes a revision and an audit row, adds one notification feed row (title, cover thumbnail, link `/blogs?story=<slug>`), and purges the public cache.
- **Schedule.** The editor takes Myanmar Time (UTC+6:30) and stores `scheduled_for` in UTC. A job runs every minute (Supabase `pg_cron` or a Cloudflare Cron Trigger), publishes due posts through the same publish function with the actor `system`, and is safe to run twice.
- **Unpublish.** Returns a post to Draft, clears `published_at`, writes an audit row, purges the cache.
- **Restore.** Loads a revision into the editor as unsaved changes; saving writes a revision and a `restored` audit row.
- **Delete.** Soft delete (`deleted_at`), audited; the post leaves the reader at once.
- **Views.** `increment_blog_views(slug)`, at most once per session per post. Favorite count comes from the favorites table.

#### 5. Media endpoint (Cloudflare Worker with an R2 binding)

POST multipart with the user's Supabase token. Allow only Super Admin and Blog Post Admin (and Travel Guide Content Admin for guide images). Check the WebP magic bytes and a size of at most 450 KB. Store at `blog-posts/<yyyy>/<mm>/<uuid>.webp`. Return `{ url, key }`. Enforce a CORS allowlist and a per-account rate limit. A nightly job deletes R2 objects not referenced by any post or revision in the last 30 days (`blog_media.last_referenced_at`).

#### 6. Reader contract

The public API returns the reader's `BlogPost`: a `text` block becomes `paragraph` with `{ en, mm }`; an `image` block becomes `image` with `alt` and `caption` as `{ en, mm }`; an `ad` block stays `ad` and renders the `blog_inline` placement (section 17). Where a post has two or more ad blocks, the ad service avoids showing the same creative twice in one post.

#### 7. Acceptance criteria

1. A saved post survives a reload and a second browser sees the same revisions.
2. A draft or scheduled post is invisible to the public; a published one appears within a minute.
3. The server rejects a publish that fails any check, with the same problem codes the editor shows.
4. A scheduled post publishes at the Myanmar Time entered, once, with the audit actor `system`.
5. Two editors saving the same post: the second gets `version_conflict`.
6. Restoring a revision never loses the current version; it becomes a new revision.
7. Replacing an image leaves the old object for the nightly cleanup, never deleting one still referenced.
8. A Blog Post Admin cannot read or write guides, rentals or ads.

#### 8. Card rating and distance (decided)

A new post has no rating, and the card hides the rating when there is none. Distance shows only when the post has coordinates (optional `latitude` and `longitude` in the editor) and the reader has allowed location; otherwise it is hidden. Views and favorites always show. Seeded posts keep their sample ratings until replaced. The reader's card code must treat a missing rating and a missing distance as "do not render", not as 0.

Travel Guide:

- Written by Travel Guide Content Admin, who earns per post.
- Structured, time-based itinerary. Each stop has a time, a real listing
  that already exists in MH Travel's database (no outside places), a
  description and photos.
- "Follow this route" is stop by stop, with a Directions button per stop
  reusing the existing How-to-Get-There module. A full auto-sequenced
  version may come later.
- User-provided UI reference: [MH Travel Guide_ Myanmar Journeys.png](https://drive.google.com/file/d/1I_dJ-Dc9AbfY07iwBFOtTf6vsAH1f9g-/view?usp=sharing).
  The desktop design uses a selected Travel Guide nav tab, a Shwedagon-at-dusk
  hero with a backpacking traveler, title/subtitle/description and Explore CTA;
  category filters and search; then image-led guide cards in a three-column
  grid with category, favorite, date/views and View Guide actions. The phone
  design keeps the hero compact, uses a 3-column category grid with search, and
  shows compact horizontal guide cards above the five-item bottom navigation.
- Replace the current `/travel-guide` placeholder with a bilingual guide
  listing and a `/travel-guide/:id` detail view, keeping existing `tg1`–`tg4`
  links and shared favorite IDs valid. Reuse the project's existing Myanmar
  photography for the hero/cards, and include All/ Myanmar / Nature / Adventure /
  Culture / Food / City Tour filters, search, category/date/views/rating/distance,
  visible favorite toggles, and View Guide actions. The detail view keeps the
  planned time-based stops and directions affordance.
- After the Travel Guide listing and its Load More control, place one horizontal
  discovery row each for Top attractions, Restaurants, and Cafes, in that order,
  before the global copyright strip. Keep the full footer exclusive to Home.

### Travel Guide: system specification (2026-11-22)

Verified against `src/lib/guideItinerary.ts`, `src/lib/guideEarnings.ts`, `src/lib/contentWorkflow.ts`, `src/data/listingIndex` (imported by `TravelGuidesPanel.tsx`), `src/data/travelGuideData.ts` and `Doc/STATUS.md` (main @ `74b80fa`).

#### 1. As built (PARTIAL: editor works on local state)

- **Reader:** `/travel-guide` is PREVIEW; `/travel-guide/:guideId` is DONE with the itinerary timeline and the stop-by-stop "Follow this route" stepper.
- **Editor access:** Super Admin and Travel Guide Content Admin (`canManageGuides`).
- **Draft fields:** MM/EN title and excerpt, category (`myanmar`, `nature`, `adventure`, `culture`, `food`, `city_tour`), cover, author (one string), ordered stops, status, schedule date and time.
- **Stop fields:** `time` (HH:MM), `listingId` (a listing that exists in MH Travel, from `LISTING_IDS`), MM/EN title and description, optional photo through the shared WebP pipeline. Stops can be sorted by time and moved up or down.
- **Publish check** (`guidePublishCheck`): `title_languages`, `excerpt_languages`, `cover`, `author`, `stop_required`, `stop_listing` (a stop whose listing no longer exists), `stop_languages` (every stop needs title and description in both languages), `stop_time_format`, `stop_time_order` (a time earlier than the one before it), `schedule`.
- **Revisions and audit:** shared with Blog (`contentWorkflow.ts`): 20 revisions per item, audit actions as for Blog.
- **Earnings** (`guideEarnings.ts`): one row per guide (`guideId`, `author`, `publishedAt`, `amountUsd` null until set, `paid`). `setEarningAmount` ignores negative or non-finite values; `markEarningPaid` works only when an amount exists; `authorTotals` gives each author's payable USD and pending rows.
- **Not built:** persistence, slug or `guideId`, duration, localized author, autosave, handling of a removed listing.

#### 2. Decisions for the system

- `guideId` for a new guide is its slug (lowercase, hyphenated English title, unique, fixed after first publish).
- The reader needs a duration; the editor has none. Duration is derived from the first and last stop times, in hours rounded to the nearest half hour. Guides are **single-day in this phase**; multi-day guides come later by adding a `day_number` to stops (the column exists from the start, default 1).
- The reader's MM/EN author is the one author string for both languages unless Admin sets a Myanmar name.
- The excerpt is the reader's `summary`.
- Stop title defaults to the listing name; the reader's `place` text is derived from the listing, never typed.

#### 3. Data model (Supabase)

| Table | Key columns | Notes |
|---|---|---|
| `travel_guides` | `id`, `slug` (unique), `status`, `category`, `cover_key`, `cover_url`, `title_mm`, `title_en`, `summary_mm`, `summary_en`, `author_name`, `author_id` (nullable), `duration_minutes`, `scheduled_for`, `published_at`, `views`, `version`, `needs_review`, `created_by`, `updated_by`, `created_at`, `updated_at`, `deleted_at` | Six fixed categories |
| `guide_stops` | `id`, `guide_id`, `position`, `day_number` (default 1), `time_text` (HH:MM), `time_minutes`, `listing_id`, `title_mm`, `title_en`, `description_mm`, `description_en`, `image_key` | Stops are saved and replaced together with the guide, in one transaction |
| `guide_revisions` | as `blog_revisions`, snapshot includes stops | 20 per guide |
| audit | shared with Blog | `kind = 'guide'` |
| `guide_earnings` | `id`, `guide_id` (unique), `author_id` / `author_name`, `published_at`, `amount_usd` (nullable, `>= 0`), `paid`, `paid_at`, `paid_by`, `fx_mmk_per_usd` and `paid_mmk` (set when marked paid), `payout_date`, `created_at` | `check (paid = false or amount_usd is not null)` |

**Listing dependency.** Listings are compiled data today (`src/data/listingIndex.ts`), not in Supabase. Until they move, the server validates `listing_id` against a seeded `listings_index` table with the same ids, and the later move to the real catalog must keep those ids stable.

**Access (RLS).** The public reads published guides and their stops through a view. Super Admin and Travel Guide Content Admin write through `save_travel_guide(guide, stops, expected_version)`. Earnings: the author reads their own rows; Payment Admin and Super Admin read all and set amount and paid.

#### 4. Flows

- **Save, concurrency, publish, schedule, unpublish, restore, delete:** exactly as for Blog (section 10, Blog flows), with the guide checks and `slug`.
- **Server publish check:** the same codes as `guidePublishCheck`, with `stop_listing` checked against the listings table at publish time.
- **Listing removed or deactivated:** guides using it get `needs_review = true` and appear in an Admin list. A published guide stays up, keeps the stop's stored title, and disables that stop's Directions button until it is fixed.
- **Earnings:** a row is created automatically the first time a guide becomes Published, once per guide (the unique `guide_id` stops duplicates on republish). Amount is entered by Admin or Payment Admin, starting from a default in settings (`guide_post_rate_usd`, empty until the founder sets it). Marking paid needs an amount, a payer and a date, and records the exchange rate and the MMK amount actually paid. Payment itself is outside the app in this phase.

#### 5. Acceptance criteria

1. A saved guide and its stops survive a reload and keep their order.
2. A publish with a stop pointing at a missing listing is rejected with `stop_listing`.
3. Stop times must be in order; equal times are allowed.
4. Republishing a guide does not create a second earning row.
5. A row cannot be marked paid without an amount.
6. A Travel Guide Content Admin sees only their own earnings, read-only.
7. Removing a listing flags the guides that use it without hiding them.
8. The reader's stepper follows the saved stop order, and duration matches the first and last stop times.

#### 6. Payout timing (decided)

Earnings of Published guides are paid on the same two dates as Owner payouts (section 9): Day 1 to 15 on the 20th, Day 16 to month end on the 5th of the next month, with no minimum amount for content authors. A row with no amount yet is listed as pending for Admin. The per-post rate is a setting, not code, so the founder can set or change it at any time.

---

## 11. Reviews and Reports

- Two tiers: business-specific reviews, and a platform-level review of MH
  Travel itself. Reviews require a verified booking or visit.
- Report Content: repeated complaints against an Owner lower their rating,
  and Admin can manually raise it back.

---

## 12. Search, Nearby, Notifications and Support

- Search is unified across all categories at once (hotels, restaurants,
  blogs, guides, rentals together). It favors simplicity and clarity over
  exhaustive filters.
- Nearby: GPS-based distance sorting, location bar with manual override,
  category chips plus a "more categories" search, List/Map toggle, Open Now
  emphasized, results as grid cards.
- Notifications fire when Admin publishes new content, an Owner publishes a
  new listing or promotion, or a booking status changes.
- Support: logged-in users get live chat with MH Travel; guests get a
  contact form only. Owner Admins have a separate private chat channel.

---

## 13. Foreign Tourist Section

Post-arrival help only: Emergency/SOS contacts, SIM card info, cultural
etiquette, currency and tipping guide. Visa information is excluded because
it is a pre-arrival matter.

**Implemented 2026-11-22** as one page at `/foreign-tourist`, in the shared
shell and bilingual throughout:

- Four anchored sections — Emergency contacts, SIM card and internet, Cultural
  etiquette, Currency and tipping — reachable from a jump row at the top, so
  the page stays one screen deep on a phone.
- Emergency numbers are `tel:` links (police 199, ambulance 192, fire 191, plus
  the MH Travel support line). Ambulance/fire/police codes are national and
  stable; the page does not quote SIM package prices because those change, and
  says so in a note.
- The page carries no visa content, per the rule above.
- The Home Emergency and Sim card tiles open the matching anchor instead of
  pointing at an unrelated catalog. The Exchange tile keeps going to the Nearby
  exchange listings, which are real places rather than advice. The mobile
  drawer Navigate list and the footer Navigate column link the page directly.
- Content lives in `src/data/foreignTourist.ts`; `foreignTourist.test.ts` fails
  if any string is missing one of the two languages, if the three national
  emergency lines disappear, or if an anchor id is duplicated.

---

## 14. Accounts, Language and Currency

- Auth phase 1: email and Google. Phase 2: phone, Apple, Facebook.
- User profile: profile header, My Bookings, My Travel Plans, Favorites, My
  Reviews, Messages, Settings, Support/Legal.
- Account dashboard visual direction follows the supplied MH Travel user
  dashboard reference: deep navy surfaces, bright cyan accents, a Myanmar
  destination banner, compact travel-stat cards, and clear booking/activity
  panels. The desktop layout uses a profile/navigation rail beside the main
  dashboard; the mobile layout condenses profile/navigation and stacks the
  trip, quick-action, activity, and discovery cards for narrow screens.
- The account dashboard retains the shared app header and omits the full footer
  under the Home-only footer rule. Desktop shows a copyright-only line at the
  page bottom; phones show it at the bottom of the mobile drawer. Newly added
  account UI copy stays bilingual through the existing EN/MM translation system.
- Language: EN/MM with auto-translation fallback. Auto-translated text is
  cached and queued for Admin review.
- Currency: MMK and USD display using the current frontend formatter and a
  hard-coded preview rate; an Admin/Supabase-managed exchange rate is planned,
  not implemented.
- Weather is one centralized service (Cloudflare Worker with caching)
  reused everywhere, not duplicated per page.

---

## 15. Repo Conventions

- `.env` holds `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. It is
  gitignored and must never be committed. Set the same two variables in
  Cloudflare's build environment.
- Do not add a `public/_redirects` file. It conflicts with the Worker's
  `not_found_handling` setting and breaks the deploy.
- Every card uses the shared `CardListing` type, with rating, distance,
  isFavorited and views required.
- Card prices are stored as `priceUsd` and rendered through the currency
  formatter, never as a hardcoded string.
- New feature UI strings should go through the translation helper. A source audit
  still finds hard-coded English labels, accessibility text, and seeded catalog
  content, so this is an implementation rule with remaining cleanup rather than
  a claim that every visible string is already translated.
- Ad slots use the shared `AdSlot` component so the collapse rule lives in
  one place.
- Overlays that use `position: fixed` (drawers, modals) must render through
  a React portal into `document.body`. The sticky header uses
  `backdrop-blur`, which makes any `fixed` child size itself to the header
  box instead of the screen. The mobile drawer hit exactly this bug.

---

## 16. Open Items

- Favorites page implemented: saved listings resolve through shared categories and client-side favorite state; backend persistence remains pending.
- Supabase core data foundation is now applied: `favorites`, `custom_plan_requests`, `bookings`, `notifications`, `reviews`, `ads`, and `admin_audit_logs` tables have RLS, owner/admin policies, validation checks, UTC timestamps, update triggers, and indexes. Frontend forms still need to be wired to these tables; no Edge Function was deployed because no function contract is defined yet.
- City page cards use the shared ListingCard favorite fallback, so their hearts stay synchronized with the global Favorites provider. City cards now open `/cities/:cityId` detail pages with a city-specific hero and Burmese/English intro, best-for/stay/getting-there facts, attraction/hotel/restaurant recommendations, and a Custom Plan CTA. The detail page also has a Search-like category explorer for All, Attractions, Hotels, Restaurants, Book Shops, Rentals, Transport, Cafes, and Markets, with keyword search, result counts, and Show more/Show less for the expanded business inventory.
- Blogs page implemented: bilingual editorial listing and reader; favorite,
  share, and view counts currently use client-side storage pending backend wiring.
- Travel Plans page implemented as a frontend preview: compact shared-card grid with bilingual UI,
  route search, duration filters, sorting, price display, and client-side
  favorite toggles. The page starts directly with the plan tools and ends with
  a bilingual custom-plan builder for start point, destinations, days,
  travelers, nationality, budget, transport, accommodation, hotel choice, and
  notes; selectable hotels and places come only from existing MH Travel data,
  and hotel selection may be left for later. Submission currently changes local
  UI state and displays the intended MH Travel quotation/contact/negotiation
  handoff copy; it does not yet persist or send a request. No extra intro banner
  is shown.
- Hero audit completed: Home, City, Nearby, Rentals, Ticketing, Blogs, Travel Guide, Account, Restaurant, and Book Shop have page-level hero/banner treatments; City uses a persistent visible bilingual Shwedagon hero independent of optional ad data; Search, Favorites, Notifications, and other utility/auth pages do not need a discovery hero. Travel Plans was the missing discovery page and now has a bilingual Bagan-sunrise hero with a Browse plans anchor CTA.
- Travel Plan cards now open `/travel-plans/:planId` detail pages with a bilingual hero, duration/traveler/schedule summary, generated day-by-day itinerary, estimated starting price, Request this plan CTA linked to the custom-plan builder, and Browse all plans action. The detail route is registered in `public/manus-routes.json`.
- Generic catalog/discovery heroes now use one shared responsive dimension utility: 190px on phones, 230px on small/tablet widths, and 250px on web/medium widths. This is applied to City, Nearby, Rentals, Ticketing, Travel Plans, Travel Guide listing, Blogs, and Account overview; content-heavy detail headers remain separate so their longer information does not clip.
- Search uses one input in the Header. After submission, `/search?q=...` shows the matching Yangon or category results directly without a duplicate Search Results input. The result page keeps compact static filter chips for All, categories, and cities including Yangon, Naypyidaw, Mandalay, and Bagan; selecting a chip updates the visible cards in place.
- A city query is catalog-wide: typing `ရန်ကုန်` or `Yangon` returns all cards assigned to Yangon across Hotels, Restaurants, Book Shops, Cafes, Rentals, Attractions, Markets, Guides, Plans, and related content. Burmese city/category terms are normalized, while Bagan, Mandalay, and other city cards are kept out of Yangon results.
- Category searches present city chips directly under the category result row, with no `By city` label. The compact city choices include Yangon, Bago, Naypyidaw, Mandalay, and Bagan; choosing a city refines the selected category cards without opening another search control.
- Search query modes are now explicit: city-only queries show all listings in that city; category-only queries show city cards only; and city-plus-category queries show only the requested category in the requested city. City-only result lists provide `Top rated` and `Nearby` sorting instead of repeating city filters.
- Category-only city cards are interactive: selecting a city drills into that category in the selected city and reveals `Top rated` and `Nearby` sorting. This makes `Hotel` → Yangon → Yangon hotels equivalent to the direct `ရန်ကုန် ဟိုတယ်` query.
- City-only search results expose one compact filter row containing `All`, `Top rated`, `Nearby`, `Hotels`, `Restaurants`, `Book Shops`, `Cafes`, `Rentals`, `Attractions`, and `Markets`. These controls operate within the searched city, so choosing Hotels after `ရန်ကုန်` returns only Yangon hotels while All restores the full Yangon catalog.
- Category-only search results such as `Hotel` use a single compact row: `All`, `Top rated`, and `Nearby` remain fixed, while the city-name chips rotate to the next city window every 10 seconds. Choosing a rotating city chip drills into that category for the selected city.
- Combined searches such as `ရန်ကုန် ဟိုတယ်` show `All`, `Top rated`, and `Nearby` in one static row and render hotel cards with currency-aware nightly prices plus rating, distance, views, favorite state, and hotel name.
- Language audit (updated 22 November 2026): the shared EN/MM provider persists the selected language, updates `document.documentElement.lang`, and is consumed by the traveler routes, shared Header/Mobile Menu/Footer, Ticketing, Rentals, Search, Favorites, Account, Notifications, City, Blogs, Travel Plans, Travel Guide, Restaurant, Book Shop, Admin Login, the Shop Owner and Main Owner dashboards, the whole Super Admin dashboard, and both content editors (Blog Post Management and Travel Guide Management). Frontend localization has no known gap left; the remaining translation work belongs to the backend (stored bilingual content and auto-translation review, §14).
- Travel Guide and Search frontend pages are now implemented. Remaining detail
  routes include City, Hotel, Attraction, Cafe, Market, Rental, Ticketing, and
  Travel Plan detail destinations referenced by static cards. Nearby, Rentals,
  Ticketing, Travel Guide, Account, Search, and Favorites are frontend UI over
  local/static data pending backend wiring.
- Homepage reference alignment: local Myanmar photography now fills Travel
  Plan, Travel Guide, Blog, and Popular cards; Travel Guide uses the compact
  circular-image row treatment from the reference. Hero ad creative remains
  mock Admin Ads content until the ad backend is connected.
- Restaurants detail page implemented at `/restaurants`: preserves the MH
  Travel theme and shared shell while adding a hero, info row, map/amenities,
  menu tabs, dishes, reviews, venue photos, nearby attractions, and CTA based
  on the supplied restaurant layout reference.
- Non-home listing cards: City/secondary listing sections now use a slightly
  larger, richer card treatment for Travel Guide and Popular categories;
  homepage card sizing remains unchanged.
- Home discovery expansion: Home now reuses the Cities data to show Top
  Attractions, Popular Hotels, Restaurants, Book Shops, Rentals, Transport
  Services, Cafes, Markets, and Popular Searches in the same section pattern
  as the deployed `/cities` page.
- City discovery rows are passed `columns={5}` and are capped at five card widths plus gaps. They are a width-capped flex row, not a five-column CSS grid (`Doc/PLAN-VS-CODE.md` §3.4). This matches the five records currently in each City catalog, removes the unused sixth-column whitespace beside Restaurants, Book Shops, Rentals and the other five-card sections, and preserves the responsive mobile/tablet layout.
- Nearby page at `/nearby` follows the user's [Drive visual reference](https://drive.google.com/file/d/1eiuGD1sIiv8jlmkKHHOnHBGHWsIPFVaW/view?usp=sharing): a Shwedagon/map-pin hero; Yangon selector, 500 m/1 km/5 km/10 km radius chips and search; icon categories for Hotels, Guesthouses, Restaurants, Cafes, Bars, Exchange, Hospitals, Clinics, Bookstores, Gyms, Temples, and City Markets, plus the existing Rentals category; a six-card Nearby Places grid with View All; Quick Filters for distance, Top Rated, Near Me, and Open Now; and a Popular Nearby row.
- Preserve browser geolocation with Yangon fallback, live keyword/category filtering, rating/distance behavior and shared favorite state. Keep existing `near-*` IDs, use unique IDs for added records, and include the full Nearby catalog in Favorites and Account resolution. Display “All” and the 13 categories as circular icon buttons in one horizontal row that continuously moves right-to-left; pause on hover/focus and respect reduced-motion preferences by leaving a static manually scrollable row. Keep stacked mobile search controls, compact place cards, persistent five-tab phone navigation, Home-only full footer, and global copyright.
- Nearby Categories now follows the Home Categories visual contract: 36px icon circles, 64px item width, 16px icons, 8px labels, the shared `animate-marquee` 22-second loop, and the same duplicated continuous-scroll structure. Nearby keeps its own click handler so All/category selection continues to filter Nearby results.
- The separate Nearby city/location selector, distance-chip row, keyword search field, Search button, and location-status message panel was removed from the rendered page at the user's request. Nearby still requests location silently for distance calculation and keeps category selection, Quick Filters, Favorites, and result rendering.
- User Account Dashboard implemented at `/account`: profile header and stats,
  dashboard navigation, bookings, custom plans with quotation status,
  favorites, reviews, messages, settings, and support/legal views. Data is
  currently client-side sample state pending auth and Supabase wiring. The
  refreshed responsive UI follows the supplied dashboard reference, including
  its navy/cyan visual treatment; the full footer is Home-only and copyright
  follows the global desktop/mobile placement rule.
- Full Notifications page implemented at `/notifications` and
  `/account/notifications`: the header dropdown's See all link now opens a
  bilingual notification inbox with All/Unread/Read filters, mark-all-read,
  Today/Earlier grouping, unread styling, and linked notification destinations.
- Account Recent activity is intentionally a short preview of the same
  notification stream; its View all action opens the full inbox. On phone
  layouts, Notifications remain in the header and Account/Login remains only
  in the fixed bottom navigation; neither is duplicated in the mobile drawer.
- Book Shop detail page implemented at `/book-shops` and `/book-shops/:id`,
  following the supplied reference structure while preserving MH Travel's
  existing theme: hero and shop facts, services, About section, books,
  stationery, gifts, photos, reviews, nearby attractions, and CTA.
- Home now renders a dedicated ad slot immediately below Popular Hotels using
  the existing Admin Ads/AdSlot pipeline and collapse-when-empty behavior.
- Blog posts now open as an in-page reader inside the normal Blogs route rather
  than a fixed modal/overlay. The reader keeps the shared site header and omits
  the full footer under the Home-only footer rule, while keeping the global
  desktop copyright line and mobile drawer copyright. It supports back
  navigation and renders sponsored slots above, within existing ad blocks, and
  below the article content.
- The in-page Blog reader no longer uses a paper-like outer card; it follows the
  app background and page flow. Each article now ends with a related Popular
  Hotels row sourced from the existing hotel data and shared listing cards.
- The Blogs listing no longer shows the editorial eyebrow, “Latest stories”
  heading, or intro sentence; it opens directly with search/sort controls and
  the post cards.
- Payment gateway (KBZPay, AYA Pay and others), decided 2026-11-22: until Phase 3 payments are recorded by staff. Each gateway later plugs in behind one adapter (`createPayment`, `verifyPayment`, `refund`, a webhook with signature check, idempotency keys), so booking statuses never change. Provider contracts and fees come from the founder when Phase 3 starts.
- R2 folder and naming convention: decided in section 16B.6.
- Travel guide rental expense mechanics, decided 2026-11-22: after the rental, Rental Admin records the guide's actual accommodation, food and travel costs as extra lines on the order (`rental_order_extras`: description, amount, added by, time). The traveler sees the updated total and is notified; the extras are collected the same way as the rental payment.
- Owner and Admin dashboard screens: for the MH-owned modules they are specified in sections 8, 10 and 16A; the Owner and listing dashboards follow the user-facing listing pages in Phase 2 (section 16D).

## 16A. Ads system and Adsboard (2026-11-22)

The Adsboard is the Ads Management dashboard. It controls every ad shown in the web app and, later, the mobile app. Written against `src/components/ui/AdSlot.tsx`, `src/data/ads.ts`, the Ads Management panel in `SuperAdminPage.tsx` and `Doc/STATUS.md` (PREVIEW, local state; main @ `74b80fa`).

### 16A.1 Rules (already decided)

- Order of delivery: **Admin Ads → Google AdSense / AdMob → collapse**. When nothing is available the slot renders nothing and the layout reflows; no empty box, ever.
- Only Super Admin and Ads Admin manage ads (`canManageAds`). Blog, Guide and other roles never do.
- Every ad shows a **Sponsored** label and opens with `rel="noopener noreferrer sponsored"`.
- Each placement has an on/off toggle, and the page can show no ad at all.

### 16A.2 As built

- `AdSlot({ placement, fetchAd })` calls `fetchAd(placement)` and renders an `AdCreative` (`id`, `type` image or video, `mediaUrl`, `clickThroughUrl`, `advertiser`). Video plays muted and looped. It collapses on `null`.
- Placement keys in code: `home_hero`, `home_after_travel_plans`, `home_after_hotels`, `home_after_blogs`, `home_after_reviews`, `home_after_partners`, `blog_post_top`, `blog_post_bottom`, `blog_inline`. Any `blog_*` key falls back to `blog_inline`. The Rentals top banner is a fixed compact banner, not a placement yet.
- `fetchMockAd` serves local SVG banners (800 × 220). The Supabase `ads` table exists with RLS and is not used by the page. Its columns must be checked before the schema below is applied.
- The console has nine pages (Home, Cities, City Detail, Travel Plans, Travel Plan Detail, Blogs, Blog Detail, Nearby, User Dashboard), each with ads `{ page, slot, name, advertiser, active }`, add, edit, preview and publish or pause. All local state.

### 16A.3 Placements

One key per position, named `<page>_<position>`. Existing keys keep their names. Each placement has a page, a label (MM/EN), a format, an `active` toggle, and whether AdSense / AdMob fallback is allowed.

| Page | Placement keys | Format |
|---|---|---|
| Home | `home_hero`, `home_after_travel_plans`, `home_after_hotels`, `home_after_blogs`, `home_after_reviews`, `home_after_partners` | wide banner |
| Blog list and detail | `blog_post_top`, `blog_inline` (each `ad` block), `blog_post_bottom` | wide banner |
| Rentals | `rentals_top` (replaces the fixed banner) | compact banner |
| Other pages in the console | `cities_top`, `city_detail_after_restaurants`, `travel_plans_top`, `travel_plan_detail_inline`, `nearby_top`, `account_top` | wide banner |

Keys for pages other than Home, Blog and Rentals are proposed and are created when a page first gets an `AdSlot`.

### 16A.4 Data model (Supabase)

| Table | Key columns | Notes |
|---|---|---|
| `ad_advertisers` | `id`, `name`, `contact_name`, `contact_phone`, `contact_email`, `notes` | Not public |
| `ad_campaigns` | `id`, `advertiser_id`, `name`, `status`, `start_at`, `end_at`, `priority`, `weight`, `created_by`, `approved_by`, `approved_at` | Status in 16A.6 |
| `ad_creatives` | `id`, `campaign_id`, `type`, `media_key`, `click_url`, `alt_mm`, `alt_en`, `approval` (`draft` / `pending` / `approved` / `rejected`), `rejected_reason`, `bytes` | Media in R2 |
| `ad_placements` | `key`, `page`, `label_mm`, `label_en`, `format`, `active`, `fallback_allowed`, `sort_order` | The 16A.3 catalog |
| `ad_assignments` | `campaign_id`, `placement_key`, `starts_at`, `ends_at` | Which campaign runs where |
| `ad_events` | `placement_key`, `creative_id`, `kind` (`impression` / `click`), `at`, `session_hash`, `user_id` (nullable) | Raw events, kept 90 days |
| `ad_stats_daily` | `day`, `placement_key`, `campaign_id`, `impressions`, `clicks` | Rolled up nightly, Myanmar Time days |

If the existing `ads` table can hold these, extend it; otherwise migrate its rows into this shape and retire it.

### 16A.5 Serving (what the page calls)

`serve_ad(placement_key, language)` returns one creative or nothing:

1. If the placement is inactive, return nothing.
2. Candidates: campaigns that are Live, inside `start_at` and `end_at`, assigned to the placement, with an Approved creative of an allowed type.
3. Take the highest `priority`. Among equals rotate by `weight`.
4. If there is none and `fallback_allowed`, the page asks AdSense / AdMob; if that is empty or off, the slot collapses.

The response may be cached at the edge for 60 seconds. Click-through goes through `/ad/click/<creative_id>`, which records the click and redirects. An impression is counted when at least half the ad has been visible for 1 second (IntersectionObserver), once per creative per session per page view. Basic bot user agents are ignored.

### 16A.6 Campaign and creative lifecycle

| Campaign status | Meaning | Moves to |
|---|---|---|
| Draft | Being built | Pending |
| Pending | Waiting for approval | Approved, Rejected |
| Approved | Approved, before its start | Live |
| Live | Serving | Paused, Ended |
| Paused | Stopped by an admin | Live |
| Ended | Past `end_at`, set automatically (the console's auto-pause expired ads) | none |
| Rejected | Not approved; reason recorded | Draft |

Ads Admin builds and submits; **Super Admin approves** (the console's creative approval). Every change writes an audit row. Pausing is immediate.

### 16A.7 Adsboard sections

| Section | Contents |
|---|---|
| Overview | Active campaigns, live placements, impressions, clicks, CTR for a chosen range; campaigns ending in 7 days; items waiting for approval. |
| Pages and placements | Pick a page, see its placements with an on/off toggle, the current ad, and a health state: *Filled by Admin ad*, *Fallback*, or *Empty (collapsed)*, with the fill rate for 24 hours. Preview shows the real page with the ad in place. |
| Campaigns | List with filters (status, advertiser, placement, date). Create or edit in one form: advertiser, dates, placements, priority and weight, creatives. |
| Creatives and approvals | Queue of Pending creatives with preview, approve or reject with a reason. |
| Advertisers | Contact details and campaign history. |
| Reports | Impressions, clicks, CTR and fill rate by placement, campaign and day; CSV export. |
| Settings | AdSense / AdMob ids and per-placement fallback, creative limits, collapse behavior. |

### 16A.8 Creative requirements

- **Image:** JPEG, PNG or WebP, converted to WebP, at most 300 KB, banner shaped like the current 800 × 220 mocks.
- **Video:** MP4, muted, looped, at most 3 MB and 15 seconds.
- **Alt text** in Myanmar and English is required; it replaces today's generic "Ad by …".
- **Click URL:** `https` or an internal path only; a block-list of domains is kept in Settings.

### 16A.9 Access and audit

Direct reads of the ad tables are denied to the public; they use `serve_ad` and the click endpoint only. Super Admin and Ads Admin read and write; Payment Admin reads reports. The role is checked on the server. Every campaign, creative, placement and settings change writes an admin audit row.

### 16A.10 Build steps (for Cursor)

1. Check the live `ads` table, then migrate the tables above with RLS. 2. Seed `ad_placements` from 16A.3. 3. `serve_ad`, the click endpoint and the event beacon. 4. Replace `fetchMockAd` with `serve_ad` in `AdSlot`, keeping the collapse. 5. Rentals top becomes `rentals_top`. 6. Adsboard Pages and placements, then Campaigns and Creatives. 7. Approval flow. 8. Reports and the nightly roll-up. 9. AdSense / AdMob fallback.

### 16A.11 Acceptance criteria

1. A Live, approved campaign shows in its placement; pausing it removes the ad on the next request.
2. A placement turned off, or with nothing to show, renders no box.
3. A campaign never serves before `start_at` or after `end_at`, and an unapproved creative never serves.
4. One view of an ad counts one impression; a click counts once and redirects.
5. A Blog Post Admin or any other non-ads role cannot read or change ads.
6. Every ad carries a Sponsored label and alt text in both languages.
7. The Adsboard totals equal the sum of the daily roll-up.

### 16A.12 Commercial rules (decided)

- **Pricing:** a flat fee per campaign, agreed by hand with the advertiser for a period and a set of placements. No self-serve billing and no CPM or CPC in this phase. The campaign stores `agreed_fee_mmk`, `invoiced` and `paid` flags; invoices are issued outside the app.
- **AdSense / AdMob:** the web app uses AdSense as the fallback on placements with `fallback_allowed`. The account and ids go in Settings and stay empty until the founder supplies them, so fallback is off until then. AdMob is used when the mobile app ships.
- **Mobile app:** it uses the same `serve_ad` and the same placement catalog, with mobile-specific placements added later.
- **Approval:** Super Admin only.

## 16B. Platform services (shared by every module; 2026-11-22)

These are built once in Phase 0 and then used by Rentals, Blog, Travel Guide, Ads and every later module.

### 16B.1 Roles and permissions

Roles live in `public.profiles.role` and are checked on the server for every write (RLS plus a role helper in the private schema). Client helpers such as `canManageBlogs` only hide menus. F = full, R = read, O = own records only, A = approve.

| Area | Super Admin | Ads Admin | Admin | Rental Admin | Payment Admin | Guide Content Admin | Blog Post Admin | Owner Admin |
|---|---|---|---|---|---|---|---|---|
| Rental orders and catalog | F | – | R + handle orders | F | R + record payment | – | – | – |
| Blog posts | F | – | R | – | – | – | F | – |
| Travel guides | F | – | R | – | – | F | – | – |
| Guide earnings | F | – | R | – | F (set amount, mark paid) | O (read) | – | – |
| Ads and Adsboard | F + A | F | – | – | R (reports) | – | – | – |
| Users and support | F | – | F | – | – | – | – | – |
| Owner accounts and listing approval | F | – | F | – | – | – | – | O (own listing) |
| Payments, payouts, exchange rates | F | – | – | – | F | – | – | O (own earnings) |
| Template catalog and entitlements | F | – | R | – | F (record payments) | – | – | O (own shop) |
| Settings and roles | F | – | – | – | – | – | – | – |

Super Admin creates every other admin account. Traveler accounts are separate from all of these (section 3).

### 16B.2 Audit log

Every create, update, delete, publish, approve, payment and role change writes one row: actor, role, action, object type, object id, a short before/after summary, time (UTC), and the request source. Rows are append-only and kept 24 months. Content actions use the `ContentAction` names already in `contentWorkflow.ts`. Reuse `admin_audit_logs` after checking its columns.

### 16B.3 Notifications

One service, two tables: `notification_feed` (shared rows such as "new blog post") and the existing per-user `notifications` read-state. Delivery is Supabase Realtime to the bell; retention 90 days.

| Event | Recipients | Link |
|---|---|---|
| Blog post published | all users | `/blogs?story=<slug>` |
| Travel guide published | all users | `/travel-guide/<slug>` |
| Rental requested | Rental Admin accounts | the order in the Rental Admin dashboard |
| Rental accepted, paid, expired, cancelled | the traveler | `/account/bookings/<code>` |
| Rental rescheduled | Rental Admin accounts | the order |
| Ad creative waiting for approval | Super Admin | Adsboard approvals |
| Campaign ends in 3 days, campaign ended | Ads Admin | the campaign |
| Guide earning amount set, marked paid | the author | the earnings list |
| Owner or template subscription ending (7, 3, 1 days) | the owner | the renewal screen |
| Shop Owner application submitted | Admin, Super Admin | the application |
| A scheduled job failed | Super Admin | the jobs page |

### 16B.4 Translation fallback (section 14)

When a text exists in one language only, the reader asks `translate(text, from, to)`. The result is cached in `translation_cache` (`id`, `source_hash`, `from_lang`, `to_lang`, `source_text`, `translated_text`, `status` auto / approved / edited, `reviewed_by`, `created_at`) and shown with a small "Auto-translated" marker. Admin has a review queue of `auto` rows, most viewed first; approving or editing makes the text permanent and removes the marker. The translation provider is called from a Cloudflare Worker with its key in secrets. Names, addresses and prices are never translated.

### 16B.5 Currency

`exchange_rates` (`id`, `mmk_per_usd`, `effective_from`, `set_by`, `note`); the current rate is the latest row with `effective_from <= now`. Super Admin and Payment Admin set it, and rows are never edited. Orders and bookings snapshot the rate and display currency. USD is kept to 2 decimals; MMK is shown rounded to the nearest 100. The hard-coded 4,500 stays as the fallback until the first row exists.

### 16B.6 Media and storage (Cloudflare R2)

| Folder | Holds | Limit |
|---|---|---|
| `blog-posts/` | cover and inline images | WebP, at most 450 KB |
| `guide-stops/` | guide covers and stop photos | WebP, at most 450 KB |
| `ads/` | ad images and video | image at most 300 KB; video MP4 at most 3 MB and 15 s |
| `rentals/` | category and variant images | WebP, at most 450 KB |
| `shops/<shop-id>/` | owner photos, within the Admin-set quota | WebP, at most 450 KB |

All uploads go through the authenticated Worker (type check, size check, role check, rate limit, CORS allowlist). A nightly job removes objects nothing has referenced for 30 days.

### 16B.7 Scheduled jobs

Runs on `pg_cron` or Cloudflare Cron Triggers. Every job is safe to run twice, logs its result, and notifies Super Admin when it fails.

| Job | Every | Does |
|---|---|---|
| Publish due content | 1 minute | Scheduled blog posts and guides whose time has come |
| Ad campaign start and end | 1 minute | Approved to Live at `start_at`; Live to Ended at `end_at` |
| Rental payment expiry | 5 minutes | Accepted orders past `payment_deadline` become Expired |
| Template and owner subscription expiry | 1 hour | Active to grace to expired |
| Renewal and campaign reminders | daily, 09:00 Myanmar Time | Sends the 7, 3 and 1-day notices |
| Ad statistics roll-up | daily, 00:30 Myanmar Time | `ad_events` into `ad_stats_daily` |
| Orphan media cleanup | daily, 02:00 Myanmar Time | Removes unreferenced R2 objects |
| Raw ad events purge | daily | Deletes `ad_events` older than 90 days |

### 16B.8 Security baseline

- RLS on every table; no table is readable or writable by the public except through a named view or function.
- Server-side role checks on every write; the client is never trusted for totals, prices, roles or dates.
- Stable error codes, translated on the client; no raw database errors reach the user.
- Rate limits on submissions, uploads and login. Secrets only in Worker and Supabase secrets, never in the repo or `VITE_` variables.
- No plaintext passwords anywhere in production: Admin and Owner creation use Supabase Auth invitations (`Doc/REMAINING-WORK.md`).
- Personal data kept to what a feature needs; the traveler's data is shared with an operator only for a booking the traveler made.
- Daily database backups with a tested restore.

### 16B.9 Environments and delivery

Three environments: local with a development Supabase project, staging, production. Every migration is committed under `supabase/migrations`, so a new project can be rebuilt from the repo. Every push runs typecheck, `npm test` and the production build. Deploys go through Cloudflare. Error tracking and an uptime check are set up before launch.

### 16B.10 Tests

Keep the pure-rule unit tests. Add: RLS tests per role for every new table; one end-to-end test per critical flow (submit and pay a rental, publish and schedule a blog post, serve and click an ad); and a Playwright or axe check of each new dashboard section.

## 16C. Remaining modules: the repeatable recipe (2026-11-22)

After the MH-owned modules, every other module is filled in one at a time with the same recipe, so each one is a copy of a pattern that already works.

### 16C.1 Order

| # | Module | Why in this place |
|---|---|---|
| 1 | Hotels | The most data and the full booking flow; it settles the universal booking and voucher work for everyone after it |
| 2 | Restaurants | Adds menus and price display modes |
| 3 | Cafes | Same shape as Restaurants |
| 4 | Attractions | MH-managed content with no Owner, so no subscription or commission |
| 5 | Markets | Same shape as Attractions |
| 6 | Book Shops | Owner catalog of products |
| 7 | Transport and local Bus | Static route and stop data; no seat booking |
| 8 | Nearby | Reads the listings built above; adds distance, open now and the map |
| 9 | Travel Plans | Custom-plan requests (`custom_plan_requests` exists) |
| 10 | Unified Search | Needs all listings and content to exist |

Ticketing and the Operator system follow in their own phase (the Operator system specification in section 9).

### 16C.2 Shared tables

- **`listings`** (ids stay as today, for example `lotte` or `pre1`, so links and tests keep working): `id`, `category`, `city_id`, `owner_id` (null for MH-managed), `name_mm`, `name_en`, `description_mm`, `description_en`, `address`, `latitude`, `longitude`, `open_time`, `close_time`, `checkin_time` and `checkout_time` (hotels), `price_display` (hidden / after payment / public), `price_from_mmk`, `price_from_usd`, `booking_flow_mode` (full_manual / instant), `status` (pending / active / suspended / retired), `rating`, `review_count`, `favorite_count`, `views`, `created_at`, `updated_at`.
- **Category detail tables** for what differs: hotel rooms, restaurant and cafe menus, book shop products, market stalls.
- **`listing_photos`** (`id`, `listing_id`, `key`, `position`) within the owner's Admin-set quota, stored in `shops/<shop-id>/`.
- **`bookings`** (exists): the universal booking with the section 6 flow. A listing's mode decides the path. **Full Manual:** requested → accepted → payment pending (12 hours) → paid → voucher → completed, with Expired and Cancelled; **Instant:** pay → voucher. Users cannot cancel; after full payment they may reschedule the date. The Owner's commission rate is snapshotted on each transaction (section 9).
- **`reviews`** (exists): a review requires a Completed booking or a recorded visit for that listing (section 11); repeated reports lower the rating and Admin can raise it again.

### 16C.3 The recipe for one module

1. Seed `listings` and the detail tables from the compiled catalog (`src/data/placeCatalog.ts`), keeping ids.
2. Admin and Owner management: create, edit, photo quota, price display, open times, approval (Owner edits go live after the first Admin approval, section 9).
3. Switch the module's pages from compiled data to Supabase queries, scoped by city and with real pagination.
4. Booking or contact CTA according to the listing's flow mode, with the voucher.
5. Reviews with the verification rule.
6. Add the module to the search index and to the notification events (new listing, booking status).
7. Tests: rules, RLS per role, one end-to-end booking, and the route and link tests that already run.

Acceptance for each module: pages read live data; an Owner changes only their own listing; a booking follows the listing's flow mode end to end; a review appears only after a verified booking; the module is searchable.

## 16D. Build roadmap and gates (2026-11-22)

Phases are ordered by dependency, with no calendar dates. A phase is finished only when its gate is met. Each phase ends with the `Doc/` update (what was completed and how it was built).

| Phase | Work | Gate |
|---|---|---|
| 0. Platform foundation | Migrations committed under `supabase/migrations`; real Auth with the first Super Admin (email and Google); roles on `profiles` and the server role helper; audit log standard; jobs runner; media Worker; notification service; exchange-rate service; translation fallback (section 16B) | Super Admin signs in, creates a Blog Post Admin, and the audit row and a notification appear; a failed job alerts Super Admin |
| 1A. Rentals | Section 8 end to end, including Rental Admin | Section 8 acceptance criteria all pass |
| 1B. Blog | Section 10 Blog end to end, including the R2 endpoint and scheduling | Blog acceptance criteria all pass |
| 1C. Travel Guide | Section 10 Travel Guide end to end, with the listing index seeded | Guide acceptance criteria all pass |
| 1D. Ads and Adsboard | Section 16A, starting with Home and `blog_inline`; can run beside 1C | Section 16A acceptance criteria all pass |
| 2. Listings and bookings | Section 16C in order: Hotels first, then the rest one by one, with reviews and search | Hotels pass the 16C acceptance, then each next module does |
| 3. Owner money and templates | Owner subscriptions, commission snapshots, wallets and twice-monthly payouts (section 9); template system (section 4) | A payout run is reproducible from ledger rows; a template switch and fallback work |
| 4. Ticketing and operators | Operator system specification (section 9) | Operator system acceptance (section 9) passes |
| 5. Mobile app | App using the same APIs, `serve_ad` with AdMob, push notifications | Same flows pass on a phone |
| 6. Launch readiness | Security review of RLS and Workers; load test of search and booking; backup restore drill; privacy policy and terms pages; error tracking and uptime check; contrast palette decision (`Doc/STATUS.md` §8); content seeding | Checklist signed off by the founder |

Dependencies to respect: the media Worker (Phase 0) before Blog, Guide and Ads uploads; the listing index before guide stops can use the database; the booking and voucher work in Hotels before any module after it; ledgers before payouts and before the operator settlement.

## 16E. Decision register: review after trying the product (2026-11-22)

The founder delegated these decisions to Claude and will review them after the modules are connected and used. Each row says where it lives and what changing it costs. Nothing here is final until the founder has tried it.

| # | Decision | Section | If changed |
|---|---|---|---|
| 1 | Card size: `md` default, `lg` / `xl` limits by column count | 4 | Done in code; a rule edit only |
| 2 | Load More: page size 12, shared helper | 4 | Done in code |
| 3 | Role names follow section 3; Admin form uses them | 3 | Done in code |
| 4 | One role-guarded admin workspace for the content roles | 3 | Menu and route changes |
| 5 | Rental follows the section 6 Full Manual flow; payment recorded by staff | 8 | Add a gateway later without changing statuses |
| 6 | Traveler must sign in to submit a rental | 8 | Allow guests: add phone verification and anti-spam |
| 7 | Yangon: motorbike and scooter removed | 8 | Data change in the availability matrix |
| 8 | Self-drive car retired; cars always with a driver | 8 | Set the category active again |
| 9 | Vehicle, bicycle and boat types are Rental Admin data | 8 | None; types are data |
| 10 | Rental price by city × category × variant | 8 | Drop city rows to return to one rate |
| 11 | 12-hour payment window; travelers cannot cancel; reschedule once, 24 hours ahead | 8 | Settings and one server rule |
| 12 | Rental voucher fills the 17 section 6 fields; printable page with QR | 8 | Voucher template only |
| 13 | Blog: 3 ad blocks per post, never first, never adjacent (as in code) | 10 | One constant |
| 14 | Blog captions bilingual; `galleryUrls` removed | 10 | Editor and reader field change |
| 15 | Missing language is auto-translated and queued for review | 10, 16B | Switch the reader to show the other language instead |
| 16 | Blog cards hide rating and distance when absent | 10 | Reader card change |
| 17 | Slug from English title, fixed after first publish | 10 | Allow redirects if titles must change |
| 18 | Scheduling entered in Myanmar Time, stored in UTC | 10, 16B | None |
| 19 | Guides are single-day now; `day_number` column ready | 10 | Add multi-day UI later |
| 20 | Guide author earnings paid on the 20th and 5th, no minimum, amount from a settings default | 10 | A setting and the payout rule |
| 21 | Guide earning amount kept in USD with the MMK paid recorded | 10 | Switch the stored currency to MMK |
| 22 | Ads: flat fee per campaign agreed by hand; no self-serve billing | 16A | Add billing tables later |
| 23 | Ads: Super Admin approves; AdSense fallback off until ids are set | 16A | Approval rule and Settings |
| 24 | Ads: impression counted after half the ad is visible for 1 second | 16A | One threshold |
| 25 | Ad creative limits: image 300 KB, video 3 MB and 15 s | 16A, 16B | Settings |
| 26 | Operator data stays in the operator system; MH keeps a minimal sale record | 9 | The record's columns |
| 27 | Tickets use the Instant flow; the traveler pays MH Travel; settlement twice a month | 9 | Direct settlement is a new flow |
| 28 | Seat hold lasts 10 minutes | 9 | One constant on both sides |
| 29 | Operator vouchers: fixed fields plus logo, colors, text and one of three layouts | 9 | Allow more layouts |
| 30 | Templates: 2,000 MMK for all categories; 7-day grace; Hotel first; launch with the default plus 3 paid | 4 | Price and counts are data |
| 31 | The "genuinely different" test: at least four of seven differences | 4 | The checklist |
| 32 | Audit log kept 24 months; notification retention 90 days | 16B | Settings |
| 33 | MMK shown rounded to the nearest 100; USD 2 decimals | 16B | One formatter |
| 34 | Module order: Hotels, Restaurants, Cafes, Attractions, Markets, Book Shops, Transport, Nearby, Travel Plans, Search | 16C | Reorder the list |
| 35 | Phase order 0, 1A–1D, 2 to 6 with gates | 16D | Reorder; gates stay |

**Facts only the founder can supply later** (not blocking any build step): the Travel Guide default per-post rate; the commercial terms of each ad campaign; the AdSense and AdMob account ids; the commission percentage and revenue-share formula for tickets (already left Admin-configurable in section 9); definitions of the "express" and "အာတာဖတ်" vehicles, which Rental Admin enters as data.

## Rentals UI reference provided by the user (2026-11-08)

- Source: https://drive.google.com/file/d/1CaeL6lpWMXGu29krPVJ8xXKreGs0l9qm/view?usp=sharing
- The reference uses a navy/cyan MH Travel page with a wide Shwedagon-at-sunset hero, ride icon, “Rentals” heading, “Rent your favorite ride in Myanmar” copy, bicycle/e-bike/motorbike/scooter/car options, and a “Browse Rentals” CTA.
- Below the hero: the original reference has a compact category selector for Bicycle, E-Bike, Motorbike, Scooter, Car with Driver, and Self-drive Car, plus a Search rentals input; a Popular Rentals horizontal row with six cards, rating and favorite affordances, daily pricing, and Rent Now actions; then a Safe & Reliable Rentals trust banner listing Well-Maintained, Affordable Price, and 24/7 Support. The user's later clarification expands the visible, directly filterable selector to include Bicycle, Motorbike, Car (with driver and self-drive), Camping Tent, Boat, Horse Carriage, E-Bike, Scooter, and other available Rentals categories, rather than hiding these behind View All.
- Desktop reference has a three-column footer, but the existing MH Travel rule remains authoritative: full footer only on Home; other pages retain the global copyright strip. On phones, keep the compact hero, three-column ride-category tiles, search, compact stacked/horizontal-swipe rental list, and the existing persistent five-tab bottom navigation.

- Data integration: preserve `POPULAR_RENTALS` unchanged for Home and City; build a Rentals-page catalog that reuses stable IDs `pre1`–`pre5` and adds unique `pre6`–`pre10`. Rentals favorites resolve in Favorites and Account while existing Home/City rows remain unchanged.


## 18. Dashboard implementation record — 2026-11-10

This section records the dashboard work completed from the supplied visual references and the follow-up Super Admin requests. These are frontend implementations and are intentionally distinguished from the backend provisioning work that remains.

### Super Admin Dashboard

- The standalone `/super-admin` dashboard was redesigned around the supplied MH Travel control-center reference: dark navy/cyan shell, responsive sidebar, hero banner, platform KPI cards, analytics, service distribution, quick actions, recent bookings, popular cities, and recent users.
- A backward-compatible redirect was added for legacy blog card URLs so `/blogs/:storyId` redirects to the implemented `/blogs?story=<slug>` reader format.
- The dashboard keeps the standalone Admin Login boundary, visible logout, Burmese/English toggle, theme toggle, mobile navigation, and existing protected Super Admin route behavior.

### Ads Management

- Super Admin now has a dedicated `Ads Management` sidebar section and a `Manage Ads` Quick Action.
- The Ads console includes active-campaign, placement, impressions, and CTR summary cards; campaign inventory; advertiser and placement columns; Live/Paused status; preview/edit/pause controls; Admin Ads priority; auto-pause expired ads; creative approval; and placement-health indicators.
- It reuses the repository's existing mock Admin Ads placement vocabulary and remains frontend/local state until ad campaigns, budgets, scheduling, creative storage, reporting, and AdSense/AdMob fallback are connected to Supabase or an ad provider.

### Shop Owner creation and dashboard

- Super Admin has a dedicated `Shop Owners` section and a `Create Shop Owner` Quick Action.
- The Shop Owner form collects owner name, shop/business name, email, phone, city, business category, login username, and temporary password. A Generate username + password action can create lowercase username credentials and a temporary password; new records appear as `Pending`, with a review action and separate owner/shop/username/city/category/status columns.
- After creation, the generated username and temporary password are shown once in a credential notice so Super Admin can securely deliver them to the owner. The account list never displays the password.
- In the local preview auth flow, Create Shop Owner also persists an `owner_admin` account in the shared auth store. The Admin Login portal accepts that username/password and redirects the authenticated Owner Admin to `/shop-owner`; the protected route rejects travelers and unauthenticated visitors.
- The frontend Shop Owner dashboard is available at `/shop-owner` and follows the supplied Royal Myanmar Restaurant reference: verified business profile, welcome hero, bookings/orders/reviews/revenue KPI cards, booking statistics chart, popular menu items, recent bookings, quick actions, responsive owner sidebar, mobile menu, notifications, and owner workspace sections.
- The Super Admin Shop Owners table includes a `Preview dashboard` action that opens `/shop-owner`.
- The `/shop-owner` route is protected for the local `owner_admin` preview role. Production still needs real Owner Admin Supabase authentication, secure invite/password-reset delivery, credential hashing, and shop ownership records.

### Admin Management
- Super Admin now has a dedicated `Admin Management` sidebar section and a `Create Admin` Quick Action.
- The Admin Management form collects admin name, work email, phone, admin role, and permission group. Supported frontend role choices are Content Manager, Support Manager, Operations Admin, Finance Admin, and Ads Manager.
- The page includes total-admin, active-admin, pending-invite, and permission-group summaries; an admin account table; role/permission/status display; review actions; audit-log entry point; invite-created local state; and a clear separation between platform Admin roles and Shop Owner accounts.
- Current Admin creation is a frontend/local-state invitation workflow. Production work must add Supabase Auth invitations, an explicit role enum, permission/group tables, RLS policies, invite acceptance, password setup, status transitions, audit logs, and route guards.
### Blog Post Management
- Super Admin now has a dedicated `Blogs` navigation view and the existing `Add Blog` Quick Action opens a bilingual Blog Post editor instead of a placeholder notification.
- The editor captures English/Myanmar title, excerpt, and body, category, author, location, cover image URL, internal SEO tags, publishing status, and schedule time. It supports Save Draft, Publish Post, Schedule Post, edit, preview, search, status filters, and Published/Draft/Scheduled inventory summaries.
- Published posts, drafts, and scheduled posts are currently frontend/local preview state seeded from the existing `BLOG_POSTS` data. Production still needs Blog Post tables, media storage, authorization, scheduling workers, moderation/audit history, and a public query/cache path for new posts.
### Routes, validation, and delivery

- `src/App.tsx` now includes the `/shop-owner` route, and `public/manus-routes.json` is synchronized with it.
- The implementation uses the existing Vite + React + TypeScript + Tailwind stack and existing local image assets; no new external assets or secrets were added.
- The dashboard work passed `npm run typecheck`, `npm run build`, and `npm run lint` with no errors. Existing lint warnings, Browserslist freshness warnings, and bundle-size warnings remain non-blocking.
- GitHub delivery commits for this dashboard sequence are: `420f69f` traveler dashboard refinement, `16d7362` Ads Management, `07d13fa` Shop Owner creation, `b541cfc` Shop Owner dashboard, and `ee684e4` Admin Management.

### Super Admin Blog category and Cloudflare R2 media update — 2026-11-14
- Blog Post Editor now lets Super Admin add a new category during post creation. Category names are normalized to safe slugs, duplicate names are rejected, and the new category is selected immediately for the current editor session.
- Cover images now accept JPEG, PNG, and WebP uploads. The browser validates the file type and original size, resizes the longest edge to at most 1600px, converts the image to WebP, and repeatedly compresses it to a maximum of 450 KB before upload.
- `src/lib/blogMediaApi.ts` sends the compressed file as multipart form data to `VITE_BLOG_MEDIA_UPLOAD_ENDPOINT`, with `folder=blog-posts`. The expected endpoint returns the durable Cloudflare R2 URL and object key; the editor stores that URL in the Blog Post cover-image field and reports the final KB size.
- When the upload endpoint is not configured, the editor uses a local data-URL preview fallback so design testing remains usable. Production still requires the Cloudflare Worker/Pages Function endpoint, R2 binding, authenticated Super Admin authorization, object-key sanitization, content-type/size validation, and the public URL/CDN policy.

### Blog post cover and gallery photo support — 2026-11-14
- A Blog Post now supports one required Cover Photo plus multiple Additional Photos. Additional photos can be selected in one multi-file picker, previewed as thumbnails, and removed individually before saving.
- Every gallery image uses the same media pipeline as the cover: type/original-size validation, longest-edge resize, WebP conversion, compression to the configured size limit, and upload under the `blog-posts` folder through the R2 media endpoint.
- The local preview post model now carries `galleryUrls[]`; production Blog Post persistence must store ordered gallery media rows separately from the cover URL so public article rendering can preserve the selected order.

### Compact inline Blog story composer and date/time scheduling — 2026-11-14
- Replaced the large body text fields with a compact story-flow composer made of bilingual text blocks and image blocks. Super Admin can insert a photo between text blocks, add another text block after it, reorder by composing the flow, and remove either block.
- Cover Photo, Additional Photos, and Inline Story Photos all use the existing resize/WebP/compression/R2 upload pipeline. The local preview model now stores ordered `blocks[]` in addition to `galleryUrls[]`.
- Replaced free-typed schedule datetime text with native calendar date and clock time controls. A Scheduled post requires both values; Draft and Published posts remain compact.
- The editor spacing, input heights, modal width, table density, summary cards, thumbnail sizes, and action buttons were reduced to avoid oversized boxes while preserving responsive mobile behavior.
- Production still needs the public Blog reader to render ordered text/image blocks and the database schema to persist block order and media metadata.

### Super Admin compact density pass — 2026-11-14
- Reduced the Super Admin shell footprint with a narrower desktop sidebar, shorter header, tighter navigation rows, smaller main-page padding, and compact mobile menu buttons.
- Reduced Overview hero height, KPI card height/padding/icon size, chart height, distribution panel footprint, Quick Action tiles, panel headers, table cell padding, and common panel radius while retaining all dashboard content and controls.
- Applied the same density direction to the existing Shop Owner, Ads, Admin Management, and generic Admin section cards/forms where they share the Super Admin layout, so the dashboard uses less vertical space without hiding data.

### All admin dashboards second compact pass — 2026-11-14
- Further reduced the Super Admin, Shop Owner, and Admin Management experiences together so their density feels consistent rather than compacting only one role.
- Shop Owner now uses a narrower sidebar, shorter header, smaller verified-business profile, shorter welcome hero, smaller KPI cards, shorter chart, tighter tables, and compact quick actions/forms.
- Super Admin Admin Management and Shop Owner management forms now use smaller inputs, labels, gaps, buttons, summary cards, credential notices, and table rows.
- All existing content, actions, responsive behavior, and route protection remain unchanged.

### User Dashboard compact density pass — 2026-11-14
- Reduced the traveler User Dashboard shell width/padding, sidebar width, profile spacing, navigation rows, welcome banner, stat cards, booking/activity panels, quick actions, discovery banner, wallet/message/settings cards, and secondary view containers.
- Preserved all dashboard content, navigation actions, favorite flows, booking controls, responsive mobile behavior, and footer content while using less space.

### Site-wide right-click and zoom interaction guard — 2026-11-14
- Added a global interaction guard that prevents the page context menu, Ctrl/Cmd zoom shortcuts (`+`, `-`, `0`), and Ctrl/Cmd + mouse-wheel zoom gestures while the site is open.
- Added a mobile viewport scale restriction (`maximum-scale=1`, `user-scalable=no`) as a best-effort prevention for pinch zoom on supported browsers.
- Browser menus/settings and browser-level zoom remain outside website control; users can still change zoom through browser UI or accessibility tools.

### All dashboard third compact-density pass — 2026-11-14
- Further reduced Super Admin/Admin shell and hero heights, sidebar/header widths, KPI/chart heights, quick-action tiles, form spacing, and table density.
- Further reduced Shop Owner sidebar/header, welcome hero, KPI cards, booking chart, quick actions, tables, and form/card padding.
- Further reduced User Dashboard max width, outer/sidebar spacing, welcome/discovery hero heights, stat cards, panels, and quick-action tiles.
- Kept all dashboard content, actions, route protection, responsive behavior, and mobile navigation intact.

### Dashboard footer/copyright compact pass — 2026-11-14
- Reduced Super Admin and Shop Owner custom copyright footer boxes to short, low-padding rows with smaller logo/social elements.
- Reduced the shared public Footer and PageCopyright height/padding used below the User Dashboard so the copyright area no longer consumes a large block.
- Further tightened Super Admin/Admin, Shop Owner, and User shell/hero/chart/action spacing while preserving all dashboard content, controls, route guards, and responsive layouts.

### Dashboard social footer simplification — 2026-11-14
- Dashboard copyright areas now show only two compact social markers: Facebook and YouTube.
- Added a reusable `DashboardCopyright` component for the User Dashboard so its footer is a short copyright row rather than the full public-site footer.
- Removed the extra Telegram/Viber-style social markers from the Super Admin footer while preserving the copyright text and responsive layout.

---

## Consolidated source: Plan folder overview

ဒီ folder သည် MH Travel platform အတွက် လုပ်ဆောင်ပြီးသမျှ အလုပ်များ၊ ဆုံးဖြတ်ချက်များ၊ Backend schema နှင့် ဆက်လုပ်ရန်ကျန်သောအချက်များကို မှတ်တမ်းတင်ထားသော note folder ဖြစ်သည်။ ယခု `Plan/PROJECT-PLAN.md` သည် product roadmap၊ implementation worklog နှင့် technical handoff notes အားလုံးကို စုစည်းထားသော authoritative file ဖြစ်သည်။

## Note files

- [`WORKLOG.md`](./WORKLOG.md) — UI pages၊ visual refinements၊ routes၊ authentication၊ Super Admin နှင့် Supabase schema အပါအဝင် ပြီးစီးထားသောအလုပ်များ။
- [`BACKEND-AUTH.md`](./BACKEND-AUTH.md) — Supabase Auth၊ `public.profiles` table၊ roles၊ RLS၊ username logic နှင့် Google/Facebook OAuth setup အခြေအနေ။

## Current implementation status

လက်ရှိ project သည် Vite + React + TypeScript + Tailwind ဖြင့် တည်ဆောက်ထားပြီး dark theme ကို အခြေခံထားသည်။ Burmese/English translation system၊ currency/theme hooks၊ shared listing cards နှင့် responsive mobile sidebar တို့ကို ဆက်လက်အသုံးပြုထားသည်။

Traveler Web နှင့် Admin Portal ကို သီးခြားခွဲထားသည်။ Traveler user များသည် website ၏ pages အားလုံးကို အသုံးပြုနိုင်ပြီး Super Admin သည် dedicated Admin Login နှင့် dashboard ကိုသာ အသုံးပြုသည်။ Super Admin အတွင်း Ads Management၊ Shop Owner creation၊ Admin Management နှင့် `/shop-owner` frontend preview dashboard တို့ကိုလည်း မှတ်တမ်းတင်ပြီး implementation ပြီးစီးထားသည်။

Supabase project ထဲတွင် account profiles table၊ username uniqueness၊ role checks၊ signup trigger၊ core travel data tables နှင့် RLS policies များကို SQL migrations ဖြင့် တည်ဆောက်ပြီးဖြစ်သည်။ Core tables တွင် favorites၊ custom plan requests၊ bookings၊ notifications၊ reviews၊ ads နှင့် admin audit logs ပါဝင်သည်။ Frontend တွင် Supabase session, email signup/login, logout နှင့် Google/Facebook OAuth calls ကို ချိတ်ပြီးဖြစ်သည်။ Plan folder ထဲတွင် SQL source မဟုတ်ဘဲ ထို backend/OAuth work ၏ implementation record နှင့် လက်ရှိအခြေအနေကိုသာ ထားထားသည်။ Provider Client ID/Secret များ ထည့်ရန်နှင့် core forms များကို tables သို့ ချိတ်ရန်သာ ကျန်ရှိသည်။

## Important current limitation

Frontend auth UI သည် local preview session store ကို အသုံးပြုနေသေးသည်။ Supabase `public.profiles` schema နှင့် RLS ကို တကယ်တည်ဆောက်ပြီးဖြစ်သော်လည်း Supabase Auth session၊ username lookup/login၊ Google OAuth၊ Facebook OAuth၊ `owner_admin`/scoped admin roles နှင့် dashboard form persistence/invitations များကို production အဖြစ် ချိတ်ဆက်ရန် ဆက်လုပ်ရမည်။

---

## Consolidated source: Supabase backend and authentication handoff

## Supabase project

- Project name: `mhtravelmm`
- Project ref: `ewuvxowujkbyvftoihxh`
- Region: `ap-southeast-1`
- Status at setup: `ACTIVE_HEALTHY`

## Applied migrations

### `create_user_profiles_and_auth_policies`

Created `public.profiles` with a foreign key to `auth.users(id)`, unique username support, display name, role, avatar URL, and timestamps. Enabled Row Level Security and added own-profile plus Super Admin policies. Added an `auth.users` insert trigger that creates a profile automatically after signup and derives a username from signup metadata or email when needed.

### `allow_super_admin_role_management`

Updated the role protection trigger so travelers cannot escalate themselves, while a verified Super Admin can change roles through an authorized backend/admin operation.

### `create_core_travel_data_and_rls`

Created RLS-protected `favorites`, `custom_plan_requests`, `bookings`, `notifications`, `reviews`, `ads`, and `admin_audit_logs` tables. Added ownership/admin policies, status and data checks, UTC timestamps, update triggers, indexes, and a public active-ad read policy. The schema matches the current Favorites, custom-plan quotation handoff, rentals/ticket bookings, notifications, reviews, and Super Admin Ads/Audit roadmap.

### `harden_core_rls_helper_and_indexes`

Moved the new admin-role helper into the non-exposed `private` schema, optimized the new policies to evaluate auth context once per query, and added indexes for the Ads and audit-log foreign keys. No Edge Functions were deployed because the current frontend has no defined function contract yet.

The Plan folder intentionally stores only this implementation record, not the SQL source. The SQL was applied directly to the Supabase project through the four migrations above.

## Roles

The profile role check currently allows:

- `traveler`
- `super_admin`
- `ads_admin`
- `admin`
- `rental_admin`
- `payment_admin`
- `travel_guide_admin`
- `blog_admin`
- `owner_admin`

Traveler accounts remain distinct from admin and owner accounts. A person who uses MH Travel as a traveler and also manages a business must have a separate owner/admin account.

## Current RLS behavior

A signed-in traveler can read and update their own profile fields. The profile role cannot be changed by a traveler. Super Admin access is checked through the `public.is_super_admin()` security-definer function. Super Admin policies allow management of profiles and roles. The profile table is protected by RLS and is not open for anonymous reads.

## Signup metadata expected by the trigger

The signup request should send metadata similar to:

```json
{
  "username": "aung_aung",
  "display_name": "Aung Aung",
  "avatar_url": "https://..."
}
```

The trigger uses `username` first. For OAuth signups, if a username is not supplied, it derives a safe username from the OAuth profile/email and the app should send the user through a username-completion step before using the account fully.

## Required frontend integration next

The UI now uses Supabase directly whenever the Supabase environment is configured. Admin Login does not fall back to the local preview account in that mode. The connected project must contain a real Supabase Auth user with a linked `public.profiles` row whose role is `super_admin`.

Current frontend integration:

1. `supabase.auth.signUp` now sends username/display name metadata;
2. `supabase.auth.signInWithPassword` now handles configured email/Gmail login;
3. a secure username-login resolver is still needed so the browser does not expose private account email addresses;
4. `supabase.auth.onAuthStateChange` now hydrates the shared app session;
5. the matching `public.profiles` row is loaded after authentication;
6. the profile role protects `/super-admin`;
7. `supabase.auth.signOut()` is used for both traveler and admin logout;
8. Google and Facebook buttons now call `supabase.auth.signInWithOAuth` with the Login callback route.
9. Admin Login calls `supabase.auth.signInWithPassword`, verifies the linked profile role, and rejects accounts without `super_admin`.

## OAuth setup still required

Google and Facebook buttons are present in the Signup UI, but they are not production OAuth yet. The owner must configure these providers in Supabase Auth with:

- Google OAuth Client ID and Client Secret;
- Facebook App ID and App Secret;
- production callback URL(s) shown by Supabase;
- local development callback URL if local testing is needed.

No OAuth secrets belong in the Git repository or in frontend source code.

Facebook App credentials were provided during setup, but they were not entered because Supabase Dashboard login required a manual hCaptcha step. Provider configuration is deferred until the owner resumes the dashboard login. The supplied secret is intentionally not recorded here.

## Account creation note

The first Supabase Auth account was created through the Dashboard and its linked profile was promoted to `super_admin` through a one-time SQL role update. The account email still needs to be confirmed in Supabase Auth before password login can succeed if email confirmation is enabled. Never insert a fake `auth.users` row directly into the database.

---

## Consolidated source: Daily development record — 8 November 2026

**Date:** 8 November 2026
**Scope:** Favorites real-time behavior and Ticketing flow completion

## 1. Favorites page improvements

The Favorites page was enhanced with a category-based browsing experience. Users can now switch between `All`, Blogs, Travel Plans, Guides, Hotels, Restaurants, Book Shops, Rentals, Transport, Cafes, Markets, and Attractions. Each category displays only the currently saved items and shows its live saved-item count. Burmese and English labels were added for every category and supporting count text.

The Favorites page now reads the shared Favorites context directly. When a user unsaves a card, it immediately disappears from the active category and the `All` and category counts update without a refresh or route change.

The shared Favorites provider was also strengthened for newly added favorites. It now broadcasts a same-tab change event and listens for browser `storage` events. As a result, saving a card from another page updates an already-open Favorites page immediately, and separate browser tabs remain synchronized. Existing localStorage persistence remains in place.

## 2. Ticketing page improvements

Ticketing continues to use the compact two-step flow: users first choose a ticket category and search criteria, then select a result before the detailed booking controls appear.

The service preview data now includes explicit route and cinema-venue metadata. Bus and Train searches use the selected departure and destination cities to match results. Cinema searches use the selected cinema venue. If the local preview data has no exact mock result for a chosen combination, the category results remain visible as a safe fallback instead of producing a blank unusable page.

The booking actions for Train, Events, and Cinema were completed. The previous non-functional generic `Book now` button now advances to the existing order-confirmation state. Cinema still requires the selected seat count to match the passenger count before the button is enabled. Train and Event orders can continue after selecting a service. Bus keeps its existing validation for passenger count, nationality, departure time, boarding point, drop-off point, and seat selection.

The confirmation state now works for every ticket category supported by the preview flow. The existing backend/API limitation remains: real operator inventory, seat locking, payment, and final booking persistence still need Supabase or provider API integration.

## 3. Documentation and validation

The main implementation worklog was updated with the Favorites category filters, immediate unsave behavior, same-tab and cross-tab new-save synchronization, Ticketing result matching, and completion of non-bus booking actions. The Favorites route is now documented as a live categorized page rather than a placeholder.

Validation completed successfully:

- TypeScript typecheck: passed
- Vite production build: passed
- Git diff whitespace check: passed

The browser compatibility warning about an outdated `caniuse-lite` database is non-blocking and does not affect the build result.

## 4. Git delivery

The session changes were committed and pushed to the GitHub `main` branch.

- Favorites category and live unsave update: `ca045df`
- New Favorite same-tab/cross-tab synchronization: `a1876af`
- Ticketing completion, route/venue result matching, and daily documentation: `d1bf75a`

## 5. Remaining backend work

The current Ticketing flow is a complete frontend preview and order handoff. The next production step is to connect ticket inventory, seat availability/locking, booking records, payment or contact handoff, and confirmation persistence to the backend. Supabase OAuth provider setup remains an external dashboard configuration task.

---

## Consolidated source: Daily development record — 9 November 2026

**Date:** 9 November 2026
**Scope:** Travel Guide and Search placeholder completion

## Completed

- Replaced the `/travel-guide` placeholder with a bilingual Travel Guide listing using the existing compact `ListingCard` design and shared favorite behavior.
- Added `/travel-guide/:id` detail routing with guide photography, rating, distance, location, itinerary highlights, descriptive copy, and related guide cards.
- Replaced the `/search` placeholder with an app-wide search page covering Travel Plans, Travel Guides, Blogs, and Popular listings.
- Added category filters for All, Plans, Guides, Blogs, and Popular, plus a clearable search field and bilingual empty/result states.
- Added all new Burmese/English translations to the shared i18n dictionary.
- Updated the consolidated plan so both features are no longer recorded as placeholders.

## Validation

- TypeScript typecheck passed.
- Vite production build passed.
- Git diff whitespace check passed.
- The existing Browserslist `caniuse-lite` freshness warning is non-blocking.

## Remaining production integration

Search currently searches the frontend catalog data. Travel Guide content and Search indexing should later connect to Supabase/Admin-managed content tables when those backend tables are provisioned.

---

## Consolidated source: Implementation worklog

## 1. Product foundation and visual direction

- Project stack is Vite, React, TypeScript, Tailwind CSS, React Router, Lucide icons, and custom Language/Currency/Theme hooks.
- Base visual direction is a dark travel platform UI with blue accents, red action/price accents, compact cards, responsive layouts, and bilingual Burmese/English text.
- Shared listing/content cards are designed to show rating, distance, favorites, and views.
- Home uses the full footer; inner pages use the copyright-only footer.
- Mobile header keeps Menu, MH Travel, Search, and Notifications; account access is placed in the mobile sidebar footer.
- Mobile sidebar uses a partial-width drawer and renders fixed overlays through a portal.
- User-provided visual references are followed for Home, restaurant, bookstore, compact travel cards, and the `/cities` discovery sections.
- Generic page hero banners now share the `mh-page-hero` utility: 190px on phones, 230px from the small breakpoint, and 250px from the medium/web breakpoint. City, Nearby, Rentals, Ticketing, Travel Plans, Travel Guide listing, Blogs, and Account overview use this same size; content styling and imagery remain page-specific. Restaurant/Book Shop and Travel Guide article heroes remain content-heavy detail headers rather than catalog banners.
- Header Search now hands its query to `/search?q=...`; the Search Results page no longer renders a second search input. Results are filtered in-place with small, non-scrolling category chips including All, plus city chips such as Yangon, Naypyidaw, Mandalay, and Bagan. Category terms such as restaurant automatically match the relevant catalog group while city terms such as Yangon show the matching city catalog.
- Search city matching was corrected so a Yangon query returns every Yangon-related catalog card across categories, not only cards whose title contains the word Yangon. Other city cards are no longer mislabeled as Yangon, and Burmese queries such as `ရန်ကုန်` and `စားသောက်ဆိုင်` are normalized to the same English search groups and city filters.
- Search category results now show compact city chips directly beneath the category chips without the redundant `By city` label. The city row includes Yangon, Bago, Naypyidaw, Mandalay, and Bagan; hotel and restaurant mock results carry city metadata so selecting Yangon or Bago filters the category cards in place.
- Search semantics were refined: a city-only query such as `ရန်ကုန်` returns every Yangon category card; a category-only query such as `Hotel` returns city cards only; and a combined query such as `ရန်ကုန် ဟိုတယ်` returns only Yangon hotel cards. City-only results expose only `Top rated` and `Nearby` sort controls.
- Category city boxes now drill into the selected city’s category cards. Thus `Hotel` first shows city boxes, selecting Yangon shows Yangon hotels, and the selected-city category list also exposes `Top rated` and `Nearby`; `ရန်ကုန် ဟိုတယ်` opens directly in that same hotel result mode.
- City-only results now show a complete compact filter row: All, Top rated, Nearby, Hotels, Restaurants, Book Shops, Cafes, Rentals, Attractions, and Markets. Selecting a category limits the cards to that category within the searched city; All restores every listing in the city.
- Category-only searches such as `Hotel` now use one row with fixed `All`, `Top rated`, and `Nearby` controls followed by rotating city chips. The city chip window advances every 10 seconds while the three fixed controls remain stationary; selecting a city opens that category’s listings for the selected city.
- Combined city/category searches such as `ရန်ကုန် ဟိုတယ်` now include a fixed `All` control alongside `Top rated` and `Nearby`. Hotel cards carry currency-aware nightly price badges in addition to the shared rating, distance, view count, favorite, and title metadata.
- EN/MM coverage audit completed and closed 22 November 2026: traveler-facing routes, the shared traveler shell, both owner dashboards, the full Super Admin dashboard and both content editors consume the language context. The last English-only screens were `BlogPostsPanel.tsx` and `TravelGuidesPanel.tsx`; their publish checks and media errors now return codes that the editor translates, so the same rules serve both languages. What remains is backend translation storage, not UI coverage.
- City discovery rows were corrected from six to a five-card width cap (`columns={5}`, a width-capped flex row rather than a five-column CSS grid) because each City catalog currently contains five cards. Restaurants, Book Shops, Rentals, Hotels, Attractions, Transport, Cafes, and Markets now fill the available row width without an empty sixth-column gap.
- Mobile drawer order was corrected to follow the intended phone flow: Navigate links, Favorites and display controls, Help & Support, Content/contact, payment/download sections, Legal, then copyright. The duplicate MH Travel tagline block and duplicate Account/Login action were removed because the fixed phone header and bottom navigation already provide those destinations. Notifications remain in the phone header and are not duplicated in the drawer.

## 2. Completed traveler-facing pages

### Home

- Home page includes categories, travel plans, travel guide, blogs, popular hotels/listings, reviews, awards, partners, ad slots, and full footer sections.
- Travel Guide and Popular cards were resized and aligned to the compact shared card system.
- Local Myanmar photography is used across Travel Plan, Travel Guide, Blog, and Popular cards.
- Home ad positions use the shared `AdSlot` component and collapse when no ad is available.

### Cities

- City page now has a persistent visible bilingual hero banner with Shwedagon imagery, city discovery copy, and an Explore cities anchor CTA. It no longer depends on the optional `city_hero` ad response to show its page hero.

### Blogs

- Bilingual blog listing and article reader are implemented in `src/features/blogs/BlogsPage.tsx`.
- Compact image-led cards replaced oversized story panels.
- User-facing categories, tags, breadcrumbs, and unnecessary oversized intro panels were removed from the blog listing.
- Articles open inside the same web app with shareable `?story=` URLs; they are not displayed as a separate paper-like page.
- Favorite, share, view count, rating, and distance display are supported.
- Distance is shown only after browser geolocation permission is granted.
- A compact listing banner is shown where the removed intro text used to be.
- Related stories are shown below an article before related hotels.
- Blog post ads are supported through shared ad slots.
- All blog labels, reader labels, and actions support Burmese/English.

### Travel Plans

- Search, duration filter, sorting, compact route cards, price display, and favorite toggles are implemented.
- Added a bilingual page-level Travel Plans hero banner with Bagan sunrise imagery, compact dark/cyan overlay styling, a browse-plans CTA, and a direct anchor to the plan results.
- Custom Plan builder lets users choose starting point, destinations from MH Travel data, days, travelers, nationality, budget, transport, accommodation, hotel choice, and notes.
- Hotel selection can be left for later.
- Custom Plan requests describe the MH Travel quotation flow: MH Travel reviews the request, calculates the cost, contacts the user, and negotiates destinations/services.
- The page intentionally avoids the removed large intro/filter copy and ends with the detailed custom-plan builder.

### Nearby

- Location-aware Nearby page includes search, category grouping, rating filters, distance filters, closest results, and recommended higher-rated results.
- Location permission state is handled explicitly; fallback messaging exists when location is unavailable.
- Nearby Categories now uses the same compact Home Categories visual system: 36px icon circles, 64px item width, 16px icons, 8px labels, shared 22-second marquee animation, hover pause behavior, and the same duplicated continuous-scroll pattern. Nearby retains its own All/category filtering and active-state behavior.
- Removed the unnecessary Nearby location/search control panel from the rendered page. The page now moves from the hero directly to Categories; category filtering, quick filters, geolocation distance calculation, and result cards remain available.

### Account and Notifications

- Traveler Account Dashboard includes overview, bookings, custom plans, favorites, reviews, messages, settings, support/legal, recent activity, and logout.
- Account logout now clears the shared session/local storage state and redirects to `/login`.
- Notifications has a full page, read/unread filters, and account activity integration.

### Restaurants and Book Shops

- Restaurant detail page follows the supplied layout reference while preserving the MH Travel shell.
- Restaurant detail includes hero, info row, map/amenities, menu tabs, dishes, reviews, venue photos, nearby attractions, and CTA.
- Book Shop detail page follows the supplied reference layout with services, photos, popular books, nearby attractions, and CTA.

### Rentals

- `/rentals` now uses a full bilingual city-first rental order flow instead of the earlier generic request-card design.
- The user first chooses the rental city. Yangon, Bagan, Mandalay, Inle Lake, and Ngapali have different available categories and different MH Travel branch pickup options.
- After choosing a city, the user chooses the rental type: motorbike, bicycle, car, horse carriage, camping tent, motorboat, or travel guide where available.
- The user must choose a start date at least one day in advance, customer type (Myanmar citizen or foreigner), rental duration, and a phone number.
- The user can choose delivery to a location or pickup from the selected city's MH Travel branch. Delivery address and branch are validated before order submission.
- Motorbike and bicycle share the simple self-drive style flow. Cars use a separate flow with passenger count and a clear MH Travel vehicle/driver confirmation note.
- The UI calculates an estimated total from city-available category rates, customer type, and number of days, then sends an order request for MH Travel follow-up.
- After submission, the page confirms that MH Travel will call the provided phone number. This is a quotation/order handoff UI until the booking backend is connected.
- The large Rentals heading/intro and the visible Rental Admin label were removed; the top position now uses the shared collapsible `AdSlot` banner pattern.
- Car rental now has a dedicated vehicle-type step with family car (4–5 seats), 35-seat minibus, and 45-seat bus options. Each vehicle type has its own local/foreigner rate and is priced before the order is submitted.
- The separate City, Rental Start Date, and advance-booking notice panel was removed from the page top and moved into the `Order details` panel, so the order form owns those inputs.
- Rental type cards now include compact destination photography thumbnails while retaining the city-specific availability and selection behavior.
- The removed Rentals intro copy was cleaned from the rendered header path and legacy translation values were changed to ad wording so the old `MH Travel Rental / Rent what your journey needs / Managed by Rental Admin` block cannot reappear from a stale route reference.
- Rental card rates and the order estimate now use the shared `useCurrency().formatPrice()` formatter instead of hard-coded `$` strings, so the page follows the app-wide MMK/USD currency toggle.
- Manual `Number of days` selection was removed from Rentals. Users now choose Start date and End date, and the page derives the inclusive rental duration automatically. Order details now asks for Participants instead of a day count. Cars still enforce an End date at least one day after the Start date (minimum 2 rental days); other rental types can use a same-day range for 1 day.
- The Rentals top advertisement is now a visible compact banner rather than a development-only `AdSlot` placeholder that collapsed when no backend creative was returned. It keeps the `rentals-top` placement marker for later Admin Ads integration.

### Ticketing

- `/ticketing` now uses a bilingual city/township-first booking hub instead of a generic route-only search.
- All Ticketing categories remain visible in the UI: Bus, Train, Events, and Cinema. The user selects a category and the page filters results to the closest matches for the selected cities, venue, date, and service.
- Bus flow asks for from city/township, to city/township, bus line, date, passenger count, boarding point, drop-off point, and seats.
- Train flow asks for from city/township, to city/township, train line, date, and passenger count.
- Bus seat selection is shown as a compact seat grid and the selected seats plus boarding/drop-off points are summarized in the side panel.
- Results use the shared currency formatter, operator cards, route/venue summaries, times, remaining-seat information, and category-specific continuation actions.
- The page keeps live availability and seat-map handoff messaging. Real operator availability and seat locking remain a backend/API integration step.
- Bus, Train, Event, Cinema, city, venue, boarding, drop-off, and seat labels support Burmese/English.
- Ticketing was refined to a two-step flow: the first step only searches the route or venue; the second step opens after selecting a result.
- Bus search now starts with departure city and destination city. After a bus line is selected, boarding point, drop-off point, and seat selection are shown.
- After a bus line is chosen, the booking panel asks for passenger count, Myanmar citizen/foreigner, departure time, boarding location, drop-off location, and seats. The Order button stays disabled until the selected seat count matches the passenger count, then shows an MH Travel order confirmation.
- Valid bus orders now open a dedicated Order Confirmation screen instead of only an inline success message. It shows an order number, order status, route, bus line, departure date/time, passenger count, customer type, boarding point, drop-off point, selected seats, estimated total, and MH Travel follow-up guidance.
- Cinema search starts with city and cinema name; after a cinema result is selected, the user chooses Movie 1 or Movie 2, Hall 1 or Hall 2, and then seats.
- The initial search remains compact for every category: detailed boarding, hall, and seat fields appear only after the relevant result is chosen.
- Ticketing services now carry route/venue metadata. After searching, Bus and Train results match the selected departure/destination pair, while Cinema results match the selected cinema; when the local preview has no exact mock match, the category results remain available as a fallback rather than showing a broken blank state.
- Train, Event, and Cinema booking actions now advance through the same confirmation state instead of leaving a non-functional `Book now` button. Cinema keeps seat-count validation, while Train/Event can continue after selecting a service; all booking buttons show disabled styling until their required selection is valid.

## 3. Shared Favorites behavior

- Added a shared Favorites provider with localStorage persistence so favorite overrides survive route changes and page refreshes.
- Home listing cards, Travel Plans, Nearby, related hotels, and Blog posts now read/write the same favorite state instead of maintaining page-local heart state.
- Restaurant and Book Shop detail-page save buttons use the same shared IDs as their listing cards, so saving from a detail page is reflected on cards and in the Account area.
- Account Favorites now aggregates the app's listing collections and shows only currently saved items, with a Burmese/English empty state.
- The current store is frontend-persistent; Supabase user-scoped favorites rows remain the next backend integration step.
- ListingCard now falls back to the shared store when a page omits an explicit callback, fixing non-responsive small heart boxes on pages such as City listings.
- Completed a second Favorites audit: ListingCard now reads the shared state for its filled/unfilled icon even without a page callback, and Header/Mobile Menu Favorites icons now open a real synchronized `/favorites` page instead of a placeholder.
- Favorites page now includes an `All` tab plus grouped filters for Blogs, Travel Plans, Guides, Hotels, Restaurants, Book Shops, Rentals, Transport, Cafes, Markets, and Attractions. Each tab shows its saved-item count and only the user's saved items; all labels support Burmese/English.
- Favorites now reads the shared Favorites context directly for live state. Unsaving a card immediately removes it from the active list and updates the `All` and category counts without a refresh or page navigation.
- Shared Favorites now broadcasts a same-tab change event and listens to the browser `storage` event. Saving a new card from another page immediately appears in the open Favorites page, with category and `All` counts refreshed; separate tabs stay synchronized too.

## 4. Authentication UI and session behavior

### Traveler routes

- `/login` is a dedicated traveler Login page.
- `/signup` is a dedicated traveler Signup page.
- Login and Signup are not shown as tabs in one combined form anymore.
- Signup fields are Username, Display name, Gmail/Email, Password, and Confirm password.
- Phone number is intentionally not requested.
- Username validation allows lowercase English letters, numbers, and underscores, with a 3–24 character limit.
- Login accepts either Username or Gmail/Email plus password.
- User Login does not expose Super Admin preview credentials or an Admin shortcut.
- Google and Facebook signup buttons use recognizable inline brand-style SVG icons.
- OAuth buttons are currently visual entry points and will be activated after Supabase provider credentials and callback URLs are configured.

### Session and navigation

- `src/lib/auth.tsx` currently provides a local preview session store with traveler and `super_admin` roles.
- Desktop Header and Mobile Menu react to the shared auth state.
- Traveler account logout clears the session and returns to traveler Login.
- Super Admin logout clears the session and returns to `/admin/login`.

### Supabase Auth connection started

- `src/lib/supabase.ts` now exposes a nullable configured client so builds without environment variables still work in preview.
- The shared auth provider now hydrates Supabase sessions, listens to `onAuthStateChange`, supports Supabase email signup/login, and calls `supabase.auth.signOut()` on logout.
- Signup sends `username` and `display_name` metadata so the `public.profiles` trigger can create the linked profile.
- Google and Facebook buttons now call `supabase.auth.signInWithOAuth()` with a callback to the Login route.
- Admin login checks the linked profile role before allowing the Super Admin portal.
- The implementation was typechecked and production-built successfully.
- Supabase Dashboard provider credentials are still required before Google/Facebook OAuth can complete in production; this remains an external configuration blocker.
- Facebook App credentials were supplied, but Supabase Dashboard login/hCaptcha prevented provider configuration; setup was intentionally deferred at the user's request. The secret is not stored in the repository or Plan notes.

## 4. Super Admin Portal

- Super Admin does not use the traveler web shell.
- `/admin/login` is a standalone Admin Login page without traveler Header, navigation, or Footer.
- `/super-admin` is protected:
  - unauthenticated visitors redirect to `/admin/login`;
  - traveler accounts redirect to `/account`;
  - only `super_admin` sessions can see the dashboard.
- Super Admin sees the dashboard only, not the traveler website pages.
- Dashboard includes overview metrics, recent activity, users, content/listings, bookings, settings, role notes, and quick actions.
- A clearly labeled `Logout / ထွက်မည်` button is visible in the dashboard header and returns to `/admin/login`.
- Super Admin Dashboard header now includes a Burmese/English language switcher and a Dark/Light theme toggle using the shared app providers. The controls work inside the standalone admin portal and persist the same app-wide preferences used by the traveler UI.
- Admin Login now redirects explicitly to `/super-admin` after success. When Supabase is configured, it authenticates only a real Supabase Auth user whose linked profile has `super_admin` role; the local preview account is not used in that production path.

## 5. Supabase backend work completed

- Supabase project: `mhtravelmm` (`ewuvxowujkbyvftoihxh`).
- Migration applied: `create_user_profiles_and_auth_policies`.
- Follow-up migration applied: `allow_super_admin_role_management`.
- `public.profiles` table exists with:
  - `id uuid` referencing `auth.users(id)` with cascade delete;
  - unique nullable `username`;
  - `display_name`;
  - `role` with traveler/admin role checks;
  - `avatar_url`;
  - `created_at` and `updated_at`.
- RLS is enabled on `public.profiles`.
- Own-profile select/insert/update policies and Super Admin management policies are present.
- Auth-user signup trigger automatically creates a profile and derives a safe username from metadata/email when needed.
- Role-change trigger blocks traveler self-escalation and allows Super Admin role management.
- Current Supabase profile row count was zero because no real user account details were provided yet.
- Two Supabase migrations were applied to create the profile schema and then allow verified Super Admin role management. `Plan/PROJECT-PLAN.md` records what those migrations did and their current status; SQL source files are intentionally not stored in the repository plan documentation.
- Core data migration applied directly to Supabase: `favorites`, `custom_plan_requests`, `bookings`, `notifications`, `reviews`, `ads`, and `admin_audit_logs` now exist with RLS, ownership/admin policies, checks, timestamps, triggers, and indexes. A follow-up hardening migration moved the new admin helper into the private schema and indexed Ads/audit foreign keys. The project currently has no Edge Functions because no function contract has been specified.

## 6. Routes currently in the app

- `/`
- `/cities`
- `/nearby`
- `/rentals`
- `/restaurants`
- `/restaurants/:id`
- `/book-shops`
- `/book-shops/:id`
- `/ticketing`
- `/travel-plans`
- `/travel-guide` and `/travel-guide/:id` (bilingual guide listing/detail)
- `/blogs`
- `/search` (bilingual aggregated search results)
- `/account`
- `/login`
- `/signup`
- `/admin/login`
- `/super-admin`
- `/notifications`
- `/account/notifications`
- `/favorites` (live categorized Favorites page)

## 7. Git delivery history for the recent work

- `2a44a43` — Refine blog banner and related stories.
- `879af23` — Add traveler auth and Super Admin dashboard.
- `954988f` — Separate Admin Portal from traveler login.
- `23635a7` — Make Super Admin dashboard standalone.
- `434a1ff` — Make Super Admin logout visible.
- `c972c9e` — Wire traveler account logout.
- `55fa0a3` — Split traveler auth and add username login.
- `5a5f6b5` — Add branded social signup icons.
- `41be699` — Document Supabase account schema.

## 8. Remaining implementation work

1. Provision the first real Supabase traveler and Super Admin Auth accounts and verify their linked profile rows.
2. Add secure username-to-auth identity login handling without exposing private email data.
3. Configure Google OAuth and Facebook OAuth in Supabase and add production callback URLs.
4. Create the first real traveler account only after receiving the requested username, Gmail/Email, display name, and temporary password.
5. Complete Travel Guide detail, Search results, Favorites, and remaining detail pages.
6. Connect bookings, custom plan requests, favorites, views, notifications, and reviews to Supabase tables and RLS policies.
7. Add Admin-managed content tables, owner/admin account provisioning, audit logs, and production role management.


## 9. Dashboard work completed — 2026-11-10

### Traveler User Dashboard

- Refined `/account` to follow the supplied MH Travel traveler-dashboard reference with the full-width navy/cyan shell, profile navigation, welcome banner, four statistic cards, upcoming trip, quick actions, recent activity, discovery panel, responsive behavior, and full desktop footer treatment.
- Preserved existing account navigation, Favorites, notifications, settings/support views, and logout behavior.
- Delivery commit: `420f69f` — `feat: refine traveler user dashboard`.

### Super Admin Dashboard and Ads Management

- Redesigned the standalone Super Admin control center to match the supplied reference with a dark navy/cyan admin shell, responsive sidebar, hero, KPI cards, analytics, distribution, quick actions, recent bookings, popular cities, and recent users.
- Added a dedicated Ads Management section with campaign inventory, advertisers, placements, impressions, CTR, Live/Paused state, preview/edit/pause actions, priority/approval controls, and placement health.
- Added the legacy blog URL redirect used by older blog card links.
- Delivery commit: `16d7362` — `feat: add super admin ads management`.

### Shop Owner creation and dashboard

- Added the Super Admin Shop Owners section and Create Shop Owner workflow. The form collects owner/business name, email, phone, city, and business category; created records enter the local list as Pending for review.
- Added the separate responsive `/shop-owner` dashboard based on the supplied Royal Myanmar Restaurant reference. It includes the owner profile/verified state, bookings/orders/reviews/revenue cards, booking chart, popular menu, recent bookings, quick actions, owner navigation, mobile menu, notifications, and workspace sections.
- Added a Preview dashboard action from the Super Admin Shop Owners list and registered `/shop-owner` in `public/manus-routes.json`.
- Delivery commits: `07d13fa` — `feat: add shop owner creation`; `b541cfc` — `feat: add shop owner dashboard`.

### Admin Management

- Added the Super Admin Admin Management section and Create Admin Quick Action. The frontend workflow collects name, email, phone, admin role, and permission group, and adds newly created records as Pending invite.
- Added role choices for Content Manager, Support Manager, Operations Admin, Finance Admin, and Ads Manager; permission groups cover content, support, bookings/orders, payments/reports, and Ads Management.
- Added admin summary cards, admin account table, status display, review actions, audit-log entry point, and explicit separation between platform admins and Shop Owners.
- Delivery commit: `ee684e4` — `feat: add admin management`.

### Current boundary for all dashboard work

The dashboard screens, forms, local state, and preview interactions are complete and typechecked/build-validated. Admin invitations, shop ownership, permissions, audit logs, campaign persistence, real metrics, Supabase Auth invitations, email delivery, and RLS policies are still backend integration work. The frontend auth role model now includes local `owner_admin`; production role authorization remains pending.

### Validation for the dashboard sequence

- `npm run typecheck` passed.
- `npm run build` passed.
- `npm run lint` passed with the repository's existing seven non-blocking warnings only.
- `git diff --check` passed before delivery.


## 10. Shop Owner login credentials — 2026-11-11

- Extended the Super Admin Shop Owner creation form to include a required login username and temporary password.
- Added a `Generate username + password` action that derives a lowercase username from the shop name with a numeric suffix and creates a temporary password for the owner.
- After account creation, the new Owner Admin record is added as `Pending`, the username is visible in the account list, and the username/password are shown once in a credential notice for secure delivery. Passwords are deliberately not displayed in the account table.
- Added validation for username format and minimum password length, reset the credential fields after creation, and preserved the `/shop-owner` dashboard preview action.
- This is still a frontend/local-state credential handoff. Production must use Supabase Auth invite or password-reset flows, never store plaintext passwords, hash credentials server-side, enforce unique usernames, and require the owner to change the temporary password on first login.


## 11. Super Admin to Shop Owner login connection — 2026-11-11

- Extended the frontend auth role model with `owner_admin` and added a shared `createShopOwner` auth action. Creating a Shop Owner from Super Admin now persists the username/password account in the local preview auth store instead of only adding a visual row.
- Updated the standalone Admin Login portal to accept either email or username. A created Shop Owner can sign in with the generated username and temporary password; the role-aware redirect sends Super Admin to `/super-admin` and Owner Admin to `/shop-owner`.
- Added a protected `RequireShopOwner` route guard. Unauthenticated users go to Admin Login, Super Admin users go to Super Admin, travelers go to the traveler Account page, and only `owner_admin` sessions can open the Shop Owner dashboard.
- Shop Owner logout now clears the shared auth session and returns to `/admin/login`.
- The connected flow is a local preview bridge. Production still requires Supabase Auth invitations, real `owner_admin` profiles, secure password-reset/temporary-password rotation, unique username enforcement, shop ownership records, and RLS-backed route authorization.

## 12. Travel Plans entry and detail page — 2026-11-11

- Kept the existing bilingual Travel Plans entry page with Bagan sunrise hero, search, duration filters, sorting, shared favorite cards, and the Custom Plan request builder.
- Added `/travel-plans/:planId` detail routes so plan cards no longer lead to an undeclared route. The detail view includes a bilingual hero, duration/rating/views, schedule and traveler summary, day-by-day itinerary generated from the plan destinations, estimated starting price, Request this plan CTA, and Browse all plans action.
- Added the `#custom-plan` anchor to the request builder and registered the detail route in `public/manus-routes.json`.
- Typecheck, build, lint, and whitespace validation passed; existing lint/Browserslist/bundle-size warnings remain non-blocking.

## 13. City detail page — 2026-11-11

- Added `/cities/:cityId` so every City card can open a real detail route instead of falling through to Not Found.
- Added city-specific hero imagery and English/Myanmar city introductions for Yangon, Bagan, Mandalay, Inle Lake, Ngapali, Bago, Mawlamyine, Kyaiktiyo, Taunggyi, and Kalaw.
- Added best-for, recommended-stay, getting-there facts, attraction/hotel/restaurant recommendation sections, Back to Cities navigation, Plan a trip CTA, and a Custom Plan CTA.
- Registered the route in `public/manus-routes.json`; typecheck, build, lint, preview URL, and whitespace validation passed.

## 14. City categories and expanded business explorer — 2026-11-11

- Added a Search-like explorer inside City Detail pages with category chips for All, Attractions, Hotels, Restaurants, Book Shops, Rentals, Transport, Cafes, and Markets.
- Added city-scoped keyword search, result counts, bilingual labels, responsive business grids, and Show more/Show less behavior so visitors can see more hotels, restaurants, and other businesses instead of only three featured sections.
- Typecheck and lint pass with only the repository's existing non-blocking warnings; production build and whitespace checks remain required before delivery.


## 15. Shop Owner Web UI/UX template subscription plan — 2026-11-12

The product plan now includes a selectable Shop Page Web UI/UX template system for Shop Owners. Every shop receives one default Free template. MH Travel will offer additional templates with different layouts, navigation, hero, catalog/menu, booking CTA, gallery, and mobile experiences, while keeping the Owner's business data reusable across templates.

Switching from the included Free template to an alternative paid template will cost **2,000 MMK per month per Shop Owner shop**. One paid template entitlement is active at a time, and switching between paid templates must not duplicate shop content or subscriptions. Owners may return to the Free template at any time; cancellation, expiry, or unpaid status after a grace period falls back to Free without deleting business data.

The remaining implementation work is a template catalog and version system, preview/apply selector, category compatibility, subscription/payment/entitlement records, renewal and grace-period handling, RLS, audit events, Platform Admin template management, safe retirement/rollback, and analytics. This is a new product requirement documented in the consolidated plan and Doc records; no UI or payment integration was implemented in this documentation-only update.


## 16. Ticketing Main Owner and Branch Owner model — 2026-11-12

The Ticketing plan now defines an operator hierarchy. A company such as JJ Express has one Main Owner account, and that Main Owner can create scoped Branch Owner accounts for stations such as Yangon Hlaing Tharyar Gate and Aung Mingalar Gate. Branch Owners can manage only their assigned station's operations, schedules, inventory, bookings, and reports; they cannot access another branch or operator.

Each Branch Owner account costs **10,000 MMK per month**, billed to the Main Owner. This fee is separate from the 2,000 MMK Shop Page template subscription and from ticket transaction commissions. Ticket sales must retain both Main Owner/operator attribution and Branch Owner/station attribution, with a configurable revenue-share rule snapshotted on every transaction.

The planned wallet model separates the MH Platform ledger for MH fees, account charges, commissions, refunds, and adjustments; the Main Owner consolidated wallet for operator and branch earnings; and branch-level wallets/ledgers for each station. Final commission percentage, payout schedule, minimum payout, refund/chargeback responsibility, withdrawal rules, and direct-versus-consolidated settlement remain open for the next ticketing business discussion. This is a documentation-only update; no branch account, payment, revenue-share, or wallet UI/backend was implemented.


## 17. Main Owner Branch Account and Wallet Admin Panel — 2026-11-12

- Added a protected `/main-owner` route with a Super Admin `?preview=1` path for design review while the distinct production Main Owner role is still pending.
- Added a dark navy/cyan Main Owner control center for JJ Express-style operators with Overview, Branch Accounts, Wallets & Ledger, Ticket Sales, Revenue Share, and Operator Settings navigation.
- Added a responsive Create Branch Account modal that captures station/branch name, city, address, Branch Owner name, login username, phone, fixed 10,000 MMK monthly account fee, and revenue-share percentage. New local preview records enter `Pending` status and appear in the branch table.
- Added Main Owner overview metrics, branch wallet snapshot, ticket-sales chart, recent wallet activity, branch account table, consolidated Main Owner wallet, Branch Wallets, MH Platform Ledger, settlement preview, and ledger/activity rows.
- Typecheck passed, production build passed, lint passed with the repository's existing seven non-blocking warnings, and the route manifest was updated. The UI remains local preview state; real branch roles, billing, revenue-share persistence, wallet ledgers, payments, and RLS remain backend work.


## 18. Branch Account form validation and API integration — 2026-11-12

- Added `src/lib/mainOwnerApi.ts` with shared Branch Account input types, validation, preview persistence, and async create behavior.
- Added validation for station name, city, address length, Branch Owner name, lowercase username format, Myanmar phone format, and revenue share from 0–100%. Duplicate preview usernames are rejected before submission.
- The Main Owner Create Branch Account modal now submits asynchronously, shows field-level errors and API/server errors, disables controls while creating, and reports whether a record was created through Supabase or the local preview fallback.
- When Supabase is configured, the service inserts into the planned `operator_branches` table with `operator_id`, station/contact data, fixed 10,000 MMK monthly fee, revenue share, and Pending status. When Supabase is unavailable, it persists the new Pending branch in `localStorage` so the preview remains usable.
- Typecheck and production build passed; lint passed with the repository's existing seven non-blocking warnings. Production still requires the `operator_branches` migration, unique username constraint, authenticated Main Owner identity, server-side validation, and RLS policies.


## 19. Super Admin Blog Post Management — 2026-11-12

- Confirmed the existing Super Admin Blogs menu and Add Blog Quick Action were UI placeholders; connected them to a dedicated Blog Posts Management view without changing the surrounding dashboard design.
- Added `src/features/superAdmin/BlogPostsPanel.tsx` with seeded inventory from `BLOG_POSTS`, All/Published/Draft/Scheduled summaries, title/category/author/view/status table, search, status filters, edit, preview, and publish actions.
- Added a bilingual Blog Post editor requiring English and Myanmar title, excerpt, and body, with category, author, location, cover image URL, internal SEO tags, publishing status, and schedule time. Save Draft, Publish Post, and Schedule Post actions update the local preview inventory.
- The current implementation is frontend/local state. Production work remains for Blog Post/revision tables, media storage, Content Manager permissions, moderation/audit history, scheduled publishing, cache invalidation, and public Blogs/search API integration.
- Typecheck, lint, and production build passed; lint continues to show only the repository's existing seven non-blocking warnings.

## 20. Blog categories and compressed cover uploads — 2026-11-14

The Super Admin Blog Editor now supports adding categories from the editor. New names are normalized into safe slugs, duplicate categories are rejected, and the newly added category is selected for the current post.

Cover image upload now accepts JPEG, PNG, and WebP files, rejects unsupported types and originals above 12 MB, resizes the longest edge to 1600px, converts to WebP, and iteratively compresses to a maximum of 450 KB. The compressed file is sent as multipart form data with `folder=blog-posts` to `VITE_BLOG_MEDIA_UPLOAD_ENDPOINT`; a successful endpoint response supplies the durable R2 URL/key used by the Blog Post cover field.

Because this repository currently has no deployed Cloudflare Worker/Pages Function or R2 binding, an unset endpoint uses a local data-URL fallback for preview only. Production still needs the authenticated R2 endpoint, bucket binding, public/custom-domain or signed URL policy, CORS, database persistence, orphan cleanup, and audit/rate-limit controls.

Typecheck and production build passed. Lint passed with the repository's existing seven non-blocking warnings.

## 21. Blog post cover and gallery photo support — 2026-11-14

The Blog Post Editor now keeps a separate Cover Photo and supports multiple Additional Photos through a multi-file picker. Each selected gallery image is compressed individually through the existing resize/WebP/450 KB pipeline and uploaded using the same `blog-posts` R2 endpoint adapter. Uploaded gallery URLs appear as thumbnails with individual remove controls and are kept in `galleryUrls[]` separately from the cover URL.

The current gallery list is local preview state. Production still needs ordered Blog Post media records, alt text/captions, public Blog reader rendering, transactional persistence of R2 keys, and orphan-object cleanup.

## 22. Compact inline Blog story composer and schedule controls — 2026-11-14

The Blog Editor was redesigned around a compact story-flow composer. It now supports bilingual text blocks and image blocks so a Super Admin can place photos between paragraphs, add another text block after the image, and remove blocks individually. Cover, gallery, and inline photos all use the existing compressed WebP upload pipeline.

Schedule input was changed from a manually typed datetime field to separate native date and time pickers; Scheduled posts require both values. The modal, fields, cards, table density, thumbnails, and buttons were reduced to avoid oversized boxes. Typecheck and production build passed, and lint passed with the repository's existing seven non-blocking warnings. Public reader block rendering and durable ordered block persistence remain backend/content integration work.

## 23. Super Admin compact dashboard density — 2026-11-14

The Super Admin dashboard received a compact-density pass based on the user's preference for smaller boxes and less unused space. The desktop sidebar and header are shorter/narrower; the Overview hero, KPI cards, analytics chart, distribution panel, Quick Action tiles, panel headers, tables, forms, and shared admin cards use tighter padding, gaps, row heights, icon sizes, and radii. Existing content and actions remain available, including responsive mobile navigation.

Typecheck and production build passed. Lint passed with the repository's existing seven non-blocking warnings.

## 24. All admin dashboards second compact pass — 2026-11-14

A second density pass was applied across the Super Admin, Shop Owner, and Admin Management dashboards. Shop Owner received a narrower sidebar, shorter header and hero, smaller profile/KPI/chart areas, tighter tables, quick actions, and section cards. Super Admin Admin Management and Shop Owner management forms received smaller controls and tighter table/form spacing. The role dashboards now share a compact visual rhythm while retaining content, actions, responsive layouts, and route protection.

Typecheck and production build passed. Lint passed with the repository's existing seven non-blocking warnings.

## 25. User Dashboard compact density — 2026-11-14

The traveler User Dashboard was compacted to match the admin dashboard density direction. The shell and sidebar are narrower, navigation rows are shorter, the welcome hero is smaller, KPI/stat cards use less padding, and booking/activity, quick-action, discovery, wallet, message, settings, and secondary view panels are tighter. Existing content and actions remain available across desktop and mobile.

Typecheck and production build passed. Lint passed with the repository's existing seven non-blocking warnings.

## 26. Site-wide right-click and zoom interaction guard — 2026-11-14

Added `SiteInteractionGuard` at the application root to prevent page context menus, page-level Ctrl/Cmd zoom shortcuts, and Ctrl/Cmd + mouse-wheel zoom. The HTML viewport now requests a maximum scale of 1 and disables user-scalable pinch zoom where supported. Browser menu/settings zoom remains intentionally documented as outside website control. Typecheck and production build passed; lint remains at the repository's existing seven non-blocking warnings.

## 27. All dashboards third compact-density pass — 2026-11-14

A third, tighter density pass was applied across Super Admin/Admin, Shop Owner, and User dashboards. Shell widths and outer padding, sidebar/header heights, hero banners, KPI/stat cards, charts, quick-action tiles, forms, panels, and tables were reduced again to minimize unused space. No dashboard content or actions were removed, and responsive layouts and route guards remain intact.

Typecheck and production build passed. Lint passed with the repository's existing seven non-blocking warnings.

## 28. Dashboard footer/copyright compact pass — 2026-11-14

Reduced the oversized copyright/footer boxes beneath the dashboard experiences. Super Admin and Shop Owner custom footers now use short rows, smaller padding, and smaller brand/social elements. The shared Footer/PageCopyright used by the User Dashboard was also tightened. A further compact pass reduced shell, hero, chart, table, and action spacing across Super Admin/Admin, Shop Owner, and User dashboards while preserving content, actions, route guards, and responsiveness.

Typecheck and production build passed. Lint passed with the repository's existing seven non-blocking warnings.

## 29. Dashboard social footer simplification — 2026-11-14

Simplified dashboard social footer content to Facebook and YouTube only, both rendered at compact sizes. Added reusable `DashboardCopyright` and connected it to the User Dashboard route, replacing the larger public footer there. Super Admin's custom footer now also keeps only the two requested social markers. Typecheck and production build passed; lint remains at the repository's existing seven non-blocking warnings.


---

## Currency management and Shop Owner main-currency selection — 2026-11-16

### Completed frontend behavior

- Added a shared currency configuration layer with a persisted Admin exchange rate, defaulting to `1 USD = 4,500 MMK`.
- Added a Super Admin `Settings` panel for changing the USD-to-MMK rate. Saving the rate immediately updates all shared `formatPrice()` outputs in the current application session.
- Added persisted Shop Owner currency selection with `MMK Main` or `USD Main` choices inside the Shop Owner Settings workspace.
- Added a live conversion preview showing the selected shop main price and the automatically converted secondary currency using the current Admin rate.
- Kept the public display-currency toggle separate from the Shop Owner's pricing base currency. Public listing prices remain USD-base preview data and are converted with the Admin-managed rate.
- Typecheck, production build, lint, and whitespace validation passed; lint retains the repository's existing non-blocking warnings.

### Production integration still required

- Persist exchange-rate history, effective dates, who changed the rate, and audit events in Supabase/Admin settings.
- Persist Shop Owner base currency per shop/business profile and apply it to real menu, service, rental, ticket, and booking price records.
- Add server-side conversion snapshots so an order retains the rate and currency that were shown at checkout; do not recalculate historical bookings from a newer rate.
- Add validation, permissions, rate-effective scheduling, rounding rules, and payment/refund currency rules for production.


---

## Super Admin Currency navigation and Shop Owner filters — 2026-11-16

- Moved `Currency & Exchange Rate` from the generic Settings destination to a standalone Super Admin navigation item.
- Added Shop Owners filters for `All`, city, business category, and application/status (`All`, `Pending`, `Active`).
- Added filtered-result counts and an explicit Pending applications indicator above the Shop Owner account table.
- New Shop Owner records continue to enter the Pending state, so submitted applications can be reviewed separately from active owners.


---

## Shop Owner application notifications — 2026-11-16

A successful Shop Owner application now creates a local preview notification for the Super Admin. The notification bell displays the unread count, opens a compact notification drawer, supports individual read state and Mark all read, and synchronizes the preview notification list across browser tabs. The notification includes the applicant, business, city, and category so the Admin can identify the application without opening the table.

For production, the workflow must move to server-side notification records with authorization, realtime/API delivery, persistent read state, retention, and audit history.


---

## Page-based Ads Management — 2026-11-16

Ads Management is now organized around the actual website pages rather than a campaign-inventory table. Super Admin can choose a page such as Home, Cities, City Detail, Travel Plans, Blogs, Blog Detail, Nearby, or User Dashboard, then view only that page's placements. Each page supports adding an ad, editing its name/advertiser/placement, previewing the page, and publishing or pausing the placement.

The current implementation is preview/local state. Production integration must persist page routes, placement slots, creative/media, advertiser, schedule, approval status, and page-level permissions in the backend, then render the published placement in the matching page component.
