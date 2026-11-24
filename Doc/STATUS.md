# MH Travel — Work Status Record

**Last audited:** 24 November 2026 (the template analytics pass: `/shops/:shopId`
renders nine lazy templates from the §4 catalog over one typed fixture, the owner
previews any of them on their own data, `src/lib/templateStats.ts` counts views
and applies per template while never counting a preview, the Super Admin catalog
panel shows the usage table, and `scripts/a11y-audit.mjs` is the rendered gate —
72 combinations of template, width and theme, clean. The three new hotel designs
are Booking Focus, Map First and Story. Before that,
the owner money path: `src/lib/ownerLedger.ts`
snapshots the commission on each transaction, plans and settles the §9
twice-monthly payout with the 50,000 MMK carry-over, and `replayPayout()` is the
§16D Phase 3 gate that a run is reproducible from its ledger rows — plus the new
Super Admin `payouts` section and the owner's real Payments statement;
`20261127000100_owner_ledger.sql` is committed. Before that, the owner and
template subscriptions:
`src/lib/ownerSubscriptions.ts` holds the Active → grace → expired rules and the
7/3/1-day reminders, `src/lib/subscriptionJobs.ts` runs both §16B.7 jobs so every
job in the registry is now wired, the owner's Subscription panel reads only their
own row, and `shop_subscriptions` is committed; before that, the notification readers: a bell row, an
inbox row and a rental notice are stored in both languages and read through
`localizedOrFallback()`, the age comes from `src/lib/timeAgo.ts` and is
translated rather than stored, and the inbox groups by Myanmar calendar day
instead of by a word in the English label; before that, the §16B.4 reader pass: every reader — city,
category, place, restaurant, book shop and the rental labels — now reads
through `localizedOrFallback()`, so a record written in one language shows that
language instead of a blank; before that, the card rule: a rating and a distance
are hidden when absent, in `src/lib/cardMeta.ts`, with Plan §4 corrected to
match §10 §8; before that, the Blog bilingual content model: MM/EN
author and location, MM/EN image captions, and `galleryUrls` removed with the
stored rows migrated; before that, 25 November: the §16A Adsboard — the
advertiser rows, the campaign filters, the AdSense fallback step in `AdSlot`, the
§16A.8 creative limits and domain block list, and Payment Admin's read-only
reports; before that, 24 November: admin accounts, audit log, role change,
exchange-rate history, the shared money formatter, the §16B.7 jobs runner,
scheduled publishing for Blog and Travel Guide, the content lifecycle —
unpublish, soft delete, restore and the stale-save refusal — the §16B.3
notification feed and the §16B.4 translation fallback added)
**Audited against:** `main` plus the rental order rules in
`src/lib/rentalOrderRules.ts`, the Rental catalog data module, the Rental Admin
panel, the per-account Favorites/notification/review wiring, and the earlier
22 November work on the guide route follower, the two owner dashboards, the
Foreign Tourist section, and the Super Admin localization pass.

This file is the single status view for the project. It replaces guesswork about
what is finished: every item below was checked against the actual source tree,
not against earlier notes. Two companion files hold the detail:

- [`COMPLETED-WORK.md`](./COMPLETED-WORK.md) — what is built and verified.
- [`REMAINING-WORK.md`](./REMAINING-WORK.md) — what is not built yet, grouped by
  the layer it belongs to.
- [`PLAN-VS-CODE.md`](./PLAN-VS-CODE.md) — every Plan claim tested against the
  source tree: what is confirmed, what has gone stale, and where the Plan
  contradicts itself.

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

Verified on this audit:

| Check | Result |
|---|---|
| TypeScript typecheck | **PASS** (0 errors) |
| Vite production build | **PASS** |
| ESLint | **PASS** (0 errors, 7 pre-existing warnings) |
| `npm test` (vitest) | **PASS** (664 tests, 59 files) |
| Seed link audit | **PASS** (0 broken of 261 clickable targets) |
| Route audit | **PASS** (43 declared routes, all render) |

The test runner is the change that keeps this list honest: `npm test` fails if
a seed link, a catalog id, or the route manifest drifts from the routes the
app declares.

---

## 3. Design system

