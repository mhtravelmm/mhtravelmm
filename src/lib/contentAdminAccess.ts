import type { AdminRole } from './adminRoles';

/**
 * Plan §10 item 6: content admins reach the Blog or Travel Guide editor only.
 * Ad management stays with Super Admin and Ads Admin, so no content role gets it.
 */
export function canManageBlogs(role: AdminRole | undefined): boolean {
  return role === 'Super Admin' || role === 'Blog Post Admin';
}

export function canManageGuides(role: AdminRole | undefined): boolean {
  return role === 'Super Admin' || role === 'Travel Guide Content Admin';
}

export function canManageAds(role: AdminRole | undefined): boolean {
  return role === 'Super Admin' || role === 'Ads Admin';
}

/**
 * §16A.9: Payment Admin reads the ad reports but changes nothing, so this is a
 * separate right from `canManageAds` rather than a broader one.
 */
export function canReadAdReports(role: AdminRole | undefined): boolean {
  return canManageAds(role) || role === 'Payment Admin';
}

/** True for the roles that may sign in to the content workspace at all. */
export function isContentRole(role: AdminRole | undefined): boolean {
  return role === 'Blog Post Admin' || role === 'Travel Guide Content Admin';
}
