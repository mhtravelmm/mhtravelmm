# MH Travel — Consolidated Project Plan
> **Authoritative single-file plan.** Consolidated on 16 November 2026; every section revised against `Doc/` and the code on 23 November 2026. Claude is the only editor.
## Document organization

- `Plan/PROJECT-PLAN.md` is the single source of truth for product requirements, decisions, system specifications and the backend handoff. Implementation history and dated work records live in `Doc/HISTORY.md`.
- `Doc/COMPLETED-WORK.md` records completed work in a concise delivery-oriented format.
- `Doc/REMAINING-WORK.md` records open production, backend, UX, and configuration work.
- `Doc/STATUS.md` is the one-page DONE / PARTIAL / PREVIEW / NOT DONE view and the place to start; `Doc/PLAN-VS-CODE.md` checks this Plan against the code.
- Division of roles: this Plan holds product requirements and decisions; `Doc/` holds what is done and open. Claude writes only this Plan, OpenHands writes the application code, and Manus AI does the Supabase and Cloudflare work (section 16F). Working order: read `Doc/` (STATUS first), then this Plan, then write the Plan additions and improvements; code is written from the Plan; afterwards `Doc/` records the completed parts and how they were implemented.
- Every kind of file has one home: `Plan/` one file, `Doc/` a fixed list, `SQL/` only SQL, `Worker/` one Worker file (section 16I). `Doc/TICKETS.md` is where ticket status lives.
- Supporting non-plan documentation such as blog image licensing is `Doc/BLOG-IMAGE-SOURCES.md`.


---

## 1. Overview

- All-in-one web + mobile app for Myanmar travel, serving both foreign
  tourists visiting Myanmar and local Myanmar travelers.
- Mobile app stays synced with the web app through a shared backend.
- Development approach: finish the user-facing side completely before
  designing Owner/Admin dashboards, since user-facing requirements define
  what the dashboards need to manage. The MH-owned modules are the exception:
  for them the user side and the Admin side are built together (below).
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
  for review after testing. Agent roles, tickets and contracts are in sections
  16F and 16G, Search in 16H, and the repository layout in 16I.

### Who uses MH Travel

| Group | What they do | Where it is specified |
|---|---|---|
| Foreign tourists | Plan and book a trip, find help after arrival | Sections 5 to 8, 13 |
| Local Myanmar travelers | Same, in Myanmar and in MMK | Sections 5 to 8, 14 |
| Business owners (Owner Admin) | Run a listing, take bookings, get paid | Sections 4, 6, 9 |
| Ticket operators (Main Owner, Branch Owner) | Sell tickets through their own system | Sections 7 and 9 |
| MH Travel staff (the admin roles) | Run the platform | Sections 3, 8, 10, 16A, 16B |

### Principles that apply everywhere

1. **Bilingual by default.** Every visible string exists in Myanmar and English. Stored content is Unicode only; Zawgyi is converted on the way in (16H.5).
2. **USD base, MMK or USD display.** Prices are stored in USD and formatted live by the selected currency (16B.5).
3. **The server is the authority.** The browser never decides a price, a role, a date window or a status; it only asks (16B.8).
4. **One home for each fact.** Requirements live in this Plan; what is done lives in `Doc/` (16I).
5. **Simple first.** Fewer filters and fewer screens, with each screen doing one job.
6. **Share the minimum.** Personal data goes only where a feature needs it, and operator data stays with the operator (section 9).

### Section map

1 Overview · 2 Tech and architecture · 3 Roles and accounts · 4 Design system and Shop Page templates · 5 Home Page · 6 Booking Flow · 7 Ticketing, Bus and related products · 8 Rental · 9 Owner business model, money and the Operator system · 10 Blog and Travel Guide · 11 Reviews and Reports · 12 Search, Nearby, Notifications and Support · 13 Foreign Tourist section · 14 Accounts, Language and Currency · 15 Repo conventions · 16 Page behavior and open items · 16A Ads and the Adsboard · 16B Platform services · 16C Remaining modules · 16D Roadmap · 16E Decision register · 16F Agent handoff · 16G Contracts · 16H Search system · 16I Repository layout.

---

## 2. Tech Stack and Architecture

- Frontend: Vite + React + TypeScript + Tailwind CSS, a single-page app.
- Backend, database and auth: Supabase (Postgres with RLS, Auth, Realtime).
- Hosting: one Cloudflare deployment. `wrangler.jsonc` serves the built site
  as static assets (`assets.directory = ./dist`,
  `not_found_handling = single-page-application`). Pushes to `main` on GitHub
  deploy automatically.
- The one Worker (`Worker/index.ts`, section 16G.4) is planned and not built
  yet (ticket M-06). It will serve `/api/*` and run the scheduled jobs; the
  static site keeps every other path. Until it exists the repository has no
  Worker API and no R2 data access.
- Files go where section 16I says. Code is written by OpenHands; Supabase and
  Cloudflare (the one Worker, R2, cron) are done by Manus AI; Claude writes
  only this Plan (section 16F). Claude reads `Doc/` first, then this Plan,
  then writes the additions and improvements the Plan needs.
- Secrets (Supabase keys, tokens) live in a local, gitignored `.env` and in
  Cloudflare's and Supabase's secret stores. They are never committed.

### How the parts talk to each other

| From | To | What for |
|---|---|---|
| Browser | Supabase | Sign-in, reads through RLS-protected tables and views, calls to the functions in 16G.3, Realtime for notifications and chat |
| Browser | the Worker (`/api/...`) | Image upload, ad click and impression, translation, weather |
| Worker | Supabase | Verifies the user's token, writes ad events, reads and writes the translation cache |
| Worker | R2 (`MEDIA`) | Stores and reads media objects |
| Supabase `pg_cron` and the Worker's scheduled handler | the database | The jobs in 16B.7 |
| MH Travel hub | each operator system | Trips, live seat maps, holds and confirms (section 9) |

### Environments and delivery

Three environments (local, staging, production) as in 16B.9. Every push runs `npm run typecheck`, `npm test`, `npm run lint` and `npm run build`; a ticket is done only when they pass (16F.1 rule 7). SQL migrations are applied to staging first and then to production by Manus. The Home-only full footer, the fixed five-tab phone navigation and the `public/_redirects` ban in section 15 stay in force.

---

## 2A. Implementation inventory

The verified implementation inventory of 2026-11-10 and every dated work record moved to `Doc/HISTORY.md` (section 16I). The current state is `Doc/STATUS.md`; the Plan carries requirements and specifications only.

---

## 3. Roles and Accounts

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
- Admin workspace (decided 2026-11-22, partly built 2026-11-23): Blog Post
  Admin and Travel Guide Content Admin already reach only their own editor
  (`src/lib/contentAdminAccess.ts`). The rest is one role-guarded workspace
  that reuses the Super Admin panels, and `src/lib/adminWorkspace.ts` now
  encodes the section 16B.1 matrix for it: Rentals for Rental Admin, Ads for
  Ads Admin, users and support for Admin, orders/reports/currency for Payment
  Admin, and guide earnings for Payment Admin (built 2026-11-23 as
  `GuideEarningsPanel` over `src/lib/guideEarningsStore.ts`, so the rows live
  outside the Guides editor and the author reads their own). Super Admin also
  gained the audit-log section on 2026-11-23, and the Admin Management table now
  reads the stored accounts (`src/lib/adminAccounts.ts`) so a created admin
  survives a reload. Still open:
  bookings for Owner Admin, which the separate `/shop-owner` workspace serves.
  Super Admin keeps all sections.
  Route guards only hide menus; the server must check the role on every write
  (sections 8, 10 and 16A; the permission matrix is in section 16B.1).
- Role spelling (decided 2026-11-23): `profiles.role` stores a slug
  (`rental_admin`); the UI, this Plan and the permission matrix use the product
  name (`Rental Admin`). `src/lib/roleMapping.ts` and the server's
  `current_role_name()` resolve either spelling, so a new role must be added to
  both or it signs in as a traveler and fails every write.

### 3.1 Account types

| Account | `profiles.role` | Created by | Signs in with |
|---|---|---|---|
| Traveler | `traveler` | Themselves (sign-up) | Email and password, or Google (phase 1); phone, Apple, Facebook later (section 14) |
| Super Admin | `super_admin` | Another Super Admin, or the one-time first-account step | Email and password, or Google |
| Ads Admin, Admin, Rental Admin, Payment Admin, Travel Guide Content Admin, Blog Post Admin | `ads_admin`, `admin`, `rental_admin`, `payment_admin`, `travel_guide_admin`, `blog_admin` | Super Admin, by invitation | Email and password (set through the invitation link) |
| Owner Admin | `owner_admin` | An Admin, after the field visit | Username or email and password |
| Main Owner, Branch Owner | `main_owner`, `branch_owner` (added in Phase 4) | Admin for a Main Owner; the Main Owner for its Branch Owners | Username or email and password |

The roles other than the first row are never self-service. A traveler cannot raise their own role (a database trigger already blocks it); only Super Admin changes a role, and each change is audited.

### 3.2 Flows

- **Traveler sign-up:** email, password, username and display name. The username is 3 to 24 characters of lower-case letters, digits and underscore, unique, stored lower-case. A Google sign-up without a username goes through a username-completion step before the account is fully usable. Password: at least 8 characters, reset by email.
- **Username login:** the browser sends the username to a server resolver that returns a sign-in session without ever exposing the account's email (ticket M-09).
- **Admin and Owner invitations:** the creator enters name, email and role; Supabase Auth emails an invitation; the person sets a password. No plaintext password is shown or stored anywhere in production. The local preview's plaintext-password store is for development only and is off whenever Supabase is configured.
- **Owner application:** a business that wants to join sends the application form (business name, category, city, address, phone, notes) through `submit_owner_application`, rate-limited and protected by Cloudflare Turnstile. Admin and Super Admin are notified and handle it by field visit, as section 9 says. Approval is the Admin creating the Owner Admin account. The application row records its status (new, contacted, approved, rejected) and who handled it.
- **Sessions:** Supabase sessions with refresh. An admin-role session needs a fresh sign-in after 12 hours of inactivity; travelers stay signed in until they sign out.
- **Profile:** username, display name, avatar, role (read-only), preferred language and currency (saved when signed in), optional phone.
- **Account deletion and export:** a traveler asks in Settings. Admin carries out deletion within 30 days. Bookings are kept 24 months for accounting with the name replaced by "Deleted user", and reviews are kept anonymized. A traveler can ask for a JSON export of their own data.

### 3.3 Data and access

`profiles` exists with RLS (own-profile and Super Admin policies and the role-protection trigger). Add `owner_applications` (`id`, `applicant_name`, `phone`, `business_name`, `category`, `city`, `address`, `notes`, `status`, `handled_by`, `created_at`, `updated_at`) in Phase 2: insert only through the function, read and update by Admin and Super Admin. The database role values and their frontend names are in 16G.5, and the first Super Admin was created through the dashboard and promoted by a one-time SQL role update.

### 3.4 Acceptance criteria

1. A traveler cannot change their own role by any request.
2. Signing in by username never reveals the email.
3. An invited admin sets their own password and signs in with the invited role; no password is stored anywhere in clear.
4. An application can be submitted once per minute per IP and appears to Admin.
5. Each role change, invitation and deletion is in the audit log.

---

## 4. Design System Rules

- Every listing/content card (Travel Plans, Travel Guide, Blogs, Populars,
  Nearby results, City cards, business listings) carries all four:
  rating, distance, favorite state, views. The four are required fields on the
  shared `CardListing` type, so a card cannot be built without deciding them.
- **Two of the four are hidden when the value is absent** (§10 §8, decision
  register row 16). A rating of `0` means "not rated yet" and a distance of `0`
  means "no coordinates or no reader location", so neither is drawn — a card
  never shows `0.0` or `0 km`. Views and the favorite button always show. The
  rule lives once in `src/lib/cardMeta.ts` (`hasRating`, `hasDistance`) and the
  shared card plus every page-level card reads it from there.

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
  The number is computed, not written: `src/lib/cardGrid.ts` holds
  `cardGridMaxWidth(columns, size, gap)` and `cardGridStyle()`, which every such
  grid applies inline, and `src/lib/cardGrid.test.ts` fails on a hand-written
  cap or a pixel table that drifts from `CARD_SIZES` (2026-11-24).
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
- Status (2026-11-24): the system is built. `/shops/:shopId` renders the shop's
  resolved template from a lazy module, nine templates rendered (the free hotel
  default, six paid hotels, one book shop design, and one generic design behind
  restaurant, cafe and attraction — nineteen after the 29 November growth pass), the owner previews and applies from their
  own panel, and Super Admin manages the catalog and records invoices.
  Template views and applies are counted: `src/lib/templateStats.ts` holds the
  rules (one view per template per page view, an apply only when the switch
  moved the shop, a preview never counted, bots refused, 180-day retention),
  `ShopPage.tsx` and `OwnerTemplatePanel.tsx` write the rows, the Super Admin
  catalog panel reads them, and `template_events_purge` runs daily in the
  §16B.7 registry.
- Status (2026-11-29): the catalog reached the count the founder expects.
  Nineteen templates render: the free hotel default plus **ten** paid hotel
  designs, and one paid alternative beside the free default in each of the
  other four categories (restaurant, cafe, attraction, book shop). The four
  hotel designs of this pass are Split Screen (`hotel_split_screen`), Board
  (`hotel_board`), Panorama (`hotel_panorama`) and Directory
  (`hotel_directory`); the four category designs are Menu Board
  (`restaurant_menu_board`), Photo Grid (`cafe_photo_grid`), Ticket
  (`attraction_ticket`) and Shelf (`book_shop_shelf`). Every pair of live
  templates in a category passes the seven-axis test, and the catalog seed and
  the SQL seed are now checked against each other by
  `shopTemplates.test.ts` so a row cannot exist on one side only. The rendered
  gate covers **192 combinations** — every template as a preview on its own
  category's fixture shop, at 360/390/768/1440 in both themes — and is clean.
  What is still not built is the storage swap: catalog rows, settings,
  entitlements, invoices and events are browser records behind
  `src/lib/shopTemplateStore.ts`, with `20261128000100_shop_templates.sql`,
  `20261128000200_shop_template_events.sql` and
  `20261129000100_shop_template_catalog_growth.sql` waiting to be applied.
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

