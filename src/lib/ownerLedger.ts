import { myanmarToday } from './myanmarTime';
import { roundMmk } from './moneyFormat';

/**
 * Plan §9 and the §16D Phase 3 gate: "a payout run is reproducible from ledger
 * rows". The commission is deducted at payment time and its rate is snapshotted
 * on the row, so a later change to the shop's rate never rewrites history;
 * payouts run twice a month with a 50,000 MMK minimum that carries over.
 *
 * Everything here is a pure function over the rows, so the store, the panel and
 * the future server all compute the same number from the same input.
 */

export type LedgerRowKind = 'sale' | 'refund';

export interface LedgerRow {
  id: string;
  kind: LedgerRowKind;
  shopId: string;
  shopName: string;
  ownerName: string;
  /** The transaction this row settles. One row per transaction, ever. */
  bookingRef: string;
  /** The Myanmar calendar day the traveler's payment was recorded. */
  paidDay: string;
  /** What the traveler paid, before commission. Negative for a refund. */
  grossMmk: number;
  /** §9: snapshotted here, so the shop's current rate cannot change this row. */
  commissionPercent: number;
  commissionMmk: number;
  /** `grossMmk - commissionMmk`; what the owner is owed. */
  netMmk: number;
  /** The run that settled this row, or null while it is still owed. */
  payoutId: string | null;
  createdAt: string;
}

/** §9: "Minimum 50,000 MMK, carried over until met." */
export const MINIMUM_PAYOUT_MMK = 50000;

export interface PayoutWindow {
  /** First day of the half-month the earnings were made in. */
  startDay: string;
  /** Last day of that half-month; a day after it belongs to the next window. */
  endDay: string;
  /** The day the money is due. Also the window's identity. */
  dueDay: string;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1 };
}

/**
 * §9: "Day 1 to 15 earnings are paid on the 20th, Day 16 to month end earnings
 * are paid on the 5th of the next month."
 */
export function payoutWindowFor(day: string): PayoutWindow {
  const [year, month, date] = day.split('-').map(Number);
  if (date <= 15) {
    return {
      startDay: `${year}-${pad(month)}-01`,
      endDay: `${year}-${pad(month)}-15`,
      dueDay: `${year}-${pad(month)}-20`,
    };
  }
  const next = shiftMonth(year, month, 1);
  return {
    startDay: `${year}-${pad(month)}-16`,
    endDay: `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`,
    dueDay: `${next.year}-${pad(next.month)}-05`,
  };
}

/** The windows a run could be made for, newest first, going back `months`. */
export function recentWindows(today: string, months = 3): PayoutWindow[] {
  const [year, month] = today.split('-').map(Number);
  const windows: PayoutWindow[] = [];
  for (let back = 0; back < months; back += 1) {
    const { year: y, month: m } = shiftMonth(year, month, -back);
    windows.push(payoutWindowFor(`${y}-${pad(m)}-01`), payoutWindowFor(`${y}-${pad(m)}-16`));
  }
  return windows.sort((a, b) => b.dueDay.localeCompare(a.dueDay));
}

/**
 * A run pays everything already due, so it settles against the most recent
 * window whose due day has arrived. A row left unpaid earlier is still in that
 * set, which is how the minimum carries over without a separate ledger entry.
 */
export function latestDueWindow(now = new Date()): PayoutWindow {
  const today = myanmarToday(now);
  const candidates = recentWindows(today).filter((window) => window.dueDay <= today);
  return candidates[0] ?? payoutWindowFor(today);
}

export interface PayoutPlan {
  shopId: string;
  shopName: string;
  ownerName: string;
  window: PayoutWindow;
  /** The rows this run would settle, oldest first. */
  rowIds: string[];
  grossMmk: number;
  commissionMmk: number;
  netMmk: number;
  /** False when the total is under the minimum; the rows stay owed. */
  payable: boolean;
}

function totalsFor(rows: LedgerRow[]): { grossMmk: number; commissionMmk: number; netMmk: number } {
  let grossMmk = 0;
  let commissionMmk = 0;
  let netMmk = 0;
  for (const row of rows) {
    grossMmk += row.grossMmk;
    commissionMmk += row.commissionMmk;
    netMmk += row.netMmk;
  }
  return { grossMmk: roundMmk(grossMmk), commissionMmk: roundMmk(commissionMmk), netMmk: roundMmk(netMmk) };
}

/**
 * What a run for this shop and window would settle. Every unpaid row whose own
 * window was due by then is included, so an earlier shortfall rolls forward.
 */
