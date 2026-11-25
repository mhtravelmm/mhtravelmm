import { ownerApplications, owners, subscriptionsEndingSoon, type OwnerApplicationRow, type OwnerRow } from './adminOwners';
import { myanmarToday } from './myanmarTime';

/**
 * Plan §3A.5 and §3A.8: the two owner counts the Overview shows. They read the
 * owners store rather than a copy, so the count and the tab agree.
 */
export function ownerApplicationsRows(): OwnerApplicationRow[] {
  return ownerApplications.read();
}

export function ownerSubscriptionEndingSoon(today = myanmarToday()): OwnerRow[] {
  return subscriptionsEndingSoon(owners.read(), today);
}
