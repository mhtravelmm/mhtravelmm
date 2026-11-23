import { describe, expect, it } from 'vitest';
import { ADMIN_ROLES } from './adminRoles';
import { ROLE_SLUGS, adminRoleFrom, isAdminRole, normalizeStoredRole, roleSlug } from './roleMapping';

describe('role slugs (Plan §3)', () => {
  it('gives every product role one slug', () => {
    expect(Object.keys(ROLE_SLUGS).sort()).toEqual([...ADMIN_ROLES].sort());
  });

  it('round-trips every role through its slug', () => {
    for (const role of ADMIN_ROLES) {
      expect(adminRoleFrom(roleSlug(role))).toBe(role);
    }
  });

  it('accepts the product name as well as the slug', () => {
    expect(adminRoleFrom('Rental Admin')).toBe('Rental Admin');
    expect(adminRoleFrom('rental_admin')).toBe('Rental Admin');
  });

  it('ignores case and separator style, so a hand-written row still resolves', () => {
    expect(adminRoleFrom('  RENTAL-ADMIN ')).toBe('Rental Admin');
    expect(adminRoleFrom('travel guide admin')).toBe('Travel Guide Content Admin');
    expect(adminRoleFrom('Blog_Post_Admin')).toBe('Blog Post Admin');
  });

  it('maps the two content roles to their own names, not one shared slug', () => {
    expect(adminRoleFrom('travel_guide_admin')).toBe('Travel Guide Content Admin');
    expect(adminRoleFrom('blog_admin')).toBe('Blog Post Admin');
  });

  it('treats a traveler and an unknown value as no admin role', () => {
    expect(adminRoleFrom('traveler')).toBeUndefined();
    expect(adminRoleFrom('')).toBeUndefined();
    expect(adminRoleFrom(null)).toBeUndefined();
    expect(adminRoleFrom(42)).toBeUndefined();
    expect(isAdminRole('traveler')).toBe(false);
    expect(isAdminRole('payment_admin')).toBe(true);
  });

  it('reads a session written before the rename as staff, not a traveler', () => {
    expect(normalizeStoredRole('content_admin')).toBe('admin_staff');
    expect(normalizeStoredRole('admin_staff')).toBe('admin_staff');
    expect(normalizeStoredRole('super_admin')).toBe('super_admin');
    expect(normalizeStoredRole(undefined)).toBeUndefined();
  });
});
