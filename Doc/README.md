# MH Travel Documentation

This folder stores project documentation and implementation records.

## Files

- [`STATUS.md`](./STATUS.md) — one-page status: what is done, what is partial,
  what is not started, with the audit date and commit it was verified against.
  **Start here.**
- [`COMPLETED-WORK.md`](./COMPLETED-WORK.md) — detail behind the finished work.
- [`REMAINING-WORK.md`](./REMAINING-WORK.md) — detail behind the open work,
  grouped by layer (links, auth, data, media, dashboards, UI/UX).
- [`PLAN-VS-CODE.md`](./PLAN-VS-CODE.md) — the Plan checked against the code:
  confirmed claims, stale claims, and internal contradictions.

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
