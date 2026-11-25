import { describe, expect, it } from 'vitest';
import {
  PLAN_REQUEST_STATUSES,
  citiesByPopularity,
  cityProblem,
  movePlanRequest,
  planRequestCanFollow,
  planRequestNextStatuses,
  planRequestSummary,
  setCityActive,
  type AdminCityRow,
  type PlanRequestRow,
} from './adminCities';

/**
 * Plan §3A.10. A city is the slug the public page uses, so a duplicate slug is
 * refused rather than written twice; "popular" is derived from views and never
 * typed. A plan request moves forward only.
 */

function city(overrides: Partial<AdminCityRow> = {}): AdminCityRow {
  return {
    id: 'c1', name_en: 'Yangon', name_mm: 'ရန်ကုန်', slug: 'yangon', cover_url: '',
    description_en: '', description_mm: '', latitude: 16.8, longitude: 96.1, active: true,
    sort_order: 1, views: 0, listing_count: 0,
    ...overrides,
  };
}

function request(overrides: Partial<PlanRequestRow> = {}): PlanRequestRow {
  return {
    id: 'pr-1', traveler_name: 'Moe Thu', phone: '+95 9 771 100 001', cities: 'Yangon',
    days: 4, budget_usd: 400, note: 'Two adults', status: 'new', handled_by: null,
    created_at: '2026-11-19T02:00:00.000Z', updated_at: '2026-11-19T02:00:00.000Z',
    ...overrides,
  };
}

describe('a city row (§3A.10)', () => {
  it('requires both names and a slug', () => {
    expect(cityProblem({ id: 'c1', name_en: '', name_mm: 'ရန်ကုန်', slug: 'yangon' }, [])).toBe('name_en_required');
    expect(cityProblem({ id: 'c1', name_en: 'Yangon', name_mm: '', slug: 'yangon' }, [])).toBe('name_mm_required');
    expect(cityProblem({ id: 'c1', name_en: 'Yangon', name_mm: 'ရန်ကုန်', slug: ' ' }, [])).toBe('slug_required');
  });

  it('refuses a slug that is not lowercase latin with hyphens', () => {
    expect(cityProblem({ id: 'c1', name_en: 'Yangon', name_mm: 'ရန်ကုန်', slug: 'Yangon!' }, [])).toBe('slug_invalid');
  });

  it('refuses a slug another city already uses, but allows its own', () => {
    const rows = [city()];
    expect(cityProblem({ id: 'c2', name_en: 'Yangon', name_mm: 'ရန်ကုန်', slug: 'yangon' }, rows)).toBe('slug_duplicate');
    expect(cityProblem({ id: 'c1', name_en: 'Yangon', name_mm: 'ရန်ကုန်', slug: 'yangon' }, rows)).toBeNull();
  });

  it('deactivates a city without touching its listings', () => {
    const next = setCityActive(city(), false);
    expect(next.active).toBe(false);
    expect(next.slug).toBe('yangon');
  });

  it('derives popularity from views', () => {
    const rows = [city({ id: 'c1', views: 10 }), city({ id: 'c2', views: 90 }), city({ id: 'c3', views: 50 })];
    expect(citiesByPopularity(rows).map((row) => row.id)).toEqual(['c2', 'c3', 'c1']);
  });
});

describe('a plan request (§3A.10)', () => {
  it('walks the pipeline one step at a time, so a quote is never skipped', () => {
    expect(planRequestNextStatuses('new')).toEqual(['contacted', 'closed']);
    expect(planRequestNextStatuses('contacted')).toEqual(['quoted', 'closed']);
    expect(planRequestCanFollow('new', 'booked')).toBe(false);
  });

  it('lets a booked request close, and a closed one stay closed', () => {
    expect(planRequestNextStatuses('booked')).toEqual(['closed']);
    expect(planRequestNextStatuses('closed')).toEqual([]);
  });

  it('keeps every status in the declared order, so a select reads sensibly', () => {
    expect(PLAN_REQUEST_STATUSES).toEqual(['new', 'contacted', 'quoted', 'booked', 'closed']);
  });

  it('records the handler and the time on the move', () => {
    const next = movePlanRequest(request(), 'quoted', 'Admin', new Date('2026-11-20T02:00:00.000Z'));
    expect(next.status).toBe('quoted');
    expect(next.handled_by).toBe('Admin');
    expect(next.updated_at).toBe('2026-11-20T02:00:00.000Z');
  });

  it('summarises the total, the new and the still-open rows', () => {
    const summary = planRequestSummary([
      request({ id: 'p1' }),
      request({ id: 'p2', status: 'quoted' }),
      request({ id: 'p3', status: 'closed' }),
    ]);
    expect(summary).toEqual({ total: 3, new: 1, open: 2 });
  });
});
