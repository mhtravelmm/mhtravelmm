import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListingsPanel } from './superAdmin/ListingsPanel';
import { renderAt } from '../test/renderWithProviders';
import { translatePair } from '../lib/translations';
import { LISTINGS_STORAGE_KEY } from '../lib/listingStore';
import { SEED_LISTING_ROWS } from '../lib/listingRows';

/**
 * §16C.3 step 2, rendered through the real provider stack so the panel is
 * exercised the way the app mounts it. The unit rules live in
 * `listingStore.test.ts`; what this file proves is that the screen wires them
 * to the DOM: the list renders, a filter narrows it, an invalid draft is
 * refused before it can be saved, and the approval action writes the stamp.
 */

function text(key: string, language: 'mm' | 'en' = 'en'): string {
  return translatePair(key)[language];
}

/**
 * Signs in as the demo Super Admin. A signed-out visitor correctly sees no rows
 * — `listingsForViewer()` gives a traveler nothing — so the panel can only be
 * exercised with a staff session in place.
 */
function signInAsSuperAdmin() {
  window.localStorage.setItem(
    'mh-travel-auth-session',
    JSON.stringify({
      id: 'super-admin-001',
      name: 'MH Travel Super Admin',
      username: 'superadmin',
      email: 'superadmin@mhtravel.com',
      role: 'super_admin',
      adminRole: 'Super Admin',
      createdAt: '2026-01-01T00:00:00.000Z',
    }),
  );
  window.localStorage.setItem('mh-travel-authenticated', 'true');
}

function renderPanel() {
  window.localStorage.setItem('mh-travel-language', 'en');
  signInAsSuperAdmin();
  return renderAt('/super-admin', <ListingsPanel />);
}

/** The rows and session a previous test saved would leak into the next one. */
beforeEach(() => {
  window.localStorage.removeItem(LISTINGS_STORAGE_KEY);
  window.localStorage.removeItem('mh-travel-auth-session');
});

describe('ListingsPanel', () => {
  it('renders the seeded hotel and its approval date', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: text('li_title') })).toBeTruthy();
    expect(screen.getAllByText('Lotte hotel Yangon').length).toBeGreaterThan(0);
    const stamped = SEED_LISTING_ROWS.find((row) => row.id === 'ph3')!;
    const approved = text('li_approved_on').replace('{date}', stamped.first_approved_at!.slice(0, 10));
    expect(screen.getAllByText(approved).length).toBeGreaterThan(0);
  });

  it('marks a row with no approval stamp as never approved', () => {
    const pending = SEED_LISTING_ROWS.find((row) => row.id === 'ph1')!;
    window.localStorage.setItem(
      LISTINGS_STORAGE_KEY,
      JSON.stringify([{ ...pending, status: 'pending', first_approved_at: null }]),
    );
    renderPanel();
    // Every seeded row is approved, so the one unstamped row is the only place
    // this text can appear — a count of one proves the null survived the load.
    expect(screen.getAllByText(text('li_never_approved'))).toHaveLength(1);
  });

  it('narrows the list with the search box', async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.type(screen.getByRole('textbox', { name: text('li_search') }), 'zzzznomatchzzzz');
    expect(screen.getByText(text('li_empty'))).toBeTruthy();
  });

  it('refuses a hotel draft whose check-in time is cleared', async () => {
    const user = userEvent.setup();
    renderPanel();

    // Narrow to the hotel first: the first seeded row is an attraction, and a
    // stay-time rule only applies to a hotel or guesthouse.
    await user.type(screen.getByRole('textbox', { name: text('li_search') }), 'Lotte');
    await user.click(screen.getByRole('button', { name: text('li_edit') }));
    expect(screen.getByText(text('li_edit_title'))).toBeTruthy();

    const checkin = screen.getByLabelText(text('li_field_checkin'));
    await user.clear(checkin);

    // The problem is shown and the save is disabled, so an invalid row cannot
    // reach the store.
    expect(screen.getByText(text('li_problem_hotel_times_required'))).toBeTruthy();
    const save = screen.getByRole('button', { name: text('li_save') }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
  });
});

