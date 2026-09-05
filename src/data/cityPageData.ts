import type { CardListing } from '../types';

export const CITIES: CardListing[] = [
  { id: 'yangon', title: 'Yangon', rating: 4.5, distanceKm: 0, isFavorited: false, views: 1500, href: '/cities/yangon' },
  { id: 'bagan', title: 'Bagan', rating: 4.7, distanceKm: 690, isFavorited: false, views: 1500, href: '/cities/bagan' },
  { id: 'mandalay', title: 'Mandalay', rating: 4.6, distanceKm: 620, isFavorited: false, views: 1500, href: '/cities/mandalay' },
  { id: 'inle', title: 'Inle lake', rating: 4.6, distanceKm: 580, isFavorited: false, views: 1500, href: '/cities/inle-lake' },
  { id: 'ngapali', title: 'Ngapali beach', rating: 4.6, distanceKm: 400, isFavorited: false, views: 1500, href: '/cities/ngapali-beach' },
  { id: 'bago', title: 'Bago', rating: 4.3, distanceKm: 90, isFavorited: false, views: 1500, href: '/cities/bago' },
  { id: 'mawlamyine', title: 'Mawlamyine', rating: 4.2, distanceKm: 300, isFavorited: false, views: 1500, href: '/cities/mawlamyine' },
  { id: 'kyaiktiyo', title: 'Kyaiktiyo (Golden Rock)', rating: 4.8, distanceKm: 210, isFavorited: false, views: 1500, href: '/cities/kyaiktiyo' },
  { id: 'taunggyi', title: 'Taunggyi', rating: 4.3, distanceKm: 610, isFavorited: false, views: 1500, href: '/cities/taunggyi' },
  { id: 'kalaw', title: 'Kalaw', rating: 4.1, distanceKm: 640, isFavorited: false, views: 1500, href: '/cities/kalaw' },
];

export const CITY_TRAVEL_GUIDES: CardListing[] = [
  { id: 'ctg1', title: 'Yangon in 5 places, 1 day', rating: 4.3, distanceKm: 3, isFavorited: false, views: 1500, href: '/travel-guide/ctg1' },
  { id: 'ctg2', title: 'Yangon in 5 places, 1 day', rating: 4.1, distanceKm: 5, isFavorited: false, views: 1500, href: '/travel-guide/ctg2' },
  { id: 'ctg3', title: 'Yangon in 5 places, 1 day', rating: 4.6, distanceKm: 2, isFavorited: false, views: 1500, href: '/travel-guide/ctg3' },
];

export const TOP_ATTRACTIONS: CardListing[] = [
  { id: 'ta1', title: 'Shwedagon pagoda', rating: 4.6, distanceKm: 3, isFavorited: false, views: 1500, href: '/attractions/ta1' },
  { id: 'ta2', title: "People's park", rating: 4.5, distanceKm: 4, isFavorited: false, views: 1500, href: '/attractions/ta2' },
  { id: 'ta3', title: 'Shwe Chaw thar pagoda', rating: 4.7, distanceKm: 2, isFavorited: false, views: 1500, href: '/attractions/ta3' },
  { id: 'ta4', title: 'Sule pagoda', rating: 4.4, distanceKm: 1, isFavorited: false, views: 1500, href: '/attractions/ta4' },
  { id: 'ta5', title: 'U Bein bridge', rating: 4.3, distanceKm: 620, isFavorited: false, views: 1500, href: '/attractions/ta5' },
];

export const POPULAR_HOTELS: CardListing[] = [
  { id: 'ph1', title: 'Sedona hotel Yangon', rating: 4.8, distanceKm: 2.5, isFavorited: false, views: 1500, href: '/hotels/sedona-yangon' },
  { id: 'ph2', title: 'Pan Pacific Yangon', rating: 4.7, distanceKm: 3.1, isFavorited: false, views: 1500, href: '/hotels/pan-pacific' },
  { id: 'ph3', title: 'Lotte hotel Yangon', rating: 4.6, distanceKm: 1.8, isFavorited: false, views: 1500, href: '/hotels/lotte' },
  { id: 'ph4', title: 'Melia Yangon', rating: 4.5, distanceKm: 2.2, isFavorited: false, views: 1500, href: '/hotels/melia' },
  { id: 'ph5', title: 'Wyndham grand', rating: 4.4, distanceKm: 4.0, isFavorited: false, views: 1500, href: '/hotels/wyndham' },
];

export const POPULAR_RESTAURANTS: CardListing[] = [
  { id: 'pr1', title: 'The Rangoon house', rating: 4.6, distanceKm: 2.1, isFavorited: false, views: 1500, href: '/restaurants/rangoon-house' },
  { id: 'pr2', title: 'Shan Yoe Yar', rating: 4.4, distanceKm: 1.6, isFavorited: false, views: 1500, href: '/restaurants/shan-yoe-yar' },
  { id: 'pr3', title: 'Monsoon restaurant', rating: 4.3, distanceKm: 2.8, isFavorited: false, views: 1500, href: '/restaurants/monsoon' },
  { id: 'pr4', title: 'Feel Myanmar food', rating: 4.5, distanceKm: 3.0, isFavorited: false, views: 1500, href: '/restaurants/feel-myanmar' },
  { id: 'pr5', title: "Boo's kitchen", rating: 4.2, distanceKm: 1.9, isFavorited: false, views: 1500, href: '/restaurants/boos-kitchen' },
];

