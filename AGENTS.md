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
- **Every UI string goes through `t()`** in `src/lib/i18n.tsx`, and both `mm` and `en` must
  be filled. `TranslationKey` is derived from the dictionary, so a typo is a type error.
- **`CardListing` requires rating, distance, favourite, and views** (`src/types/index.ts`).
  Cards show all four; there are exactly five card sizes.

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

## Verification habit

Before calling a UI change done: typecheck, test, build, then load the route in headless
Chromium at 360/768/1440 px, check `document.scrollWidth <= innerWidth`, and run axe in
both themes and both languages.
