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
