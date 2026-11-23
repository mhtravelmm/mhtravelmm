import type { AdminRole } from './adminRoles';

/**
 * Plan §3 and §16B.1: one role-guarded admin workspace that reuses the Super
 * Admin panels. Each role sees only the sections its permission row grants, and
 * Super Admin keeps all of them. This hides menus only; the server checks the
 * role again on every write.
 */
export type WorkspaceSection =
  | 'overview'
  | 'users'
  | 'admins'
  | 'owners'
  | 'bookings'
  | 'content'
  | 'blogs'
  | 'guides'
  | 'guideEarnings'
  | 'ads'
  | 'currency'
  | 'rentals'
  | 'rentalOrders'
  | 'rentalReports'
  | 'audit'
  | 'jobs'
  | 'translations';

const ALL_SECTIONS: WorkspaceSection[] = [
  'overview',
  'users',
  'admins',
  'owners',
  'bookings',
  'content',
  'blogs',
  'guides',
  'guideEarnings',
  'ads',
  'currency',
  'rentals',
  'rentalOrders',
  'rentalReports',
  'audit',
  'jobs',
  'translations',
];

/**
 * §16B.1 read row by row. A role never gets a section its row marks `–`, which
 * is why Admin has no `overview`: the dashboard leads with revenue, and the
 * Payments row is `–` for Admin. It lands on Users instead, the section §3
 * names for it.
 *
 * Owner Admin is absent on purpose: its rights are `O` (own listing, own
 * earnings, own shop), which the separate `/shop-owner` workspace already
 * serves. Showing it here would put one owner's records in another's menu.
 */
const SECTIONS_BY_ROLE: Record<AdminRole, WorkspaceSection[]> = {
  'Super Admin': ALL_SECTIONS,
  'Ads Admin': ['ads'],
  Admin: ['users', 'owners', 'bookings', 'content', 'blogs', 'guides', 'guideEarnings', 'rentals', 'rentalOrders', 'rentalReports', 'translations'],
  'Rental Admin': ['rentals', 'rentalOrders', 'rentalReports'],
  'Payment Admin': ['rentalOrders', 'rentalReports', 'currency', 'guideEarnings'],
  'Travel Guide Content Admin': ['guides', 'guideEarnings'],
  'Blog Post Admin': ['blogs'],
  'Owner Admin': [],
};

/** A traveler has no admin workspace, so an unknown role gets nothing. */
export function sectionsForRole(role: AdminRole | undefined): WorkspaceSection[] {
  if (!role) return [];
  return SECTIONS_BY_ROLE[role] ?? [];
}

export function canOpenSection(role: AdminRole | undefined, section: WorkspaceSection): boolean {
  return sectionsForRole(role).includes(section);
}

/**
 * Plan §16B.1: the rental order row is `F` for Super Admin and Rental Admin,
 * `R + handle orders` for Admin, and `R + record payment` for Payment Admin.
 * Reading and writing are separate rights, so a payment-only account never
 * accepts, cancels or completes an order.
 */
export function canHandleOrders(role: AdminRole | undefined): boolean {
  return role === 'Super Admin' || role === 'Rental Admin' || role === 'Admin';
}

export function canRecordPayment(role: AdminRole | undefined): boolean {
  return canHandleOrders(role) || role === 'Payment Admin';
}

/**
 * Plan §16B.1 guide earnings row: `F` for Super Admin and Payment Admin,
 * `R` for Admin, `O (read)` for Guide Content Admin. Setting the amount and
 * settling it are the two writes, and Admin has neither.
 */
export function canSetEarningAmount(role: AdminRole | undefined): boolean {
  return role === 'Super Admin' || role === 'Payment Admin';
}

export function canMarkEarningPaid(role: AdminRole | undefined): boolean {
  return role === 'Super Admin' || role === 'Payment Admin';
}

/** Admin reads every author's rows; a Guide Content Admin reads only its own. */
export function canReadAllEarnings(role: AdminRole | undefined): boolean {
  return role === 'Super Admin' || role === 'Admin' || role === 'Payment Admin';
}

/**
 * Plan §16B.1: the "Settings and roles" row is `F` for Super Admin and `–` for
 * everyone else, so the audit log it writes is Super Admin only. §16B.2 rows
 * name actors from every role, which is why the reader must not be scoped the
 * way the earnings list is.
 */
export function canReadAuditLog(role: AdminRole | undefined): boolean {
  return role === 'Super Admin';
}