### 5.1 Content and data for each part

The order of the parts is the one in `src/features/home/HomePage.tsx`; this table adds what each part shows and where it comes from, not a second order.

| Part | Source when the backend is on | Items and order | Notes |
|---|---|---|---|
| Hero ad | `serve_ad('home_hero')` | one creative | Collapses when there is nothing to show |
| Categories | the fixed category list | all, in the marquee | Reduced-motion users get a static, manually scrollable row. Each item links to its category page |
| Travel Plans | active travel plans | up to 8, newest first | "View all" opens `/travel-plans` |
| Travel Guide | `travel_guides` (published) | up to 8, newest first | Compact circular-image treatment |
| Blogs | `blog_posts_public` | up to 6, newest first | Sponsored slots follow the Ads rules |
| Populars | `listings`, all categories | up to 12 by rating then views | Six per row on wide screens, size `xs` |
| Reviews | platform-level reviews (section 11) | up to 6, newest among 4 stars and above | |
| Awards, Partners | static content | as designed | Edited with the code until a content table exists |
| Discovery rows | `listings` by category: Popular Hotels, Restaurants, Book Shops, Rentals, Transport, Cafes, Markets, Top Attractions | up to 5 per row, by rating then views | Five across on wide screens, size `md`, row width capped at five cards plus gaps |
| Popular Searches | `get_search_report` top queries | up to 8 | Falls back to the seeded list until the report has data |
| Ad slots | `serve_ad` with `home_after_travel_plans`, `home_after_hotels`, `home_after_blogs`, `home_after_reviews`, `home_after_partners` | one each | Same collapse rule |

States: a loading skeleton for each row; an empty row is hidden; a failed row is hidden and logged, never shown as an error box. Favorites hearts read and write the favorites table once the backend is on (Phase 2). When the modules are on the backend, one `get_home_feed` function replaces the separate calls (a Phase 2 ticket). Nothing on Home needs the user to be signed in.

### 5.2 Acceptance criteria

1. With the backend off, Home looks and behaves exactly as today.
2. With it on, every row shows live data and never blocks the others.
3. A row with no items is not rendered; an ad with nothing to show leaves no gap.
4. Prices follow the selected currency; the language switch changes every string including the footer.
5. The marquee stops moving for users who prefer reduced motion.

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

### 6.1 Statuses (the same set everywhere; the rental functions already use it)

| Status | Meaning | Who moves it | Next |
|---|---|---|---|
| `requested` | The traveler asked (Full Manual) | the traveler's submit | accepted, cancelled; expired if the Owner does nothing for 24 hours |
| `accepted` | The Owner accepted; the 12-hour payment window is open (`payment_deadline = accepted_at + 12 hours`) | Owner or staff | paid, expired, cancelled |
| `paid` | Payment confirmed by the Owner or staff; the voucher is issued | Owner or staff (or the system for Instant) | completed, cancelled |
| `completed` | The stay, rental or event has ended | Owner or staff | none |
| `expired` | The window passed unpaid, or the Owner never answered | the system | none |
| `cancelled` | Cancelled with a reason by the Owner or staff. **Never by the traveler** | Owner or staff | none |

Instant bookings are created directly as `paid`. A move that is not in the table is refused with `<module>_error_status_transition`. Rescheduling is an event on a `paid` booking, not a status.

### 6.2 Payment

- In this phase payments are recorded by staff or the Owner with a method (`cash`, `bank_transfer`, `mobile_wallet`) and a time; there is no online gateway. Each gateway (KBZPay, AYA Pay and others) later plugs in behind one adapter (`createPayment`, `verifyPayment`, `refund`, a signed webhook, idempotency keys), so the statuses never change.
- When a booking becomes `paid`, the Owner's commission rate is read and **snapshotted on the transaction**: gross, rate, commission, net (section 9). A rate change never alters an old transaction.
- A listing whose Owner subscription has expired cannot take bookings: the booking functions refuse with a message asking the traveler to choose another option (section 9).
- A refund is recorded as its own row linked to the booking, with an amount, a reason and who made it; the money movement itself is outside the app in this phase.

### 6.3 Reschedule

After payment a traveler may change the date. The rules:

- Same number of nights or days, a new start date at least tomorrow, and the request is made at least 24 hours before the original start.
- Self-service for MH-owned products without inventory (Rental allows it once, section 8). For inventory-based listings (hotels, restaurants, events) it is a request the Owner approves; until approved the original dates stand.
- Each reschedule writes an event, issues a new voucher version, and notifies the other side.

### 6.4 Data

`bookings` exists (RLS, status and data checks). The target shape is one booking row for every category, plus a detail table where a category differs:

| Table | Key columns |
|---|---|
| `bookings` | `id`, `request_code` (unique, `<PREFIX>-YYMMDD-####`: `HTL`, `RST`, `RNT`, `TKT`, `EVT`), `user_id`, `listing_id`, `owner_id`, `category`, `status`, `flow_mode`, `start_date`, `end_date`, `guests`, `currency`, `total_usd`, `payment_method`, `payment_deadline`, `paid_at`, `commission_pct`, `commission_mmk`, `voucher_version`, `special_requests`, `created_at`, `updated_at` |
| `booking_events` | `id`, `booking_id`, `from_status`, `to_status`, `actor_id`, `note`, `at` |
| `booking_hotel_details` | `booking_id`, `room_type`, `nights`, `check_in_time`, `check_out_time` |
| `booking_refunds` | `id`, `booking_id`, `amount_mmk`, `reason`, `made_by`, `at` |

Rental keeps its own `rental_orders` (section 8) and joins the traveler's list through the `my_bookings` view. Detail tables for restaurants, tickets and events are added with their modules (16C).

### 6.5 Voucher and notifications

The voucher is a printable page at `/account/bookings/<request_code>` with a QR code that encodes the code; its 17 fields map from the booking as the Rental table in section 8 shows. Notifications (16B.3): a new request goes to the Owner; accepted, paid, expired and cancelled go to the traveler; a reschedule goes to the other side.

### 6.6 Edge cases

Each request carries an idempotency key, so a double tap creates one booking. All dates and windows use Myanmar Time. An Owner who suspends a listing cannot accept new requests, and existing `paid` bookings stay valid. A cancelled `paid` booking creates a refund row for staff to settle.

### 6.7 Acceptance criteria

1. A booking only moves along the table in 6.1.
2. An unpaid `accepted` booking becomes `expired` after 12 hours, by itself.
3. A traveler cannot cancel; staff can, with a reason.
4. The commission on a transaction does not change when the rate changes later.
5. A booking on an expired-subscription Owner's listing is refused.
6. A double submit makes one booking.
7. The voucher shows all 17 fields and a working QR code.

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

### 7.1 Traveler flow for a ticket

1. **Search** a route and date in the hub, or open an operator's profile. The hub calls each operator's `GET /trips` and merges the results; an operator that does not answer is left out with a short "temporarily unavailable" note (section 9).
2. **Choose a trip** (operator, departure and arrival, duration, fare).
3. **Choose seats** on the live seat map (free, taken, held). Opening the map starts nothing; choosing seats creates a **10-minute hold** and shows a countdown.
4. **Passenger details:** name and phone for each seat.
5. **Pay** (Instant flow, section 6). On payment the hub confirms the hold with the operator.
6. **Ticket:** shown in Account → My Bookings with a QR code that encodes the `booking_ref`, and sent as a notification. The ticket is rendered from the operator's voucher design.

Ticket statuses: `held` → `confirmed` → `completed` (after travel); `refunded` and `rescheduled` are events. A traveler cannot cancel; the operator cancelling a trip refunds in full (section 9). Rescheduling changes the date only, through the operator's reschedule call.

### 7.2 Identity across products

Supabase Auth is the identity provider. The other MH products (Ticketing operator system, MH Ride, YBS) accept the MH access token and verify it against the Supabase public keys (JWKS). Only identity data (account id, display name, phone) is shared; each product keeps its own business data.

### 7.3 Local Bus data and the route planner

| Table | Key columns |
|---|---|
| `bus_lines` | `id`, `code`, `name_mm`, `name_en`, `city_id`, `active` |
| `bus_stops` | `id`, `name_mm`, `name_en`, `latitude`, `longitude`, `city_id` |
| `bus_line_stops` | `line_id`, `stop_id`, `position`, `direction` |

Admin enters stops, lines and their order. The planner builds a graph: stops are nodes, consecutive stops on a line are edges, and a walking edge joins any two stops within 500 m. It finds the route with the fewest transfers (at most 2) and then the least total time, using 25 km/h for a bus and 4.5 km/h for walking, and shows the walk to the first stop, each ride and transfer, and the walk from the last stop. The Bus option on a listing appears only when its Owner has enabled it. The planner is a Phase 2 module after Nearby.

### 7.4 Acceptance criteria

1. Opening a seat map shows live status; choosing seats starts the 10-minute hold, and an expired hold blocks payment.
2. A confirmed ticket has a QR code and appears in My Bookings.
3. An unreachable operator disappears from the hub without errors.
4. The planner returns a route within 2 transfers, or says none exists.
5. Hotels and rentals never appear in the Ticketing hub.

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

Built schema (`SQL/20261122000100_rental_catalog.sql`, `20261122000200_rental_orders.sql`): catalog ids and the terms version are `text`, not `uuid` or `integer`; the Plan follows the built schema. The functions are in 16G.3.

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

#### 11. Build steps (who does each: tickets in section 16F.2)

1. Migrations for the catalog tables and orders, with RLS, committed in `SQL/`. 2. Seed them from `RentalsPage.tsx` and apply the section 2 decisions. 3. Make the page read catalog, availability and rates from Supabase instead of constants; add name and special-requests fields. 4. `submit_rental_order` and the confirmation with the request code. 5. My Bookings view and the voucher page. 6. Rental Admin Orders with the status actions and the expiry job. 7. Rental Admin Catalog, Availability, Rates, Branches and Terms. 8. Notifications. 9. Reschedule. 10. Reports.

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

**Implementation note, 23 November 2026.** Criteria 2–4 and 10 are now enforced
in the client preview. `src/lib/rentalOrderRules.ts` repeats all fifteen §7
checks in the order `submit_rental_order` runs them and returns one stable
`rental_error_*` code per failure, translated through `t()` in MM and EN.
`quoteRentalOrder()` is the only quote, called by the estimate panel and by
`buildRentalOrder()`, so a tampered client total is discarded and the stored
total is recomputed from the catalog. `src/lib/myanmarTime.ts` is the shared
UTC+6:30 day helper for the rules, the catalog and the reports. The migrations
remain the authority once they are applied.

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

- **Status (2026-11-27): the money path is built.** `src/lib/ownerLedger.ts`
  states the rules as pure functions: `createSaleRow()` deducts the commission
  at payment time and freezes `commissionPercent` on the row (so a later rate
  change never rewrites history, and a repeated `bookingRef` is refused);
  `payoutWindowFor()` encodes the two windows exactly — day 1–15 is due on the
  20th, day 16–month end on the 5th of the next month; `planPayout()` settles
  every unpaid row whose own window is due, which is how the 50,000 MMK minimum
  carries over without a special case; `createPayoutRun()` writes no run under
  the minimum rather than paying short; and `replayPayout()` is the §16D Phase 3
  gate — replaying a run from its rows must give back the totals it was created
  with. Commission is per shop (`commissionFor()`/`setCommission()`, 0–100%,
  default 0% when a shop has no setting). `20261127000100_owner_ledger.sql`
  holds `owner_commission_settings`, `owner_ledger_rows` and
  `owner_payout_runs`, with RLS per §16B.1, a unique index on `booking_ref`, a
  `net = gross - commission` check, an append-only trigger that freezes the
  amount columns, and `run_owner_payout()` / `verify_owner_payout()` as the SQL
  twin of the run and the replay. The Super Admin workspace has a `payouts`
  section (F for Super Admin and Payment Admin, `–` for Admin) and the Shop
  Owner Payments view is the owner's own statement (`O (own earnings)`).
  Still open: refunds and manual adjustments as their own row kinds, the Main
  Owner consolidated and Branch Owner ledgers below, and a revenue-share policy
  editor beyond the single per-shop percentage.

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

### Owner money system: specification (2026-11-23)

Built in Phase 3 (section 16D). It covers subscriptions, commission, wallets and payouts for every Owner; the ticketing operators (Main Owner, Branch Owner) add their own settlement rows in the Operator system specification below.

#### 1. Tables

| Table | Key columns | Notes |
|---|---|---|
| `owners` | `id`, `profile_id`, `business_name`, `status` (`active` / `expired` / `suspended`), `fee_mmk`, `subscription_period_end`, `commission_pct` (nullable), `payout_note`, `created_by`, `created_at` | One per Owner Admin account; Admin sets the fee, term and commission freely, including free and 0% |
| `owner_subscriptions` | `id`, `owner_id`, `fee_mmk`, `period_start`, `period_end`, `status`, `recorded_by`, `paid_at` | One row per paid term |
| `transactions` | `id`, `booking_id`, `owner_id`, `branch_id` (nullable), `gross_mmk`, `commission_pct`, `commission_mmk`, `net_mmk`, `status` (`confirmed` / `refunded`), `created_at` | Written when a booking becomes `paid`; the rate is a snapshot |
| `wallet_ledger_entries` | `id`, `wallet` (`platform` / `main_owner` / `branch`), `owner_id`, `entry_type` (`sale`, `commission`, `refund`, `subscription`, `payout`, `adjustment`), `amount_mmk`, `ref`, `at` | Append-only; balances are sums |
| `payout_batches` | `id`, `period_start`, `period_end`, `scheduled_for`, `status` (`draft` / `approved` / `paid`) | One per half-month |
| `payout_items` | `id`, `batch_id`, `owner_id`, `amount_mmk`, `carried_over_mmk`, `status`, `paid_at`, `reference` | One per Owner with an amount |

