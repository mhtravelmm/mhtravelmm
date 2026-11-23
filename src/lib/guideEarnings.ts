/**
 * Plan §10 item 5: every published guide creates an earning row for its author.
 * The per-post rate is not decided yet, so a row starts unpaid and unrated;
 * an Admin sets the amount later and the row becomes payable.
 */
export interface EarningRow {
  id: string;
  guideId: string;
  /** Title at publication time, so the row still reads after the guide is renamed. */
  guideTitle: string;
  author: string;
  publishedAt: string;
  amountUsd: number | null;
  /** When Payment Admin set the amount, and when the row was settled. */
  amountSetAt: string | null;
  paid: boolean;
  paidAt: string | null;
}

export function createEarningRow(input: {
  guideId: string;
  author: string;
  publishedAt: string;
  existing: EarningRow[];
  guideTitle?: string;
}): EarningRow | null {
  if (input.existing.some((row) => row.guideId === input.guideId)) return null;
  return {
    id: `earn-${input.guideId}`,
    guideId: input.guideId,
    guideTitle: input.guideTitle ?? '',
    author: input.author,
    publishedAt: input.publishedAt,
    amountUsd: null,
    amountSetAt: null,
    paid: false,
    paidAt: null,
  };
}

/** An Admin sets the per-post amount; a negative or non-finite value is ignored. */
export function setEarningAmount(rows: EarningRow[], id: string, amountUsd: number, at = new Date()): EarningRow[] {
  if (!Number.isFinite(amountUsd) || amountUsd < 0) return rows;
  return rows.map((row) => (row.id === id ? { ...row, amountUsd, amountSetAt: at.toISOString() } : row));
}

/** A row can be paid only once it carries an amount. */
export function markEarningPaid(rows: EarningRow[], id: string, at = new Date()): EarningRow[] {
  return rows.map((row) =>
    row.id === id && row.amountUsd !== null ? { ...row, paid: true, paidAt: at.toISOString() } : row,
  );
}

/**
 * Plan §16B.1: a Guide Content Admin reads only their own rows, so the list is
 * narrowed by author. Every other role that reaches this section reads all of
 * them, which the caller decides before calling.
 */
export function earningsForAuthor(rows: EarningRow[], author: string): EarningRow[] {
  const key = author.trim().toLowerCase();
  if (!key) return [];
  return rows.filter((row) => row.author.trim().toLowerCase() === key);
}

export function authorTotals(rows: EarningRow[]): { author: string; payableUsd: number; paidUsd: number; pendingRows: number }[] {
  const totals = new Map<string, { author: string; payableUsd: number; paidUsd: number; pendingRows: number }>();
  for (const row of rows) {
    const current = totals.get(row.author) ?? { author: row.author, payableUsd: 0, paidUsd: 0, pendingRows: 0 };
    if (row.amountUsd === null) current.pendingRows += 1;
    else if (row.paid) current.paidUsd += row.amountUsd;
    else current.payableUsd += row.amountUsd;
    totals.set(row.author, current);
  }
  return [...totals.values()];
}
