import { beforeEach, describe, expect, it } from 'vitest';
import { readAdminAudit, recordAdminAudit, writeAdminAudit } from './adminAudit';

function fakeWindow() {
  const map = new Map<string, string>();
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => { map.set(key, value); },
      removeItem: (key: string) => { map.delete(key); },
      clear: () => map.clear(),
      key: () => null,
      get length() { return map.size; },
    },
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
}

beforeEach(() => { fakeWindow(); });

const base = {
  actor: 'MH Travel Super Admin',
  actorRole: 'Super Admin' as const,
  action: 'created' as const,
  objectType: 'admin_account' as const,
  objectId: 'may.noe@mhtravel.com',
  summary: 'May Myat Noe · Ads Admin',
  source: 'admin_workspace' as const,
};

describe('adminAudit', () => {

  it('starts empty so a fresh browser has nothing to show', () => {
    expect(readAdminAudit()).toEqual([]);
  });

  it('writes one row per decision, newest first', () => {
    recordAdminAudit(base, new Date('2026-11-23T08:00:00.000Z'));
    recordAdminAudit({ ...base, action: 'payment', objectType: 'guide_earning', objectId: 'earn-tg1' }, new Date('2026-11-23T09:00:00.000Z'));
    const entries = readAdminAudit();
    expect(entries).toHaveLength(2);
    expect(entries[0].objectType).toBe('guide_earning');
    expect(entries[0].at).toBe('2026-11-23T09:00:00.000Z');
  });

  it('keeps the actor, role and source on every row', () => {
    const entry = recordAdminAudit({ ...base, actorRole: 'Payment Admin', source: 'earnings' });
    expect(entry).toMatchObject({ actorRole: 'Payment Admin', source: 'earnings', action: 'created' });
  });

  it('gives each row a unique id even inside the same millisecond', () => {
    const at = new Date('2026-11-23T10:00:00.000Z');
    const first = recordAdminAudit(base, at);
    const second = recordAdminAudit({ ...base, objectId: 'other@mhtravel.com' }, at);
    expect(first.id).not.toBe(second.id);
  });

  it('keeps the newest 500 rows so the log cannot grow without bound', () => {
    const rows = Array.from({ length: 510 }, (_, index) => ({ ...base, id: `audit-${index}`, at: new Date().toISOString() }));
    writeAdminAudit(rows);
    expect(readAdminAudit()).toHaveLength(500);
    expect(readAdminAudit()[0].id).toBe('audit-0');
  });

  it('ignores a corrupted store instead of throwing', () => {
    window.localStorage.setItem('mh-travel-admin-audit', 'not json');
    expect(readAdminAudit()).toEqual([]);
  });
});
