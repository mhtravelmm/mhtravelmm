# MH Travel — Work Status Record

**Last audited:** 20 November 2026
**Audited against:** `main` @ `5f3924b`

This file is the single status view for the project. It replaces guesswork about
what is finished: every item below was checked against the actual source tree,
not against earlier notes. Two companion files hold the detail:

- [`COMPLETED-WORK.md`](./COMPLETED-WORK.md) — what is built and verified.
- [`REMAINING-WORK.md`](./REMAINING-WORK.md) — what is not built yet, grouped by
  the layer it belongs to.

The authoritative product plan stays in
[`../Plan/PROJECT-PLAN.md`](../Plan/PROJECT-PLAN.md).

---

## 1. How to read the status marks

| Mark | Meaning |
|---|---|
| **DONE** | Implemented in code and verified in this audit. |
| **PARTIAL** | Implemented but with a known gap, listed in the item notes. |
| **PREVIEW** | Works, but on local/seed data instead of a backend. |
| **NOT DONE** | Planned, not implemented, or actively broken. |

`PREVIEW` is not a failure. The project was built frontend-first, so most
traveler features are intentionally preview-quality until the backend wiring
lands. The distinction matters because a preview feature can look finished
while still having no persistence.

---

## 2. Delivery checks

Verified on this audit, on `main` @ `5f3924b`:

| Check | Result |
|---|---|
| TypeScript typecheck | **PASS** (0 errors) |
| Vite production build | **PASS** (3.1s) |
| ESLint | **PASS** (0 errors, 7 pre-existing warnings) |
| Git tree vs `eef11a5` | **identical** (revert verified) |
| `main` vs `origin/main` | **in sync** |

---

## 3. Design system

| Item | Status | Notes |
|---|---|---|
| Five card sizes, no others | **DONE** | `xs/sm/md/lg/xl` in `src/components/ui/ListingCard.tsx` |
| Card width cap (no long bars) | **DONE** | `maxWidth` per size: 150/190/240/300/340px |
| Grid cap per page | **DONE** | Blogs, Favorites, Account, City, Search, Travel Plans |
| Plan doc matches code | **DONE** | Card table in `PROJECT-PLAN.md` §4 matches `CARD_SIZES` |
| Dark theme base + light theme | **DONE** | `.light` class on `<html>`, tokens in `tailwind.config.js` |
| Bilingual MM/EN provider | **PARTIAL** | 758 keys; dashboards lag (see §6) |
| Site-wide right-click / zoom guard | **DONE** | Interaction guard component |

### Card size reference (verified against code)

| Size | Max width | Image height | Title | Body padding |
|---|---|---|---|---|
| `xs` | 150px | 32px | 9px | 4px |
| `sm` | 190px | 40px | 10px | 6px |
| `md` | 240px | 52px phone / 56px web | 11px / 12px | 8px |
| `lg` | 300px | 60px phone / 64px web | 12px / 13px | 8px |
| `xl` | 340px | 68px phone / 72px web | 13px / 14px | 10px |

---

## 4. Traveler-facing pages

All 26 declared routes resolve. Every page below renders without a crash.

| Route | Status | Notes |
|---|---|---|
| `/` Home | **PREVIEW** | 12 sections, seed data, ad slots wired to local pipeline |
| `/cities` | **PREVIEW** | City grid + category explorer |
| `/cities/:cityId` | **PREVIEW** | Hero, facts, recommendations, category explorer |
| `/nearby` | **PREVIEW** | Geolocation with Yangon fallback, 13 categories |
| `/rentals` | **PREVIEW** | 10 rental records, booking form is local state |
| `/restaurants` | **PREVIEW** | Detail layout; no route-parameter record selection |
| `/restaurants/:id` | **PARTIAL** | Route exists, does not select by `id` |
| `/book-shops` | **PREVIEW** | Same limitation as restaurants |
| `/book-shops/:id` | **PARTIAL** | Route exists, does not select by `id` |
| `/ticketing` | **PREVIEW** | Bus/train/events/cinema flows, seat selection |
| `/travel-plans` | **PREVIEW** | Search, filters, custom-plan builder |
| `/travel-plans/:planId` | **PREVIEW** | Generated itinerary, pricing, CTA |
| `/travel-guide` | **PREVIEW** | Category + search filters |
| `/travel-guide/:guideId` | **DONE** | Full guide reader with itinerary timeline |
| `/blogs` | **PREVIEW** | Listing + in-page reader via `?story=` |
| `/blogs/:storyId` | **DONE** | Legacy path redirects to `/blogs?story=:id` |
| `/search` | **PREVIEW** | City/category/combined query modes |
| `/favorites` | **PREVIEW** | localStorage-backed |
| `/account` | **PREVIEW** | Dashboard shell, sample state |
| `/notifications` | **PREVIEW** | All/Unread/Read filters |
| `/account/notifications` | **PREVIEW** | Same inbox, account-scoped path |
| `/login` | **PARTIAL** | UI complete; local preview session |
| `/signup` | **PARTIAL** | UI complete; local preview session |
| `/admin/login` | **PARTIAL** | Separated from traveler login |
| `/super-admin` | **PARTIAL** | Guarded; English-only body copy |
| `/shop-owner` | **PARTIAL** | Guarded; no i18n at all |
| `/main-owner` | **PARTIAL** | Guarded; no i18n at all |

---

## 5. Broken internal links — **NOT DONE** (48 links)