| Item | Status | Notes |
|---|---|---|
| Five card sizes, no others | **DONE** | `xs/sm/md/lg/xl` in `src/components/ui/ListingCard.tsx` |
| Card width cap (no long bars) | **DONE** | `maxWidth` per size: 150/190/240/300/340px |
| Grid cap per page | **DONE** | Blogs, Favorites, Account, City, Search, Travel Plans |
| Plan doc matches code | **DONE** | Card table in `PROJECT-PLAN.md` §4 matches `CARD_SIZES` |
| Dark theme base + light theme | **DONE** | `.light` class on `<html>`, tokens in `tailwind.config.js` |
| Bilingual MM/EN provider | **DONE** | 2,001 keys in `src/lib/translations.ts`; every traveler page, dashboard shell, both content editors and the Rental Admin panel are localized |
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

All 43 declared routes resolve, verified by a headless crawl of every path and
by `src/routes.manifest.test.ts`. Every page below renders without a crash.

| Route | Status | Notes |
|---|---|---|
| `/` Home | **PREVIEW** | 12 sections, seed data, ad slots wired to local pipeline |
| `/cities` | **PREVIEW** | City grid + category explorer |
| `/cities/:cityId` | **PREVIEW** | Hero, facts, recommendations, category explorer |
| `/nearby` | **PREVIEW** | Geolocation with Yangon fallback, 13 categories |
| `/rentals` | **PARTIAL** | Categories come from `src/data/rentalCatalog.ts` with the Plan §8.2 decisions applied: Yangon offers no motorbike or scooter, self-drive car is retired, car types and bicycle types are data. The selector lists only what the chosen city offers. A signed-in traveler submits an order with a `RNT-YYMMDD-####` code and opens `/account/bookings/<code>` for the printable voucher. Rental Admin → Orders drives the lifecycle (accept, record payment, complete, expire, cancel), filters by status/city/type/date, searches code, name and phone, and requires a reason to cancel. The Rental Admin panel covers all seven Plan §8.8 sections: catalog, availability, rates by city × type × variant with effective dates and history, branches with address and phone, published terms versions, and settings. Rental notifications fire on every status change: Requested to staff, Accepted/Paid/Expired/Cancelled to the traveler, reschedules back to staff. Rental Admin → Rental reports adds status, city, type and day tallies, paid conversion, median accept time, settled value and a CSV export. Every catalog save and every order status change writes an audit-log row, the five-minute expiry job moves unpaid Accepted orders to Expired, and a travel guide's lodging, food and travel costs are added as lines on the order (§16). Order submission now mirrors the §8.7 server rules on the client: `src/lib/rentalOrderRules.ts` validates city availability, variant, branch, the Myanmar Time start, minimum days, name, phone, address, participants, terms version and the per-account hourly limit, and recomputes the total from the catalog so a tampered form cannot create a cheap order. Every rejection returns a `rental_error_*` code that the page shows in MM and EN — all 23 codes the migrations raise now have both texts, guarded by `src/lib/rentalErrorMessages.test.ts`. The voucher lookup is scoped to the viewer, so a guessed `/account/bookings/<code>` no longer reveals another traveller's order, and the reschedule notice and the request-code day are counted in Myanmar Time. Still browser storage rather than the catalog and order tables; migrations are committed but not applied |
| `/restaurants` | **PREVIEW** | Menu, category filter, reviews, photos, CTA links |
| `/restaurants/:id` | **PREVIEW** | Resolves the record from `:id` |
| `/book-shops` | **PREVIEW** | Books, stationery, gifts, reviews, CTA links |
| `/book-shops/:id` | **PREVIEW** | Resolves the record from `:id` |
| `/shops/:shopId` | **PREVIEW** | The public Shop Page. The route never changes: it resolves the shop's template through `resolveTemplateForShop()` and asks `src/templates/registry.ts` for the lazy module, so a new template is a new module and a new catalog row. Six render: `hotel_classic` (free), `hotel_editorial`, `hotel_compact`, `hotel_gallery_first`, `book_shop_classic` and the generic classic behind restaurant, cafe and attraction. Every template receives the same `ShopPageData` fixture, so a switch never touches business data (§4). `?preview=<template-id>` renders another template on the same shop for that shop's owner or a Super Admin only, and records a `preview` audit row. Colours come from theme tokens, so the light theme renders correctly; `npm run a11y` is the rendered gate |
| `/attractions`, `/hotels`, `/cafes`, `/markets`, `/book-shops`, `/rentals`, `/transport`, `/populars` | **PREVIEW** | Catalog list with search and Show more |
| `/categories` | **DONE** | Category index linking all nine catalogs |
| `/:slug/:id` place detail | **PREVIEW** | Shared detail page for seven catalogs |
| `/ticketing` | **PREVIEW** | Bus/train/events/cinema flows, seat selection |
| `/travel-plans` | **PREVIEW** | Search, filters, custom-plan builder |
| `/travel-plans/:planId` | **PREVIEW** | Generated itinerary, pricing, CTA |
| `/travel-guide` | **PREVIEW** | Category + search filters; shows Admin-authored guides through the same reader projection, hiding a rating or distance the editor does not collect (Plan §10 §8) |
| `/travel-guide/:guideId` | **DONE** | Guide reader with itinerary timeline and a stop-by-stop "Follow this route" stepper |
| `/blogs` | **PREVIEW** | Listing + in-page reader via `?story=`; reads what Admin published through `src/lib/contentReader.ts`, so a post the `publish_due_content` job releases appears without a reload |
| `/blogs/:storyId` | **DONE** | Legacy path redirects to `/blogs?story=:id` |
| `/foreign-tourist` | **DONE** | Post-arrival help: emergency numbers, SIM, etiquette, money (Plan §13) |
| `/search` | **PREVIEW** | City/category/combined query modes |
| `/favorites` | **PREVIEW** | localStorage-backed |
| `/account` | **PREVIEW** | Dashboard shell, sample state |
| `/notifications` | **PREVIEW** | All/Unread/Read filters, Today/Yesterday/Earlier by Myanmar day, age translated in the reader's language |
| `/account/notifications` | **PREVIEW** | Same inbox, account-scoped path; rows carry both languages and collapse one event to one row |
| `/login` | **PARTIAL** | UI complete; local preview session |
| `/signup` | **PARTIAL** | UI complete; local preview session |
| `/admin/login` | **PARTIAL** | Separated from traveler login |
| `/super-admin` | **PARTIAL** | Guarded; shell, every panel and both content editors are bilingual |
| `/shop-owner` | **PARTIAL** | Guarded; bilingual labels, preview data |
| `/main-owner` | **PARTIAL** | Guarded; bilingual labels, preview data |

