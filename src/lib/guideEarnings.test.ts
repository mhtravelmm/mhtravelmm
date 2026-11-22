import { describe, expect, it } from 'vitest';
import {
  authorTotals,
  createEarningRow,
  markEarningPaid,
  setEarningAmount,
  type EarningRow,
} from './guideEarnings';

const base: EarningRow = { id: 'e1', guideId: 'g1', author: 'Thazin Win', publishedAt: '2026-11-22', amountUsd: null, paid: false };

describe('createEarningRow', () => {
  it('creates one unpaid, unrated row per guide', () => {
    const row = createEarningRow({ guideId: 'g1', author: 'Thazin Win', publishedAt: '2026-11-22', existing: [] });
    expect(row).toMatchObject({ guideId: 'g1', author: 'Thazin Win', amountUsd: null, paid: false });
  });

  it('does not duplicate a guide that already has a row', () => {
    expect(createEarningRow({ guideId: 'g1', author: 'Thazin Win', publishedAt: '2026-11-22', existing: [base] })).toBeNull();
  });
});

describe('setEarningAmount', () => {
  it('records the amount an Admin sets', () => {
    expect(setEarningAmount([base], 'e1', 25)[0].amountUsd).toBe(25);
  });

  it('ignores an invalid amount', () => {
    const rows = [base];
    expect(setEarningAmount(rows, 'e1', -5)).toBe(rows);
    expect(setEarningAmount(rows, 'e1', Number.NaN)).toBe(rows);
  });
});

describe('markEarningPaid', () => {
  it('pays a row that carries an amount', () => {
    expect(markEarningPaid([{ ...base, amountUsd: 25 }], 'e1')[0].paid).toBe(true);
  });

  it('refuses to pay a row with no amount yet', () => {
    expect(markEarningPaid([base], 'e1')[0].paid).toBe(false);
  });
});

describe('authorTotals', () => {
  it('splits payable money from rows still waiting for an amount', () => {
    const rows: EarningRow[] = [
      { ...base, id: 'e1', guideId: 'g1', amountUsd: 25 },
      { ...base, id: 'e2', guideId: 'g2', amountUsd: 15 },
      { ...base, id: 'e3', guideId: 'g3' },
      { ...base, id: 'e4', guideId: 'g4', amountUsd: 10, paid: true },
    ];
    expect(authorTotals(rows)).toEqual([{ author: 'Thazin Win', payableUsd: 40, pendingRows: 1 }]);
  });
});
