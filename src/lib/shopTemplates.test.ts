import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MIN_DIFFERING_AXES,
  TEMPLATE_GRACE_DAYS,
  TEMPLATE_PRICE_MMK_MONTH,
  applyTemplate,
  canPreviewTemplate,
  cancelTemplate,
  differingAxes,
  entitlementForShop,
  entitlementStatus,
  freeTemplateFor,
  hasLiveEntitlement,
  isGenuinelyDifferent,
  recordTemplatePayment,
  resolveShopTemplate,
  retirementDaysLeft,
  rollbackTemplate,
  seedTemplates,
  startRetirement,
  templateProblems,
  type ShopPageSettings,
  type ShopTemplate,
  type TemplateEntitlement,
} from './shopTemplates';

const NOW = new Date('2026-11-28T06:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

function template(over: Partial<ShopTemplate> = {}): ShopTemplate {
  return {
    id: 'hotel_x',
    category: 'hotel',
    nameMm: 'တယ်လိ',
    nameEn: 'Test',
    version: 1,
    status: 'active',
    previewImageKey: 'templates/x.webp',
    priceMmkMonth: TEMPLATE_PRICE_MMK_MONTH,
    isFree: false,
    traits: {
      layout: 'two_column',
      navigation: 'bottom_tabs',
      hero: 'split_panel',
      catalog: 'price_table',
      bookingCta: 'floating_button',
      gallery: 'thumbnail_strip',
      mobile: 'bottom_tabs',
    },
    ...over,
  };
}

function settings(over: Partial<ShopPageSettings> = {}): ShopPageSettings {
  return {
    shopId: 'rangoon_house',
    ownerName: 'The Rangoon House',
    activeTemplateId: 'hotel_classic',
    appliedAt: NOW.toISOString(),
    ...over,
  };
}

function entitlement(over: Partial<TemplateEntitlement> = {}): TemplateEntitlement {
  return {
    id: 'tent-1',
    shopId: 'rangoon_house',
    ownerName: 'The Rangoon House',
    templateId: 'hotel_editorial',
    status: 'active',
    periodStart: new Date(NOW.getTime() - 10 * DAY).toISOString(),
    periodEnd: new Date(NOW.getTime() + 20 * DAY).toISOString(),
    graceDays: TEMPLATE_GRACE_DAYS,
    ...over,
  };
}

describe('seedTemplates (Plan §4 launch set)', () => {
  it('launches with one free baseline per category', () => {
    const seeds = seedTemplates();
    for (const category of ['hotel', 'restaurant', 'cafe', 'book_shop', 'attraction'] as const) {
      expect(freeTemplateFor(seeds, category)?.isFree).toBe(true);
    }
  });

  it('gives hotels one free default and ten paid designs that all pass the axis test', () => {
    const hotels = seedTemplates().filter((t) => t.category === 'hotel');
    expect(hotels.filter((t) => t.isFree)).toHaveLength(1);
    expect(hotels.filter((t) => !t.isFree)).toHaveLength(10);
    // §4 "genuinely different": every live pair differs on at least four axes.
    for (const a of hotels) {
      for (const b of hotels) {
        if (a.id >= b.id) continue;
        expect(differingAxes(a, b).length).toBeGreaterThanOrEqual(MIN_DIFFERING_AXES);
      }
    }
  });

  it('prices every paid template at 2,000 MMK a month', () => {
    for (const t of seedTemplates()) {
      expect(t.priceMmkMonth).toBe(t.isFree ? 0 : TEMPLATE_PRICE_MMK_MONTH);
    }
  });

  it('has no catalog problem, so the launch set could be applied', () => {
    expect(templateProblems(seedTemplates())).toEqual([]);
  });

  it('is genuinely different on every live pair of a category', () => {
    const seeds = seedTemplates();
    const live = seeds.filter((t) => t.status === 'active');
    for (let i = 0; i < live.length; i += 1) {
      for (let j = i + 1; j < live.length; j += 1) {
        if (live[i].category !== live[j].category) continue;
        expect(isGenuinelyDifferent(live[i], live[j])).toBe(true);
      }
    }
  });
});

describe('the "genuinely different" test (§4)', () => {
  it('counts the axes that actually differ', () => {
    const a = template({ id: 'a' });
    const b = template({ id: 'b', traits: { ...a.traits, layout: 'gallery_hero', hero: 'photo_collage' } });
    expect(differingAxes(a, b)).toEqual(['layout', 'hero']);
  });

  it('fails a recolor, which changes no axis', () => {
    expect(isGenuinelyDifferent(template({ id: 'a' }), template({ id: 'b' }))).toBe(false);
  });

  it('passes at exactly four axes and fails at three', () => {
    const base = template({ id: 'a' });
    const four = template({
      id: 'b',
      traits: { ...base.traits, layout: 'x1', hero: 'x2', gallery: 'x3', mobile: 'x4' },
    });
    expect(differingAxes(base, four)).toHaveLength(MIN_DIFFERING_AXES);
    expect(isGenuinelyDifferent(base, four)).toBe(true);

    const three = template({ id: 'c', traits: { ...base.traits, layout: 'x1', hero: 'x2', gallery: 'x3' } });
    expect(isGenuinelyDifferent(base, three)).toBe(false);
  });
});

describe('templateProblems', () => {
  it('refuses a paid template that is not 2,000 MMK', () => {
    const problems = templateProblems([...seedTemplates(), template({ id: 'hotel_cheap', priceMmkMonth: 1000 })]);
    expect(problems.join(' ')).toContain('must cost 2000 MMK');
  });

  it('refuses a free template that charges', () => {
    const problems = templateProblems([template({ id: 'hotel_free', isFree: true, priceMmkMonth: 2000 })]);
    expect(problems.join(' ')).toContain('price must be 0');
  });

  it('refuses a category with no free baseline', () => {
    const problems = templateProblems([template({ id: 'hotel_only_paid' })]);
    expect(problems.join(' ')).toContain('exactly one free template');
  });

  it('refuses a retired template whose replacement is missing or not active', () => {
    const seeds = seedTemplates();
    const broken = seeds.map((t) => (t.id === 'hotel_editorial' ? { ...t, status: 'retired' as const, replacedBy: 'gone' } : t));
    expect(templateProblems(broken).join(' ')).toContain('replacement that does not exist');
  });
});

describe('entitlement status (§4 grace period)', () => {
  it('is active before periodEnd', () => {
    expect(entitlementStatus(entitlement(), NOW)).toBe('active');
  });

  it('is in grace for the 7 days after periodEnd', () => {
    const ent = entitlement({ periodEnd: new Date(NOW.getTime() - 3 * DAY).toISOString() });
    expect(entitlementStatus(ent, NOW)).toBe('grace');
    expect(hasLiveEntitlement(ent, NOW)).toBe(true);
  });

  it('is expired after the grace period', () => {
    const ent = entitlement({ periodEnd: new Date(NOW.getTime() - 8 * DAY).toISOString() });
    expect(entitlementStatus(ent, NOW)).toBe('expired');
    expect(hasLiveEntitlement(ent, NOW)).toBe(false);
  });

  it('stays cancelled even while the period is unspent', () => {
    expect(entitlementStatus(entitlement({ status: 'cancelled' }), NOW)).toBe('cancelled');
  });

  it('treats a missing entitlement as expired rather than free service', () => {
    expect(entitlementStatus(undefined, NOW)).toBe('expired');
  });

  it('picks the newest period per shop and never another shop', () => {
    const rows = [
      entitlement({ id: 'old', periodEnd: '2026-11-01T00:00:00.000Z' }),
      entitlement({ id: 'new', periodEnd: '2026-12-01T00:00:00.000Z' }),
      entitlement({ id: 'theirs', shopId: 'mandalay_booknook' }),
    ];
    expect(entitlementForShop(rows, 'rangoon_house')?.id).toBe('new');
  });
});

describe('applyTemplate (§4 the switch)', () => {
  it('moves a shop onto a paid template it has paid for', () => {
    const result = applyTemplate({
      templates: seedTemplates(),
      settings: settings(),
      entitlement: entitlement(),
      templateId: 'hotel_editorial',
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.settings.activeTemplateId).toBe('hotel_editorial');
    expect(result.switchedFrom).toBe('hotel_classic');
  });

  it('refuses a paid template with no entitlement, so payment comes first', () => {
    const result = applyTemplate({
      templates: seedTemplates(),
      settings: settings(),
      entitlement: undefined,
      templateId: 'hotel_editorial',
      now: NOW,
    });
    expect(result).toEqual({ ok: false, reason: 'needs_payment' });
  });

  it('allows a second paid template on the same entitlement, so a switch is not a second purchase', () => {
    const result = applyTemplate({
      templates: seedTemplates(),
      settings: settings({ activeTemplateId: 'hotel_editorial' }),
      entitlement: entitlement(),
      templateId: 'hotel_compact',
      now: NOW,
    });
    expect(result.ok).toBe(true);
  });

  it('always allows the free template', () => {
    const result = applyTemplate({
      templates: seedTemplates(),
      settings: settings({ activeTemplateId: 'hotel_editorial' }),
      entitlement: undefined,
      templateId: 'hotel_classic',
      now: NOW,
    });
    expect(result.ok).toBe(true);
  });

  it('refuses a draft or retired template', () => {
    const templates = seedTemplates().map((t) =>
      t.id === 'hotel_compact' ? { ...t, status: 'draft' as const } : t,
    );
    const result = applyTemplate({
      templates,
      settings: settings(),
      entitlement: entitlement(),
      templateId: 'hotel_compact',
      now: NOW,
    });
    expect(result).toEqual({ ok: false, reason: 'not_active' });
  });

  it('refuses an unknown template', () => {
    const result = applyTemplate({
      templates: seedTemplates(),
      settings: settings(),
      entitlement: entitlement(),
      templateId: 'nope',
      now: NOW,
    });
    expect(result).toEqual({ ok: false, reason: 'unknown_template' });
  });

  it('refuses a template from another category', () => {
    const result = applyTemplate({
      templates: seedTemplates(),
      settings: settings({ activeTemplateId: 'hotel_classic' }),
      entitlement: entitlement(),
      templateId: 'restaurant_classic',
      now: NOW,
    });
    expect(result).toEqual({ ok: false, reason: 'wrong_category' });
  });
});

describe('cancelTemplate (§4 back to free)', () => {
  it('returns the shop to its free baseline and cancels the entitlement', () => {
    const result = cancelTemplate({
      templates: seedTemplates(),
      settings: settings({ activeTemplateId: 'hotel_editorial' }),
      entitlement: entitlement(),
      now: NOW,
    });
    expect(result.settings.activeTemplateId).toBe('hotel_classic');
    expect(result.entitlement?.status).toBe('cancelled');
    expect(result.entitlement?.cancelledAt).toBe(NOW.toISOString());
  });

  it('keeps the free template when there was no entitlement', () => {
    const result = cancelTemplate({
      templates: seedTemplates(),
      settings: settings(),
      entitlement: undefined,
      now: NOW,
    });
    expect(result.settings.activeTemplateId).toBe('hotel_classic');
    expect(result.entitlement).toBeUndefined();
  });
});

describe('recordTemplatePayment (§4 Payment Admin)', () => {
  it('writes a paid invoice for one month at the catalog price', () => {
    const editorial = seedTemplates().find((t) => t.id === 'hotel_editorial')!;
    const result = recordTemplatePayment({
      template: editorial,
      entitlement: undefined,
      shopId: 'rangoon_house',
      recordedBy: 'Payment Admin',
      invoiceId: 'tinv-1',
      now: NOW,
    });
    expect(result.invoice.status).toBe('paid');
    expect(result.invoice.amountMmk).toBe(TEMPLATE_PRICE_MMK_MONTH);
    expect(result.invoice.recordedBy).toBe('Payment Admin');
    expect(new Date(result.entitlement.periodEnd).getTime() - new Date(result.entitlement.periodStart).getTime()).toBe(30 * DAY);
  });

  it('renews from the end of the period already paid, so paying early loses nothing', () => {
    const editorial = seedTemplates().find((t) => t.id === 'hotel_editorial')!;
    const existing = entitlement({ periodEnd: new Date(NOW.getTime() + 10 * DAY).toISOString() });
    const result = recordTemplatePayment({
      template: editorial,
      entitlement: existing,
      shopId: 'rangoon_house',
      recordedBy: 'Payment Admin',
      invoiceId: 'tinv-2',
      now: NOW,
    });
    expect(result.entitlement.periodStart).toBe(existing.periodEnd);
    expect(new Date(result.entitlement.periodEnd).getTime() - new Date(existing.periodEnd).getTime()).toBe(30 * DAY);
  });

  it('clears a cancellation, because the shop is paid up again', () => {
    const editorial = seedTemplates().find((t) => t.id === 'hotel_editorial')!;
    const result = recordTemplatePayment({
      template: editorial,
      entitlement: entitlement({ status: 'cancelled', cancelledAt: NOW.toISOString() }),
      shopId: 'rangoon_house',
      recordedBy: 'Payment Admin',
      invoiceId: 'tinv-3',
      now: NOW,
    });
    expect(result.entitlement.status).toBe('active');
    expect(result.entitlement.cancelledAt).toBeUndefined();
  });
});

describe('resolveShopTemplate (§4 fallback, the §16D Phase 3 gate)', () => {
  it('serves the shop its own template while it is paid for', () => {
    const resolved = resolveShopTemplate({
      templates: seedTemplates(),
      settings: settings({ activeTemplateId: 'hotel_editorial' }),
      entitlement: entitlement(),
      category: 'hotel',
      now: NOW,
    });
    expect(resolved).toEqual({ templateId: 'hotel_editorial', reason: 'served' });
  });

  it('falls back to free when the entitlement has lapsed', () => {
    const resolved = resolveShopTemplate({
      templates: seedTemplates(),
      settings: settings({ activeTemplateId: 'hotel_editorial' }),
      entitlement: entitlement({ periodEnd: new Date(NOW.getTime() - 30 * DAY).toISOString() }),
      category: 'hotel',
      now: NOW,
    });
    expect(resolved).toEqual({ templateId: 'hotel_classic', reason: 'entitlement_lapsed' });
  });

  it('keeps serving through the grace period', () => {
    const resolved = resolveShopTemplate({
      templates: seedTemplates(),
      settings: settings({ activeTemplateId: 'hotel_editorial' }),
      entitlement: entitlement({ periodEnd: new Date(NOW.getTime() - 3 * DAY).toISOString() }),
      category: 'hotel',
      now: NOW,
    });
    expect(resolved.reason).toBe('served');
  });

  it('never needs an entitlement for the free template', () => {
    const resolved = resolveShopTemplate({
      templates: seedTemplates(),
      settings: settings(),
      entitlement: undefined,
      category: 'hotel',
      now: NOW,
    });
    expect(resolved).toEqual({ templateId: 'hotel_classic', reason: 'served' });
  });

  it('rolls back to the previous version when the active one returns to draft', () => {
    const templates = seedTemplates().map((t) =>
      t.id === 'hotel_editorial' ? rollbackTemplate({ ...t, previousVersionId: 'hotel_classic' }) : t,
    );
    const resolved = resolveShopTemplate({
      templates,
      settings: settings({ activeTemplateId: 'hotel_editorial' }),
      entitlement: entitlement(),
      category: 'hotel',
      now: NOW,
    });
    expect(resolved).toEqual({ templateId: 'hotel_classic', reason: 'rolled_back' });
  });

  it('falls back to free when a rolled-back version has no live previous version', () => {
    const templates = seedTemplates().map((t) => (t.id === 'hotel_editorial' ? rollbackTemplate(t) : t));
    const resolved = resolveShopTemplate({
      templates,
      settings: settings({ activeTemplateId: 'hotel_editorial' }),
      entitlement: entitlement(),
      category: 'hotel',
      now: NOW,
    });
    expect(resolved).toEqual({ templateId: 'hotel_classic', reason: 'free_default' });
  });

  it('keeps serving a retired template through its 30-day notice', () => {
    const templates = seedTemplates().map((t) =>
      t.id === 'hotel_compact' ? startRetirement(t, 'hotel_editorial', NOW) : t,
    );
    const resolved = resolveShopTemplate({
      templates,
      settings: settings({ activeTemplateId: 'hotel_compact' }),
      entitlement: entitlement(),
      category: 'hotel',
      now: NOW,
    });
    expect(resolved.reason).toBe('served');
    expect(resolved.noticeEndsOn).toBe('2026-12-28');
  });

  it('moves a shop to the replacement once the notice ends', () => {
    const templates = seedTemplates().map((t) =>
      t.id === 'hotel_compact' ? startRetirement(t, 'hotel_editorial', new Date(NOW.getTime() - 40 * DAY)) : t,
    );
    const resolved = resolveShopTemplate({
      templates,
      settings: settings({ activeTemplateId: 'hotel_compact' }),
      entitlement: entitlement(),
      category: 'hotel',
      now: NOW,
    });
    expect(resolved).toEqual({ templateId: 'hotel_editorial', reason: 'retired_moved' });
  });

  it('moves to free when a retired template names no live replacement', () => {
    const templates = seedTemplates().map((t) =>
      t.id === 'hotel_compact' ? startRetirement(t, undefined, new Date(NOW.getTime() - 40 * DAY)) : t,
    );
    const resolved = resolveShopTemplate({
      templates,
      settings: settings({ activeTemplateId: 'hotel_compact' }),
      entitlement: entitlement(),
      category: 'hotel',
      now: NOW,
    });
    expect(resolved).toEqual({ templateId: 'hotel_classic', reason: 'retired_moved' });
  });

  it('lands on the free template when the shop has no settings row at all', () => {
    const resolved = resolveShopTemplate({
      templates: seedTemplates(),
      settings: settings({ activeTemplateId: 'deleted_template' }),
      entitlement: entitlement(),
      category: 'hotel',
      now: NOW,
    });
    expect(resolved).toEqual({ templateId: 'hotel_classic', reason: 'free_default' });
  });

  it('replays the same answer twice, so the resolution is deterministic', () => {
    const input = {
      templates: seedTemplates(),
      settings: settings({ activeTemplateId: 'hotel_editorial' }),
      entitlement: entitlement({ periodEnd: new Date(NOW.getTime() - 30 * DAY).toISOString() }),
      category: 'hotel' as const,
      now: NOW,
    };
    expect(resolveShopTemplate(input)).toEqual(resolveShopTemplate(input));
  });
});

describe('retirement (§4 30-day notice)', () => {
  it('counts the notice down from the day it started', () => {
    const retired = startRetirement(template({ id: 'hotel_compact' }), 'hotel_editorial', NOW);
    expect(retirementDaysLeft(retired, NOW)).toBe(30);
    expect(retirementDaysLeft(retired, new Date(NOW.getTime() + 25 * DAY))).toBe(5);
    expect(retirementDaysLeft(retired, new Date(NOW.getTime() + 40 * DAY))).toBe(0);
  });
});

describe('preview (§4 own data only)', () => {
  it('lets an owner preview on their own shop', () => {
    expect(canPreviewTemplate('rangoon_house', 'rangoon_house')).toBe(true);
  });

  it('refuses another shop and a signed-out viewer', () => {
    expect(canPreviewTemplate('rangoon_house', 'mandalay_booknook')).toBe(false);
    expect(canPreviewTemplate(undefined, 'rangoon_house')).toBe(false);
  });
});

/**
 * The migration is the server copy of this catalog. Reading it here means a row
 * added to `seedTemplates()` cannot be missing from the database, and a row that
 * fails the axis trigger on the server cannot ship from the client.
 */
describe('shop template migrations match the client catalog', () => {
  const dir = join(process.cwd(), 'SQL');
  const sql = ['20261128000100_shop_templates.sql', '20261128000200_shop_template_events.sql',
    '20261129000100_shop_template_catalog_growth.sql']
    .map((file) => readFileSync(join(dir, file), 'utf8'))
    .join('\n');

  it('seeds every active template the client lists', () => {
    for (const template of seedTemplates().filter((row) => row.status === 'active')) {
      expect(sql).toContain(`('${template.id}', '${template.category}'`);
    }
  });

  it('seeds no template the client catalog does not know', () => {
    const known = new Set(seedTemplates().map((row) => row.id));
    const seeded = [...sql.matchAll(/^ {2}\('([a-z0-9_]+)', '(hotel|restaurant|cafe|book_shop|attraction)'/gm)]
      .map((match) => match[1]);
    expect(seeded.filter((id) => !known.has(id))).toEqual([]);
  });

  it('writes the same trait set the client writes', () => {
    for (const template of seedTemplates().filter((row) => row.status === 'active')) {
      expect(sql).toContain(JSON.stringify(template.traits));
    }
  });

  it('keeps the free default free and every paid design at the one price', () => {
    const free = seedTemplates().filter((row) => row.isFree);
    expect(free.length).toBeGreaterThan(0);
    for (const template of free) expect(sql).toContain(`('${template.id}', '${template.category}'`);
    expect(sql).toContain('price_mmk_month = 2000');
  });
});