---

## 5. Internal links — **DONE** (0 broken)

The 48 broken links recorded in the previous audit are fixed and the fix is now
guarded by tests. `npm test` fails if a seed `href` stops resolving.

### 5a. Category pages — added (9)

`/attractions`, `/hotels`, `/restaurants`, `/cafes`, `/markets`,
`/book-shops`, `/rentals`, `/transport`, `/populars` are real routes served by
`CategoryPage`, plus `/categories` as the index. Each renders its own catalog
with search and a Show more control.

The previous "View all" targets `/reviews`, `/partners`, and `/awards` were
removed rather than routed: those three Home sections already render their
full content inline, so the button led nowhere useful.

### 5b. Detail pages — added (35)

| Pattern | Count | Example |
|---|---|---|
| `/hotels/:id` | 8 | `/hotels/lotte` |
| `/cafes/:id` | 5 | `/cafes/java` |
| `/markets/:id` | 7 | `/markets/bogyoke` |
| `/attractions/:id` | 5 | `/attractions/ta1` |
| `/ticketing/:id` | 5 | `/ticketing/jj-express` |
| `/rentals/:id` | 5 | `/rentals/pre1` |

All are served by `PlaceDetailPage`, which resolves the record from
`placeCatalog.ts` by id or by the trailing href segment. A record whose tail
matches no entry renders the not-found state rather than a blank page.

`/book_shop` (underscore) now maps to `/book-shops`.

### 5c. What the tests lock down

`src/data/links.test.ts` walks every seed `href` in the data modules and fails
if one does not resolve against `src/routes.ts`. `src/routes.manifest.test.ts`
fails if `public/manus-routes.json` drifts from the declared routes. Adding a
link without a route is now a test failure, not a silent 404.

`/emergency` and `/sim_card` are not separate routes: the Home tiles that used
to imply them open the matching anchor on `/foreign-tourist` (Plan §13). The
Exchange tile keeps pointing at the Nearby exchange listings, which are real
places rather than advice.

---

## 6. Dashboards

