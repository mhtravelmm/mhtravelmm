import { describe, expect, it } from 'vitest';
import {
  appendRemoteRate,
  effectiveRate,
  fromRemoteRate,
  readRemoteRate,
  readRemoteRateHistory,
} from './exchangeRateApi';
import { FALLBACK_MMK_PER_USD } from './exchangeRates';

/**
 * Plan §16B.5 and ticket O-02. The rate in force is the latest row that has
 * taken effect, and 4,500 is the fallback while no row exists. The risk this
 * suite guards is a broken or empty read repricing the whole site.
 */

describe('an exchange_rates row in the client shape', () => {
  it('reads a numeric column that arrives as a string', () => {
    const row = fromRemoteRate({
      id: 'r1',
      mmk_per_usd: '4512.50',
      effective_from: '2026-12-01T00:00:00.000Z',
      set_by: null,
      note: 'December rate',
    });
    expect(row).toEqual({
      id: 'r1',
      mmkPerUsd: 4512.5,
      effectiveFrom: '2026-12-01T00:00:00.000Z',
      setBy: '',
      note: 'December rate',
    });
  });
});

describe('reading the rate with no Supabase configured', () => {
  // A `null` answer means "could not read", never "the rate is zero". A zero
  // would price every listing at nothing, which is why it is not a default.
  it('answers null for the current rate and the history', async () => {
    expect(await readRemoteRate()).toBeNull();
    expect(await readRemoteRateHistory()).toBeNull();
  });

  it('keeps the browser rate when the table cannot answer', async () => {
    expect(await effectiveRate(4600)).toBe(4600);
  });

  it('falls back to the Plan 4,500 when neither side has a row', async () => {
    expect(await effectiveRate(null)).toBe(FALLBACK_MMK_PER_USD);
    expect(FALLBACK_MMK_PER_USD).toBe(4500);
  });

  // An unreadable local value must not be forwarded as if it were a rate.
  it('refuses a zero, a negative or a NaN local rate', async () => {
    expect(await effectiveRate(0)).toBe(FALLBACK_MMK_PER_USD);
    expect(await effectiveRate(-100)).toBe(FALLBACK_MMK_PER_USD);
    expect(await effectiveRate(Number.NaN)).toBe(FALLBACK_MMK_PER_USD);
  });
});

describe('appending a row', () => {
  it('rounds to two decimals and keeps the preview working', async () => {
    const outcome = await appendRemoteRate({ mmkPerUsd: 4512.567, note: 'test' }, new Date('2026-12-02T00:00:00.000Z'));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.source).toBe('preview');
      expect(outcome.row.mmkPerUsd).toBe(4512.57);
      expect(outcome.row.effectiveFrom).toBe('2026-12-02T00:00:00.000Z');
      expect(outcome.row.note).toBe('test');
    }
  });
});
