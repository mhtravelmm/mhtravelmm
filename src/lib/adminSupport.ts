import { createCollection } from './collection';

/**
 * Plan §12.1 and §3A.13, ticket O-66. The support inbox: threads for travelers
 * and, in a separate tab, owners. Assign, reply, close; the contact-form
 * messages sit below the threads.
 */

export type SupportKind = 'traveler' | 'owner';
export type SupportStatus = 'open' | 'closed';

export interface SupportMessage {
  id: string;
  at: string;
  /** `traveler`, `owner` or `staff`. */
  from: 'traveler' | 'owner' | 'staff';
  author: string;
  body: string;
  /** Unread for the staff side, which is what the sidebar badge counts. */
  unread: boolean;
}

export interface SupportThreadRow {
  id: string;
  kind: SupportKind;
  subject: string;
  requester_name: string;
  requester_email: string;
  status: SupportStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  messages: SupportMessage[];
}

export const supportThreads = createCollection<SupportThreadRow>({
  key: 'mh-travel-admin-support',
  seed: [] as SupportThreadRow[],
  id: (row) => row.id,
  isRow: (value): value is SupportThreadRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<SupportThreadRow>;
    return typeof row.id === 'string' && typeof row.subject === 'string' && Array.isArray(row.messages);
  },
  normalize: (row, seed) => ({
    ...(seed ?? row),
    ...row,
    status: row.status === 'closed' ? 'closed' : 'open',
    messages: Array.isArray(row.messages) ? row.messages : [],
  }),
});

export interface SupportMessageRow {
  id: string;
  name: string;
  email: string;
  body: string;
  created_at: string;
  read: boolean;
}

export const contactMessages = createCollection<SupportMessageRow>({
  key: 'mh-travel-admin-contact',
  seed: [] as SupportMessageRow[],
  id: (row) => row.id,
  isRow: (value): value is SupportMessageRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<SupportMessageRow>;
    return typeof row.id === 'string' && typeof row.name === 'string';
  },
});

export type SupportFilter = 'open' | 'unassigned' | 'mine' | 'closed' | 'all';

/** §3A.13: the four filters, where `mine` is the signed-in staff account. */
export function filterThreads(
  rows: SupportThreadRow[],
  filter: SupportFilter,
  me: string | null,
): SupportThreadRow[] {
  const sorted = [...rows].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  if (filter === 'all') return sorted;
  if (filter === 'open') return sorted.filter((row) => row.status === 'open');
  if (filter === 'closed') return sorted.filter((row) => row.status === 'closed');
  if (filter === 'unassigned') return sorted.filter((row) => row.status === 'open' && row.assigned_to === null);
  return sorted.filter((row) => row.status === 'open' && row.assigned_to !== null && row.assigned_to === me);
}

/** The sidebar badge: unread staff-side messages on an open thread. */
export function unreadSupportCount(rows: SupportThreadRow[]): number {
  return rows.reduce(
    (total, row) => (row.status === 'open' ? total + row.messages.filter((message) => message.unread && message.from !== 'staff').length : total),
    0,
  );
}

export function assignThread(row: SupportThreadRow, staff: string, now = new Date()): SupportThreadRow {
  return { ...row, assigned_to: staff, updated_at: now.toISOString() };
}

export function closeThread(row: SupportThreadRow, now = new Date()): SupportThreadRow {
  return { ...row, status: 'closed', updated_at: now.toISOString() };
}

export function reopenThread(row: SupportThreadRow, now = new Date()): SupportThreadRow {
  return { ...row, status: 'open', updated_at: now.toISOString() };
}

/**
 * A reply is live (§3A.13), so it appends to the thread and marks the incoming
 * messages read. An empty body is refused at the call site rather than here.
 */
export function replyToThread(
  row: SupportThreadRow,
  staff: string,
  body: string,
  now = new Date(),
  id = `msg-${now.getTime().toString(36)}`,
): SupportThreadRow {
  const text = body.trim();
  if (!text) return row;
  return {
    ...row,
    updated_at: now.toISOString(),
    messages: [
      ...row.messages.map((message) => ({ ...message, unread: false })),
      { id, at: now.toISOString(), from: 'staff', author: staff, body: text, unread: false },
    ],
  };
}

export function threadSummary(rows: SupportThreadRow[]): { open: number; unassigned: number; unread: number } {
  return {
    open: rows.filter((row) => row.status === 'open').length,
    unassigned: rows.filter((row) => row.status === 'open' && row.assigned_to === null).length,
    unread: unreadSupportCount(rows),
  };
}
