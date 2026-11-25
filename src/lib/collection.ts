import { useCallback, useEffect, useState } from 'react';

/**
 * Plan §16G.5 and §16F.4: each module keeps a local-preview adapter that the
 * server replaces without touching a call site. Every dashboard store is a
 * collection of rows under one key, so the read, the write, the cross-tab
 * sync and the hook are written once here instead of twelve times.
 *
 * A row is validated on read (`isRow`), because a stored row from an older
 * build must not crash a screen, and merged with its seed (`normalize`) so a
 * field added later does not discard the record.
 */

export interface Collection<T> {
  /** The rows as they stand now, seed included. */
  read: () => T[];
  /** Replaces every row and notifies this tab and the others. */
  write: (rows: T[]) => void;
  /** One row by id, or undefined. */
  find: (id: string) => T | undefined;
  /** Inserts or replaces one row, keeping the order of the rest. */
  upsert: (row: T) => T[];
  /** Drops one row. */
  remove: (id: string) => T[];
  /** Back to the seed. */
  reset: () => T[];
  key: string;
  event: string;
}

export interface CollectionOptions<T> {
  key: string;
  seed: readonly T[];
  id: (row: T) => string;
  isRow: (value: unknown) => value is T;
  /** Fills fields a stored row may predate. Returns the row to use. */
  normalize?: (row: T, seed: T | undefined) => T;
  /** Rows the seed has and storage does not are still shown, unless false. */
  mergeSeed?: boolean;
}

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createCollection<T>(options: CollectionOptions<T>): Collection<T> {
  const { key, seed, id, isRow, normalize, mergeSeed = true } = options;
  const event = `${key}-changed`;
  const seedRows = seed as T[];
  const seedById = new Map(seedRows.map((row) => [id(row), row]));

  function read(): T[] {
    const store = storage();
    if (!store) return seedRows;
    try {
      const raw = store.getItem(key);
      if (!raw) return seedRows;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return seedRows;
      const stored = parsed.filter(isRow).map((row) => (normalize ? normalize(row, seedById.get(id(row))) : row));
      if (!mergeSeed) return stored;
      const storedIds = new Set(stored.map(id));
      return [...stored, ...seedRows.filter((row) => !storedIds.has(id(row)))];
    } catch {
      return seedRows;
    }
  }

  function write(rows: T[]): void {
    const store = storage();
    if (!store) return;
    try {
      store.setItem(key, JSON.stringify(rows));
      window.dispatchEvent(new Event(event));
    } catch {
      // A full or blocked store must not take the screen down; the caller's
      // optimistic state still shows what it tried to save.
    }
  }

  return {
    key,
    event,
    read,
    write,
    find: (rowId) => read().find((row) => id(row) === rowId),
    upsert: (row) => {
      const rows = read();
      const at = rows.findIndex((existing) => id(existing) === id(row));
      const next = at === -1 ? [...rows, row] : rows.map((existing, index) => (index === at ? row : existing));
      write(next);
      return next;
    },
    remove: (rowId) => {
      const next = read().filter((row) => id(row) !== rowId);
      write(next);
      return next;
    },
    reset: () => {
      write(seedRows);
      return seedRows;
    },
  };
}

/** The hook every panel uses: the rows, a save, and a reset. */
export function useCollection<T>(collection: Collection<T>) {
  const [rows, setRows] = useState<T[]>(collection.read);

  useEffect(() => {
    const sync = () => setRows(collection.read());
    window.addEventListener(collection.event, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(collection.event, sync);
      window.removeEventListener('storage', sync);
    };
  }, [collection]);

  const save = useCallback(
    (next: T[]) => {
      collection.write(next);
      setRows(next);
    },
    [collection],
  );

  const reset = useCallback(() => {
    setRows(collection.reset());
  }, [collection]);

  return { rows, save, reset };
}

/** A short, sortable id: the same shape the seeded rows use. */
export function newId(prefix: string, now = Date.now()): string {
  return `${prefix}-${now.toString(36)}`;
}
