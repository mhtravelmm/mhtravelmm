/**
 * Product roles from Plan §3. The Admin Management form must offer exactly
 * these names; each role starts with the permission group that scopes it.
 */
export const ADMIN_ROLES = [
  'Super Admin',
  'Ads Admin',
  'Admin',
  'Rental Admin',
  'Payment Admin',
  'Travel Guide Content Admin',
  'Blog Post Admin',
  'Owner Admin',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PERMISSION_GROUPS = [
  'All permissions',
  'Content, Blogs',
  'Content, Travel Guide',
  'Users, Support',
  'Bookings, Orders',
  'Payments, Reports',
  'Rentals, Inventory',
  'Ads Management',
] as const;

export type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

export const DEFAULT_PERMISSION_GROUP: Record<AdminRole, PermissionGroup> = {
  'Super Admin': 'All permissions',
  'Ads Admin': 'Ads Management',
  Admin: 'Users, Support',
  'Rental Admin': 'Rentals, Inventory',
  'Payment Admin': 'Payments, Reports',
  'Travel Guide Content Admin': 'Content, Travel Guide',
  'Blog Post Admin': 'Content, Blogs',
  'Owner Admin': 'Bookings, Orders',
};

/** Super Admin creates the other admin accounts, so it is not offered in the form. */
export const CREATABLE_ADMIN_ROLES = ADMIN_ROLES.filter((role) => role !== 'Super Admin');
