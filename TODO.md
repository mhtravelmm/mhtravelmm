# TODO

## Blogs page and article reading experience — Complete

- [x] Blog titles and bodies are available in both Myanmar and English.
- [x] Blogs shows editorial article categories as user-facing filters, separate from backend-only SEO tags, which are not displayed in the app.
- [x] Readers can favorite, share, and see view counts for blog posts.
- [x] Every blog content card shows rating, distance, favorite state, and views.
- [x] Story cards use an image-led layout with readable summaries and activity metrics.
- [x] Blogs uses the shared header and full footer shown in the supplied reference.

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


## Traveler account dashboard UI refresh — Complete

- [x] `/account` follows the supplied MH Travel dashboard reference: navy/cyan visual language, traveler profile and account navigation, destination welcome banner, four account stat cards, upcoming trip, quick actions, recent activity, Myanmar discovery panel, and full footer.
- [x] The dashboard adapts to mobile widths with compact profile/navigation and stacked or compact card layouts while keeping account destinations accessible.
- [x] Existing account destinations, favorite toggling, notification links, settings/support views, profile edit entry, and logout behavior remain usable.
- [x] New account dashboard interface text is available in both Burmese and English.

## Blogs page responsive reference refresh — Complete

- [x] `/blogs` follows the supplied MH Travel reference with a Shwedagon-at-dusk hero, bilingual blog heading/subheading, editorial category filters for All, Travel Tips, Nature, Food, Health, Culture, Safety, and Others, a responsive story-card layout, and the full footer.
- [x] Category chips filter by explicit editorial category; they do not expose or reuse backend-only `seoTags`.
- [x] Desktop shows an image-led multi-column card grid; mobile uses compact horizontal story cards and a compact category grid.
- [x] Story cards retain date, category, title, excerpt, reading/view/favorite metrics, favorite toggle, share action, and reader entry. Search, sorting, shareable story URLs, bilingual reader, and related content continue to work.
- [x] A Load More control reveals additional matching stories and resets appropriately when search or category filters change.
- [x] New Blogs interface text is available in Burmese and English.


## Compact Blogs cards for desktop and phone — Complete

- [x] Reduce oversized story boxes to the tighter proportions of the supplied Blogs reference, using a denser desktop grid and shorter card image/body spacing.
- [x] Keep phone story cards compact and horizontal with a small thumbnail on the left, readable title/excerpt and category/date on the right, and accessible favorite/share/read controls without horizontal overflow.
- [x] Preserve category filtering, search, sorting, reader links, bilingual labels, metrics, and the Load More interaction while changing card dimensions.
