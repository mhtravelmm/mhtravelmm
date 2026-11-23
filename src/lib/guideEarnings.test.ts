import { describe, expect, it } from 'vitest';
import {
  authorTotals,
  createEarningRow,
  earningsForAuthor,
  markEarningPaid,
  setEarningAmount,
  type EarningRow,
} from './guideEarnings';

const base: EarningRow = {
  id: 'e1',
  guideId: 'g1',
  guideTitle: '3 Days in Bagan',
  author: 'Thazin Win',
  publishedAt: '2026-11-22',
  amountUsd: null,
  amountSetAt: null,
  paid: false,
  paidAt: null,
};

const AT = new Date('2026-11-23T02:00:00.000Z');

describe('createEarningRow', () => {
  it('creates one unpaid, unrated row per guide', () => {
    const row = createEarningRow({ guideId: 'g1', author: 'Thazin Win', publishedAt: '2026-11-22', existing: [] });
    expect(row).toMatchObject({ guideId: 'g1', author: 'Thazin Win', amountUsd: null, paid: false, paidAt: null });
  });

  it('keeps the title the guide was published under', () => {
    const row = createEarningRow({ guideId: 'g1', guideTitle: '3 Days in Bagan', author: 'Thazin Win', publishedAt: '2026-11-22', existing: [] });
    expect(row?.guideTitle).toBe('3 Days in Bagan');
  });

  it('does not duplicate a guide that already has a row', () => {
    expect(createEarningRow({ guideId: 'g1', author: 'Thazin Win', publishedAt: '2026-11-22', existing: [base] })).toBeNull();
  });
});

describe('setEarningAmount', () => {
  it('records the amount Payment Admin sets, and when it was set', () => {
    const row = setEarningAmount([base], 'e1', 25, AT)[0];
    expect(row.amountUsd).toBe(25);
    expect(row.amountSetAt).toBe(AT.toISOString());
  });

  it('ignores an invalid amount', () => {
    const rows = [base];
    expect(setEarningAmount(rows, 'e1', -5)).toBe(rows);
    expect(setEarningAmount(rows, 'e1', Number.NaN)).toBe(rows);
  });
});

describe('markEarningPaid', () => {
  it('pays a row that carries an amount, and stamps the payout', () => {
    const row = markEarningPaid([{ ...base, amountUsd: 25 }], 'e1', AT)[0];
    expect(row.paid).toBe(true);
    expect(row.paidAt).toBe(AT.toISOString());
  });

  it('refuses to pay a row with no amount yet', () => {
    expect(markEarningPaid([base], 'e1')[0].paid).toBe(false);
  });
});

describe('earningsForAuthor', () => {
  it('narrows the list to one author, ignoring case and padding', () => {
    const rows = [base, { ...base, id: 'e2', guideId: 'g2', author: 'Aung Ko' }];
    expect(earningsForAuthor(rows, '  thazin win ').map((row) => row.id)).toEqual(['e1']);
  });

  it('shows nothing for an unknown author, so no row leaks', () => {
    expect(earningsForAuthor([base], '')).toEqual([]);
    expect(earningsForAuthor([base], 'Nobody')).toEqual([]);
  });
});

describe('authorTotals', () => {
  it('splits payable money from settled money and rows still waiting for an amount', () => {
    const rows: EarningRow[] = [
      { ...base, id: 'e1', guideId: 'g1', amountUsd: 25 },
      { ...base, id: 'e2', guideId: 'g2', amountUsd: 15 },
      { ...base, id: 'e3', guideId: 'g3' },
      { ...base, id: 'e4', guideId: 'g4', amountUsd: 10, paid: true },
    ];
    expect(authorTotals(rows)).toEqual([{ author: 'Thazin Win', payableUsd: 40, paidUsd: 10, pendingRows: 1 }]);
  });

  it('keeps each author apart', () => {
    const rows: EarningRow[] = [
      { ...base, id: 'e1', guideId: 'g1', amountUsd: 25 },
      { ...base, id: 'e2', guideId: 'g2', author: 'Aung Ko', amountUsd: 5, paid: true },
    ];
    expect(authorTotals(rows)).toEqual([
      { author: 'Thazin Win', payableUsd: 25, paidUsd: 0, pendingRows: 0 },
      { author: 'Aung Ko', payableUsd: 0, paidUsd: 5, pendingRows: 0 },
    ]);
  });
});
