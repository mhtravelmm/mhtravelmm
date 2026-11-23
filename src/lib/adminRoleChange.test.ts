import { describe, expect, it } from 'vitest';
import { planRoleChange, roleChangeSummary } from './adminRoleChange';

const base = {
  actorRole: 'Super Admin' as const,
  actorEmail: 'superadmin@mhtravel.com',
  targetEmail: 'thazin@mhtravel.com',
  targetRole: 'Blog Post Admin' as const,
  nextRole: 'Admin' as const,
};

describe('planRoleChange', () => {
  it('allows a Super Admin to change another admin', () => {
    expect(planRoleChange(base)).toEqual({ ok: true, from: 'Blog Post Admin', to: 'Admin' });
  });

  it('refuses anyone who is not a Super Admin', () => {
    expect(planRoleChange({ ...base, actorRole: 'Admin' })).toEqual({ ok: false, reason: 'not_super_admin' });
    expect(planRoleChange({ ...base, actorRole: undefined })).toEqual({ ok: false, reason: 'not_super_admin' });
  });

  it('refuses a change to your own account', () => {
    expect(planRoleChange({ ...base, targetEmail: 'SuperAdmin@mhtravel.com ' })).toEqual({ ok: false, reason: 'self' });
  });

  it('keeps the Super Admin row out of reach', () => {
    expect(planRoleChange({ ...base, targetRole: 'Super Admin' })).toEqual({ ok: false, reason: 'super_admin_locked' });
  });

  it('treats a no-op as refused so no empty audit row is written', () => {
    expect(planRoleChange({ ...base, nextRole: 'Blog Post Admin' })).toEqual({ ok: false, reason: 'unchanged' });
  });

  it('refuses a role that is not one of the eight', () => {
    expect(planRoleChange({ ...base, nextRole: '' as never })).toEqual({ ok: false, reason: 'unknown_role' });
    expect(planRoleChange({ ...base, nextRole: 'Root' as never })).toEqual({ ok: false, reason: 'unknown_role' });
  });

  it('summarises the change for the audit row', () => {
    expect(roleChangeSummary('Rental Admin', 'Payment Admin')).toBe('Rental Admin → Payment Admin');
  });
});