#### 2. Rules

- **Commission** is deducted instantly at payment time. Its rate comes from the Owner (or branch), can differ shop by shop including 0%, and has no default or range. The applied rate is stored on the transaction.
- **Expired Owners.** When `subscription_period_end` passes (Myanmar Time) the status becomes `expired`: the listing stays visible, booking and contact are blocked with a message, and the dashboard shows only a renewal reminder. Reminders go to the Owner 7, 3 and 1 days before.
- **Payout periods:** days 1 to 15 are paid on the 20th; day 16 to month end on the 5th of the next month. A batch is drafted on the day after its period closes, Payment Admin approves it, and marks each item paid with a reference. An Owner whose available amount is under 50,000 MMK is carried over to the next batch (`carried_over_mmk`).
- Refunds enter the ledger as negative entries and reduce the next payout; they never edit a past transaction.
- Every fee, term, commission, subscription payment, payout approval and adjustment is audited.

#### 3. Screens

The Owner sees subscription status and end date, earnings by day and by period, the ledger, and the next payout. Admin sets fee, term and commission, records a subscription payment (extending the period), suspends or restores an Owner. Payment Admin runs the payout batches. All writes go through functions that check the role (16B.1).

#### 4. Acceptance criteria

1. A `paid` booking creates one transaction with the rate snapshotted and the ledger entries that add up to the gross amount.
2. Changing an Owner's commission later does not change an old transaction.
3. An expired Owner cannot receive a new booking.
4. A batch for days 1 to 15 is paid on the 20th, and an amount under 50,000 MMK carries over.
5. The platform, Main Owner and branch balances equal the sums of their ledger entries.

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

Verified against `src/lib/blogBlocks.ts`, `src/lib/contentWorkflow.ts`, `src/lib/publishProblems.ts`, `src/lib/mediaRules.ts`, `src/lib/mediaApi.ts`, `src/lib/contentAdminAccess.ts` and `src/features/superAdmin/BlogPostsPanel.tsx` (main @ `74b80fa`).

#### 1. As built (PARTIAL: editor works on local state)

- **Access:** Super Admin and Blog Post Admin (`canManageBlogs`). Posts, revisions and the audit log live in `src/lib/contentStore.ts` (browser storage), so a row survives a reload and a published one reaches the reader through `src/lib/contentReader.ts`. Two browsers still do not share a row; that is the table work in §3.
- **Blocks, in reading order:** `text` (`textEn`, `textMm`), `image` (`imageUrl`, `altEn`, `altMm`, `captionEn`, `captionMm`, `credit`), `ad` (no content). Blocks can be inserted, moved up or down (`moveBlock`) and removed.
- **Ad rules in code:** at most 3 ad blocks per post (`MAX_AD_SLOTS_PER_POST`), not first, not next to another ad. `normalizeAdSlots` removes slots that break the rules after an edit.
- **Statuses:** Draft, Scheduled, Published, with a schedule date and time.
- **Publish check** (`blogPublishCheck`, stable codes): `title_languages`, `excerpt_languages`, `category`, `cover`, `story_text` (at least one text block with text in either language), `alt_missing` (every image needs alt text in both languages), `schedule`; ad codes `ad_first`, `ad_adjacent`, `ad_max`.
- **Revisions and audit** (`contentWorkflow.ts`): a revision on every save, at most 20 per post, with a Restore button; audit actions `created`, `saved`, `published`, `scheduled`, `restored`, each with the actor and time.
- **Media:** the source image may be up to 12 MB; the browser resizes it to at most 1600 px, converts to WebP trying quality 0.82, 0.68, 0.54, 0.4 until it is at most 450 KB. With `VITE_BLOG_MEDIA_UPLOAD_ENDPOINT` set it posts to the endpoint; without it, it keeps a preview data URL. Failures return codes that the editor translates.
- **Reader projection** (`contentReader.ts`): the slug is the lowercase hyphenated English title, fixed after first publish and numbered if taken; read time is English words ÷ 200 rounded up; blocks become paragraphs, images and ad slots in order. A seeded post the editor takes over keeps its seed slug and its sample rating and distance, which the editor does not collect.
- **Scheduling** (24 November 2026): the editor takes Myanmar Time and stores the UTC instant (`scheduleRules.ts`); `publish_due_content` is wired in `jobs.ts` and runs through `scheduledPublishing.ts`, publishing due posts and guides with the actor `system`. Both readers hide a rating or distance the post does not have (§8).
- **Bilingual author, location and captions (20 November 2026):** `AdminPost`
  holds `authorEn`/`authorMm` and `locationEn`/`locationMm`, and an image block
  holds `captionEn`/`captionMm`. A stored row from before this change keeps its
  one-language value in both languages (`normalizePost` in `contentStore.ts`),
  and the reader falls back to the language that was written rather than
  showing a blank line. `galleryUrls` is gone; extra photos are image blocks.
- **SEO tags are a list (26 November 2026):** `AdminPost.seoTags` is
  `string[]`, edited as chips (type, Add or Enter, `×` to remove, a duplicate
  differing only in case is refused). `src/lib/tagList.ts` is the one place a
  stored value becomes a list, so a row written before this change — a
  comma-separated string — still loads and a stray blank or duplicate is
  dropped. Opening the editor also carries a post's tags and excerpt into the
  form; before this, saving an edited post erased both.
- **Draft autosave (26 November 2026):** the 30-second draft save of §4 is in
  place. `src/lib/draftAutosave.ts` holds the interval, the "has anything
  changed" fingerprint and the write test, so the rule is unit-tested rather
  than buried in a timer. It writes the row only — no revision, no audit row —
  and only for a `Draft`; a Published or Scheduled post still changes through
  the explicit Save, which runs the publish checks. The first write of a new
  post creates its row, so a long draft is never held only in the editor.
  The same rule now runs in the Travel Guide editor: `TravelGuidesPanel.tsx`
  reuses `draftAutosave.ts`, creates the guide row on the first write, and
  leaves a Published or Scheduled guide alone.
- **Guide author is bilingual (26 November 2026):** `GuideDraft` carries
  `authorEn` and `authorMm` instead of one `author`, so the reader shows the
  byline in the reader's language. The editor asks for both, and a guide saved
  with the old single field keeps its value in both.
- **Not built:** server-side `version` checks, and the reader's coordinates,
  rating and `read_minutes` from the table (they are derived in
  `contentReader.ts`).

Corrections to what the Plan said earlier today: the ad limit is 3, not 2 (code wins); the story check needs one non-empty text block in either language, not every paragraph in both. A caption is now MM/EN as decided below.

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

#### 5. Media endpoint (`POST /api/media/upload` in the one Worker, with the R2 binding)

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

**Built 26 November 2026.** The rule is `src/lib/cardMeta.ts` (`hasRating`,
`hasDistance`), applied in the shared `ListingCard` and in the page-level cards
that draw their own meta row: Nearby, Rentals, Place detail, Restaurant, Book
Shop, City and Travel Plan. The two formatters beside it (`formatRating`,
`formatDistance`) use the same `Intl` + `my-MM` convention as the rest of the
app, so a Myanmar reader sees `၄.၉` and `၁.၂ ကီလိုမီတာ`.

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
- **Earnings** (`guideEarnings.ts`, persisted by `guideEarningsStore.ts`): one row per guide (`guideId`, `guideTitle`, `author`, `publishedAt`, `amountUsd` null until set, `amountSetAt`, `paid`, `paidAt`). `setEarningAmount` ignores negative or non-finite values; `markEarningPaid` works only when an amount exists; `earningsForAuthor` narrows the list for a Guide Content Admin; `authorTotals` gives each author's payable USD, settled USD and pending rows. The section itself is `GuideEarningsPanel` (Plan §16B.1): Payment Admin sets the amount and settles, Admin reads every author, Guide Content Admin reads only its own.
- **Reader projection** (`contentReader.ts`): stops are sorted by time, `place` comes from the linked listing rather than the typed text, and duration is the span between the first and last stop, at least one hour. The reader accepts the guide by slug, and by row id for a seeded guide or one saved before slugs existed.
- **Scheduling and earnings** (24 November 2026): a scheduled guide publishes through the same job as a blog post, and the first publish writes its earning row, so a republish cannot create a second one.
- **Guide slug** (26 November 2026): `AdminGuide.slug` holds the URL name; `src/lib/guideSlug.ts` is the one place that assigns it, so the editor, the scheduled publish job and the reader share a rule. It is fixed at the first publish and numbered when taken, and a guide without one keeps its row id, so an older link still resolves. `slugify` and `uniqueSlug` moved to `src/lib/slug.ts` and `contentReader.ts` re-exports them, because the guide code must not import the reader.
- **A removed listing flags, never hides (26 November 2026, §5 acceptance 7):** `src/lib/guideListingHealth.ts` answers `stopListingMissing`, `missingListingStops` and `guideNeedsReview` by checking each stop's `listingId` against `LISTING_IDS`. The flag is derived rather than stored, so a listing that comes back clears it with no editor opening the guide. The Travel Guide panel shows a "Needs review" section listing each affected guide and the stop titles that lost their listing, and the stop editor says the listing was removed. The reader keeps the guide published and keeps the stop title it stored, and `GuideStop.listingMissing` turns that stop's Directions into a plain "Directions unavailable" label instead of a map link.
- **Not built:** server-side `version` checks. Localized author, draft autosave, the guide slug and the removed-listing flag are built (26 November 2026).

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

### 11.1 Who may review

| Review | Requirement |
|---|---|
| A business or listing | A signed-in traveler with a `completed` booking for that listing, or, for places without bookings (attractions, markets), a recorded **visit**: the traveler taps "I visited" while their location is within 300 m of the place, once per place per 24 hours |
| MH Travel itself (platform) | Any signed-in traveler, once every 90 days |

### 11.2 Rules

- One review per booking or visit. A rating is a whole number from 1 to 5. Text is up to 1,000 characters; up to 3 photos through the WebP pipeline (`reviews/`). A traveler can edit or delete their own review within 14 days.
- **Displayed rating** is a smoothed average, `(5 × 4.0 + sum of ratings) / (5 + number of ratings)`, so one 5-star review does not read as a perfect 5.0. The raw count is shown beside it. Then the Owner adjustment below is applied.
- **Owner reply:** the Owner may post one public reply per review, up to 500 characters. Admin can remove a reply.
- A review appears at once. It is hidden automatically when 3 different travelers report it, until Admin decides.

### 11.3 Reports

Any signed-in user can report a review or a listing with a reason: spam, offensive, wrong information, scam, safety, or other (with a note).

- **Review reports** go to the moderation queue. Admin hides, restores or deletes the review, and the reporters are not told which.
- **Listing reports:** when 3 or more different users report the same listing for wrong information, scam or safety within 30 days, Admin is notified and the listing's rating adjustment drops by 0.2 for each such group of 3, down to −1.5. Admin can set the adjustment to any value between −1.5 and 0, which raises the rating back. The adjustment is never shown publicly.
- MH Travel does not mediate disputes (section 6); repeated violations lead to the Owner's removal.

### 11.4 Data

| Table | Key columns |
|---|---|
| `reviews` (exists) | `id`, `user_id`, `listing_id` (null for a platform review), `booking_id` (nullable), `kind` (`business` / `platform`), `rating`, `body`, `hidden`, `created_at`, `edited_at` |
| `review_photos` | `id`, `review_id`, `key`, `position` |
| `review_replies` | `id`, `review_id`, `owner_id`, `body`, `created_at`, `removed` |
| `reports` | `id`, `reporter_id`, `target_kind` (`review` / `listing`), `target_id`, `reason`, `note`, `status`, `handled_by`, `created_at` |
| `rating_adjustments` | `listing_id`, `value` (−1.5 to 0), `set_by`, `updated_at` |
| `visits` | `id`, `user_id`, `listing_id`, `at`, `distance_m` |

Access: travelers write their own reviews, photos, visits and reports; Owners read their listing's reviews and write replies; Admin and Super Admin moderate; the public reads visible reviews and the computed rating. The rating shown on a listing is recomputed by a function when a review changes, so every card shows the same number.

### 11.5 Acceptance criteria

1. A traveler without a completed booking or a visit cannot review.
2. A single 5-star review gives 4.2, not 5.0 (with the smoothing above).
3. Three distinct reports hide a review until Admin acts.
4. Three listing reports for scam within 30 days lower its rating by 0.2 and notify Admin; Admin can restore it.
5. Every moderation action is audited.

---

## 12. Search, Nearby, Notifications and Support

- Search is unified across all categories at once (hotels, restaurants,
  blogs, guides, rentals together). It favors simplicity and clarity over
  exhaustive filters. The full system specification, including Nearby, is
  section 16H.
- Nearby: GPS-based distance sorting, category chips plus a "more categories"
  search, List/Map toggle, Open Now emphasized, results as grid cards. The
  separate location selector, distance chips and search field were removed at
  the founder's request (section 16): Nearby asks for location silently and
  falls back to the center of Yangon.
- Notifications fire when Admin publishes new content, an Owner publishes a
  new listing or promotion, or a booking status changes. The event list,
  recipients and links are in section 16B.3.
