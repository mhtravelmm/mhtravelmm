import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SHOP_PHOTO_QUOTA } from './mediaRules';
import { SEED_LISTING_ROWS, findListingRow, type ListingRow } from './listingRows';
import {
  applyListingDraft,
  canAddPhoto,
  canApproveListings,
  canEditListing,
  listingDraftProblems,
  listingsForViewer,
  statusAfterEdit,
  type ListingDraft,
} from './listingStore';

/**
 * §16C.3 step 2. The screen's rules are duplicated in SQL — a constraint, a
 * trigger or a policy — so these tests also read the migration. A rule that
 * changes on one side without the other fails here rather than in production,
 * and `scripts/verify-migrations.sh` proves the SQL half on a real Postgres.
 */

const sql = readFileSync(
  join(process.cwd(), 'supabase', 'migrations', '20261130000100_listings.sql'),
  'utf8',
);

const hotel = findListingRow('ph3') as ListingRow;

function draft(overrides: Partial<ListingDraft> = {}): ListingDraft {
  return {
    name_en: 'Lotte Hotel Yangon',
    name_mm: 'လော့တဟိုတယ်',
    description_en: 'A city stay',
    description_mm: null,
    address: 'Kabar Aye Pagoda Road',
    category: 'hotel',
    city_id: 'yangon',
    open_time: '00:00',
    close_time: '23:59',
    checkin_time: '14:00',
    checkout_time: '12:00',
    price_display: 'public',
    price_from_mmk: null,
    price_from_usd: 95,
    booking_flow_mode: 'full_manual',
    ...overrides,
  };
}

describe('listingDraftProblems', () => {
  it('accepts a complete hotel draft', () => {
    expect(listingDraftProblems(draft())).toEqual([]);
  });

  it('requires an English name, because that is what the card falls back to', () => {
    expect(listingDraftProblems(draft({ name_en: '   ' }))).toContain('name_en_required');
  });

  it('requires a city, because every page is city-scoped', () => {
    expect(listingDraftProblems(draft({ city_id: '' }))).toContain('city_required');
  });

  it('rejects a price mode that shows a price with no price behind it', () => {
    const problems = listingDraftProblems(draft({ price_display: 'public', price_from_usd: null }));
    expect(problems).toContain('price_mode_needs_price');
  });

  it('allows a hidden price with no price', () => {
    const problems = listingDraftProblems(
      draft({ price_display: 'hidden', price_from_usd: null, price_from_mmk: null }),
    );
    expect(problems).toEqual([]);
  });

  it('requires open and close times on every category, as Plan §9 says', () => {
    expect(listingDraftProblems(draft({ open_time: null }))).toContain('open_times_required');
    expect(listingDraftProblems(draft({ close_time: null }))).toContain('open_times_required');
    expect(
      listingDraftProblems(draft({ category: 'cafe', checkin_time: null, checkout_time: null, open_time: null })),
    ).toContain('open_times_required');
  });

  it('refuses both currencies at once, so the two cannot drift', () => {
    const problems = listingDraftProblems(draft({ price_from_mmk: 200000, price_from_usd: 95 }));
    expect(problems).toContain('usd_and_mmk_both_set');
  });

  it('refuses a negative price', () => {
    const problems = listingDraftProblems(draft({ price_from_usd: -1 }));
    expect(problems).toContain('price_negative');
  });

  it('requires both stay times on a hotel or guesthouse', () => {
    expect(listingDraftProblems(draft({ checkin_time: null }))).toContain('hotel_times_required');
    expect(listingDraftProblems(draft({ checkout_time: 'noon' }))).toContain('hotel_times_required');
    expect(listingDraftProblems(draft({ category: 'guesthouse', checkin_time: null }))).toContain(
      'hotel_times_required',
    );
  });

  it('refuses a stored time that is not HH:MM', () => {
    expect(listingDraftProblems(draft({ open_time: '9am' }))).toContain('time_format_invalid');
    expect(listingDraftProblems(draft({ open_time: '09:00' }))).not.toContain('time_format_invalid');
  });

  it('allows a bar to close after midnight, so it never orders the two', () => {
    const problems = listingDraftProblems(
      draft({ category: 'bar', open_time: '18:00', close_time: '02:00', checkin_time: null, checkout_time: null }),
    );
    expect(problems).toEqual([]);
  });

  it('does not require stay times on a restaurant', () => {
    const problems = listingDraftProblems(
      draft({ category: 'restaurant', checkin_time: null, checkout_time: null, open_time: '10:00', close_time: '22:00' }),
    );
    expect(problems).toEqual([]);
  });
});

describe('statusAfterEdit (§9)', () => {
  const unapproved: ListingRow = { ...hotel, first_approved_at: null, status: 'pending' };
  const approved: ListingRow = { ...hotel, first_approved_at: '2026-11-24T00:00:00.000Z', status: 'active' };

  it('holds an owner edit at pending before the first approval', () => {
    expect(statusAfterEdit(unapproved, { isStaff: false })).toBe('pending');
  });

  it('keeps an owner edit live after the first approval, as §9 requires', () => {
    expect(statusAfterEdit(approved, { isStaff: false })).toBe('active');
  });

  it('leaves the status alone for staff', () => {
    expect(statusAfterEdit(approved, { isStaff: true })).toBe('active');
    expect(statusAfterEdit({ ...hotel, status: 'suspended' }, { isStaff: true })).toBe('suspended');
  });

  it('does not resurrect a retired row on an owner edit', () => {
    const retired = { ...approved, status: 'retired' as const };
    expect(statusAfterEdit(retired, { isStaff: false })).toBe('retired');
  });

  it('matches the SQL: the policy accepts a live owner edit only with a stamp', () => {
    expect(sql).toContain("(status = 'pending' or first_approved_at is not null)");
  });

  it('matches the SQL: only staff may write the stamp', () => {
    expect(sql).toContain('if public.is_listing_staff() then');
    expect(sql).toContain('new.first_approved_at := old.first_approved_at;');
  });
});

