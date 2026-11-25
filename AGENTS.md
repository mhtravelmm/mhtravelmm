# AGENTS.md — MH Travel Myanmar

Vite + React 18 + TypeScript + Tailwind + React Router 6 + Supabase. Frontend-first:
most traveler features run on seeded data (`src/data/*`) until the backend wiring lands.

## Commands

- `npm run typecheck` — must be 0 errors.
- `npm test` — vitest; guards seed links, the route manifest, and the domain rules.
- `npm run lint` — 0 errors; 7 warnings are pre-existing.
- `npm run build` — Vite production build.
- Dev server on `http://localhost:5173`. Browser checks use `puppeteer-core` with
  `/usr/bin/chromium`; axe-core is available in `node_modules` for a11y passes.

## Standing permission

The agent has **full, standing permission to write code** in this repository. Do not
stop to ask before implementing the Plan, adding tests, adding the dependencies the
work needs, refactoring, editing docs, or committing and pushing to `main`.

- Write, refactor, and delete application code, tests, migrations, and config.
- Add dev or runtime dependencies the work genuinely needs.
- Update `Plan/` and `Doc/` so they match the code you shipped.
- Commit and push to `main` when the work is verified (typecheck, tests, lint, build).
- Add the migration a Plan item needs, even though it is applied later.

The only things to confirm first are the decisions the Plan reserves for the founder:
the brand-palette contrast values (`Doc/STATUS.md` §8) and the commercial terms in
`Plan/PROJECT-PLAN.md` §16E. Everything else is yours to decide and ship.

The Plan under `Plan/` is refreshed roughly every five hours, so a later item may not
have arrived yet. Re-read it at the start of a session; when nothing new has landed,
keep working the items that are already open rather than waiting. Never treat a doc
claim as true without checking the code.

## Rules that tests enforce

- **Every seed `href` must resolve, at both levels.** `src/data/links.test.ts` walks the
  data modules and fails on an unknown path — add the route to `src/routes.ts`
  (`STATIC_PATHS` / `PARAM_PATHS`) *and* to `App.tsx`, or the test fails. A declared
  route is not enough: the `:id` must also name a record. Every detail page reads
  `resolveDetailRecord(slug, id)` from `src/lib/detailRoutes.ts` and renders
  `RecordNotFound` when it returns nothing — never `?? LISTINGS[0]`, which shows one
  record under another one's URL. A new detail slug goes into that resolver, and
  `links.test.ts` walks every seed detail href through `resolveDetailHref()`.
- **A card grid computes its cap; it never hand-writes one.** `src/lib/cardGrid.ts`
  holds the Plan §4 formula (`cardGridMaxWidth` = `columns × max width + gaps`) and
  the pixel table, and `cardGridStyle()` returns the inline style Tailwind cannot
  build from a runtime class name. `src/lib/cardGrid.test.ts` fails if a page
  hand-writes a five-column cap or if the table drifts from `CARD_SIZES`.
- **A page is tested by rendering it.** Name the file `*.dom.test.tsx` and mount it
  through `renderAt(path, ui)` from `src/test/renderWithProviders.tsx`, which supplies
  the real `LanguageProvider` → `AuthProvider` → `CurrencyProvider` → `FavoritesProvider`
  stack over a `MemoryRouter`. Do not mock those providers: a page that passes against a
  mock can still break in the app. Only `*.dom.test.tsx` gets jsdom, so keep node-only
  logic in the plain `*.test.ts` files. Break the code once and watch the new test fail
  before committing it — a test that cannot fail guards nothing.
- **`public/manus-routes.json` must match `allPaths()`.** Insert the new entry in place;
  do not re-sort the file.
- **Every UI string goes through `t()`**, and both `mm` and `en` must be filled. The
  dictionary lives in `src/lib/translations.ts`; `src/lib/i18n.tsx` is only the provider.
  `TranslationKey` is derived from the dictionary, so a typo is a type error.
- **Every `rental_error_*` the SQL functions raise needs MM and EN.** `translate()` takes a
  plain string so a code newer than this build reads as missing, and
  `src/lib/rentalErrorMessages.test.ts` reads the codes out of `SQL/` and
  fails on any without both texts.
- **`CardListing` requires rating, distance, favourite, and views** (`src/types/index.ts`).
  Cards show all four; there are exactly five card sizes.
- **Rental types, rules, rates, and availability are data.** `src/data/rentalCatalog.ts` is
  the only record; `/rentals` reads it and Super Admin → Rentals edits it through
  `src/lib/rentalCatalogStore.ts`. Do not add a rental type as page code, and price with
  `estimateRental()` so the estimate panel and the submitted amount cannot disagree.
  `rentalCatalogProblems()` must stay empty for a save to be allowed.
