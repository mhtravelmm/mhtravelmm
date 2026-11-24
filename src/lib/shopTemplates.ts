/**
 * Plan §4, the Shop Owner template marketplace. A template is a presentation
 * layer only: every template renders the same `ShopPageData`, so switching one
 * never touches the owner's profile, catalog, photos, reviews or bookings.
 *
 * §16D gates Phase 3 on "a template switch and fallback work", so the two
 * decisions that matter live here as pure functions: `applyTemplate()` is the
 * switch, and `resolveShopTemplate()` is the fallback chain — a retired
 * template, a rolled-back version or a lapsed entitlement all land on a
 * template the shop can actually render.
 */

/** §4: 2,000 MMK per shop per month for every paid template, every category. */
export const TEMPLATE_PRICE_MMK_MONTH = 2000;

/** §4: 7 days of grace after `periodEnd`, then the page falls back to free. */
export const TEMPLATE_GRACE_DAYS = 7;

/** §4: a retired template's users get 30 days of notice before they move. */
export const RETIREMENT_NOTICE_DAYS = 30;

/** §4: hotel first, since it carries the most data. */
export type TemplateCategory = 'hotel' | 'restaurant' | 'cafe' | 'book_shop' | 'attraction';

export type TemplateStatus = 'draft' | 'active' | 'retired';

/**
 * The seven axes §4's "genuinely different" test measures. A recolor changes
 * none of them, which is why it fails.
 */
export const TEMPLATE_AXES = [
  'layout',
  'navigation',
  'hero',
  'catalog',
  'bookingCta',
  'gallery',
  'mobile',
] as const;

export type TemplateAxis = (typeof TEMPLATE_AXES)[number];

/** §4: a template must differ on at least four of the seven axes. */
export const MIN_DIFFERING_AXES = 4;

export type TemplateTraits = Record<TemplateAxis, string>;

export interface ShopTemplate {
  id: string;
  category: TemplateCategory;
  nameMm: string;
  nameEn: string;
  version: number;
  status: TemplateStatus;
  previewImageKey: string;
  priceMmkMonth: number;
  isFree: boolean;
  traits: TemplateTraits;
  /**
   * §4 rollback: Admin marks a version `draft` again and the shops on it fall
   * back to the version it replaced, which must still be `active`.
   */
  previousVersionId?: string;
  /** §4 retirement: the safe replacement, or nothing for the free template. */
  replacedBy?: string;
  /** When the 30-day retirement notice started, so the move has a due date. */
  retireNoticeFrom?: string;
}

/**
 * The contract every template receives (§4). A template decides only how this
 * is laid out — so a switch cannot lose business data, because a template
 * cannot write it.
 */
export interface ShopPageData {
  shopId: string;
  nameMm: string;
  nameEn: string;
  descriptionMm: string;
  descriptionEn: string;
  address: string;
  category: TemplateCategory;
  openTime: string;
  closeTime: string;
  /** Hotels only; empty for every other category. */
  checkIn: string;
  checkOut: string;
  photos: { key: string; altMm: string; altEn: string }[];
  catalog: { id: string; nameMm: string; nameEn: string; priceMmk: number }[];
  /** §9 price display, chosen per listing by the owner. */
  priceDisplay: 'hidden' | 'after_payment' | 'public';
  reviews: { id: string; rating: number; bodyMm: string; bodyEn: string }[];
  contact: { phone: string; email: string };
  bookingCta: { href: string; mode: 'manual' | 'instant' };
}

export interface ShopPageSettings {
  shopId: string;
  /** §16B.1: the owner is scoped by byline, the rule every shop row uses. */
  ownerName: string;
  activeTemplateId: string;
  appliedAt: string;
}

export type EntitlementStatus = 'active' | 'grace' | 'expired' | 'cancelled';

/**
 * §4: the subscription grants one selected paid template at a time, and
 * switching to another paid template keeps the same entitlement. So the row is
 * keyed by shop, and `templateId` only records what the invoice was for.
 */
export interface TemplateEntitlement {
  id: string;
  shopId: string;
  ownerName: string;
  templateId: string;
  status: EntitlementStatus;
  periodStart: string;
  periodEnd: string;
  graceDays: number;
  cancelledAt?: string;
}

