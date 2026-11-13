# MH Travel — Implementation Worklog

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
- EN/MM coverage audit completed: traveler-facing routes and the shared traveler shell consume the language context, while Super Admin body copy still contains untranslated English beyond its translated navigation labels. Shop Owner has no language-context integration and remains English-only. The gap is documented for the next localization pass.
- City discovery rows were corrected from six to five desktop columns because each City catalog currently contains five cards. Restaurants, Book Shops, Rentals, Hotels, Attractions, Transport, Cafes, and Markets now fill the available row width without an empty sixth-column gap.
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
- Two Supabase migrations were applied to create the profile schema and then allow verified Super Admin role management. The Plan folder records what those migrations did and their current status; SQL source files are intentionally not stored in Plan.
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

The remaining implementation work is a template catalog and version system, preview/apply selector, category compatibility, subscription/payment/entitlement records, renewal and grace-period handling, RLS, audit events, Platform Admin template management, safe retirement/rollback, and analytics. This is a new product requirement documented in `plan.md`, `TODO.md`, and this worklog; no UI or payment integration was implemented in this documentation-only update.


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
