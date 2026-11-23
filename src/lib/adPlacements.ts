import type { TranslationKey } from './translations';

/**
 * Plan §16A.3: one key per position, named `<page>_<position>`, and the
 * catalog is the only place a placement is described. A page never invents a
 * key at the call site, and the Adsboard toggles `active` here rather than in
 * the page, so "turn this slot off" is one row and not a code change.
 */

export type AdFormat = 'wide_banner' | 'compact_banner';

export type AdPlacement = {
  key: string;
  /** The page the slot belongs to, as the Adsboard groups it. */
  page: string;
  labelKey: TranslationKey;
  format: AdFormat;
  /** §16A.1: each placement has an on/off toggle, and off means no ad at all. */
  active: boolean;
  /** §16A.1 order: Admin Ads, then AdSense/AdMob, then collapse. */
  fallbackAllowed: boolean;
  sortOrder: number;
};

/**
 * §16A.2: every `blog_*` key falls back to `blog_inline`, because a story's ad
 * blocks all render the inline placement whatever the block's own id is.
 */
export const BLOG_INLINE_KEY = 'blog_inline';

export const AD_PLACEMENTS: AdPlacement[] = [
  { key: 'home_hero', page: 'home', labelKey: 'ad_place_home_hero', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 10 },
  { key: 'home_after_travel_plans', page: 'home', labelKey: 'ad_place_home_after_travel_plans', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 20 },
  { key: 'home_after_hotels', page: 'home', labelKey: 'ad_place_home_after_hotels', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 30 },
  { key: 'home_after_blogs', page: 'home', labelKey: 'ad_place_home_after_blogs', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 40 },
  { key: 'home_after_reviews', page: 'home', labelKey: 'ad_place_home_after_reviews', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 50 },
  { key: 'home_after_partners', page: 'home', labelKey: 'ad_place_home_after_partners', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 60 },
  { key: 'blog_post_top', page: 'blogs', labelKey: 'ad_place_blog_post_top', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 70 },
  { key: BLOG_INLINE_KEY, page: 'blogs', labelKey: 'ad_place_blog_inline', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 80 },
  { key: 'blog_post_bottom', page: 'blogs', labelKey: 'ad_place_blog_post_bottom', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 90 },
  { key: 'rentals_top', page: 'rentals', labelKey: 'ad_place_rentals_top', format: 'compact_banner', active: true, fallbackAllowed: true, sortOrder: 100 },
  { key: 'cities_top', page: 'cities', labelKey: 'ad_place_cities_top', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 110 },
  { key: 'city_after_cities', page: 'cities', labelKey: 'ad_place_city_after_cities', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 120 },
  { key: 'city_after_attractions', page: 'cities', labelKey: 'ad_place_city_after_attractions', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 130 },
  { key: 'city_after_shopping', page: 'cities', labelKey: 'ad_place_city_after_shopping', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 140 },
  { key: 'city_detail_after_restaurants', page: 'city_detail', labelKey: 'ad_place_city_detail_after_restaurants', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 150 },
  { key: 'travel_plans_top', page: 'travel_plans', labelKey: 'ad_place_travel_plans_top', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 160 },
  { key: 'travel_plan_detail_inline', page: 'travel_plan_detail', labelKey: 'ad_place_travel_plan_detail_inline', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 170 },
  { key: 'nearby_top', page: 'nearby', labelKey: 'ad_place_nearby_top', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 180 },
  { key: 'account_top', page: 'account', labelKey: 'ad_place_account_top', format: 'wide_banner', active: true, fallbackAllowed: true, sortOrder: 190 },
];

/** The page groups the Adsboard lists, in the order the site is read. */
export const AD_PAGES = [
  'home',
  'blogs',
  'rentals',
  'cities',
  'city_detail',
  'travel_plans',
  'travel_plan_detail',
  'nearby',
  'account',
] as const;

const PAGE_LABEL_KEYS: Record<string, TranslationKey> = {
  home: 'ad_page_home',
  blogs: 'ad_page_blogs',
  rentals: 'ad_page_rentals',
  cities: 'ad_page_cities',
  city_detail: 'ad_page_city_detail',
  travel_plans: 'ad_page_travel_plans',
  travel_plan_detail: 'ad_page_travel_plan_detail',
  nearby: 'ad_page_nearby',
  account: 'ad_page_account',
};

export function pageLabelKey(page: string): TranslationKey {
  return PAGE_LABEL_KEYS[page] ?? 'ad_page_home';
}

/**
 * The placement a page key resolves to. An unknown `blog_*` key resolves to
 * the inline slot rather than nothing, so a story block that names itself
 * still gets an ad; any other unknown key serves nothing.
 */
export function resolvePlacementKey(key: string, placements: AdPlacement[] = AD_PLACEMENTS): string | null {
  if (placements.some((placement) => placement.key === key)) return key;
  if (key.startsWith('blog_')) return BLOG_INLINE_KEY;
  return null;
}

export function placementByKey(key: string, placements: AdPlacement[] = AD_PLACEMENTS): AdPlacement | undefined {
  const resolved = resolvePlacementKey(key, placements);
  if (!resolved) return undefined;
  return placements.find((placement) => placement.key === resolved);
}

export function placementsForPage(page: string, placements: AdPlacement[] = AD_PLACEMENTS): AdPlacement[] {
  return placements.filter((placement) => placement.page === page).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** A stored catalog from an older build keeps the Plan's default toggle state. */
export function normalizePlacements(stored: AdPlacement[]): AdPlacement[] {
  return AD_PLACEMENTS.map((base) => {
    const saved = stored.find((row) => row.key === base.key);
    if (!saved) return base;
    return {
      ...base,
      active: typeof saved.active === 'boolean' ? saved.active : base.active,
      fallbackAllowed: typeof saved.fallbackAllowed === 'boolean' ? saved.fallbackAllowed : base.fallbackAllowed,
    };
  });
}

export function setPlacementActive(
  placements: AdPlacement[],
  key: string,
  active: boolean,
): AdPlacement[] {
  return placements.map((placement) => (placement.key === key ? { ...placement, active } : placement));
}

export function setPlacementFallback(
  placements: AdPlacement[],
  key: string,
  fallbackAllowed: boolean,
): AdPlacement[] {
  return placements.map((placement) => (placement.key === key ? { ...placement, fallbackAllowed } : placement));
}
