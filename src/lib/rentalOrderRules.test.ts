import { describe, expect, it } from 'vitest';
import { DEFAULT_RENTAL_CATALOG, type RentalCatalog } from '../data/rentalCatalog';
import { addDaysToDay, myanmarToday } from './myanmarTime';
import {
  quoteRentalOrder,
  rentalPhoneDigits,
  validateRentalOrder,
  type RentalOrderDraft,
} from './rentalOrderRules';

/** Plan §8.7 uses Myanmar Time, so every case is built from that day, not the host clock. */
const NOW = new Date('2026-11-20T03:00:00.000Z');
const TODAY = myanmarToday(NOW);
const TOMORROW = addDaysToDay(TODAY, 1);

function catalogWith(overrides: Partial<RentalCatalog> = {}): RentalCatalog {
  return { ...DEFAULT_RENTAL_CATALOG, ...overrides };
}

function draftWith(overrides: Partial<RentalOrderDraft> = {}): RentalOrderDraft {
  return {
    cityId: 'yangon',
    categoryId: 'bicycle',
    variantId: null,
    startDate: TOMORROW,
    endDate: addDaysToDay(TOMORROW, 2),
    participants: 1,
    customerType: 'citizen',
    fulfillment: 'delivery',
    branchId: null,
    deliveryAddress: 'No. 5, Sule Road',
    customerName: 'Aung Aung',
    phone: '+95 9 770 000 111',
    termsVersion: DEFAULT_RENTAL_CATALOG.termsVersion,
    ...overrides,
  };
}

function codeOf(overrides: Partial<RentalOrderDraft> = {}, catalog = catalogWith(), recentSubmissions = 0) {
  const result = validateRentalOrder(draftWith(overrides), { catalog, recentSubmissions, now: NOW });
  return result.ok ? null : result.code;
}

describe('rental order rules (Plan §8.7)', () => {
  it('accepts a draft that satisfies every rule', () => {
    const result = validateRentalOrder(draftWith(), { catalog: catalogWith(), recentSubmissions: 0, now: NOW });
    expect(result.ok).toBe(true);
  });

  it('rejects a type that is not offered in the chosen city', () => {
    // Plan §8.2 decision: Yangon has no motorbike.
    expect(codeOf({ cityId: 'yangon', categoryId: 'motorbike' })).toBe('rental_error_city_availability');
  });

  it('rejects a category that is inactive', () => {
    expect(codeOf({ categoryId: 'self_drive_car' })).toBe('rental_error_category');
  });

  it('rejects a variant the category does not define', () => {
    expect(codeOf({ categoryId: 'bicycle', variantId: 'family_car' })).toBe('rental_error_variant');
  });

  it('rejects a branch that belongs to another city', () => {
    expect(codeOf({ fulfillment: 'branch', branchId: 'bagan-nyaung-u' })).toBe('rental_error_branch');
  });

  it('accepts a branch of the chosen city', () => {
    expect(codeOf({ fulfillment: 'branch', branchId: 'yangon-downtown' })).toBeNull();
  });

  it('rejects a start date before tomorrow in Myanmar Time', () => {
    expect(codeOf({ startDate: TODAY })).toBe('rental_error_start_date');
  });

  it('honours the Settings notice period when it asks for more than a day', () => {
    const catalog = catalogWith({ settings: { highlightAfterHours: 2, minNoticeDays: 3 } });
    expect(codeOf({}, catalog)).toBe('rental_error_start_date');
    expect(codeOf({ startDate: addDaysToDay(TODAY, 3) }, catalog)).toBeNull();
  });

  it('rejects an end date before the start date', () => {
    expect(codeOf({ endDate: addDaysToDay(TOMORROW, -1) })).toBe('rental_error_end_date');
  });

  it('rejects a car shorter than its minimum days', () => {
    expect(codeOf({ categoryId: 'car', variantId: 'family_car', endDate: TOMORROW })).toBe('rental_error_min_days');
  });

  it('rejects a name shorter than two characters', () => {
    expect(codeOf({ customerName: ' A ' })).toBe('rental_error_name');
  });

  it('counts phone digits, so punctuation alone is not enough', () => {
    expect(rentalPhoneDigits('+95 (9) 770-000-111')).toBe('959770000111');
    expect(codeOf({ phone: '+--(--)---' })).toBe('rental_error_phone');
  });

  it('rejects a delivery address shorter than three characters', () => {
    expect(codeOf({ deliveryAddress: ' ab ' })).toBe('rental_error_address');
  });

  it('does not require an address when the traveler picks up at a branch', () => {
    expect(codeOf({ fulfillment: 'branch', branchId: 'yangon-downtown', deliveryAddress: '' })).toBeNull();
  });

  it('rejects fewer than one participant', () => {
    expect(codeOf({ participants: 0 })).toBe('rental_error_participants');
  });

  it('rejects terms that are not the current version', () => {
    expect(codeOf({ termsVersion: '2020-01-01' })).toBe('rental_error_terms');
  });

  it('rate-limits the eleventh submission in an hour', () => {
    expect(codeOf({}, catalogWith(), 9)).toBeNull();
    expect(codeOf({}, catalogWith(), 10)).toBe('rental_error_rate_limit');
  });

  it('reports a missing rate instead of charging zero', () => {
    const catalog = catalogWith();
    catalog.types = catalog.types.map((type) =>
      type.id === 'bicycle' ? { ...type, rateUsd: 0, foreignRateUsd: 0, variants: [] } : type,
    );
    expect(codeOf({}, catalog)).toBe('rental_error_rate_missing');
  });

  it('checks the rules in the same order as the server', () => {
    // An unavailable type in an inactive city reports the type first.
    expect(codeOf({ cityId: 'ngapali', categoryId: 'self_drive_car' })).toBe('rental_error_category');
    // A bad city and a bad date report the city first.
    expect(codeOf({ cityId: 'yangon', categoryId: 'motorbike', startDate: TODAY })).toBe('rental_error_city_availability');
  });
});

describe('the order quote (Plan §8.4)', () => {
  it('multiplies the daily rate by the inclusive days', () => {
    const quote = quoteRentalOrder(draftWith(), DEFAULT_RENTAL_CATALOG);
    expect(quote).toEqual({ days: 3, rateUsd: 8, totalUsd: 24 });
  });

  it('charges the foreign rate to a foreign visitor', () => {
    const quote = quoteRentalOrder(draftWith({ customerType: 'foreigner' }), DEFAULT_RENTAL_CATALOG);
    expect(quote.totalUsd).toBe(30);
  });

  it('uses the variant rate when one is chosen', () => {
    const quote = quoteRentalOrder(
      draftWith({ categoryId: 'car', variantId: 'minibus_35', startDate: TOMORROW, endDate: addDaysToDay(TOMORROW, 1) }),
      DEFAULT_RENTAL_CATALOG,
    );
    expect(quote.totalUsd).toBe(360);
  });

  it('quotes nothing for an unknown category', () => {
    expect(quoteRentalOrder(draftWith({ categoryId: 'spaceship' }), DEFAULT_RENTAL_CATALOG))
      .toEqual({ days: 0, rateUsd: 0, totalUsd: 0 });
  });
});