export function planPayout(rows: LedgerRow[], shopId: string, window: PayoutWindow): PayoutPlan {
  const selected = rows
    .filter((row) => row.shopId === shopId && row.payoutId === null)
    .filter((row) => payoutWindowFor(row.paidDay).dueDay <= window.dueDay)
    .sort((a, b) => a.paidDay.localeCompare(b.paidDay) || a.id.localeCompare(b.id));
  const totals = totalsFor(selected);
  const first = selected[0];
  return {
    shopId,
    shopName: first?.shopName ?? recordsShopName(rows, shopId),
    ownerName: first?.ownerName ?? recordsOwnerName(rows, shopId),
    window,
    rowIds: selected.map((row) => row.id),
    ...totals,
    payable: totals.netMmk >= MINIMUM_PAYOUT_MMK,
  };
}

function recordsShopName(rows: LedgerRow[], shopId: string): string {
  return rows.find((row) => row.shopId === shopId)?.shopName ?? shopId;
}

function recordsOwnerName(rows: LedgerRow[], shopId: string): string {
  return rows.find((row) => row.shopId === shopId)?.ownerName ?? '';
}

/**
 * One plan per shop that still owes something, for the window a run would use
 * today. A shop with nothing unpaid is left out rather than shown at zero.
 */
export function duePayouts(rows: LedgerRow[], now = new Date()): PayoutPlan[] {
  const window = latestDueWindow(now);
  const shops = [...new Set(rows.filter((row) => row.payoutId === null).map((row) => row.shopId))];
  return shops
    .map((shopId) => planPayout(rows, shopId, window))
    .filter((plan) => plan.rowIds.length > 0)
    .sort((a, b) => b.netMmk - a.netMmk);
}

export interface PayoutRun {
  /** One run per shop per window, so a second click cannot pay twice. */
  id: string;
  shopId: string;
  shopName: string;
  ownerName: string;
  window: PayoutWindow;
  rowIds: string[];
  grossMmk: number;
  commissionMmk: number;
  netMmk: number;
  runAt: string;
  runBy: string;
}

export function payoutRunId(shopId: string, window: PayoutWindow): string {
  return `payout-${shopId}-${window.dueDay}`;
}

/** A run carries its own totals so the statement reads without recomputing. */
export function createPayoutRun(plan: PayoutPlan, actor: string, at = new Date()): PayoutRun | null {
  if (!plan.payable || plan.rowIds.length === 0) return null;
  return {
    id: payoutRunId(plan.shopId, plan.window),
    shopId: plan.shopId,
    shopName: plan.shopName,
    ownerName: plan.ownerName,
    window: plan.window,
    rowIds: [...plan.rowIds],
    grossMmk: plan.grossMmk,
    commissionMmk: plan.commissionMmk,
    netMmk: plan.netMmk,
    runAt: at.toISOString(),
    runBy: actor,
  };
}

/** Settles the rows a run names. A row already settled keeps its first run. */
export function markRowsPaid(rows: LedgerRow[], run: PayoutRun): LedgerRow[] {
  const ids = new Set(run.rowIds);
  return rows.map((row) => (ids.has(row.id) && row.payoutId === null ? { ...row, payoutId: run.id } : row));
}

/**
 * The Phase 3 gate. A run is reproducible when replaying it from the ledger
 * rows gives back the total it was made with; a mismatch means a row was edited
 * after the fact, which the append-only ledger must never allow.
 */
export interface PayoutReplay {
  rowIds: string[];
  missingRowIds: string[];
  grossMmk: number;
  commissionMmk: number;
  netMmk: number;
  matches: boolean;
}

export function replayPayout(rows: LedgerRow[], run: PayoutRun): PayoutReplay {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const settled = run.rowIds.map((id) => byId.get(id)).filter((row): row is LedgerRow => Boolean(row));
  const missingRowIds = run.rowIds.filter((id) => !byId.has(id));
  const totals = totalsFor(settled);
  return {
    rowIds: settled.map((row) => row.id),
    missingRowIds,
    ...totals,
    matches:
      missingRowIds.length === 0 &&
      totals.grossMmk === run.grossMmk &&
      totals.commissionMmk === run.commissionMmk &&
      totals.netMmk === run.netMmk,
  };
}

/**
 * §9: "fully Admin-discretion ... can differ shop by shop including 0%". No
 * row means no commission: MH never invents a charge a shop was not given.
 */
export interface CommissionSetting {
  shopId: string;
  percent: number;
  updatedAt: string;
  updatedBy: string;
}

