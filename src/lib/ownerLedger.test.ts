import { describe, expect, it } from 'vitest';
import {
  MINIMUM_PAYOUT_MMK,
  commissionFor,
  commissionMmkFor,
  createPayoutRun,
  createSaleRow,
  duePayouts,
  latestDueWindow,
  markRowsPaid,
  payoutWindowFor,
  planPayout,
  recentWindows,
  replayPayout,
  setCommission,
  statementFor,
  upcomingDueDays,
  type CommissionSetting,
  type LedgerRow,
  type PayoutWindow,
} from './ownerLedger';

const NOW = new Date('2026-11-20T03:00:00.000Z');

function sale(overrides: Partial<LedgerRow> = {}): LedgerRow {
  return {
    id: 'ledger-BKG-1',
    kind: 'sale',
    shopId: 'rangoon_house',
    shopName: 'The Rangoon House',
    ownerName: 'The Rangoon House',
    bookingRef: 'BKG-1',
    paidDay: '2026-11-02',
    grossMmk: 100000,
    commissionPercent: 10,
    commissionMmk: 10000,
    netMmk: 90000,
    payoutId: null,
    createdAt: NOW.toISOString(),
    ...overrides,
  };
}

describe('payout windows (Plan §9)', () => {
  it('pays the first half of a month on the 20th', () => {
    expect(payoutWindowFor('2026-11-01')).toEqual({ startDay: '2026-11-01', endDay: '2026-11-15', dueDay: '2026-11-20' });
    expect(payoutWindowFor('2026-11-15').dueDay).toBe('2026-11-20');
  });

  it('pays the second half on the 5th of the next month', () => {
    expect(payoutWindowFor('2026-11-16')).toEqual({ startDay: '2026-11-16', endDay: '2026-11-30', dueDay: '2026-12-05' });
    expect(payoutWindowFor('2026-11-30').dueDay).toBe('2026-12-05');
  });

  it('rolls the year over and knows a short month', () => {
    expect(payoutWindowFor('2026-12-20').dueDay).toBe('2027-01-05');
    expect(payoutWindowFor('2026-02-20').endDay).toBe('2026-02-28');
  });

  it('lists the windows newest first, then picks the latest due', () => {
    const windows = recentWindows('2026-11-20');
    expect(windows[0].dueDay >= windows[1].dueDay).toBe(true);
    expect(latestDueWindow(NOW).dueDay).toBe('2026-11-20');
  });

  it('does not treat a window as due before its day', () => {
    // 19 November: the 20th has not arrived, so the earlier window is latest.
    expect(latestDueWindow(new Date('2026-11-19T03:00:00.000Z')).dueDay).toBe('2026-11-05');
  });
});

describe('commission (Plan §9)', () => {
  it('defaults to 0% when a shop has no setting', () => {
    expect(commissionFor([], 'rangoon_house')).toBe(0);
  });

  it('clamps a setting to 0-100 and replaces the old one', () => {
    const settings = setCommission([], 'rangoon_house', 250, 'Payment Admin', NOW);
    expect(settings).toEqual([{ shopId: 'rangoon_house', percent: 100, updatedAt: NOW.toISOString(), updatedBy: 'Payment Admin' }]);
    const lowered = setCommission(settings, 'rangoon_house', -5, 'Payment Admin', NOW);
    expect(lowered[0].percent).toBe(0);
  });

  it('ignores a non-finite percent rather than writing NaN', () => {
    const settings: CommissionSetting[] = [{ shopId: 's1', percent: 10, updatedAt: NOW.toISOString(), updatedBy: 'x' }];
    expect(setCommission(settings, 's1', Number.NaN, 'x', NOW)).toBe(settings);
  });

  it('rounds the commission to the nearest 100 MMK, like every other amount', () => {
    expect(commissionMmkFor(10345, 10)).toBe(1000);
    expect(commissionMmkFor(0, 50)).toBe(0);
  });
});

describe('createSaleRow (Plan §9 commission snapshot)', () => {
  it('freezes the rate on the row', () => {
    const row = createSaleRow([], {
      bookingRef: 'BKG-7',
      shopId: 'rangoon_house',
      shopName: 'The Rangoon House',
      ownerName: 'The Rangoon House',
      paidDay: '2026-11-02',
      grossMmk: 200000,
      commissionPercent: 15,
    }, NOW);
    expect(row).toMatchObject({ grossMmk: 200000, commissionPercent: 15, commissionMmk: 30000, netMmk: 170000 });
  });

  it('is immutable under a later rate change, because the percent is stored', () => {
    const row = createSaleRow([], {
      bookingRef: 'BKG-8',
      shopId: 's1',
      shopName: 'Shop',
      ownerName: 'Owner',
      paidDay: '2026-11-02',
      grossMmk: 100000,
      commissionPercent: 10,
    }, NOW)!;
    const settings = setCommission([], 's1', 40, 'Super Admin', NOW);
    // The row keeps 10%: the shop's new rate applies only to new sales.
    expect(row.commissionMmk).toBe(10000);
    expect(commissionFor(settings, 's1')).toBe(40);
    expect(commissionMmkFor(row.grossMmk, row.commissionPercent)).toBe(row.commissionMmk);
  });

  it('refuses a transaction that already has a row', () => {
    const existing = [sale({ bookingRef: 'BKG-1' })];
    const again = createSaleRow(existing, {
      bookingRef: 'BKG-1',
      shopId: 'rangoon_house',
      shopName: 'The Rangoon House',
      ownerName: 'The Rangoon House',
      paidDay: '2026-11-02',
      grossMmk: 999,
      commissionPercent: 10,
    }, NOW);
    expect(again).toBeNull();
  });

  it('books a refund as a negative row', () => {
    const row = createSaleRow([], {
      bookingRef: 'BKG-9',
      kind: 'refund',
      shopId: 's1',
      shopName: 'Shop',
      ownerName: 'Owner',
      paidDay: '2026-11-03',
      grossMmk: -50000,
      commissionPercent: 10,
    }, NOW);
    expect(row).toMatchObject({ grossMmk: -50000, commissionMmk: -5000, netMmk: -45000 });
  });
});

