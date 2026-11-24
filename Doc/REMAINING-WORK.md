# MH Travel — Remaining Work Record

**Last updated:** 29 November 2026
**Verified against:** `main` plus the rental order rules
(`src/lib/rentalOrderRules.ts`), the full Rental Admin panel (catalog,
availability, rates, branches, terms, settings, orders) built to Plan §8.8, the
per-account Favorites/notification/review wiring, the client-side scheduled
publishing seam (`src/lib/contentStore.ts`, `scheduleRules.ts`,
`scheduledPublishing.ts`, `contentReader.ts`) with the content lifecycle rules
in `src/lib/contentLifecycle.ts`, and the 22 November work on the
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
- **The rental expiry job** is one entry in the §16B.7 schedule
  (`src/lib/jobs.ts`) and runs through the shared runner every five minutes
  plus once on load. A closed browser cannot expire anything, so the schedule
  moves to `pg_cron` (`supabase/migrations/20261123000200_job_runs.sql`) when
  the order tables go live.
- **The rental audit log** (`mh-travel-rental-audit`) records catalog diffs and
  order status changes in browser storage; it moves to the admin audit table.
- **Guide costs (Plan §16)** are stored on the order as `extras` in browser
  storage. The `rental_order_extras` table is committed but not applied, so the
  rows move with the rest of the order data. Collecting the added amount still
  goes through the same staff-recorded payment as the daily rate.
- All nine §16B.7 jobs are now `wired: true` and do real work against a browser
  stand-in: publish due content, ad campaign windows, rental payment expiry,
  subscription expiry, renewal reminders, the ad statistics roll-up, orphan media
  cleanup and the raw ad event purge. What is left for each is the table it
  should read — ad campaigns, `shop_subscriptions`, media objects, ad events —
  so the schedule moves to `pg_cron` rather than a timer in an open tab. A closed
  browser runs no job.
- Publishing due content is wired, but against browser storage: the job reads
  the rows in `src/lib/contentStore.ts`, so it only runs while a Super Admin has
  the app open. `blog_posts` and `travel_guides` are committed in
  `supabase/migrations/20261123000600_scheduled_publishing.sql` but not applied,
  so the move is to point the store at those tables and the job at `pg_cron`.
- `job_runs` is committed with the `pg_cron` entry for the rental expiry job but
  not applied. Until it is, the run log and the failure bell live in browser
  storage through `src/lib/jobs.ts`.
- Deliver the rental notifications (Plan §16B.3) through Supabase Realtime and
  the `notifications` table. The rows are written now — requested and
  rescheduled to Rental Admin, accepted, paid, expired and cancelled to the
  traveler — and `notification_feed` is committed, but delivery is still
  in-browser: a recipient sees the row when they open the app, not when it
  happens.
- Publish the rest of the §16B.3 events from the server: ad creative waiting for
  approval, campaign ending in three days and campaign ended, and the traveler's
  rental notices. The subscription ending at 7/3/1 days is written now by
  `runRenewalReminders()` and addressed to the owner by byline, but it still fires
  from an open tab; the server-side writer is what is missing.
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
- Notification feed rows are written now — Admin publish, the scheduled
  publishing job, the rental status changes and the guide earning rows all call
  `pushFeedEvent()` — but the four seeded preview rows in
  `src/data/notifications.ts` are still the only rows a traveler who has done
  nothing yet will see. Production should drop them once real content exists.
- Reviews are read-only in the UI. The "verified booking or visit" rule from
  Plan §11 and the Owner-rating adjustment still need an authoring path.

## Translation fallback — production work remaining

Plan §16B.4 is now wired end to end in the browser: `translationCache.ts` holds
the rules, `translationApi.ts` calls the Worker, `useLocalizedText()` is the
reader seam, `AutoTranslatedMark` is the marker, `TranslationReviewPanel` is the
Admin queue and `supabase/migrations/20261123000400_translation_cache.sql` is the
table with its RLS and functions. What remains:

