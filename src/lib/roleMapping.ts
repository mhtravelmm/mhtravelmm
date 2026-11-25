import { ADMIN_ROLES, type AdminRole } from './adminRoles';

/**
 * Plan §3: a profile stores a role slug (`rental_admin`), while the UI, the
 * Admin Management form and the server policies speak the product names
 * (`Rental Admin`). Both spellings have to resolve to the same role, or an
 * admin signs in and is treated as a traveler.
 */
export const ROLE_SLUGS: Record<AdminRole, string> = {
  'Super Admin': 'super_admin',
  'Ads Admin': 'ads_admin',
  Admin: 'admin',
  'Rental Admin': 'rental_admin',
  'Payment Admin': 'payment_admin',
  'Travel Guide Content Admin': 'travel_guide_admin',
  'Blog Post Admin': 'blog_admin',
  'Owner Admin': 'owner_admin',
};

const SLUG_TO_ROLE = new Map<string, AdminRole>(
  (Object.entries(ROLE_SLUGS) as [AdminRole, string][]).map(([role, slug]) => [slug, role]),
);

/** The slug a profile row stores for a product role. */
export function roleSlug(role: AdminRole): string {
  return ROLE_SLUGS[role];
}

/**
 * Accepts either spelling, in any case, and any separator style, so a hand-
 * written profile row (`Rental Admin`, `rental-admin`, `rental_admin`) resolves
 * to the same role. Anything unrecognised is not a staff role.
 */
export function adminRoleFrom(value: unknown): AdminRole | undefined {
  if (typeof value !== 'string') return undefined;
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  const bySlug = SLUG_TO_ROLE.get(key);
  if (bySlug) return bySlug;
  return ADMIN_ROLES.find((role) => role.toLowerCase().replace(/[\s-]+/g, '_') === key);
}

/**
 * A session or account stored before the rename holds `content_admin`. Without
 * this, an older admin reads as a traveler and loses the workspace.
 */
export function normalizeStoredRole(role: unknown): string | undefined {
  if (typeof role !== 'string') return undefined;
  return role === 'content_admin' ? 'admin_staff' : role;
}

/** `traveler` is the only role outside the eight product roles. */
export function isAdminRole(value: unknown): boolean {
  return adminRoleFrom(value) !== undefined;
}

/**
 * Plan §16G.5, ticket O-01. The coarse role the app signs a person in as. It is
 * derived from the product role, never stored separately, so a profile row
 * cannot disagree with the workspace it opens.
 */
export type AuthRoleName = 'traveler' | 'super_admin' | 'owner_admin' | 'admin_staff';

export interface RoleFromProfile {
  authRole: AuthRoleName;
  /** Absent for a traveler; the eight product roles otherwise. */
  adminRole?: AdminRole;
}

/**
 * The one mapping from a `profiles.role` value to both vocabularies (§16G.5).
 * `content_admin` is not a database value and is retired here: a row that still
 * holds it resolves to no product role, so it signs in as a traveler instead of
 * silently gaining the whole admin workspace.
 */
export function roleFromProfile(value: unknown): RoleFromProfile {
  if (typeof value === 'string' && value.trim().toLowerCase() === 'traveler') {
    return { authRole: 'traveler' };
  }
  const adminRole = adminRoleFrom(value);
  if (!adminRole) return { authRole: 'traveler' };
  if (adminRole === 'Super Admin') return { authRole: 'super_admin', adminRole };
  if (adminRole === 'Owner Admin') return { authRole: 'owner_admin', adminRole };
  return { authRole: 'admin_staff', adminRole };
}