describe('planPayout (Plan §9 minimum and carry-over)', () => {
  const window: PayoutWindow = { startDay: '2026-11-01', endDay: '2026-11-15', dueDay: '2026-11-20' };

  it('selects only the rows whose own window is due', () => {
    const rows = [
      sale({ id: 'a', bookingRef: 'BKG-1', paidDay: '2026-11-02', netMmk: 90000, commissionMmk: 10000, grossMmk: 100000 }),
      // The second half of November is due on 5 December, not the 20th.
      sale({ id: 'b', bookingRef: 'BKG-2', paidDay: '2026-11-20', netMmk: 90000 }),
    ];
    const plan = planPayout(rows, 'rangoon_house', window);
    expect(plan.rowIds).toEqual(['a']);
  });

  it('is not payable under the minimum', () => {
    const rows = [sale({ id: 'a', netMmk: 40000, commissionMmk: 10000, grossMmk: 50000 })];
    const plan = planPayout(rows, 'rangoon_house', window);
    expect(plan.netMmk).toBe(40000);
    expect(plan.netMmk).toBeLessThan(MINIMUM_PAYOUT_MMK);
    expect(plan.payable).toBe(false);
  });

  it('becomes payable the moment the carry-over crosses the minimum', () => {
    const rows = [
      sale({ id: 'a', bookingRef: 'BKG-1', paidDay: '2026-11-02', netMmk: 30000, commissionMmk: 0, grossMmk: 30000 }),
      sale({ id: 'b', bookingRef: 'BKG-2', paidDay: '2026-11-10', netMmk: 15000, commissionMmk: 0, grossMmk: 15000 }),
    ];
    expect(planPayout(rows, 'rangoon_house', window).payable).toBe(false);
    const later = [...rows, sale({ id: 'c', bookingRef: 'BKG-3', paidDay: '2026-11-12', netMmk: 6000, commissionMmk: 0, grossMmk: 6000 })];
    expect(planPayout(later, 'rangoon_house', window).payable).toBe(true);
  });

  it('carries an earlier shortfall into the next run instead of losing it', () => {
    const rows = [
      // October second half, due 5 November: short on its own.
      sale({ id: 'oct', bookingRef: 'BKG-1', paidDay: '2026-10-20', netMmk: 20000, commissionMmk: 0, grossMmk: 20000 }),
      sale({ id: 'nov', bookingRef: 'BKG-2', paidDay: '2026-11-03', netMmk: 40000, commissionMmk: 0, grossMmk: 40000 }),
    ];
    const plan = planPayout(rows, 'rangoon_house', window);
    expect(plan.rowIds).toEqual(['oct', 'nov']);
    expect(plan.netMmk).toBe(60000);
    expect(plan.payable).toBe(true);
  });

  it('leaves a settled row out of the next run', () => {
    const rows = [
      sale({ id: 'a', paidDay: '2026-11-02', netMmk: 60000, commissionMmk: 0, grossMmk: 60000 }),
      sale({ id: 'b', bookingRef: 'BKG-2', paidDay: '2026-11-04', netMmk: 60000, commissionMmk: 0, grossMmk: 60000, payoutId: 'payout-old' }),
    ];
    expect(planPayout(rows, 'rangoon_house', window).rowIds).toEqual(['a']);
  });

  it('never mixes two shops', () => {
    const rows = [
      sale({ id: 'a', shopId: 'rangoon_house', netMmk: 60000, commissionMmk: 0, grossMmk: 60000 }),
      sale({ id: 'b', shopId: 'mandalay_booknook', bookingRef: 'BKG-2', netMmk: 60000, commissionMmk: 0, grossMmk: 60000 }),
    ];
    expect(planPayout(rows, 'rangoon_house', window).rowIds).toEqual(['a']);
    expect(planPayout(rows, 'mandalay_booknook', window).rowIds).toEqual(['b']);
  });
});