| Area | Status | Notes |
|---|---|---|
| Super Admin metrics/users/content | **PARTIAL** | Seeded metrics; body localized through `useLanguage` |
| Super Admin Ads Management (§16A) | **PREVIEW** | The Adsboard serves from `src/lib/adStore.ts`, which mirrors the §16A.4 tables (`ad_advertisers`, `ad_campaigns`, `ad_creatives`, `ad_placements`, `ad_events`, `ad_stats_daily`); the DDL is committed in `supabase/migrations/20261125000100_ads.sql` and the serving, click, roll-up and staff-policy SQL in `20261125000200_ads_serving.sql`, neither applied. Seven sections: Overview, Pages and placements (toggle, current ad, health state, 24-hour fill rate), Campaigns (status / advertiser / placement / day filters, one create-edit form with the fee and invoiced-paid flags), Creatives and approvals, Advertisers (contact details plus campaign history, and a rename follows the campaigns that carry the old name), Reports (by day, placement and campaign with CSV export) and Settings (AdSense ids, creative limits, blocked domains). Serving follows §16A.1 in `src/components/ui/AdSlot.tsx`: Admin ad, then AdSense when a client id is set and the placement allows fallback, then collapse. A click goes through `/ad/click/<creative_id>`, which records it through `record_ad_click()` and then redirects to the URL the RPC returns (§16A.5); impressions and clicks also post to `VITE_AD_EVENT_ENDPOINT` via `navigator.sendBeacon`, so a closed tab still reports. `AdSlot` serves through `serveAdFor()`, which calls `serve_ad(placement_key, language)` and caches for 60 seconds. Every §16A.3 placement now has a live `AdSlot`: home (6), blog (3), rentals, cities (4), city detail, travel plans, travel plan detail, nearby and account. Payment Admin opens Reports read-only per the §16B.1 `R (reports)` row. Rows are still browser storage |
| Super Admin Owner Payouts (§9, §16D Phase 3) | **PREVIEW** | The new `payouts` section, for Super Admin and Payment Admin only (§16B.1 `F`; Admin is `–`). It shows owed vs carried vs paid, the shops due this window, the per-shop commission editor (0–100%, default 0%), the run history and a per-run replay verdict. The rules are `src/lib/ownerLedger.ts`: the commission is frozen on each ledger row, the windows are day 1–15 due on the 20th and day 16–month end due on the 5th, `planPayout()` settles every unpaid row whose own window is due (which is how the 50,000 MMK minimum carries over), and `replayPayout()` is the §16D gate. Rows live in `src/lib/ownerLedgerStore.ts`; `20261127000100_owner_ledger.sql` carries the tables, RLS, the append-only trigger, `run_owner_payout()` and `verify_owner_payout()`, and is not applied. Refunds, manual adjustments, and the Main Owner/Branch Owner ledgers are still open |
| Shop Owner creation | **PREVIEW** | Local persistence, plaintext preview password |
| Admin Management | **PARTIAL** | Form offers the eight Plan §3 roles and creates a real local admin account with the chosen role. The table merges the seeded rows with the stored accounts (`src/lib/adminAccounts.ts`), so a created admin survives a reload. Each stored row now carries a role select backed by `changeAdminRole()`; the rules live in `src/lib/adminRoleChange.ts` (Super Admin only, no self-change, Super Admin row locked, unknown value and no-op refused) and a change writes a `role_change` audit row. Seeded rows are read-only because there is no stored record to rewrite. The rows themselves are still browser storage, not `public.profiles` |
| Blog Post Management | **PARTIAL** | Ordered blocks with text, photo (alt/caption/credit) and ad slots, reorder, publish checks, revisions and audit log; upload falls back locally. Localized through `useLanguage` |
| Travel Guide Management | **PARTIAL** | Editor and itinerary builder with listing-linked stops, publish checks, revisions, audit log, and per-post earning rows in their own `GuideEarningsPanel` section (Payment Admin sets the amount and settles, the author reads its own rows); content is still local state. Localized through `useLanguage` |
| Shop Owner dashboard | **PARTIAL** | Bilingual through `useLanguage` with a header language control; data is still local. The **Subscription** section (Plan §9, §4) shows the owner's own status — Active, Grace or Expired — with the days left or the grace remaining, the monthly fee, the period, the end date, the booking-blocked banner when expired and the renewal instruction; it reads only the row matching the signed-in owner (`subscriptionForOwner()`), so one owner never sees another shop's fee, and Super Admin's `?preview=1` falls back to the first owner row. The header bell now reads the §16B.3 feed, so a renewal reminder lands there. The **Payments** section is now a real earnings statement instead of a mock wallet card: it shows what the shop keeps after commission, what has been paid, the carry-over state against the 50,000 MMK minimum, the next two payout dates, and the sales and payout history, all through `statementFor()` scoped by `shopId` so an owner cannot read another shop's money (§16B.1 `O (own earnings)`) |
| Main Owner dashboard | **PARTIAL** | Bilingual through `useLanguage`; branch-account validation messages are translation keys |
| Audit log | **PARTIAL** | `src/lib/adminAudit.ts` + `AuditLogPanel` implement Plan §16B.2: one append-only row per decision (actor, actor role, action, object type, object id, summary, UTC time, source), searchable and filterable, Super Admin only per the §16B.1 settings row. Recorded now at every admin write that exists: admin-account creation, role change, shop-owner creation, guide-earning amount and settlement, blog and guide save/publish/delete, rental order status, payment, extras and currency rate. The labels live in `src/lib/adminAuditLabels.ts` and a test walks every action, object and source for MM and EN text. Admin-account creation, guide-earning amount and settlement also raise a §16B.3 notification in the admin bell (`src/lib/adminNotices.ts`); the store is browser storage until `admin_audit_logs` is wired |
| Role guards | **DONE** | Super Admin, Shop Owner, Main Owner protected. Plan §3 and §16B.1 now scope one admin workspace per role: `src/lib/adminWorkspace.ts` lists the sections each role may open, and the Super Admin page filters its navigation through it, so Ads Admin sees only Ads, Payment Admin only orders/reports/currency/guide earnings plus the read-only ad reports (§16A.9), Blog Post Admin only Blogs, and Travel Guide Content Admin only Guides and its own earnings. `src/lib/roleMapping.ts` maps every one of the eight `profiles.role` slugs to a product role, and `auth.tsx` hydrates `adminRole` from the profile row, which is what the workspace reads |

