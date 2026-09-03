import type { CardListing } from '../types';

export const CATEGORIES = [
  { key: 'book_shop', label: 'Book shop', icon: 'Book' },
  { key: 'hotels', label: 'Hotels', icon: 'Building' },
  { key: 'ticketing', label: 'Ticketing', icon: 'Ticket' },
  { key: 'rentals', label: 'Rentals', icon: 'Car' },
  { key: 'restaurants', label: 'Restaurants', icon: 'UtensilsCrossed' },
  { key: 'attractions', label: 'Attractions', icon: 'Landmark' },
  { key: 'guides', label: 'Guides', icon: 'User' },
  { key: 'exchange', label: 'Exchange', icon: 'Banknote' },
  { key: 'emergency', label: 'Emergency', icon: 'FirstAid' },
  { key: 'sim_card', label: 'Sim card', icon: 'SimCard' },
  { key: 'nearby', label: 'Nearby', icon: 'MapPin' },
] as const;

export const TRAVEL_PLANS: CardListing[] = [
  { id: 'tp1', title: 'Yangon - Bagan - Bago', subtitle: '3 days 2 nights', rating: 4.5, distanceKm: 12, isFavorited: false, views: 1500, priceUsd: 580, href: '/travel-plans/tp1' },
  { id: 'tp2', title: 'Yangon - Bagan - Bago', subtitle: '3 days 2 nights', rating: 4.0, distanceKm: 8, isFavorited: false, views: 1500, priceUsd: 580, href: '/travel-plans/tp2' },
  { id: 'tp3', title: 'Yangon - Bagan - Bago', subtitle: '3 days 2 nights', rating: 4.2, distanceKm: 15, isFavorited: false, views: 1500, priceUsd: 580, href: '/travel-plans/tp3' },
];

export const TRAVEL_GUIDES: CardListing[] = [
  { id: 'tg1', title: 'Yangon in 5 places', rating: 4.3, distanceKm: 3, isFavorited: false, views: 1500, href: '/travel-guide/tg1' },
  { id: 'tg2', title: 'Yangon in 5 places', rating: 4.1, distanceKm: 5, isFavorited: false, views: 1500, href: '/travel-guide/tg2' },
  { id: 'tg3', title: 'Yangon in 5 places', rating: 4.6, distanceKm: 2, isFavorited: false, views: 1500, href: '/travel-guide/tg3' },
  { id: 'tg4', title: 'Yangon in 5 places', rating: 4.0, distanceKm: 7, isFavorited: false, views: 1500, href: '/travel-guide/tg4' },
];

export const BLOGS: CardListing[] = [
  { id: 'bl1', title: 'Travel and health', rating: 4.2, distanceKm: 4, isFavorited: false, views: 1500, href: '/blogs/bl1' },
  { id: 'bl2', title: 'Travel and health', rating: 4.4, distanceKm: 6, isFavorited: false, views: 1500, href: '/blogs/bl2' },
  { id: 'bl3', title: 'Travel and health', rating: 4.5, distanceKm: 9, isFavorited: false, views: 1500, href: '/blogs/bl3' },
  { id: 'bl4', title: 'Travel and health', rating: 4.1, distanceKm: 11, isFavorited: false, views: 1500, href: '/blogs/bl4' },
];

export const POPULARS: CardListing[] = [
  { id: 'pp1', title: 'Yangon hotel', rating: 4.4, distanceKm: 4, isFavorited: false, views: 1500, href: '/hotels/pp1' },
  { id: 'pp2', title: 'Shwe book shop', rating: 4.7, distanceKm: 1, isFavorited: false, views: 1500, href: '/book-shops/pp2' },
  { id: 'pp3', title: 'City mall Insein', rating: 4.2, distanceKm: 6, isFavorited: false, views: 1500, href: '/markets/pp3' },
  { id: 'pp4', title: 'Yangon hotel', rating: 4.6, distanceKm: 4, isFavorited: false, views: 1500, href: '/hotels/pp4' },
  { id: 'pp5', title: 'Shwe book shop', rating: 4.3, distanceKm: 1, isFavorited: false, views: 1500, href: '/book-shops/pp5' },
  { id: 'pp6', title: 'City mall Insein', rating: 4.5, distanceKm: 6, isFavorited: false, views: 1500, href: '/markets/pp6' },
];

export const REVIEWS = [
  { id: 'rv1', name: 'Aung Aung', rating: 4, text: 'Very good travel guide, provides a lot of help for fellow travelers.' },
  { id: 'rv2', name: 'Aung Aung', rating: 4, text: 'Very good travel guide, provides a lot of help for fellow travelers.' },
  { id: 'rv3', name: 'Aung Aung', rating: 4, text: 'Very good travel guide, provides a lot of help for fellow travelers.' },
];

export const AWARDS = [
  { id: 'aw1', icon: 'Trophy', year: '2021-2022' },
  { id: 'aw2', icon: 'Medal', year: '2021-2022' },
  { id: 'aw3', icon: 'Award', year: '2021-2022' },
  { id: 'aw4', icon: 'BadgeCheck', year: '2021-2022' },
];

export const PARTNERS = ['Oway', 'Grab', 'Fary', 'myWorld', 'wego', 'aggda'];
