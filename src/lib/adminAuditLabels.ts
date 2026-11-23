import type { TranslationKey } from './translations';
import type { AdminAuditAction, AdminAuditEntry, AdminAuditObject } from './adminAudit';

/**
 * The audit reader shows a label per action, object and source. They live here
 * rather than in the panel so a new type cannot ship without a translation —
 * `adminAuditLabels.test.ts` walks every member of each union.
 */
export const AUDIT_ACTIONS: AdminAuditAction[] = ['created', 'updated', 'deleted', 'published', 'approved', 'payment', 'role_change'];

export const ACTION_KEYS: Record<AdminAuditAction, TranslationKey> = {
  created: 'sa_audit_action_created',
  updated: 'sa_audit_action_updated',
  deleted: 'sa_audit_action_deleted',
  published: 'sa_audit_action_published',
  approved: 'sa_audit_action_approved',
  payment: 'sa_audit_action_payment',
  role_change: 'sa_audit_action_role_change',
};

export const OBJECT_KEYS: Record<AdminAuditObject, TranslationKey> = {
  admin_account: 'sa_audit_object_admin_account',
  shop_owner: 'sa_audit_object_shop_owner',
  guide_earning: 'sa_audit_object_guide_earning',
  guide: 'sa_audit_object_guide',
  blog: 'sa_audit_object_blog',
  ad: 'sa_audit_object_ad',
  rental_order: 'sa_audit_object_rental_order',
  currency_rate: 'sa_audit_object_currency_rate',
  translation: 'sa_audit_object_translation',
  ad_campaign: 'sa_audit_object_ad_campaign',
  ad_creative: 'sa_audit_object_ad_creative',
};

export const SOURCE_KEYS: Record<AdminAuditEntry['source'], TranslationKey> = {
  admin_workspace: 'sa_audit_source_admin_workspace',
  auth: 'sa_audit_source_auth',
  earnings: 'sa_audit_source_earnings',
  content: 'sa_audit_source_content',
  rental_orders: 'sa_audit_source_rental_orders',
  currency: 'sa_audit_source_currency',
  ads: 'sa_audit_source_ads',
  subscriptions: 'sa_audit_source_subscriptions',
};

export const ACTION_TONES: Record<AdminAuditAction, string> = {
  created: 'bg-emerald-500/20 text-emerald-300',
  updated: 'bg-sky-500/20 text-sky-200',
  deleted: 'bg-red-500/20 text-red-200',
  published: 'bg-indigo-500/20 text-indigo-200',
  approved: 'bg-teal-500/20 text-teal-200',
  payment: 'bg-amber-500/20 text-amber-200',
  role_change: 'bg-purple-500/20 text-purple-200',
};
