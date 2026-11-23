import { describe, expect, it } from 'vitest';
import type { AuthUser } from './auth';
import { adminRowFromUser, adminSummary, mergeAdminRows, permissionsForRole } from './adminAccounts';
import type { AdminRow } from './adminAccounts';

const seeded: AdminRow[] = [
  { name: 'MH Travel Super Admin', email: 'superadmin@mhtravel.com', role: 'Super Admin', permissions: 'All permissions', status: 'Active' },
  { name: 'Aung Ko', email: 'aung.ko@mhtravel.com', role: 'Admin', permissions: 'Users, Support', status: 'Active' },
];

const staff: AuthUser = {
  id: 'admin-1',
  name: 'May Myat',
  username: 'maymyat',
  email: 'may@mhtravel.com',
  role: 'admin_staff',
  adminRole: 'Payment Admin',
  createdAt: '2026-11-23T00:00:00.000Z',
};

describe('permissionsForRole', () => {
  it('starts a role on the group its row is scoped to', () => {
    expect(permissionsForRole('Payment Admin')).toBe('Payments, Reports');
    expect(permissionsForRole('Travel Guide Content Admin')).toBe('Content, Travel Guide');
  });
});

describe('adminRowFromUser', () => {
  it('turns a staff account into a row', () => {
    expect(adminRowFromUser(staff)).toEqual({
      name: 'May Myat',
      email: 'may@mhtravel.com',
      role: 'Payment Admin',
      permissions: 'Payments, Reports',
      status: 'Active',
      stored: true,
    });
  });

  it('ignores a traveler, so the admin table stays an admin table', () => {
    expect(adminRowFromUser({ ...staff, role: 'traveler', adminRole: undefined })).toBeNull();
  });

  it('ignores a staff account with no product role', () => {
    expect(adminRowFromUser({ ...staff, adminRole: undefined })).toBeNull();
  });
});

describe('mergeAdminRows', () => {
  it('lists a created account in front of the seeded ones', () => {
    expect(mergeAdminRows(seeded, [staff]).map((row) => row.email)).toEqual([
      'may@mhtravel.com',
      'superadmin@mhtravel.com',
      'aung.ko@mhtravel.com',
    ]);
  });

  it('does not list an account twice when its email is already seeded', () => {
    const duplicate: AuthUser = { ...staff, email: 'AUNG.KO@mhtravel.com' };
    const rows = mergeAdminRows(seeded, [duplicate]);
    expect(rows).toHaveLength(2);
    // The account on record wins, so a role change is not hidden by the seed.
    expect(rows[0]).toMatchObject({ email: 'AUNG.KO@mhtravel.com', role: 'Payment Admin' });
  });

  it('keeps the seeded rows when nothing has been created', () => {
    expect(mergeAdminRows(seeded, [])).toEqual(seeded);
  });
});

describe('adminSummary', () => {
  it('counts the rows and the permission groups they cover', () => {
    const rows: AdminRow[] = [
      ...seeded,
      { name: 'May Myat', email: 'may@mhtravel.com', role: 'Payment Admin', permissions: 'Payments, Reports', status: 'Active' },
      { name: 'Khin', email: 'khin@mhtravel.com', role: 'Ads Admin', permissions: 'Ads Management', status: 'Pending invite' },
    ];
    expect(adminSummary(rows)).toEqual({ total: 4, active: 3, pending: 1, groups: 4 });
  });
});