- Support: logged-in users get live chat with MH Travel; guests get a
  contact form only. Owner Admins have a separate private chat channel.

### 12.1 Support: how it works

| Table | Key columns |
|---|---|
| `support_threads` | `id`, `user_id`, `kind` (`traveler` / `owner`), `status` (`open` / `closed`), `assigned_to`, `created_at`, `updated_at` |
| `support_messages` | `id`, `thread_id`, `sender_id`, `body`, `created_at`, `read_at` |
| `contact_messages` | `id`, `name`, `email`, `phone`, `message`, `lang`, `status`, `handled_by`, `created_at` |

- A signed-in traveler has one open thread; messages arrive live through Realtime. A message is plain text up to 2,000 characters; images are not supported in this phase.
- **Owner Admins** use a separate thread of kind `owner`, which travelers and other owners can never read.
- **Guests** use the contact form through `submit_contact_message`, rate-limited and protected by Cloudflare Turnstile; Admin answers by email or phone.
- Admin and Super Admin see all threads, assign them, reply, and close them. A new message notifies the assigned Admin (or all Admin if unassigned); a reply notifies the user.
- Threads and contact messages are kept 24 months.
- Phase: Phase 2, with the Account dashboard Messages view and the Admin inbox.

### 12.2 Acceptance criteria

1. A user's messages are readable only by that user and by Admin and Super Admin.
2. A reply appears live for the other side.
3. A guest cannot open a chat; the contact form is rate-limited.
4. Owner threads are invisible to travelers.

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


### 13.1 Content upkeep and later growth

- The content stays in `src/data/foreignTourist.ts` with its test, until a later phase needs Admin to edit it. If that happens, the page text moves into an Admin-editable table and keeps the same two-language rule and the same checks.
- Admin verifies the emergency numbers and the SIM and currency notes every 6 months and records the date in `Doc/STATUS.md`. The page never quotes prices that change.
- Search (16H) indexes the four anchored sections as `kind = 'info'` so a traveler typing "SOS" or "SIM" lands on the right anchor.
- Acceptance: all four sections are reachable from the jump row; the three national emergency numbers are `tel:` links; no string is missing a language; no visa content appears.

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
- Currency: MMK and USD display. The formatter is used today with a hard-coded
  preview rate; the Admin-managed rate is specified in 16B.5.
- Weather is one centralized service (the `/api/weather` route of the one
  Worker, with caching) reused everywhere, not duplicated per page.

### 14.1 Language

- **First visit:** the browser language decides: Burmese (`my`) gives Myanmar, anything else gives English. The choice is saved on the device and, when signed in, in the profile (`profiles.language`).
- Every string goes through the shared `t()` provider; a key missing a language fails the unit tests. Stored content (posts, guides, listings) holds both languages. When a language is missing the reader shows an auto-translation with an "Auto-translated" marker (16B.4).
- `document.documentElement.lang` follows the choice. Numbers and dates follow the language (Myanmar digits are shown only in Myanmar, never stored).

### 14.2 Currency

- **First visit:** Myanmar language gives MMK, otherwise USD. The choice is saved on the device and, when signed in, in the profile (`profiles.currency`).
- Prices are stored as USD; MMK is shown rounded to the nearest 100 and USD to 2 decimals, using the server exchange rate (16B.5). A booking or order stores the rate it used.

### 14.3 What each Account view reads

| View | Reads |
|---|---|
| My Bookings | the `my_bookings` view (bookings and rental orders) |
| My Travel Plans | `custom_plan_requests` |
| Favorites | `favorites` |
| My Reviews | `reviews` by the user |
| Messages | `support_threads` and `support_messages` |
| Notifications | `notifications` and `notification_feed` |
| Settings | `profiles` (name, avatar, language, currency), sign-out, deletion and export requests |
| Support / Legal | static pages and the contact form |

Each view keeps its local fallback behind the module's flag until the backend is on (16G.5).

### 14.4 Later sign-in methods (phase 2)

Phone sign-in (one-time code), Apple and Facebook are added through Supabase Auth. The SMS provider and the Apple and Facebook credentials are decided when that phase starts. Accounts are linked by verified email where one exists, and never merged across a traveler and an Owner Admin account (section 3).

---

## 15. Repo Conventions

- `.env` holds the public `VITE_` values (`VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY` and the endpoint and flag values in 16G.5). It is
  gitignored and must never be committed. Set the same values in Cloudflare's
  build environment. Secrets never use a `VITE_` name.
- Do not add a `public/_redirects` file. It conflicts with the Worker's
  `not_found_handling` setting and breaks the deploy.
- Every card uses the shared `CardListing` type, with rating, distance,
  isFavorited and views required. A card with no rating or no distance does
  not render those parts (10, Blog card rule).
- Card prices are stored as `priceUsd` and rendered through the currency
  formatter, never as a hardcoded string.
- All UI strings go through the translation helper (`t()`); a missing language
  fails the tests. Seeded catalog content is the remaining hard-coded text and
  moves to the database with each module (16C).
- Ad slots use the shared `AdSlot` component so the collapse rule lives in
  one place.
- Overlays that use `position: fixed` (drawers, modals) must render through
  a React portal into `document.body`. The sticky header uses
  `backdrop-blur`, which makes any `fixed` child size itself to the header
  box instead of the screen. The mobile drawer hit exactly this bug.
- Files go where section 16I says: `Plan/` one file, `Doc/` a fixed list, `SQL/`
  only SQL, `Worker/` one file. A guard test enforces it.
- Every route is declared once in `src/routes.ts`; `App.tsx`, the tests and
  `public/manus-routes.json` read from it. A new page edits all three in place
  and does not re-sort the manifest.
- Delivery checks before any commit: `npm run typecheck`, `npm test`,
  `npm run lint`, `npm run build`. A commit message starts with its ticket id
  (16F.1).
- Pure rules (pricing, status moves, publish checks, normalization) live in
  small modules under `src/lib/` with unit tests, and the database enforces the
  same rules again. The tests and the SQL share their test vectors.
- Naming: one folder per module under `src/features/<module>/`; shared UI in
  `src/components/`; data modules in `src/data/`; module backends in
  `src/lib/<module>Api.ts` with the local fallback behind its flag.

---

## 16. Page Behavior (decided, kept) and Open Items

### 16.1 Page behavior as decided

These bullets record behavior the founder decided page by page. They stay in force unless a section above changes them.

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
- Travel Guide and Search frontend pages are implemented. Every internal link now resolves to a declared route and is guarded by tests (`Doc/STATUS.md`). Nearby, Rentals, Ticketing, Travel Guide, Account, Search and Favorites are frontend UI over local or static data pending backend wiring; the tickets in 16F.2 wire them.
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


### 16.2 Open items

Everything below is a fact or choice only the founder or a vendor can supply. None of it blocks a build step; each has a default or a data setting (16E).

| Item | Needed for | Default until supplied |
|---|---|---|
| Per-post rate for Travel Guide authors | Guide earnings (section 10) | The setting stays empty; Admin enters each amount |
| Terms of each ad campaign | Ads (16A.12) | Set by hand per campaign |
| AdSense and AdMob account ids | Ad fallback (16A) | Fallback off |
| Ticket commission percentage and revenue-share formula | Operator settlement (section 9) | Admin-configurable per operator or branch; no default |
| Definitions of the "express" and "အာတာဖတ်" vehicles | Rental variants (section 8) | Rental Admin adds them as data |
| Payment gateway contracts and fees (KBZPay, AYA Pay, others) | Phase 3 | Payments recorded by staff |
| Translation service provider and key | Auto-translation (16B.4) | Missing languages shown in the other language, flagged |
| SMS provider and Apple and Facebook credentials | Auth phase 2 (section 14.4) | Email and Google only |
| Map tile provider | Nearby Map view (16H.9) | Chosen in launch readiness (Phase 6) |
| Contrast palette decision for the known contrast pair | Launch readiness (Phase 6) | Current palette |

---

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
- **Built 2026-11-25** (browser stand-in for §16A.4): `src/lib/adPlacements.ts` seeds the §16A.3 catalog with 19 keys, `adCampaigns.ts` holds the §16A.5 serving rules and the §16A.6 status machine, `adStats.ts` the event keys, the visibility threshold, the roll-up and the 90-day purge, `adCampaignJobs.ts` the window job, and `adStore.ts` the rows. `AdSlot` follows §16A.1 in order — Admin ad, then AdSense when the placement allows fallback and a client id is set, then collapse — and `AdsManagementPanel` is the seven §16A.7 sections. `SQL/20261125000100_ads.sql` carries the tables with RLS, the click-URL check and the both-language alt check, and `20261125000200_ads_serving.sql` adds `serve_ad`, `record_ad_click`, the roll-up and purge functions and the §16A.9 staff policies. Every §16A.3 key now has a live `AdSlot`, and a click goes through the `/ad/click/<creative_id>` route (`AdClickRedirect`) before it redirects. Still open: applying both migrations and moving the jobs onto a server runner.

- **Built 2026-11-25** (§16A.5 second pass, the two remaining server seams): `serve_ad` now takes the `p_language` argument the Plan names and returns `alt_text` beside both alts; the one-argument signature is dropped so a stale caller cannot reach the old body. The page side is `serveAdFor()` in `src/lib/adServingApi.ts` — it calls the RPC when Supabase is configured, falls back to `serveAdNow()` when the RPC cannot answer, and caches the answer for 60 seconds per placement and language, including a `null` so a collapsed slot is not re-asked on every render. Impressions and clicks now leave the browser: `recordAdEventWithBeacon()` writes the store row and then posts a beacon to `VITE_AD_EVENT_ENDPOINT` (`fetch` with `keepalive` when the beacon is refused), so a closed tab still reports. `AdClickRedirect` calls `recordAdClickRemotely()`, which returns the redirect target from `record_ad_click()`; a creative the server no longer has goes home, and an RPC that cannot answer falls back to the local URL. Still open: the Worker that serves `/ad/event` and the AdSense ids (§16A.12).

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

The response may be cached at the edge for 60 seconds. Click-through goes through `/api/ad/click/<creative_id>`, which records the click and redirects. An impression is counted when at least half the ad has been visible for 1 second (IntersectionObserver), once per creative per session per page view. Basic bot user agents are ignored.

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

### 16A.10 Build steps (who does each: tickets in section 16F.2)

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