- **Every admin write records an audit row.** `useAuditRecorder()` in
  `src/lib/adminAudit.ts` fills actor and role from `useAuth()`. The label maps for
  the reader live in `src/lib/adminAuditLabels.ts`; `adminAuditLabels.test.ts` fails
  if a new action, object type or source has no MM and EN text.
- **A role change goes through `planRoleChange()`** in `src/lib/adminRoleChange.ts`,
  never through a bare setter. It refuses a non-Super Admin, a self-change, the
  Super Admin row, an unknown role value and a no-op — the last two because an empty
  select once wrote an audit row ending in an arrow with nothing after it.
- **Money is formatted by `src/lib/moneyFormat.ts` only**: USD 2 decimals, MMK to
  the nearest 100 (decision 33). Do not round MMK inline in a component.
- **Exchange rates are append-only rows** (`src/lib/exchangeRates.ts`): the rate in
  force is the latest row whose `effectiveFrom` has passed, 4,500 is the fallback.
  Never overwrite a rate; append one.
- **Notifications are one feed with named recipients.** `src/lib/notificationFeed.ts`
  holds the §16B.3 event table (`FEED_EVENTS`); a row names a role, an account, an
  author or `everyone`, and each reader filters with `canSee()` / `feedFor()`. Never
  broadcast an admin event to every bell — an event with no recipient writes nothing
  on purpose. `pushAdminNotice` stays for the bell; `pushFeedNotice` writes both.
  Rows expire after 90 days (`pruneFeed`). A row's `title` and `message` hold both
  languages — write `translatePair()`/`fillPair()`, never an English-only string,
  because a traveler reads the row later, in whatever language they have picked by
  then. Readers go through `localizedOrFallback()`, and an age comes from
  `src/lib/timeAgo.ts` (`timeAgoLabel`, `ageBucket`) rather than being stored.
- **Scheduled jobs are data, not timers.** `src/lib/jobs.ts` holds the §16B.7
  registry (cadence + `wired` flag) and the runner; `src/lib/platformJobs.ts` binds the
  handlers and `src/App.tsx` ticks once a minute. A job must be safe to run twice —
  `dueJobs()` compares each job with its own last run in `job_runs`, and a handler that
  throws becomes a `failed` row plus a Super Admin bell notice, never a stopped tick.
  Mark a job `wired: true` only when its handler does real work.
- **Subscription lifecycle rules live in `src/lib/ownerSubscriptions.ts`.** One
  record covers an Owner account fee (§9) and a paid template entitlement (§4);
  `kind` says which. `deriveStatus()` is the only status decision — a stored
  `status` is what the job last wrote, so a reader always re-derives it, and an
  unreadable `periodEnd` counts as expired so a broken row cannot grant free
  service. Days come from `daysUntilEnd()` on the Myanmar calendar, never from
  hour arithmetic. A reminder is keyed `id:periodEnd:daysLeft` in `remindedKeys`,
  which is what makes a second daily run silent and what a renewal resets. An
  owner reads only their own row through `subscriptionForOwner()` — never
  `subscriptions[0]`, because that shows one owner another shop's fee. The rows
  live in `ownerSubscriptionStore.ts` (the `shop_subscriptions` stand-in), and
  `subscriptionJobs.ts` holds both handlers so the panels stay free of job code.
- **Owner money lives in `src/lib/ownerLedger.ts`.** The commission rate is
  frozen on each ledger row (`createSaleRow()`), so changing a shop's setting
  never rewrites a past payment, and a repeated `bookingRef` is refused — a
  payment recorded twice must not pay an owner twice. `payoutWindowFor()` is the
  only window arithmetic (day 1–15 due on the 20th, 16–month end due on the 5th
  of the next month); do not compute a due day anywhere else.
  `planPayout()` settles every unpaid row whose own window is due, which is how
  the 50,000 MMK minimum carries over without a special case, and
  `createPayoutRun()` returns null rather than paying short. A run stores the
  row ids and the totals it settled them at, so `replayPayout()` is the §16D
  Phase 3 gate: if a replay disagrees with the run, the ledger moved after the
  money left. The rows live in `ownerLedgerStore.ts` (the
  `owner_commission_settings` / `owner_ledger_rows` / `owner_payout_runs`
  stand-in); never let a panel compute a statement itself — go through
  `statementFor()`, which is scoped by `shopId` so an owner cannot read another
  shop's money. Running a payout and setting a commission are both
  Super Admin / Payment Admin only (§16B.1); Admin has `–`.
