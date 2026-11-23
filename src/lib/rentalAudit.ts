/**
 * Plan §8.8: "Every write goes to the audit log." The Rental Admin edits the
 * catalog from one form, so the log records what changed between the version
 * that was stored and the version being saved — a diff, not a copy of the
 * whole catalog, because a founder reading it wants to know what moved.
 */

export type RentalAuditSection = 'catalog' | 'availability' | 'rates' | 'branches' | 'terms' | 'settings' | 'order';

export type RentalAuditChange = {
  section: RentalAuditSection;
  /** A stable, human-readable path such as `rates[rate_1].rateLocalUsd`. */
  field: string;
  from: string;
  to: string;
};

export type RentalAuditEntry = {
  id: string;
  at: string;
  actor: string;
  /** The order a change belongs to, when it is an order change. */
  orderCode?: string;
  changes: RentalAuditChange[];
};

const MAX_ENTRIES = 200;

export const RENTAL_AUDIT_KEY = 'mh-travel-rental-audit';
const RENTAL_AUDIT_EVENT = 'mh-travel-rental-audit-changed';

function sectionOf(path: string): RentalAuditSection {
  if (path.startsWith('availability')) return 'availability';
  if (path.startsWith('rates')) return 'rates';
  if (path.startsWith('cities')) return 'branches';
  if (path.startsWith('terms')) return 'terms';
  if (path.startsWith('settings')) return 'settings';
  return 'catalog';
}

/** Flattens a catalog into `path -> value` so two versions can be compared. */
function flatten(value: unknown, prefix = '', out = new Map<string, string>()): Map<string, string> {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      const id = item && typeof item === 'object' && 'id' in item ? String((item as { id: unknown }).id) : String(index);
      flatten(item, prefix ? `${prefix}[${id}]` : `[${id}]`, out);
    });
    return out;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
    return out;
  }
  out.set(prefix, value === null || value === undefined ? '' : String(value));
  return out;
}

/**
 * The fields worth logging. Timestamps and history entries change on their own
 * when nothing the Admin decided has changed, so they would bury the real edits.
 */
function isNoisy(path: string): boolean {
  return /\.publishedAt$/.test(path) || path.startsWith('termsHistory');
}

export function diffRentalCatalog(before: unknown, after: unknown): RentalAuditChange[] {
  const from = flatten(before);
  const to = flatten(after);
  const paths = new Set([...from.keys(), ...to.keys()]);
  const changes: RentalAuditChange[] = [];
  for (const path of paths) {
    if (isNoisy(path)) continue;
    const oldValue = from.get(path) ?? '';
    const newValue = to.get(path) ?? '';
    if (oldValue === newValue) continue;
    changes.push({ section: sectionOf(path), field: path, from: oldValue, to: newValue });
  }
  return changes.sort((a, b) => a.field.localeCompare(b.field));
}

export function readRentalAudit(): RentalAuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(RENTAL_AUDIT_KEY) || '[]');
    return Array.isArray(stored) ? (stored as RentalAuditEntry[]) : [];
  } catch {
    return [];
  }
}

export function writeRentalAudit(entries: RentalAuditEntry[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(RENTAL_AUDIT_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  window.dispatchEvent(new Event(RENTAL_AUDIT_EVENT));
}

/**
 * Records one save. A save that changed nothing writes nothing, so the log
 * stays a list of decisions rather than of button presses.
 */
export function recordRentalAudit(before: unknown, after: unknown, actor: string, at = new Date()): RentalAuditEntry | null {
  const changes = diffRentalCatalog(before, after);
  if (changes.length === 0) return null;
  const entry: RentalAuditEntry = {
    id: `rental-audit-${at.getTime()}`,
    at: at.toISOString(),
    actor,
    changes,
  };
  writeRentalAudit([entry, ...readRentalAudit()]);
  return entry;
}

/**
 * Plan §8.5: a status change is an admin decision too, so it gets the same
 * audit row the catalog edits do. The event timeline on the order keeps the
 * staff-facing history; this keeps the cross-order record.
 */
export function recordOrderAudit(
  orderCode: string,
  field: 'status' | 'startDate' | 'extras',
  from: string,
  to: string,
  actor: string,
  at = new Date(),
): RentalAuditEntry {
  const entry: RentalAuditEntry = {
    id: `rental-order-audit-${orderCode}-${field}-${at.getTime()}`,
    at: at.toISOString(),
    actor,
    orderCode,
    changes: [{ section: 'order', field, from, to }],
  };
  writeRentalAudit([entry, ...readRentalAudit()]);
  return entry;
}

export function auditChangedEvent(): string {
  return RENTAL_AUDIT_EVENT;
}
