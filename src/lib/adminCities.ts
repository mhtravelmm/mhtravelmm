import { createCollection } from './collection';

/**
 * Plan §3A.10, ticket O-64. The city catalog and the travel-plan catalog with
 * its requests. "Popular" is derived from views, never typed (§3A.10), so it is
 * not a column here.
 */

export interface AdminCityRow {
  id: string;
  name_mm: string;
  name_en: string;
  slug: string;
  cover_url: string;
  description_mm: string;
  description_en: string;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  sort_order: number;
  views: number;
  listing_count: number;
}

export const adminCities = createCollection<AdminCityRow>({
  key: 'mh-travel-admin-cities',
  seed: [] as AdminCityRow[],
  id: (row) => row.id,
  isRow: (value): value is AdminCityRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<AdminCityRow>;
    return typeof row.id === 'string' && typeof row.name_en === 'string';
  },
  normalize: (row, seed) => ({
    ...(seed ?? row),
    ...row,
    active: row.active ?? true,
    views: row.views ?? 0,
    listing_count: row.listing_count ?? 0,
    sort_order: row.sort_order ?? 99,
  }),
});

export type CityProblem = 'name_en_required' | 'name_mm_required' | 'slug_required' | 'slug_duplicate' | 'slug_invalid';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A slug is the URL, so it is ASCII, lower case and unique across the catalog. */
export function cityProblem(draft: Pick<AdminCityRow, 'id' | 'name_en' | 'name_mm' | 'slug'>, rows: AdminCityRow[]): CityProblem | null {
  if (!draft.name_en.trim()) return 'name_en_required';
  if (!draft.name_mm.trim()) return 'name_mm_required';
  const slug = draft.slug.trim();
  if (!slug) return 'slug_required';
  if (!SLUG_PATTERN.test(slug)) return 'slug_invalid';
  if (rows.some((row) => row.id !== draft.id && row.slug === slug)) return 'slug_duplicate';
  return null;
}

/** §3A.10: deactivating hides a city from search and pages but keeps its listings. */
export function setCityActive(row: AdminCityRow, active: boolean): AdminCityRow {
  return { ...row, active };
}

/** "Popular" is derived, so the list ranks by views rather than by `sort_order`. */
export function citiesByPopularity(rows: AdminCityRow[]): AdminCityRow[] {
  return [...rows].sort((a, b) => b.views - a.views);
}

export type PlanRequestStatus = 'new' | 'contacted' | 'quoted' | 'booked' | 'closed';

export const PLAN_REQUEST_STATUSES: PlanRequestStatus[] = ['new', 'contacted', 'quoted', 'booked', 'closed'];

export interface AdminPlanRow {
  id: string;
  title_mm: string;
  title_en: string;
  days: number;
  price_usd: number;
  includes_mm: string;
  includes_en: string;
  itinerary_mm: string;
  itinerary_en: string;
  cover_url: string;
  active: boolean;
}

export const adminPlans = createCollection<AdminPlanRow>({
  key: 'mh-travel-admin-plans',
  seed: [] as AdminPlanRow[],
  id: (row) => row.id,
  isRow: (value): value is AdminPlanRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<AdminPlanRow>;
    return typeof row.id === 'string' && typeof row.title_en === 'string';
  },
  normalize: (row, seed) => ({
    ...(seed ?? row),
    ...row,
    days: row.days ?? 1,
    price_usd: row.price_usd ?? 0,
    active: row.active ?? true,
  }),
});

export interface PlanRequestRow {
  id: string;
  traveler_name: string;
  phone: string;
  cities: string;
  days: number;
  budget_usd: number | null;
  status: PlanRequestStatus;
  note: string;
  handled_by: string | null;
  created_at: string;
  updated_at: string;
}

export const planRequests = createCollection<PlanRequestRow>({
  key: 'mh-travel-admin-plan-requests',
  seed: [] as PlanRequestRow[],
  id: (row) => row.id,
  isRow: (value): value is PlanRequestRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<PlanRequestRow>;
    return typeof row.id === 'string' && typeof row.traveler_name === 'string';
  },
  normalize: (row, seed) => ({
    ...(seed ?? row),
    ...row,
    days: row.days ?? 1,
    note: row.note ?? '',
  }),
});

/**
 * §3A.10: a request moves through the five statuses in order and never goes
 * backwards, because a quoted request that becomes `new` again would be
 * answered twice.
 */
const REQUEST_NEXT: Record<PlanRequestStatus, PlanRequestStatus[]> = {
  new: ['contacted', 'closed'],
  contacted: ['quoted', 'closed'],
  quoted: ['booked', 'closed'],
  booked: ['closed'],
  closed: [],
};

export function planRequestCanFollow(from: PlanRequestStatus, to: PlanRequestStatus): boolean {
  return REQUEST_NEXT[from].includes(to);
}

export function planRequestNextStatuses(from: PlanRequestStatus): PlanRequestStatus[] {
  return REQUEST_NEXT[from];
}

export function movePlanRequest(row: PlanRequestRow, status: PlanRequestStatus, handledBy: string, now = new Date()): PlanRequestRow {
  return { ...row, status, handled_by: handledBy, updated_at: now.toISOString() };
}

export function planRequestSummary(rows: PlanRequestRow[]): { total: number; new: number; open: number } {
  return {
    total: rows.length,
    new: rows.filter((row) => row.status === 'new').length,
    open: rows.filter((row) => row.status !== 'closed').length,
  };
}
