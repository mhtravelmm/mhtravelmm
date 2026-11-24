import { describe, expect, it } from 'vitest';
import { translate } from './translations';
import { ACTION_KEYS, ACTION_TONES, AUDIT_ACTIONS, OBJECT_KEYS, SOURCE_KEYS } from './adminAuditLabels';
import type { AdminAuditAction, AdminAuditObject } from './adminAudit';

const OBJECTS: AdminAuditObject[] = [
  'admin_account',
  'shop_owner',
  'guide_earning',
  'guide',
  'blog',
  'ad',
  'rental_order',
  'currency_rate',
  'translation',
  'ad_campaign',
  'ad_creative',
  'owner_payout',
  'owner_commission',
];

const SOURCES = ['admin_workspace', 'auth', 'earnings', 'content', 'rental_orders', 'currency', 'ads', 'subscriptions', 'payouts'] as const;

describe('adminAuditLabels', () => {
  it('names every action in both languages', () => {
    for (const action of AUDIT_ACTIONS) {
      expect(translate(ACTION_KEYS[action], 'mm')).toBeTruthy();
      expect(translate(ACTION_KEYS[action], 'en')).toBeTruthy();
      expect(ACTION_TONES[action]).toBeTruthy();
    }
  });

  it('names every object type in both languages', () => {
    for (const object of OBJECTS) {
      expect(translate(OBJECT_KEYS[object], 'mm')).toBeTruthy();
      expect(translate(OBJECT_KEYS[object], 'en')).toBeTruthy();
    }
  });

  it('names every source in both languages', () => {
    for (const source of SOURCES) {
      expect(translate(SOURCE_KEYS[source], 'mm')).toBeTruthy();
      expect(translate(SOURCE_KEYS[source], 'en')).toBeTruthy();
    }
  });

  it('keeps the action list and the label map in step', () => {
    const mapped: AdminAuditAction[] = Object.keys(ACTION_KEYS) as AdminAuditAction[];
    expect(new Set(mapped)).toEqual(new Set(AUDIT_ACTIONS));
  });
});
