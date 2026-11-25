import { useCallback, useEffect, useState } from 'react';
import type { AdminRole } from './adminRoles';
import { useAuth } from './auth';

/**
 * Plan §16B.2: every create, update, payment and role change writes one row —
 * actor, role, action, object type, object id, a short summary, time (UTC) and
 * the source. Rows are append-only. This is the browser stand-in for
 * `admin_audit_logs`; the table replaces it without changing the call sites.
 */
export type AdminAuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'published'
  | 'approved'
  | 'payment'
  | 'preview'
  | 'role_change';

export type AdminAuditObject =
  | 'admin_account'
  | 'shop_owner'
  | 'guide_earning'
  | 'guide'
  | 'blog'
  | 'ad'
  | 'rental_order'
  | 'currency_rate'
  | 'translation'
  | 'ad_campaign'
  | 'ad_creative'
  | 'owner_payout'
  | 'owner_commission'
  | 'shop_template'
  | 'template_entitlement'
  | 'listing';

export interface AdminAuditEntry {
  id: string;
  /** ISO timestamp in UTC. */
  at: string;
  actor: string;
  actorRole: AdminRole | 'system';
  action: AdminAuditAction;
  objectType: AdminAuditObject;
  objectId: string;
  /** Short before/after or what changed, in one line. */
  summary: string;
  source:
    | 'admin_workspace'
    | 'auth'
    | 'earnings'
    | 'content'
    | 'rental_orders'
    | 'currency'
    | 'ads'
    | 'subscriptions'
    | 'payouts'
    | 'templates'
    | 'listings';
}

const STORAGE_KEY = 'mh-travel-admin-audit';
const CHANGED_EVENT = 'mh-travel-admin-audit-changed';
const MAX_ENTRIES = 500;

function isEntry(value: unknown): value is AdminAuditEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<AdminAuditEntry>;
  return typeof entry.id === 'string' && typeof entry.at === 'string' && typeof entry.action === 'string';
}

export function readAdminAudit(): AdminAuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

export function writeAdminAudit(entries: AdminAuditEntry[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function recordAdminAudit(
  input: Omit<AdminAuditEntry, 'id' | 'at'>,
  at = new Date(),
): AdminAuditEntry {
  const entry: AdminAuditEntry = {
    ...input,
    id: `audit-${input.objectType}-${input.objectId}-${at.getTime()}`,
    at: at.toISOString(),
  };
  writeAdminAudit([entry, ...readAdminAudit()]);
  return entry;
}

/**
 * Binds the row to whoever is signed in, so a panel writes what changed and
 * not who did it. Every §16B.2 write site uses this rather than passing the
 * actor by hand.
 */
export function useAuditRecorder() {
  const { user, adminRole } = useAuth();
  return useCallback(
    (input: Omit<AdminAuditEntry, 'id' | 'at' | 'actor' | 'actorRole'>) =>
      recordAdminAudit({ ...input, actor: user?.name ?? '', actorRole: adminRole ?? 'system' }),
    [adminRole, user],
  );
}

export function useAdminAudit() {
  const [entries, setEntries] = useState<AdminAuditEntry[]>(readAdminAudit);

  useEffect(() => {
    const sync = () => setEntries(readAdminAudit());
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const record = useCallback((input: Omit<AdminAuditEntry, 'id' | 'at'>) => {
    const entry = recordAdminAudit(input);
    setEntries(readAdminAudit());
    return entry;
  }, []);

  return { entries, record };
}