This is the largest concrete defect found in the audit. Links point at routes
that do not exist, so every one of them lands on the `*` fallback and shows
"Not found — coming soon."

The links come from seed data `href` fields and `viewAllHref` props, so they
are reachable from real UI on Home, City, Blogs, Travel Guide, and Nearby.

### 5a. Missing category pages (10)

`/hotels`, `/cafes`, `/attractions`, `/markets`, `/populars`, `/reviews`,
`/categories`, `/partners`, `/awards`, `/guides`

Each is a `viewAllHref` target on one or more sections. Ten "View all" buttons
currently go nowhere.

### 5b. Missing detail pages (38)

| Pattern | Count | Example |
|---|---|---|
| `/hotels/:id` | 8 | `/hotels/lotte` |
| `/cafes/:id` | 5 | `/cafes/java` |
| `/markets/:id` | 7 | `/markets/bogyoke` |
| `/attractions/:id` | 5 | `/attractions/ta1` |
| `/ticketing/:id` | 5 | `/ticketing/jj-express` |
| `/rentals/:id` | 5 | `/rentals/pre1` |
| `/book_shop` (malformed) | 1 | underscore instead of hyphen |
| `/emergency`, `/exchange`, `/sim_card` | 3 | utility links |

`/book_shop` is a typo for `/book-shops` and is the cheapest fix.

### 5c. Recommended handling

1. Fix the `/book_shop` typo now.
2. Decide whether the ten category pages become real routes or the "View all"
   buttons point at the closest existing page.
3. For the 38 detail links, either add detail routes or strip the link and
   render the card as non-interactive until the page exists.

The Plan already lists this as backlog under "Routes, content, and UX backlog".
It is repeated here because it is the item a user is most likely to hit.

---

## 6. Dashboards

| Area | Status | Notes |
|---|---|---|
| Super Admin metrics/users/content | **PARTIAL** | Seeded metrics, English body |
| Super Admin Ads Management | **PREVIEW** | Page-oriented placements, local state |
| Shop Owner creation | **PREVIEW** | Local persistence, plaintext preview password |
| Admin Management | **PREVIEW** | Local state |
| Blog Post Management | **PARTIAL** | Editor complete, upload falls back locally |
| Shop Owner dashboard | **PARTIAL** | English-only, no `useLanguage` |
| Main Owner dashboard | **PARTIAL** | English-only, no `useLanguage` |
| Role guards | **DONE** | Super Admin, Shop Owner, Main Owner protected |

---

## 7. Backend and persistence

| Item | Status | Notes |
|---|---|---|
| Supabase project + migrations | **DONE** | Profiles, favorites, plans, bookings, notifications, reviews, ads, audit logs |
| RLS policies | **DONE** | Owner/admin policies with helper + indexes |
| Auth session hydration | **PARTIAL** | Works when env is configured |
| Email/password + OAuth calls | **PARTIAL** | Provider secrets and redirect URLs still needed |
| Favorites persistence | **PREVIEW** | localStorage; table exists, form not wired |
| Bookings / plan requests | **PREVIEW** | UI only, no insert |
| Notifications | **PREVIEW** | localStorage, tab-synced |
| Exchange rate | **PREVIEW** | `1 USD = 4,500 MMK` hard-coded default |
| Blog media (Cloudflare R2) | **PARTIAL** | Adapter exists, no deployed Worker |

`localStorage` is used across 8 files with 14 distinct keys. Every one of them
is a production replacement target, listed in `REMAINING-WORK.md`.

---

## 8. Code hygiene

| Check | Result |
|---|---|
| `TODO` / `FIXME` / `HACK` markers | 0 |
| `console.log` in source | 0 |
| Images without `alt` | 5 |
| Buttons without `aria-label` | 139 (most are text buttons; audit pending) |
| Hard-coded English sentences | 8 in traveler pages |
| Duplicate `<h1>` per page | none found |

The 139 buttons without `aria-label` is not automatically a defect — a button
with visible text does not need one. It is listed so the accessibility pass has
a starting count rather than a blank page.

---

## 9. What the Plan says vs what the code does

Two places where the doc and the tree disagreed, now reconciled:

1. **Card sizes.** The Plan table and `CARD_SIZES` match after the revert.
   Earlier rewrites (fixed-box, 3:2 scale) were reverted in `5f3924b` and
   preserved on branch `backup/cards-3to2-35fcc5e`.
2. **Load More.** The Plan does not describe Load More behaviour, so the code
   defines it by accident. Two independent implementations exist:

   | Page | Page size | Columns | Row-full check |
   |---|---|---|---|
   | Blogs | 6 | 1 / 2 / 3 / 4 | none |
   | Travel Guide | 6 | 1 / 2 / 3 / 4 | none |

   At four columns, six items render as one full row plus a half row, so the
   button sits under a gap. Neither page hides the button when the remaining
   items would not fill a row. Recorded as remaining work rather than treated
   as done.

---

## 10. Suggested next order

Not a commitment, just the order that removes the most user-visible breakage
per unit of work:

1. Fix `/book_shop` typo and audit the other malformed links.
2. Decide the ten missing category pages — route or re-point.
3. Run a real accessibility pass on the 139 buttons.
4. Localize Shop Owner and Main Owner.
5. Wire Favorites and Notifications to the tables that already exist.

Steps 1–2 are small and remove 48 dead links. Steps 3–5 are larger and belong
with the production backend push.