- **Blog and Guide content has one store and one reader projection.**
  `src/lib/contentStore.ts` holds the admin rows (`useBlogPosts`, `useGuides`,
  `useRevisions`, `useContentAudit`); the panels write it, never `useState`.
  `src/lib/contentReader.ts` turns a `Published` row into the card shape the
  pages render (`publishedBlogPosts`, `publishedGuides`) — readers never read the
  admin store directly, so a Draft or Scheduled row cannot leak. A seed the
  editor takes over keeps its slug, rating and distance.
- **Blog text that a reader sees in both languages is stored twice.** A post
  holds `authorEn`/`authorMm` and `locationEn`/`locationMm`; an image block holds
  `captionEn`/`captionMm`. Never add a single-string field for text the reader
  localizes — the fallback for an empty side belongs in the reader
  (`contentReader.ts`), not in the editor. There is no `galleryUrls`: an extra
  photo is an image block, so it keeps its place in the story and its alt text.
  `normalizePost` migrates a row saved in the single-language era; do not add a
  database migration for data that only exists in browser storage.
- **A schedule is Myanmar Time in, UTC stored.** `src/lib/scheduleRules.ts` is
  the only converter (`myanmarWallClockToUtc`, `utcToMyanmarWallClock`,
  `isDue`). `scheduledFor` carries the instant and `publishedAt` is set only once
  the item is live, so a scheduled row never shows a publish date it does not
  have. `publish_due_content` (`scheduledPublishing.ts`) must stay idempotent: a
  published row has left `Scheduled`, and that is what stops a second publish.
- **Rental order rules live in `src/lib/rentalOrderRules.ts`**, one function per
  §8.7 check in the order `submit_rental_order` runs them, returning a stable
  `rental_error_*` code. `quoteRentalOrder()` is the only quote; `buildRentalOrder()`
  in `src/lib/rentalOrders.ts` stores its numbers and ignores the client total.
  Days come from `src/lib/myanmarTime.ts` (UTC+6:30), never `new Date()` slicing.

- **A card draws a rating and a distance only when it has one.**
  `src/lib/cardMeta.ts` is the single rule (`hasRating`, `hasDistance`) plus the
  two formatters; `ListingCard` and every page-level card that writes its own
  meta row read it from there. Zero means "not rated" and "unknown distance", so
  it is never printed as `0.0` or `0 km`. Views and the favourite button are
  unconditional. Format numbers with `Intl` and the `my-MM` locale, never a
  hand-written digit map.

- **`seoTags` is `string[]`, not a comma-separated string.** `src/lib/tagList.ts`
  is the only place a stored value becomes a list; it also accepts the old
  string form so rows written before the change still load. When you add a field
  to the Blog editor, carry it in `openPost` as well as in `emptyForm` — the
  form is built from `emptyForm`, so a field left out there is silently blanked
  on save.

- **Autosave rule lives in `src/lib/draftAutosave.ts`, not in the panel.** It
  writes the draft row only — no revision, no audit row — and only while the
  post is a `Draft`; publishing always goes through the explicit Save so the
  publish checks run. Read the form through a ref in the timer: putting `form`
  in the effect's dependency list restarts the timer on every keystroke and the
  write never comes due.

## Conventions

- One feature per folder under `src/features/<name>/`; page-level components end in `Page`.
- Bilingual copy in data modules uses `{ mm, en }` and is resolved with the local
  `localized()` helper rather than duplicated markup.
