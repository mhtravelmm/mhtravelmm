# TODO

## Blogs page and article reading experience — Complete

- [x] Blog titles and bodies are available in both Myanmar and English.
- [x] Blogs shows editorial article categories as user-facing filters, separate from backend-only SEO tags, which are not displayed in the app.
- [x] Readers can favorite, share, and see view counts for blog posts.
- [x] Every blog content card shows rating, distance, favorite state, and views.
- [x] Story cards use an image-led layout with readable summaries and activity metrics.
- [x] Blogs uses the shared header; full footer content is reserved for Home while the copyright line follows the global placement rule.

## Travel Guide page from user reference — Complete

- [x] Replace the `/travel-guide` placeholder with a bilingual landing page matching the shared Drive reference: active Travel Guide navigation, Shwedagon-at-dusk hero, title/subtitle/description and Explore CTA.
- [x] Include All Guides, Myanmar, Nature, Adventure, Culture, Food, and City Tour category controls that filter the guide cards, plus guide search.
- [x] Show image-led guide cards with category, prominent favorite control, published date, title, summary, rating, distance, views, and View Guide action in a three-column desktop layout.
- [x] On phones, keep a compact hero, a three-column category grid with the search input, compact horizontal guide cards, and the shared five-item bottom navigation.
- [x] Add `/travel-guide/:id` guide detail routes so existing `tg1`–`tg4` and `ctg1`–`ctg3` links work, with time-based itinerary stops and a Directions affordance.
- [x] Reuse existing Myanmar photo assets and favorite IDs; keep Home Travel Guide cards unchanged, include the complete guide list in Favorites and Account, and preserve the global copyright/full-footer rules.
- [x] Keep the Travel Guide interface and guide content available in Burmese and English.
- [x] After the guide listing and Load More control, before copyright/full footer, render one horizontal row each for Top attractions → Restaurants → Cafes, in that order, reusing the existing listing and favorite behavior.

## Traveler authentication and Super Admin control center — Frontend complete

- [x] Users can open separate Login and Registration routes from the account entry point.
- [x] Registration validates name, email, and an eight-character minimum password, then creates a traveler session.
- [x] Login and logout update the shared session used by the desktop header, mobile sidebar, and account destinations.
- [x] Traveler accounts and Super Admin accounts use separate role values and separate dashboard destinations.
- [x] `/super-admin` is protected: unauthenticated visitors go to Login and traveler accounts go to the traveler Account dashboard.
- [x] Super Admin access is separated from traveler login through the private `/admin/login` portal; no admin preview or admin credentials are shown in the public user login.
- [x] Super Admin dashboard includes platform metrics, recent activity, users, content/listings, bookings, settings, and quick management actions.
- [x] All authentication and admin labels are available in Burmese and English.
- [ ] Replace the local preview session store with Supabase Auth and connect the existing auth UI to the backend session.
- [x] Supabase `public.profiles` table is created with unique usernames, display names, role checks, avatar metadata, timestamps, signup trigger, and Row Level Security policies.
- [ ] Configure Google and Facebook OAuth provider credentials and callback URLs in Supabase Auth.

## Home-only desktop full footer and global copyright — Complete

- [x] On desktop, the full footer with MH Travel branding, social links, legal/help/navigation/contact columns, payment options, app-store links, and copyright is rendered on Home only. Other pages have no full footer.
- [x] On desktop, every page has the copyright line at the bottom; Home uses the copyright row in its full footer without a duplicate, and every other page shows a copyright-only strip.
- [x] On phones, the sidebar on every route includes MH Travel and its tagline; Legal and Help/Support items; Navigate links for Cities, Nearby, Rentals, Ticketing, Travel Plans, and Travel Guide; Content/contact details; Myanmar payment options; App Store/Google Play; International payment options; and copyright at the bottom. It stays scrollable. These phone-sidebar sections are not restricted to Home.
- [x] Standalone admin routes also retain a copyright line at the bottom of their page layouts.

## Traveler account dashboard UI refresh — Complete