Partly built 2026-11-23: `src/lib/adminAudit.ts` writes exactly this row shape (`AdminAuditEntry`: `at` in UTC, `actor`, `actorRole`, `action`, `objectType`, `objectId`, `summary`, `source`), append-only with a 500-row cap, and `src/features/superAdmin/AuditLogPanel.tsx` is the reader — totals, search, action filter, Super Admin only, because the section 16B.1 "Settings and roles" row is Super Admin's. Recorded today at the three write sites that exist: admin-account creation (`created`), guide-earning amount (`updated`) and settlement (`payment`). Still open: the remaining write paths (owners, ad approval, blog and guide publish, rental order status, currency, role changes), and the move to `admin_audit_logs` so rows are append-only in the database and kept 24 months.

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
| Owner or template subscription ending (7, 3, 1 days) | the owner | the renewal screen (built 26 November 2026: `runRenewalReminders()` writes it with an `author` recipient matching the owner's byline, in both languages) |
| Shop Owner application submitted | Admin, Super Admin | the application |
| A scheduled job failed | Super Admin | the jobs page |

### 16B.4 Translation fallback (section 14)

When a text exists in one language only, the reader asks `translate(text, from, to)`. The result is cached in `translation_cache` (`id`, `source_hash`, `from_lang`, `to_lang`, `source_text`, `translated_text`, `status` auto / approved / edited, `reviewed_by`, `created_at`) and shown with a small "Auto-translated" marker. Admin has a review queue of `auto` rows, most viewed first; approving or editing makes the text permanent and removes the marker. The translation provider is called from a Cloudflare Worker with its key in secrets. Names, addresses and prices are never translated.

Built 2026-11-24 (browser stand-in for `translation_cache`): `src/lib/translationCache.ts` holds the rules — `isTranslatable` refuses names, addresses and prices, `sourceHash` keys one text per direction, `resolveLocalized` returns the reader's own text, then a cached translation, then the source language with `needs` set, and `reviewTranslation` turns an `auto` row into `approved` or `edited` so the marker disappears. `src/lib/translationApi.ts` posts to `VITE_TRANSLATION_ENDPOINT` (the Worker) and stores what comes back; with no endpoint it reports `not_configured` and the reader simply shows the source text. `useLocalizedText()` is the reader seam and `AutoTranslatedMark` is the marker; the blog reader (title, excerpt, paragraph, image alt) and the travel guide reader (title, summary, stop title and description) use it. `TranslationReviewPanel` is the Admin queue in the new `translations` workspace section, busiest first, and each approval writes an audit row. `SQL/20261123000400_translation_cache.sql` is the table, its RLS (public read, automatic insert by a signed-in reader, review by Admin and Super Admin only), `cache_translation`, `record_translation_view`, `review_translation` and `translation_review_queue`. Closed 26 November 2026 — every remaining reader: the city page (intro, `bestFor`, `stay`, `travel` now bilingual, plus the category chips, search label, placeholder, result count, empty state and Show more/less through `t()`), the category pages, the place detail page, the restaurant page (dish name, description, badge, menu categories, amenities, nearby places, address/hours/price/cuisine values) and the book shop page (book categories, services, nearby places and the same fact values). `localizedOrFallback()` in `translationCache.ts` is the read used for those: it returns the reader's language, else the language the text was written in, and never asks the Worker and never shows the marker — which is what Plan §16B.4 requires for a name, an address and a price. A grid uses it per card so a twelve-card page does not fire twelve requests; the single-item reader (a blog story, a guide) still goes through `useLocalizedText()` and keeps the marker. The rental catalog's `localized()` gained the same fallback, so a label written in one language no longer renders blank in the other. The notification readers closed the same day: a bell row, an inbox row and a rental notice are stored as `{ mm, en }` (`FeedRow.title`/`message` are `LocalizedTextLike`, `NotificationItem.title` too) and read through `localizedOrFallback()`, so a traveler who switches language after the row was written still sees their own copy. `src/lib/timeAgo.ts` turns an age into a unit and a count and translates it (`time_*_ago`), and `ageBucket()` groups the inbox by Myanmar calendar day rather than by the word in an English label. A row written by an older build with one string is lifted to both on read, so nothing renders blank. Still open: the Worker itself, and moving the queue off browser storage.

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

Built 2026-11-24 (browser stand-in for the Worker): `src/lib/mediaRules.ts` is the one table for the five folders — `MEDIA_RULES` states prefix, accepted types, stored format, byte ceiling and longest edge, `AD_VIDEO` carries the 3 MB / 15 s MP4 limits, `folderPrefix()` refuses a missing or path-like shop id, and `checkMedia()` answers with a translatable code (`unsupported_type`, `too_large`, `video_too_long`, `shop_required`, `quota_reached`). Its `stage` option separates a source image (held only to the 12 MB ceiling, because it is compressed next) from the stored file (held to the folder ceiling). `src/lib/mediaApi.ts` replaces `blogMediaApi.ts`: it converts to WebP, steps the quality down and then halves the longest edge twice before refusing, and both content editors name their folder — `blog-posts` in Blog Post Management, `guide-stops` in Travel Guide Management. `SQL/20261123000500_media_objects.sql` adds `media_objects` (one row per object, `last_referenced_at`, the `shops/<id>/` and size checks), `register_media_object()`, `touch_media_object()`, `shop_media_count()`, `orphan_media_objects(days)` and `delete_media_object()`, with no client insert or delete policy. The orphan job is wired (26 November 2026): `src/lib/mediaObjects.ts` is the browser stand-in for `media_objects`, `registerMediaObject()` records a file that reached R2, `touchMediaUrls()` is called by both content saves with the photos they still use, and `cleanupOrphanMedia()` is bound to `orphan_media_cleanup`, so the 02:00 job now reports how many objects it removed and finds nothing on a second run. A URL with no row — a seeded image, or a preview data URL — is ignored rather than kept alive forever. Still open: the Worker (which must repeat the same checks and call `register_media_object()`), and an Ads creative file input.

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
| Template event purge | daily, 00:15 Myanmar Time | Deletes `shop_template_events` older than 180 days |

Built 26 November 2026, extended 24 November 2026 with
`template_events_purge` (browser stand-in for `pg_cron`): all nine jobs are
`wired: true` in `src/lib/jobs.ts` and each does real work against a store that
mirrors its table. The subscription pair is `src/lib/subscriptionJobs.ts` —
`subscription_expiry` moves Active to grace to expired and writes one audit row
per row that moved, `renewal_reminders` writes one bilingual feed row per due
threshold. Both are safe to run twice: the expiry only rewrites a row whose
derived status differs from the stored one, and a reminder is recorded in
`remindedKeys` as `id:periodEnd:daysLeft`, so renewing the period resets the
count. A handler that throws still becomes a `failed` row plus a Super Admin
bell notice. Still open: the schedule moves to `pg_cron` once
`shop_subscriptions` and the other tables are applied, because a closed browser
runs no job.

### 16B.8 Security baseline

- RLS on every table; no table is readable or writable by the public except through a named view or function.
- Server-side role checks on every write; the client is never trusted for totals, prices, roles or dates.
- Stable error codes, translated on the client; no raw database errors reach the user.
- Rate limits on submissions, uploads and login. Secrets only in Worker and Supabase secrets, never in the repo or `VITE_` variables.
- No plaintext passwords anywhere in production: Admin and Owner creation use Supabase Auth invitations (`Doc/REMAINING-WORK.md`).
- Personal data kept to what a feature needs; the traveler's data is shared with an operator only for a booking the traveler made.
- Daily database backups with a tested restore.

### 16B.9 Environments and delivery

Three environments: local with a development Supabase project, staging, production. Every migration is a file in `SQL/`, so a new project can be rebuilt from the repo. Every push runs typecheck, `npm test` and the production build. Deploys go through Cloudflare. Error tracking and an uptime check are set up before launch.

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
| 10 | Unified Search | v1 starts after Phase 1C with the MH-owned content and gains each module as it lands (section 16H) |

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
| 0. Platform foundation | Migrations committed in `SQL/` and applied by Manus; the repository layout guard test (section 16I); real Auth with the first Super Admin (email and Google); roles on `profiles` and the server role helper; audit log standard; jobs runner; the one Worker with the media route; notification service; exchange-rate service; translation fallback (section 16B) | Super Admin signs in, creates a Blog Post Admin, and the audit row and a notification appear; a failed job alerts Super Admin |
| 1A. Rentals | Section 8 end to end, including Rental Admin | Section 8 acceptance criteria all pass |
| 1B. Blog | Section 10 Blog end to end, including the R2 endpoint and scheduling | Blog acceptance criteria all pass |
| 1C. Travel Guide | Section 10 Travel Guide end to end, with the listing index seeded | Guide acceptance criteria all pass |
| 1D. Ads and Adsboard | Section 16A, starting with Home and `blog_inline`; can run beside 1C | Section 16A acceptance criteria all pass |
| 1E. Search v1 | Section 16H on the MH-owned content (blogs, guides, rentals, cities) | Section 16H.13 acceptance criteria all pass |
| 2. Listings and bookings | Section 16C in order: Hotels first, then the rest one by one; with them the universal booking and voucher work (section 6), reviews and reports (section 11), owner applications (section 3), support chat and the contact form (section 12), the Bus route planner (section 7.3) and the Home feed (section 5); each module joins the search index | Hotels pass the 16C acceptance, then each next module does |
| 3. Owner money and templates | The Owner money system (section 9); the template system (section 4) | A payout run is reproducible from ledger rows; a template switch and fallback work — **both halves are met: `replayPayout()` recomputes a run from its rows (2026-11-27), and a switch and a fallback are exercised on the rendered page (2026-11-28) — `resolveTemplateForShop()` falls back on a lapsed entitlement, a retirement or a rollback, and `npm run a11y` proves every template renders in both themes** |
| 4. Ticketing and operators | Operator system specification (section 9) | Operator system acceptance (section 9) passes |
| 5. Mobile app | App using the same APIs, `serve_ad` with AdMob, push notifications | Same flows pass on a phone |
| 6. Launch readiness | Security review of RLS and Workers; load test of search and booking; backup restore drill; privacy policy and terms pages; error tracking and uptime check; contrast palette decision (`Doc/STATUS.md` §8); content seeding | Checklist signed off by the founder |

Dependencies to respect: the media route of the one Worker (Phase 0) before Blog, Guide and Ads uploads; the listing index before guide stops can use the database; the booking and voucher work in Hotels before any module after it; ledgers before payouts and before the operator settlement.

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
| 16 | Cards hide rating and distance when absent | 4, 10 | Done in `src/lib/cardMeta.ts`; one rule, every card |
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
| 35 | Phase order 0, 1A–1E, 2 to 6 with gates | 16D | Reorder; gates stay |
| 36 | One Cloudflare Worker (`Worker/index.ts`) bound through the root `wrangler.jsonc`; routes under `/api/` | 16G.4, 16I | Split into several Workers later without changing the routes |
| 37 | SQL lives in `SQL/`, applied by Manus with Supabase tools, not the Supabase CLI | 16F, 16I | Move to `supabase/migrations` only if the CLI is adopted |
| 38 | Errors are `P0001` exceptions named `<module>_error_<code>`; no envelope | 16G.2 | The client helper and every function |
| 39 | The Plan adopts the built rental schema and functions (text ids, `set_rental_order_status` with a status argument) | 8, 16G.3 | Reshape the functions and the client together |
| 40 | Search: Postgres `pg_trgm` index, Unicode-only storage with Zawgyi conversion, aliases as data, 20 results per page | 16H | Move to a search service if the index outgrows Postgres |
| 41 | Nearby: haversine distance without PostGIS; manual location beats GPS beats Yangon center | 16H.9 | Add PostGIS later |
| 42 | Ticket status lives in `Doc/TICKETS.md`; only Claude edits the Plan | 16F | Process change |

**Facts only the founder can supply later** (not blocking any build step): the Travel Guide default per-post rate; the commercial terms of each ad campaign; the AdSense and AdMob account ids; the commission percentage and revenue-share formula for tickets (already left Admin-configurable in section 9); definitions of the "express" and "အာတာဖတ်" vehicles, which Rental Admin enters as data.

## 16F. Agent handoff: who does what (2026-11-23)

Three agents work on MH Travel. This section is the single set of instructions for all of them.

| Agent | Does | Does not |
|---|---|---|
| **Claude** | Writes and maintains this Plan only. Answers questions about it. | Write application code, SQL or Worker code. |
| **OpenHands** | Application code in `src/`, its tests, and the `Doc/` updates for what it ships. | Touch Supabase, Cloudflare, R2 or secrets. |
| **Manus AI** | Supabase (applying `SQL/`, RLS, functions, cron, Auth settings, seeds) and Cloudflare (the one Worker, R2, cron triggers, secrets), and the `Doc/` updates for what it ships. | Change the frontend, except environment variable values. |

Project facts for Manus: Supabase project `mhtravelmm`, ref `ewuvxowujkbyvftoihxh`, region `ap-southeast-1`. The four applied migrations are described in Appendix B at the end of this Plan and are not in the repo as SQL; ticket M-00 exports them as the baseline. OpenHands has already written the migrations in `SQL/` (rental, exchange rates, job runs, notification feed, translation cache, media objects, scheduled publishing, content lifecycle, ads, subscriptions, owner ledger, shop templates); **none is applied** to any Supabase project yet. The root `wrangler.jsonc` serves only the built site (static assets) until ticket M-06 adds the Worker.

### 16F.1 Rules

1. **Only Claude edits this Plan.** Agents never edit `Plan/PROJECT-PLAN.md`. When code or the backend needs to differ from the Plan, or a point is unclear, write it in `Doc/PLAN-VS-CODE.md` under a heading "Questions for the Plan", with the section number, and keep building to the Plan until Claude answers. Where code already exists and works, Claude adopts it into the Plan (as with the rental functions in 16G.3).
2. **Contract first.** Names, arguments, return shapes and error codes in section 16G are fixed. Neither agent renames or reshapes them alone.
3. **Files go where section 16I says.** SQL only in `SQL/`, the Worker only in `Worker/`, documents only in `Doc/`, the Plan only in `Plan/`. A guard test enforces it (ticket O-05).
4. **Never blocked.** OpenHands builds against the contract and keeps a local-preview fallback in each module adapter (`src/lib/<module>Api.ts`), switched by the per-module flags in 16G.5. Manus works through its tickets in order. When a Manus ticket lands, the matching flag is turned on.
5. **Forward-only database changes.** Manus never edits or deletes an applied migration; it adds a new file in `SQL/`. It tries every migration on the staging project before production, and takes a backup before any destructive change. Applying is done with Supabase tools, not the Supabase CLI (whose default folder is `supabase/migrations`).
6. **Secrets stay out of the repo and the browser.** The browser gets only `VITE_` values. The service role key, R2 credentials and API keys live in Supabase and Worker secrets.
7. **Definition of done for every ticket:** the acceptance criteria of the Plan section it cites pass; `npm run typecheck`, `npm test`, `npm run lint` and `npm run build` pass; and `Doc/` is updated: `COMPLETED-WORK.md` says what was built and how (files, migration names, function names), `REMAINING-WORK.md` loses the finished item, `STATUS.md` marks it, and `TICKETS.md` records the ticket status and commit. Commit messages start with the ticket id.
8. **Backend changes are visible in `Doc/`.** For each migration or Worker route, Manus records the file name and the date applied in `TICKETS.md`, so OpenHands knows the contract is live.

### 16F.2 Tickets: Phase 0 and Phase 1 (and Search)

Ids: `M-` for Manus, `O-` for OpenHands. Status lives only in `Doc/TICKETS.md`. Tickets for Phase 2 onward are written by Claude when Phase 1 is complete.

| ID | Agent | Task | Depends on | Done when |
|---|---|---|---|---|
| M-00 | Manus | Export the live schema (tables, policies, functions, triggers) as `SQL/00000000000000_baseline.sql`; create a staging project; rebuild staging from `SQL/` | none | A project built only from `SQL/` matches the live schema with an empty diff |
| M-01 | Manus | Roles: apply the role migrations (`20261122000050_rental_roles.sql`, `20261122000400_rental_role_slugs.sql`) so `current_role_name()` resolves the slug in `profiles.role`; add `private.has_role(text[])` if the policies need it; keep `public.is_super_admin()` | M-00 | A test as each of the nine roles confirms what it can and cannot read or write |
| M-02 | Manus | Audit log per 16B.2: check and extend `admin_audit_logs`; add `private.write_audit(...)`; a purge at 24 months | M-01 | A write by a role creates one audit row; older rows are purged |
| M-03 | Manus | Jobs: enable `pg_cron`; `job_runs` table; a failed job notifies Super Admin | M-04 | A forced failure appears in `job_runs` and in Super Admin's bell |
| M-04 | Manus | Notifications: `notification_feed`; Realtime on it; a 90-day purge | M-00 | A feed row reaches a signed-in client within seconds |
| M-05 | Manus | Exchange rates: `exchange_rates`, `get_exchange_rate()`, `set_exchange_rate()` (Super Admin and Payment Admin) | M-01 | The latest effective row is returned; rows cannot be edited |
| M-06 | Manus | The one Worker `Worker/index.ts` with the routes of 16G.4, the R2 bucket, the public base URL, and the root `wrangler.jsonc` changes (`main`, `assets.run_worker_first`, the `MEDIA` binding, cron triggers). Start with `POST /api/media/upload` | M-01 | An upload by an allowed role stores a WebP at the right key; a wrong role, type or size is refused with the right code; the static site still serves every other path |
| M-07 | Manus | `media_objects` table and the nightly orphan cleanup (a scheduled handler in the Worker) | M-06, M-03 | An unreferenced object older than 30 days is removed; a referenced one never is |
| M-08 | Manus | Translation: `translation_cache`, the `POST /api/translate` route, review functions `list_translation_review` and `review_translation` | M-06 | A missing language returns a cached auto-translation; approving it makes it permanent |
| M-09 | Manus | Auth: Google provider and redirect URLs; invitation flow for Admin and Owner accounts (no plaintext passwords); a username-login resolver that does not expose emails. Needs the founder's provider credentials entered by the founder in the session | M-00 | An invited admin signs in with the right role; the first Super Admin works with Google |
| O-00 | OpenHands | `src/lib/backend.ts`: the per-module flags, an `rpc(name, args)` helper that reads a `P0001` error message and returns it for `t()`, and the common-code mapping | none | Unit tests cover success, a module error and an unknown error |
| O-01 | OpenHands | `roleFromProfile`: maps `profiles.role` to `AuthRole` and `AdminRole` (16G.5); the guards use it; in Supabase mode the product role is read from the database; `content_admin` is retired there | none | Tests cover all nine values |
| O-02 | OpenHands | Notification feed and currency clients read `notification_feed` and `get_exchange_rate()` with local fallback | M-04, M-05 | With the backend on, the bell and the currency use server data |
| O-03 | OpenHands | Reader fallback for a missing language with the "Auto-translated" marker; Admin review panel | M-08 | Matches 16B.4 |
| O-05 | OpenHands | Repository layout guard: a vitest test `src/repoLayout.test.ts` that fails on anything outside section 16I | none | The test passes on the current tree and fails when a stray file, folder or second Plan file is added |
| M-10 | Manus | Review the rental migrations in `SQL/` (`…000100_rental_catalog`, `…000200_rental_orders`, `…000300_rental_functions`), apply them to staging then production, seed from `src/data/rentalCatalog.ts` | M-01 | Section 8 §3 is complete at the database and the seed matches the app's catalog |
| M-11 | Manus | Complete the rental functions per 16G.3: `add_rental_extra`, remove the extras write policy, drop `p_fx_mmk_per_usd` after M-05 | M-10, M-02, M-04 | Section 8 acceptance 1 to 9 pass at the database |
| M-12 | Manus | Rental jobs: `expire_overdue_rental_orders` every 5 minutes; the notifications of 16B.3 | M-11, M-03 | An Accepted order past its deadline becomes Expired; the notifications fire |
| O-10 | OpenHands | Switch the rental order flow from the browser record to the functions, behind `VITE_BACKEND_RENTALS`; the catalog from the `rental_*` tables | M-11, O-00 | Section 8 acceptance 1 to 4 pass from the page with the flag on |
| O-11 | OpenHands | My Bookings and the voucher page read the server (`my_bookings`) | M-11 | The voucher shows the 17 fields and a QR from server data |
| O-12 | OpenHands | Rental Admin panel on the server: Orders, Catalog, Availability, Rates, Branches, Terms, Settings, Reports | M-11 | Section 8 §8 is complete on server data |
| O-13 | OpenHands | Reschedule and the rental notifications from the server | M-11 | Section 8 acceptance 9 passes |
| M-20 | Manus | Blog tables (section 10 Blog §3), the `blog_posts_public` view, RLS, seed from `src/data/blogsData.ts` and `src/data/additionalBlogPosts.ts` | M-01 | Public reads only published rows |
| M-21 | Manus | Blog functions in 16G.3 and the "publish due content" job | M-20, M-02, M-03, M-04 | Section 10 Blog acceptance 1 to 6 pass at the database |
| O-20 | OpenHands | Blog editor on the functions: autosave, version conflict, bilingual captions, no `galleryUrls`, optional coordinates, slug shown, revisions list | M-21, M-06, O-00 | Section 10 Blog acceptance 1 to 5 pass from the editor |
| O-21 | OpenHands | Blog reader on `blog_posts_public`; cards hide a missing rating or distance | M-20 | Matches section 10 Blog §8 |
| O-22 | OpenHands | Blog Post Admin guard (`blog_admin`) and workspace | M-01, O-01 | The role reaches only the Blog editor |
| M-30 | Manus | `listings_index` seeded from `src/data/listingIndex` | M-00 | Every id the guide editor offers exists in the table |
| M-31 | Manus | Guide tables, functions in 16G.3, `app_settings`, the earning-row trigger | M-30, M-21 | Section 10 Guide acceptance 1 to 5 pass at the database |
| O-30 | OpenHands | Guide editor on the functions; duration from stop times; slug; earnings screens for Payment Admin, Super Admin and the author; reader on the public view; Guide Admin guard (`travel_guide_admin`) | M-31 | Section 10 Guide acceptance 1 to 8 pass |
| M-40 | Manus | Inspect the existing `ads` table first; then the 16A.4 tables, RLS, the placements seed | M-01 | Section 16A.4 is complete; old rows are migrated or retired |
| M-41 | Manus | `serve_ad`, `record_ad_event`, the admin functions, the Worker routes `/api/ad/click` and `/api/ad/event`, the roll-up and the campaign start and end jobs | M-40, M-03, M-06 | Section 16A acceptance 1 to 4 pass |
| M-42 | Manus | Ad media folder `ads/` limits in the upload route | M-06 | An ad image over 300 KB or a video over 3 MB is refused |
| O-40 | OpenHands | `AdSlot` calls `serve_ad` (keeping the collapse), the viewability beacon, `rentals_top` replaces the fixed banner | M-41 | Section 16A acceptance 1 to 4 pass in the browser |
| O-41 | OpenHands | The Adsboard (16A.7): pages and placements, campaigns, creatives and approvals, advertisers, reports, settings; guard `ads_admin` and `super_admin` | M-41 | Section 16A.11 passes |
| M-50 | Manus | Search: extensions `pg_trgm` and `unaccent`; `search_index`, `search_aliases`, `search_log`; `normalize_search_text`; triggers from the source tables; `search_all`, `search_suggest`, `search_nearby`, `rebuild_search_index`, `set_search_boost`, `get_search_report`; seed from the MH-owned content | M-21, M-31 | Section 16H.13 acceptance 1 to 11 pass at the database |
| O-50 | OpenHands | Search page on the functions: the shared normalizer with test vectors, suggestions, recent searches, URL state, interpreted chips, counts; behind `VITE_BACKEND_SEARCH` | M-50, O-00 | Section 16H.13 acceptance 12 and 13 pass |
| O-51 | OpenHands | Nearby page on `search_nearby`: GPS, manual location, Open Now, List and Map | M-50 | Section 16H.9 behavior passes |
| O-52 | OpenHands | Admin search tuning: aliases, boosts, the report | M-50 | Section 16H.11 passes |

### 16F.3 Order of work

Manus: M-00, then M-01 to M-09 (any order after M-00 and M-01), then M-10 to M-12, M-20 and M-21, M-30 and M-31, M-40 to M-42, M-50. OpenHands: O-00, O-01 and O-05 now, then each module's tickets as the matching Manus ticket lands. Rentals first, then Blog, then Travel Guide, then Ads, then Search, as in the roadmap (section 16D). Ads can start while Travel Guide is in progress.

## 16G. Contracts: names, shapes and codes (2026-11-23)

These are fixed (rule 2 of 16F.1). Argument and field names are exact. Dates are `YYYY-MM-DD`; times are UTC `timestamptz` unless a field says Myanmar Time (MMT). Where code already exists, this section records what is built, and the Plan follows the code.

### 16G.1 Conventions

- Migrations are `.sql` files in the `SQL/` folder (section 16I), named `<YYYYMMDDHHMMSS>_<slug>.sql`, one concern per file, applied in name order, forward-only.
- Tables and columns are `snake_case`. Primary keys are `id uuid default gen_random_uuid()`, except lookup tables keyed by a text slug (as the rental catalog is built). Every table has `created_at`; mutable ones also have `updated_at` with a trigger.
- Functions are named `verb_object`. Those called by the app are `security definer` with a fixed `search_path`, live in `public`, and take the caller from `auth.uid()` and `public.profiles.role`. Helpers that must not be callable by the app live in the `private` schema.
- Every table has RLS. Reads that are public go through a named view or a function; writes go through functions, never through a direct insert or update policy for the client.
- Document-shaped saves (blog post, travel guide, ad campaign) take one `jsonb` document. Everything else takes positional arguments, as the rental functions do.

### 16G.2 Errors (as the rental functions already do)

A failure raises a Postgres exception with SQLSTATE `P0001` whose message is `<module>_error_<code>` (for example `rental_error_start_date`). The client shows `t('<message>')` in Myanmar and English, and a generic message for an unknown one. A success returns the row or a `jsonb` document directly; there is no envelope. When a failure needs data, the exception `DETAIL` is a JSON string, for example `{"problems":[{"code":"cover"}]}`.

Prefixes: `common_`, `rental_`, `blog_`, `guide_`, `ads_`, `search_`, `media_` (the Worker returns the same names with HTTP status codes).

Common: `common_error_not_signed_in`, `common_error_forbidden`, `common_error_not_found`, `common_error_version_conflict`, `common_error_rate_limit`.

Rental (already in `SQL/20261122000300_rental_functions.sql`): `rental_error_not_signed_in`, `category`, `city_availability`, `variant`, `branch`, `start_date`, `end_date`, `min_days`, `name`, `phone`, `address`, `participants`, `terms`, `rate_limit`, `rate_missing`, `forbidden`, `order_missing`, `status_transition`, `payment_method`, `reschedule_not_paid`, `reschedule_limit`, `reschedule_too_late`, `reschedule_unchanged` (each prefixed `rental_error_`).

Blog and Guide: `blog_error_publish_blocked` and `guide_error_publish_blocked` with `DETAIL.problems` using exactly the codes in `src/lib/publishProblems.ts` (`title_languages`, `excerpt_languages`, `category`, `cover`, `story_text`, `alt_missing`, `schedule`, `author`, `stop_required`, `stop_listing`, `stop_languages`, `stop_time_format`, `stop_time_order`, `ad_first`, `ad_adjacent`, `ad_max`); plus `*_error_version_conflict`.

Ads: `ads_error_forbidden`, `ads_error_invalid_transition`, `ads_error_creative_not_approved`.

Search: `search_error_query_too_long`, `search_error_bad_sort`, `search_error_location_required`.

### 16G.3 Functions

**Rentals (built; section 8)**

| Function | Arguments | Returns | Who |
|---|---|---|---|
| `submit_rental_order` | `p_city_id text`, `p_category_id text`, `p_variant_id text`, `p_start_date date`, `p_end_date date`, `p_participants integer`, `p_customer_type text` (`citizen` / `foreigner`), `p_fulfillment text` (`delivery` / `branch`), `p_branch_id text`, `p_delivery_address text`, `p_customer_name text`, `p_phone text`, `p_special_requests text`, `p_terms_version text`, `p_display_currency text` (`MMK` / `USD`), `p_fx_mmk_per_usd numeric` | the new `rental_orders` row | signed-in traveler |
| `set_rental_order_status` | `p_order_id uuid`, `p_status text`, `p_note text default ''`, `p_payment_method text default null` | the updated row. `p_status` is `accepted`, `paid` (needs `p_payment_method`: `cash`, `bank_transfer`, `mobile_wallet`), `completed`, `expired` or `cancelled` (staff only; the note is the reason). Allowed moves: requested → accepted or cancelled; accepted → paid, expired or cancelled; paid → completed or cancelled | `rental_admin`, `admin`, `super_admin`; `paid` also `payment_admin` |
| `reschedule_rental_order` | `p_order_id uuid`, `p_start_date date` | the updated row | the order's traveler |
| `expire_overdue_rental_orders` | none | `integer`, the number expired | the 5-minute job |
| `add_rental_extra` (to build) | `p_order_id uuid`, `p_description text`, `p_amount_usd numeric` | the new `rental_order_extras` row | `rental_admin`, `super_admin` |
| helpers | `rental_rate_for(p_city, p_category, p_variant)`, `rental_inclusive_days(p_start, p_end)` | rates; days | internal |

Catalog reads are direct `select`s on the `rental_*` catalog tables (public read of active rows); there is no `get_rental_catalog` function. `my_bookings` is a view.

Two changes the built schema needs, both as forward migrations: (a) once `get_exchange_rate()` exists (M-05), `submit_rental_order` drops `p_fx_mmk_per_usd` and reads the server rate; (b) the `rental_order_extras` write policy is removed, so extras go only through `add_rental_extra`.

**Blog (section 10)**

| Function | Arguments | Returns | Who |
|---|---|---|---|
| `save_blog_post` | `p_post jsonb`: `id` (optional), `title_en`, `title_mm`, `excerpt_en`, `excerpt_mm`, `category_slug`, `cover_key`, `cover_url`, `author_en`, `author_mm`, `location_en`, `location_mm`, `latitude`, `longitude`, `seo_tags text[]`, `blocks[]`, `status` (`Draft` / `Scheduled`), `scheduled_for_mmt` (`YYYY-MM-DDTHH:mm`, MMT); `p_expected_version integer` (null for a new post); `p_autosave boolean` | `jsonb`: `{ id, slug, version, status }`. Autosave writes the draft row only (no revision, no audit). A `Scheduled` save runs the publish check and raises `blog_error_publish_blocked` | `blog_admin`, `super_admin` |
| `publish_blog_post` | `p_id uuid`, `p_expected_version integer` | `{ id, slug, version, published_at }` | same |
| `unpublish_blog_post` | `p_id uuid` | `{ id, status: "Draft" }` | same |
| `delete_blog_post` | `p_id uuid` | `{ id }` (soft delete) | same |
| `list_blog_revisions` | `p_post_id uuid` | `{ revisions[ { id, saved_at, status, saved_by } ] }` | same |
| `get_blog_revision` | `p_revision_id uuid` | `{ snapshot }` (nothing is saved; restoring is a normal save) | same |
| `increment_blog_views` | `p_slug text` | `{ views }` | anyone |

A block is exactly `{ id, type: "text", text_en, text_mm }`, `{ id, type: "image", image_url, alt_en, alt_mm, caption_en, caption_mm, credit }` or `{ id, type: "ad" }`. The public view `blog_posts_public` exposes: `id`, `slug`, `category_slug`, `cover_url`, `title_mm`, `title_en`, `excerpt_mm`, `excerpt_en`, `author_mm`, `author_en`, `location_mm`, `location_en`, `latitude`, `longitude`, `rating`, `read_minutes`, `blocks`, `published_at`, `views`, `favorite_count`.

**Travel Guide (section 10)**

| Function | Arguments | Returns | Who |
|---|---|---|---|
| `save_travel_guide` | `p_guide jsonb`: `id` (optional), `title_en`, `title_mm`, `summary_en`, `summary_mm`, `category`, `cover_key`, `cover_url`, `author_name`, `status`, `scheduled_for_mmt`, `stops[]` (each `day_number`, `time_text`, `listing_id`, `title_en`, `title_mm`, `description_en`, `description_mm`, `image_key`); `p_expected_version integer`; `p_autosave boolean` | `{ id, slug, version, status }`; the stops are replaced with the guide in one transaction | `travel_guide_admin`, `super_admin` |
| `publish_travel_guide`, `unpublish_travel_guide`, `delete_travel_guide` | as for Blog | as for Blog | same |
| `list_guide_earnings` | none | `{ rows[ { id, guide_id, author_name, published_at, amount_usd, paid, paid_at, paid_mmk } ] }`; an author sees only their own | `travel_guide_admin` (own), `payment_admin`, `super_admin` |
| `set_guide_earning_amount` | `p_id uuid`, `p_amount_usd numeric` | the row | `payment_admin`, `admin`, `super_admin` |
| `mark_guide_earning_paid` | `p_id uuid`, `p_paid_mmk numeric`, `p_note text` | the row; refused when `amount_usd` is null | `payment_admin`, `super_admin` |

**Settings.** `get_setting(p_key text)` and `set_setting(p_key text, p_value jsonb)` over `app_settings(key text primary key, value jsonb, updated_by, updated_at)`; `set_setting` is Super Admin only. Keys: `guide_post_rate_usd`, `rental_new_order_highlight_hours` (default 2), `rental_min_notice_days` (default 1), `ad_fallback_provider` (`adsense` or `none`), `ad_adsense_client_id`, `translate_provider`.

**Ads (section 16A)**

| Function | Arguments | Returns | Who |
|---|---|---|---|
| `serve_ad` | `p_placement text`, `p_language text` | `null`, or `{ creative_id, campaign_id, type, media_url, click_url, alt, advertiser }`. "Nothing to show" is `null`, not an error | anyone |
| `record_ad_event` | `p_creative_id uuid`, `p_placement text`, `p_kind text` (`impression` / `click`), `p_session_hash text` | nothing | anyone |
| `save_ad_campaign` | `p_campaign jsonb` (advertiser, dates, priority, weight, placements, creatives, `agreed_fee_mmk`) | `{ id, status }` | `ads_admin`, `super_admin` |
| `set_campaign_status` | `p_id uuid`, `p_action text` (`submit`, `pause`, `resume`, `end`) | `{ id, status }` | same |
| `review_creative` | `p_id uuid`, `p_decision text` (`approve` / `reject`), `p_reason text` | `{ id, approval }` | `super_admin` only |
| `set_placement_active` | `p_key text`, `p_active boolean` | `{ key, active }` | `ads_admin`, `super_admin` |
| `get_ad_report` | `p_from date`, `p_to date`, `p_group_by text` (`placement`, `campaign`, `day`) | `{ rows[ { key, impressions, clicks, ctr } ] }` | `ads_admin`, `super_admin`, `payment_admin` |

**Search and Nearby (section 16H)**

| Function | Arguments | Returns | Who |
|---|---|---|---|
| `search_all` | `p_q text`, `p_lang text`, `p_city text`, `p_kinds text[]`, `p_sort text` (`relevance`, `rating`, `nearest`, `newest`), `p_lat numeric`, `p_lng numeric`, `p_limit integer default 20`, `p_offset integer default 0` | `{ items[ { kind, ref_id, title, subtitle, href, thumbnail_url, city_id, rating, distance_km, score } ], counts { all, <kind>... }, interpreted { mode, city, kind, text }, city_counts { <city_id>: n }, next_offset }`; `mode` is `city`, `category`, `city_category` or `text` (16H.6) | anyone |
| `search_suggest` | `p_prefix text`, `p_lang text`, `p_limit integer default 8` | `[ { text, kind, href } ]` | anyone |
| `search_nearby` | `p_lat numeric`, `p_lng numeric`, `p_radius_km numeric default 10`, `p_kinds text[]`, `p_open_now boolean default false`, `p_limit integer default 20`, `p_offset integer default 0` | the `search_all` item shape plus `distance_km`, `open_now`, `closes_at` | anyone |
| `rebuild_search_index` | none | `integer` rows written | `super_admin` |
| `set_search_boost` | `p_kind text`, `p_ref_id text`, `p_boost integer` (−20 to 50) | the index row | `super_admin`, `admin` |
| `get_search_report` | `p_from date`, `p_to date` | `{ top_queries[], zero_result_queries[], click_through }` | `super_admin`, `admin` |

### 16G.4 The one Worker

There is **one** Cloudflare Worker, `Worker/index.ts` (section 16I). It serves the API under `/api/` and runs the scheduled jobs; every other path is served by the static site. The root `wrangler.jsonc` binds it: `main` points to `Worker/index.ts`, `assets.run_worker_first` is `["/api/*"]`, the R2 bucket binding is named `MEDIA`, and the cron triggers are set. Same-origin calls need no CORS in production; a development allowlist covers `http://localhost:5173`.

| Route | Contract |
|---|---|
| `POST /api/media/upload` (multipart: `file`, `folder`, `contentType`; header `Authorization: Bearer <Supabase access token>`) | Success `{ url, key, bytes }` with status 200. Failure: status 4xx and `{ code, message }` with `code` one of the existing `MediaErrorCode` values (`choose_image`, `unsupported`, `still_large`, `r2_failed`) or `media_error_forbidden`, `media_error_rate_limit`. Folders and limits as in 16B.6; a folder is allowed only for the roles that own it (`blog-posts/`: `blog_admin`, `super_admin`; `guide-stops/`: `travel_guide_admin`, `super_admin`; `ads/`: `ads_admin`, `super_admin`; `rentals/`: `rental_admin`, `super_admin`). Keys: `<folder>/<yyyy>/<mm>/<uuid>.webp`. The current client already reads `url` and `key`. |
| `GET /api/ad/click/:creativeId?p=<placement>&s=<session>` | Records a click and answers 302 to the creative's click URL. The link is signed with `AD_CLICK_SIGNING_KEY` so it cannot be forged |
| `POST /api/ad/event` (JSON `{ creative_id, placement, kind: "impression", session_hash }`) | Records an impression; answers 204 |
| `POST /api/translate` (JSON `{ text, from, to }`) | `{ text, status }`, using `translation_cache` first |
| `GET /api/weather?city=<id>` | The one central weather service of section 12, cached for 30 minutes per city; returns the city's current conditions and forecast |
| scheduled handler | Runs the jobs of 16B.7 that are not `pg_cron` |

### 16G.5 Roles, flags and environment

**Roles.** `profiles.role` in the database keeps its existing values. The app has two vocabularies on top of it: the coarse `AuthRole` in `src/lib/auth.tsx` and the product `AdminRole` names in `src/lib/adminRoles.ts`. One function, `roleFromProfile`, maps the database value to both (ticket O-01); the product role is read from the database and is never kept only in the browser once Supabase is configured.

| Plan role | `profiles.role` | Frontend `AdminRole` |
|---|---|---|
| Traveler | `traveler` | none |
| Super Admin | `super_admin` | `Super Admin` |
| Ads Admin | `ads_admin` | `Ads Admin` |
| Admin | `admin` | `Admin` |
| Rental Admin | `rental_admin` | `Rental Admin` |
| Payment Admin | `payment_admin` | `Payment Admin` |
| Travel Guide Content Admin | `travel_guide_admin` | `Travel Guide Content Admin` |
| Blog Post Admin | `blog_admin` | `Blog Post Admin` |
| Owner Admin | `owner_admin` | `Owner Admin` |

The database check allows exactly these nine values today. The app's `content_admin` is not a database value and is retired in Supabase mode. `shop_owner`, `main_owner` and `branch_owner` are added to the check when Phase 2 and Phase 4 need them.

**Role spelling (decided 2026-11-23).** `profiles.role` stores the slug (`rental_admin`); the UI, this Plan and the permission matrix use the product name (`Rental Admin`). The server's `current_role_name()` resolves either spelling (`SQL/20261122000400_rental_role_slugs.sql`) and `src/lib/roleMapping.ts` does the same in the app, so SQL policies compare product names. A new role must be added to both or it signs in as a traveler and fails every write.

**Frontend environment variables** (public values only): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BLOG_MEDIA_UPLOAD_ENDPOINT` (the upload route; the name is kept, the value is `/api/media/upload`), `VITE_MEDIA_PUBLIC_BASE_URL`, `VITE_AD_API_BASE` (`/api/ad`), `VITE_TRANSLATE_ENDPOINT` (`/api/translate`).

**Per-module flags:** `VITE_BACKEND_RENTALS`, `VITE_BACKEND_BLOG`, `VITE_BACKEND_GUIDES`, `VITE_BACKEND_ADS`, `VITE_BACKEND_SEARCH`, each `on` or `off`. A module uses the backend only when its flag is `on` and Supabase is configured; otherwise it keeps its local preview, as `mainOwnerApi.ts` does today.

**Secrets** (Supabase and Worker secrets only, never in the repo): `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` or the JWKS URL, `ALLOWED_ORIGINS`, `TRANSLATE_API_KEY`, `AD_CLICK_SIGNING_KEY`, and the R2 binding `MEDIA`.

## 16H. Search and Nearby: system specification (2026-11-23)

Written against `src/features/search/SearchPage.tsx`, the Nearby rules in section 12, and `Doc/STATUS.md`.

### 16H.1 Rules (already decided, section 12)

- Search is **unified**: hotels, restaurants, cafes, attractions, markets, book shops, rentals, transport, blogs, guides, travel plans and cities in one query. It favors simplicity over exhaustive filters.
- Nearby: GPS-based distance sorting, a location bar with manual override, category chips plus a "more categories" search, a List and Map toggle, Open Now emphasized, results as grid cards.

### 16H.2 As built (PREVIEW)

`SearchPage.tsx` searches an in-memory list (`SEARCH_ENTRIES`) built from the seed data modules. The query is lower-cased and `,` and `၊` become spaces. A category alias or a city alias found inside the query (`CATEGORY_ALIASES`, `CITY_ALIASES`) is applied as a filter. The text match is a plain substring test on the title and subtitle. It has filter chips, sort modes and a city pager. It has no ranking, no typo tolerance, no Myanmar-specific handling, no backend, no suggestions and no recent searches.

### 16H.3 What is searchable

| Kind | Source | Appears only when |
|---|---|---|
| `hotels`, `restaurants`, `cafes`, `attractions`, `markets`, `bookshops`, `transport` | `listings` | `status = 'active'` |
| `rentals` | `rental_categories` and `rental_availability` | the category is active (and, with a city filter, offered in that city) |
| `blogs` | `blog_posts` | Published and `published_at <= now()` |
| `guides` | `travel_guides` | Published and `published_at <= now()` |
| `plans` | travel plans | active |
| `cities` | `rental_cities` and the city catalog | active |

Drafts, scheduled items, suspended or pending listings and soft-deleted rows never enter the index.

### 16H.4 The index

One table, `search_index`, so one query covers everything:

`id`, `kind`, `ref_id` (the object's id or slug), `city_id`, `category`, `title_mm`, `title_en`, `subtitle_mm`, `subtitle_en`, `keywords` (MM and EN), `norm_text` (the normalized title, subtitle, keywords and the first 2,000 characters of body), `tsv_en` (an English `tsvector`), `boost_weight` (default 0), `rating`, `views`, `latitude`, `longitude`, `open_time`, `close_time`, `thumbnail_url`, `href`, `published_at`, `updated_at`.

- Extensions: `pg_trgm` (substring and fuzzy match, the only method that works on Myanmar text) and `unaccent` (English). No PostGIS: distance uses a plain haversine function in the `private` schema.
- Indexes: `gin (norm_text gin_trgm_ops)`, `gin (tsv_en)`, and `btree (kind, city_id)`.
- Upkeep: a trigger on each source table inserts, updates or deletes the matching row when an item is published, edited, unpublished or removed. The row changes within 5 seconds. `rebuild_search_index()` (Super Admin) rebuilds everything from the sources.

### 16H.5 Text normalization

One definition, `normalize_search_text(text)` in SQL and `normalizeSearchText()` in TypeScript, checked against the same test vectors so they never disagree.

1. Unicode NFC.
2. Lower-case Latin letters; strip accents (`unaccent`).
3. Convert Zawgyi to Unicode when the input is detected as Zawgyi (a rule-based detector on Zawgyi-only code point patterns). Only Unicode is ever stored. When detection is uncertain the text is left as typed.
4. Remove zero-width characters (U+200B, U+200C, U+200D, U+2060, U+FEFF).
5. Put combining marks into the standard Myanmar order (Unicode Technical Note 11), so differently typed spellings compare equal.
6. Map Myanmar digits to ASCII digits.
7. Turn `,` `၊` `။` `.` `-` `/` into spaces, collapse spaces, trim.

The test vectors include: the same word typed in Zawgyi and Unicode; the same word with different mark order; `ပုဂံ`, `bagan` and `pagan`; a Myanmar number and its ASCII form; text with a zero-width space.

### 16H.6 Understanding the query

- Maximum length 80 characters (`search_error_query_too_long`).
- Myanmar text has no spaces, so the whole normalized query is matched, not word by word. English is also split into words.
- **Aliases are data**, in `search_aliases` (`id`, `kind` city / category / synonym, `term`, `target`, `active`). Admin edits them. Seeds: the city and category aliases now in code, plus common variants (for example `bagan` / `pagan` / `ပုဂံ`, `hotel` / `ဟိုတယ်`).
- A city alias and a category alias found in the query become filters and are removed from the text part; the result carries them as `interpreted { mode, city, kind, text }` and the page shows them as removable chips. If nothing is left in the text part, the result is a browse ordered by rank.
- **Query modes (decided earlier, kept):** `city` (a city only) shows every listing in that city, with one compact filter row `All`, `Top rated`, `Nearby`, `Hotels`, `Restaurants`, `Book Shops`, `Cafes`, `Rentals`, `Attractions`, `Markets`, all working inside that city. `category` (a category only, for example `Hotel`) shows **city cards only**: one card per city that has matches (`city_counts` in the result), with `All`, `Top rated` and `Nearby` fixed and the city chips rotating to the next window every 10 seconds; choosing a city drills into that category in that city, the same as typing both. `city_category` (both, for example `ရန်ကုန် ဟိုတယ်`) shows only that category in that city with `All`, `Top rated` and `Nearby`. `text` is any other query. The page keeps this behavior; the function supplies `mode` and `city_counts` so the page never has to guess.

### 16H.7 Matching and ranking

An item is a candidate when at least one is true: the normalized query is a substring of `norm_text`; title trigram similarity is at least 0.3; the English full-text query matches. Its score is the sum of:

| Part | Points |
|---|---|
| Normalized title equals the query | +100 |
| Title starts with the query | +60 |
| Title trigram similarity | similarity × 50 |
| `norm_text` trigram similarity | similarity × 20 |
| English full-text rank | rank × 20 |
| Matches the interpreted city or kind | +10 |
| Rating | rating × 2 |
| Views | `log10(views + 1)` × 2, at most 8 |
| Blog or guide published in the last 30 days | +5 |
| `boost_weight` (Admin, −20 to 50) | as set |

Ties go to the higher rating, then the title. Sorts: `relevance` (default), `rating`, `nearest` (needs a location, otherwise `search_error_location_required`) and `newest` (blogs and guides). A page is 20 results, at most 50 per request. When a location is given under `relevance`, distance breaks ties.

### 16H.8 Search functions

`search_all`, `search_suggest` and `search_nearby` are in 16G.3. They are callable by anyone and read only active, published rows. `title` and `subtitle` come back in `p_lang`, falling back to the other language. `counts` holds the number of matches per kind for the same query, so the chips show true counts. Protection: a 3-second statement timeout for the API role, a result limit, and the 80-character query limit.

### 16H.9 Nearby

- `search_nearby(p_lat, p_lng, p_radius_km, p_kinds, p_open_now, ...)` returns items inside the radius (default 10 km), ordered by distance, with `distance_km`, `open_now` and `closes_at`.
- **Open Now** is computed in Myanmar Time from `open_time` and `close_time`, handles an overnight close, and treats an unknown schedule as unknown, never as open. A 24-hour listing is always open.
- **Location:** the page asks for GPS silently and uses it for distance. If GPS is refused or unavailable it uses the center of Yangon and keeps working. The separate city selector, radius chips, keyword field and location-status panel were removed at the founder's request and stay removed; the category row, Quick Filters (distance, Top Rated, Near Me, Open Now), favorites and result cards remain.
- The map library loads only when the Map view opens, so the list view stays light. The tile provider is chosen in launch readiness (Phase 6).

### 16H.10 Page behavior

- A 250 ms debounce; suggestions after 2 characters; arrow keys, Enter and Escape work. No search runs while an input method (IME) is composing (wait for `compositionend`).
- The last 8 searches are kept on the device only, with a Clear button.
- State is in the URL (`?q=&city=&kind=&sort=`), so a result can be shared and a reload gives the same page.
- Zero results: show "did you mean" with the best trigram match, then popular cities and categories.
- Cards use the shared `ListingCard` sizes (default `md`). Every string goes through `t()`.

### 16H.11 Logging and tuning

`search_log` (`id`, `at`, `q_normalized`, `lang`, `kind`, `result_count`, `clicked_ref`) stores the normalized query only: no user id, no IP. Kept 90 days. `get_search_report` returns top queries, zero-result queries and click-through. Super Admin and Admin edit `search_aliases` and set `boost_weight` per item. Both are audited.

### 16H.12 Rollout

Search v1 starts after Phase 1C with the MH-owned content (blogs, guides, rentals, cities) and grows as each listing module lands in Phase 2, because the index only needs a trigger per source.

### 16H.13 Acceptance criteria

1. `ပုဂံ`, `bagan` and `pagan` all return the Bagan results.
2. The same query typed in Zawgyi and in Unicode returns identical results.
3. A draft, scheduled, suspended or deleted item never appears.
4. `hotle` finds hotels.
5. `hotels yangon` is interpreted as kind hotels and city Yangon, shown as removable chips.
6. `nearest` without a location fails with `search_error_location_required`; with one it orders by distance.
7. Open Now excludes closed and unknown-hours listings (Myanmar Time).
8. A query over 80 characters is refused.
9. An item published or unpublished changes the results within 5 seconds.
10. The kind counts equal the number of results for that kind.
11. A 10,000-row index answers in under 200 ms at the 95th percentile.
12. A reload of a results URL reproduces the same results.
13. Every string shows in Myanmar and English.

## 16I. Repository layout and file rules (2026-11-23)

Files are not scattered. Each kind of file has one home, and a test (ticket O-05) enforces it.

| Path | Holds | Rule |
|---|---|---|
| `Plan/` | Exactly one file: `PROJECT-PLAN.md` | Only Claude edits it. No second plan, addendum or draft here |
| `Doc/` | Exactly these files: `README.md` (index and rules), `STATUS.md`, `COMPLETED-WORK.md`, `REMAINING-WORK.md`, `PLAN-VS-CODE.md`, `TICKETS.md`, `HISTORY.md`, `BLOG-IMAGE-SOURCES.md` | A new document needs Claude to add it to this list first |
| `SQL/` | Only `.sql` files named `<YYYYMMDDHHMMSS>_<slug>.sql` | Applied in name order; forward-only; never edit an applied file; the baseline `00000000000000_baseline.sql` comes first. No documents here |
| `Worker/` | Exactly one Worker file: `index.ts` | One Cloudflare Worker for the whole `/api/` and the scheduled jobs (16G.4). Until M-06 the folder holds only `.gitkeep`, removed when `index.ts` is added |
| `src/`, `public/` | The app and its static files | As in `AGENTS.md` |
| repository root | Tool and config files (`package.json`, `vite.config.ts`, `wrangler.jsonc`, `tsconfig*.json`, `eslint.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `.gitignore`), `README.md`, `AGENTS.md` | No other documents, SQL or Worker code at the root |

