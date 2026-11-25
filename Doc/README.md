# MH Travel Documentation

This folder stores project documentation and implementation records.

## Files

- [`STATUS.md`](./STATUS.md) — one-page status: what is done, what is partial,
  what is not started, with the audit date and commit it was verified against.
  **Start here.**
- [`COMPLETED-WORK.md`](./COMPLETED-WORK.md) — detail behind the finished work.
- [`REMAINING-WORK.md`](./REMAINING-WORK.md) — detail behind the open work,
  grouped by layer (auth, data, media, dashboards, UI/UX).
- [`PLAN-VS-CODE.md`](./PLAN-VS-CODE.md) — the Plan checked against the code:
  confirmed claims, stale claims, and internal contradictions. Agents also write
  their "Questions for the Plan" here.
- [`TICKETS.md`](./TICKETS.md) — every build ticket from Plan section 16F.2, its
  owner, status and the commit or migration that finished it.
- [`HISTORY.md`](./HISTORY.md) — read-only archive of the dated implementation
  records that used to sit in the Plan. Nothing in it is a requirement.
- [`BLOG-IMAGE-SOURCES.md`](./BLOG-IMAGE-SOURCES.md) — licensing and sources for
  the blog images.

The consolidated product plan is maintained in
[`../Plan/PROJECT-PLAN.md`](../Plan/PROJECT-PLAN.md).

## Status marks

| Mark | Meaning |
|---|---|
| **DONE** | Implemented and verified in the audit. |
| **PARTIAL** | Implemented with a known gap. |
| **PREVIEW** | Works on local/seed data, no backend. |
| **NOT DONE** | Planned, missing, or broken. |

`PREVIEW` is expected: the project is frontend-first, so most traveler features
are intentionally preview-quality until backend wiring lands.

## Delivery checks

Run all four before calling work finished:

```
npm run typecheck
npm test
npm run lint
npm run build
```

`npm test` is the guard that keeps the docs from going stale on the one point
that is easy to get wrong: every seed link must resolve to a declared route, and
`public/manus-routes.json` must list exactly those routes. Adding a page or a
link without updating `src/routes.ts` fails the suite.

## Repository map

Each kind of file has one home (Plan section 16I). A guard test enforces it.

| Folder | Holds |
|---|---|
| `Plan/` | One file, `PROJECT-PLAN.md`. Only Claude edits it |
| `Doc/` | Exactly the files listed above, plus this README |
| `SQL/` | Only `.sql` files named `<YYYYMMDDHHMMSS>_<slug>.sql`, applied in name order, forward-only |
| `Worker/` | One Worker file, `index.ts` (until it exists, only `.gitkeep`) |
| `src/`, `public/` | The app |

Not allowed: a `supabase/`, `docs/`, `workers/` or `migrations/` folder, a second plan file, `.sql` outside `SQL/`, or documents outside `Doc/`.

Who writes what: Claude writes the Plan, OpenHands writes the app code and its tests, Manus AI does Supabase and Cloudflare (Plan section 16F). Whoever finishes a ticket updates `COMPLETED-WORK.md` (what was built and how), `REMAINING-WORK.md`, `STATUS.md` and `TICKETS.md`.
