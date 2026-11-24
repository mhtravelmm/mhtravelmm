import { useCallback, useEffect, useState } from 'react';
import { isBotUserAgent, newSessionHash } from './adStats';
import { addDaysToDay, myanmarToday } from './myanmarTime';
import {
  TEMPLATE_GRACE_DAYS,
  applyTemplate,
  cancelTemplate,
  entitlementForShop,
  freeTemplateFor,
  recordTemplatePayment,
  resolveShopTemplate,
  seedTemplates,
  startRetirement,
  type ResolvedTemplate,
  type ShopPageSettings,
  type ShopTemplate,
  type TemplateCategory,
  type TemplateEntitlement,
  type TemplateInvoice,
} from './shopTemplates';
import {
  TEMPLATE_EVENT_RETENTION_DAYS,
  appendTemplateEvent,
  purgeTemplateEvents,
  type TemplateEvent,
} from './templateStats';

/**
 * Plan §4: the browser stand-in for `shop_templates`, `shop_page_settings`,
 * `shop_template_entitlements` and `template_invoices`. The panels only call
 * this module, so applying the migration swaps the storage and not the UI.
 */
const TEMPLATES_KEY = 'mh-travel-shop-templates';
const SETTINGS_KEY = 'mh-travel-shop-page-settings';
const ENTITLEMENTS_KEY = 'mh-travel-template-entitlements';
const INVOICES_KEY = 'mh-travel-template-invoices';
const CHANGED_EVENT = 'mh-travel-shop-templates-changed';

