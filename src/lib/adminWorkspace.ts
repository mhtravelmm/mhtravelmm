import type { AdminRole } from './adminRoles';

/**
 * Plan §3A.4: every sidebar entry is its own section. The aliases that used to
 * point several entries at one panel (Tickets and Payments at Bookings, Cities
 * and Reviews at Content, Reports at Overview) are gone, so an `F`/`R` in the
 * permission table now describes one screen rather than a shared placeholder.
 *
 * This hides menus only; the server checks the role again on every write
 * (§16B.8), and a refused write shows its translated message.
 */
export type WorkspaceSection =
  | 'overview'
  | 'reports'
  | 'users'
  | 'admins'
  | 'owners'
  | 'rentals'
  | 'rentalOrders'
  | 'rentalReports'
  | 'bookings'
  | 'tickets'
  | 'payments'
  | 'payouts'
  | 'currency'
  | 'cities'
  | 'plans'
  | 'listings'
  | 'reviews'
  | 'blogs'
  | 'guides'
  | 'guideEarnings'
  | 'translations'
  | 'ads'
  | 'templates'
  | 'search'
  | 'announcements'
  | 'support'
  | 'jobs'
  | 'audit'
  | 'settings';

export type SectionGroupKey =
  | 'sa_group_overview'
  | 'sa_group_people'
  | 'sa_group_rentals'
  | 'sa_group_commerce'
  | 'sa_group_content'
  | 'sa_group_growth'
  | 'sa_group_operations';

/** §3A.4, in the order the sidebar shows them, grouped as the table groups them. */
export const SECTION_GROUPS: { groupKey: SectionGroupKey; sections: WorkspaceSection[] }[] = [
  { groupKey: 'sa_group_overview', sections: ['overview', 'reports'] },
  { groupKey: 'sa_group_people', sections: ['users', 'admins', 'owners'] },
  { groupKey: 'sa_group_rentals', sections: ['rentals', 'rentalOrders', 'rentalReports'] },
  { groupKey: 'sa_group_commerce', sections: ['bookings', 'tickets', 'payments', 'payouts', 'currency'] },
  { groupKey: 'sa_group_content', sections: ['cities', 'plans', 'listings', 'reviews', 'blogs', 'guides', 'guideEarnings', 'translations'] },
  { groupKey: 'sa_group_growth', sections: ['ads', 'templates', 'search', 'announcements'] },
  { groupKey: 'sa_group_operations', sections: ['support', 'jobs', 'audit', 'settings'] },
];

export const ALL_SECTIONS: WorkspaceSection[] = SECTION_GROUPS.flatMap((group) => group.sections);

/**
 * §3A.4 read row by row. A role never gets a section its row marks `–`, which
 * is why Admin has no `overview` and no `payments`: the dashboard leads with
 * revenue, and the money row is `–` for Admin. Admin lands on Users instead,
 * the section §3 names for it.
 *
 * `tickets` is Phase 4 (§16C.1 order; ticket O-63 keeps it out of the nav until
 * the operator system lands), so the id exists here and the sidebar omits it.
 *
 * Owner Admin is absent on purpose: its rights are `O` (own listing, own
 * earnings, own shop), which the separate `/shop-owner` workspace already
 * serves. Showing it here would put one owner's records in another's menu.
 */
const SECTIONS_BY_ROLE: Record<AdminRole, WorkspaceSection[]> = {
  'Super Admin': ALL_SECTIONS,
  'Ads Admin': ['ads'],
  Admin: [
    'reports', 'users', 'owners',
    'rentals', 'rentalOrders', 'rentalReports',
    'bookings', 'tickets',
    'cities', 'plans', 'listings', 'reviews', 'blogs', 'guides', 'guideEarnings', 'translations',
    'templates', 'search', 'announcements',
    'support',
  ],
  'Rental Admin': ['rentals', 'rentalOrders', 'rentalReports'],
  'Payment Admin': [
    'reports',
    'rentalOrders', 'rentalReports',
    'tickets', 'payments', 'payouts', 'currency',
    'guideEarnings', 'ads', 'templates',
  ],
  'Travel Guide Content Admin': ['guides', 'guideEarnings'],
  'Blog Post Admin': ['blogs'],
  'Owner Admin': [],
};