describe('applyListingDraft', () => {
  it('never takes rating, views or review counts from the draft', () => {
    const edited = applyListingDraft({ ...hotel, views: 1500, rating: 4.6, review_count: 12 }, draft(), {
      isStaff: true,
    });
    expect(edited.views).toBe(1500);
    expect(edited.rating).toBe(4.6);
    expect(edited.review_count).toBe(12);
  });

  it('never takes the approval stamp from the draft', () => {
    const untrusted = draft() as ListingDraft & { first_approved_at?: string };
    untrusted.first_approved_at = '2026-01-01T00:00:00.000Z';
    const edited = applyListingDraft({ ...hotel, first_approved_at: null }, untrusted, { isStaff: false });
    expect(edited.first_approved_at).toBeNull();
  });

  it('keeps the owner it already had, because a draft cannot carry one', () => {
    const owned: ListingRow = { ...hotel, owner_id: 'owner-1' };
    const edited = applyListingDraft(owned, draft({ name_en: 'Renamed' }), { isStaff: false });
    expect(edited.owner_id).toBe('owner-1');
  });

  it('applies the edited fields', () => {
    const edited = applyListingDraft(hotel, draft({ name_en: 'Lotte Hotel' }), { isStaff: true });
    expect(edited.name_en).toBe('Lotte Hotel');
  });
});

describe('listingsForViewer', () => {
  const rows: ListingRow[] = [
    { ...hotel, id: 'a', owner_id: 'owner-1' },
    { ...hotel, id: 'b', owner_id: 'owner-2' },
    { ...hotel, id: 'c', owner_id: null },
  ];

  it('gives staff every row', () => {
    expect(listingsForViewer(rows, { ownerId: null, isStaff: true })).toHaveLength(3);
  });

  it('gives an owner only their own rows', () => {
    expect(listingsForViewer(rows, { ownerId: 'owner-1', isStaff: false }).map((r) => r.id)).toEqual(['a']);
  });

  it('gives a signed-out visitor nothing', () => {
    expect(listingsForViewer(rows, { ownerId: null, isStaff: false })).toEqual([]);
  });
});

describe('canAddPhoto', () => {
  it('allows a photo under the quota and refuses one at it', () => {
    expect(canAddPhoto({ ...hotel, photo_quota: 3 }, 2)).toBe(true);
    expect(canAddPhoto({ ...hotel, photo_quota: 3 }, 3)).toBe(false);
  });

  it('uses the same default quota the migration and the media rules use', () => {
    expect(hotel.photo_quota).toBe(DEFAULT_SHOP_PHOTO_QUOTA);
    expect(sql).toContain(`photo_quota integer not null default ${DEFAULT_SHOP_PHOTO_QUOTA}`);
  });

  it('matches the SQL trigger that refuses the insert', () => {
    const photos = readFileSync(
      join(process.cwd(), 'supabase', 'migrations', '20261130000200_listing_photos.sql'),
      'utf8',
    );
    expect(photos).toContain('listing_photo_quota_reached');
  });
});

describe('the seed the store starts from', () => {
  // Plan §9 reads the stamp, not the status: an active row without one would
  // drop back to Pending on the Owner's first edit. The seed is reviewed
  // catalog content, so active means approved.
  it('never leaves an active row unstamped', () => {
    for (const row of SEED_LISTING_ROWS) {
      if (row.status !== 'active') continue;
      expect(row.first_approved_at, row.id).not.toBeNull();
    }
  });

  it('leaves a row that is not active unstamped', () => {
    for (const row of SEED_LISTING_ROWS) {
      if (row.status === 'active') continue;
      expect(row.first_approved_at, row.id).toBeNull();
    }
  });

  it('gives every row a photo quota', () => {
    expect(SEED_LISTING_ROWS.every((row) => row.photo_quota === DEFAULT_SHOP_PHOTO_QUOTA)).toBe(true);
  });
});

describe('who may write a listing (§16B.1)', () => {
  it('lets Super Admin and Admin approve, and nobody else', () => {
    expect(canApproveListings('Super Admin')).toBe(true);
    expect(canApproveListings('Admin')).toBe(true);
    for (const role of ['Owner Admin', 'Rental Admin', 'Payment Admin', 'Ads Admin', 'Blog Post Admin', 'Travel Guide Content Admin'] as const) {
      expect(canApproveListings(role)).toBe(false);
    }
    expect(canApproveListings(undefined)).toBe(false);
  });

  it('lets an Owner edit but not approve', () => {
    expect(canEditListing('Owner Admin')).toBe(true);
    expect(canApproveListings('Owner Admin')).toBe(false);
  });

  it('gives a traveler no edit right', () => {
    expect(canEditListing(undefined)).toBe(false);
  });
});

/**
 * A seeded row an Admin opens and saves must not be refused by the screen's own
 * rules. This caught two real defects: every row had no opening hours, and 45 of
 * the 67 declared a public price with no price behind it.
 */
describe('the seed is valid under the screen that edits it', () => {
  it('has no row that its own validation would refuse', () => {
    const offenders = SEED_LISTING_ROWS.map((row) => ({
      id: row.id,
      problems: listingDraftProblems({ ...row }),
    })).filter((entry) => entry.problems.length > 0);
    expect(offenders).toEqual([]);
  });

  it('marks a price public only when the row has one', () => {
    for (const row of SEED_LISTING_ROWS) {
      if (row.price_display === 'hidden') continue;
      expect(row.price_from_usd !== null || row.price_from_mmk !== null, row.id).toBe(true);
    }
  });
});