describe('approval writes the stamp and an audit row', () => {
  it('stamps the listing and records the approval', async () => {
    const user = userEvent.setup();
    // A newly submitted owner listing starts Pending; the seed is all active.
    window.localStorage.setItem(
      LISTINGS_STORAGE_KEY,
      JSON.stringify(SEED_LISTING_ROWS.map((row) => (row.id === 'ph3' ? { ...row, status: 'pending' } : row))),
    );
    window.localStorage.removeItem('mh-travel-audit-log');
    renderPanel();

    await user.type(screen.getByRole('textbox', { name: text('li_search') }), 'Lotte');
    await user.click(screen.getByRole('button', { name: text('li_approve') }));

    // The row is saved with a stamp, which is what keeps an owner's next edit
    // live instead of dropping it back to Pending (§9).
    const saved = JSON.parse(window.localStorage.getItem(LISTINGS_STORAGE_KEY) ?? '[]') as {
      id: string;
      status: string;
      first_approved_at: string | null;
    }[];
    const lotte = saved.find((row) => row.id === 'ph3');
    expect(lotte?.status).toBe('active');
    expect(lotte?.first_approved_at).toBeTruthy();

    // §16B.2: the write is in the audit log, naming the listing.
    const audit = JSON.parse(window.localStorage.getItem('mh-travel-admin-audit') ?? '[]') as {
      objectType: string;
      objectId: string;
      action: string;
    }[];
    const entry = audit.find((row) => row.objectType === 'listing' && row.objectId === 'ph3');
    expect(entry?.action).toBe('approved');
  });
});

describe('retiring a listing (§3A.2 rule 7)', () => {
  it('asks for a reason and refuses to retire without one', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      LISTINGS_STORAGE_KEY,
      JSON.stringify(SEED_LISTING_ROWS.map((row) => (row.id === 'ph3' ? { ...row, status: 'active' } : row))),
    );
    renderPanel();

    await user.type(screen.getByRole('textbox', { name: text('li_search') }), 'Lotte');
    await user.click(screen.getByRole('button', { name: text('li_retire') }));

    const dialog = screen.getByRole('dialog', { name: text('confirm_title') });
    expect(dialog).toBeTruthy();
    await user.click(screen.getByRole('button', { name: text('confirm_submit') }));
    expect(screen.getByRole('alert').textContent).toBe(text('confirm_problem_reason_missing'));

    // The row is still active: a refused dialog changes nothing (§3A.2 rule 2).
    const saved = JSON.parse(window.localStorage.getItem(LISTINGS_STORAGE_KEY) ?? '[]') as {
      id: string;
      status: string;
    }[];
    expect(saved.find((row) => row.id === 'ph3')?.status).toBe('active');
  });

  it('retires the row and writes the reason into the audit summary', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      LISTINGS_STORAGE_KEY,
      JSON.stringify(SEED_LISTING_ROWS.map((row) => (row.id === 'ph3' ? { ...row, status: 'active' } : row))),
    );
    window.localStorage.removeItem('mh-travel-admin-audit');
    renderPanel();

    await user.type(screen.getByRole('textbox', { name: text('li_search') }), 'Lotte');
    await user.click(screen.getByRole('button', { name: text('li_retire') }));
    const dialog = screen.getByRole('dialog', { name: text('confirm_title') });
    await user.type(within(dialog).getByRole('textbox'), 'Shop closed permanently');
    await user.click(screen.getByRole('button', { name: text('confirm_submit') }));

    const saved = JSON.parse(window.localStorage.getItem(LISTINGS_STORAGE_KEY) ?? '[]') as {
      id: string;
      status: string;
    }[];
    expect(saved.find((row) => row.id === 'ph3')?.status).toBe('retired');

    const audit = JSON.parse(window.localStorage.getItem('mh-travel-admin-audit') ?? '[]') as {
      objectId: string;
      summary: string;
    }[];
    const entry = audit.find((row) => row.objectId === 'ph3');
    expect(entry?.summary).toContain('Shop closed permanently');
  });

  it('offers a CSV export of the filtered rows', async () => {
    const user = userEvent.setup();
    const blobs: Blob[] = [];
    URL.createObjectURL = (blob: Blob) => {
      blobs.push(blob);
      return 'blob:test';
    };
    URL.revokeObjectURL = () => {};
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderPanel();

    await user.type(screen.getByRole('textbox', { name: text('li_search') }), 'Lotte');
    await user.click(screen.getByRole('button', { name: text('common_export_csv') }));

    const body = await blobs[0].text();
    expect(body).toContain('Lotte hotel Yangon');
    // §3A.14: the export matches the filter, so a non-matching row is absent.
    const other = SEED_LISTING_ROWS.find((row) => !row.name_en.includes('Lotte'))!;
    expect(body).not.toContain(other.name_en);
  });
});