- **Deploy the Worker.** `VITE_TRANSLATION_ENDPOINT` points at it; until the
  Worker exists the client reports `not_configured` and every reader falls back
  to the source language. The provider key, the language-pair check and the rate
  limit belong in that Worker, never in the repo or a `VITE_` variable.
- **Move the queue off browser storage.** The rows live in `localStorage` through
  `translationCache.ts`, so a reviewed row is only permanent on the browser that
  reviewed it. `cache_translation`, `record_translation_view`,
  `review_translation` and `translation_review_queue` are committed and unused
  until the client reads the table.
- **Finish the readers.** Done 26 November 2026. Blogs and Travel Guide resolve
  through `useLocalizedText()`; the city, category, place, restaurant, book-shop
  and rental copy now read through `localizedOrFallback()`, which returns the
  reader's language, else the language the text was written in, and never asks
  the Worker or shows the marker. No reader indexes `text[language]` directly
  any more, so a half-translated record shows the source text instead of a blank.
- **Feed the queue.** Nothing creates an `auto` row except a reader who hit a
  missing language. The content editors should record which field was written in
  one language only, so the queue reflects what actually needs a decision rather
  than only what someone happened to open.
- **Decide the review role.** The panel sits in the `translations` section for
  Admin and Super Admin. If Guide Content Admin and Blog Post Admin are meant to
  review their own copy, the §16B.1 matrix needs the row first.

## Blog, media, and Cloudflare R2

The client side of Plan §16B.6 is built: `src/lib/mediaRules.ts` holds the five
folder rules, `src/lib/mediaApi.ts` compresses and posts, and
`supabase/migrations/20261123000500_media_objects.sql` records every object with
`last_referenced_at` and lists the orphans. What remains:

- Deploy an authenticated Cloudflare Worker/Pages Function with an R2 binding for
  the media endpoint, and have it repeat the `mediaRules.ts` checks server-side:
  folder, type, byte ceiling, `shops/<id>/` key, the 15-second ad video and the
  shop quota from `shop_media_count()`. Then call `register_media_object()` after
  each successful put, so the row and the file appear together.
- Wire the `orphan_media_cleanup` job to `orphan_media_objects(30)`: delete the R2
  object first, then the row with `delete_media_object()`, so a failed delete is
  retried the next night instead of losing the file. Until the Worker exists the
  job stays `wired: false` in `src/lib/jobs.ts`.
- Call `touch_media_object()` from every content save that still shows an object,
  otherwise a cover edited after 30 days looks like an orphan. The blog and guide
  editors do not save to a table yet, so this lands with those tables.
- Add an Ads creative upload path: `mediaRules.ts` already allows a 300 KB image
  and a 3 MB / 15 s MP4 in `ads/`, and the Adsboard now enforces those limits
  (`creativeProblem` in `src/lib/adCampaigns.ts` refuses a measured oversize or a
  video over 15 seconds), but the panel still has no file input, so a creative is
  still a URL and no byte count is measured. Until the Worker exists, `bytes` is
  0 and the limit is not applied.
- Add Blog Post, localized block, category, revision, SEO metadata, status, schedule, and audit tables. The block schema, revision cap, and audit actions already exist in `src/lib/blogBlocks.ts` and `src/lib/contentWorkflow.ts`, so the tables mirror that shape.
- Persist cover and inline story media transactionally with ordered blocks, alt
  text, captions, and R2 keys. The reader already renders ordered text, photo,
  and ad blocks with bilingual alt text and captions from local data. The model
  matches the reader: `authorEn`/`authorMm`, `locationEn`/`locationMm`, and
  `captionEn`/`captionMm` (20 November 2026), and `galleryUrls` is gone — extra
  photos are image blocks — so a stored row from the single-language era is
  migrated in `normalizePost` rather than in the database.