/**
 * §3A.4 gives `tickets` a row, but Phase 4 builds the screen (§16C.1; ticket
 * O-63). The right is granted and the sidebar leaves the entry out, so nobody
 * opens a panel that does not exist yet.
 */
export const HIDDEN_SECTIONS: WorkspaceSection[] = ['tickets'];

/** The ids the sidebar renders; the rest are rights without a screen yet. */
export const NAV_SECTIONS: WorkspaceSection[] = ALL_SECTIONS.filter(
  (section) => !HIDDEN_SECTIONS.includes(section),
);

/** A traveler has no admin workspace, so an unknown role gets nothing. */
export function sectionsForRole(role: AdminRole | undefined): WorkspaceSection[] {
  if (!role) return [];
  return SECTIONS_BY_ROLE[role] ?? [];
}

export function canOpenSection(role: AdminRole | undefined, section: WorkspaceSection): boolean {
  return sectionsForRole(role).includes(section);
}

/**
 * §3A.3: Super Admin lands on Overview, Payment Admin on Rental Orders, Admin
 * on Users, and every other role on its first allowed section.
 */
export function landingSection(role: AdminRole | undefined): WorkspaceSection | undefined {
  const allowed = sectionsForRole(role);
  if (allowed.length === 0) return undefined;
  if (role === 'Payment Admin') return 'rentalOrders';
  if (role === 'Admin') return 'users';
  return allowed[0];
}

/**
 * §3A.3: an id the role may not open falls back to its landing section, so a
 * shared link never lands a role on a screen it cannot use.
 */
export function resolveSection(
  role: AdminRole | undefined,
  requested: string | null | undefined,
): WorkspaceSection | undefined {
  const allowed = sectionsForRole(role);
  if (requested && allowed.includes(requested as WorkspaceSection)) return requested as WorkspaceSection;
  return landingSection(role);
}

/** The sidebar's groups, each narrowed to the sections this role may open. */
export function groupedSectionsForRole(
  role: AdminRole | undefined,
): { groupKey: SectionGroupKey; sections: WorkspaceSection[] }[] {
  const allowed = sectionsForRole(role);
  return SECTION_GROUPS.map((group) => ({
    groupKey: group.groupKey,
    sections: group.sections.filter((section) => allowed.includes(section) && NAV_SECTIONS.includes(section)),
  })).filter((group) => group.sections.length > 0);
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
 * §3A.4 makes the rental catalog `F` for Super Admin and Rental Admin and `R`
 * for Admin. That section also records the mismatch with
 * `SQL/20261122000050_rental_roles.sql`, whose `is_rental_editor()` still
 * includes Admin; ticket M-11 narrows the helper.
 */
export function canEditRentalCatalog(role: AdminRole | undefined): boolean {
  return role === 'Super Admin' || role === 'Rental Admin';
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

/**
 * Plan §16B.1 "Payments, payouts, exchange rates" row: F for Super Admin and
 * Payment Admin, `–` for Admin, `O (own earnings)` for Owner Admin. Running a
 * payout moves money out, so it is narrower than reading the ledger.
 */
export function canRunPayouts(role: AdminRole | undefined): boolean {
  return role === 'Super Admin' || role === 'Payment Admin';
}

export function canSetCommission(role: AdminRole | undefined): boolean {
  return role === 'Super Admin' || role === 'Payment Admin';
}

/** §3A.4: only Super Admin approves a creative; Ads Admin runs everything else. */
export function canApproveAds(role: AdminRole | undefined): boolean {
  return role === 'Super Admin';
}

/** §3A.4: Settings is Super Admin only, and every change is audited. */
export function canEditSettings(role: AdminRole | undefined): boolean {
  return role === 'Super Admin';
}
