import type { CardListing } from '../types';

export type NearbyCategory = 'hotel' | 'restaurant' | 'cafe' | 'book_shop' | 'attraction' | 'market' | 'rental';

export type NearbyListing = CardListing & {
  category: NearbyCategory;
  lat: number;
  lng: number;
  address: string;
};

const images = {
  pagoda: '/images/blog/shwedagon-evening.webp',
  lake: '/images/blog/inle-stilt-houses.webp',
  sunrise: '/images/blog/bagan-sunrise.webp',
  bridge: '/images/blog/ubein-evening.webp',
};

export const NEARBY_LISTINGS: NearbyListing[] = [
  { id: 'near-hotel-1', title: 'Sedona Hotel Yangon', category: 'hotel', address: 'Kabar Aye Pagoda Road', lat: 16.833, lng: 96.158, rating: 4.8, distanceKm: 1.2, isFavorited: false, views: 1500, imageUrl: images.lake, href: '/hotels/sedona-yangon' },
  { id: 'near-restaurant-1', title: 'The Rangoon House', category: 'restaurant', address: 'Inya Road, Kamayut', lat: 16.823, lng: 96.135, rating: 4.6, distanceKm: 1.5, isFavorited: false, views: 1500, imageUrl: images.pagoda, href: '/restaurants/rangoon-house' },
  { id: 'near-cafe-1', title: "Sharky's Cafe", category: 'cafe', address: 'Golden Valley, Yangon', lat: 16.818, lng: 96.146, rating: 4.5, distanceKm: 1.8, isFavorited: false, views: 1500, imageUrl: images.sunrise, href: '/cafes/sharkys' },
  { id: 'near-market-1', title: 'Bogyoke Market', category: 'market', address: 'Bogyoke Aung San Road', lat: 16.779, lng: 96.153, rating: 4.6, distanceKm: 2.2, isFavorited: false, views: 1500, imageUrl: images.bridge, href: '/markets/bogyoke' },
  { id: 'near-book-1', title: 'Book Nook Yangon', category: 'book_shop', address: 'Pansodan Street', lat: 16.776, lng: 96.158, rating: 4.8, distanceKm: 2.6, isFavorited: false, views: 1500, imageUrl: images.sunrise, href: '/book-shops/book-nook' },
  { id: 'near-hotel-2', title: 'Pan Pacific Yangon', category: 'hotel', address: 'Shwedagon Pagoda Road', lat: 16.778, lng: 96.161, rating: 4.7, distanceKm: 2.8, isFavorited: false, views: 1500, imageUrl: images.pagoda, href: '/hotels/pan-pacific' },
  { id: 'near-attraction-1', title: 'Shwedagon Pagoda', category: 'attraction', address: 'Ar Zar Ni Road, Dagon', lat: 16.798, lng: 96.149, rating: 4.9, distanceKm: 3.1, isFavorited: false, views: 1500, imageUrl: images.pagoda, href: '/attractions/ta1' },
  { id: 'near-restaurant-2', title: 'Shan Yoe Yar', category: 'restaurant', address: 'Yankin Road, Yangon', lat: 16.838, lng: 96.174, rating: 4.4, distanceKm: 3.6, isFavorited: false, views: 1500, imageUrl: images.bridge, href: '/restaurants/shan-yoe-yar' },
  { id: 'near-cafe-2', title: 'Rangoon Tea House', category: 'cafe', address: 'Pansodan Street', lat: 16.774, lng: 96.158, rating: 4.7, distanceKm: 3.9, isFavorited: false, views: 1500, imageUrl: images.lake, href: '/cafes/rangoon-tea-house' },
  { id: 'near-rental-1', title: 'Yangon Bicycle Hub', category: 'rental', address: 'Downtown Yangon', lat: 16.781, lng: 96.16, rating: 4.4, distanceKm: 4.1, isFavorited: false, views: 1500, imageUrl: images.bridge, href: '/rentals/pre3' },
  { id: 'near-market-2', title: 'Junction City Mall', category: 'market', address: 'Bogyoke Aung San Road', lat: 16.778, lng: 96.157, rating: 4.5, distanceKm: 4.3, isFavorited: false, views: 1500, imageUrl: images.lake, href: '/markets/junction-city' },
  { id: 'near-restaurant-3', title: 'Monsoon Restaurant', category: 'restaurant', address: 'Thein Phyu Road', lat: 16.771, lng: 96.171, rating: 4.3, distanceKm: 4.8, isFavorited: false, views: 1500, imageUrl: images.sunrise, href: '/restaurants/monsoon' },
];
