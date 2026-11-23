import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_RENTAL_CATALOG,
  rentalCatalogProblems,
  type RentalBranch,
  type RentalCatalog,
  type RentalType,
  type RentalVariant,
} from '../data/rentalCatalog';

/**
 * Rental Admin edits (Plan §8) live here until the catalog tables exist.
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

/**
 * A catalog saved by an older build can lack fields added since (variants,
 * rates, the terms version, active/sortOrder). Filling them here keeps a stale
 * browser record usable instead of throwing the Admin's edits away.
 */
function normalizeType(type: RentalType, index: number): RentalType {
  const legacy = type as RentalType & { vehicleOptions?: RentalVariant[] };
  const variants = Array.isArray(type.variants) ? type.variants : (legacy.vehicleOptions ?? []);
  return {
    ...type,
    flow: type.flow ?? (variants.length > 0 ? 'driver_vehicle' : 'simple'),
    variants: variants.map((variant, position) => ({
      id: variant.id,
      label: variant.label,
      seats: variant.seats ?? null,
      rules: variant.rules ?? { mm: '', en: '' },
      active: variant.active ?? true,
      sortOrder: variant.sortOrder ?? position + 1,
      rateUsd: variant.rateUsd,
      foreignRateUsd: variant.foreignRateUsd,
    })),
    active: type.active ?? true,
    sortOrder: type.sortOrder ?? index + 1,
  };
}

function normalizeBranch(branch: RentalBranch): RentalBranch {
  return { ...branch, address: branch.address ?? '', phone: branch.phone ?? '' };
}

function normalizeCatalog(catalog: RentalCatalog): RentalCatalog {
  const terms = catalog.terms ?? DEFAULT_RENTAL_CATALOG.terms;
  const termsVersion = catalog.termsVersion ?? DEFAULT_RENTAL_CATALOG.termsVersion;
  const history = Array.isArray(catalog.termsHistory) ? catalog.termsHistory : [];
  return {
    termsVersion,
    terms,
    // A catalog saved before the history existed still needs the current
    // version in the list, or the Terms section would look empty.
    termsHistory: history.some((entry) => entry.version === termsVersion)
      ? history
      : [{ version: termsVersion, body: terms, publishedAt: new Date().toISOString() }, ...history],
    types: catalog.types.map(normalizeType),
    cities: catalog.cities.map((city) => ({ ...city, branches: city.branches.map(normalizeBranch) })),
    availability: catalog.availability,
    rates: Array.isArray(catalog.rates) ? catalog.rates : [],
    settings: catalog.settings ?? DEFAULT_RENTAL_CATALOG.settings,
  };
}

export function readRentalCatalog(): RentalCatalog {
  if (typeof window === 'undefined') return DEFAULT_RENTAL_CATALOG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RENTAL_CATALOG;
    const parsed: unknown = JSON.parse(raw);
    return isCatalog(parsed) ? normalizeCatalog(parsed) : DEFAULT_RENTAL_CATALOG;
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
