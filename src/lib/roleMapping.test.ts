import { describe, expect, it } from 'vitest';
import { ADMIN_ROLES } from './adminRoles';
import { ROLE_SLUGS, adminRoleFrom, isAdminRole, normalizeStoredRole, roleFromProfile, roleSlug } from './roleMapping';

/** The nine values §16G.5 allows in `profiles.role`, in the Plan's order. */
const DATABASE_ROLES = [
  'traveler',
  'super_admin',
  'ads_admin',
  'admin',
  'rental_admin',
  'payment_admin',
  'travel_guide_admin',
  'blog_admin',
  'owner_admin',
] as const;

describe('the nine database role values (§16G.5, ticket O-01)', () => {
  it('resolves every one of them, and only the eight staff values are staff', () => {
    for (const slug of DATABASE_ROLES) {
      const { authRole, adminRole } = roleFromProfile(slug);
      if (slug === 'traveler') {
        expect(authRole, slug).toBe('traveler');
        expect(adminRole, slug).toBeUndefined();
      } else {
        expect(adminRole, slug).toBeDefined();
        expect(isAdminRole(slug), slug).toBe(true);
        expect(authRole, slug).not.toBe('traveler');
      }
    }
  });

  it('gives the slug and the product name the same answer', () => {
    for (const role of ADMIN_ROLES) {
      expect(roleFromProfile(roleSlug(role)), role).toEqual(roleFromProfile(role));
    }
  });

  it('sends Super Admin and Owner Admin to their own coarse role', () => {
    expect(roleFromProfile('super_admin')).toEqual({ authRole: 'super_admin', adminRole: 'Super Admin' });
    expect(roleFromProfile('owner_admin')).toEqual({ authRole: 'owner_admin', adminRole: 'Owner Admin' });
  });

  it('sends the other six staff roles to the shared admin workspace', () => {
    for (const role of ADMIN_ROLES) {
      if (role === 'Super Admin' || role === 'Owner Admin') continue;
      expect(roleFromProfile(roleSlug(role)).authRole, role).toBe('admin_staff');
    }
  });

  it('covers the whole product list, so a new role cannot be added to one side only', () => {
    expect(Object.values(ROLE_SLUGS).sort()).toEqual(
      DATABASE_ROLES.filter((slug) => slug !== 'traveler').sort(),
    );
  });
});

describe('a value that is not a staff role', () => {
  it('reads as a traveler rather than a silent admin', () => {
    for (const value of ['', '  ', 'traveler', 'TRAVELER', 'guest', null, undefined, 42, {}]) {
      expect(roleFromProfile(value).authRole, String(value)).toBe('traveler');
    }
  });

  it('retires content_admin, which is not a database value (§16G.5)', () => {
    expect(roleFromProfile('content_admin')).toEqual({ authRole: 'traveler' });
  });
});

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