- [x] `/account` follows the supplied MH Travel dashboard reference: navy/cyan visual language, traveler profile and account navigation, destination welcome banner, four account stat cards, upcoming trip, quick actions, recent activity, and Myanmar discovery panel; the full desktop footer is Home-only while phone sidebar footer information is global.
- [x] The dashboard adapts to mobile widths with compact profile/navigation and stacked or compact card layouts while keeping account destinations accessible.
- [x] Existing account destinations, favorite toggling, notification links, settings/support views, profile edit entry, and logout behavior remain usable.
- [x] New account dashboard interface text is available in both Burmese and English.

## Blogs page responsive reference refresh — Complete

- [x] `/blogs` follows the supplied MH Travel reference with a Shwedagon-at-dusk hero, bilingual blog heading/subheading, editorial category filters for All, Travel Tips, Nature, Food, Health, Culture, Safety, and Others, and a responsive story-card layout; the full desktop footer is Home-only while phone sidebar footer information is global.
- [x] Category chips filter by explicit editorial category; they do not expose or reuse backend-only `seoTags`.
- [x] Desktop shows an image-led multi-column card grid; mobile uses compact horizontal story cards and a compact category grid.
- [x] Story cards retain date, category, title, excerpt, reading/view/favorite metrics, favorite toggle, share action, and reader entry. Search, sorting, shareable story URLs, bilingual reader, and related content continue to work.
- [x] A Load More control reveals additional matching stories and resets appropriately when search or category filters change.
- [x] New Blogs interface text is available in Burmese and English.

## Compact Blogs cards for desktop and phone — Complete

- [x] Reduce oversized story boxes to the tighter proportions of the supplied Blogs reference, using a denser desktop grid and shorter card image/body spacing.
- [x] Keep phone story cards compact and horizontal with a small thumbnail on the left, readable title/excerpt and category/date on the right, and accessible favorite/share/read controls without horizontal overflow.
- [x] Preserve category filtering, search, sorting, reader links, bilingual labels, metrics, and the Load More interaction while changing card dimensions.

## Full-width Blogs page and visible favorite button — Complete

- [x] `/blogs` uses nearly all available viewport width with narrow responsive edge gutters, not a restrictive centered max-width or large blank side margins.
- [x] Every blog post card has a prominent, accessible heart favorite toggle on the image; its state and favorite count update together while share, views, and reading actions remain available.
- [x] The full-width treatment is limited to `/blogs`, preserves compact phone cards without horizontal overflow, and leaves other routes unchanged.

## Full-width Blog article reader — Complete

- [x] When a Blog post opens, its title, author/metadata, excerpt, ads, text blocks, images, and related sections use the available `/blogs` page width; remove restrictive centered max-width wrappers that leave large blank side areas.
- [x] Keep only small, responsive horizontal gutters so reader text is not confined to the center on desktop, and phone content uses the screen without horizontal scrolling.
- [x] Preserve the reader's image hero, reading metadata, ad slots, block content, save/share/close controls, related stories, related hotels, and shareable story URL behavior.

## Persistent phone bottom navigation — Complete

- [x] On phone-sized public pages, including Blog article reading, show exactly five fixed bottom tabs: Home, Nearby, Ticketing, Travel Plans, and User Account.
- [x] Highlight the active destination; User Account opens the signed-in account or admin destination, and opens login when signed out.
- [x] Keep exactly Home, Nearby, Ticketing, Travel Plans, and User Account in the bottom bar. Home and User Account are not duplicated as standalone sidebar links; Nearby, Ticketing, and Travel Plans also appear in the requested footer Navigate list, alongside Cities, Rentals, Travel Guide, and Blogs.
- [x] Reserve safe-area-aware space beneath page content so the bar does not cover Blog text, controls, related stories, or copyright; the existing hamburger continues to open the sidebar.
- [x] Keep the sidebar panel and backdrop above the bottom bar so all five tabs remain visible and clickable while the sidebar is open; choosing a tab navigates and closes the sidebar.

