# MH Travel — Remaining Work Record

**Last updated:** 16 November 2026

The application currently provides a substantial frontend and local-preview experience. The following work remains before production launch.

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
- Add Blog Post, localized block, category, revision, SEO metadata, status, schedule, and audit tables.
- Persist cover, gallery, and inline story media transactionally with ordered blocks, alt text, captions, and R2 keys.
- Render ordered text/image blocks in the public Blog reader and remove replaced/orphaned R2 objects safely.
- Add scheduled publishing, timezone handling, moderation, draft autosave, optimistic concurrency, and public cache invalidation.

## Dashboard and business operations

- Replace seeded dashboard metrics and local preview records with scoped Supabase/API data.
- Add permission groups, feature-level access checks, admin status transitions, audit logs, and protected routes for each admin role.
- Connect Ads Management to campaign persistence, creative storage, scheduling, budgets, reporting, approval, and AdSlot delivery.
- Build the Shop Owner template catalog and entitlement system: one Free template, paid templates at 2,000 MMK/month/shop, preview/apply switching, compatibility, billing, renewal, grace period, fallback, retirement, rollback, and analytics.
- Implement the ticket operator hierarchy with parent-child operator/branch records, 10,000 MMK/month Branch Owner billing, scoped RLS, lifecycle states, ticket attribution, revenue-share snapshots, and audit events.
- Implement MH Platform, Main Owner consolidated, and Branch Owner wallet ledgers, settlements, payouts, refunds, adjustments, withdrawal rules, and configurable commission/revenue-share policies after the business rules are finalized.

## Routes, content, and UX backlog

- Resolve remaining legacy or undeclared catalog routes such as hotel, market, cafe, attraction, rental detail, ticket detail, legacy Travel Plan, and legacy Blog URL paths.
- Make Restaurant and Book Shop detail pages select real records by route parameter and connect directions, calls, maps, view-all, and related CTAs to real actions.
- Make Restaurant and Book Shop category selectors filter their displayed menu/book lists.
- Complete remaining bilingual localization, especially Super Admin body copy and the Shop Owner interface.
- Define and add automated behavioral tests; maintain typecheck, build, lint, and whitespace validation in delivery checks.

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
