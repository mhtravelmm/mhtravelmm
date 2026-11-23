import { useCallback, useEffect, useState } from 'react';
import { TRAVEL_GUIDE_STORIES } from '../data/travelGuideData';
import {
  createEarningRow,
  markEarningPaid,
  setEarningAmount,
  type EarningRow,
} from './guideEarnings';

/**
 * Plan §16B.1 gives guide earnings to Payment Admin (set the amount, mark paid)
 * and the author's own rows to Guide Content Admin. Both roles open the same
 * section from different sessions, so the rows cannot live in the Guides
 * panel's component state the way they used to. This store is the seam where
 * the `guide_earnings` table replaces browser storage.
 */
const STORAGE_KEY = 'mh-travel-guide-earnings';
const CHANGED_EVENT = 'mh-travel-guide-earnings-changed';

/** Every seeded guide is published, so each one owes its author a row. */
function seedRows(): EarningRow[] {
  const rows: EarningRow[] = [];
  for (const guide of TRAVEL_GUIDE_STORIES) {
    const row = createEarningRow({
      guideId: guide.id,
      guideTitle: guide.localizedTitle.en,
      author: guide.author.en,
      publishedAt: guide.publishedAt,
      existing: rows,
    });
    if (row) rows.push(row);
  }
  return rows;
}

function isRow(value: unknown): value is EarningRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<EarningRow>;
  return typeof row.id === 'string' && typeof row.guideId === 'string' && typeof row.author === 'string';
}

/** A row saved by an earlier build lacks the timestamps, so they are filled in. */
function normalizeRow(row: EarningRow): EarningRow {
  return {
    ...row,
    guideTitle: row.guideTitle ?? '',
    amountSetAt: row.amountSetAt ?? null,
    paid: row.paid ?? false,
    paidAt: row.paidAt ?? null,
  };
}

export function readGuideEarnings(): EarningRow[] {
  if (typeof window === 'undefined') return seedRows();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return seedRows();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRow).map(normalizeRow) : seedRows();
  } catch {
    return seedRows();
  }
}

export function writeGuideEarnings(rows: EarningRow[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/**
 * Adds a row for a guide that has just been published. A guide that already has
 * one is left alone, so republishing cannot pay the same post twice.
 */
export function addEarningForGuide(input: {
  guideId: string;
  guideTitle: string;
  author: string;
  publishedAt: string;
}): EarningRow[] {
  const current = readGuideEarnings();
  const row = createEarningRow({ ...input, existing: current });
  const next = row ? [row, ...current] : current;
  if (row) writeGuideEarnings(next);
  return next;
}

export function useGuideEarnings() {
  const [rows, setRows] = useState<EarningRow[]>(readGuideEarnings);

  useEffect(() => {
    const sync = () => setRows(readGuideEarnings());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setAmount = useCallback((id: string, amountUsd: number) => {
    const next = setEarningAmount(readGuideEarnings(), id, amountUsd);
    writeGuideEarnings(next);
    setRows(next);
    return next;
  }, []);

  const markPaid = useCallback((id: string) => {
    const next = markEarningPaid(readGuideEarnings(), id);
    writeGuideEarnings(next);
    setRows(next);
    return next;
  }, []);

  return { rows, setAmount, markPaid };
}