---

## 7. Backend and persistence

| Item | Status | Notes |
|---|---|---|
| Supabase project + migrations | **DONE** | Profiles, favorites, plans, bookings, notifications, reviews, ads, audit logs |
| RLS policies | **DONE** | Owner/admin policies with helper + indexes |
| Auth session hydration | **PARTIAL** | Works when env is configured |
| Email/password + OAuth calls | **PARTIAL** | Provider secrets and redirect URLs still needed |
| Favorites persistence | **PARTIAL** | Per-account scope + `public.favorites` write-through; anon access still local |
| Bookings / plan requests | **PREVIEW** | UI only, no insert |
| Notifications | **PARTIAL** | One feed with named recipients (§16B.3, 23 Nov 2026): `src/lib/notificationFeed.ts` states the event table, `canSee()` scopes a row to a role, an account, an author byline or `everyone`, and the bell, the traveler page and every writer use it. Read state per account, synced to `public.notifications`; `notification_feed` is committed but delivery is still in-browser |
| Exchange rate | **PARTIAL** | Plan §16B.5 rows are in place client-side: `src/lib/exchangeRates.ts` appends `{mmkPerUsd, effectiveFrom, setBy, note}` and the rate in force is the latest row that has taken effect, with the Plan's 4,500 as the fallback. Super Admin → Currency shows the history table and takes a note per change; every change writes an audit row. One formatter (`src/lib/moneyFormat.ts`) does USD 2 decimals and MMK to the nearest 100. Still browser storage, not `exchange_rates` |
| Rental order rules (§8.7) | **PREVIEW** | All fifteen checks mirrored in `src/lib/rentalOrderRules.ts`; the migration holds the authoritative copy |
| Translation fallback (§16B.4) | **PARTIAL** | `src/lib/translationCache.ts` holds the rules (a name, an address and a price are never translated; one row per text and direction; a reviewed row is never overwritten), `src/lib/translationApi.ts` calls the Worker named by `VITE_TRANSLATION_ENDPOINT`, `useLocalizedText()` + `AutoTranslatedMark` are the reader seam and marker, and `TranslationReviewPanel` is the Admin queue in the `translations` section, busiest first, with one audit row per approval. Blogs and Travel Guide read through `useLocalizedText()` and every other reader (city, category, place, restaurant, book shop, rental labels) through `localizedOrFallback()`, so no half-translated record renders blank; the rows are browser storage until `translation_cache` is applied and the Worker exists |
| Content lifecycle: unpublish, delete, restore, stale save (§10 §4, §7 acceptance 5–6) | **DONE** (client) | `src/lib/contentLifecycle.ts` returns a post or guide to Draft, soft-deletes it with `deletedAt`, restores it, and bumps `version` on every change; both Admin tables show Delete/Restore and Unpublish, mark a deleted row, and refuse a save whose loaded version has moved on, with an in-editor Reload. `contentReader` drops a deleted row and the seed it took over, and `publish_due_content` skips a deleted row. `20261124000100_content_lifecycle.sql` puts the same `version + 1` guard on the server. What is left is applying that migration and the shared revision/audit tables |
| Scheduled publishing (§10 §4, §16B.7) | **PARTIAL** | Myanmar Time in, UTC stored (`src/lib/scheduleRules.ts`); `publish_due_content` is `wired: true` and runs on the one-minute tick through `src/lib/scheduledPublishing.ts`, publishing due posts and guides with the actor `system`, one audit row, one feed row and a guide's first earning row. It is idempotent because a published row has left `Scheduled`. `blog_posts` and `travel_guides` are committed in `supabase/migrations/20261123000600_scheduled_publishing.sql` but not applied, so the job reads browser storage and only runs while the app is open |
| Media and storage (§16B.6) | **PARTIAL** | `src/lib/mediaRules.ts` states the five folders and their limits (`blog-posts/`, `guide-stops/`, `rentals/` 450 KB WebP; `ads/` 300 KB image or 3 MB / 15 s MP4; `shops/<shop-id>/` 450 KB within an Admin-set quota), refuses a path-like shop id, and answers with a translatable code. `src/lib/mediaApi.ts` compresses to WebP, halving the longest edge twice before it gives up, and both content editors name their folder. `media_objects` with `last_referenced_at`, `shop_media_count()`, `orphan_media_objects()` and `delete_media_object()` are committed. No deployed Worker yet, so an upload still falls back to a data URL. The nightly orphan job is wired (`wired: true`): `src/lib/mediaObjects.ts` stands in for `media_objects`, a content save touches the photos it keeps, and the 02:00 run removes what nothing referenced for 30 days |
| Owner and template subscriptions (§9, §4, §16B.7) | **PARTIAL** | `src/lib/ownerSubscriptions.ts` states the rules: `deriveStatus()` moves Active → grace → expired (an unreadable `periodEnd` counts as expired, so a broken row never grants free service), `daysUntilEnd()` counts Myanmar calendar days, `graceDaysLeft()` and `blocksBooking()` are what the panel reads, and `dueReminders()` sends at 7, 3 and 1 days once per period per threshold. `src/lib/subscriptionJobs.ts` runs `subscription_expiry` (hourly, one audit row per row that moved, actor `system`) and `renewal_reminders` (daily 09:00 Myanmar Time, one bilingual feed row addressed to the owner by byline), and both are `wired: true`, so every §16B.7 job now does real work. `'subscriptions'` is a new audit source with MM and EN labels. `supabase/migrations/20261126000100_shop_subscriptions.sql` carries the table, its two indexes and RLS (staff read all, an owner reads their own byline, Super Admin and Payment Admin insert). Rows are still browser storage. The §4 catalog, the owner's preview/apply selector, the rendered templates and the template analytics are built (24 November 2026): `/shops/:shopId` serves nine lazy templates over one `ShopPageData` fixture, `src/lib/templateStats.ts` counts one view per template per page view and one apply per real switch (a preview is never counted), the Super Admin catalog panel reads the roll-up, `template_events_purge` runs daily, and `scripts/a11y-audit.mjs` is the rendered gate — 72 combinations, clean |

