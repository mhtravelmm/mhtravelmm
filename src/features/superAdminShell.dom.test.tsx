import { beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuperAdminPage } from './superAdmin/SuperAdminPage';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthProvider } from '../lib/auth';
import { CurrencyProvider } from '../lib/currency';
import { FavoritesProvider } from '../lib/favorites';
import { LanguageProvider } from '../lib/i18n';
import { ThemeProvider } from '../lib/theme';
import { translatePair } from '../lib/translations';

/**
 * Plan §3A.4 and §3A.16 criteria 1–3, rendered through the real provider stack:
 * each sidebar entry has its own id, a role sees only the sections its row
 * grants, and the section lives in the URL so a reload or a shared link returns
 * to it. The permission table itself is asserted in `adminWorkspace.test.ts`;
 * this file proves the shell obeys it.
 */

function text(key: string, language: 'mm' | 'en' = 'en'): string {
  return translatePair(key)[language];
}

function signIn(role: string, adminRole: string) {
  window.localStorage.setItem(
    'mh-travel-auth-session',
    JSON.stringify({
      id: `${adminRole}-001`,
      name: `${adminRole} account`,
      username: adminRole.toLowerCase().replace(/\s+/g, '.'),
      email: 'staff@mhtravel.com',
      role,
      adminRole,
      createdAt: '2026-01-01T00:00:00.000Z',
    }),
  );
  window.localStorage.setItem('mh-travel-authenticated', 'true');
}

/**
 * The shell reads the theme, which `renderAt` does not provide, so this file
 * mounts the same stack `main.tsx` does plus `ThemeProvider`.
 */
function renderDashboard(path: string, role = 'super_admin', adminRole = 'Super Admin') {
  window.localStorage.setItem('mh-travel-language', 'en');
  signIn(role, adminRole);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CurrencyProvider>
              <FavoritesProvider>
                <SuperAdminPage />
              </FavoritesProvider>
            </CurrencyProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

function nav(): HTMLElement {
  return screen.getByRole('navigation', { name: text('sa_nav_aria') });
}

beforeEach(() => {
  window.localStorage.removeItem('mh-travel-auth-session');
  window.localStorage.removeItem('mh-travel-authenticated');
});

describe('the Super Admin shell (Plan §3A.3, §3A.4)', () => {
  it('opens on Overview for Super Admin and lists every group', () => {
    renderDashboard('/super-admin');
    const sidebar = nav();
    for (const groupKey of [
      'sa_group_overview', 'sa_group_people', 'sa_group_rentals',
      'sa_group_commerce', 'sa_group_content', 'sa_group_growth', 'sa_group_operations',
    ]) {
      // "Rentals" is both a group label and an entry, so a group may appear twice.
      expect(within(sidebar).getAllByText(text(groupKey)).length, groupKey).toBeGreaterThan(0);
    }
    const current = within(sidebar).getByRole('button', { current: 'page' });
    expect(current.textContent).toBe(text('sa_nav_dashboard'));
  });

  it('gives each entry its own panel, so no two ids share a screen', async () => {
    const user = userEvent.setup();
    renderDashboard('/super-admin');
    await user.click(within(nav()).getByRole('button', { name: text('sa_nav_payments') }));
    // Payments is its own section, not the Bookings placeholder it used to be.
    expect(screen.getByRole('heading', { name: text('sa_nav_payments') })).toBeTruthy();
    expect(screen.getByText(text('admin_payments_intro'))).toBeTruthy();
    expect(screen.queryByRole('heading', { name: text('sa_nav_bookings') })).toBeNull();
  });

  it('keeps a hidden section out of the sidebar', () => {
    renderDashboard('/super-admin');
    expect(within(nav()).queryByRole('button', { name: text('sa_nav_tickets') })).toBeNull();
  });

  it('opens the section named in the URL, so a shared link works', () => {
    renderDashboard('/super-admin?section=currency');
    expect(within(nav()).getByRole('button', { current: 'page' }).textContent).toBe(text('sa_nav_currency'));
  });

  it('falls back to the landing section when the link names one the role may not open', () => {
    renderDashboard('/super-admin?section=settings', 'rental_admin', 'Rental Admin');
    const sidebar = nav();
    expect(within(sidebar).getByRole('button', { current: 'page' }).textContent).toBe(text('sa_nav_rentals'));
    // §3A.4: Rental Admin has the rental group only.
    expect(within(sidebar).queryByText(text('sa_group_commerce'))).toBeNull();
    expect(within(sidebar).queryByText(text('sa_group_operations'))).toBeNull();
  });

  it('lands Admin on Users and hides the revenue dashboard', () => {
    renderDashboard('/super-admin', 'admin', 'Admin');
    const sidebar = nav();
    expect(within(sidebar).getByRole('button', { current: 'page' }).textContent).toBe(text('sa_nav_users'));
    expect(within(sidebar).queryByRole('button', { name: text('sa_nav_dashboard') })).toBeNull();
    expect(within(sidebar).queryByRole('button', { name: text('sa_nav_payments') })).toBeNull();
  });

  it('shows the honest empty state instead of sample rows', () => {
    renderDashboard('/super-admin?section=reviews');
    expect(screen.getByText(text('sa_empty_title'))).toBeTruthy();
    expect(screen.getByText(text('sa_empty_backend_note'))).toBeTruthy();
    // §3A.2 rule 4: the placeholder used to print "48,750" and "+18.7%".
    expect(screen.queryByText('48,750')).toBeNull();
    expect(screen.queryByText('+18.7%')).toBeNull();
  });
});