**Not allowed anywhere:** a `supabase/` folder, a `docs/` folder (lower case), a `workers/` or `migrations/` folder, a second Plan file, `.sql` outside `SQL/`, `.md` outside `Doc/`, `Plan/` and the two root files, and Worker code outside `Worker/`. The static-site `wrangler.jsonc` at the root is the single Cloudflare configuration; the Worker is bound through it, so `Worker/` needs no config file of its own.

**Where applied state is recorded.** Whether a file in `SQL/` has been applied is kept in `Doc/TICKETS.md` and in Supabase's own migration history, never in the `SQL/` folder.

**The layout test (O-05)** checks: `Plan/` holds one file named `PROJECT-PLAN.md`; `Doc/` holds exactly the listed files; every file in `SQL/` is a `.sql` file with a valid name, in strictly increasing order; `Worker/` holds only `index.ts` (or only `.gitkeep`); none of the forbidden folders or stray files exist.

## Appendix A. Rentals UI reference provided by the user (2026-11-08)

- Source: https://drive.google.com/file/d/1CaeL6lpWMXGu29krPVJ8xXKreGs0l9qm/view?usp=sharing
- The reference uses a navy/cyan MH Travel page with a wide Shwedagon-at-sunset hero, ride icon, “Rentals” heading, “Rent your favorite ride in Myanmar” copy, bicycle/e-bike/motorbike/scooter/car options, and a “Browse Rentals” CTA.
- Below the hero: the original reference has a compact category selector for Bicycle, E-Bike, Motorbike, Scooter, Car with Driver, and Self-drive Car, plus a Search rentals input; a Popular Rentals horizontal row with six cards, rating and favorite affordances, daily pricing, and Rent Now actions; then a Safe & Reliable Rentals trust banner listing Well-Maintained, Affordable Price, and 24/7 Support. The user's later clarification expands the visible, directly filterable selector to include Bicycle, Motorbike, Car (with driver and self-drive), Camping Tent, Boat, Horse Carriage, E-Bike, Scooter, and other available Rentals categories, rather than hiding these behind View All.
- Desktop reference has a three-column footer, but the existing MH Travel rule remains authoritative: full footer only on Home; other pages retain the global copyright strip. On phones, keep the compact hero, three-column ride-category tiles, search, compact stacked/horizontal-swipe rental list, and the existing persistent five-tab bottom navigation.

