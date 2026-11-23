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
