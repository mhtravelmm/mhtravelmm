import { describe, expect, it } from 'vitest';
import {
  EMPTY_OWNER_FILTERS,
  applicationCanFollow,
  applicationNextStatuses,
  filterOwners,
  handleApplication,
  oneTimeSignInLink,
  ownerSummary,
  renewSubscription,
  subscriptionsEndingSoon,
  type OwnerApplicationRow,
  type OwnerRow,
} from './adminOwners';

/**
 * Plan §3A.8. An application is decided once and an owner's subscription moves
 * forward only, so both machines are tested here rather than through the screen.
 */

function application(overrides: Partial<OwnerApplicationRow> = {}): OwnerApplicationRow {
  return {
    id: 'oa-1', applicant_name: 'Daw Khin Myat', business_name: 'Bagan Sunrise Lodge',
    category: 'Hotel', city: 'Bagan', phone: '+95 9 771 200 001', address: 'Nyaung U',
    notes: '', status: 'new', handled_by: null, note: '', created_at: '2026-11-29T01:00:00.000Z',
    updated_at: '2026-11-29T01:00:00.000Z',
    ...overrides,
  };
}

function owner(overrides: Partial<OwnerRow> = {}): OwnerRow {
  return {
    id: 'ow-1', owner_name: 'Yangon Rides', shop_name: 'Yangon Rides', username: 'yangon_rides',
    email: 'owner@yangonrides.example', phone: '+95 9 771 300 001', city: 'Yangon',
    category: 'Rental', status: 'active', subscription_end: '2026-12-05',
    commission_percent: 10, monthly_fee_mmk: 50000, verified: true, listing_id: null,
    created_at: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('the owner application machine (§3A.8)', () => {
  it('moves new to contacted, approved or rejected', () => {
    expect(applicationNextStatuses('new')).toEqual(['contacted', 'approved', 'rejected']);
  });

  it('treats a decided application as final', () => {
    expect(applicationCanFollow('approved', 'rejected')).toBe(false);
    expect(applicationCanFollow('rejected', 'approved')).toBe(false);
    expect(applicationNextStatuses('approved')).toEqual([]);
  });

  it('records the handler and the note on the decision', () => {
    const next = handleApplication(application(), 'contacted', 'Super Admin', ' Called today ');
    expect(next.status).toBe('contacted');
    expect(next.handled_by).toBe('Super Admin');
    expect(next.note).toBe('Called today');
  });

  it('keeps the old note when the new one is blank', () => {
    const next = handleApplication(application({ note: 'Called on 27 November.' }), 'approved', 'Admin', '');
    expect(next.note).toBe('Called on 27 November.');
  });
});

describe('the owners list (§3A.8)', () => {
  it('filters by city, category, status and pending-only', () => {
    const rows = [
      owner({ id: 'ow-1' }),
      owner({ id: 'ow-2', city: 'Bagan', category: 'Hotel', status: 'pending' }),
    ];
    expect(filterOwners(rows, { ...EMPTY_OWNER_FILTERS, city: 'Bagan' }).map((row) => row.id)).toEqual(['ow-2']);
    expect(filterOwners(rows, { ...EMPTY_OWNER_FILTERS, status: 'active' }).map((row) => row.id)).toEqual(['ow-1']);
    expect(filterOwners(rows, { ...EMPTY_OWNER_FILTERS, pendingOnly: true }).map((row) => row.id)).toEqual(['ow-2']);
  });

  it('summarises the four statuses', () => {
    const summary = ownerSummary([
      owner({ id: 'ow-1', status: 'active' }),
      owner({ id: 'ow-2', status: 'pending' }),
      owner({ id: 'ow-3', status: 'expired' }),
      owner({ id: 'ow-4', status: 'expired' }),
    ]);
    expect(summary).toEqual({ total: 4, active: 1, pending: 1, expired: 2 });
  });

  it('flags a subscription inside the warning window and not one beyond it', () => {
    const rows = [
      owner({ id: 'soon', subscription_end: '2026-11-24' }),
      owner({ id: 'later', subscription_end: '2026-12-20' }),
      owner({ id: 'already', subscription_end: '2026-11-01' }),
      owner({ id: 'none', subscription_end: null }),
    ];
    expect(subscriptionsEndingSoon(rows, '2026-11-20').map((row) => row.id)).toEqual(['soon']);
  });

  it('renews from today when the old end has already passed', () => {
    const next = renewSubscription(owner({ subscription_end: '2026-10-31', status: 'expired' }), 1, '2026-11-20');
    expect(next.subscription_end).toBe('2026-12-20');
    expect(next.status).toBe('active');
  });

  it('renews from the existing end when it is still in the future', () => {
    const next = renewSubscription(owner({ subscription_end: '2026-12-05' }), 1, '2026-11-20');
    expect(next.subscription_end).toBe('2027-01-05');
  });

  it('issues a one-time link that carries the username and no stored password', () => {
    const link = oneTimeSignInLink('yangon_rides', new Date('2026-11-20T02:00:00.000Z'));
    expect(link).toContain('u=yangon_rides');
    expect(link).toContain('one_time=');
    expect(link).not.toContain('password');
  });
});
