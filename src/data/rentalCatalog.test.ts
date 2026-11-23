import { describe, expect, it } from 'vitest';
import {
  activeTypes,
  activeVariants,
  addDays,
  availableTypes,
  cardMetrics,
  cityHasType,
  DEFAULT_RENTAL_CATALOG,
  estimateRental,
  findRate,
  findRentalType,
  findVariant,
  firstCityForType,
  inclusiveDays,
  localized,
  minimumEndDate,
  rateHistory,
  rateInForce,
  rentalCatalogProblems,
  typeRateUsd,
  type RentalCatalog,
} from './rentalCatalog';

function cloneCatalog(): RentalCatalog {
  return JSON.parse(JSON.stringify(DEFAULT_RENTAL_CATALOG)) as RentalCatalog;
}

describe('rental catalog shape', () => {
  it('ships a catalog the Admin panel can save without problems', () => {
    expect(rentalCatalogProblems(DEFAULT_RENTAL_CATALOG)).toEqual([]);
  });

  it('carries every category Plan §8 names, with boat as the renamed motorboat', () => {
    const ids = DEFAULT_RENTAL_CATALOG.types.map((type) => type.id);
    expect(ids).toEqual([
      'bicycle', 'ebike', 'motorbike', 'scooter', 'tricycle', 'car',
      'self_drive_car', 'horse_carriage', 'camping_tent', 'boat', 'travel_guide',
    ]);
  });

  it('retires the self-drive car but keeps the record for past orders', () => {
    const selfDrive = findRentalType(DEFAULT_RENTAL_CATALOG, 'self_drive_car');
    expect(selfDrive?.active).toBe(false);
    expect(activeTypes(DEFAULT_RENTAL_CATALOG).map((type) => type.id)).not.toContain('self_drive_car');
  });

  it('seeds one standard bicycle and one motorboat variant', () => {
    const bicycle = findRentalType(DEFAULT_RENTAL_CATALOG, 'bicycle');
    const boat = findRentalType(DEFAULT_RENTAL_CATALOG, 'boat');
    expect(bicycle?.variants.map((variant) => variant.id)).toEqual(['standard_bicycle']);
    expect(boat?.variants.map((variant) => variant.id)).toEqual(['motorboat']);
  });

  it('writes both languages for every label, detail and terms string', () => {
    for (const type of DEFAULT_RENTAL_CATALOG.types) {
      expect(type.label.mm.trim(), type.id).not.toBe('');
      expect(type.label.en.trim(), type.id).not.toBe('');
      expect(type.detail.mm.trim(), type.id).not.toBe('');
      expect(type.detail.en.trim(), type.id).not.toBe('');
      expect(type.terms.mm.trim(), type.id).not.toBe('');
      expect(type.terms.en.trim(), type.id).not.toBe('');
    }
    expect(DEFAULT_RENTAL_CATALOG.terms.mm.trim()).not.toBe('');
    expect(DEFAULT_RENTAL_CATALOG.terms.en.trim()).not.toBe('');
    expect(DEFAULT_RENTAL_CATALOG.termsVersion.trim()).not.toBe('');
  });

  it('keeps the driver rule configurable per type', () => {
    const driverTypes = DEFAULT_RENTAL_CATALOG.types.filter((type) => type.driverRequired).map((type) => type.id);
    expect(driverTypes).toContain('car');
    expect(driverTypes).not.toContain('motorbike');
    expect(driverTypes).not.toContain('bicycle');
    expect(driverTypes).not.toContain('self_drive_car');
  });

  it('gives the car category its three variants with local and foreign rates', () => {
    const car = findRentalType(DEFAULT_RENTAL_CATALOG, 'car');
    expect(activeVariants(car).map((variant) => variant.id)).toEqual(['family_car', 'minibus_35', 'bus_45']);
    for (const variant of car?.variants ?? []) {
      expect(variant.rateUsd).toBeGreaterThan(0);
      expect(variant.foreignRateUsd).toBeGreaterThan(variant.rateUsd);
    }
  });
});