## Complete footer information in the phone sidebar — Complete

- [x] On every phone route, show MH Travel and “Your trusted companion to explore the beauty of Myanmar. Available 24/7.” in the scrollable sidebar.
- [x] Include Legal: Privacy policy, Terms of use, Terms and conditions, DMCA policy, Disclaimer, Cookie policy, and Sitemap; include Help and support: FAQ, Contact form, Feedback, and Report content.
- [x] Include Navigate links for Cities, Nearby, Rentals, Ticketing, Travel plans, and Travel guide; retain Blogs and the existing Favorites and language/currency/theme controls.
- [x] Include Content contact details: info@mhtravelmm.com, Facebook page, Telegram, Viber, and +95 9 400 686 925.
- [x] Include Myanmar payment options KBZPay, AYA Pay, CB Pay, OK$, UAB Pay, MPU, and mytelpay; Download our app with App Store and Google Play; International payment options Visa, Mastercard, JCB, UnionPay, Amex, Discover, and Apple Pay; place © 2026 MH Travel. All rights reserved. at the end of the sidebar.
- [x] Keep this phone-sidebar content on every route while preserving the full desktop footer as Home-only and the five-item phone bottom navigation.

## Compact phone Blog category filters — Complete

- [x] On phone, keep the All filter fixed at the left side and put Travel Tips, Nature, Food, Health, Culture, Safety, and Others in one horizontal swipeable row to its right.
- [x] Use small, compact filter boxes on phone; prevent wrapping into multiple rows, while keeping every category reachable by horizontal scrolling.
- [x] Leave the desktop filter presentation responsive and preserve selected-category filtering, active state, Burmese/English labels, and the All reset behavior.

## Home bottom discovery rows — Complete

- [x] Before the Home footer/copyright, show three one-row listing sections in this order: Top Attractions, Restaurants, then Cafes, after the Home Blogs “View more” section in page flow.
- [x] Reuse the existing Home attraction, restaurant, and cafe listings and favorite toggles; move those sections to the bottom rather than duplicate their cards elsewhere.
- [x] Keep each section as one horizontal row: show five cards across on wide screens and allow horizontal swipe scrolling on phones without wrapping to extra rows.
- [x] Preserve the existing bilingual section titles, view-all destinations, listing-card metrics, and working favorite controls.

## Blogs bottom discovery rows — Complete

- [x] On `/blogs`, after the blog list and Load More control and before copyright, show three one-row sections in this order: Top Attractions, Restaurants, then Cafes.
- [x] Reuse the existing Home attraction, restaurant, and cafe listings and favorite behavior; keep the same sections on Home and add them to Blogs rather than moving or removing them.
- [x] Keep each section to one horizontal row, with five cards across on wide screens and phone swipe scrolling without wrapping.
- [x] Preserve bilingual titles, view-all destinations, listing-card metrics, and favorite controls.

## Phone Blogs header, sort, and search layout — Complete

- [x] On phone, place “Latest stories” and the “Newest” sort selector on the same row.
- [x] Place the Search bar on the next row below both, spanning the available content width.
- [x] Keep the desktop heading, Search, and sort controls inline and preserve their existing filtering/sorting behavior.

## Ticketing page reference redesign — Complete

- [x] Use the supplied dark navy/cyan Ticketing reference with an airplane-and-Shwedagon hero, Ticketing heading, short supporting copy, and a Search Flights CTA.
- [x] Show Flight Tickets, Bus Tickets, Event Tickets, Cinema Tickets, and Train Tickets as the five primary Ticketing categories; do not show Hotels or Car Rentals here. Vehicle rentals remain on the separate Rentals page.
- [x] Provide ticket-only search forms: Flights use origin/destination, departure/return dates, and passenger count; Bus and Train use origin/destination, travel date, and passenger count; Events use city/date/ticket quantity; Cinema uses city, venue, movie, date, ticket quantity, and seat selection. Keep existing bus/cinema seat selection and order confirmation usable.
- [x] After search, show Popular Routes as one row of route/fare cards and Best Deals as compact operator rows with route, times, duration, price, and a working Book Now action.
- [x] On phones, use a compact hero and stacked search fields, swipeable route cards, compact deal rows, and a horizontally scrollable row that exposes all five ticket categories without covering the shared five-tab bottom navigation.
- [x] Keep ticket-only labels bilingual, highlight the active Ticketing header link, and preserve the rule that full footer content is Home-only while copyright remains global.