export interface TemplateInvoice {
  id: string;
  shopId: string;
  ownerName: string;
  templateId: string;
  amountMmk: number;
  periodStart: string;
  periodEnd: string;
  status: 'unpaid' | 'paid';
  paidAt?: string;
  recordedBy?: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parse(value: string | undefined): number {
  if (!value) return NaN;
  return new Date(value).getTime();
}

/** The axes on which two templates actually differ, not the axes they claim. */
export function differingAxes(a: ShopTemplate, b: ShopTemplate): TemplateAxis[] {
  return TEMPLATE_AXES.filter((axis) => a.traits[axis] !== b.traits[axis]);
}

/** §4's "genuinely different" test: four axes or the template is a recolor. */
export function isGenuinelyDifferent(a: ShopTemplate, b: ShopTemplate): boolean {
  return differingAxes(a, b).length >= MIN_DIFFERING_AXES;
}

/** The free baseline a shop lands on when nothing else can be served. */
export function freeTemplateFor(templates: ShopTemplate[], category: TemplateCategory): ShopTemplate | undefined {
  return templates.find((t) => t.category === category && t.isFree);
}

/**
 * Why a catalog cannot go live. `active` is the only status a shop may be moved
 * onto, so the differentiation test is applied to the live set only — a draft
 * is allowed to be a work in progress.
 */
export function templateProblems(templates: ShopTemplate[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const template of templates) {
    if (seen.has(template.id)) problems.push(`duplicate template id ${template.id}`);
    seen.add(template.id);
    if (!template.isFree && template.priceMmkMonth !== TEMPLATE_PRICE_MMK_MONTH) {
      problems.push(`${template.id} must cost ${TEMPLATE_PRICE_MMK_MONTH} MMK`);
    }
    if (template.isFree && template.priceMmkMonth !== 0) {
      problems.push(`${template.id} is free, so its price must be 0`);
    }
    if (template.status === 'retired' && template.replacedBy) {
      const replacement = templates.find((t) => t.id === template.replacedBy);
      if (!replacement) problems.push(`${template.id} names a replacement that does not exist`);
      else if (replacement.status !== 'active') problems.push(`${template.id}'s replacement is not active`);
    }
  }

  for (const category of new Set(templates.map((t) => t.category))) {
    const free = templates.filter((t) => t.category === category && t.isFree);
    if (free.length !== 1) problems.push(`${category} must have exactly one free template`);
  }

  const live = templates.filter((t) => t.status === 'active');
  for (let i = 0; i < live.length; i += 1) {
    for (let j = i + 1; j < live.length; j += 1) {
      const a = live[i];
      const b = live[j];
      if (a.category !== b.category) continue;
      if (!isGenuinelyDifferent(a, b)) {
        problems.push(`${a.id} and ${b.id} differ on fewer than ${MIN_DIFFERING_AXES} axes`);
      }
    }
  }
  return problems;
}

/** The entitlement as it stands now, re-derived rather than read as stored. */
export function entitlementStatus(ent: TemplateEntitlement | undefined, now = new Date()): EntitlementStatus {
  if (!ent) return 'expired';
  if (ent.status === 'cancelled') return 'cancelled';
  const end = parse(ent.periodEnd);
  if (Number.isNaN(end)) return 'expired';
  const graceMs = Math.max(0, ent.graceDays) * DAY_MS;
  if (now.getTime() < end) return 'active';
  if (now.getTime() < end + graceMs) return 'grace';
  return 'expired';
}

/** §4: an entitlement is live while it is paid for or inside its grace period. */
export function hasLiveEntitlement(ent: TemplateEntitlement | undefined, now = new Date()): boolean {
  const status = entitlementStatus(ent, now);
  return status === 'active' || status === 'grace';
}

/** The entitlement a shop may use: the newest period wins, cancelled included. */
export function entitlementForShop(entitlements: TemplateEntitlement[], shopId: string): TemplateEntitlement | undefined {
  return entitlements
    .filter((ent) => ent.shopId === shopId)
    .sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
}

export type TemplateRefusal = 'unknown_template' | 'not_active' | 'needs_payment' | 'wrong_category';

export type ApplyResult =
  | { ok: true; settings: ShopPageSettings; switchedFrom: string; invoiceNeeded: false }
  | { ok: false; reason: TemplateRefusal };

/**
 * §4 the switch. Applying a paid template needs a live entitlement, but
 * switching between paid templates does not buy a second one — that is the
 * whole point of "keeps the same monthly entitlement".
 */
export function applyTemplate(input: {
  templates: ShopTemplate[];
  settings: ShopPageSettings;
  entitlement: TemplateEntitlement | undefined;
  templateId: string;
  now?: Date;
}): ApplyResult {
  const now = input.now ?? new Date();
  const target = input.templates.find((t) => t.id === input.templateId);
  if (!target) return { ok: false, reason: 'unknown_template' };
  if (target.status !== 'active') return { ok: false, reason: 'not_active' };

  const current = input.templates.find((t) => t.id === input.settings.activeTemplateId);
  if (current && current.category !== target.category) return { ok: false, reason: 'wrong_category' };
  if (!target.isFree && !hasLiveEntitlement(input.entitlement, now)) {
    return { ok: false, reason: 'needs_payment' };
  }

  return {
    ok: true,
    switchedFrom: input.settings.activeTemplateId,
    invoiceNeeded: false,
    settings: { ...input.settings, activeTemplateId: target.id, appliedAt: now.toISOString() },
  };
}

/** §4: switching back to the free template is allowed at any time. */
export function cancelTemplate(input: {
  templates: ShopTemplate[];
  settings: ShopPageSettings;
  entitlement: TemplateEntitlement | undefined;
  now?: Date;
}): { settings: ShopPageSettings; entitlement: TemplateEntitlement | undefined } {
  const now = input.now ?? new Date();
  const current = input.templates.find((t) => t.id === input.settings.activeTemplateId);
  const free = freeTemplateFor(input.templates, current?.category ?? 'hotel');
  return {
    settings: { ...input.settings, activeTemplateId: free?.id ?? '', appliedAt: now.toISOString() },
    entitlement: input.entitlement
      ? { ...input.entitlement, status: 'cancelled', cancelledAt: now.toISOString() }
      : undefined,
  };
}

/**
 * Payment Admin records a payment (§4): one invoice row and one month of
 * entitlement. Nothing else moves, so a shop keeps rendering the template it
 * already had.
 */
export function recordTemplatePayment(input: {
  template: ShopTemplate;
  entitlement: TemplateEntitlement | undefined;
  shopId: string;
  recordedBy: string;
  invoiceId: string;
  now?: Date;
}): { invoice: TemplateInvoice; entitlement: TemplateEntitlement } {
  const now = input.now ?? new Date();
  // Renew from the end of the period already paid for, so paying early does not
  // shorten what the owner already bought.
  const existingEnd = parse(input.entitlement?.periodEnd);
  const startMs = Number.isNaN(existingEnd) || existingEnd < now.getTime() ? now.getTime() : existingEnd;
  const start = new Date(startMs).toISOString();
  const end = new Date(startMs + 30 * DAY_MS).toISOString();
  return {
    invoice: {
      id: input.invoiceId,
      shopId: input.shopId,
      ownerName: input.entitlement?.ownerName ?? '',
      templateId: input.template.id,
      amountMmk: input.template.priceMmkMonth,
      periodStart: start,
      periodEnd: end,
      status: 'paid',
      paidAt: now.toISOString(),
      recordedBy: input.recordedBy,
    },
    entitlement: {
      id: input.entitlement?.id ?? `tent-${input.shopId}`,
      shopId: input.shopId,
      ownerName: input.entitlement?.ownerName ?? '',
      templateId: input.template.id,
      status: 'active',
      periodStart: start,
      periodEnd: end,
      graceDays: TEMPLATE_GRACE_DAYS,
      // A renewal clears a cancellation: the shop is paid up again.
      cancelledAt: undefined,
    },
  };
}

export type ResolveReason =
  | 'served'
  | 'free_default'
  | 'retired_moved'
  | 'rolled_back'
  | 'entitlement_lapsed';

export interface ResolvedTemplate {
  templateId: string;
  reason: ResolveReason;
  /** Set when the shop is on a template that is going away. */
  noticeEndsOn?: string;
}

/**
 * The fallback chain (§4). In order: the shop's own template, unless it is
 * retired past its notice, rolled back to `draft`, or paid for with no live
 * entitlement — then the replacement, the previous version, or the free
 * template. A shop always resolves to something it can render, which is what
 * "a retired template never breaks a shop" means in practice.
 */
export function resolveShopTemplate(input: {
  templates: ShopTemplate[];
  settings: ShopPageSettings;
  entitlement: TemplateEntitlement | undefined;
  category?: TemplateCategory;
  now?: Date;
}): ResolvedTemplate {
  const now = input.now ?? new Date();
  const free = freeTemplateFor(input.templates, input.category ?? 'hotel');
  const freeId = free?.id ?? '';
  const active = input.templates.find((t) => t.id === input.settings.activeTemplateId);
  if (!active) return { templateId: freeId, reason: 'free_default' };

  // §4 rollback: a version marked `draft` again sends its shops to the version
  // it replaced.
  if (active.status === 'draft') {
    const previous = input.templates.find((t) => t.id === active.previousVersionId);
    return previous && previous.status === 'active'
      ? { templateId: previous.id, reason: 'rolled_back' }
      : { templateId: freeId, reason: 'free_default' };
  }

  // §4 retirement keeps serving the template through the notice window, so an
  // owner is never moved without warning.
  if (active.status === 'retired') {
    const noticeStart = parse(active.retireNoticeFrom);
    const noticeEnd = Number.isNaN(noticeStart) ? now.getTime() : noticeStart + RETIREMENT_NOTICE_DAYS * DAY_MS;
    if (now.getTime() < noticeEnd) {
      return {
        templateId: active.id,
        reason: 'served',
        noticeEndsOn: new Date(noticeEnd).toISOString().slice(0, 10),
      };
    }
    const replacement = input.templates.find((t) => t.id === active.replacedBy);
    if (replacement && replacement.status === 'active') {
      return { templateId: replacement.id, reason: 'retired_moved' };
    }
    return { templateId: freeId, reason: 'retired_moved' };
  }

  if (!active.isFree && !hasLiveEntitlement(input.entitlement, now)) {
    return { templateId: freeId, reason: 'entitlement_lapsed' };
  }

  return { templateId: active.id, reason: 'served' };
}

/** §4: a preview is the owner's own data, so only that owner may see it. */
export function canPreviewTemplate(viewerShopId: string | undefined, targetShopId: string): boolean {
  return Boolean(viewerShopId) && viewerShopId === targetShopId;
}

/**
 * §4 retirement: an admin starts the 30-day notice. The template keeps
 * rendering until `retireNoticeFrom + 30 days`, then `resolveShopTemplate()`
 * moves the shop.
 */
export function startRetirement(template: ShopTemplate, replacedBy?: string, now = new Date()): ShopTemplate {
  return {
    ...template,
    status: 'retired',
    replacedBy: replacedBy ?? template.replacedBy,
    retireNoticeFrom: now.toISOString(),
  };
}

/** How many days of notice a retired template has left, for the owner's copy. */
export function retirementDaysLeft(template: ShopTemplate, now = new Date()): number {
  const start = parse(template.retireNoticeFrom);
  if (Number.isNaN(start)) return 0;
  const end = start + RETIREMENT_NOTICE_DAYS * DAY_MS;
  return Math.max(0, Math.ceil((end - now.getTime()) / DAY_MS));
}

/**
 * §4 rollback: Admin marks a version `draft` again. The shops on it fall back
 * through `resolveShopTemplate()`, so this only changes the catalog row.
 */
export function rollbackTemplate(template: ShopTemplate): ShopTemplate {
  return { ...template, status: 'draft' };
}

const CLASSIC_TRAITS: TemplateTraits = {
  layout: 'single_column',
  navigation: 'top_bar',
  hero: 'single_photo',
  catalog: 'card_grid',
  bookingCta: 'sticky_footer',
  gallery: 'masonry',
  mobile: 'stacked',
};

/** §4 gives every shop a free baseline, so every category has one. */
const OTHER_CATEGORIES: { category: TemplateCategory; id: string; nameMm: string; nameEn: string }[] = [
  { category: 'restaurant', id: 'restaurant_classic', nameMm: 'ဂန္ထဝင်', nameEn: 'Classic' },
  { category: 'cafe', id: 'cafe_classic', nameMm: 'ဂန္ထဝင်', nameEn: 'Classic' },
  { category: 'book_shop', id: 'book_shop_classic', nameMm: 'ဂန္ထဝင်', nameEn: 'Classic' },
  { category: 'attraction', id: 'attraction_classic', nameMm: 'ဂန္ထဝင်', nameEn: 'Classic' },
];

/** The free default plus the three paid designs §4 launches with, hotel first. */
export function seedTemplates(): ShopTemplate[] {
  const freeForOthers: ShopTemplate[] = OTHER_CATEGORIES.map((entry) => ({
    id: entry.id,
    category: entry.category,
    nameMm: entry.nameMm,
    nameEn: entry.nameEn,
    version: 1,
    status: 'active',
    previewImageKey: `templates/${entry.id.replace(/_/g, '-')}.webp`,
    priceMmkMonth: 0,
    isFree: true,
    traits: { ...CLASSIC_TRAITS },
  }));

  return [
    {
      id: 'hotel_classic',
      category: 'hotel',
      nameMm: 'ဂန္ထဝင်',
      nameEn: 'Classic',
      version: 1,
      status: 'active',
      previewImageKey: 'templates/hotel-classic.webp',
      priceMmkMonth: 0,
      isFree: true,
      traits: { ...CLASSIC_TRAITS },
    },
    {
      id: 'hotel_editorial',
      category: 'hotel',
      nameMm: 'အယ်ဒီတိုရီရယ်',
      nameEn: 'Editorial',
      version: 1,
      status: 'active',
      previewImageKey: 'templates/hotel-editorial.webp',
      priceMmkMonth: TEMPLATE_PRICE_MMK_MONTH,
      isFree: false,
      traits: {
        layout: 'editorial_columns',
        navigation: 'side_rail',
        hero: 'full_bleed_video',
        catalog: 'long_list',
        bookingCta: 'inline_section',
        gallery: 'full_bleed_carousel',
        mobile: 'swipe_cards',
      },
    },
    {
      id: 'hotel_compact',
      category: 'hotel',
      nameMm: 'ကျစ်လစ်',
      nameEn: 'Compact',
      version: 1,
      status: 'active',
      previewImageKey: 'templates/hotel-compact.webp',
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
    },
    {
      id: 'hotel_gallery_first',
      category: 'hotel',
      nameMm: 'ဓာတ်ပုံဦးစား',
      nameEn: 'Gallery First',
      version: 1,
      status: 'active',
      previewImageKey: 'templates/hotel-gallery-first.webp',
      priceMmkMonth: TEMPLATE_PRICE_MMK_MONTH,
      isFree: false,
      traits: {
        layout: 'gallery_hero',
        navigation: 'overlay_menu',
        hero: 'photo_collage',
        catalog: 'horizontal_carousel',
        bookingCta: 'inline_bar',
        gallery: 'grid_lightbox',
        mobile: 'full_screen',
      },
    },
    {
      id: 'hotel_booking_focus',
      category: 'hotel',
      nameMm: 'ကြိုတင်မှာယူမှု ဦးစား',
      nameEn: 'Booking Focus',
      version: 1,
      status: 'active',
      previewImageKey: 'templates/hotel-booking-focus.webp',
      priceMmkMonth: TEMPLATE_PRICE_MMK_MONTH,
      isFree: false,
      traits: {
        layout: 'booking_panel',
        navigation: 'segmented_tabs',
        hero: 'no_hero',
        catalog: 'bookable_cards',
        bookingCta: 'per_item_button',
        gallery: 'horizontal_scroll',
        mobile: 'segmented_tabs',
      },
    },
    {
      id: 'hotel_map_first',
      category: 'hotel',
      nameMm: 'တည်နေရာ ဦးစား',
      nameEn: 'Map First',
      version: 1,
      status: 'active',
      previewImageKey: 'templates/hotel-map-first.webp',
      priceMmkMonth: TEMPLATE_PRICE_MMK_MONTH,
      isFree: false,
      traits: {
        layout: 'map_sidebar',
        navigation: 'sticky_map',
        hero: 'map_card',
        catalog: 'definition_list',
        bookingCta: 'sidebar_box',
        gallery: 'side_thumbnails',
        mobile: 'sidebar_collapsed',
      },
    },
    {
      id: 'hotel_story',
      category: 'hotel',
      nameMm: 'ပုံပြင်',
      nameEn: 'Story',
      version: 1,
      status: 'active',
      previewImageKey: 'templates/hotel-story.webp',
      priceMmkMonth: TEMPLATE_PRICE_MMK_MONTH,
      isFree: false,
      traits: {
        layout: 'long_read',
        navigation: 'none',
        hero: 'no_hero_typographic',
        catalog: 'numbered_list',
        bookingCta: 'end_of_story',
        gallery: 'interleaved',
        mobile: 'long_read',
      },
    },
    ...freeForOthers,
  ];
}
