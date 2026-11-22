# MH Travel — Plan Update 2026-11-21

> Addendum to `Plan/PROJECT-PLAN.md`. Records decisions made after the 2026-11-16 consolidation, plus the status audit of 2026-11-20 (`Doc/STATUS.md`). Items under "Open questions" are NOT decisions; they are the agenda for the next detailed planning session. When the detailed plan is settled, merge this file into `PROJECT-PLAN.md`.

---

## 1. Current build state (audit, `main` @ `5f3924b`, 2026-11-20)

Source of truth for status: `Doc/STATUS.md`. Summary:

- Typecheck, Vite build and ESLint pass (0 errors, 7 warnings).
- 26 declared routes, all render. Most traveler pages are PREVIEW (seed data / localStorage, no backend persistence).
- Supabase migrations and RLS exist (profiles, favorites, custom_plan_requests, bookings, notifications, reviews, ads, admin_audit_logs). Forms are not yet wired to them. The `operator_branches` migration is still required.
- Shop Owner and Main Owner dashboards have no i18n (English only). Super Admin body copy is mostly English.
- Blog media: R2 upload adapter exists; no Worker deployed.

### Known defects to schedule

1. 48 broken internal links: 10 missing category pages (`/hotels`, `/cafes`, `/attractions`, `/markets`, `/populars`, `/reviews`, `/categories`, `/partners`, `/awards`, `/guides`), 38 missing detail routes (`/hotels/:id`, `/cafes/:id`, `/markets/:id`, `/attractions/:id`, `/ticketing/:id`, `/rentals/:id`, plus `/emergency`, `/exchange`, `/sim_card`), and the `/book_shop` typo (should be `/book-shops`).
2. `/restaurants/:id` and `/book-shops/:id` do not select a record by `id`.
3. Restaurant menu category and Book Shop category selectors change state but do not filter.
4. Load More on Blogs and Travel Guide (page size 6, 4 columns) leaves a half row.
5. Accessibility pass pending (139 buttons without `aria-label` listed for review; 5 images without `alt`).

---

## 2. Decisions recorded 2026-11-21

### 2.1 Build order

1. **Priority modules (MH Travel's own):** **Rentals** first, then **Blog posts** and **Travel Guide posts**. Each is built so that MH Travel fully controls it from both the system side and the admin side before any other module is worked on.
2. **All other modules** (hotels, restaurants, cafes, book shops, ticketing, etc.) are filled in **one by one, gradually**, after the priority modules.
3. The **Shop Page template system** (section 2.2) and the **Operator system** (section 2.3) are recorded as planned capabilities. Neither is scheduled as the next build step.
4. **Home Page:** its design work is already complete (confirmed 2026-11-21), so it no longer has to come before the priority modules. This replaces the earlier "Home Page first" order. The Home Page fills out as the priority modules come in.

### 2.2 Shop Page template system (planned capability; design and build deferred)

- **Decision (2026-11-21, later in the day):** template design and implementation happen at a later stage. For now the plan only records that this system will exist.

- The web app is meant to be reusable later as a system other businesses use.
- Shop owners get many page-design choices. For a hotel page: about **10 designs**.
- MH Travel provides **one standard default design**. Switching to a preferred design **costs money** (the current plan fixes 2,000 MMK/month per shop in `PROJECT-PLAN.md` §4, "Shop Owner Web UI/UX template marketplace"; confirm in discussion whether that figure still applies to every category).
- Templates must have **genuinely different UI/UX**, not recolors of one layout.
- Working assumption, to confirm when templates are designed: templates are presentation layers only, so shop data (profile, menu/products, photos, prices, reviews, bookings) stays reusable when switching.

### 2.3 Operator system (white-label use by other businesses)

- A business such as a ticket seller can use the system as **its own system**: the operator's admin account is where tickets are sold/cut.
- **Operator data stays in the operator's own admin account data and is not sent to MH Travel.**
- MH Travel only pulls **seat availability (free/taken)** and **date availability**. Nothing else.
- Operators can **design their own custom vouchers/tickets**.

Relationship to existing plan sections (to reconcile in discussion):

- `PROJECT-PLAN.md` §7 says Ticketing is MH Travel's own separate product integrated via API. 2.3 extends this: the same system is also used by outside operators, with data isolation as above.
- `PROJECT-PLAN.md` §9 (Main Owner / Branch Owner, 10,000 MMK/branch/month, wallets, revenue share) assumes MH Travel holds transaction attribution and wallet ledgers. If operator data is not sent to MH Travel, that section needs review for what MH Travel can actually see and settle.

### 2.4 Rentals (notes recorded as stated; details to be filled in later)

- Rental items: **cars, motorbikes, bicycles, e-bikes, canvas tents (ရွက်ဖျင်တဲ), boats, horse carts, tricycles (သုံးဘီး)**.
- Each type works differently and has its own rules:
  - Bicycle: the traveler picks a bicycle type and rents it.
  - Car: a **driver must be booked** with the car, and there are more choices (vehicle type/model, express vehicle, 35-seater, etc.), each with its own rules.
- **Availability differs by city.** Example: in Yangon, motorbikes and canvas tents cannot be rented.
- Status: recorded only; the founder moved on to Blog posts first. Detailed rental flows are not defined yet.

---

## 3. Open questions for the detailed planning session

Template system (deferred until template design starts)
1. Which business categories get templates first (hotel only, or restaurant / book shop too)? How many designs per category?
2. Is the paid-switch price one flat figure for all categories, or per category? Does it stay at 2,000 MMK/month?
3. How do templates cope with differing data (a hotel has rooms and check-in times, a restaurant has menus)? Shared content model vs per-category.
4. Who builds the templates, and how are previews shown to owners?

Operator system
5. What exactly does MH Travel store about an operator's sale (a seat marker only, or a booking reference)? How are payment, commission and refunds handled if booking data stays with the operator?
6. How is seat availability fetched (live request on opening the booking flow, per `PROJECT-PLAN.md` §7) and what happens when an operator's system is offline?
7. Voucher/ticket designer: free-form or a fixed set of fields? Who is responsible for required legal/booking fields?
8. Operator onboarding and billing: does an outside operator pay a subscription, and does the Branch Owner model still apply?

General
9. Order for fixing the 48 broken links relative to the priority modules (Rentals, Blog posts, Travel Guide posts).
10. Which backend wiring comes first (Favorites, Notifications, Bookings, Auth)?
11. *(Answered 2026-11-21: Home Page design is complete; see section 2.1, item 4.)*
12. Rentals: initial notes are in section 2.4. Still to define: whether MH Travel owns the rental items or lists outside rental shops, booking/payment flow, per-type rules, per-city availability setup, and what the admin side must control.
