import { describe, expect, it } from 'vitest';
import { formatMmk, formatMoney, formatUsd, roundMmk } from './moneyFormat';

describe('moneyFormat', () => {
  it('keeps USD to two decimals', () => {
    expect(formatUsd(12)).toBe('$ 12.00');
    expect(formatUsd(12.345)).toBe('$ 12.35');
    expect(formatUsd(1234.5)).toBe('$ 1,234.50');
  });

  it('rounds MMK to the nearest 100', () => {
    expect(roundMmk(4549)).toBe(4500);
    expect(roundMmk(4551)).toBe(4600);
    expect(roundMmk(12)).toBe(0);
  });

  it('converts and rounds for display', () => {
    expect(formatMmk(4500)).toBe('4,500 Ks');
    expect(formatMoney(1, 'MMK', 4500)).toBe('4,500 Ks');
    expect(formatMoney(1, 'USD', 4500)).toBe('$ 1.00');
  });

  it('follows the stored rate rather than a fixed one', () => {
    expect(formatMoney(10, 'MMK', 3500)).toBe('35,000 Ks');
    expect(formatMoney(10, 'MMK', 3512)).toBe('35,100 Ks');
  });
});