describe('city availability matrix', () => {
  it('answers per city and type', () => {
    expect(cityHasType(DEFAULT_RENTAL_CATALOG, 'bagan', 'horse_carriage')).toBe(true);
    expect(cityHasType(DEFAULT_RENTAL_CATALOG, 'yangon', 'horse_carriage')).toBe(false);
    expect(cityHasType(DEFAULT_RENTAL_CATALOG, 'inle', 'boat')).toBe(true);
    expect(cityHasType(DEFAULT_RENTAL_CATALOG, 'nowhere', 'car')).toBe(false);
  });

  it('drops motorbike and scooter from Yangon (Plan §8.2)', () => {
    expect(cityHasType(DEFAULT_RENTAL_CATALOG, 'yangon', 'motorbike')).toBe(false);
    expect(cityHasType(DEFAULT_RENTAL_CATALOG, 'yangon', 'scooter')).toBe(false);
    expect(cityHasType(DEFAULT_RENTAL_CATALOG, 'yangon', 'ebike')).toBe(true);
    expect(cityHasType(DEFAULT_RENTAL_CATALOG, 'yangon', 'tricycle')).toBe(true);
  });

  it('never offers a retired category, even if a city row still lists it', () => {
    const catalog = cloneCatalog();
    catalog.availability.yangon.self_drive_car = true;
    expect(cityHasType(catalog, 'yangon', 'self_drive_car')).toBe(false);
  });

  it('lists only the types the city offers, in catalog order', () => {
    const inle = availableTypes(DEFAULT_RENTAL_CATALOG, 'inle').map((type) => type.id);
    expect(inle).toEqual(['bicycle', 'ebike', 'motorbike', 'camping_tent', 'boat', 'travel_guide']);
  });

  it('finds a city that offers a type the current city lacks', () => {
    expect(firstCityForType(DEFAULT_RENTAL_CATALOG, 'horse_carriage')?.id).toBe('bagan');
    expect(firstCityForType(DEFAULT_RENTAL_CATALOG, 'not_a_type')).toBeUndefined();
  });
});

