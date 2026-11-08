import type { CardListing } from '../types';

export type NearbyCategory =
  | 'hotel'
  | 'guesthouse'
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'exchange'
  | 'hospital'
  | 'clinic'
  | 'book_shop'
  | 'gym'
  | 'attraction'
  | 'market'
  | 'rental';

export type NearbyListing = CardListing & {
  category: NearbyCategory;
  lat: number;
  lng: number;
  address: string;
  openNow: boolean;
};

const images = {
  pagoda: '/images/blog/shwedagon-evening.webp',
  lake: '/images/blog/inle-stilt-houses.webp',
  sunrise: '/images/blog/bagan-sunrise.webp',
  bridge: '/images/blog/ubein-evening.webp',
  food: '/images/blog/myanmar-food.webp',
  wellness: '/images/blog/myanmar-wellness.webp',
};

export const NEARBY_LISTINGS: NearbyListing[] = [
  { id: 'near-hotel-1', title: 'Sedona Hotel Yangon', subtitle: 'A comfortable city stay', category: 'hotel', address: 'Kabar Aye Pagoda Road', lat: 16.833, lng: 96.158, rating: 4.8, distanceKm: 1.2, isFavorited: false, views: 1500, imageUrl: images.lake, href: '/hotels/sedona-yangon', openNow: true },
  { id: 'near-restaurant-1', title: 'The Rangoon House', subtitle: 'Local and international dining', category: 'restaurant', address: 'Inya Road, Kamayut', lat: 16.823, lng: 96.135, rating: 4.6, distanceKm: 1.5, isFavorited: false, views: 1500, imageUrl: images.food, href: '/restaurants/rangoon-house', openNow: true },
  { id: 'near-cafe-1', title: "Sharky's Cafe", subtitle: 'Coffee and light bites', category: 'cafe', address: 'Golden Valley, Yangon', lat: 16.818, lng: 96.146, rating: 4.5, distanceKm: 1.8, isFavorited: false, views: 1500, imageUrl: images.sunrise, href: '/cafes/sharkys', openNow: true },
  { id: 'near-market-1', title: 'Bogyoke Market', subtitle: 'A lively traditional market', category: 'market', address: 'Bogyoke Aung San Road', lat: 16.779, lng: 96.153, rating: 4.6, distanceKm: 2.2, isFavorited: false, views: 1500, imageUrl: images.bridge, href: '/markets/bogyoke', openNow: true },
  { id: 'near-book-1', title: 'Book Nook Yangon', subtitle: 'Independent bookshop', category: 'book_shop', address: 'Pansodan Street', lat: 16.776, lng: 96.158, rating: 4.8, distanceKm: 2.6, isFavorited: false, views: 1500, imageUrl: images.sunrise, href: '/book-shops/book-nook', openNow: false },
  { id: 'near-hotel-2', title: 'Pan Pacific Yangon', subtitle: 'Hotel near downtown Yangon', category: 'hotel', address: 'Shwedagon Pagoda Road', lat: 16.778, lng: 96.161, rating: 4.7, distanceKm: 2.8, isFavorited: false, views: 1500, imageUrl: images.pagoda, href: '/hotels/pan-pacific', openNow: true },
  { id: 'near-attraction-1', title: 'Shwedagon Pagoda', subtitle: 'The most famous pagoda in Myanmar', category: 'attraction', address: 'Ar Zar Ni Road, Dagon', lat: 16.798, lng: 96.149, rating: 4.9, distanceKm: 3.1, isFavorited: false, views: 1500, imageUrl: images.pagoda, href: '/attractions/ta1', openNow: true },
  { id: 'near-restaurant-2', title: 'Shan Yoe Yar', subtitle: 'Traditional Shan cuisine', category: 'restaurant', address: 'Yankin Road, Yangon', lat: 16.838, lng: 96.174, rating: 4.4, distanceKm: 3.6, isFavorited: false, views: 1500, imageUrl: images.food, href: '/restaurants/shan-yoe-yar', openNow: true },
  { id: 'near-cafe-2', title: 'Rangoon Tea House', subtitle: 'Tea, coffee, and local snacks', category: 'cafe', address: 'Pansodan Street', lat: 16.774, lng: 96.158, rating: 4.7, distanceKm: 3.9, isFavorited: false, views: 1500, imageUrl: images.lake, href: '/cafes/rangoon-tea-house', openNow: true },
  { id: 'near-rental-1', title: 'Yangon Bicycle Hub', subtitle: 'Bicycle rentals in downtown', category: 'rental', address: 'Downtown Yangon', lat: 16.781, lng: 96.16, rating: 4.4, distanceKm: 4.1, isFavorited: false, views: 1500, imageUrl: images.bridge, href: '/rentals/pre3', openNow: false },
  { id: 'near-market-2', title: 'Junction City Mall', subtitle: 'Shopping and city services', category: 'market', address: 'Bogyoke Aung San Road', lat: 16.778, lng: 96.157, rating: 4.5, distanceKm: 4.3, isFavorited: false, views: 1500, imageUrl: images.lake, href: '/markets/junction-city', openNow: true },
  { id: 'near-restaurant-3', title: 'Monsoon Restaurant', subtitle: 'Myanmar and Southeast Asian food', category: 'restaurant', address: 'Thein Phyu Road', lat: 16.771, lng: 96.171, rating: 4.3, distanceKm: 4.8, isFavorited: false, views: 1500, imageUrl: images.food, href: '/restaurants/monsoon', openNow: false },
  { id: 'near-guesthouse-1', title: 'Pansodan Guesthouse', subtitle: 'A walkable downtown stay', category: 'guesthouse', address: 'Pansodan Street, Downtown', lat: 16.7782, lng: 96.1575, rating: 4.5, distanceKm: 2.4, isFavorited: false, views: 890, imageUrl: images.lake, href: '/hotels', openNow: true },
  { id: 'near-bar-1', title: 'Yangon Rooftop Bar', subtitle: 'Evening drinks and city views', category: 'bar', address: 'Shwedagon Pagoda Road', lat: 16.790, lng: 96.150, rating: 4.4, distanceKm: 4.9, isFavorited: false, views: 760, imageUrl: images.food, href: '/restaurants', openNow: true },
  { id: 'near-exchange-1', title: 'Downtown Currency Exchange', subtitle: 'Currency exchange service', category: 'exchange', address: 'Maha Bandula Road', lat: 16.777, lng: 96.159, rating: 4.2, distanceKm: 3.0, isFavorited: false, views: 430, imageUrl: images.bridge, href: '/nearby', openNow: false },
  { id: 'near-hospital-1', title: 'Yangon Central Hospital', subtitle: 'General hospital and emergency care', category: 'hospital', address: 'Lanmadaw Township', lat: 16.779, lng: 96.140, rating: 4.5, distanceKm: 5.6, isFavorited: false, views: 980, imageUrl: images.wellness, href: '/nearby', openNow: true },
  { id: 'near-clinic-1', title: 'Family Health Clinic', subtitle: 'Primary care and consultations', category: 'clinic', address: 'Bahan Township', lat: 16.813, lng: 96.157, rating: 4.3, distanceKm: 2.0, isFavorited: false, views: 570, imageUrl: images.wellness, href: '/nearby', openNow: false },
  { id: 'near-gym-1', title: 'Downtown Fitness Club', subtitle: 'Fitness and training', category: 'gym', address: 'Kyauktada Township', lat: 16.780, lng: 96.160, rating: 4.4, distanceKm: 6.4, isFavorited: false, views: 640, imageUrl: images.wellness, href: '/nearby', openNow: true },
];