`localStorage` now backs 37 stored keys across 22 files — the count moved with
the ads, media, subscription and translation stores. Every one of them is a
production replacement target, listed in `REMAINING-WORK.md`. The Favorites
and notification-read keys are account-scoped (`mh-travel:<base>:<userId>`),
so they no longer leak between accounts on a shared browser.

---

## 8. Code hygiene

| Check | Result |
|---|---|
| `TODO` / `FIXME` / `HACK` markers | 0 |
| `console.log` in source | 0 |
| Images without `alt` | **0** of 242 rendered images |
| Interactive elements without an accessible name | **0** of 1120 |
| Duplicate `<h1>` per page | 0 |
| Duplicate or missing `<main>` landmark | 0 |
| axe-core violations, all rules except contrast | **0** across 23 routes |
| axe-core `color-contrast` | **64 nodes** on 17 routes; `/foreign-tourist` adds 0 in either theme |
| Shop Page templates (axe + overflow + `h1`), 72 combinations | **0** — `npm run a11y` (24 Nov 2026) |

Measured with axe-core in headless Chromium on 20 November 2026, at 1440px,
against 23 routes (every declared page plus the three dashboards). The
`/foreign-tourist` page added on 22 November was re-checked the same way in
dark and light, in both languages, and reports no violations; it uses the new
`text-link` token rather than `brand-blue` for small accent text, which is what
the light theme needed. The earlier "139 buttons without `aria-label`" figure
counted the attribute, not the accessible name — a button with visible text
needs no `aria-label`, so that number overstated the problem. Counting accessible names instead, six sponsored
ad links and the notification bell were the only real gaps; all are fixed.

