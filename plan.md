# MH Travel — Project Plan

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
- Home Page is being built to full completion first; other pages are
  paused until it's done, then follow the same standard.

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
- Claude writes the application code directly. For Cloudflare Workers and
  Supabase, Claude writes the code/SQL and the owner applies or deploys it,
  with Claude guiding each step.
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

- `src/App.tsx` is the authoritative route table. It currently declares the Home, Cities, Nearby, Rentals, Restaurants (including `:id`), Book Shops (including `:id`), Ticketing, Travel Plans, Travel Guide (including `:guideId`), Blogs, Search, Account, Login, Signup, Admin Login, Super Admin, Shop Owner, Notifications, Account Notifications, and Favorites routes, plus a wildcard Not Found page.
- `public/manus-routes.json` matches the concrete routes. It intentionally does not describe the wildcard route.
- There is no `/cities/:id`, `/attractions/:id`, `/hotels`, `/hotels/:id`, `/cafes/:id`, `/markets/:id`, `/rentals/:id`, `/ticketing/:id`, or `/travel-plans/:id` route. Static links to those paths therefore fall through to the Not Found page.
- `src/features/blogs/BlogsPage.tsx` uses the implemented query-string reader format `/blogs?story=<slug>`, but legacy `CardListing` data still contains `/blogs/<id>` hrefs. Those legacy paths do not match the router.
- Restaurant and Book Shop dynamic URLs currently render the same static page regardless of the `:id`; they do not select records by route parameter. The same limitation applies to the static detail content shown by those pages.

#### Persistence and backend boundary

- The app contains no `supabase/` migration directory or SQL source. The profile migration and RLS status are recorded in `Plan/BACKEND-AUTH.md` as work applied directly to the connected Supabase project; they are not independently reproducible from this checkout.
- The only application Supabase calls found in source are optional Auth/session calls and `public.profiles` lookup in `src/lib/auth.tsx`. Catalogs, bookings, custom-plan requests, notifications, reviews, views, Favorites, Ticketing inventory, payments, and admin metrics do not call Supabase or another application API.
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
- The frontend role type is only `traveler | super_admin`; other roles documented by the backend handoff are currently collapsed to traveler by `mapRole()` and are not separately authorized in the UI. `/shop-owner` is currently a frontend preview route until `owner_admin` authentication and authorization are added.
- Google and Facebook buttons call `signInWithOAuth` only when Supabase is configured. Provider credentials, callback configuration, OAuth username completion, and production verification remain external setup work.

#### Verified source-level issues to keep in the backlog

- Home, Blog, City, Nearby, ad, and static catalog links point to several routes that are not declared, especially `/hotels`, `/markets`, `/cafes`, `/attractions`, `/travel-plans/:id`, and `/blogs/:id`.
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

---

## 4. Design System Rules

- Every listing/content card (Travel Plans, Travel Guide, Blogs, Populars,
  Nearby results, City cards, business listings) always shows all four:
  rating, distance, favorite state, views. No exceptions. This is enforced
  by making them required fields on the shared `CardListing` type.
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
- Categories are dynamic and manageable by Admin and Super Admin. Current
  list: car, motorbike, motorboat, horse carriage, bicycle, camping tent,
  travel guide (hire-a-person).
- Daily-rate pricing. Terms must be accepted before booking.
- Full-day car rental requires a driver. This rule is configurable per
  category (for example motorbike and bicycle stay self-drive).
- Long-distance rentals are priced by round-trip day count (daily rate
  times total days including the return leg), not by distance.