- Data integration: preserve `POPULAR_RENTALS` unchanged for Home and City; build a Rentals-page catalog that reuses stable IDs `pre1`–`pre5` and adds unique `pre6`–`pre10`. Rentals favorites resolve in Favorites and Account while existing Home/City rows remain unchanged.

---

## Appendix B. Supabase backend and authentication handoff record

### Supabase project

- Project name: `mhtravelmm`
- Project ref: `ewuvxowujkbyvftoihxh`
- Region: `ap-southeast-1`
- Status at setup: `ACTIVE_HEALTHY`

### Applied migrations

#### `create_user_profiles_and_auth_policies`

Created `public.profiles` with a foreign key to `auth.users(id)`, unique username support, display name, role, avatar URL, and timestamps. Enabled Row Level Security and added own-profile plus Super Admin policies. Added an `auth.users` insert trigger that creates a profile automatically after signup and derives a username from signup metadata or email when needed.

#### `allow_super_admin_role_management`

Updated the role protection trigger so travelers cannot escalate themselves, while a verified Super Admin can change roles through an authorized backend/admin operation.

#### `create_core_travel_data_and_rls`

Created RLS-protected `favorites`, `custom_plan_requests`, `bookings`, `notifications`, `reviews`, `ads`, and `admin_audit_logs` tables. Added ownership/admin policies, status and data checks, UTC timestamps, update triggers, indexes, and a public active-ad read policy. The schema matches the current Favorites, custom-plan quotation handoff, rentals/ticket bookings, notifications, reviews, and Super Admin Ads/Audit roadmap.