describe('rental pricing', () => {
  it('counts both endpoints so a same-day rental is one day', () => {
    expect(inclusiveDays('2026-11-20', '2026-11-20')).toBe(1);
    expect(inclusiveDays('2026-11-20', '2026-11-22')).toBe(3);
  });

  it('never returns fewer than one day even when the dates are reversed', () => {
    expect(inclusiveDays('2026-11-22', '2026-11-20')).toBe(1);
  });

  it('multiplies the daily rate by the charged days', () => {
    const bicycle = findRentalType(DEFAULT_RENTAL_CATALOG, 'bicycle');
    const estimate = estimateRental({ catalog: DEFAULT_RENTAL_CATALOG, cityId: 'yangon', type: bicycle, customerType: 'citizen', startDate: '2026-11-20', endDate: '2026-11-22' });
    expect(estimate).toEqual({ days: 3, rateUsd: 8, totalUsd: 24 });
  });

  it('charges the foreign rate to a foreign visitor', () => {
    const bicycle = findRentalType(DEFAULT_RENTAL_CATALOG, 'bicycle');
    const estimate = estimateRental({ catalog: DEFAULT_RENTAL_CATALOG, cityId: 'yangon', type: bicycle, customerType: 'foreigner', startDate: '2026-11-20', endDate: '2026-11-20' });
    expect(estimate.totalUsd).toBe(10);
  });

  it('honours a type minimum day count, so a car never bills a single day', () => {
    const car = findRentalType(DEFAULT_RENTAL_CATALOG, 'car');
    const estimate = estimateRental({ catalog: DEFAULT_RENTAL_CATALOG, cityId: 'yangon', type: car, customerType: 'citizen', variantId: 'family_car', startDate: '2026-11-20', endDate: '2026-11-20' });
    expect(estimate.days).toBe(2);
    expect(estimate.totalUsd).toBe(84);
  });

  it('prices a variant above the category rate', () => {
    const car = findRentalType(DEFAULT_RENTAL_CATALOG, 'car');
    expect(typeRateUsd(DEFAULT_RENTAL_CATALOG, { cityId: 'yangon', type: car, variantId: 'minibus_35', customerType: 'citizen' })).toBe(180);
    expect(typeRateUsd(DEFAULT_RENTAL_CATALOG, { cityId: 'yangon', type: car, variantId: 'minibus_35', customerType: 'foreigner' })).toBe(225);
    expect(typeRateUsd(DEFAULT_RENTAL_CATALOG, { cityId: 'yangon', type: car, customerType: 'citizen' })).toBe(42);
  });

  it('ignores a variant the category does not define', () => {
    const bicycle = findRentalType(DEFAULT_RENTAL_CATALOG, 'bicycle');
    expect(findVariant(bicycle, 'family_car')).toBeUndefined();
    expect(typeRateUsd(DEFAULT_RENTAL_CATALOG, { cityId: 'yangon', type: bicycle, variantId: 'family_car', customerType: 'citizen' })).toBe(8);
  });

  it('prefers the most specific rate row: city+variant, city, variant, default', () => {
    const catalog = cloneCatalog();
    catalog.rates = [
      { id: 'default-car', categoryId: 'car', variantId: null, cityId: null, rateLocalUsd: 40, rateForeignUsd: 50 },
      { id: 'yangon-car', categoryId: 'car', variantId: null, cityId: 'yangon', rateLocalUsd: 45, rateForeignUsd: 58 },
      { id: 'bagan-minibus', categoryId: 'car', variantId: 'minibus_35', cityId: 'bagan', rateLocalUsd: 200, rateForeignUsd: 250 },
    ];
    const car = findRentalType(catalog, 'car');
    expect(findRate(catalog, 'bagan', 'car', 'minibus_35')?.id).toBe('bagan-minibus');
    expect(findRate(catalog, 'yangon', 'car', 'minibus_35')?.id).toBe('yangon-car');
    expect(findRate(catalog, 'mandalay', 'car', null)?.id).toBe('default-car');
    expect(typeRateUsd(catalog, { cityId: 'bagan', type: car, variantId: 'minibus_35', customerType: 'citizen' })).toBe(200);
  });

  it('falls back to the category rate when no rate row matches', () => {
    const car = findRentalType(DEFAULT_RENTAL_CATALOG, 'car');
    expect(findRate(DEFAULT_RENTAL_CATALOG, 'yangon', 'car', null)).toBeUndefined();
    expect(typeRateUsd(DEFAULT_RENTAL_CATALOG, { cityId: 'yangon', type: car, customerType: 'citizen' })).toBe(42);
  });

  it('returns an empty estimate when no type is chosen', () => {
    expect(estimateRental({ catalog: DEFAULT_RENTAL_CATALOG, cityId: 'yangon', type: undefined, customerType: 'citizen', startDate: '2026-11-20', endDate: '2026-11-22' }))
      .toEqual({ days: 0, rateUsd: 0, totalUsd: 0 });
  });

  it('moves the minimum end date by the type minimum days', () => {
    const car = findRentalType(DEFAULT_RENTAL_CATALOG, 'car');
    const bicycle = findRentalType(DEFAULT_RENTAL_CATALOG, 'bicycle');
    expect(minimumEndDate('2026-11-20', car)).toBe(addDays('2026-11-20', 1));
    expect(minimumEndDate('2026-11-20', bicycle)).toBe('2026-11-20');
    expect(minimumEndDate('2026-11-20', undefined)).toBe('2026-11-20');
  });
});

