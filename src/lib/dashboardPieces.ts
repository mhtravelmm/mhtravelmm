/**
 * Plan §3A.14 and §3A.2 rule 7: the four pieces every dashboard section shares —
 * the type-to-confirm dialog, the CSV export, the not-allowed state and the
 * version-conflict reload. They live here rather than in one panel so the rule
 * is the same in every section, and so the rule can be tested without rendering
 * a screen.
 */

export type DestructiveAction =
  | 'delete'
  | 'suspend_user'
  | 'suspend_owner'
  | 'remove_admin'
  | 'retire_listing'
  | 'cancel_order'
  | 'role_change';

/**
 * §3A.2 rule 7: every destructive action asks for a reason; the heaviest also
 * ask the actor to type the object's name, because a mis-click must not be able
 * to remove an account or a shop.
 */
const TYPED_NAME_ACTIONS: DestructiveAction[] = ['delete', 'suspend_owner', 'remove_admin'];

export function requiresTypedName(action: DestructiveAction): boolean {
  return TYPED_NAME_ACTIONS.includes(action);
}

/** A reason is required, and one word is not a reason. */
export const MIN_REASON_LENGTH = 8;

export type ConfirmProblem = 'reason_missing' | 'reason_too_short' | 'name_mismatch';

export interface ConfirmDraft {
  action: DestructiveAction;
  objectName: string;
  reason: string;
  typedName: string;
}

export type ConfirmCheck = { ok: true; reason: string } | { ok: false; problem: ConfirmProblem };

/**
 * The dialog's single rule. The name is compared trimmed and case-insensitively,
 * because a person retyping a name should not fail on a trailing space, but it
 * is still compared in full: a prefix is not the object.
 */
export function checkConfirm(draft: ConfirmDraft): ConfirmCheck {
  const reason = draft.reason.trim();
  if (reason.length === 0) return { ok: false, problem: 'reason_missing' };
  if (reason.length < MIN_REASON_LENGTH) return { ok: false, problem: 'reason_too_short' };
  if (requiresTypedName(draft.action)) {
    const typed = draft.typedName.trim().toLowerCase();
    const expected = draft.objectName.trim().toLowerCase();
    if (typed !== expected) return { ok: false, problem: 'name_mismatch' };
  }
  return { ok: true, reason };
}

/**
 * §3A.14: a list exports exactly the rows its filters show. The caller passes
 * the filtered rows, so this cannot export more than the screen does.
 */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

/**
 * RFC 4180 quoting, plus the two things a spreadsheet needs: a UTF-8 byte-order
 * mark so Excel reads Myanmar text as UTF-8 (§3A.16 criterion 11), and a guard
 * against a cell being read as a formula — a value that starts with `=`, `+`,
 * `-` or `@` is prefixed with an apostrophe.
 */
function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export function buildCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const header = columns.map((column) => csvCell(column.header)).join(',');
  const body = rows.map((row) => columns.map((column) => csvCell(column.value(row))).join(','));
  return `\uFEFF${[header, ...body].join('\r\n')}\r\n`;
}

/** The file name a browser saves: the section, then the day in Myanmar Time. */
export function csvFileName(section: string, at: Date): string {
  const mmTime = new Date(at.getTime() + 6.5 * 60 * 60 * 1000);
  const day = mmTime.toISOString().slice(0, 10);
  return `mh-travel-${section}-${day}.csv`;
}
