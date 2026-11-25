import { canOpenSection, type WorkspaceSection } from './adminWorkspace';
import { adminUsers } from './adminUsers';
import { adminBookings } from './adminBookings';
import { owners } from './adminOwners';
import { readListings } from './listingStore';
import { BLOGS, TRAVEL_GUIDES } from '../data/homeData';

/**
 * Plan §3A.14, ticket O-68. The header's global search: `admin_search(p_q)`
 * returns up to five matches each for users, bookings, owners, listings, blog
 * posts and guides, limited to what the role may open, with links.
 *
 * At least two characters, because one letter matches everything and reads as a
 * broken list. The groups are narrowed by the same rule the sidebar uses, so a
 * role never sees a link it cannot follow.
 */

export type SearchGroup = 'users' | 'bookings' | 'owners' | 'listings' | 'blogs' | 'guides';

export interface SearchHit {
  id: string;
  label: string;
  detail: string;
  href: string;
}

export interface SearchGroupResult {
  group: SearchGroup;
  hits: SearchHit[];
}

export const MIN_QUERY_LENGTH = 2;
const PER_GROUP = 5;

const GROUP_SECTIONS: Record<SearchGroup, WorkspaceSection> = {
  users: 'users',
  bookings: 'bookings',
  owners: 'owners',
  listings: 'listings',
  blogs: 'blogs',
  guides: 'guides',
};

function matches(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle);
}

/**
 * The local stand-in for `admin_search`. Every group is filtered by the role's
 * own section, so the result list cannot offer a link the role may not open.
 */
export function searchAll(
  query: string,
  canOpen: (section: WorkspaceSection) => boolean = (section) => canOpenSection(undefined, section),
): SearchGroupResult[] {
  const needle = query.trim().toLowerCase();
  if (needle.length < MIN_QUERY_LENGTH) return [];

  const results: SearchGroupResult[] = [];

  if (canOpen(GROUP_SECTIONS.users)) {
    const hits = adminUsers
      .read()
      .filter((row) => matches(`${row.name} ${row.username} ${row.email}`, needle))
      .slice(0, PER_GROUP)
      .map((row) => ({ id: row.id, label: row.name, detail: row.email || row.username, href: '/super-admin?section=users' }));
    if (hits.length) results.push({ group: 'users', hits });
  }

  if (canOpen(GROUP_SECTIONS.bookings)) {
    const hits = adminBookings
      .read()
      .filter((row) => matches(`${row.code} ${row.traveler_name} ${row.traveler_phone}`, needle))
      .slice(0, PER_GROUP)
      .map((row) => ({ id: row.id, label: row.code, detail: row.traveler_name, href: '/super-admin?section=bookings' }));
    if (hits.length) results.push({ group: 'bookings', hits });
  }

  if (canOpen(GROUP_SECTIONS.owners)) {
    const hits = owners
      .read()
      .filter((row) => matches(`${row.owner_name} ${row.shop_name} ${row.username}`, needle))
      .slice(0, PER_GROUP)
      .map((row) => ({ id: row.id, label: row.shop_name, detail: row.city, href: '/super-admin?section=owners' }));
    if (hits.length) results.push({ group: 'owners', hits });
  }

  if (canOpen(GROUP_SECTIONS.listings)) {
    const hits = readListings()
      .filter((row) => matches(`${row.name_en} ${row.name_mm ?? ''} ${row.id}`, needle))
      .slice(0, PER_GROUP)
      .map((row) => ({ id: row.id, label: row.name_en, detail: `${row.category} · ${row.status}`, href: '/super-admin?section=listings' }));
    if (hits.length) results.push({ group: 'listings', hits });
  }

  if (canOpen(GROUP_SECTIONS.blogs)) {
    const hits = BLOGS.filter((row) => matches(row.title, needle))
      .slice(0, PER_GROUP)
      .map((row) => ({ id: row.id, label: row.title, detail: row.href, href: row.href }));
    if (hits.length) results.push({ group: 'blogs', hits });
  }

  if (canOpen(GROUP_SECTIONS.guides)) {
    const hits = TRAVEL_GUIDES.filter((row) => matches(row.title, needle))
      .slice(0, PER_GROUP)
      .map((row) => ({ id: row.id, label: row.title, detail: row.href, href: row.href }));
    if (hits.length) results.push({ group: 'guides', hits });
  }

  return results;
}

