import { beforeEach, describe, expect, it } from 'vitest';
import { diffRentalCatalog, readRentalAudit, recordOrderAudit, recordRentalAudit, writeRentalAudit } from './rentalAudit';
import { DEFAULT_RENTAL_CATALOG, type RentalCatalog } from '../data/rentalCatalog';

function fakeWindow() {
  const map = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => { map.set(key, value); },
      removeItem: (key: string) => { map.delete(key); },
      clear: () => map.clear(),
      key: () => null,
      get length() { return map.size; },
    },
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
}

function catalogWith(overrides: Partial<RentalCatalog> = {}): RentalCatalog {
  return { ...DEFAULT_RENTAL_CATALOG, ...overrides };
}

describe('diffRentalCatalog', () => {
  it('reports nothing when the two versions are the same', () => {
    expect(diffRentalCatalog(catalogWith(), catalogWith())).toEqual([]);
  });

  it('reports a changed setting with both values', () => {
    const changes = diffRentalCatalog(catalogWith(), catalogWith({ settings: { highlightAfterHours: 5, minNoticeDays: 1 } }));
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ section: 'settings', field: 'settings.highlightAfterHours', from: '2', to: '5' });
  });

  it('names a changed rate by its id rather than its position', () => {
    const rate = { id: 'rate_1', categoryId: 'bicycle', variantId: null, cityId: null, rateLocalUsd: 50, rateForeignUsd: 10, effectiveFrom: '2026-11-23', effectiveTo: null };
    const changes = diffRentalCatalog(
      catalogWith({ rates: [rate] }),
      catalogWith({ rates: [{ ...rate, rateLocalUsd: 55 }] }),
    );
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({ section: 'rates', field: 'rates[rate_1].rateLocalUsd', from: '50', to: '55' });
  });

  it('reads a city edit as a branch change', () => {
    const before = catalogWith();
    const after = catalogWith({
      cities: before.cities.map((city) => (city.id === 'yangon'
        ? { ...city, branches: city.branches.map((branch) => ({ ...branch, phone: '+95 9 111 222 333' })) }
        : city)),
    });
    const changes = diffRentalCatalog(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].section).toBe('branches');
    expect(changes[0].to).toBe('+95 9 111 222 333');
  });

  it('ignores publish timestamps so a save does not look like a terms change', () => {
    const before = catalogWith();
    const after = catalogWith({
      termsHistory: before.termsHistory.map((entry) => ({ ...entry, publishedAt: new Date().toISOString() })),
    });
    expect(diffRentalCatalog(before, after)).toEqual([]);
  });

  it('notes an added and a removed item', () => {
    const before = catalogWith();
    const after = catalogWith({ types: before.types.slice(1) });
    const changes = diffRentalCatalog(before, after);
    expect(changes.some((change) => change.field.startsWith(`types[${before.types[0].id}]`))).toBe(true);
  });
});

describe('the audit log', () => {
  beforeEach(() => {
    fakeWindow();
  });

  it('starts empty and keeps the newest entry first', () => {
    expect(readRentalAudit()).toEqual([]);
    recordRentalAudit(catalogWith(), catalogWith({ settings: { highlightAfterHours: 3, minNoticeDays: 1 } }), 'a@b.c', new Date('2026-11-22T10:00:00.000Z'));
    recordRentalAudit(catalogWith(), catalogWith({ settings: { highlightAfterHours: 4, minNoticeDays: 1 } }), 'a@b.c', new Date('2026-11-22T11:00:00.000Z'));
    const log = readRentalAudit();
    expect(log).toHaveLength(2);
    expect(log[0].changes[0].to).toBe('4');
  });

  it('does not log a save that changed nothing', () => {
    expect(recordRentalAudit(catalogWith(), catalogWith(), 'a@b.c')).toBeNull();
    expect(readRentalAudit()).toEqual([]);
  });

  it('records who made the change and when', () => {
    const entry = recordRentalAudit(catalogWith(), catalogWith({ settings: { highlightAfterHours: 9, minNoticeDays: 2 } }), 'rental@mhtravel.com', new Date('2026-11-22T09:30:00.000Z'));
    expect(entry).toMatchObject({ actor: 'rental@mhtravel.com', at: '2026-11-22T09:30:00.000Z' });
    expect(entry?.changes).toHaveLength(2);
  });

  it('keeps an order status change with the request code', () => {
    const entry = recordOrderAudit('RNT-261120-0002', 'status', 'accepted', 'paid', 'staff', new Date('2026-11-23T05:00:00.000Z'));
    expect(entry.orderCode).toBe('RNT-261120-0002');
    expect(entry.changes[0]).toMatchObject({ field: 'status', from: 'accepted', to: 'paid' });
    expect(readRentalAudit()[0].orderCode).toBe('RNT-261120-0002');
  });

  it('caps the log so a long-lived browser cannot grow it forever', () => {
    const entries = Array.from({ length: 260 }, (_, index) => ({
      id: `entry-${index}`,
      at: new Date(2026, 0, 1, 0, index).toISOString(),
      actor: 'a@b.c',
      changes: [],
    }));
    writeRentalAudit(entries);
    expect(readRentalAudit()).toHaveLength(200);
  });
});