/** The two shops the owner panels already seed. */
const SEEDED_SHOPS: { shopId: string; ownerName: string; category: TemplateCategory }[] = [
  { shopId: 'rangoon_house', ownerName: 'The Rangoon House', category: 'hotel' },
  { shopId: 'mandalay_booknook', ownerName: 'Mandalay Book Nook', category: 'book_shop' },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function changed(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

export function readTemplates(): ShopTemplate[] {
  const rows = readJson<ShopTemplate[] | null>(TEMPLATES_KEY, null);
  if (!rows) return seedTemplates();
  return Array.isArray(rows) ? rows.filter((row) => typeof row.id === 'string') : seedTemplates();
}

function seedSettings(): ShopPageSettings[] {
  return SEEDED_SHOPS.map((shop) => ({
    shopId: shop.shopId,
    ownerName: shop.ownerName,
    activeTemplateId: freeTemplateFor(seedTemplates(), shop.category)?.id ?? 'hotel_classic',
    appliedAt: new Date().toISOString(),
  }));
}

export function readPageSettings(): ShopPageSettings[] {
  const rows = readJson<ShopPageSettings[] | null>(SETTINGS_KEY, null);
  if (!rows) return seedSettings();
  return Array.isArray(rows) ? rows.filter((row) => typeof row.shopId === 'string') : seedSettings();
}

/** One shop starts on a paid template so the fallback has something to show. */
function seedEntitlements(now = new Date()): TemplateEntitlement[] {
  return [
    {
      id: 'tent-rangoon_house',
      shopId: 'rangoon_house',
      ownerName: 'The Rangoon House',
      templateId: 'hotel_editorial',
      status: 'active',
      periodStart: addDaysToDay(myanmarToday(now), -20),
      periodEnd: addDaysToDay(myanmarToday(now), 10),
      graceDays: TEMPLATE_GRACE_DAYS,
    },
  ];
}

export function readEntitlements(now = new Date()): TemplateEntitlement[] {
  const rows = readJson<TemplateEntitlement[] | null>(ENTITLEMENTS_KEY, null);
  if (!rows) return seedEntitlements(now);
  return Array.isArray(rows) ? rows.filter((row) => typeof row.shopId === 'string') : seedEntitlements(now);
}

export function readInvoices(): TemplateInvoice[] {
  const rows = readJson<TemplateInvoice[] | null>(INVOICES_KEY, null);
  return Array.isArray(rows) ? rows.filter((row) => typeof row.id === 'string') : [];
}

export function writeTemplates(rows: ShopTemplate[]): void {
  writeJson(TEMPLATES_KEY, rows);
  changed();
}

export type ApplyOutcome =
  | { ok: true; switchedFrom: string }
  | { ok: false; reason: string };

/**
 * §4 the owner's switch. The settings row is the only thing that moves, so the
 * shop's profile, catalog and bookings are untouched by definition.
 */
export function applyShopTemplate(shopId: string, templateId: string, now = new Date()): ApplyOutcome {
  const templates = readTemplates();
  const settings = readPageSettings().find((row) => row.shopId === shopId);
  if (!settings) return { ok: false, reason: 'unknown_shop' };
  const result = applyTemplate({
    templates,
    settings,
    entitlement: entitlementForShop(readEntitlements(now), shopId),
    templateId,
    now,
  });
  if (!result.ok) return result;
  const others = readPageSettings().filter((row) => row.shopId !== shopId);
  writeJson(SETTINGS_KEY, [...others, result.settings]);
  changed();
  return { ok: true, switchedFrom: result.switchedFrom };
}

/** §4: back to free at any time, and the entitlement is cancelled with it. */
export function cancelShopTemplate(shopId: string, now = new Date()): void {
  const templates = readTemplates();
  const settings = readPageSettings().find((row) => row.shopId === shopId);
  if (!settings) return;
  const result = cancelTemplate({
    templates,
    settings,
    entitlement: entitlementForShop(readEntitlements(now), shopId),
    now,
  });
  const otherSettings = readPageSettings().filter((row) => row.shopId !== shopId);
  writeJson(SETTINGS_KEY, [...otherSettings, result.settings]);
  if (result.entitlement) {
    const otherEntitlements = readEntitlements(now).filter((row) => row.shopId !== shopId);
    writeJson(ENTITLEMENTS_KEY, [...otherEntitlements, result.entitlement]);
  }
  changed();
}

/** §16B.1: Payment Admin records the payment, which extends one month. */
export function payForTemplate(shopId: string, templateId: string, recordedBy: string, now = new Date()): TemplateInvoice | null {
  const template = readTemplates().find((row) => row.id === templateId);
  if (!template || template.isFree) return null;
  const existing = entitlementForShop(readEntitlements(now), shopId);
  const result = recordTemplatePayment({
    template,
    entitlement: existing,
    shopId,
    recordedBy,
    invoiceId: `tinv-${shopId}-${now.getTime()}`,
    now,
  });
  const otherEntitlements = readEntitlements(now).filter((row) => row.shopId !== shopId);
  writeJson(ENTITLEMENTS_KEY, [...otherEntitlements, result.entitlement]);
  writeJson(INVOICES_KEY, [...readInvoices(), result.invoice]);
  changed();
  return result.invoice;
}

/** §4 Admin: activate, retire with a 30-day notice, or roll a version back. */
export function setTemplateStatus(templateId: string, status: 'active' | 'retired' | 'draft', now = new Date()): ShopTemplate[] {
  const templates = readTemplates();
  const next = templates.map((template) => {
    if (template.id !== templateId) return template;
    if (status === 'retired') return startRetirement(template, template.replacedBy, now);
    return { ...template, status };
  });
  writeTemplates(next);
  return next;
}

/** The category a shop belongs to, which decides its free baseline. */
export function shopCategory(shopId: string): TemplateCategory | undefined {
  return SEEDED_SHOPS.find((row) => row.shopId === shopId)?.category;
}

/** The shop a byline owns, so a panel never guesses another shop's id. */
export function shopIdForOwner(ownerName: string): string | undefined {
  const needle = ownerName.trim().toLowerCase();
  if (!needle) return undefined;
  return SEEDED_SHOPS.find((row) => row.ownerName.trim().toLowerCase() === needle)?.shopId;
}

/** The one read a shop page or the owner panel uses. */
export function resolveTemplateForShop(shopId: string, now = new Date()): ResolvedTemplate {
  const templates = readTemplates();
  const settings = readPageSettings().find((row) => row.shopId === shopId);
  const shop = SEEDED_SHOPS.find((row) => row.shopId === shopId);
  if (!settings) return { templateId: '', reason: 'free_default' };
  return resolveShopTemplate({
    templates,
    settings,
    entitlement: entitlementForShop(readEntitlements(now), shopId),
    category: shop?.category,
    now,
  });
}

function useStored<T>(read: () => T): T {
  const [value, setValue] = useState<T>(read);
  const sync = useCallback(() => setValue(read()), [read]);
  useEffect(() => {
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [sync]);
  return value;
}

export function useTemplates(): ShopTemplate[] {
  return useStored(readTemplates);
}

export function usePageSettings(): ShopPageSettings[] {
  return useStored(readPageSettings);
}

export function useEntitlements(): TemplateEntitlement[] {
  return useStored(readEntitlements);
}

export function useTemplateInvoices(): TemplateInvoice[] {
  return useStored(readInvoices);
}

/**
 * Plan §4 analytics: the browser stand-in for `shop_template_events`. A view is
 * one public render, an apply is one switch, and a preview is neither.
 */
const EVENTS_KEY = 'mh-travel-template-events';

export function readTemplateEvents(): TemplateEvent[] {
  const rows = readJson<TemplateEvent[] | null>(EVENTS_KEY, null);
  return Array.isArray(rows) ? rows.filter((row) => typeof row.templateId === 'string') : [];
}

function writeTemplateEvents(rows: TemplateEvent[]): void {
  writeJson(EVENTS_KEY, rows);
  changed();
}

/** §4: an owner trying a design on their own data is not a shopper, so a preview is never counted. */
export function recordTemplateView(input: {
  templateId: string;
  shopId: string;
  sessionHash: string;
  language?: 'mm' | 'en';
  preview?: boolean;
  now?: Date;
}): boolean {
  if (typeof window === 'undefined' || input.preview || !input.templateId) return false;
  if (typeof navigator !== 'undefined' && isBotUserAgent(navigator.userAgent)) return false;
  const now = input.now ?? new Date();
  const current = readTemplateEvents();
  const next = appendTemplateEvent(current, {
    id: `tpl-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    templateId: input.templateId,
    shopId: input.shopId,
    kind: 'view',
    at: now.toISOString(),
    sessionHash: input.sessionHash,
    language: input.language,
  });
  if (next === current) return false;
  writeTemplateEvents(next);
  return true;
}

/** §4: one apply row per switch that actually moved the shop. */
export function recordTemplateApply(input: {
  templateId: string;
  shopId: string;
  sessionHash: string;
  now?: Date;
}): void {
  if (typeof window === 'undefined' || !input.templateId) return;
  const now = input.now ?? new Date();
  writeTemplateEvents(appendTemplateEvent(readTemplateEvents(), {
    id: `tpl-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    templateId: input.templateId,
    shopId: input.shopId,
    kind: 'apply',
    at: now.toISOString(),
    sessionHash: input.sessionHash,
  }));
}

/** §16B.7 `template_events_purge`: keeps the retention window and nothing older. */
export function purgeTemplateEventRows(now = new Date()): number {
  const { kept, purged } = purgeTemplateEvents(readTemplateEvents(), now, TEMPLATE_EVENT_RETENTION_DAYS);
  if (purged > 0) writeTemplateEvents(kept);
  return purged;
}

/** The page-view key, so one render counts once whatever React re-renders. */
export function templateSessionHash(): string {
  return newSessionHash();
}

export function useTemplateEvents(): TemplateEvent[] {
  return useStored(readTemplateEvents);
}
