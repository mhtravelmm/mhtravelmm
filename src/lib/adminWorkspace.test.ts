import { describe, expect, it } from 'vitest';
import { ADMIN_ROLES } from './adminRoles';
import {
  ALL_SECTIONS,
  HIDDEN_SECTIONS,
  NAV_SECTIONS,
  SECTION_GROUPS,
  canApproveAds,
  canEditRentalCatalog,
  canEditSettings,
  canHandleOrders,
  canMarkEarningPaid,
  canOpenSection,
  canReadAllEarnings,
  canReadAuditLog,
  canRecordPayment,
  canRunPayouts,
  canSetCommission,
  canSetEarningAmount,
  groupedSectionsForRole,
  landingSection,
  resolveSection,
  sectionsForRole,
} from './adminWorkspace';

describe('the admin workspace (Plan §3, §16B.1)', () => {
  it('gives Super Admin every section, in the §3A.4 order', () => {
    expect(sectionsForRole('Super Admin')).toEqual(ALL_SECTIONS);
    expect(ALL_SECTIONS).toEqual([
      'overview', 'reports',
      'users', 'admins', 'owners',
      'rentals', 'rentalOrders', 'rentalReports',
      'bookings', 'tickets', 'payments', 'payouts', 'currency',
      'cities', 'plans', 'listings', 'reviews', 'blogs', 'guides', 'guideEarnings', 'translations',
      'ads', 'templates', 'search', 'announcements',
      'support', 'jobs', 'audit', 'settings',
    ]);
  });

  // §3A.16 criterion 1: no sidebar entry is an alias of another.
  it('gives every section its own id, and no section twice', () => {
    expect(new Set(ALL_SECTIONS).size).toBe(ALL_SECTIONS.length);
    const grouped = SECTION_GROUPS.flatMap((group) => group.sections);
    expect(grouped).toEqual(ALL_SECTIONS);
  });

  it('gives Rental Admin the rental module and nothing else', () => {
    expect(sectionsForRole('Rental Admin')).toEqual(['rentals', 'rentalOrders', 'rentalReports']);
    expect(canOpenSection('Rental Admin', 'ads')).toBe(false);
    expect(canOpenSection('Rental Admin', 'users')).toBe(false);
  });

  it('gives Ads Admin ads only, never a blog or rental section', () => {
    expect(sectionsForRole('Ads Admin')).toEqual(['ads']);
  });

  it('gives Payment Admin totals and payments, but no catalog editing', () => {
    expect(canOpenSection('Payment Admin', 'rentalReports')).toBe(true);
    expect(canOpenSection('Payment Admin', 'rentals')).toBe(false);
    expect(canEditRentalCatalog('Payment Admin')).toBe(false);
    // §3A.4 marks `reports` R (payments, rentals, earnings) for Payment Admin.
    expect(canOpenSection('Payment Admin', 'reports')).toBe(true);
    expect(canOpenSection('Payment Admin', 'payments')).toBe(true);
    expect(canOpenSection('Payment Admin', 'overview')).toBe(false);
    // §16B.1 marks the Ads row `R (reports)` for Payment Admin.
    expect(canOpenSection('Payment Admin', 'ads')).toBe(true);
    // "Payments, payouts, exchange rates" is F for Payment Admin.
    expect(canOpenSection('Payment Admin', 'payouts')).toBe(true);
    expect(canRunPayouts('Payment Admin')).toBe(true);
    expect(canSetCommission('Payment Admin')).toBe(true);
    // §4 and §3A.4: Payment Admin records a template payment, Admin only reads.
    expect(canOpenSection('Payment Admin', 'templates')).toBe(true);
    expect(canOpenSection('Admin', 'templates')).toBe(true);
    expect(canOpenSection('Super Admin', 'templates')).toBe(true);
  });

  it('gives Admin users, support and the read-only catalogs', () => {
    // The dashboard leads with revenue, and Payments is `–` for Admin.
    expect(canOpenSection('Admin', 'overview')).toBe(false);
    expect(canOpenSection('Admin', 'users')).toBe(true);
    expect(canOpenSection('Admin', 'owners')).toBe(true);
    expect(canOpenSection('Admin', 'bookings')).toBe(true);
    expect(canOpenSection('Admin', 'blogs')).toBe(true);
    // Ads is F for Ads Admin only, and roles/settings stay with Super Admin.
    expect(canOpenSection('Admin', 'ads')).toBe(false);
    // The payouts row is `–` for Admin, so it never opens the money section.
    expect(canOpenSection('Admin', 'payouts')).toBe(false);
    expect(canRunPayouts('Admin')).toBe(false);
    expect(canSetCommission('Admin')).toBe(false);
    expect(canOpenSection('Admin', 'admins')).toBe(false);
  });

  it('keeps one editor per content role', () => {
    expect(sectionsForRole('Blog Post Admin')).toEqual(['blogs']);
    // A Guide Content Admin reads its own earnings rows but never sets them.
    expect(sectionsForRole('Travel Guide Content Admin')).toEqual(['guides', 'guideEarnings']);
    expect(canSetEarningAmount('Travel Guide Content Admin')).toBe(false);
    expect(canMarkEarningPaid('Travel Guide Content Admin')).toBe(false);
    expect(canReadAllEarnings('Travel Guide Content Admin')).toBe(false);
  });

  it('gives guide earnings to Payment Admin, with Admin reading all of it', () => {
    for (const role of ['Super Admin', 'Payment Admin'] as const) {
      expect(canOpenSection(role, 'guideEarnings')).toBe(true);
      expect(canSetEarningAmount(role)).toBe(true);
      expect(canMarkEarningPaid(role)).toBe(true);
      expect(canReadAllEarnings(role)).toBe(true);
    }
    // Admin reads every author's rows and writes neither field.
    expect(canOpenSection('Admin', 'guideEarnings')).toBe(true);
    expect(canReadAllEarnings('Admin')).toBe(true);
    expect(canSetEarningAmount('Admin')).toBe(false);
    expect(canMarkEarningPaid('Admin')).toBe(false);
  });

  it('keeps earnings away from every role its row marks as none', () => {
    for (const role of ['Ads Admin', 'Rental Admin', 'Blog Post Admin', 'Owner Admin'] as const) {
      expect(canOpenSection(role, 'guideEarnings')).toBe(false);
      expect(canSetEarningAmount(role)).toBe(false);
      expect(canMarkEarningPaid(role)).toBe(false);
      expect(canReadAllEarnings(role)).toBe(false);
    }
    expect(canSetEarningAmount(undefined)).toBe(false);
  });

  it('leaves Owner Admin to the shop workspace, and a traveler with nothing', () => {
    expect(sectionsForRole('Owner Admin')).toEqual([]);
    expect(sectionsForRole(undefined)).toEqual([]);
    expect(canOpenSection(undefined, 'overview')).toBe(false);
  });

  it('never hands a role a section its permission row marks as none', () => {
    const superAdmin = sectionsForRole('Super Admin');
    for (const role of ADMIN_ROLES) {
      for (const section of sectionsForRole(role)) {
        expect(superAdmin).toContain(section);
      }
    }
  });

  it('gives every role but Owner Admin at least one section to land on', () => {
    for (const role of ADMIN_ROLES) {
      if (role === 'Owner Admin') continue;
      expect(sectionsForRole(role).length).toBeGreaterThan(0);
    }
  });

  it('keeps the audit log with Super Admin, the only role its row grants', () => {
    expect(canOpenSection('Super Admin', 'audit')).toBe(true);
    expect(canReadAuditLog('Super Admin')).toBe(true);
    for (const role of ADMIN_ROLES.filter((candidate) => candidate !== 'Super Admin')) {
      expect(canOpenSection(role, 'audit')).toBe(false);
      expect(canReadAuditLog(role)).toBe(false);
    }
    expect(canReadAuditLog(undefined)).toBe(false);
  });

  it('separates handling an order from recording its payment', () => {
    for (const role of ['Super Admin', 'Rental Admin', 'Admin'] as const) {
      expect(canHandleOrders(role)).toBe(true);
      expect(canRecordPayment(role)).toBe(true);
    }
    expect(canHandleOrders('Payment Admin')).toBe(false);
    expect(canRecordPayment('Payment Admin')).toBe(true);
  });

  it('lets no other role touch an order', () => {
    for (const role of ['Ads Admin', 'Blog Post Admin', 'Travel Guide Content Admin', 'Owner Admin'] as const) {
      expect(canHandleOrders(role)).toBe(false);
      expect(canRecordPayment(role)).toBe(false);
    }
    expect(canHandleOrders(undefined)).toBe(false);
    expect(canRecordPayment(undefined)).toBe(false);
  });
  // §3A.3: each role lands on a section it may open.
  it('lands each role on a section its row allows', () => {
    expect(landingSection('Super Admin')).toBe('overview');
    expect(landingSection('Payment Admin')).toBe('rentalOrders');
    expect(landingSection('Admin')).toBe('users');
    expect(landingSection('Rental Admin')).toBe('rentals');
    expect(landingSection('Ads Admin')).toBe('ads');
    expect(landingSection('Blog Post Admin')).toBe('blogs');
    expect(landingSection('Owner Admin')).toBeUndefined();
    expect(landingSection(undefined)).toBeUndefined();
    for (const role of ADMIN_ROLES) {
      const landing = landingSection(role);
      if (!landing) continue;
      expect(canOpenSection(role, landing), role).toBe(true);
    }
  });

  it('falls back to the landing section when the link asks for another', () => {
    // §3A.3: a shared link must not land a role on a screen it cannot use.
    expect(resolveSection('Rental Admin', 'users')).toBe('rentals');
    expect(resolveSection('Ads Admin', 'audit')).toBe('ads');
    expect(resolveSection('Admin', 'payments')).toBe('users');
    expect(resolveSection('Admin', 'reports')).toBe('reports');
    expect(resolveSection('Super Admin', 'settings')).toBe('settings');
    expect(resolveSection('Super Admin', 'not-a-section')).toBe('overview');
    expect(resolveSection('Super Admin', null)).toBe('overview');
    expect(resolveSection(undefined, 'users')).toBeUndefined();
  });

  it('drops a group once a role has none of its sections', () => {
    expect(groupedSectionsForRole('Rental Admin')).toEqual([
      { groupKey: 'sa_group_rentals', sections: ['rentals', 'rentalOrders', 'rentalReports'] },
    ]);
    expect(groupedSectionsForRole('Ads Admin')).toEqual([
      { groupKey: 'sa_group_growth', sections: ['ads'] },
    ]);
    expect(groupedSectionsForRole('Owner Admin')).toEqual([]);
    const groups = groupedSectionsForRole('Super Admin');
    expect(groups.map((group) => group.groupKey)).toEqual(SECTION_GROUPS.map((group) => group.groupKey));
  });

  // §3A.4: approving a creative and editing Settings stay with Super Admin.
  it('keeps approval and settings with Super Admin', () => {
    expect(canApproveAds('Super Admin')).toBe(true);
    expect(canEditSettings('Super Admin')).toBe(true);
    for (const role of ADMIN_ROLES.filter((candidate) => candidate !== 'Super Admin')) {
      expect(canApproveAds(role), role).toBe(false);
      expect(canEditSettings(role), role).toBe(false);
    }
    expect(canApproveAds(undefined)).toBe(false);
    expect(canEditSettings(undefined)).toBe(false);
  });
  // §3A.4 gives `tickets` a row; Phase 4 builds the screen (ticket O-63).
  it('grants tickets to the roles its row names but keeps it out of the sidebar', () => {
    for (const role of ['Super Admin', 'Admin', 'Payment Admin'] as const) {
      expect(canOpenSection(role, 'tickets'), role).toBe(true);
      const navIds = groupedSectionsForRole(role).flatMap((group) => group.sections);
      expect(navIds, role).not.toContain('tickets');
    }
    expect(HIDDEN_SECTIONS).toEqual(['tickets']);
    expect(NAV_SECTIONS).not.toContain('tickets');
    expect(NAV_SECTIONS.length).toBe(ALL_SECTIONS.length - HIDDEN_SECTIONS.length);
    // Every other section is reachable from the sidebar.
    for (const section of ALL_SECTIONS.filter((id) => !HIDDEN_SECTIONS.includes(id))) {
      expect(NAV_SECTIONS, section).toContain(section);
    }
  });
});
