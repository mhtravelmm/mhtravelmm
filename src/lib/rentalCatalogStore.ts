import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_RENTAL_CATALOG, rentalCatalogProblems, type RentalCatalog } from '../data/rentalCatalog';

/**
 * Rental Admin edits (Plan §8 item 1) live here until the catalog tables exist.
 * The page and the panel read the same record, so an edit reaches a traveler
 * without a reload and without page code knowing what changed.
 */
const STORAGE_KEY = 'mh-travel-rental-catalog';
const CHANGED_EVENT = 'mh-travel-rental-catalog-changed';

function isCatalog(value: unknown): value is RentalCatalog {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<RentalCatalog>;
  return Array.isArray(record.types) && Array.isArray(record.cities) && typeof record.availability === 'object';
}

export function readRentalCatalog(): RentalCatalog {
  if (typeof window === 'undefined') return DEFAULT_RENTAL_CATALOG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RENTAL_CATALOG;
    const parsed: unknown = JSON.parse(raw);
    return isCatalog(parsed) ? parsed : DEFAULT_RENTAL_CATALOG;
  } catch {
    return DEFAULT_RENTAL_CATALOG;
  }
}

export function writeRentalCatalog(catalog: RentalCatalog): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function resetRentalCatalog(): RentalCatalog {
  writeRentalCatalog(DEFAULT_RENTAL_CATALOG);
  return DEFAULT_RENTAL_CATALOG;
}

/** True when the saved catalog still passes the rules the panel checks before saving. */
export function savedCatalogIsValid(): boolean {
  return rentalCatalogProblems(readRentalCatalog()).length === 0;
}

export function useRentalCatalog() {
  const [catalog, setCatalog] = useState<RentalCatalog>(readRentalCatalog);

  useEffect(() => {
    const sync = () => setCatalog(readRentalCatalog());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const save = useCallback((next: RentalCatalog) => {
    writeRentalCatalog(next);
    setCatalog(next);
  }, []);

  const reset = useCallback(() => {
    setCatalog(resetRentalCatalog());
  }, []);

  return { catalog, save, reset };
}
