# MH Travel — Implementation Worklog

## 1. Product foundation and visual direction

- Project stack is Vite, React, TypeScript, Tailwind CSS, React Router, Lucide icons, and custom Language/Currency/Theme hooks.
- Base visual direction is a dark travel platform UI with blue accents, red action/price accents, compact cards, responsive layouts, and bilingual Burmese/English text.
- Shared listing/content cards are designed to show rating, distance, favorites, and views.
- Home uses the full footer; inner pages use the copyright-only footer.
- Mobile header keeps Menu, MH Travel, Search, and Notifications; account access is placed in the mobile sidebar footer.
- Mobile sidebar uses a partial-width drawer and renders fixed overlays through a portal.
- User-provided visual references are followed for Home, restaurant, bookstore, compact travel cards, and the `/cities` discovery sections.

## 2. Completed traveler-facing pages

### Home

- Home page includes categories, travel plans, travel guide, blogs, popular hotels/listings, reviews, awards, partners, ad slots, and full footer sections.
- Travel Guide and Popular cards were resized and aligned to the compact shared card system.
- Local Myanmar photography is used across Travel Plan, Travel Guide, Blog, and Popular cards.
- Home ad positions use the shared `AdSlot` component and collapse when no ad is available.

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