- `brand-blue` (#4d8dff) fails contrast as small text on light surfaces. Use the
  `text-link` token for link/accent text; it resolves to `brand-blue` in dark and a
  darker blue in `.light`.
- Full footer is Home-only; other routes render `PageCopyright`. Dashboards use
  `DashboardCopyright`.
- Docs live in `Doc/`: `STATUS.md` is the single status view, `COMPLETED-WORK.md` and
  `REMAINING-WORK.md` hold the detail, `PLAN-VS-CODE.md` records Plan drift, `TICKETS.md`
  tracks the build tickets. The authoritative product plan is `Plan/PROJECT-PLAN.md`; it is
  changed only by Claude. When a section ships, record it in `Doc/` (what was built and how
  in `COMPLETED-WORK.md`; the ticket in `TICKETS.md`). When the code must differ from the Plan,
  or the Plan is unclear, write it under "Questions for the Plan" in `Doc/PLAN-VS-CODE.md` and
  keep building to the Plan.
- Roles have two spellings: `profiles.role` stores a slug (`rental_admin`), the UI
  and RLS speak the product name (`Rental Admin`). Resolve both through
  `roleMapping.ts`; never compare a raw profile value to a product name. The admin
  workspace reads `adminRole` (from the profile) through `adminWorkspace.ts`, which
  is the Plan §16B.1 matrix — add a section there before adding it to the nav.
- Guide earnings are their own section (`GuideEarningsPanel`), not part of the
  Guides editor, because §16B.1 gives the write to Payment Admin. The rows live
  in `guideEarningsStore.ts` so a second role can see them; publishing a guide
  adds a row through `addEarningForGuide()`.
- Post and guide lifecycle rules live in `contentLifecycle.ts`, not in the
  panels: unpublish, soft delete, restore and `isStaleSave`. Every one of them
  bumps `version`, so a panel that changes a row must bump it too, and the
  reader drops both the deleted row and the seed it took over — otherwise a
  withdrawn seeded story stays live. `publish_due_content` skips a deleted row;
  the server-side twin is the `version + 1` trigger in
  `20261124000100_content_lifecycle.sql`.
- The Admin Management table never holds rows in `useState`. It reads
  `mergeAdminRows(seeded, adminAccounts)` from `adminAccounts.ts`, where
  `adminAccounts` comes from `useAuth()`, so a created admin survives a reload.
- Every admin write appends one row through `recordAdminAudit()` from
  `adminAudit.ts` (actor, actor role, action, object type, object id, summary,
  UTC time, source) and raises the matching bell notice through
  `pushAdminNotice()` from `adminNotices.ts`. Both calls go at the write site,
  not in the panel, and the `audit` section goes into `adminWorkspace.ts` before
  the nav is touched. The log is read in `AuditLogPanel`.
- Bilingual copy that exists in one language only goes through
  `useLocalizedText()` (`useLocalizedText.ts`), never `text[language]` directly.
  It resolves the cached translation from `translationCache.ts`, asks the Worker
  through `translationApi.ts` when nothing is stored, and reports
  `autoTranslated` so the reader renders `AutoTranslatedMark`. Names, addresses
  and prices are never translated (`isTranslatable`), and a reviewed row
  (`approved` or `edited`) is what removes the marker. The Admin queue is
  `TranslationReviewPanel` under the `translations` workspace section.
- A grid or a card reads through `localizedOrFallback()` instead: it returns the
  reader's language, else the language the text was written in, and never asks
  the Worker or shows the marker. Use it where the text is a name, an address, a
  price or a card face — twelve cards must not fire twelve requests — and keep
  `useLocalizedText()` for the single-item reader (a blog story, a guide) where
  the marker belongs. Never index `text[language]` directly; a half-written
  record then renders blank instead of showing the language it was written in.
- A filter key stays English (`category.en`) while the chip shows the reader's
  language. Filtering on the translated label drops the selection the moment the
  reader switches language, and the list looks empty for no reason.
- Ads rules live in `src/lib/adCampaigns.ts`, not in `AdsManagementPanel.tsx`:
  `canServe`, `campaignServesPlacement`, `pickCampaign` and `serveAd` are the
  §16A.5 serving order, `filterCampaigns` is the campaign filter, and
  `campaignProblem`/`creativeProblem` are the save checks. Pass the Settings
  `{ blockedDomains, limits }` to both problem functions, or the §16A.8 rules
  silently stop applying. A placement that cannot serve must return `null` so
  `AdSlot` collapses instead of rendering an empty box. `canReadAdReports()` is
  separate from `canManageAds()` — Payment Admin reads the reports and edits
  nothing — and `adStore.ts` is the browser stand-in for the §16A.4 tables, so
  keep its row shapes equal to `20261125000100_ads.sql`.
- An ad link never points at the advertiser URL. `clickThroughHref()` in
  `adClicks.ts` builds `/ad/click/<creativeId>?p=<placement>&s=<session>`,
  `AdClickRedirect` records the click and then replaces the history entry with
  the resolved target, so a copied link still counts once and the back button
  does not re-fire it. Add a slot with `<AdSlot placement="...">` and use a key
  `adPlacements.ts` already declares — `adPlacementWiring.test.ts` reads the
  pages and fails on a key the catalog does not know, because an unknown key
  serves nothing and the slot silently collapses. The same test also fails when a
  seeded creative points at an image that is not under `public/`, so repoint a
  seed at a shipped file instead of adding a placeholder path.
- `AdSlot` does not call the store directly. It calls `serveAdFor(placement,
  language)` in `adServingApi.ts`, which asks `serve_ad(p_placement_key,
  p_language)` when Supabase is configured, falls back to `serveAdNow()` when the
  RPC cannot answer, and caches both answers for 60 seconds per placement and
  language (§16A.5). A collapsed slot is cached too, so an empty placement is not
  re-asked on every render.
- Impressions and clicks leave the browser through `recordAdEventWithBeacon()`
  in `adBeacon.ts`: the store writes the event first, then `navigator.sendBeacon`
  posts it to `VITE_AD_EVENT_ENDPOINT`, with `fetch(..., { keepalive: true })` as
  the fallback. The payload is placement, campaign, creative, kind and session
  hash only — never a reader identity — because a beacon cannot carry an
  `Authorization` header. `AdClickRedirect` additionally calls
  `recordAdClickRemotely()`, which returns the redirect target from
  `record_ad_click()` so a URL edited in the Adsboard wins over the local copy.
- Every upload goes through `checkMedia()` in `mediaRules.ts` before the file is
  read, and the folder is named by the caller: `uploadContentImage(file,
  'blog-posts')` or `'guide-stops'`. Never hard-code a byte limit at the call
  site — the folder table is the only place a limit lives, and
  `mediaRules.test.ts` compares it against the SQL check. An image is checked
  twice: `stage: 'original'` allows up to 12 MB because it is compressed next,
  and `stage: 'final'` holds the compressed result to the folder ceiling, so do
  not "simplify" that into one pass or a 5 MB photo is refused before it is
  shrunk. The success message reads `cw_upload_target_r2` with `{folder}`.

## Repository layout (Plan section 16I)

- `Plan/` holds one file, `PROJECT-PLAN.md`. `Doc/` holds only the files listed in
  `Doc/README.md`. `SQL/` holds only `.sql` files named `<YYYYMMDDHHMMSS>_<slug>.sql`,
  forward-only. `Worker/` holds one file, `index.ts` (only `.gitkeep` until it exists).
- Never create `supabase/`, `docs/`, `workers/` or `migrations/` folders, a second plan, or
  `.md` / `.sql` files elsewhere. `src/repoLayout.test.ts` (ticket O-05) fails on any of these.
- Roles: OpenHands writes `src/` and its tests; Manus AI applies `SQL/` and owns Supabase and
  Cloudflare; Claude writes the Plan. The contracts you code against are Plan section 16G.

## Pushing to origin

`~/.gitconfig` pins `credential.helper = !/usr/bin/gh auth git-credential`, and the
`gh` token has no `Contents: write` scope, so a plain `git push` fails with 403
"Permission to mhtravelmm/mhtravelmm.git denied to mhtravelmm". Push with a
one-off `GIT_ASKPASS` script that answers with `$GH_PUSH_TOKEN` (the push-capable
token in the environment; `$GITHUB_TOKEN` still 403s) and both credential helpers
cleared, then delete the script. Never write the token into the remote URL or
`~/.gitconfig`:

```
cat > /tmp/askpass.sh <<'EOF'
#!/bin/sh
case "$1" in Username*) printf '%s\n' x-access-token ;; *) printf '%s\n' "$GH_PUSH_TOKEN" ;; esac
EOF
chmod 700 /tmp/askpass.sh
GIT_ASKPASS=/tmp/askpass.sh GIT_TERMINAL_PROMPT=0 \
  git -c credential.helper= -c 'credential.https://github.com.helper=' \
  push origin main
rm -f /tmp/askpass.sh
```

`GH_PUSH_TOKEN` is not always injected. Check `[ -n "$GH_PUSH_TOKEN" ]` first: when
it is empty, `GITHUB_TOKEN`, `OH_GIT_CREDENTIAL_ACCESS_TOKEN_GITHUB`, and the
credential-helper token all report `push: true` on the repo but still 403 on
`git push` and on `POST /git/refs`. In that case commit locally and tell the user
the push needs a push-capable token; do not retry the same credential in a loop.

## Verification habit

Before calling a UI change done: typecheck, test, build, then load the route in headless
Chromium at 360/768/1440 px, check `document.scrollWidth <= innerWidth`, and run axe in
both themes and both languages.

`npm run a11y` does that for the Shop Page: `scripts/a11y-audit.mjs` covers every
template, four widths and both themes, and fails on a violation, horizontal
overflow, a page without exactly one `h1`, or a run where the theme did not
apply. Point `--paths` at other routes when the change is elsewhere. The theme
must be seeded with `page.evaluateOnNewDocument` before `goto`: the provider
reads storage once on mount, so setting it after load leaves the previous
theme in place and the audit silently measures the wrong one.
