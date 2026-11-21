# Plan vs Code — Verification Record

**Checked:** 20 November 2026
**Against:** `main` @ `acbca41`
**Method:** every claim below was read in `Plan/PROJECT-PLAN.md` and then tested
against the source tree. Nothing here is inferred from earlier notes.

This file records where the Plan is accurate, where it has gone stale, and
where it contradicts itself. It does not change any code or any plan text.

---

## 1. Summary

| Result | Count |
|---|---|
| Plan claim **confirmed** by code | 9 |
| Plan claim **stale** (code moved on) | 4 |
| Plan **internally contradictory** | 1 (3 violations in code) |
| Plan claim **still open / accurate as a gap** | 6 |

The Plan is broadly honest. Its weakness is age: the audit section is dated
2026-11-09, and four claims in it have since been fixed in code without the
doc being updated.

---

## 2. Confirmed — Plan matches code

| # | Plan claim | Where | Verified by |
|---|---|---|---|
| 1 | Cards always show rating, distance, favorite, views; enforced on the type | §4 | `CardListing` has `rating`, `distanceKm`, `isFavorited`, `views` as required fields |
| 2 | Five card sizes, max widths 150/190/240/300/340px | §4 table | `CARD_SIZES` in `ListingCard.tsx` matches exactly |
| 3 | No `supabase/` migration directory in the checkout | §2A audit | Directory absent |
| 4 | Currency uses hard-coded `MMK_PER_USD = 4500` | §2A audit | `DEFAULT_MMK_PER_USD = 4500` in `currency.tsx` |
| 5 | No automated test runner in `package.json` | §2A audit | No `test` script, no vitest/jest |
| 6 | Local preview store keeps plaintext passwords | §2A audit | `type StoredUser = AuthUser & { password: string }` |
| 7 | Favorites live in `mh-travel-favorite-overrides` only | §2A audit | `STORAGE_KEY` in `favorites.tsx` |
| 8 | Blog reader uses `/blogs?story=<slug>` | §2A audit | `searchParams.get('story')` |
| 9 | Shared hero utility: 190 / 230 / 250px | §16 | `.mh-page-hero` in `index.css`, used by 8 pages |

---

## 3. Stale — code moved on, Plan did not

These are not code defects. They are documentation debt, and they matter
because a future reader will trust the Plan.

### 3.1 `/blogs/:id` links no longer fall through

**Plan says** (§2A, line 119 and line 143): legacy `/blogs/<id>` paths "do not
match the router" and fall to Not Found.

**Code says**: `src/App.tsx` line 104 registers `/blogs/:storyId` and
`LegacyBlogRedirect` (line 55) forwards it to `/blogs?story=:id`. The links
work.

**Fix**: drop `/blogs/:id` from both stale-link lists.

### 3.2 "Only Supabase calls are auth.tsx"

**Plan says** (§2A): the only Supabase calls in source are Auth/session and
`public.profiles` lookup in `src/lib/auth.tsx`.

**Code says**: `src/lib/mainOwnerApi.ts` also imports `supabase` and
`isSupabaseConfigured`, and performs branch-account work. `blogMediaApi.ts`
performs a `fetch` to the R2 endpoint. The claim is now too narrow.

**Fix**: name `auth.tsx`, `mainOwnerApi.ts`, and `blogMediaApi.ts`.

### 3.3 Route manifest "matches the concrete routes"

**Plan says** (§2A): `public/manus-routes.json` matches the concrete routes.

**Code says**: it matches 25 of 26. `src/App.tsx` declares `/blogs/:storyId`
and the manifest does not list it. That is a real, if harmless, drift — the
manifest is used as the route inventory, so it should list every route.

**Fix**: add `/blogs/:storyId` to the manifest, or state that legacy redirect
paths are intentionally omitted.

### 3.4 "City discovery rows use five desktop columns"

**Plan says** (line 701 and line 1074): City discovery rows were changed from
six to five columns to remove the empty sixth slot.

**Code says**: `columns={5}` is passed, and `ListingGridSection` renders
`w-[calc(50%-0.3125rem)] sm:w-[var(--card-w)]` inside a `flex flex-wrap`, so
the grid is **not** a five-column CSS grid — it is a flex row capped at
`5 × cardWidth + gaps`. On a wide screen with `md` cards the row is capped at
1230px, not stretched to five equal columns. The Plan describes a CSS grid
that the code does not use.

**Fix**: describe the cap, not the column count.

---

## 4. Internally contradictory — Plan vs Plan, and Plan vs code

### 4.1 The column-count rule contradicts the size table

`Plan/PROJECT-PLAN.md` §4 contains both of these, eleven lines apart:

| Line | Rule |
|---|---|
| 183 | `md` is the **default for every grid row**: Hotels, Book Shops, Rentals, Transport, Markets, Restaurants, Cafes, Nearby, City and Search |
| 193–194 | **five and six column rows use `xs` or `sm`**, four column rows use `lg` at most, only three column rows may use `xl` |

A five-column row of Hotels cannot simultaneously be the default `md` and be
required to use `xs`/`sm`. The code follows the table (line 183), not the rule
(line 193), in fifteen places:

| File | Section | Columns | Size |
|---|---|---|---|
| `HomePage.tsx` | Popular Hotels | 5 | `md` |
| `HomePage.tsx` | Book Shops | 5 | `md` |
| `HomePage.tsx` | Rentals | 5 | `md` |
| `HomePage.tsx` | Transport Operators | 5 | `md` |
| `HomePage.tsx` | Markets | 5 | `md` |
| `HomePage.tsx` | Top Attractions | 5 | `md` |
| `HomePage.tsx` | Restaurants | 5 | `md` |
| `HomePage.tsx` | Cafes | 5 | `md` |
| `CityPage.tsx` | Popular Hotels | 5 | `md` |
| `CityPage.tsx` | Restaurants | 5 | `md` |
| `CityPage.tsx` | Book Shops | 5 | `md` |
| `CityPage.tsx` | Rentals | 5 | `md` |
| `CityPage.tsx` | Transport Operators | 5 | `md` |
| `CityPage.tsx` | Cafes | 5 | `md` |
| `CityPage.tsx` | Markets | 5 | `md` |

Rows that **do** obey the rule: Blogs (`4 / sm`), Populars (`6 / xs`), Travel
Guide on Home (`4 / lg`), Travel Plans (`3 / xl`), City Travel Guide
(`3 / xl`), City Top Attractions (`5 / xs`), and the three bottom rows on
Blogs, Travel Guide (`5 / sm`).

**This is the single most important finding in this document.** Either the
rule at line 193 is wrong, or fifteen rows are wrong. It cannot be settled
without a decision, and it should be settled before any further card work.

### 4.2 Direct card grids bypass the size rule entirely

Four page-level grids use `size="md"` at five columns, which the rule at line
193 forbids but the table at line 183 allows:

- `FavoritesPage.tsx` — `lg:grid-cols-5`, `size="md"`
- `AccountPage.tsx` — two grids, `lg:grid-cols-5`, `size="md"`
- `CityPage.tsx` — business explorer, `lg:grid-cols-5`, default size (`md`)

These are true CSS grids, so unlike `ListingGridSection` they really do render
five columns. The Plan's rule and these four grids disagree in the same way as
§4.1.

---

## 5. Still accurate — the Plan's open gaps are real

| Plan item | Status in code |
|---|---|
| Restaurant menu category selector does not filter dishes | **Confirmed.** `menuCategory` state is set by the buttons at line 133, but line 137 renders `DISHES.map(...)` with no filter. |
| Restaurant/Book Shop CTAs are visual only | **Confirmed.** Directions, Call, View all buttons have no handler. |
| Restaurant/Book Shop `:id` ignores the route parameter | **Confirmed.** `RestaurantPage` and `BookShopPage` contain no `useParams`. |
| Catalog, bookings, plans, notifications are compiled data, not API | **Confirmed.** No query layer outside auth, main-owner, and blog media. |
| Custom Plan, Rental, Ticketing submissions are local state only | **Confirmed.** No insert, no request ID, no notification. |
| Blog distances are seeded, not computed | **Confirmed.** Geolocation gates display only. |

The Plan's honesty here is a strength. These six items should stay.

---

## 6. What the Plan does not mention at all

Gaps in the Plan's coverage, found while checking it:

1. **48 broken internal links.** The Plan lists the undeclared paths but never
   counts them or ties them to the visible "View all" buttons. See
   [`STATUS.md` §5](./STATUS.md#5-broken-internal-links--not-done-48-links).
2. **`/book_shop` typo.** Not mentioned anywhere.
3. **Load More behaviour.** Not specified, so the code defines it twice with
   two different implementations and no row-full check.
4. **Tablet horizontal overflow at 820px.** Not mentioned.
5. **`xs` card readability on phones** (145×67px, 9px/7px type). Not mentioned.
6. **Shop Owner and Main Owner have no `useLanguage`.** The Plan mentions Super
   Admin body copy as English-only but not the other two dashboards.
7. **`Doc/` and `Plan/` overlap.** Two files now describe status. `STATUS.md`
   was added on 20 Nov; `COMPLETED-WORK.md` and `REMAINING-WORK.md` predate it
   and partly duplicate it. The Plan should state which one wins.

---

## 7. Recommended plan edits

Ordered by how much confusion each removes. None of these are code changes.

1. **Resolve §4.1.** Pick one: either `md` is the default for five-column rows
   (then delete the line-193 rule), or five-column rows must use `xs`/`sm`
   (then fifteen rows must change). One decision, written down once.
2. **Delete the `/blogs/:id` stale claims** (§3.1).
3. **Name the three Supabase-touching modules** (§3.2).
4. **Add `/blogs/:storyId` to the route manifest** (§3.3).
5. **Rewrite the "five desktop columns" sentences** to describe the width cap
   (§3.4).
6. **Add a Load More rule** to §4, since it is a layout rule that currently
   exists only in code.
7. **Point the Plan at `Doc/STATUS.md`** as the status view, so there is one
   answer to "what is left".

Items 2–5 are mechanical. Item 1 needs your decision. Item 6 is a small design
rule that will prevent the two implementations from drifting further.