## Rentals page reference redesign — Complete

- [x] Match the supplied Rentals design: wide Shwedagon-at-sunset ride hero, Rentals heading, short Myanmar ride copy, and Browse Rentals CTA.
- [x] Keep Bicycle, Motorbike, Car with Driver, Self-drive Car, Camping Tent, Boat, Horse Carriage, E-Bike, and Scooter categories directly visible and filterable on the Rentals page rather than hiding the additional types behind View All; retain city-specific availability and other rental options such as Travel Guide.
- [x] Add Search rentals filtering and a Popular Rentals section with the six reference cards, ratings, shared favorite hearts, daily prices, Rent Now actions, and View All affordance; preserve existing rental IDs `pre1`–`pre5` and make any new favorites resolve in Favorites and Account.
- [x] Keep the existing rental request form usable after a Rent Now action: city and available category selection, start/end date rules (including two-day minimum for cars), citizen/foreigner price, car type, delivery/branch handover, address/phone, estimate, submission feedback, and existing city/category behavior; terms must be accepted before booking submission.
- [x] Add the Safe & Reliable Rentals banner with Well-Maintained, Affordable Price, and 24/7 Support.
- [x] On phones, use a compact hero, three-column category tiles, search, compact rental rows/cards and horizontal swipe where appropriate; keep the shared five-tab bottom navigation unobstructed.
- [x] Keep the Rentals UI bilingual, preserve global copyright on this page, and keep the full footer exclusive to Home.


## Nearby page reference redesign — Complete

- [x] Build the `/nearby` page around the supplied navy/cyan reference: Shwedagon-at-sunset hero with map-pin accents, “Nearby” heading, “Discover great places around you” subtitle, and compact supporting copy.
- [x] Add a Yangon location selector, 500 m / 1 km / 5 km / 10 km radius controls, nearby-place search field, and Search action; preserve browser geolocation, permission feedback, and Yangon fallback.
- [x] Show “All” and the 13 place categories as circular icon buttons in one single horizontal row that continuously moves from right to left. Keep category selection filtering results, pause motion on hover/focus, and respect reduced-motion preferences with a static, manually scrollable row.
- [x] Show six image-led Nearby Places cards on desktop with rating, category, distance, address/summary, favorite state, View Details, and View All; on phones use a compact single-column card/list treatment.
- [x] Add Quick Filters for Within 1 km, 1–5 km, 5–10 km, Top Rated, Near Me, and Open Now; they must update visible nearby results and remain clearable.
- [x] Preserve existing `near-*` IDs, give new records unique IDs, and register the full Nearby catalog in the Favorites page and Account dashboard so each Nearby heart resolves by its stable ID across pages.
- [x] Add a Popular Nearby horizontal row with compact image cards, rating/category/distance, favorites, and View All, reusing the existing Nearby data and stable favorite IDs.
- [x] Keep the page bilingual; retain the shared five-tab phone bottom navigation, global copyright on Nearby, and Home-only full footer. Keep all controls responsive without horizontal page overflow.


## Dashboard management sequence — 2026-11-10

### Completed frontend outcomes