describe('rate rows in force and their history', () => {
  it('keeps a row outside its own date range out of force', () => {
    const row = { id: 'r1', categoryId: 'car', variantId: null, cityId: null, rateLocalUsd: 40, rateForeignUsd: 50, effectiveFrom: '2026-12-01', effectiveTo: '2026-12-31' };
    expect(rateInForce(row, '2026-11-30')).toBe(false);
    expect(rateInForce(row, '2026-12-15')).toBe(true);
    expect(rateInForce(row, '2027-01-01')).toBe(false);
  });

  it('treats a row with no dates as the standing rate', () => {
    const row = { id: 'r1', categoryId: 'car', variantId: null, cityId: null, rateLocalUsd: 40, rateForeignUsd: 50 };
    expect(rateInForce(row, '2026-11-20')).toBe(true);
    expect(rateInForce(row, '2099-01-01')).toBe(true);
  });

  it('prices from the row in force on the booking date, not a future one', () => {
    const catalog = cloneCatalog();
    catalog.rates = [
      { id: 'old', categoryId: 'car', variantId: null, cityId: 'yangon', rateLocalUsd: 42, rateForeignUsd: 55, effectiveFrom: '2026-01-01', effectiveTo: '2026-11-30' },
      { id: 'new', categoryId: 'car', variantId: null, cityId: 'yangon', rateLocalUsd: 60, rateForeignUsd: 78, effectiveFrom: '2026-12-01', effectiveTo: null },
    ];
    const car = findRentalType(catalog, 'car');
    expect(findRate(catalog, 'yangon', 'car', null, '2026-11-20')?.id).toBe('old');
    expect(findRate(catalog, 'yangon', 'car', null, '2026-12-02')?.id).toBe('new');
    expect(typeRateUsd(catalog, { cityId: 'yangon', type: car, customerType: 'citizen' })).toBe(42);
  });

  it('lists every row for one key, newest first', () => {
    const catalog = cloneCatalog();
    catalog.rates = [
      { id: 'a', categoryId: 'car', variantId: 'minibus_35', cityId: 'bagan', rateLocalUsd: 200, rateForeignUsd: 250, effectiveFrom: '2026-01-01' },
      { id: 'b', categoryId: 'car', variantId: 'minibus_35', cityId: 'bagan', rateLocalUsd: 220, rateForeignUsd: 275, effectiveFrom: '2026-12-01' },
      { id: 'other', categoryId: 'car', variantId: null, cityId: 'bagan', rateLocalUsd: 45, rateForeignUsd: 58 },
    ];
    expect(rateHistory(catalog, 'car', 'minibus_35', 'bagan').map((rate) => rate.id)).toEqual(['b', 'a']);
    expect(rateHistory(catalog, 'car', null, 'bagan').map((rate) => rate.id)).toEqual(['other']);
  });
});

describe('branches, terms and settings', () => {
  it('gives every seeded branch an address and a phone for the voucher', () => {
    for (const city of DEFAULT_RENTAL_CATALOG.cities) {
      for (const branch of city.branches) {
        expect(branch.address.length).toBeGreaterThan(2);
        expect(branch.phone.length).toBeGreaterThan(6);
      }
    }
  });

  it('rejects a branch without an address or a phone', () => {
    const catalog = cloneCatalog();
    catalog.cities[0].branches[0].address = '  ';
    expect(rentalCatalogProblems(catalog)).toContain(`branch_address:${catalog.cities[0].id}`);
    const other = cloneCatalog();
    other.cities[0].branches[0].phone = '123';
    expect(rentalCatalogProblems(other)).toContain(`branch_phone:${other.cities[0].id}`);
  });

  it('keeps the published terms version in the history list', () => {
    expect(DEFAULT_RENTAL_CATALOG.termsHistory.some((entry) => entry.version === DEFAULT_RENTAL_CATALOG.termsVersion)).toBe(true);
  });

  it('rejects a rate row naming a variant its category does not define', () => {
    const catalog = cloneCatalog();
    catalog.rates = [{ id: 'bad', categoryId: 'bicycle', variantId: 'minibus_35', cityId: null, rateLocalUsd: 10, rateForeignUsd: 12 }];
    expect(rentalCatalogProblems(catalog)).toContain('rate_variant:bad');
  });

  it('rejects a rate row whose dates run backwards', () => {
    const catalog = cloneCatalog();
    catalog.rates = [{ id: 'bad', categoryId: 'car', variantId: null, cityId: null, rateLocalUsd: 40, rateForeignUsd: 50, effectiveFrom: '2026-12-31', effectiveTo: '2026-12-01' }];
    expect(rentalCatalogProblems(catalog)).toContain('rate_range:bad');
  });

  it('rejects settings the dashboard cannot use', () => {
    const catalog = cloneCatalog();
    catalog.settings = { highlightAfterHours: 0, minNoticeDays: 1 };
    expect(rentalCatalogProblems(catalog)).toContain('settings_highlight');
    const other = cloneCatalog();
    other.settings = { highlightAfterHours: 2, minNoticeDays: -1 };
    expect(rentalCatalogProblems(other)).toContain('settings_notice');
  });
});