- Travel guide hire: the user covers the guide's actual accommodation, food
  and travel costs on top of the daily rate. Exact mechanics to be
  finalized later.

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
- City page cards use the shared ListingCard favorite fallback, so their hearts stay synchronized with the global Favorites provider; City detail destinations remain a separate route backlog item.
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
- Generic catalog/discovery heroes now use one shared responsive dimension utility: 190px on phones, 230px on small/tablet widths, and 250px on web/medium widths. This is applied to City, Nearby, Rentals, Ticketing, Travel Plans, Travel Guide listing, Blogs, and Account overview; content-heavy detail headers remain separate so their longer information does not clip.
- Search uses one input in the Header. After submission, `/search?q=...` shows the matching Yangon or category results directly without a duplicate Search Results input. The result page keeps compact static filter chips for All, categories, and cities including Yangon, Naypyidaw, Mandalay, and Bagan; selecting a chip updates the visible cards in place.
- A city query is catalog-wide: typing `ရန်ကုန်` or `Yangon` returns all cards assigned to Yangon across Hotels, Restaurants, Book Shops, Cafes, Rentals, Attractions, Markets, Guides, Plans, and related content. Burmese city/category terms are normalized, while Bagan, Mandalay, and other city cards are kept out of Yangon results.
- Category searches present city chips directly under the category result row, with no `By city` label. The compact city choices include Yangon, Bago, Naypyidaw, Mandalay, and Bagan; choosing a city refines the selected category cards without opening another search control.
- Search query modes are now explicit: city-only queries show all listings in that city; category-only queries show city cards only; and city-plus-category queries show only the requested category in the requested city. City-only result lists provide `Top rated` and `Nearby` sorting instead of repeating city filters.
- Category-only city cards are interactive: selecting a city drills into that category in the selected city and reveals `Top rated` and `Nearby` sorting. This makes `Hotel` → Yangon → Yangon hotels equivalent to the direct `ရန်ကုန် ဟိုတယ်` query.
- City-only search results expose one compact filter row containing `All`, `Top rated`, `Nearby`, `Hotels`, `Restaurants`, `Book Shops`, `Cafes`, `Rentals`, `Attractions`, and `Markets`. These controls operate within the searched city, so choosing Hotels after `ရန်ကုန်` returns only Yangon hotels while All restores the full Yangon catalog.
- Category-only search results such as `Hotel` use a single compact row: `All`, `Top rated`, and `Nearby` remain fixed, while the city-name chips rotate to the next city window every 10 seconds. Choosing a rotating city chip drills into that category for the selected city.
- Combined searches such as `ရန်ကုန် ဟိုတယ်` show `All`, `Top rated`, and `Nearby` in one static row and render hotel cards with currency-aware nightly prices plus rating, distance, views, favorite state, and hotel name.
- Language audit: the shared EN/MM provider persists the selected language, updates `document.documentElement.lang`, and is consumed by the traveler routes, shared Header/Mobile Menu/Footer, Ticketing, Rentals, Search, Favorites, Account, Notifications, City, Blogs, Travel Plans, Travel Guide, Restaurant, Book Shop, and Admin Login screens. Super Admin currently translates its navigation labels and language control, but much of the dashboard body remains hard-coded English. Shop Owner currently has no `useLanguage` integration, so its dashboard is English-only. These are known translation backlog items, not claims of complete app-wide translation.
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
- City discovery rows now use five desktop columns, matching the five records
  currently present in each City catalog. This removes the unused sixth-column
  whitespace visible beside Restaurants, Book Shops, Rentals, and the other
  five-card sections while preserving the responsive mobile/tablet grid.
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
- Payment gateway details (KBZPay, AYA Pay and others).
- R2 folder and naming convention for manually uploaded assets.
- Travel guide rental expense mechanics.
- Owner and Admin dashboard screens, after the user-facing pages are done.


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
- The frontend Shop Owner dashboard is available at `/shop-owner` and follows the supplied Royal Myanmar Restaurant reference: verified business profile, welcome hero, bookings/orders/reviews/revenue KPI cards, booking statistics chart, popular menu items, recent bookings, quick actions, responsive owner sidebar, mobile menu, notifications, and owner workspace sections.
- The Super Admin Shop Owners table includes a `Preview dashboard` action that opens `/shop-owner`.
- The `/shop-owner` route is currently a frontend preview route. It must become an `owner_admin` protected route after real Owner Admin authentication, secure invite/password-reset delivery, credential hashing, and shop ownership records are added.

### Admin Management

- Super Admin now has a dedicated `Admin Management` sidebar section and a `Create Admin` Quick Action.
- The Admin Management form collects admin name, work email, phone, admin role, and permission group. Supported frontend role choices are Content Manager, Support Manager, Operations Admin, Finance Admin, and Ads Manager.
- The page includes total-admin, active-admin, pending-invite, and permission-group summaries; an admin account table; role/permission/status display; review actions; audit-log entry point; invite-created local state; and a clear separation between platform Admin roles and Shop Owner accounts.
- Current Admin creation is a frontend/local-state invitation workflow. Production work must add Supabase Auth invitations, an explicit role enum, permission/group tables, RLS policies, invite acceptance, password setup, status transitions, audit logs, and route guards.

### Routes, validation, and delivery

- `src/App.tsx` now includes the `/shop-owner` route, and `public/manus-routes.json` is synchronized with it.
- The implementation uses the existing Vite + React + TypeScript + Tailwind stack and existing local image assets; no new external assets or secrets were added.
- The dashboard work passed `npm run typecheck`, `npm run build`, and `npm run lint` with no errors. Existing lint warnings, Browserslist freshness warnings, and bundle-size warnings remain non-blocking.
- GitHub delivery commits for this dashboard sequence are: `420f69f` traveler dashboard refinement, `16d7362` Ads Management, `07d13fa` Shop Owner creation, `b541cfc` Shop Owner dashboard, and `ee684e4` Admin Management.
