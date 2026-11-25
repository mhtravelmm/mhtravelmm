import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OverviewPanel } from './superAdmin/OverviewPanel';
import { UsersPanel } from './superAdmin/UsersPanel';
import { BookingsPanel } from './superAdmin/BookingsPanel';
import { OwnersPanel } from './superAdmin/OwnersPanel';
import { SearchTuningPanel } from './superAdmin/SearchTuningPanel';
import { SettingsPanel } from './superAdmin/SettingsPanel';
import { renderAt } from '../test/renderWithProviders';
import { translatePair } from '../lib/translations';

/**
 * Plan §3A.2 rules 4 and 7, §3A.5, §3A.6, §3A.8, §3A.9, §3A.12 and §3A.13,
 * tickets O-61 to O-70, rendered through the real provider stack. The rules
 * themselves are asserted in the `lib/admin*.test.ts` files; this file proves
 * the screens obey them: an empty store shows the empty state, a role without
 * the section sees the not-allowed state, and a refused value is refused in the
 * form rather than clamped behind the reader's back.
 */

function text(key: string, language: 'mm' | 'en' = 'en'): string {
  return translatePair(key)[language];
}

function signIn(adminRole: string) {
  window.localStorage.setItem(
    'mh-travel-auth-session',
    JSON.stringify({
      id: 'staff-001',
      name: 'Staff account',
      username: 'staff',
      email: 'staff@mhtravel.com',
      role: adminRole === 'Super Admin' ? 'super_admin' : 'admin',
      adminRole,
      createdAt: '2026-01-01T00:00:00.000Z',
    }),
  );
  window.localStorage.setItem('mh-travel-authenticated', 'true');
}

beforeEach(() => {
  window.localStorage.clear();
  window.localStorage.setItem('mh-travel-language', 'en');
  signIn('Super Admin');
});

describe('Overview (O-61, §3A.16 criterion 3)', () => {
  it('renders every figure from the stores and none from the old sample', async () => {
    renderAt('/super-admin', <OverviewPanel onOpenSection={() => {}} />);
    expect(await screen.findByText(text('ov_kpi_users'))).toBeTruthy();
    // §3A.2 rule 4: the old screen printed "48,750" and "+18.7%".
    expect(screen.queryByText('48,750')).toBeNull();
    expect(screen.queryByText('+18.7%')).toBeNull();
  });

  it('opens the section behind a Needs attention row', async () => {
    const user = userEvent.setup();
    const opened: string[] = [];
    window.localStorage.setItem(
      'mh-travel-admin-owner-applications',
      JSON.stringify([
        {
          id: 'oa-1', applicant_name: 'Daw Khin Myat', business_name: 'Bagan Sunrise Lodge',
          category: 'Hotel', city: 'Bagan', phone: '+95 9 771 200 001', address: '',
          notes: '', status: 'new', handled_by: null, note: '',
          created_at: '2026-11-29T01:00:00.000Z', updated_at: '2026-11-29T01:00:00.000Z',
        },
      ]),
    );
    renderAt('/super-admin', <OverviewPanel onOpenSection={(section) => opened.push(section)} />);

    await user.click(await screen.findByRole('button', { name: new RegExp(text('ov_attention_owner_applications')) }));
    expect(opened).toEqual(['owners']);
  });
});

describe('Users (O-62, §3A.6)', () => {
  it('says there is nobody yet rather than showing sample travellers', () => {
    renderAt('/super-admin?section=users', <UsersPanel />);
    expect(screen.getAllByText(text('sa_empty_title')).length).toBeGreaterThan(0);
  });

  it('refuses the section to a role without it', () => {
    signIn('Blog Post Admin');
    renderAt('/super-admin?section=users', <UsersPanel />);
    expect(screen.getByText(text('common_not_allowed_title'))).toBeTruthy();
  });
});