describe('duePayouts', () => {
  it('returns one plan per shop with money owed', () => {
    const rows = [
      sale({ id: 'a', shopId: 'rangoon_house', paidDay: '2026-10-20', netMmk: 60000, commissionMmk: 0, grossMmk: 60000 }),
      sale({ id: 'b', shopId: 'mandalay_booknook', bookingRef: 'BKG-2', paidDay: '2026-10-20', netMmk: 70000, commissionMmk: 0, grossMmk: 70000 }),
    ];
    const plans = duePayouts(rows, NOW);
    expect(plans.map((plan) => plan.shopId)).toEqual(['mandalay_booknook', 'rangoon_house']);
  });

  it('leaves out a shop that owes nothing', () => {
    const rows = [sale({ id: 'a', payoutId: 'payout-old', netMmk: 60000 })];
    expect(duePayouts(rows, NOW)).toEqual([]);
  });
});

describe('createPayoutRun and replayPayout (the §16D Phase 3 gate)', () => {
  const rows = [
    sale({ id: 'a', bookingRef: 'BKG-1', paidDay: '2026-11-02', grossMmk: 100000, commissionMmk: 10000, netMmk: 90000 }),
    sale({ id: 'b', bookingRef: 'BKG-2', paidDay: '2026-11-09', grossMmk: 200000, commissionMmk: 20000, netMmk: 180000 }),
  ];
  const window: PayoutWindow = { startDay: '2026-11-01', endDay: '2026-11-15', dueDay: '2026-11-20' };

  it('writes no run under the minimum', () => {
    const plan = planPayout([sale({ netMmk: 100 })], 'rangoon_house', window);
    expect(createPayoutRun(plan, 'Payment Admin', NOW)).toBeNull();
  });

  it('carries its own totals and names its window', () => {
    const run = createPayoutRun(planPayout(rows, 'rangoon_house', window), 'Payment Admin', NOW)!;
    expect(run.id).toBe('payout-rangoon_house-2026-11-20');
    expect(run).toMatchObject({ grossMmk: 300000, commissionMmk: 30000, netMmk: 270000, runBy: 'Payment Admin' });
  });

  it('replays to the totals it was made with', () => {
    const run = createPayoutRun(planPayout(rows, 'rangoon_house', window), 'Payment Admin', NOW)!;
    const settled = markRowsPaid(rows, run);
    const replay = replayPayout(settled, run);
    expect(replay.matches).toBe(true);
    expect(replay.netMmk).toBe(run.netMmk);
    expect(replay.missingRowIds).toEqual([]);
  });

  it('reports a mismatch when a row was rewritten after the money left', () => {
    const run = createPayoutRun(planPayout(rows, 'rangoon_house', window), 'Payment Admin', NOW)!;
    const tampered = rows.map((row) => (row.id === 'a' ? { ...row, netMmk: 1, payoutId: run.id } : { ...row, payoutId: run.id }));
    expect(replayPayout(tampered, run).matches).toBe(false);
  });

  it('reports a row that disappeared rather than pretending it matched', () => {
    const run = createPayoutRun(planPayout(rows, 'rangoon_house', window), 'Payment Admin', NOW)!;
    const replay = replayPayout(markRowsPaid([rows[0]], run), run);
    expect(replay.missingRowIds).toEqual(['b']);
    expect(replay.matches).toBe(false);
  });

  it('settles each row once, so a second run for the same window finds nothing', () => {
    const run = createPayoutRun(planPayout(rows, 'rangoon_house', window), 'Payment Admin', NOW)!;
    const settled = markRowsPaid(rows, run);
    expect(planPayout(settled, 'rangoon_house', window).rowIds).toEqual([]);
    expect(duePayouts(settled, NOW)).toEqual([]);
  });
});

describe('statementFor (Plan §16B.1 own earnings)', () => {
  it('splits paid from owed and reports a carry-over', () => {
    const rows = [
      sale({ id: 'a', netMmk: 60000, paidDay: '2026-10-20', payoutId: 'payout-x' }),
      sale({ id: 'b', bookingRef: 'BKG-2', netMmk: 20000, paidDay: '2026-11-02', commissionMmk: 0, grossMmk: 20000 }),
    ];
    const run = {
      id: 'payout-x',
      shopId: 'rangoon_house',
      shopName: 'The Rangoon House',
      ownerName: 'The Rangoon House',
      window: payoutWindowFor('2026-10-20'),
      rowIds: ['a'],
      grossMmk: 60000,
      commissionMmk: 0,
      netMmk: 60000,
      runAt: NOW.toISOString(),
      runBy: 'Payment Admin',
    };
    const statement = statementFor(rows, [run], 'rangoon_house');
    expect(statement.paidMmk).toBe(60000);
    expect(statement.owedMmk).toBe(20000);
    expect(statement.carriedMmk).toBe(20000);
    expect(statement.runs).toHaveLength(1);
  });

  it('shows nothing for another shop', () => {
    const statement = statementFor([sale()], [], 'mandalay_booknook');
    expect(statement.rows).toEqual([]);
    expect(statement.owedMmk).toBe(0);
  });
});

describe('upcomingDueDays', () => {
  it('gives the next two payout dates', () => {
    const days = upcomingDueDays(new Date('2026-11-10T03:00:00.000Z'));
    expect(days).toEqual(['2026-11-20', '2026-12-05']);
  });
});
