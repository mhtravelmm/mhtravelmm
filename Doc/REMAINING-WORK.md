# MH Travel — Remaining Work Record

**Last updated:** 20 November 2026
**Verified against:** `main` @ `8cdcf4e` plus the 20 November audit commit;
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
- Connect Admin and Shop Owner creation forms to Supabase Auth invitations, profile/business records, acceptance flows, and audit history. Plaintext preview passwords must not be used in production.

## Data persistence and APIs

- Replace seeded/local state for Favorites, bookings, custom plan requests, notifications, reviews, views, dashboard metrics, owners, admins, menu items, campaigns, and revenue with authenticated Supabase/API queries.
- Connect Rental submissions and Ticketing orders to request IDs, notifications, booking records, contact handoff, payment, and confirmation persistence.
- Add live ticket operator inventory, availability, seat maps, seat locking, payment, and provider/API integration.
- Replace seeded city/category/business recommendations with city-scoped content tables, real pagination, map distance, open/closed state, availability, and review counts.
- Add Admin-managed content tables and public API/cache invalidation for blogs, guides, listings, and search indexing.
- Move exchange-rate data from the hard-coded preview value to an Admin/Supabase-managed rate service.

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
- Complete remaining bilingual localization, especially Super Admin body copy and the Shop Owner interface.
- Add component-level behavioral tests. Route, link, manifest, and filter tests
  exist and run under `npm test`; nothing yet renders a page and asserts on it,
  so interaction regressions (filters, tabs, forms) are still caught by hand.

## External configuration and decisions

- Configure Supabase OAuth providers and production redirect URLs.
- Deploy the R2 media endpoint and select the public/custom-domain or signed-download policy.
- Finalize ticketing commission percentage, revenue-share formula, payout schedule, minimum payout, refund/chargeback responsibility, withdrawal rules, and direct-versus-consolidated settlement.
- Confirm production deployment environment variables, Cloudflare Worker configuration, backend migration reproducibility, and monitoring/logging.


## Currency management — production work remaining

- Persist exchange-rate history, effective dates, editor identity, and audit events in Supabase/Admin settings.
- Persist each Shop Owner's MMK/USD main currency on the business profile and apply it to real menu, service, rental, ticket, and booking prices.
- Snapshot the exchange rate and displayed currency on every order/booking so historical totals do not change when Admin updates the rate.
- Define server-side rounding, payment/refund currency, rate scheduling, permissions, and validation rules.


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

- **Shop Owner dashboard has no `useLanguage` integration at all.** English
  only, by construction.
- **Main Owner dashboard has no `useLanguage` integration.** Same.
- **Super Admin translates navigation only.** The dashboard body is hard-coded
  English.
- **8 hard-coded English sentences remain in traveler-facing components.**