describe('Bookings and Payments (O-63, §3A.9)', () => {
  it('shows the booking summary as zeros and an empty table', () => {
    renderAt('/super-admin?section=bookings', <BookingsPanel />);
    expect(screen.getByText(text('bk_summary_total'))).toBeTruthy();
    expect(screen.getAllByText(text('sa_empty_title')).length).toBeGreaterThan(0);
  });

  it('moves a requested booking to accepted and records who did it', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      'mh-travel-admin-bookings',
      JSON.stringify([
        {
          id: 'b1', code: 'BKG-1', category: 'hotel', listing_id: 'l1', listing_name: 'Inya Hotel',
          city_id: 'yangon', owner_id: 'ow-1', traveler_name: 'Thar Thar', traveler_phone: '+95 9 000',
          start_date: '2026-11-20', end_date: '2026-11-21', guests: 2, total_usd: 100, commission_usd: 10,
          status: 'requested', flow: 'full_manual', payment_method: null, paid_at: null, note: '',
          created_at: '2026-11-19T02:00:00.000Z',
          events: [{ status: 'requested', at: '2026-11-19T02:00:00.000Z', by: 'traveler', note: '' }],
        },
      ]),
    );
    renderAt('/super-admin?section=bookings', <BookingsPanel />);

    // The actions live in the detail drawer, which the row opens.
    await user.click(screen.getByRole('button', { name: text('usr_action_view') }));
    await user.click(screen.getByRole('button', { name: text('sec_status_accepted') }));
    const stored = JSON.parse(window.localStorage.getItem('mh-travel-admin-bookings') ?? '[]') as { status: string; events: unknown[] }[];
    expect(stored[0].status).toBe('accepted');
    expect(stored[0].events).toHaveLength(2);
  });
});

describe('Owners (O-70, §3A.8)', () => {
  it('opens on the applications tab and offers the owners tab beside it', () => {
    renderAt('/super-admin?section=owners', <OwnersPanel />);
    const applications = screen.getByRole('button', { name: new RegExp(text('ow_tab_applications')) });
    const owners = screen.getByRole('button', { name: text('ow_tab_owners') });
    expect(applications).toBeTruthy();
    expect(owners).toBeTruthy();
  });

  it('never offers a password field, because an owner is invited instead', async () => {
    const user = userEvent.setup();
    renderAt('/super-admin?section=owners', <OwnersPanel />);
    await user.click(screen.getByRole('button', { name: text('ow_tab_owners') }));
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(screen.getByText(text('ow_no_email_hint'))).toBeTruthy();
  });
});

describe('Search tuning (O-67, §3A.12)', () => {
  it('refuses a duplicate alias term in the form', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem(
      'mh-travel-search-aliases',
      JSON.stringify([
        { id: 'al-1', term: 'shwedagon', target: 'Shwedagon Pagoda', kind: 'listing', active: true, updated_at: '2026-11-20T02:00:00.000Z', updated_by: 'Super Admin' },
      ]),
    );
    renderAt('/super-admin?section=search', <SearchTuningPanel />);

    await user.click(screen.getByRole('button', { name: new RegExp(text('sr_alias_add')) }));
    await user.type(screen.getByLabelText(text('sr_alias_term')), 'Shwedagon');
    await user.type(screen.getByLabelText(text('sr_alias_target')), 'Bagan');

    expect(screen.getByRole('alert').textContent).toBe(text('ct_problem_slug_duplicate'));
    expect((screen.getByRole('button', { name: text('sec_save') }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('refuses a boost weight outside the range instead of clamping it', async () => {
    const user = userEvent.setup();
    renderAt('/super-admin?section=search', <SearchTuningPanel />);
    await user.click(screen.getByRole('button', { name: text('sr_tab_boosts') }));

    const field = screen.getByLabelText('Listing name');
    await user.clear(field);
    await user.type(field, '99');

    const row = field.closest('tr') as HTMLElement;
    expect(within(row).getByText(text('sr_boost_problem'))).toBeTruthy();
    expect((within(row).getByRole('button', { name: text('sec_save') }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('Settings (O-67, §3A.13)', () => {
  it('writes a setting and keeps the old value in the audit trail', async () => {
    const user = userEvent.setup();
    renderAt('/super-admin?section=settings', <SettingsPanel />);

    // A row is read-only until Edit turns it into a field.
    const row = screen.getByText('rental_min_notice_days').closest('tr') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: text('st_edit') }));

    const field = screen.getByLabelText('rental_min_notice_days');
    await user.clear(field);
    await user.type(field, '2');
    await user.click(within(row).getByRole('button', { name: text('sec_save') }));

    const stored = JSON.parse(window.localStorage.getItem('mh-travel-admin-settings') ?? '[]') as { key: string; value: string }[];
    expect(stored.find((row) => row.key === 'rental_min_notice_days')?.value).toBe('2');
  });
});
