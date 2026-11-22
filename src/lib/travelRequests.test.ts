import { describe, expect, it } from 'vitest';
import { requestReference, requestsOfKind, sortRequests, type TravelRequest } from './travelRequests';

function request(overrides: Partial<TravelRequest> = {}): TravelRequest {
  return {
    id: 'MHR-20261122-001',
    kind: 'rental',
    title: 'City Bicycle',
    detail: 'Yangon · 2 days',
    amountUsd: 16,
    createdAt: '2026-11-22T09:00:00.000Z',
    ...overrides,
  };
}

describe('requestReference', () => {
  it('builds a readable reference from the kind and date', () => {
    expect(requestReference('rental', new Date(2026, 10, 22), 1)).toBe('MHR-20261122-001');
    expect(requestReference('ticket', new Date(2026, 0, 5), 12)).toBe('MHT-20260105-012');
    expect(requestReference('custom_plan', new Date(2026, 11, 31), 7)).toBe('MHC-20261231-007');
  });

  it('keeps the sequence at three digits or more', () => {
    expect(requestReference('rental', new Date(2026, 10, 22), 1234)).toBe('MHR-20261122-1234');
  });

  it('never emits a zero or negative sequence', () => {
    expect(requestReference('rental', new Date(2026, 10, 22), 0)).toBe('MHR-20261122-001');
    expect(requestReference('rental', new Date(2026, 10, 22), -3)).toBe('MHR-20261122-001');
  });
});

describe('sortRequests', () => {
  it('puts the newest request first', () => {
    const older = request({ id: 'a', createdAt: '2026-11-20T09:00:00.000Z' });
    const newer = request({ id: 'b', createdAt: '2026-11-22T09:00:00.000Z' });
    expect(sortRequests([older, newer]).map((item) => item.id)).toEqual(['b', 'a']);
  });

  it('breaks a timestamp tie by id so the order is stable', () => {
    const first = request({ id: 'a', createdAt: '2026-11-22T09:00:00.000Z' });
    const second = request({ id: 'b', createdAt: '2026-11-22T09:00:00.000Z' });
    expect(sortRequests([first, second]).map((item) => item.id)).toEqual(['b', 'a']);
  });

  it('does not mutate the array it was given', () => {
    const items = [request({ id: 'a', createdAt: '2026-11-20T09:00:00.000Z' }), request({ id: 'b', createdAt: '2026-11-22T09:00:00.000Z' })];
    sortRequests(items);
    expect(items.map((item) => item.id)).toEqual(['a', 'b']);
  });
});

describe('requestsOfKind', () => {
  it('keeps only the requested kinds, newest first', () => {
    const items = [
      request({ id: 'rental-1', kind: 'rental', createdAt: '2026-11-21T09:00:00.000Z' }),
      request({ id: 'ticket-1', kind: 'ticket', createdAt: '2026-11-22T09:00:00.000Z' }),
      request({ id: 'plan-1', kind: 'custom_plan', createdAt: '2026-11-20T09:00:00.000Z' }),
    ];
    expect(requestsOfKind(items, ['rental', 'ticket']).map((item) => item.id)).toEqual(['ticket-1', 'rental-1']);
    expect(requestsOfKind(items, ['custom_plan']).map((item) => item.id)).toEqual(['plan-1']);
  });

  it('returns an empty list rather than throwing on no match', () => {
    expect(requestsOfKind([request()], ['ticket'])).toEqual([]);
  });
});
