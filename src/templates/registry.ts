import { lazy, type ComponentType } from 'react';
import type { TemplateProps } from './templateHelpers';

/**
 * Plan §4: a template is a lazy module plus a `shop_templates` row. The shop
 * page route reads this map by the template id the resolver returned, so adding
 * a template is a new module and a new row — never a route change.
 *
 * A missing entry is a catalog bug, not a runtime surprise: `templateModule()`
 * returns `undefined` and the page falls back to the free template instead of
 * throwing.
 */
const MODULES: Record<string, ComponentType<TemplateProps>> = {
  hotel_classic: lazy(() => import('./hotel/HotelClassic').then((module) => ({ default: module.HotelClassic }))),
  hotel_editorial: lazy(() => import('./hotel/HotelEditorial').then((module) => ({ default: module.HotelEditorial }))),
  hotel_compact: lazy(() => import('./hotel/HotelCompact').then((module) => ({ default: module.HotelCompact }))),
  hotel_gallery_first: lazy(() =>
    import('./hotel/HotelGalleryFirst').then((module) => ({ default: module.HotelGalleryFirst })),
  ),
  hotel_booking_focus: lazy(() =>
    import('./hotel/HotelBookingFocus').then((module) => ({ default: module.HotelBookingFocus })),
  ),
  hotel_map_first: lazy(() => import('./hotel/HotelMapFirst').then((module) => ({ default: module.HotelMapFirst }))),
  hotel_story: lazy(() => import('./hotel/HotelStory').then((module) => ({ default: module.HotelStory }))),
  book_shop_classic: lazy(() =>
    import('./bookShop/BookShopClassic').then((module) => ({ default: module.BookShopClassic })),
  ),
  restaurant_classic: lazy(() =>
    import('./generic/SimpleClassic').then((module) => ({ default: module.SimpleClassic })),
  ),
  cafe_classic: lazy(() => import('./generic/SimpleClassic').then((module) => ({ default: module.SimpleClassic }))),
  attraction_classic: lazy(() =>
    import('./generic/SimpleClassic').then((module) => ({ default: module.SimpleClassic })),
  ),
};

export function templateModule(templateId: string): ComponentType<TemplateProps> | undefined {
  return MODULES[templateId];
}

/** Every id this build can actually render, for the catalog check. */
export function renderableTemplateIds(): string[] {
  return Object.keys(MODULES);
}
