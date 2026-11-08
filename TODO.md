# TODO

## Blogs page and article reading experience — Complete

- [x] Blog titles and bodies are available in both Myanmar and English.
- [x] Blogs shows editorial article categories as user-facing filters, separate from backend-only SEO tags, which are not displayed in the app.
- [x] Readers can favorite, share, and see view counts for blog posts.
- [x] Every blog content card shows rating, distance, favorite state, and views.
- [x] Story cards use an image-led layout with readable summaries and activity metrics.
- [x] Blogs uses the shared header; full footer content is reserved for Home while the copyright line follows the global placement rule.

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

## Home-only full footer and global copyright — Complete

- [x] On desktop, the full footer with MH Travel branding, social links, legal/help/navigation/contact columns, payment options, app-store links, and copyright is rendered on Home only. Other pages have no full footer.
- [x] On desktop, every page has the copyright line at the bottom; Home uses the copyright row in its full footer without a duplicate, and every other page shows a copyright-only strip.
- [x] On phones, copyright is anchored at the bottom of the mobile sidebar on every standard route. The page-flow full/copyright footer is hidden; Home-only Legal, Help/Support, payment and app-download sections remain limited to Home's mobile drawer.
- [x] Standalone admin routes also retain a copyright line at the bottom of their page layouts.


## Traveler account dashboard UI refresh — Complete

- [x] `/account` follows the supplied MH Travel dashboard reference: navy/cyan visual language, traveler profile and account navigation, destination welcome banner, four account stat cards, upcoming trip, quick actions, recent activity, and Myanmar discovery panel; the full footer is Home-only and account shows only the global copyright placement.
- [x] The dashboard adapts to mobile widths with compact profile/navigation and stacked or compact card layouts while keeping account destinations accessible.
- [x] Existing account destinations, favorite toggling, notification links, settings/support views, profile edit entry, and logout behavior remain usable.
- [x] New account dashboard interface text is available in both Burmese and English.

## Blogs page responsive reference refresh — Complete

- [x] `/blogs` follows the supplied MH Travel reference with a Shwedagon-at-dusk hero, bilingual blog heading/subheading, editorial category filters for All, Travel Tips, Nature, Food, Health, Culture, Safety, and Others, and a responsive story-card layout; the full footer is Home-only and Blogs shows only the global copyright placement.
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
- [x] Do not duplicate Home, Nearby, Ticketing, Travel Plans, or User Account in the mobile sidebar. Keep the remaining destinations, Favorites, language/currency/theme controls, and Home-only footer sections in the sidebar.
- [x] Reserve safe-area-aware space beneath page content so the bar does not cover Blog text, controls, related stories, or copyright; the existing hamburger continues to open the sidebar.
