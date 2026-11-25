import { useCallback, useEffect, useState } from 'react';
import type { AdminRole } from './adminRoles';
import { DEFAULT_SHOP_PHOTO_QUOTA } from './mediaRules';
import {
  LISTING_CATEGORIES,
  LISTING_STATUSES,
  PRICE_DISPLAY_MODES,
  SEED_LISTING_ROWS,
  type ListingCategory,
  type ListingRow,
  type ListingStatus,
} from './listingRows';

/**
 * §16C.3 step 2: the Admin and Owner listing screen. `public.listings` is the
 * authority once the migrations are applied, so this is the browser stand-in
 * with the same rules — every check here is mirrored by a constraint, a trigger
 * or a row-level policy in `20261130000100_listings.sql`, and
 * `scripts/verify-migrations.sh` proves the SQL half against a real Postgres.
 *
 * The store holds only what an edit may change. `views`, `rating` and
 * `review_count` are written by the app and the review flow, never by a form,
 * so they are carried through untouched.
 */

export const LISTINGS_STORAGE_KEY = 'mh-travel-listings';
const CHANGED_EVENT = 'mh-travel-listings-changed';

/** The fields an Admin or an Owner may edit on the management screen. */
export type ListingDraft = Pick<
  ListingRow,
  | 'name_en'
  | 'name_mm'
  | 'description_en'
  | 'description_mm'
  | 'address'
  | 'category'
  | 'city_id'
  | 'open_time'
  | 'close_time'
  | 'checkin_time'
  | 'checkout_time'
  | 'price_display'
  | 'price_from_mmk'
  | 'price_from_usd'
  | 'booking_flow_mode'
>;

/**
 * Why a save was refused, as a code the panel translates. A listing is public
 * content, so the validation is about what a traveler would see: a name, a city,
 * a price behind any mode that shows one, opening hours, and — for a hotel — the
 * two stay times.
 */
export type ListingProblem =
  | 'name_en_required'
  | 'city_required'
  | 'category_unknown'
  | 'price_mode_needs_price'
  | 'price_negative'
  | 'usd_and_mmk_both_set'
  | 'open_times_required'
  | 'hotel_times_required'
  | 'time_format_invalid'
  | 'photo_quota_reached';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isTime(value: string | null | undefined): boolean {
  return typeof value === 'string' && TIME_PATTERN.test(value);
}

/** A price mode that shows a price needs one; a hidden price needs none. */
function priceIntentProblem(draft: ListingDraft): ListingProblem | null {
  if (draft.price_display === 'hidden') return null;
  if (draft.price_from_mmk === null && draft.price_from_usd === null) {
    return 'price_mode_needs_price';
  }
  return null;
}

/**
 * §16C.2 gives the table both `price_from_mmk` and `price_from_usd`, but a shop
 * quotes in one currency. Filling both would let the two drift apart, so a draft
 * sets one and the other stays null.
 */
function currencyProblem(draft: ListingDraft): ListingProblem | null {
  if (draft.price_from_mmk !== null && draft.price_from_usd !== null) {
    return 'usd_and_mmk_both_set';
  }
  if ((draft.price_from_mmk ?? 0) < 0 || (draft.price_from_usd ?? 0) < 0) {
    return 'price_negative';
  }
  return null;
}

/**
 * A time the panel did not type — one carried in from a stored row or a future
 * importer — must still be a `HH:MM` Postgres `time` will accept. `open_time`
 * and `close_time` are not ordered against each other on purpose: a bar that
 * opens at 18:00 and closes at 02:00 is valid.
 */
function timeFormatProblem(draft: ListingDraft): ListingProblem | null {
  const times = [draft.open_time, draft.close_time, draft.checkin_time, draft.checkout_time];
  const bad = times.some((value) => value !== null && value !== undefined && !isTime(value));
  return bad ? 'time_format_invalid' : null;
}

/**
 * Plan §9: "Every listing has open and close times; hotels also have check-in
 * and check-out times." A hotel's open time is its front desk, so the rule is
 * the same for every category rather than hotel-only.
 */
function openTimesProblem(draft: ListingDraft): ListingProblem | null {
  if (!isTime(draft.open_time) || !isTime(draft.close_time)) return 'open_times_required';
  return null;
}

function hotelTimesProblem(draft: ListingDraft): ListingProblem | null {
  const isHotel = draft.category === 'hotel' || draft.category === 'guesthouse';
  if (!isHotel) return null;
  if (!isTime(draft.checkin_time) || !isTime(draft.checkout_time)) {
    return 'hotel_times_required';
  }
  return null;
}

/** Every problem with a draft, in the order the panel shows them. */
export function listingDraftProblems(draft: ListingDraft): ListingProblem[] {
  const problems: ListingProblem[] = [];
  if (!draft.name_en.trim()) problems.push('name_en_required');
  if (!draft.city_id.trim()) problems.push('city_required');
  if (!LISTING_CATEGORIES.includes(draft.category)) problems.push('category_unknown');

  const currency = currencyProblem(draft);
  if (currency) problems.push(currency);
  const price = priceIntentProblem(draft);
  if (price) problems.push(price);

  const format = timeFormatProblem(draft);
  if (format) problems.push(format);

  const open = openTimesProblem(draft);
  if (open) problems.push(open);

  const times = hotelTimesProblem(draft);
  if (times) problems.push(times);

  return problems;
}

