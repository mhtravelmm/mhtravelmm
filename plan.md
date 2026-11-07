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
- Cloudflare Workers also serve data as JSON so direct URLs stay hidden.
  Cloudflare R2 is used for file storage.
- Claude writes the application code directly. For Cloudflare Workers and
  Supabase, Claude writes the code/SQL and the owner applies or deploys it,
  with Claude guiding each step.
- Secrets (Supabase keys, tokens) live in a local, gitignored `.env` and in
  Cloudflare's build environment variables. They are never committed.

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
  full opaque overlay). The drawer holds nav links, Favorite, Language,
  Currency, Theme, Legal links, Help and Support links, payment method
  icons, App Store/Google Play, Login/Registration and the copyright line.
- Inner pages (City, Nearby, detail pages, Blog) use a copyright-only
  footer. Only the Home Page has the full footer (legal, help and support,
  navigate, content, payment methods, app download).
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
- No user-facing categories or tags. A backend-only SEO tag field feeds
  search engines and is never shown in the app.
- Interactions: favorite, share, view count.
- Blogs Page implementation: use a searchable latest-story list with compact,
  image-led story cards sized close to the homepage Travel Plan cards; keep
  categories, tags, breadcrumbs, and oversized hero panels out of the UI. Open
  articles in a bilingual reader, preserve shareable story URLs, and keep
  favorite/view interactions client-side until the backend is connected.

Travel Guide:

- Written by Travel Guide Content Admin, who earns per post.
- Structured, time-based itinerary. Each stop has a time, a real listing
  that already exists in MH Travel's database (no outside places), a
  description and photos.
- "Follow this route" is stop by stop, with a Directions button per stop
  reusing the existing How-to-Get-There module. A full auto-sequenced
  version may come later.

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
  Reviews, Messages, Settings, Support/Legal. Visual detail to be refined
  during the build.
- Language: EN/MM with auto-translation fallback. Auto-translated text is
  cached and queued for Admin review.
- Currency: MMK and USD display using an Admin-set exchange rate.
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
- All user-facing strings go through the translation helper.
- Ad slots use the shared `AdSlot` component so the collapse rule lives in
  one place.
- Overlays that use `position: fixed` (drawers, modals) must render through
  a React portal into `document.body`. The sticky header uses
  `backdrop-blur`, which makes any `fixed` child size itself to the header
  box instead of the screen. The mobile drawer hit exactly this bug.

---

## 16. Open Items

- Favorites page (the header heart currently links to a placeholder).
- City page: wire favorite toggling (same fix already done on Home).
- Blogs page implemented: bilingual editorial listing and reader; favorite,
  share, and view counts currently use client-side storage pending backend wiring.
- Travel Plans page implemented: compact shared-card grid with bilingual UI,
  route search, duration filters, sorting, price display, and client-side
  favorite toggles. The page starts directly with the plan tools and ends with
  a bilingual custom-plan builder for destination, days, and notes; no extra
  intro banner is shown.
- Remaining pages: Nearby, Rentals, Ticketing, Travel Guide,
  detail pages, Search, Account.
- Real photography (current build uses placeholder gradients).
- Payment gateway details (KBZPay, AYA Pay and others).
- R2 folder and naming convention for manually uploaded assets.
- Travel guide rental expense mechanics.
- Owner and Admin dashboard screens, after the user-facing pages are done.
