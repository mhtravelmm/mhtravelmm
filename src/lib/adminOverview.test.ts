import { describe, expect, it } from 'vitest';
import { computeOverview, needsAttention, periodWindow, type AttentionInput } from './adminOverview';
import type { AdminBookingRow } from './adminBookings';
import type { AdminUserRow } from './adminUsers';

/**
 * Plan §3A.5, §3A.16 criteria 3 and 4. Every Overview figure is a sum over rows
 * and Needs attention shows only what the role may open, so both are tested
 * without rendering the screen.
 */

function user(overrides: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    id: 'u1', name: 'Moe Thu', username: 'moe', email: 'moe@example.com', phone: '',
    joined_at: '2026-11-20', last_sign_in_at: null, language: 'en', status: 'active',
    bookings: 0, reviews: 0, favorites: 0, reports_against: 0, suspended_reason: null, suspended_at: null,
    ...overrides,
  };
}

function booking(overrides: Partial<AdminBookingRow> = {}): AdminBookingRow {
  return {
    id: 'b1', code: 'BKG-1', category: 'hotel', listing_id: 'l1', listing_name: 'Inya Hotel',
    city_id: 'yangon', owner_id: 'ow-1', traveler_name: 'Thar Thar', traveler_phone: '+95 9 000',
    start_date: '2026-11-20', end_date: '2026-11-21', guests: 2, total_usd: 100, commission_usd: 10,
    status: 'paid', flow: 'instant', payment_method: 'cash', paid_at: '2026-11-20T02:00:00.000Z',
    note: '', created_at: '2026-11-19T02:00:00.000Z',
    events: [{ status: 'paid', at: '2026-11-20T02:00:00.000Z', by: 'staff', note: '' }],
    ...overrides,
  };
}

function emptyInput() {
  return { users: [], bookings: [], reviews: [], cities: [], planRequests: [], listingsPending: 0 };
}

describe('the Overview window (§3A.5)', () => {
  it('covers the period in Myanmar days, both ends inclusive', () => {
    expect(periodWindow(30, '2026-11-20')).toEqual({ from: '2026-10-22', to: '2026-11-20', previousFrom: '2026-09-22' });
  });

  it('puts the previous window immediately before the current one', () => {
    const { from, previousFrom } = periodWindow(7, '2026-11-20');
    expect(from).toBe('2026-11-14');
    expect(previousFrom).toBe('2026-11-07');
  });
});

describe('the Overview figures (§3A.16 criterion 3)', () => {
  it('renders zeros for an empty database rather than a sample', () => {
    const data = computeOverview(emptyInput(), 30, '2026-11-20');
    expect(data.kpis.users.value).toBe(0);
    expect(data.kpis.bookings.value).toBe(0);
    expect(data.kpis.revenue.value).toBe(0);
    expect(data.gross_through_usd).toBe(0);
    expect(data.average_rating).toBe(0);
    expect(data.series).toHaveLength(30);
    expect(data.distribution).toEqual([]);
    expect(data.recent_bookings).toEqual([]);
  });

  it('sums revenue from commission, and gross from the booking total', () => {
    const data = computeOverview(
      {
        ...emptyInput(),
        bookings: [
          booking({ id: 'b1', total_usd: 100, commission_usd: 10 }),
          booking({ id: 'b2', total_usd: 50, commission_usd: 5 }),
          // A requested booking is not revenue.
          booking({ id: 'b3', status: 'requested', paid_at: null, total_usd: 999, commission_usd: 99 }),
        ],
      },
      30,
      '2026-11-20',
    );
    expect(data.kpis.revenue.value).toBe(15);
    expect(data.gross_through_usd).toBe(150);
    expect(data.kpis.bookings.value).toBe(2);
  });

  it('compares the period with the one before it', () => {
    const data = computeOverview(
      {
        ...emptyInput(),
        users: [
          user({ id: 'u1', joined_at: '2026-11-19' }),
          user({ id: 'u2', joined_at: '2026-11-18' }),
          user({ id: 'u3', joined_at: '2026-11-01' }),
        ],
      },
      7,
      '2026-11-20',
    );
    // Two this week, one last week: +100%.
    expect(data.kpis.users.value).toBe(2);
    expect(data.kpis.users.change).toBe(1);
    expect(data.kpis.users.total).toBe(3);
  });

  it('counts only visible reviews into the average rating', () => {
    const data = computeOverview(
      {
        ...emptyInput(),
        reviews: [
          { id: 'r1', rating: 5, created_at: '2026-11-19T01:00:00.000Z', status: 'visible', listing_id: 'l1' },
          { id: 'r2', rating: 4, created_at: '2026-11-19T01:00:00.000Z', status: 'visible', listing_id: 'l1' },
          { id: 'r3', rating: 1, created_at: '2026-11-19T01:00:00.000Z', status: 'hidden', listing_id: 'l1' },
        ],
      },
      30,
      '2026-11-20',
    );
    expect(data.average_rating).toBe(4.5);
  });

  it('ranks cities by views, because popularity is derived', () => {
    const data = computeOverview(
      {
        ...emptyInput(),
        cities: [
          { city_id: 'yangon', name_en: 'Yangon', name_mm: 'ရန်ကုန်', views: 10 },
          { city_id: 'bagan', name_en: 'Bagan', name_mm: 'ပုဂံ', views: 90 },
        ],
      },
      30,
      '2026-11-20',
    );
    expect(data.popular_cities.map((city) => city.city_id)).toEqual(['bagan', 'yangon']);
  });
});

describe('Needs attention (§3A.16 criterion 4)', () => {
  const input: AttentionInput = {
    ownerApplications: 2, rentalRequests: 0, adCreatives: 1, reviews: 0, listingReports: 0,
    support: 3, failedJobs: 0, subscriptionsEnding: 0, payoutsDue: 0,
    guideEarningsUnpriced: 0, translationsToReview: 0, listingsPending: 4,
  };

  it('hides a zero count, because a list of zeros is noise', () => {
    const items = needsAttention(input, () => true);
    expect(items.map((item) => item.key)).toEqual(['owner_applications', 'ad_creatives', 'support', 'listings']);
  });

  it('hides a row the role may not open', () => {
    const items = needsAttention(input, (section) => section === 'users' || section === 'bookings');
    expect(items).toEqual([]);
  });

  it('links each count to the section that holds it', () => {
    const items = needsAttention(input, () => true);
    expect(items.find((item) => item.key === 'listings')?.section).toBe('listings');
    expect(items.find((item) => item.key === 'support')?.section).toBe('support');
  });
});