- Scheduled publishing execution and timezone handling are in place on the client (§10 §4): `src/lib/scheduleRules.ts` converts Myanmar Time to UTC, `src/lib/scheduledPublishing.ts` runs on the one-minute tick, and the reader reads the result. Unpublish, soft delete, restore and the stale-save refusal are also done (§10 §4, §7 acceptance 5–6): `src/lib/contentLifecycle.ts` holds the rules and `20261124000100_content_lifecycle.sql` puts the same version guard on the server. What is left is the server wiring and the parts the client cannot do: moderation, the 30-second draft autosave, public cache invalidation, and a `pg_cron` trigger. Revisions and the audit log live in browser storage today, so they still need the tables above to be shared between two editors.
- Add Travel Guide and Guide Stop tables with the listing reference, then persist the itinerary, revisions, audit entries, and earning rows that `src/lib/guideEarnings.ts` defines. The per-post earning rate is still undecided, so the amount stays an Admin-entered value.

## Dashboard and business operations

- Replace seeded dashboard metrics and local preview records with scoped Supabase/API data. The owner money rows are the newest instance: `src/lib/ownerLedgerStore.ts` stands in for `owner_commission_settings`, `owner_ledger_rows` and `owner_payout_runs`, and `20261127000100_owner_ledger.sql` is the table set, so the swap is to apply that migration and point the store at it.
- Add permission groups, feature-level access checks, admin status transitions, and audit logs. Route-level scoping for the two content roles is done in `src/lib/contentAdminAccess.ts` and the admin shell; the remaining gap is server-side enforcement and account status changes.
- Connect Ads Management to campaign persistence, creative storage, scheduling,
  budgets, reporting, approval, and AdSlot delivery. The behaviour is built and
  tested (§16A.1–§16A.9: serving order, status machine, approval queue, reports,
  `ad_campaign_window` job), so what remains is the storage swap: apply
  `20261125000100_ads.sql` and point `src/lib/adStore.ts` at the tables.
- Shop Owner template system. **Built (26–28 November 2026):** the billing half
  (`src/lib/ownerSubscriptions.ts`, `src/lib/subscriptionJobs.ts`,
  `shop_subscriptions`), the §4 rules and catalog
  (`src/lib/shopTemplates.ts`, `shop_templates`), the owner's preview/apply
  selector, the Super Admin catalog screen with invoice recording
  (`payForTemplate()` in `ShopTemplatesPanel.tsx`), and the rendered layer — `/shops/:shopId` serving nineteen lazy templates over one
  `ShopPageData` fixture, with `scripts/a11y-audit.mjs` (`npm run a11y`) as the
  gate: 192 combinations of template, width and theme, clean.
  **Template analytics is built (24 November 2026):** `src/lib/templateStats.ts`
  holds the counting rules (one view per template per page view, an apply only
  when the switch actually moved the shop, a preview never counted, bot agents
  refused, 180-day retention), `ShopPage.tsx` records the view,
  `OwnerTemplatePanel.tsx` records the apply, and the Super Admin catalog panel
  shows a usage table — views, applies, apply rate, share and last seen — with
  `template_events_purge` in the §16B.7 registry and
  `20261128000200_shop_template_events.sql` as the table, its
  `template_usage()` report function and the purge.
  **The catalog reached the count §4 asks for (29 November 2026):** nineteen
  templates render — the free hotel default plus ten paid hotel designs
  (Classic, Editorial, Compact, Gallery First, Booking Focus, Map First, Story,
  Split Screen, Board, Panorama, Directory) and one paid alternative beside the
  free default in restaurant (Menu Board), cafe (Photo Grid), attraction
  (Ticket) and book shop (Shelf). Every live pair in a category passes the
  seven-axis test, the SQL seed is checked against the client catalog by
  `shopTemplates.test.ts`, and `npm run a11y` covers every template of every
  category — 192 combinations, clean.
  What is left: **storage** — apply `20261128000100_shop_templates.sql`,
  `20261128000200_shop_template_events.sql` and
  `20261129000100_shop_template_catalog_growth.sql`, then point
  `src/lib/shopTemplateStore.ts` at the five tables, since the catalog, settings,
  entitlements, invoices and events are browser rows today; and **the
  per-template review** — §4 requires the founder to approve each design against
  the four-of-seven test before it goes `active`, and the ten new designs of
  24 and 29 November are still awaiting that review.