- [x] Refine the traveler `/account` dashboard to match the supplied MH Travel reference, including responsive profile navigation, hero, stats, upcoming trip, quick actions, recent activity, discovery content, and footer behavior.
- [x] Add a dedicated Super Admin Ads Management area with campaign inventory, advertiser/placement data, impressions, CTR, Live/Paused controls, preview/edit/pause actions, ad priority, creative approval, and placement health.
- [x] Add Super Admin Shop Owner creation with owner/business name, email, phone, city, category, Pending status, review list, and Quick Action access.
- [x] Add Shop Owner login account fields: generated or manually entered lowercase username, temporary password, one-time credential notice after creation, username column, and password-hidden account list.
- [x] Add the responsive `/shop-owner` dashboard reference implementation with verified business profile, bookings, orders, reviews, revenue, booking statistics, popular menu, recent bookings, quick actions, mobile navigation, and owner workspace sections.
- [x] Add Super Admin Admin Management with Create Admin Quick Action, name/email/phone form, role choices, permission groups, Pending invite status, admin list, review action, audit-log entry point, and clear Shop Owner/platform Admin separation.
- [x] Register `/shop-owner` in `src/App.tsx` and `public/manus-routes.json`, and add a Super Admin Preview dashboard action.
- [x] Validate the dashboard sequence with typecheck, production build, lint, and `git diff --check`; lint has no errors and only the repository's existing non-blocking warnings remain.

### Backend integration still required

- [ ] Extend the auth role model beyond `traveler | super_admin | owner_admin` with scoped platform-admin roles.
- [ ] Connect Create Admin and Create Shop Owner forms to Supabase Auth invitations, profile/business records, email setup, role assignment, and acceptance/password flows.
- [ ] Replace the frontend Shop Owner credential handoff with a secure Supabase Auth invite or password-reset flow; never persist plaintext passwords, enforce unique usernames, hash credentials server-side, and require a temporary-password change at first login.
- [ ] Add permission groups, per-feature access checks, RLS policies, admin status transitions, audit logs, and protected routes for each dashboard role.
- [ ] Replace seeded dashboard metrics, campaigns, owners, admins, menu items, bookings, orders, reviews, and revenue with user/shop/admin-scoped Supabase queries.
- [ ] Connect Ads Management to campaign persistence, creative storage, scheduling, budgets, reporting, and the existing Admin Ads/AdSlot fallback pipeline.


## Shop Owner authentication connection — 2026-11-11

- [x] Persist Super Admin-created Shop Owner credentials in the shared local preview auth store with the `owner_admin` role.
- [x] Allow the standalone Admin Login portal to accept Shop Owner username/password credentials.
- [x] Redirect a successful Shop Owner login to `/shop-owner` and keep Super Admin login redirected to `/super-admin`.
- [x] Protect `/shop-owner` so only `owner_admin` sessions can view the dashboard; travelers and unauthenticated visitors are redirected safely.
- [x] Make Shop Owner logout clear the session and return to Admin Login.
- [ ] Replace the local preview bridge with Supabase Auth Owner Admin invitations, profile roles, secure temporary-password rotation, username uniqueness, shop ownership records, and RLS authorization.


## Travel Plans entry and detail page — 2026-11-11

- [x] Keep the Travel Plans entry page with bilingual Bagan hero, search, duration filters, sorting, shared favorites, and custom-plan request builder.
- [x] Add `/travel-plans/:planId` detail pages with bilingual itinerary hero, summary metadata, day-by-day itinerary, estimated price, Request this plan CTA, and Browse all plans action.
- [x] Register the Travel Plan detail route in `src/App.tsx` and `public/manus-routes.json`.
- [ ] Connect Travel Plan detail/request data to Supabase, real quotations, availability, booking persistence, and traveler-scoped request history.

## City detail page — 2026-11-11

- [x] Add `/cities/:cityId` route and make City cards open the corresponding detail page.
- [x] Add bilingual city hero, intro, city facts, attractions, hotels, restaurants, and trip-planning CTAs.
- [x] Register the City detail route in `public/manus-routes.json`.
- [ ] Replace shared seeded recommendations with city-scoped Supabase listings, map coordinates, availability, and traveler reviews.

## City categories and expanded business explorer — 2026-11-11

- [x] Add Search-like category chips inside City Detail pages.
- [x] Add keyword search and result counts for hotels, restaurants, attractions, book shops, rentals, transport, cafes, and markets.
- [x] Add responsive expanded business grids with Show more/Show less.
- [ ] Replace seeded category arrays with city-scoped Supabase businesses, real pagination, map distance, open/closed status, and review counts.


