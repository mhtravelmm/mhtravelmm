import { describe, expect, it } from 'vitest';
import {
  addDays,
  availableTypes,
  cardMetrics,
  cityHasType,
  DEFAULT_RENTAL_CATALOG,
  estimateRental,
  findRentalType,
  firstCityForType,
  inclusiveDays,
  localized,
  minimumEndDate,
  rentalCatalogProblems,
  typeRateUsd,
  vehicleOption,
  type RentalCatalog,
} from './rentalCatalog';

function cloneCatalog(): RentalCatalog {
  return JSON.parse(JSON.stringify(DEFAULT_RENTAL_CATALOG)) as RentalCatalog;
}

describe('rental catalog shape', () => {
  it('ships a catalog the Admin panel can save without problems', () => {
    expect(rentalCatalogProblems(DEFAULT_RENTAL_CATALOG)).toEqual([]);
  });

  it('carries every type Plan §8 names, including e-bike, tricycle and boat', () => {
    const ids = DEFAULT_RENTAL_CATALOG.types.map((type) => type.id);
    expect(ids).toEqual([
      'bicycle', 'ebike', 'motorbike', 'scooter', 'tricycle', 'car',
      'self_drive_car', 'horse_carriage', 'camping_tent', 'motorboat', 'travel_guide',
    ]);
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
  });

  it('keeps the driver rule configurable per type', () => {
    const driverTypes = DEFAULT_RENTAL_CATALOG.types.filter((type) => type.driverRequired).map((type) => type.id);
    expect(driverTypes).toContain('car');
    expect(driverTypes).not.toContain('motorbike');
    expect(driverTypes).not.toContain('bicycle');
    expect(driverTypes).not.toContain('self_drive_car');
  });

  it('gives the car type its three vehicle options with local and foreign rates', () => {
    const car = findRentalType(DEFAULT_RENTAL_CATALOG, 'car');
    expect(car?.vehicleOptions.map((option) => option.id)).toEqual(['family_car', 'minibus_35', 'bus_45']);
    for (const option of car?.vehicleOptions ?? []) {
      expect(option.rateUsd).toBeGreaterThan(0);
      expect(option.foreignRateUsd).toBeGreaterThan(option.rateUsd);
    }
  });
});

describe('city availability matrix', () => {
  it('answers per city and type', () => {
    expect(cityHasType(DEFAULT_RENTAL_CATALOG, 'bagan', 'horse_carriage')).toBe(true);
    expect(cityHasType(DEFAULT_RENTAL_CATALOG, 'yangon', 'horse_carriage')).toBe(false);
    expect(cityHasType(DEFAULT_RENTAL_CATALOG, 'inle', 'motorboat')).toBe(true);
    expect(cityHasType(DEFAULT_RENTAL_CATALOG, 'nowhere', 'car')).toBe(false);
  });

  it('lists only the types the city offers, in catalog order', () => {
    const inle = availableTypes(DEFAULT_RENTAL_CATALOG, 'inle').map((type) => type.id);
    expect(inle).toEqual(['bicycle', 'ebike', 'motorbike', 'camping_tent', 'motorboat', 'travel_guide']);
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
    const estimate = estimateRental({ type: bicycle, customerType: 'citizen', startDate: '2026-11-20', endDate: '2026-11-22' });
    expect(estimate).toEqual({ days: 3, rateUsd: 8, totalUsd: 24 });
  });

  it('charges the foreign rate to a foreign visitor', () => {
    const bicycle = findRentalType(DEFAULT_RENTAL_CATALOG, 'bicycle');
    const estimate = estimateRental({ type: bicycle, customerType: 'foreigner', startDate: '2026-11-20', endDate: '2026-11-20' });
    expect(estimate.totalUsd).toBe(10);
  });

  it('honours a type minimum day count, so a car never bills a single day', () => {
    const car = findRentalType(DEFAULT_RENTAL_CATALOG, 'car');
    const estimate = estimateRental({ type: car, customerType: 'citizen', optionId: 'family_car', startDate: '2026-11-20', endDate: '2026-11-20' });
    expect(estimate.days).toBe(2);
    expect(estimate.totalUsd).toBe(84);
  });

  it('prices a vehicle option above the type rate', () => {
    const car = findRentalType(DEFAULT_RENTAL_CATALOG, 'car');
    expect(typeRateUsd(car!, 'citizen', 'minibus_35')).toBe(180);
    expect(typeRateUsd(car!, 'foreigner', 'minibus_35')).toBe(225);
    expect(typeRateUsd(car!, 'citizen')).toBe(42);
  });

  it('ignores an option the type does not define', () => {
    const bicycle = findRentalType(DEFAULT_RENTAL_CATALOG, 'bicycle');
    expect(vehicleOption(bicycle!, 'family_car')).toBeUndefined();
    expect(typeRateUsd(bicycle!, 'citizen', 'family_car')).toBe(8);
  });

  it('returns an empty estimate when no type is chosen', () => {
    expect(estimateRental({ type: undefined, customerType: 'citizen', startDate: '2026-11-20', endDate: '2026-11-22' }))
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