export function commissionFor(settings: CommissionSetting[], shopId: string): number {
  return settings.find((setting) => setting.shopId === shopId)?.percent ?? 0;
}

export function setCommission(
  settings: CommissionSetting[],
  shopId: string,
  percent: number,
  actor: string,
  at = new Date(),
): CommissionSetting[] {
  if (!Number.isFinite(percent)) return settings;
  const bounded = Math.min(100, Math.max(0, percent));
  const next: CommissionSetting = { shopId, percent: bounded, updatedAt: at.toISOString(), updatedBy: actor };
  const others = settings.filter((setting) => setting.shopId !== shopId);
  return [...others, next].sort((a, b) => a.shopId.localeCompare(b.shopId));
}

export function commissionMmkFor(grossMmk: number, percent: number): number {
  return roundMmk((grossMmk * percent) / 100);
}

export interface SaleInput {
  bookingRef: string;
  kind?: LedgerRowKind;
  shopId: string;
  shopName: string;
  ownerName: string;
  /** The traveler's payment day; a refund books against the day it was issued. */
  paidDay: string;
  grossMmk: number;
  /** Read from the shop's setting at this moment and frozen on the row. */
  commissionPercent: number;
}

/**
 * Deducts the commission at payment time (§9) and snapshots the rate. Returns
 * null when this transaction already has a row, so a payment recorded twice
 * cannot pay the owner twice.
 */
export function createSaleRow(
  rows: LedgerRow[],
  input: SaleInput,
  at = new Date(),
): LedgerRow | null {
  if (rows.some((row) => row.bookingRef === input.bookingRef)) return null;
  const kind = input.kind ?? 'sale';
  const gross = roundMmk(input.grossMmk);
  const commission = roundMmk((gross * Math.min(100, Math.max(0, input.commissionPercent))) / 100);
  return {
    id: `ledger-${input.bookingRef}`,
    kind,
    shopId: input.shopId,
    shopName: input.shopName,
    ownerName: input.ownerName,
    bookingRef: input.bookingRef,
    paidDay: input.paidDay,
    grossMmk: gross,
    commissionPercent: input.commissionPercent,
    commissionMmk: commission,
    netMmk: roundMmk(gross - commission),
    payoutId: null,
    createdAt: at.toISOString(),
  };
}

export interface LedgerStatement {
  grossMmk: number;
  commissionMmk: number;
  netMmk: number;
  paidMmk: number;
  owedMmk: number;
  /** Owed but under the minimum, so it will roll into a later run. */
  carriedMmk: number;
  runs: PayoutRun[];
  rows: LedgerRow[];
}

/**
 * §16B.1 gives Owner Admin `O (own earnings)`, so the owner reads a statement
 * rather than the platform's ledger. It is scoped by `shopId` here so the panel
 * has no way to ask for another shop's money.
 */
export function statementFor(rows: LedgerRow[], runs: PayoutRun[], shopId: string): LedgerStatement {
  const mine = rows
    .filter((row) => row.shopId === shopId)
    .sort((a, b) => b.paidDay.localeCompare(a.paidDay) || a.id.localeCompare(b.id));
  const totals = totalsFor(mine);
  const paidRows = mine.filter((row) => row.payoutId !== null);
  const owedRows = mine.filter((row) => row.payoutId === null);
  const paidMmk = totalsFor(paidRows).netMmk;
  const owedMmk = totalsFor(owedRows).netMmk;
  return {
    ...totals,
    paidMmk,
    owedMmk,
    carriedMmk: owedMmk < MINIMUM_PAYOUT_MMK ? owedMmk : 0,
    runs: runs
      .filter((run) => run.shopId === shopId)
      .sort((a, b) => b.runAt.localeCompare(a.runAt)),
    rows: mine,
  };
}

/** The next two due dates, which is what the panel tells the owner to expect. */
export function upcomingDueDays(now = new Date()): string[] {
  const today = myanmarToday(now);
  const [year, month] = today.split('-').map(Number);
  const upcoming: string[] = [];
  // Windows are listed backwards for the run, so the forward list is built from
  // this month and the next one; two months always hold at least two due days.
  for (let ahead = 0; ahead <= 1; ahead += 1) {
    const { year: y, month: m } = shiftMonth(year, month, ahead);
    upcoming.push(payoutWindowFor(`${y}-${pad(m)}-01`).dueDay, payoutWindowFor(`${y}-${pad(m)}-16`).dueDay);
  }
  return upcoming.filter((day) => day > today).sort().slice(0, 2);
}