## Shop Owner Web UI/UX template subscription — New Plan

### Product and UX requirements

- [ ] Create a Shop Page template catalog with one included Free template and multiple alternative Shop UI/UX templates.
- [ ] Make templates presentation-only so Shop profile, products/menu, photos, services, prices, reviews, and bookings survive template switching.
- [ ] Add Owner template preview, active-template state, category compatibility, mobile preview, and apply/switch controls.
- [ ] Show the paid-template price clearly as **2,000 MMK per month per Shop Owner shop**.
- [ ] Allow one paid template entitlement at a time; switching between paid templates must not create duplicate content or duplicate subscriptions.
- [ ] Allow Owners to return to the Free template at any time and preserve all Shop data.
- [ ] Define cancellation, failed-payment, renewal, grace-period, expiry, fallback-to-Free, and reactivation states.

### Backend and admin requirements

- [ ] Add template catalog/version/compatibility records and Platform Admin template management.
- [ ] Add Shop Owner template entitlement, subscription, invoice/payment, renewal, cancellation, and audit records with RLS.
- [ ] Add payment integration for the 2,000 MMK monthly subscription and verify payment status server-side.
- [ ] Add safe template retirement, migration notice, rollback, and version compatibility behavior.
- [ ] Add analytics for template adoption, preview-to-apply conversion, churn, failed payments, and active paid templates.


## Ticketing Main Owner and Branch Owner model — New Plan

### Account hierarchy and access

- [ ] Add a ticket operator Main Owner account, such as a JJ Express operator account.
- [ ] Let Main Owners create, activate, suspend, renew, and remove scoped Branch Owner accounts for stations such as Yangon Hlaing Tharyar Gate and Aung Mingalar Gate.
- [ ] Add `main_owner` and `branch_owner` scoped roles and prevent a Branch Owner from seeing another branch or operator's private data.
- [ ] Scope Branch Owner workspace to its assigned station, staff/operations, schedules, ticket inventory, bookings, and branch reports.
- [ ] Give Main Owners operator-level schedule/fare/inventory controls, branch performance views, consolidated bookings, and branch-management actions.

### Fees, revenue share, and wallets

- [ ] Charge the Main Owner **10,000 MMK per month for each Branch Owner account**; keep this fee separate from the 2,000 MMK Shop Page template subscription and ticket commissions.
- [ ] Add branch account lifecycle, billing, renewal, suspension, expiry, and audit states.
- [ ] Attribute every ticket sale to both the Main Owner/operator and the selling Branch Owner/station.
- [ ] Add configurable branch revenue-share rules with the applied percentage/rule snapshotted on each transaction.
- [ ] Add separate MH Platform, Main Owner consolidated, and Branch Owner wallet/ledger views.
- [ ] Let Main Owners see consolidated operator earnings and branch wallet balances; restrict Branch Owners to their own branch wallet and permitted reports.
- [ ] Define and implement commission percentages, payout schedule, minimum payout, refund/chargeback responsibility, withdrawal rules, and direct-vs-consolidated settlement after the next business discussion.

### Production backend

- [ ] Add parent-child operator/branch tables, branch-level RLS, branch subscriptions, transaction attribution, wallet ledger entries, revenue-share snapshots, payouts, refunds, and adjustment records.
- [ ] Add auditable Main Owner branch-management APIs and ticketing integration without duplicating the operator's core ticket inventory.


## Main Owner Branch Account and Wallet Admin Panel — 2026-11-12

### Frontend preview completed

