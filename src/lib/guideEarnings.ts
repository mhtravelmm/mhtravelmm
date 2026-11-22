/**
 * Plan §10 item 5: every published guide creates an earning row for its author.
 * The per-post rate is not decided yet, so a row starts unpaid and unrated;
 * an Admin sets the amount later and the row becomes payable.
 */
export interface EarningRow {
  id: string;
  guideId: string;
  author: string;
  publishedAt: string;
  amountUsd: number | null;
  paid: boolean;
}

export function createEarningRow(input: { guideId: string; author: string; publishedAt: string; existing: EarningRow[] }): EarningRow | null {
  if (input.existing.some((row) => row.guideId === input.guideId)) return null;
  return {
    id: `earn-${input.guideId}-${Date.now()}`,
    guideId: input.guideId,
    author: input.author,
    publishedAt: input.publishedAt,
    amountUsd: null,
    paid: false,
  };
}

/** An Admin sets the per-post amount; a negative or non-finite value is ignored. */
export function setEarningAmount(rows: EarningRow[], id: string, amountUsd: number): EarningRow[] {
  if (!Number.isFinite(amountUsd) || amountUsd < 0) return rows;
  return rows.map((row) => (row.id === id ? { ...row, amountUsd } : row));
}

/** A row can be paid only once it carries an amount. */
export function markEarningPaid(rows: EarningRow[], id: string): EarningRow[] {
  return rows.map((row) => (row.id === id && row.amountUsd !== null ? { ...row, paid: true } : row));
}

export function authorTotals(rows: EarningRow[]): { author: string; payableUsd: number; pendingRows: number }[] {
  const totals = new Map<string, { author: string; payableUsd: number; pendingRows: number }>();
  for (const row of rows) {
    const current = totals.get(row.author) ?? { author: row.author, payableUsd: 0, pendingRows: 0 };
    if (row.amountUsd === null) current.pendingRows += 1;
    else if (!row.paid) current.payableUsd += row.amountUsd;
    totals.set(row.author, current);
  }
  return [...totals.values()];
}
