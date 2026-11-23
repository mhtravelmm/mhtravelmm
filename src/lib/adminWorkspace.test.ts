import { describe, expect, it } from 'vitest';
import { ADMIN_ROLES } from './adminRoles';
import {
  canHandleOrders,
  canMarkEarningPaid,
  canOpenSection,
  canReadAllEarnings,
  canReadAuditLog,
  canRecordPayment,
  canSetEarningAmount,
  sectionsForRole,
} from './adminWorkspace';

describe('the admin workspace (Plan §3, §16B.1)', () => {
  it('gives Super Admin every section', () => {
    expect(sectionsForRole('Super Admin')).toEqual([
      'overview', 'users', 'admins', 'owners', 'bookings', 'content', 'blogs',
      'guides', 'guideEarnings', 'ads', 'currency', 'rentals', 'rentalOrders', 'rentalReports', 'audit',
      'jobs',
    ]);
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
    expect(canOpenSection('Payment Admin', 'overview')).toBe(false);
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
});
