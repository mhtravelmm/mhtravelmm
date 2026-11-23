import {
  cityHasType,
  estimateRental,
  findRentalType,
  findVariant,
  type RentalCatalog,
} from '../data/rentalCatalog';
import { addDaysToDay, myanmarToday } from './myanmarTime';

/**
 * Plan §8.7: the server is the authority, and "the client rules mirror them".
 * Every rule in `submit_rental_order` is repeated here so a traveler sees the
 * same rejection before the request is sent, in the same words, and so the
 * total stored on the order is the one this file computed rather than the one
 * the form happened to display.
 *
 * The codes are the server's, so `t()` translates one set of keys.
 */
export type RentalOrderErrorCode =
  | 'rental_error_not_signed_in'
  | 'rental_error_category'
  | 'rental_error_city_availability'
  | 'rental_error_variant'
  | 'rental_error_branch'
  | 'rental_error_start_date'
  | 'rental_error_end_date'
  | 'rental_error_min_days'
  | 'rental_error_name'
  | 'rental_error_phone'
  | 'rental_error_address'
  | 'rental_error_participants'
  | 'rental_error_terms'
  | 'rental_error_rate_limit'
  | 'rental_error_rate_missing';

export const RENTAL_ORDER_ERROR_CODES: RentalOrderErrorCode[] = [
  'rental_error_not_signed_in',
  'rental_error_category',
  'rental_error_city_availability',
  'rental_error_variant',
  'rental_error_branch',
  'rental_error_start_date',
  'rental_error_end_date',
  'rental_error_min_days',
  'rental_error_name',
  'rental_error_phone',
  'rental_error_address',
  'rental_error_participants',
  'rental_error_terms',
  'rental_error_rate_limit',
  'rental_error_rate_missing',
];

/** Plan §8.7: rate-limit submissions per account. */
export const RENTAL_SUBMIT_LIMIT_PER_HOUR = 10;

/** The traveler's side of an order: everything the form collects. */
export type RentalOrderDraft = {
  cityId: string;
  categoryId: string;
  variantId: string | null;
  startDate: string;
  endDate: string;
  participants: number;
  customerType: 'citizen' | 'foreigner';
  fulfillment: 'delivery' | 'branch';
  branchId: string | null;
  deliveryAddress: string;
  customerName: string;
  phone: string;
  termsVersion: string;
};

export type RentalOrderQuote = { days: number; rateUsd: number; totalUsd: number };

/** Plan §8.7: the phone must hold at least seven digits, as the server counts them. */
export function rentalPhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Plan §8.4 steps 3–4 and §8.7: rate × inclusive days, to 2 decimals. The form
 * calls this to preview, and the order calls it to store, so the preview and
 * the record cannot drift.
 */
export function quoteRentalOrder(draft: RentalOrderDraft, catalog: RentalCatalog): RentalOrderQuote {
  const type = findRentalType(catalog, draft.categoryId);
  if (!type) return { days: 0, rateUsd: 0, totalUsd: 0 };
  return estimateRental({
    catalog,
    cityId: draft.cityId,
    type,
    customerType: draft.customerType,
    variantId: draft.variantId,
    startDate: draft.startDate,
    endDate: draft.endDate,
  });
}

export type RentalOrderValidation =
  | { ok: true; quote: RentalOrderQuote }
  | { ok: false; code: RentalOrderErrorCode };

export type RentalValidationContext = {
  catalog: RentalCatalog;
  /** Submissions this account made in the last hour, for the rate limit. */
  recentSubmissions: number;
  now?: Date;
};

/**
 * The rules in the order `submit_rental_order` checks them, so the first
 * problem a traveler sees is the first one the server would have raised.
 */
export function validateRentalOrder(
  draft: RentalOrderDraft,
  context: RentalValidationContext,
): RentalOrderValidation {
  const { catalog, recentSubmissions } = context;
  const now = context.now ?? new Date();
  const type = findRentalType(catalog, draft.categoryId);
  if (!type?.active) return { ok: false, code: 'rental_error_category' };

  if (!cityHasType(catalog, draft.cityId, draft.categoryId)) {
    return { ok: false, code: 'rental_error_city_availability' };
  }

  if (draft.variantId) {
    const variant = findVariant(type, draft.variantId);
    if (!variant?.active) return { ok: false, code: 'rental_error_variant' };
  }

  const city = catalog.cities.find((item) => item.id === draft.cityId);
  if (draft.fulfillment === 'branch' && !city?.branches.some((branch) => branch.id === draft.branchId)) {
    return { ok: false, code: 'rental_error_branch' };
  }

  // Plan §8.7: at least tomorrow in Myanmar Time; the Settings notice period
  // may ask for more, never less.
  const earliestStart = addDaysToDay(myanmarToday(now), Math.max(1, catalog.settings.minNoticeDays));
  if (draft.startDate < earliestStart) return { ok: false, code: 'rental_error_start_date' };
  if (draft.endDate < draft.startDate) return { ok: false, code: 'rental_error_end_date' };
  if (draft.endDate < addDaysToDay(draft.startDate, Math.max(0, type.minDays - 1))) {
    return { ok: false, code: 'rental_error_min_days' };
  }

  if (draft.customerName.trim().length < 2) return { ok: false, code: 'rental_error_name' };
  if (rentalPhoneDigits(draft.phone).length < 7) return { ok: false, code: 'rental_error_phone' };
  if (draft.fulfillment === 'delivery' && draft.deliveryAddress.trim().length < 3) {
    return { ok: false, code: 'rental_error_address' };
  }
  if (!(draft.participants >= 1)) return { ok: false, code: 'rental_error_participants' };

  if (draft.termsVersion !== catalog.termsVersion) return { ok: false, code: 'rental_error_terms' };

  if (recentSubmissions >= RENTAL_SUBMIT_LIMIT_PER_HOUR) return { ok: false, code: 'rental_error_rate_limit' };

  const quote = quoteRentalOrder(draft, catalog);
  if (!(quote.rateUsd > 0)) return { ok: false, code: 'rental_error_rate_missing' };

  return { ok: true, quote };
}