describe('card metrics for a type added later', () => {
  it('derives stable rating, distance and views from the id', () => {
    const type = { ...DEFAULT_RENTAL_CATALOG.types[0], id: 'tuk_tuk' };
    const first = cardMetrics(type);
    const second = cardMetrics(type);
    expect(first).toEqual(second);
    expect(first.rating).toBeGreaterThanOrEqual(4.3);
    expect(first.rating).toBeLessThanOrEqual(5);
    expect(first.views).toBeGreaterThan(0);
  });
});

describe('catalog validation', () => {
  it('rejects a type with no rate', () => {
    const catalog = cloneCatalog();
    catalog.types[0].rateUsd = 0;
    expect(rentalCatalogProblems(catalog)).toContain('type_rate:bicycle');
  });

  it('rejects a duplicated type id', () => {
    const catalog = cloneCatalog();
    catalog.types.push({ ...catalog.types[0] });
    expect(rentalCatalogProblems(catalog)).toContain('duplicate_type');
  });

  it('rejects a city with no branch to hand the vehicle over at', () => {
    const catalog = cloneCatalog();
    catalog.cities[0].branches = [];
    expect(rentalCatalogProblems(catalog)).toContain('city_no_branch:yangon');
  });

  it('rejects a city left with no rentable type', () => {
    const catalog = cloneCatalog();
    catalog.availability.yangon = {};
    expect(rentalCatalogProblems(catalog)).toContain('city_no_types:yangon');
  });

  it('rejects an availability entry pointing at a retired type', () => {
    const catalog = cloneCatalog();
    catalog.availability.yangon.self_drive_car = true;
    expect(rentalCatalogProblems(catalog)).toContain('city_unknown_type:yangon');
  });

  it('rejects an availability entry pointing at a type that was removed', () => {
    const catalog = cloneCatalog();
    catalog.types = catalog.types.filter((type) => type.id !== 'tricycle');
    expect(rentalCatalogProblems(catalog)).toContain('city_unknown_type:yangon');
  });

  it('rejects a minimum day count below one', () => {
    const catalog = cloneCatalog();
    catalog.types[0].minDays = 0;
    expect(rentalCatalogProblems(catalog)).toContain('type_min_days:bicycle');
  });

  it('rejects a variant flow with no active variant to book', () => {
    const catalog = cloneCatalog();
    const car = catalog.types.find((type) => type.id === 'car')!;
    car.variants = car.variants.map((variant) => ({ ...variant, active: false }));
    expect(rentalCatalogProblems(catalog)).toContain('type_no_variant:car');
  });

  it('rejects a rate row that points at an unknown city', () => {
    const catalog = cloneCatalog();
    catalog.rates = [{ id: 'bad', categoryId: 'car', variantId: null, cityId: 'nowhere', rateLocalUsd: 10, rateForeignUsd: 12 }];
    expect(rentalCatalogProblems(catalog)).toContain('rate_city:bad');
  });

  it('rejects missing terms text', () => {
    const catalog = cloneCatalog();
    catalog.terms.en = '  ';
    expect(rentalCatalogProblems(catalog)).toContain('terms');
  });
});

describe('localized', () => {
  it('picks the requested language', () => {
    const value = { mm: 'မြန်မာ', en: 'English' };
    expect(localized(value, 'mm')).toBe('မြန်မာ');
    expect(localized(value, 'en')).toBe('English');
  });
});