The 64 contrast failures are a palette decision, not 64 bugs. Two pairs account
for 55 of them: white on `brand-blue` `#4d8dff` (3.2:1, 38 nodes) and
`brand-red` `#c0392b` as text on the dark card (3.3:1, 17 nodes). Both pass as
large or bold display type and fail at 9–12px. The remaining nine sit on the
admin dashboards, which use their own navy/cyan surfaces. Fixing the two main
pairs means darkening the blue to about `#356fe0` and using a lighter red for
text, which changes the brand palette, so it is left as a deliberate decision
rather than slipped in with a documentation pass.

The template pass of 28 November 2026 did not wait for that decision: a Shop Page
is a shop's own storefront, so it uses the `text-link`, `ratingText` and
`brand-navy` tokens instead of `brand-blue` on a light surface, and it is clean
in both themes. The rest of the palette question above is unchanged — the 64
nodes still sit on traveler and admin surfaces, and they still need the two
brand values decided.

---

## 9. What the Plan says vs what the code does

Two places where the doc and the tree disagreed, now reconciled:

1. **Card sizes.** The Plan table and `CARD_SIZES` match after the revert.
   Earlier rewrites (fixed-box, 3:2 scale) were reverted in `5f3924b` and
   preserved on branch `backup/cards-3to2-35fcc5e`.
2. **Load More.** The Plan now states the rule (§4) and the code follows it.
   Both pages share `src/lib/usePagedList.ts`:

   | Page | Page size | Columns | Helper |
   |---|---|---|---|
   | Blogs | 12 | 1 / 2 / 3 / 4 | `usePagedList` |
   | Travel Guide | 12 | 1 / 2 / 3 / 4 | `usePagedList` |

   Twelve divides evenly into two, three, four and six columns, so a revealed
   batch always fills its rows; the last batch is clamped to what exists so
   nothing is hidden, and the button disappears once everything is shown.
   Unit-tested in `usePagedList.test.ts`.

   The earlier row-reading version (`useGridColumnCount` + `alignToRow`) is
   gone: it needed a live measurement to page correctly, which the fixed page
   size removes.

---

## 10. Suggested next order

Steps 1 and 2 are now done, so the list starts where the frontend stops:

1. Decide the two brand-palette contrast values, then re-run axe to zero.
2. ~~Localize Shop Owner and Main Owner.~~ **Done 22 November 2026.**
3. ~~Localize the remaining Super Admin body copy.~~ **Done 22 November 2026.**
   ~~Localize the Blog and Travel Guide editor panels.~~ **Done.** Frontend
   localization is complete; the remaining gap is the backend.
4. ~~Wire Favorites, Notifications, and Reviews to the tables that already
   exist.~~ **Done 22 November 2026.** Favorites and notification read-state
   are per-account and write through to `public.favorites` and
   `public.notifications`; the platform reviews section reads
   `public.reviews`. Feed rows and the seeded review copy still come from
   local data, so the remaining work there is Admin authoring, not plumbing.
