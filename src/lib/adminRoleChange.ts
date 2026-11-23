import { ADMIN_ROLES, type AdminRole } from './adminRoles';

/**
 * Plan §16B.1: Super Admin creates every other admin account, and §16B.2 asks
 * for a row on every role change. The rules below are the ones a Super Admin
 * must not be able to talk their way past, so they live in one place instead of
 * being re-checked inside the panel.
 */
export type RoleChangeRefusal =
  | 'not_super_admin'
  | 'self'
  | 'super_admin_locked'
  | 'unchanged'
  | 'unknown_role';

export type RoleChangePlan =
  | { ok: true; from: AdminRole; to: AdminRole }
  | { ok: false; reason: RoleChangeRefusal };

export interface RoleChangeInput {
  actorRole: AdminRole | undefined;
  actorEmail: string;
  targetEmail: string;
  targetRole: AdminRole;
  nextRole: AdminRole;
}

function sameEmail(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function planRoleChange(input: RoleChangeInput): RoleChangePlan {
  if (input.actorRole !== 'Super Admin') return { ok: false, reason: 'not_super_admin' };
  // Changing your own role is how the only Super Admin locks themselves out.
  if (sameEmail(input.actorEmail, input.targetEmail)) return { ok: false, reason: 'self' };
  if (input.targetRole === 'Super Admin') return { ok: false, reason: 'super_admin_locked' };
  // A select that submits nothing must not write a role, an audit row, or a
  // summary ending in an arrow with no destination.
  if (!ADMIN_ROLES.includes(input.nextRole)) return { ok: false, reason: 'unknown_role' };
  if (input.targetRole === input.nextRole) return { ok: false, reason: 'unchanged' };
  return { ok: true, from: input.targetRole, to: input.nextRole };
}

/** The audit summary §16B.2 wants: what it was, what it became. */
export function roleChangeSummary(from: AdminRole, to: AdminRole): string {
  return `${from} → ${to}`;
}
