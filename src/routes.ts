// Catalog slugs shared by the router and the tests that check every seed link
// resolves. Category pages list a catalog; place pages read one record by :id.
export const CATEGORY_SLUGS = [
  'attractions',
  'hotels',
  'restaurants',
  'cafes',
  'markets',
  'book-shops',
  'rentals',
  'transport',
  'populars',
] as const;

export const PLACE_SLUGS = [
  'attractions',
  'hotels',
  'cafes',
  'markets',
  'rentals',
  'ticketing',
  'populars',
] as const;

/** Static routes declared outside the catalog loops in App.tsx. */
export const STATIC_PATHS = [
  '/',
  '/cities',
  '/nearby',
  '/ticketing',
  '/travel-plans',
  '/travel-guide',
  '/blogs',
  '/foreign-tourist',
  '/search',
  '/account',
  '/login',
  '/signup',
  '/admin/login',
  '/super-admin',
  '/shop-owner',
  '/main-owner',
  '/notifications',
  '/account/notifications',
  '/favorites',
  '/categories',
] as const;

/** Param routes declared outside the catalog loops in App.tsx. */
export const PARAM_PATHS = [
  '/cities/:cityId',
  '/city/:cityId',
  '/restaurants/:id',
  '/book-shops/:id',
  '/travel-plans/:planId',
  '/travel-guide/:guideId',
  '/blogs/:storyId',
  '/ad/click/:creativeId',
  '/account/bookings/:requestCode',
] as const;

export function allPaths(): string[] {
  return [
    ...STATIC_PATHS,
    ...PARAM_PATHS,
    ...CATEGORY_SLUGS.map((slug) => `/${slug}`),
    ...PLACE_SLUGS.map((slug) => `/${slug}/:id`),
  ];
}

/** True when `href` (ignoring query and hash) matches a declared route. */
export function isKnownHref(href: string): boolean {
  const path = href.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
  return allPaths().some((route) => {
    if (!route.includes(':')) return route.replace(/\/$/, '') === path;
    const pattern = new RegExp(`^${route.replace(/:[A-Za-z]+/g, '[^/]+')}$`);
    return pattern.test(path);
  });
}