- [x] Add a protected `/main-owner` Main Owner control-center route with Super Admin `?preview=1` access for design review.
- [x] Add responsive navigation for Overview, Branch Accounts, Wallets & Ledger, Ticket Sales, Revenue Share, and Operator Settings.
- [x] Add Create Branch Account modal with station name, city, address, Branch Owner name, username, phone, fixed 10,000 MMK monthly fee, and configurable revenue-share percentage.
- [x] Add Pending branch creation behavior, branch account table, active/pending status badges, account fee, revenue share, ticket sales, wallet balance, and Manage actions.
- [x] Add Main Owner consolidated wallet, Branch Wallets, MH Platform Ledger, settlement preview, wallet activity, ticket-sales chart, and branch snapshot cards.

### Backend still required

- [ ] Connect the panel to real `main_owner`/`branch_owner` roles, parent-child operator records, branch-level RLS, and scoped APIs.
- [ ] Persist Branch Owner invitations, branch-account subscription billing at 10,000 MMK/month, status lifecycle, and audit events.
- [ ] Persist ticket attribution, revenue-share snapshots, MH/Main Owner/Branch wallet ledgers, settlements, payouts, refunds, and adjustments.
- [ ] Replace all dashboard metrics and ledger rows with Main Owner-scoped Supabase/API data and enforce server-side permissions.


## Branch Account form validation and API integration — 2026-11-12

### Completed frontend/API behavior

- [x] Validate station name, city, address length, Branch Owner name, lowercase username format, Myanmar phone number, and 0–100% revenue share.
- [x] Reject duplicate preview usernames before submission.
- [x] Submit the modal asynchronously with loading state, disabled controls, field-level errors, API/server error display, and success notification.
- [x] Use Supabase `operator_branches` insertion when configured, including operator ID, station/contact fields, fixed 10,000 MMK monthly fee, revenue share, and Pending status.
- [x] Use local preview storage when Supabase is not configured so created Pending Branch Accounts persist during preview testing.

### Production backend still required

- [ ] Create the `operator_branches` migration/table with a unique username constraint and operator/branch foreign keys.
- [ ] Add authenticated Main Owner identity instead of the current demo `jj-express-demo` operator ID.
- [ ] Add server-side validation, Main Owner ownership checks, branch-level RLS, invitation/auth provisioning, and audit logging.
- [ ] Replace preview metrics and local branch rows with operator-scoped API queries and add retry/idempotency handling for create requests.


## Super Admin Blog Post Management — 2026-11-12

### Completed frontend workflow

- [x] Add a dedicated Blogs view in the Super Admin navigation.
- [x] Connect the Dashboard Add Blog Quick Action to the Blog Post editor.
- [x] Add bilingual English/Myanmar title, excerpt, and body fields.
- [x] Add category, author, location, cover image URL, internal SEO tags, publishing status, and schedule-time fields.
- [x] Add Save Draft, Publish Post, Schedule Post, Edit, Preview, search, status filters, and All/Published/Drafts/Scheduled summary cards.
- [x] Seed the management inventory from the existing `BLOG_POSTS` catalog without changing the public Blog reader data.

### Production content backend still required

- [ ] Add Blog Post, localized content/block, category, SEO metadata, status, schedule, author, and revision tables.
- [ ] Connect approved image upload/storage and cover-image validation instead of accepting only a URL in preview.
- [ ] Add Content Manager permissions, moderation/review workflow, audit history, draft autosave, and optimistic-concurrency protection.
- [ ] Add scheduled publishing worker/trigger, timezone handling, publish/unpublish/restore actions, and public cache invalidation.
- [ ] Replace local post state with Supabase/API queries and make newly published posts appear in the public Blogs page and search index.

## Super Admin Blog categories and Cloudflare R2 cover images — 2026-11-14

### Completed frontend behavior
- [x] Add a Blog Editor control that creates a new category, normalizes its slug, rejects duplicates, and selects the new category for the current post.
- [x] Accept JPEG, PNG, and WebP cover images and reject unsupported types or originals larger than 12 MB.
- [x] Resize cover images to a maximum 1600px longest edge, convert them to WebP, and compress them to no more than 450 KB before upload.
- [x] Show the final compressed size and whether the image used the R2 endpoint or local preview fallback.
- [x] Send compressed cover images as multipart form data with `folder=blog-posts` to the configured media endpoint and store the returned URL in the Blog Post editor.

