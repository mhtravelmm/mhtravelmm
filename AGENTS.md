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

## Rules that tests enforce

- **Every seed `href` must resolve.** `src/data/links.test.ts` walks the data modules and
  fails on an unknown path. Add the route to `src/routes.ts` (`STATIC_PATHS` / `PARAM_PATHS`)
  *and* to `App.tsx`, or the test fails.
- **`public/manus-routes.json` must match `allPaths()`.** Insert the new entry in place;
  do not re-sort the file.
- **Every UI string goes through `t()`**, and both `mm` and `en` must be filled. The
  dictionary lives in `src/lib/translations.ts`; `src/lib/i18n.tsx` is only the provider.
  `TranslationKey` is derived from the dictionary, so a typo is a type error.
- **Every `rental_error_*` the SQL functions raise needs MM and EN.** `translate()` takes a
  plain string so a code newer than this build reads as missing, and
  `src/lib/rentalErrorMessages.test.ts` reads the codes out of `supabase/migrations` and
  fails on any without both texts.
- **`CardListing` requires rating, distance, favourite, and views** (`src/types/index.ts`).
  Cards show all four; there are exactly five card sizes.
- **Rental types, rules, rates, and availability are data.** `src/data/rentalCatalog.ts` is
  the only record; `/rentals` reads it and Super Admin → Rentals edits it through
  `src/lib/rentalCatalogStore.ts`. Do not add a rental type as page code, and price with
  `estimateRental()` so the estimate panel and the submitted amount cannot disagree.
  `rentalCatalogProblems()` must stay empty for a save to be allowed.
- **Rental order rules live in `src/lib/rentalOrderRules.ts`**, one function per
  §8.7 check in the order `submit_rental_order` runs them, returning a stable
  `rental_error_*` code. `quoteRentalOrder()` is the only quote; `buildRentalOrder()`
  in `src/lib/rentalOrders.ts` stores its numbers and ignores the client total.
  Days come from `src/lib/myanmarTime.ts` (UTC+6:30), never `new Date()` slicing.

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
  `REMAINING-WORK.md` hold the detail, `PLAN-VS-CODE.md` records Plan drift. The
  authoritative product plan is `Plan/PROJECT-PLAN.md` — update it when a section ships.

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