export const POPULAR_BOOK_SHOPS: CardListing[] = [
  { id: 'pb1', title: 'Book Nook Yangon', rating: 4.8, distanceKm: 0.7, isFavorited: false, views: 1500, href: '/book-shops/book-nook' },
  { id: 'pb2', title: 'Shwe Book shop', rating: 4.5, distanceKm: 1.2, isFavorited: false, views: 1500, href: '/book-shops/shwe' },
  { id: 'pb3', title: 'City Book center', rating: 4.3, distanceKm: 2.3, isFavorited: false, views: 1500, href: '/book-shops/city-center' },
  { id: 'pb4', title: 'Innwa bookstore', rating: 4.4, distanceKm: 1.5, isFavorited: false, views: 1500, href: '/book-shops/innwa' },
  { id: 'pb5', title: 'Pansodan books', rating: 4.6, distanceKm: 2.0, isFavorited: false, views: 1500, href: '/book-shops/pansodan' },
];

export const POPULAR_RENTALS: CardListing[] = [
  { id: 'pre1', title: 'Toyota car rental', rating: 4.5, distanceKm: 1.5, isFavorited: false, views: 1500, href: '/rentals/pre1' },
  { id: 'pre2', title: 'Honda motorbike', rating: 4.6, distanceKm: 0.8, isFavorited: false, views: 1500, href: '/rentals/pre2' },
  { id: 'pre3', title: 'Yangon bicycle hub', rating: 4.4, distanceKm: 1.1, isFavorited: false, views: 1500, href: '/rentals/pre3' },
  { id: 'pre4', title: 'Guide - Ko Aung Aung', rating: 4.8, distanceKm: 2.0, isFavorited: false, views: 1500, href: '/rentals/pre4' },
  { id: 'pre5', title: 'Motorboat rental', rating: 4.3, distanceKm: 5.2, isFavorited: false, views: 1500, href: '/rentals/pre5' },
];

export const POPULAR_TRANSPORT: CardListing[] = [
  { id: 'pt1', title: 'JJ Express', rating: 4.6, distanceKm: 1.0, isFavorited: false, views: 1500, href: '/ticketing/jj-express' },
  { id: 'pt2', title: 'Elite Express', rating: 4.5, distanceKm: 1.4, isFavorited: false, views: 1500, href: '/ticketing/elite-express' },
  { id: 'pt3', title: 'Malikha Travels', rating: 4.4, distanceKm: 2.1, isFavorited: false, views: 1500, href: '/ticketing/malikha' },
  { id: 'pt4', title: 'Myanmar airways', rating: 4.5, distanceKm: 8.0, isFavorited: false, views: 1500, href: '/ticketing/myanmar-airways' },
  { id: 'pt5', title: 'Inle ferry lines', rating: 4.2, distanceKm: 580, isFavorited: false, views: 1500, href: '/ticketing/inle-ferry' },
];

export const POPULAR_CAFES: CardListing[] = [
  { id: 'pc1', title: "Sharky's cafe", rating: 4.5, distanceKm: 1.3, isFavorited: false, views: 1500, href: '/cafes/sharkys' },
  { id: 'pc2', title: 'Rangoon tea house', rating: 4.7, distanceKm: 2.0, isFavorited: false, views: 1500, href: '/cafes/rangoon-tea-house' },
  { id: 'pc3', title: 'Coffee circles', rating: 4.4, distanceKm: 1.6, isFavorited: false, views: 1500, href: '/cafes/coffee-circles' },
  { id: 'pc4', title: 'Sky bistro', rating: 4.3, distanceKm: 3.1, isFavorited: false, views: 1500, href: '/cafes/sky-bistro' },
  { id: 'pc5', title: 'Java cafe', rating: 4.2, distanceKm: 1.0, isFavorited: false, views: 1500, href: '/cafes/java' },
];

export const POPULAR_MARKETS: CardListing[] = [
  { id: 'pm1', title: 'Bogyoke market', rating: 4.6, distanceKm: 1.8, isFavorited: false, views: 1500, href: '/markets/bogyoke' },
  { id: 'pm2', title: 'Theingyi market', rating: 4.4, distanceKm: 2.4, isFavorited: false, views: 1500, href: '/markets/theingyi' },
  { id: 'pm3', title: 'Junction city mall', rating: 4.5, distanceKm: 1.5, isFavorited: false, views: 1500, href: '/markets/junction-city' },
  { id: 'pm4', title: 'Scott market', rating: 4.3, distanceKm: 620, isFavorited: false, views: 1500, href: '/markets/scott' },
  { id: 'pm5', title: 'Myanmar plaza', rating: 4.1, distanceKm: 2.0, isFavorited: false, views: 1500, href: '/markets/myanmar-plaza' },
];

export const POPULAR_SEARCHES = [
  'Yangon hotels',
  'Bagan hotels',
  'Inle lake tour',
  'Ngapali beach resort',
  'Mandalay tour',
  'Golden rock tour',
];