### Production R2 integration still required
- [ ] Configure `VITE_BLOG_MEDIA_UPLOAD_ENDPOINT` to a deployed authenticated Cloudflare Worker/Pages Function that binds the intended R2 bucket.
- [ ] Implement the server-side multipart endpoint to validate the Super Admin session, enforce `blog-posts/` object keys, validate WebP content/size, upload to R2, and return the durable URL/key.
- [ ] Configure the R2 public/custom-domain URL or signed-download policy and CORS for the admin origin.
- [ ] Persist the R2 URL/key and custom category in Blog Post/category database records; replace local editor state and preview data URLs with API records.
- [ ] Add orphan-image cleanup when a draft is abandoned or a cover image is replaced, plus audit logging and rate limits.

## Blog Post Cover Photo and Gallery Photos — 2026-11-14

### Completed frontend behavior
- [x] Keep one Cover Photo field for the Blog Post.
- [x] Add an Additional Photos multi-file picker so one post can contain multiple gallery photos.
- [x] Compress and upload every gallery photo through the same WebP/450 KB media pipeline used by the cover.
- [x] Show gallery thumbnails in the editor and allow each additional photo to be removed before saving.
- [x] Keep gallery photo URLs in the local preview post model separately from the cover URL.

### Production content storage still required
- [ ] Add ordered Blog Post media rows for gallery URLs, alt text, captions, and display order.
- [ ] Persist gallery media records and returned R2 keys together with the Blog Post transaction.
- [ ] Render ordered gallery photos in the public Blog reader and add public image alt/caption editing.
- [ ] Delete replaced/orphaned gallery objects from R2 after the database update is confirmed.

## Compact inline Blog story composer and schedule controls — 2026-11-14

### Completed frontend behavior
- [x] Replace the large body text areas with bilingual text blocks that can be separated by image blocks.
- [x] Let Super Admin insert compressed photos between text blocks, add further text blocks, preview the flow, and remove blocks.
- [x] Keep one Cover Photo plus Additional Photos while also supporting Inline Story Photos.
- [x] Replace typed schedule datetime text with separate calendar Date and Time controls and require both for Scheduled posts.
- [x] Reduce modal, input, cards, table, thumbnail, and action-button sizing for a compact editor UI.

### Production reader/storage still required
- [ ] Persist ordered bilingual story blocks and image metadata in Blog Post content records.
- [ ] Render text/image blocks in order in the public Blog reader, including alt text and captions.
- [ ] Keep R2 object keys tied to each block and clean up removed/replaced inline media safely.

## Super Admin compact dashboard density — 2026-11-14

### Completed frontend behavior
- [x] Reduce oversized Super Admin panels, cards, forms, charts, tables, and navigation spacing.
- [x] Keep all existing dashboard content and controls while reducing padding, gaps, row heights, icon sizes, and panel radii.
- [x] Reduce desktop sidebar/header footprint and preserve responsive mobile navigation.
- [x] Apply compact density consistently across Overview, Shop Owners, Ads Management, Admin Management, and generic admin sections.

## All admin dashboards second compact pass — 2026-11-14

### Completed frontend behavior
- [x] Compact Super Admin dashboard again, including shared Admin Management panels/forms.
- [x] Compact Shop Owner dashboard sidebar, header, profile, welcome hero, KPI cards, chart, tables, quick actions, and section cards.
- [x] Keep Super Admin and Shop Owner responsive layouts and all existing actions intact.
- [x] Keep compact density consistent across the three dashboard roles.

## User Dashboard compact density — 2026-11-14

### Completed frontend behavior
- [x] Reduce User Dashboard outer shell, sidebar, profile area, navigation rows, and main content gaps.
- [x] Reduce welcome banner, stat cards, booking/activity panels, quick actions, discovery card, wallet, messages, settings, and secondary view cards.
- [x] Preserve dashboard data, navigation actions, favorites, booking actions, responsive layout, and footer.
