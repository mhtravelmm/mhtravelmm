import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyShopTemplate,
  cancelShopTemplate,
  payForTemplate,
  readEntitlements,
  readInvoices,
  readPageSettings,
  readTemplates,
  resolveTemplateForShop,
  setTemplateStatus,
  writeTemplates,
} from './shopTemplateStore';

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

const NOW = new Date('2026-11-28T06:00:00.000Z');

beforeEach(() => { fakeWindow(); });

describe('shopTemplateStore (Plan §4)', () => {
  it('seeds the launch catalog and two shops on their free template', () => {
    expect(readTemplates().length).toBeGreaterThanOrEqual(8);
    const settings = readPageSettings();
    expect(settings.map((row) => row.shopId).sort()).toEqual(['mandalay_booknook', 'rangoon_house']);
    expect(settings.every((row) => row.ownerName !== '')).toBe(true);
  });

  it('seeds one live entitlement so the paid path has something to resolve', () => {
    const ent = readEntitlements(NOW);
    expect(ent).toHaveLength(1);
    expect(ent[0].shopId).toBe('rangoon_house');
    expect(ent[0].ownerName).toBe('The Rangoon House');
  });

  it('switches a shop onto a paid template it has paid for', () => {
    const outcome = applyShopTemplate('rangoon_house', 'hotel_editorial', NOW);
    expect(outcome).toEqual({ ok: true, switchedFrom: 'hotel_classic' });
    expect(resolveTemplateForShop('rangoon_house', NOW).templateId).toBe('hotel_editorial');
  });

  it('refuses a paid template once the entitlement and its grace have lapsed', () => {
    payForTemplate('rangoon_house', 'hotel_editorial', 'Payment Admin', NOW);
    const later = new Date(NOW.getTime() + 60 * 24 * 60 * 60 * 1000);
    const outcome = applyShopTemplate('rangoon_house', 'hotel_compact', later);
    expect(outcome).toEqual({ ok: false, reason: 'needs_payment' });
    expect(resolveTemplateForShop('rangoon_house', later)).toEqual({
      templateId: 'hotel_classic',
      reason: 'served',
    });
  });

  it('refuses a template from another category', () => {
    const outcome = applyShopTemplate('mandalay_booknook', 'hotel_compact', NOW);
    expect(outcome).toEqual({ ok: false, reason: 'wrong_category' });
    expect(resolveTemplateForShop('mandalay_booknook', NOW).templateId).toBe('book_shop_classic');
  });

  it('returns a shop to free and cancels the entitlement', () => {
    applyShopTemplate('rangoon_house', 'hotel_editorial', NOW);
    cancelShopTemplate('rangoon_house', NOW);
    expect(resolveTemplateForShop('rangoon_house', NOW)).toEqual({ templateId: 'hotel_classic', reason: 'served' });
    expect(readEntitlements(NOW).find((row) => row.shopId === 'rangoon_house')?.status).toBe('cancelled');
  });

  it('records a payment and extends the entitlement by one month', () => {
    const before = readEntitlements(NOW)[0];
    const invoice = payForTemplate('rangoon_house', 'hotel_editorial', 'Payment Admin', NOW);
    expect(invoice?.amountMmk).toBe(2000);
    expect(invoice?.recordedBy).toBe('Payment Admin');
    const after = readEntitlements(NOW).find((row) => row.shopId === 'rangoon_house');
    expect(new Date(after!.periodEnd).getTime()).toBeGreaterThan(new Date(before.periodEnd).getTime());
    expect(readInvoices()).toHaveLength(1);
  });

  it('refuses to bill the free template', () => {
    expect(payForTemplate('rangoon_house', 'hotel_classic', 'Payment Admin', NOW)).toBeNull();
    expect(readInvoices()).toEqual([]);
  });

  it('falls back to free when a paid entitlement is cancelled', () => {
    applyShopTemplate('rangoon_house', 'hotel_editorial', NOW);
    cancelShopTemplate('rangoon_house', NOW);
    const resolved = resolveTemplateForShop('rangoon_house', NOW);
    expect(resolved.templateId).toBe('hotel_classic');
  });

  it('keeps serving a retired template through its notice, then moves off it', () => {
    applyShopTemplate('rangoon_house', 'hotel_editorial', NOW);
    setTemplateStatus('hotel_editorial', 'retired', NOW);
    expect(resolveTemplateForShop('rangoon_house', NOW)).toEqual({
      templateId: 'hotel_editorial',
      reason: 'served',
      noticeEndsOn: '2026-12-28',
    });
    const later = new Date(NOW.getTime() + 40 * 24 * 60 * 60 * 1000);
    expect(resolveTemplateForShop('rangoon_house', later).reason).toBe('retired_moved');
  });

  it('rolls a template back to draft and serves the previous version', () => {
    const withPrevious = readTemplates().map((template) =>
      template.id === 'hotel_editorial' ? { ...template, previousVersionId: 'hotel_classic' } : template,
    );
    writeTemplates(withPrevious);
    applyShopTemplate('rangoon_house', 'hotel_editorial', NOW);
    setTemplateStatus('hotel_editorial', 'draft', NOW);
    expect(resolveTemplateForShop('rangoon_house', NOW)).toEqual({ templateId: 'hotel_classic', reason: 'rolled_back' });
  });

  it('never resolves another shop’s template', () => {
    applyShopTemplate('rangoon_house', 'hotel_editorial', NOW);
    expect(resolveTemplateForShop('mandalay_booknook', NOW).templateId).toBe('book_shop_classic');
  });

  it('answers an unknown shop with nothing to render rather than a paid template', () => {
    expect(resolveTemplateForShop('no_such_shop', NOW)).toEqual({ templateId: '', reason: 'free_default' });
  });

  it('refuses a switch on an unknown shop', () => {
    expect(applyShopTemplate('no_such_shop', 'hotel_editorial', NOW)).toEqual({ ok: false, reason: 'unknown_shop' });
  });
});