5. ~~Turn the rental catalog into data with a Rental Admin panel.~~ **Done 22
   November 2026.** Types, per-type rules, city × type availability, branches,
   local and foreign rates and terms live in `src/data/rentalCatalog.ts` and are
   edited from the Super Admin **Rentals** view. Pricing is one function shared
   by the estimate panel and the request. Moving the record from browser storage
   to catalog tables is the remaining step.

   **Rental order lifecycle (Plan §8.3–§8.7), 22 November 2026.** `src/lib/rentalOrders.ts`
   holds the order record, the status machine (`requested → accepted → paid →
   completed`, plus `expired` and `cancelled`), the 12-hour payment window, the
   one reschedule after payment and the voucher version. The traveler submits from
   `/rentals` and prints the voucher at `/account/bookings/<request_code>`;
   Rental Admin → Orders accepts, records payment, completes, expires and cancels.
   `supabase/migrations/` carries the five migrations that make the server the
   authority (`submit_rental_order`, `set_rental_order_status`,
   `reschedule_rental_order`, `expire_overdue_rental_orders`); they are not
   applied yet, so the browser record is still authoritative.

   **§8.7 rules mirrored, 23 November 2026.** `src/lib/rentalOrderRules.ts`
   repeats all fifteen `submit_rental_order` checks in the server's order
   (category, city availability, variant, branch, Myanmar Time start, end,
   minimum days, name, phone, address, participants, terms version, hourly
   limit, rate present) and returns one `rental_error_*` code each; the page
   renders it in MM and EN. `quoteRentalOrder()` is the only quote, so the
   estimate panel and the stored total cannot disagree, and `buildRentalOrder()`
   ignores the client total entirely (§8.12 acceptance 2–4).

   **§8.12 acceptance 1, 5, 9 and 10, 23 November 2026.** Submitting is spent
   once the code is shown, so one click makes one order. `orderForViewer()` and
   `canReadAllOrders()` scope the voucher to the viewer: staff (Rental Admin,
   Admin, Payment Admin, Super Admin) read every order, a traveller reads their
   own, a signed-out visitor reads none. `myanmarDayStartMs()` counts the
   reschedule notice from Yangon midnight, and `rentalRequestCode()` stamps the
   Myanmar day. The dictionary moved to `src/lib/translations.ts` and holds all
   23 `rental_error_*` codes in MM and EN; `translate()` returns `undefined` for
   a code this build does not know, so a newer server code reads as missing
   instead of crashing, and the test reads the codes out of the migrations.

   **§3 role slugs and the §16B.1 workspace.** `profiles.role` stores a slug,
   but the rental migrations compared product names, so no staff account ever
   passed `is_rental_staff()` and every rental write failed as forbidden.
   `supabase/migrations/20261122000400_rental_role_slugs.sql` normalises the
   slug once in `current_role_name()`, so the rest of the schema keeps comparing
   product names, and adds `can_handle_rental_orders()` for writes, so a Payment
   Admin records a payment and changes nothing else. On the client,
   `src/lib/roleMapping.ts` maps all nine slugs to a product role, `auth.tsx`
   hydrates `adminRole` from the profile row, and `src/lib/adminWorkspace.ts`
   turns the §16B.1 matrix into the sections each role may open. The Super Admin
   page filters its navigation through it, and the order panel offers only the
   actions the role may take.

6. ~~Connect the Custom Plan, Rental, and Ticketing submissions to request
   records with an ID and a confirmation.~~ **Done 22 November 2026.** Each
   submission now writes a request record with a reference such as
   `MHR-20261122-001`, shows it on the confirmation screen, and lists it under
   the account's Bookings or Travel Plans. The record is account-scoped browser
   storage with a best-effort `public.bookings` insert; reading requests back
   from the table is still open.
7. ~~Build the owner money path: commission snapshot and twice-monthly
   payouts.~~ **Done 27 November 2026.** `src/lib/ownerLedger.ts` freezes the
   commission on each ledger row, `planPayout()` settles every unpaid row whose
   own window is due so the 50,000 MMK minimum carries over without a special
   case, `replayPayout()` is the §16D Phase 3 gate, and both the Super Admin
   `payouts` section and the owner's Payments statement read it. The migration
   is committed and not applied, so the browser store is still authoritative.
   What is left in this area: apply `20261127000100_owner_ledger.sql`, add
   refunds and manual adjustments as their own row kinds, and build the Main
   Owner consolidated and Branch Owner ledgers once the operator hierarchy
   exists.
8. Replace seeded catalog data with city-scoped Supabase queries.

Steps 1, 3, 4, 5 and 7 are frontend work with no new infrastructure. Step 8
needs the backend push.
