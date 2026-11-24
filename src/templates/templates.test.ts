import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { seedTemplates } from '../lib/shopTemplates';
import { SHOP_PAGES, shopIds, shopPageData } from './shopPageData';
import { renderableTemplateIds, templateModule } from './registry';

/**
 * Plan §4: "Adding a template is a new module and a new row, with no change to
 * the Shop Page route." A row with no module is a blank page, so the catalog and
 * the registry are checked against each other here.
 */
describe('template registry', () => {
  it('has a module for every active template in the catalog', () => {
    const live = seedTemplates().filter((template) => template.status === 'active');
    const missing = live.filter((template) => !templateModule(template.id)).map((template) => template.id);
    expect(missing).toEqual([]);
  });

  it('declares no module the catalog does not know', () => {
    const known = new Set(seedTemplates().map((template) => template.id));
    expect(renderableTemplateIds().filter((id) => !known.has(id))).toEqual([]);
  });

  it('renders nothing for an unknown id instead of throwing', () => {
    expect(templateModule('nope_not_a_template')).toBeUndefined();
  });
});

/**
 * §4's per-template gate is a rendered check in a browser, but two of its rules
 * survive as source rules: a page needs one `h1`, and a colour must come from a
 * theme token or the light theme reads a dark card as white text.
 */
describe('template modules', () => {
  const MODULES = ['hotel/HotelClassic', 'hotel/HotelEditorial', 'hotel/HotelCompact', 'hotel/HotelGalleryFirst',
    'bookShop/BookShopClassic', 'generic/SimpleClassic'];
  const source = (file: string) => readFileSync(join(process.cwd(), 'src', 'templates', `${file}.tsx`), 'utf8');

  it.each(MODULES)('%s renders exactly one h1', (file) => {
    expect(source(file).match(/<h1[\s>]/g) ?? []).toHaveLength(1);
  });

  it.each(MODULES)('%s takes its colours from theme tokens', (file) => {
    expect(source(file).match(/\b(?:bg|text|border|divide)-\[#/g) ?? []).toEqual([]);
  });
});

describe('shop page fixture', () => {
  it('has a page for every seeded shop the owner panels use', () => {
    expect(shopIds().sort()).toEqual(['mandalay_booknook', 'rangoon_house']);
  });

  it('carries every section a template must render', () => {
    for (const page of SHOP_PAGES) {
      expect(page.nameEn.length).toBeGreaterThan(0);
      expect(page.nameMm.length).toBeGreaterThan(0);
      expect(page.photos.length).toBeGreaterThan(1);
      expect(page.catalog.length).toBeGreaterThan(0);
      expect(page.reviews.length).toBeGreaterThan(0);
      expect(page.contact.phone.length).toBeGreaterThan(0);
      expect(page.bookingCta.href.startsWith('/')).toBe(true);
      expect(page.photos.every((photo) => photo.altMm && photo.altEn)).toBe(true);
      expect(page.catalog.every((item) => item.nameMm && item.nameEn && item.priceMmk > 0)).toBe(true);
    }
  });

  it('gives a hotel check-in and check-out and every other category none', () => {
    for (const page of SHOP_PAGES) {
      if (page.category === 'hotel') {
        expect(page.checkIn).toMatch(/^\d{2}:\d{2}$/);
        expect(page.checkOut).toMatch(/^\d{2}:\d{2}$/);
      } else {
        expect(page.checkIn).toBe('');
        expect(page.checkOut).toBe('');
      }
    }
  });

  it('resolves a page by id and nothing for an unknown shop', () => {
    expect(shopPageData('rangoon_house')?.category).toBe('hotel');
    expect(shopPageData('not_a_shop')).toBeUndefined();
  });
});
