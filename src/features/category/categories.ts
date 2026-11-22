import type { CardListing } from '../../types';
import {
  TOP_ATTRACTIONS,
  POPULAR_HOTELS,
  POPULAR_RESTAURANTS,
  POPULAR_BOOK_SHOPS,
  POPULAR_RENTALS,
  POPULAR_TRANSPORT,
  POPULAR_CAFES,
  POPULAR_MARKETS,
} from '../../data/cityPageData';
import { POPULARS } from '../../data/homeData';

export interface CategoryDef {
  id: string;
  slug: string;
  mm: string;
  en: string;
  items: CardListing[];
  image: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'attractions', slug: 'attractions', mm: 'လည်ပတ်စရာနေရာများ', en: 'Attractions', items: TOP_ATTRACTIONS, image: '/images/blog/shwedagon-evening.webp' },
  { id: 'hotels', slug: 'hotels', mm: 'ဟိုတယ်များ', en: 'Hotels', items: POPULAR_HOTELS, image: '/images/blog/inle-stilt-houses.webp' },
  { id: 'restaurants', slug: 'restaurants', mm: 'စားသောက်ဆိုင်များ', en: 'Restaurants', items: POPULAR_RESTAURANTS, image: '/images/blog/ubein-evening.webp' },
  { id: 'cafes', slug: 'cafes', mm: 'ကဖေးများ', en: 'Cafes', items: POPULAR_CAFES, image: '/images/blog/bagan-sunrise.webp' },
  { id: 'markets', slug: 'markets', mm: 'ဈေးများ', en: 'Markets', items: POPULAR_MARKETS, image: '/images/blog/shwedagon-evening.webp' },
  { id: 'book-shops', slug: 'book-shops', mm: 'စာအုပ်ဆိုင်များ', en: 'Book shops', items: POPULAR_BOOK_SHOPS, image: '/images/blog/ubein-evening.webp' },
  { id: 'rentals', slug: 'rentals', mm: 'ငှားရမ်းမှုများ', en: 'Rentals', items: POPULAR_RENTALS, image: '/images/blog/inle-stilt-houses.webp' },
  { id: 'transport', slug: 'transport', mm: 'သယ်ယူပို့ဆောင်ရေး', en: 'Transport', items: POPULAR_TRANSPORT, image: '/images/blog/bagan-sunrise.webp' },
  { id: 'populars', slug: 'populars', mm: 'လူကြိုက်များသော', en: 'Populars', items: POPULARS, image: '/images/blog/shwedagon-evening.webp' },
];
