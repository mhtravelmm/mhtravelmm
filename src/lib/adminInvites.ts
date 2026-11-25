import { createCollection } from './collection';
import type { AdminRole } from './adminRoles';

/**
 * Plan §3A.7, ticket O-69. `admin_invites`: a staff account before it exists.
 * In production the form sends an invitation and the person sets their own
 * password (§3A.16 criterion 7); no password is generated, stored or shown.
 */
export type AdminInviteStatus = 'pending_invite' | 'active' | 'suspended' | 'removed';

export interface AdminInviteRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRole;
  permission_group: string;
  status: AdminInviteStatus;
  invited_by: string;
  invited_at: string;
  last_sign_in_at: string | null;
  note: string;
}

export const adminInvites = createCollection<AdminInviteRow>({
  key: 'mh-travel-admin-invites',
  seed: [] as AdminInviteRow[],
  id: (row) => row.id,
  isRow: (value): value is AdminInviteRow => {
    if (!value || typeof value !== 'object') return false;
    const row = value as Partial<AdminInviteRow>;
    return typeof row.id === 'string' && typeof row.email === 'string' && typeof row.role === 'string';
  },
  normalize: (row) => ({
    ...row,
    phone: row.phone ?? '',
    note: row.note ?? '',
    last_sign_in_at: row.last_sign_in_at ?? null,
  }),
  mergeSeed: false,
});

export function inviteSummary(rows: AdminInviteRow[]): { total: number; active: number; pending: number; groups: number } {
  return {
    total: rows.length,
    active: rows.filter((row) => row.status === 'active').length,
    pending: rows.filter((row) => row.status === 'pending_invite').length,
    groups: new Set(rows.map((row) => row.permission_group)).size,
  };
}