#### `harden_core_rls_helper_and_indexes`

Moved the new admin-role helper into the non-exposed `private` schema, optimized the new policies to evaluate auth context once per query, and added indexes for the Ads and audit-log foreign keys. No Edge Functions were deployed because the current frontend has no defined function contract yet.

The Plan folder intentionally stores only this implementation record, not the SQL source. The SQL was applied directly to the Supabase project through the four migrations above.

### Roles

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

### Current RLS behavior

A signed-in traveler can read and update their own profile fields. The profile role cannot be changed by a traveler. Super Admin access is checked through the `public.is_super_admin()` security-definer function. Super Admin policies allow management of profiles and roles. The profile table is protected by RLS and is not open for anonymous reads.

### Signup metadata expected by the trigger

The signup request should send metadata similar to:

```json
{
  "username": "aung_aung",
  "display_name": "Aung Aung",
  "avatar_url": "https://..."
}
```

The trigger uses `username` first. For OAuth signups, if a username is not supplied, it derives a safe username from the OAuth profile/email and the app should send the user through a username-completion step before using the account fully.

### Required frontend integration next

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

### OAuth setup still required

Google and Facebook buttons are present in the Signup UI, but they are not production OAuth yet. The owner must configure these providers in Supabase Auth with:

- Google OAuth Client ID and Client Secret;
- Facebook App ID and App Secret;
- production callback URL(s) shown by Supabase;
- local development callback URL if local testing is needed.

No OAuth secrets belong in the Git repository or in frontend source code.

Facebook App credentials were provided during setup, but they were not entered because Supabase Dashboard login required a manual hCaptcha step. Provider configuration is deferred until the owner resumes the dashboard login. The supplied secret is intentionally not recorded here.

### Account creation note

The first Supabase Auth account was created through the Dashboard and its linked profile was promoted to `super_admin` through a one-time SQL role update. The account email still needs to be confirmed in Supabase Auth before password login can succeed if email confirmation is enabled. Never insert a fake `auth.users` row directly into the database.

---
