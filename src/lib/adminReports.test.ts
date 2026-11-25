import { describe, expect, it } from 'vitest';
import {
  REPORT_DEFINITIONS,
  canRunReport,
  payoutDifference,
  payoutReconciles,
  reportDefinition,
  reportInRange,
  reportRangeValid,
  reportsForRole,
  type ReportId,
} from './adminReports';

/**
 * Plan §3A.13 and §16H.11. A report is only as good as its guard and its date
 * window, so both are tested here: a role never runs a report it is not listed
 * for, and an end before its start is refused rather than run backwards.
 */

describe('the report catalog (§3A.13)', () => {
  it('defines each report once, with columns and at least one role', () => {
    const ids = REPORT_DEFINITIONS.map((definition) => definition.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const definition of REPORT_DEFINITIONS) {
      expect(definition.columns.length, definition.id).toBeGreaterThan(0);
      expect(definition.roles.length, definition.id).toBeGreaterThan(0);
    }
  });

  it('finds a definition by id and returns nothing for an unknown one', () => {
    expect(reportDefinition('revenue')?.labelKey).toBe('sa_report_revenue');
    expect(reportDefinition('nope' as ReportId)).toBeUndefined();
  });

  it('lists only the reports the role may run', () => {
    const payment = reportsForRole('Payment Admin').map((definition) => definition.id);
    expect(payment).toContain('revenue');
    expect(payment).not.toContain('users');
  });

  it('refuses a report to a role that is not listed, and to nobody at all', () => {
    expect(canRunReport('Payment Admin', 'users')).toBe(false);
    expect(canRunReport('Super Admin', 'users')).toBe(true);
    expect(canRunReport(undefined, 'revenue')).toBe(false);
  });
});

describe('the report window (§3A.13)', () => {
  it('accepts a range whose end is the same day or later', () => {
    expect(reportRangeValid('2026-11-01', '2026-11-20')).toBe(true);
    expect(reportRangeValid('2026-11-20', '2026-11-20')).toBe(true);
  });

  it('refuses an end before the start, and a day that is not a date', () => {
    expect(reportRangeValid('2026-11-20', '2026-11-01')).toBe(false);
    expect(reportRangeValid('2026-11-20', 'tomorrow')).toBe(false);
  });

  it('includes both ends of the window', () => {
    expect(reportInRange('2026-11-01', '2026-11-01', '2026-11-20')).toBe(true);
    expect(reportInRange('2026-11-20', '2026-11-01', '2026-11-20')).toBe(true);
    expect(reportInRange('2026-11-21', '2026-11-01', '2026-11-20')).toBe(false);
  });
});

describe('payout reconciliation (§3A.9, §3A.13)', () => {
  it('reports the difference between the ledger and what was paid', () => {
    // Short by 50: the ledger says 1000 and the batch paid 950.
    expect(payoutDifference(1000, 950)).toBe(-50);
    expect(payoutDifference(950, 1000)).toBe(50);
  });

  it('reconciles only when the two agree to the cent', () => {
    expect(payoutReconciles(1000, 1000)).toBe(true);
    expect(payoutReconciles(1000, 999.99)).toBe(false);
  });
});