/**
 * Plan §9: an Owner's edit goes live only after the first Admin approval, and
 * is held at Pending until then. An Admin edit is live at once. This is the one
 * place that decides it, so the screen and the policies cannot disagree.
 */
export function statusAfterEdit(
  current: ListingRow,
  editor: { isStaff: boolean },
): ListingStatus {
  if (editor.isStaff) return current.status;
  if (current.first_approved_at) return current.status === 'retired' ? 'retired' : 'active';
  return 'pending';
}

export interface ListingStore {
  rows: ListingRow[];
}

function isRow(value: unknown): value is ListingRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<ListingRow>;
  return typeof row.id === 'string' && typeof row.name_en === 'string' && typeof row.category === 'string';
}

/**
 * A row saved by an older build can lack fields added since. Filling them from
 * the seed keeps an Admin's edits instead of discarding the whole record, which
 * is what a strict parse would do.
 */
function normalizeRow(row: ListingRow, seed: ListingRow | undefined): ListingRow {
  return {
    ...(seed ?? row),
    ...row,
    status: LISTING_STATUSES.includes(row.status) ? row.status : 'pending',
    price_display: PRICE_DISPLAY_MODES.includes(row.price_display) ? row.price_display : 'hidden',
    review_count: row.review_count ?? 0,
    favorite_count: row.favorite_count ?? 0,
    views: row.views ?? 0,
    photo_quota: row.photo_quota ?? seed?.photo_quota ?? DEFAULT_SHOP_PHOTO_QUOTA,
    // A stored `null` is a real value here — a row that has never been approved
    // — so it must survive the fallback. `??` would read it as absent and take
    // the seed's stamp instead, which would make a Pending row look approved.
    first_approved_at: row.first_approved_at === undefined ? (seed?.first_approved_at ?? null) : row.first_approved_at,
  };
}

export function readListings(): ListingRow[] {
  if (typeof window === 'undefined') return SEED_LISTING_ROWS;
  try {
    const raw = window.localStorage.getItem(LISTINGS_STORAGE_KEY);
    if (!raw) return SEED_LISTING_ROWS;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_LISTING_ROWS;
    const stored = parsed.filter(isRow);
    // A row the seed added after this browser saved must still appear, or a new
    // module's listings would be invisible to an Admin who edited one earlier.
    const storedIds = new Set(stored.map((row) => row.id));
    const missing = SEED_LISTING_ROWS.filter((row) => !storedIds.has(row.id));
    return [...stored.map((row) => normalizeRow(row, SEED_LISTING_ROWS.find((s) => s.id === row.id))), ...missing];
  } catch {
    return SEED_LISTING_ROWS;
  }
}

export function writeListings(rows: ListingRow[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function resetListings(): ListingRow[] {
  writeListings(SEED_LISTING_ROWS);
  return SEED_LISTING_ROWS;
}

/** The rows one viewer may see: an Owner sees their own, staff see every row. */
export function listingsForViewer(
  rows: ListingRow[],
  viewer: { ownerId: string | null; isStaff: boolean },
): ListingRow[] {
  if (viewer.isStaff) return rows;
  if (!viewer.ownerId) return [];
  return rows.filter((row) => row.owner_id === viewer.ownerId);
}

/**
 * Applies a draft to a row. `owner_id`, `views`, `rating`, `review_count` and
 * the approval stamp are read from `current`, never from the draft, so a form
 * cannot reassign a listing (§16C.3 acceptance) or write a stamp — the same
 * reason the SQL trigger pins `first_approved_at`.
 */
export function applyListingDraft(
  current: ListingRow,
  draft: ListingDraft,
  editor: { isStaff: boolean; now?: string },
): ListingRow {
  return {
    ...current,
    ...draft,
    status: statusAfterEdit(current, editor),
    // An approval stamp is granted by the approval itself, never by an edit.
    first_approved_at: current.first_approved_at,
    updated_at: editor.now ?? new Date().toISOString(),
  };
}

/**
 * The quota check the photo panel runs. The SQL trigger enforces the same bound
 * on insert, so this is the message, not the authority.
 */
export function canAddPhoto(row: ListingRow, currentCount: number): boolean {
  return currentCount < row.photo_quota;
}

export function useListings() {
  const [rows, setRows] = useState<ListingRow[]>(readListings);

  useEffect(() => {
    const sync = () => setRows(readListings());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const save = useCallback((next: ListingRow[]) => {
    writeListings(next);
    setRows(next);
  }, []);

  const reset = useCallback(() => {
    setRows(resetListings());
  }, []);

  return { rows, save, reset };
}

/** The categories a module is built from, so a screen can group the list. */
export function listingsByCategory(rows: ListingRow[], category: ListingCategory): ListingRow[] {
  return rows.filter((row) => row.category === category);
}

/**
 * §16B.1: approving, suspending and retiring a listing is `F` for Super Admin
 * and Admin, and `-` for every other role. An Owner edits its own row through
 * the Owner workspace but never approves it.
 */
export function canApproveListings(role: AdminRole | undefined): boolean {
  return role === 'Super Admin' || role === 'Admin';
}

/** The Admin row is `F`; the Owner row is `O (own listing)`. */
export function canEditListing(role: AdminRole | undefined): boolean {
  return role === 'Super Admin' || role === 'Admin' || role === 'Owner Admin';
}
