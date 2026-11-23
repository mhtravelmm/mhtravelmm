import { DEFAULT_PERMISSION_GROUP, type AdminRole } from './adminRoles';
import type { AuthUser } from './auth';

/**
 * Plan §16B.1: Super Admin creates every other admin account, so the Admin
 * Management table has to list what was actually created. The accounts live in
 * the auth store; this module turns them into table rows and merges them with
 * the seeded ones without listing an account twice.
 */
export interface AdminRow {
  name: string;
  email: string;
  role: AdminRole;
  permissions: string;
  /** `Active` once the account exists; `Pending invite` until it signs in. */
  status: 'Active' | 'Pending invite';
  /**
   * True when the row came from a stored account. A seeded row has no record to
   * rewrite, so Admin Management cannot change its role.
   */
  stored?: boolean;
}

/** The permission group a role starts with, which is what the form pre-selects. */
export function permissionsForRole(role: AdminRole): string {
  return DEFAULT_PERMISSION_GROUP[role] ?? 'All permissions';
}

export function adminRowFromUser(user: AuthUser): AdminRow | null {
  if (user.role !== 'admin_staff' || !user.adminRole) return null;
  return {
    name: user.name,
    email: user.email,
    role: user.adminRole,
    permissions: permissionsForRole(user.adminRole),
    status: 'Active',
    stored: true,
  };
}

/** Created accounts lead, so a new admin is visible without scrolling. */
export function mergeAdminRows(seeded: AdminRow[], users: AuthUser[]): AdminRow[] {
  const created = users
    .map(adminRowFromUser)
    .filter((row): row is AdminRow => row !== null);
  const seen = new Set<string>();
  return [...created, ...seeded].filter((row) => {
    const key = row.email.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function adminSummary(rows: AdminRow[]): { total: number; active: number; pending: number; groups: number } {
  const groups = new Set(rows.map((row) => row.permissions));
  return {
    total: rows.length,
    active: rows.filter((row) => row.status === 'Active').length,
    pending: rows.filter((row) => row.status === 'Pending invite').length,
    groups: groups.size,
  };
}
