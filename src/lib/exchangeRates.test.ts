import { beforeEach, describe, expect, it } from 'vitest';
import {
  FALLBACK_MMK_PER_USD,
  appendExchangeRate,
  currentExchangeRate,
  effectiveMmkPerUsd,
  readExchangeRates,
  writeExchangeRates,
} from './exchangeRates';

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

beforeEach(() => { fakeWindow(); });

describe('exchangeRates', () => {
  it('falls back to the plan value while no row exists', () => {
    expect(readExchangeRates()).toEqual([]);
    expect(effectiveMmkPerUsd([])).toBe(FALLBACK_MMK_PER_USD);
  });

  it('takes the latest row that has taken effect', () => {
    const early = appendExchangeRate({ mmkPerUsd: 4000, setBy: 'Super Admin' }, new Date('2026-11-01T00:00:00Z'))!;
    const late = appendExchangeRate({ mmkPerUsd: 4200, setBy: 'Super Admin' }, new Date('2026-11-10T00:00:00Z'))!;
    const rows = readExchangeRates();
    expect(rows[0].id).toBe(late.id);
    expect(currentExchangeRate(rows, new Date('2026-11-05T00:00:00Z'))).toBe(4000);
    expect(currentExchangeRate(rows, new Date('2026-11-20T00:00:00Z'))).toBe(4200);
    expect(early.mmkPerUsd).toBe(4000);
  });

  it('does not write a row that repeats the rate already in force', () => {
    appendExchangeRate({ mmkPerUsd: 4500, setBy: 'Super Admin' }, new Date('2026-11-01T00:00:00Z'));
    expect(appendExchangeRate({ mmkPerUsd: 4500, setBy: 'Super Admin' }, new Date('2026-11-02T00:00:00Z'))).toBeNull();
    expect(readExchangeRates()).toHaveLength(1);
  });

  it('rejects a rate that is not a positive number', () => {
    expect(appendExchangeRate({ mmkPerUsd: 0, setBy: 'Super Admin' })).toBeNull();
    expect(appendExchangeRate({ mmkPerUsd: Number.NaN, setBy: 'Super Admin' })).toBeNull();
  });

  it('ignores a future row until its effective time', () => {
    writeExchangeRates([
      { id: 'r1', mmkPerUsd: 4500, effectiveFrom: '2026-11-01T00:00:00.000Z', setBy: 'Super Admin', note: '' },
      { id: 'r2', mmkPerUsd: 5000, effectiveFrom: '2026-12-01T00:00:00.000Z', setBy: 'Super Admin', note: '' },
    ]);
    expect(currentExchangeRate(readExchangeRates(), new Date('2026-11-15T00:00:00Z'))).toBe(4500);
    expect(currentExchangeRate(readExchangeRates(), new Date('2026-12-02T00:00:00Z'))).toBe(5000);
  });

  it('keeps a set note so the change can be explained later', () => {
    const row = appendExchangeRate({ mmkPerUsd: 4300, setBy: 'Payment Admin', note: 'CBM reference rate' })!;
    expect(row.note).toBe('CBM reference rate');
    expect(row.setBy).toBe('Payment Admin');
  });
});
