# MH Travel — Remaining Work Record

**Last updated:** 23 November 2026
**Verified against:** `main` plus the rental order rules
(`src/lib/rentalOrderRules.ts`), the full Rental Admin panel (catalog,
availability, rates, branches, terms, settings, orders) built to Plan §8.8, the
per-account Favorites/notification/review wiring, and the 22 November work on the
guide route follower, the two owner dashboards, and the Foreign Tourist section;
detail in [`COMPLETED-WORK.md`](./COMPLETED-WORK.md).

The application currently provides a substantial frontend and local-preview experience. The following work remains before production launch.

For the one-page view of what is finished versus open, read
[`STATUS.md`](./STATUS.md) first. This file expands its **NOT DONE** and
**PARTIAL** items.

## Internal links — resolved 20 November 2026

The 48 broken links this section used to list are fixed: nine catalog routes
and six place-detail route families were added, `/book_shop` was corrected to
`/book-shops`, and the three Home "View all" buttons that pointed at
nonexistent sections were removed. Detail in
[`COMPLETED-WORK.md`](./COMPLETED-WORK.md#route-integrity--verified-20-november-2026).

The fix is enforced rather than remembered. `npm test` resolves every seed
`href` against the declared route table, so a new link to a missing route fails
the suite instead of reaching a user as "coming soon."

## Authentication and authorization

- Replace local preview authentication with fully verified Supabase Auth flows in every environment.
- Provision and verify the first real traveler and Super Admin accounts and their linked `public.profiles` rows.
- Add secure username-to-auth identity resolution without exposing private email addresses.
- Configure and verify Google and Facebook OAuth credentials and callback URLs in Supabase.
- Add production `owner_admin`, scoped platform-admin, `main_owner`, and `branch_owner` authorization with server-side checks, invitations, password reset/rotation, and RLS.
- Guide earnings now have their own section (`GuideEarningsPanel`, 23 Nov
  2026), so the §16B.1 row is served for Super Admin, Admin, Payment Admin and
  Guide Content Admin. What remains is persistence: the rows still live in
  browser storage through `src/lib/guideEarningsStore.ts` and need the
  `guide_earnings` table.
- Owner Admin's `O` rows belong in `/shop-owner`, not the admin workspace, so
  the matrix's bookings row is not built there at all.
- Admin Management now lists the stored accounts (`src/lib/adminAccounts.ts`)
  rather than component state, so a created admin survives a reload. The rows
  are still browser storage, not `public.profiles`.
- Audit rows for admin-account creation, guide-earning amount and settlement are
  written by `src/lib/adminAudit.ts` and read in `AuditLogPanel`. What remains:
  write the same row from every other write path (owners, ads approval, blog and
  guide publish, rental order status, currency, roles), and move the store to
  `admin_audit_logs` so rows are append-only in the database and kept 24 months.
- Those three decisions also raise a bell notice through `src/lib/adminNotices.ts`.
  §16B.3 wants a recipient per event (the author, the Rental Admin, Super Admin)
  and Supabase Realtime delivery, so what remains is `notification_feed` and the
  per-recipient fan-out.
- Connect Admin and Shop Owner creation forms to Supabase Auth invitations, profile/business records, acceptance flows, and audit history. Plaintext preview passwords must not be used in production.

## Data persistence and APIs

- Replace seeded/local state for bookings, custom plan requests, views, dashboard metrics, owners, admins, menu items, campaigns, and revenue with authenticated Supabase/API queries. Favorites, notification read-state, and the platform review list are wired (see below); what remains is anonymous-access policy and Admin authoring.
- Rental, Ticketing, and Custom Plan submissions now create an account-scoped
  request record with a reference, show it on confirmation, and list it under
  Account → Bookings / Travel Plans, with a best-effort `public.bookings`
  insert. What remains: read requests back from the table, send the traveler
  notification, persist contact handoff, and connect payment and voucher or
  ticket issuance.
- Apply the rental migrations and switch the client to them. The tables, RLS and
  server functions are written and committed under `supabase/migrations`
  (`rental_categories`, `rental_variants`, `rental_cities`, `rental_branches`,
  `rental_availability`, `rental_rates`, `rental_terms`, `rental_orders`,
  `rental_order_events`, `rental_order_extras`, the `my_bookings` view, and
  `submit_rental_order` / `set_rental_order_status` /
  `reschedule_rental_order` / `expire_overdue_rental_orders`, plus
  `20261122000400_rental_role_slugs.sql`, which maps the stored role slugs to the
  product names the rest of the schema compares). What remains: run them, seed
  the catalog from `src/data/rentalCatalog.ts`, and replace the browser stores
  (`rentalCatalogStore.ts`, `rentalOrders.ts`) with queries. Until
  then the browser record leads and the server rules are only mirrored in
  `src/lib/rentalOrderRules.ts` (all fifteen §8.7 checks, the shared quote and
  the hourly per-account limit), which `buildRentalOrder` in
  `src/lib/rentalOrders.ts` runs before anything is stored.
- Rental Admin panel coverage (Plan §8.8): Catalog, Availability, Rates (city ×
  category × variant with effective dates and history), Branches (name, address,
  phone), Terms (publish a new version, keep the history), and Settings
  (highlight threshold, minimum notice days) are all in the panel. Orders now
  filter by status, city, type and rental-date range, search by code, name or
  phone, carry a `tel:` Call button, require a reason to cancel, and flag a
  Requested order past the Settings threshold. The Reports section (Plan §8.9)
  is in place too: status, city, type and day tallies, paid conversion, median
  accept time, settled value in USD and MMK, and a CSV export. Still open: the
  report reads the browser order list, so it moves to the tables with the rest.
- **Rental notifications (§8.9)** are written on every status change: Requested
  to the Rental Admin, Accepted/Paid/Expired/Cancelled to the traveler, a
  reschedule back to staff. Both bells read browser storage, so they move to the
  `notifications` table with the rest.
- **The rental expiry job** runs in the tab (`useRentalExpiryJob`, every five
  minutes plus once on load). A closed browser cannot expire anything, so the
  schedule moves to a Supabase cron function when the order tables go live.
- **The rental audit log** (`mh-travel-rental-audit`) records catalog diffs and
  order status changes in browser storage; it moves to the admin audit table.
- **Guide costs (Plan §16)** are stored on the order as `extras` in browser
  storage. The `rental_order_extras` table is committed but not applied, so the
  rows move with the rest of the order data. Collecting the added amount still
  goes through the same staff-recorded payment as the daily rate.
- Schedule the rental expiry job (Plan §16B.7, every 5 minutes). The function is
  committed; the `pg_cron` entry and the job-failure notification are not.
- Send the rental notifications (Plan §16B.3): requested to Rental Admin;
  accepted, paid, expired and cancelled to the traveler; rescheduled to Rental
  Admin. The order timeline records each change; nothing is delivered yet.
- Add live ticket operator inventory, availability, seat maps, seat locking, payment, and provider/API integration.
- Replace seeded city/category/business recommendations with city-scoped content tables, real pagination, map distance, open/closed state, availability, and review counts.
- Add Admin-managed content tables and public API/cache invalidation for blogs, guides, listings, and search indexing.
- Move exchange-rate data from the hard-coded preview value to an Admin/Supabase-managed rate service.

## Favorites, notifications, and reviews — wired 22 November 2026

These three were the last Plan §10 step-4 items on local state:

- `src/lib/userScope.ts` scopes every browser-stored row to the account id, so a
  saved favorite no longer follows the next person who signs in on the same
  browser. Guests get their own scope instead of sharing a signed-in user's, and
  the old global key is adopted once and then deleted.
- `FavoritesProvider` (`src/lib/favorites.tsx`) now reads and writes
  `public.favorites` (`user_id`, `listing_id`) when Supabase is configured, rolls
  the optimistic toggle back if the write fails, and falls back to the scoped
  local map otherwise. `AuthProvider` moved above it in `main.tsx` so the
  provider can see the current account.
- `useNotificationFeed` (`src/lib/notifications.ts`) keeps the shared feed rows
  but stores each account's read flags, syncing them to
  `public.notifications` (`user_id`, `id`, `is_read`).
- `usePlatformReviews` (`src/lib/reviews.ts`) reads `public.reviews` where
  `listing_id is null` and falls back to the seeded copy.

Still open on this track:

- Anonymous visitors get the local scope, not a server row, so a guest's
  favorites do not survive a device change. That needs a decision on whether
  guests may hold server rows before a policy is written.
- Notification feed rows are still seeded; nothing creates them yet. Admin
  publish, owner publish, and booking-status events are the triggers described
  in Plan §12.
- Reviews are read-only in the UI. The "verified booking or visit" rule from
  Plan §11 and the Owner-rating adjustment still need an authoring path.

## Blog, media, and Cloudflare R2

- Deploy an authenticated Cloudflare Worker/Pages Function with an R2 binding for the blog media endpoint.
- Enforce `blog-posts/` object keys, WebP content validation, 450 KB size limits, authorization, CORS, rate limits, and durable URL/key responses.
- Add Blog Post, localized block, category, revision, SEO metadata, status, schedule, and audit tables. The block schema, revision cap, and audit actions already exist in `src/lib/blogBlocks.ts` and `src/lib/contentWorkflow.ts`, so the tables mirror that shape.
- Persist cover, gallery, and inline story media transactionally with ordered blocks, alt text, captions, and R2 keys. The reader already renders ordered text, photo, and ad blocks with alt text and captions from local data.
- Remove replaced/orphaned R2 objects safely.
- Add scheduled publishing execution, timezone handling, moderation, draft autosave, optimistic concurrency, and public cache invalidation. Revisions and the audit log are recorded in the editor's local state today and need the tables above to survive a reload.
- Add Travel Guide and Guide Stop tables with the listing reference, then persist the itinerary, revisions, audit entries, and earning rows that `src/lib/guideEarnings.ts` defines. The per-post earning rate is still undecided, so the amount stays an Admin-entered value.

## Dashboard and business operations

- Replace seeded dashboard metrics and local preview records with scoped Supabase/API data.
- Add permission groups, feature-level access checks, admin status transitions, and audit logs. Route-level scoping for the two content roles is done in `src/lib/contentAdminAccess.ts` and the admin shell; the remaining gap is server-side enforcement and account status changes.
- Connect Ads Management to campaign persistence, creative storage, scheduling, budgets, reporting, approval, and AdSlot delivery.
- Build the Shop Owner template catalog and entitlement system: one Free template, paid templates at 2,000 MMK/month/shop, preview/apply switching, compatibility, billing, renewal, grace period, fallback, retirement, rollback, and analytics.
- Implement the ticket operator hierarchy with parent-child operator/branch records, 10,000 MMK/month Branch Owner billing, scoped RLS, lifecycle states, ticket attribution, revenue-share snapshots, and audit events.
- Implement MH Platform, Main Owner consolidated, and Branch Owner wallet ledgers, settlements, payouts, refunds, adjustments, withdrawal rules, and configurable commission/revenue-share policies after the business rules are finalized.

## Routes, content, and UX backlog

- ~~Write the Load More rule into `PROJECT-PLAN.md` §4.~~ **Done 22 November
  2026.** §4 states the page size of 12, the whole-batch rule, and the
  hide-when-exhausted rule; Blogs and Travel Guide share
  `src/lib/usePagedList.ts`.
- Connect the Directions, Call, and View-all CTAs on Restaurant, Book Shop, and
  the place detail page to real handoff flows once business contact records
  exist in Supabase. They currently build a Google Maps search URL and a
  `tel:` link from seed data.
- ~~Complete remaining bilingual localization.~~ **Done.** Every dashboard
  shell and body is localized, including `BlogPostsPanel.tsx` and
  `TravelGuidesPanel.tsx` inside Super Admin; the dictionary (`src/lib/translations.ts`) holds 1,610 keys, all
  filled in both `mm` and `en`. The remaining translation work is backend
  content, not UI strings.
- Add component-level behavioral tests. Route, link, manifest, filter, and
  domain-rule tests exist and run under `npm test` (291 tests in 23 files);
  nothing yet renders a page and asserts on it, so interaction regressions
  (filters, tabs, forms) are still caught by hand.

## External configuration and decisions

- Configure Supabase OAuth providers and production redirect URLs.
- Deploy the R2 media endpoint and select the public/custom-domain or signed-download policy.
- Finalize ticketing commission percentage, revenue-share formula, payout schedule, minimum payout, refund/chargeback responsibility, withdrawal rules, and direct-versus-consolidated settlement.
- Confirm production deployment environment variables, Cloudflare Worker configuration, backend migration reproducibility, and monitoring/logging.


## Currency management — production work remaining

- Exchange-rate history, effective dates, editor identity and the audit event are
  now written client-side by `src/lib/exchangeRates.ts` (append-only rows, the
  current rate is the latest row whose `effective_from` has passed, 4,500 stays as
  the fallback) and shown in Super Admin → Currency. What remains: move the rows to
  the `exchange_rates` table so they are append-only in the database and readable
  by the Worker that prices an order.
- Persist each Shop Owner's MMK/USD main currency on the business profile and apply it to real menu, service, rental, ticket, and booking prices.
- Snapshot the exchange rate and displayed currency on every order/booking so historical totals do not change when Admin updates the rate.
- `src/lib/moneyFormat.ts` is the one formatter (USD 2 decimals, MMK to the
  nearest 100, decision 33). Still open: the server-side copy of that rounding, the
  payment/refund currency, rate scheduling ahead of time, and the permission check
  on who may append a row.


## Shop Owner application notifications — production work remaining

The current notification is a local preview implementation. Production should create a Supabase notification row or server event after a successful Shop Owner application, scope it to authorized Admin/Super Admin recipients, and deliver it through realtime subscriptions or a notification API. Read state, delivery state, retention, and audit history should be persisted server-side rather than only in browser localStorage.


## Page-based Ads Management — production work remaining

Persist page routes, ad slots, creative/media, advertiser, schedule, approval state, and page-level permissions in Supabase/R2. Published ads must be fetched and rendered by the matching public page, while preview, pause, scheduling, analytics, and audit events must be backed by real APIs rather than local component state.


## UI/UX and accessibility backlog — audited 20 November 2026

These are measured findings, not guesses. Each has a number attached so the
work can be sized.

### Layout and density

- **Card type is small on phones.** `xs` renders at roughly 145×67px with a
  9px title and 7px meta line. Readable on a desktop, tight on a phone. The
  five-size system itself is correct; the question is whether `xs` should be
  used for any phone-facing row at all.
- **Section spacing is uneven on Home.** Measured gaps between adjacent
  sections are mostly 20px but one is 64px, so the page rhythm breaks in one
  place.
- **One section gap of 0px on `/blogs`.** Two sections sit flush against each
  other with no breathing room.
- ~~**Horizontal overflow at tablet width.**~~ **Fixed 20 November 2026.** The
  header switched to its desktop nav at `md` (768px) while the nav, search,
  language, currency, theme, favorites, notification, and account controls
  together need more room, so the header pushed the document 21–37px wide.
  The nav now appears at `lg`. `/account` had the same problem from an
  unconstrained grid column and is fixed too. Verified at 360, 390, 414, 600,
  768, 820, 900, 1024, 1180, and 1280px across 15 routes: no overflow.

### Accessibility

Measured with axe-core in headless Chromium on 20 November 2026 across 23
routes. Every check except contrast is now clean.

- **0 images without `alt`.** All 183 rendered images carry one.
- **0 interactive elements without an accessible name.** All 1120 have a label
  from text, `aria-label`, or `title`. The six sponsored ad links and the
  notification bell were the last gaps and are fixed.
- **0 violations of every axe rule except `color-contrast`.** Heading order,
  landmark structure, tab roles, form labels, and `html lang` all pass.
- **73 `color-contrast` nodes on 18 routes.** One cause: white on
  `brand-blue #4d8dff` is 3.2:1 and `brand-red #c0392b` as text on the dark card
  is 3.3:1. Both are used at 9–12px where 4.5:1 is required. Fixing it means
  changing the brand palette (`#356fe0` for the blue, a lighter red for text),
  so it needs a design decision rather than a code edit.
- **No automated accessibility test in delivery.** axe was run by hand for this
  audit. The Vitest suite covers routes, links, and filters only, because axe
  needs a browser and the suite deliberately runs without one.

### Interaction

- ~~**Load More does not check whether the last row is full.**~~ **Fixed 22
  November 2026.** Both lists page in fixed batches of 12 through
  `src/lib/usePagedList.ts`. Twelve divides evenly into two, three, four and
  six columns, so no batch ends on a ragged row; the last batch is clamped to
  what exists and the button hides once everything is shown. Unit-tested.
- **No empty-state audit.** Empty states exist on some pages (Blogs search,
  Favorites, Travel Guide) but there is no check that every list has one.

### Localization

- ~~**Shop Owner dashboard has no `useLanguage` integration at all.**~~ Fixed
  22 November 2026.
- ~~**Main Owner dashboard has no `useLanguage` integration.**~~ Fixed
  22 November 2026.
- ~~**Super Admin translates navigation only.**~~ Fixed 22 November 2026: nav,
  overview, currency, admin management, shop owners and ads management all read
  through `t()`, including city and category option lists and ad slot names.
- ~~**Blog Post Management and Travel Guide Management panels are still
  English-only.**~~ Fixed: both editors now read through `useLanguage`, and the
  publish checks and media errors return codes the editor translates. Frontend
  localization has no known gap left; what remains is the backend listed above.
- ~~**8 hard-coded English sentences remain in traveler-facing components.**~~
  Fixed 22 November 2026. A text-node scan of every traveler page and shared
  component now finds no untranslated English sentence. The last ones were the
  City and Travel Plan not-found states, the Blogs hero kicker, the Account
  support card title and the Auth brand kicker.
