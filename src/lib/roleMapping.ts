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