- ~~Implement MH Platform wallet ledger, settlements and payouts.~~ **Built 27
  November 2026** for the Shop Owner path: `src/lib/ownerLedger.ts` snapshots
  the commission on each transaction, `planPayout()`/`createPayoutRun()` run the
  §9 twice-monthly payout with the 50,000 MMK carry-over, `replayPayout()` is the
  §16D Phase 3 reproducibility gate, `20261127000100_owner_ledger.sql` is the
  table set, and both the Super Admin `payouts` section and the owner's Payments
  statement read it. What is still open: the **Main Owner consolidated** and
  **Branch Owner** ledgers (they need the operator hierarchy below), refunds and
  manual adjustments as their own row kinds, and a revenue-share policy editor
  beyond the single per-shop commission percent.
- Implement the ticket operator hierarchy with parent-child operator/branch
  records, 10,000 MMK/month Branch Owner billing, scoped RLS, lifecycle states,
  ticket attribution, revenue-share snapshots, and audit events. The owner
  ledger above gives it the shape to copy: a frozen rate on each row, a
  per-shop setting, and a reproducible run per window.

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
  `TravelGuidesPanel.tsx` inside Super Admin; the dictionary (`src/lib/translations.ts`) holds 2,001 keys, all
  filled in both `mm` and `en`. The remaining translation work is backend
  content, not UI strings.
- Add component-level behavioral tests. Route, link, manifest, filter, and
  domain-rule tests exist and run under `npm test` (664 tests in 59 files);
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

The §16A build closed the behaviour side: `AdSlot` renders the served ad on every
public page and walks Admin ad → AdSense → collapse, the seven Adsboard sections
cover placements, campaigns, creatives, advertisers, reports and settings, and
`ad_campaign_window` moves the statuses on the one-minute tick. What is left is
the backend:

- Apply `supabase/migrations/20261125000100_ads.sql` and
  `20261125000200_ads_serving.sql`, then replace the browser stand-in in
  `src/lib/adStore.ts` with calls to the two RPCs and reads of the staff tables.
  The SQL is written and tested for parity with the client rules
  (`src/lib/adServing.test.ts`), but nothing has run against a live database, so
  the browser storage is still the source of truth.
- `serve_ad(placement_key, language)` exists in the migration with the §16A.5
  rules (placement toggle, window, approved creative, priority then a weighted
  draw) and returns `fallback_allowed` so the page can take step 2, plus
  `alt_text` for the language it was asked for. `serveAdFor()` in
  `src/lib/adServingApi.ts` is the caller and caches for 60 seconds per
  placement and language. What is left is the edge cache itself: the 60-second
  window is currently a browser-side cache, so the first reader of each minute
  still reaches the database.
- `/ad/click/<creative_id>` exists as a client route
  (`src/features/ads/AdClickRedirect.tsx`) and calls `record_ad_click()`
  through `src/lib/adClickApi.ts`, using the URL the RPC returns as the
  redirect target. Impressions and clicks are also posted to
  `VITE_AD_EVENT_ENDPOINT` through `navigator.sendBeacon` (`adBeacon.ts`), so a
  closed tab still reports. What is missing is the Worker that serves that
  endpoint: it must call `record_ad_click()` / insert the impression, rate
  limit by session hash, and refuse a payload whose creative does not exist.
- `ad_stats_rollup` and `ad_events_purge` are `wired: true` in
  `src/lib/jobs.ts` and run against browser storage; their SQL twins exist but
  are only called once a server job runner replaces the ticker.
- Keep the AdSense ids empty until the founder supplies them (§16A.12); the
  fallback step is implemented and stays off while the client id is blank.


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
