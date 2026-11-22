import type { CardListing } from '../../types';
import {
  TOP_ATTRACTIONS,
  POPULAR_HOTELS,
  POPULAR_CAFES,
  POPULAR_MARKETS,
  POPULAR_RENTALS,
  POPULAR_TRANSPORT,
} from '../../data/cityPageData';
import { POPULARS } from '../../data/homeData';

export interface PlaceKind {
  slug: string;
  items: CardListing[];
  /** Singular label for the record, e.g. "Hotel". */
  mm: string;
  en: string;
  /** Plural label for the back link, e.g. "All hotels". */
  mmAll: string;
  enAll: string;
  mmIntro: string;
  enIntro: string;
}

export const PLACE_KINDS: PlaceKind[] = [
  {
    slug: 'attractions',
    items: TOP_ATTRACTIONS,
    mm: 'လည်ပတ်စရာ',
    en: 'Attraction',
    mmAll: 'လည်ပတ်စရာ အားလုံး',
    enAll: 'All attractions',
    mmIntro: 'သမိုင်းဝင် နေရာတစ်ခု။ သွားရောက်ရန် အကောင်းဆုံးအချိန်နှင့် လမ်းညွှန်အချက်အလက်များ။',
    enIntro: 'A historic site, with the best time to visit and directions.',
  },
  {
    slug: 'hotels',
    items: POPULAR_HOTELS,
    mm: 'ဟိုတယ်',
    en: 'Hotel',
    mmAll: 'ဟိုတယ် အားလုံး',
    enAll: 'All hotels',
    mmIntro: 'အခန်းများ၊ ဝန်ဆောင်မှုများနှင့် တည်နေရာအချက်အလက်များကို ကြည့်ရှုပြီး MH Travel မှတစ်ဆင့် ကြိုတင်မှာယူနိုင်ပါသည်။',
    enIntro: 'Review rooms, services, and location details, then book through MH Travel.',
  },
  {
    slug: 'cafes',
    items: POPULAR_CAFES,
    mm: 'ကဖေး',
    en: 'Cafe',
    mmAll: 'ကဖေး အားလုံး',
    enAll: 'All cafes',
    mmIntro: 'ကော်ဖီ၊ လက်ဖက်ရည်နှင့် မုန့်များအတွက် နာမည်ကြီး ကဖေးတစ်ခု။ ဖွင့်ချိန်နှင့် လမ်းညွှန်ကို ကြည့်ပါ။',
    enIntro: 'A well-known cafe for coffee, tea, and pastries. Check opening hours and directions.',
  },
  {
    slug: 'markets',
    items: POPULAR_MARKETS,
    mm: 'ဈေး',
    en: 'Market',
    mmAll: 'ဈေး အားလုံး',
    enAll: 'All markets',
    mmIntro: 'ဒေသထွက်ကုန်ပစ္စည်းများ၊ အဝတ်အထည်နှင့် လက်မှုပစ္စည်းများ ဝယ်ယူနိုင်သော ဈေးတစ်ခု။',
    enIntro: 'A market for local produce, textiles, and handicrafts.',
  },
  {
    slug: 'rentals',
    items: POPULAR_RENTALS,
    mm: 'ငှားရမ်းမှု',
    en: 'Rental',
    mmAll: 'ငှားရမ်းမှု အားလုံး',
    enAll: 'All rentals',
    mmIntro: 'နေ့စဉ်နှုန်းထားဖြင့် ငှားရမ်းနိုင်သော ဝန်ဆောင်မှု။ ရက်စွဲရွေးချယ်ပြီး စျေးနှုန်း ခန့်မှန်းချက် ရယူပါ။',
    enIntro: 'Available at a daily rate. Pick your dates and get a price estimate.',
  },
  {
    slug: 'ticketing',
    items: POPULAR_TRANSPORT,
    mm: 'ခရီးသွားလက်မှတ်',
    en: 'Transport operator',
    mmAll: 'ခရီးသွားလက်မှတ် အားလုံး',
    enAll: 'All transport operators',
    mmIntro: 'ခရီးစဉ်လမ်းကြောင်းများ၊ ထွက်ခွာချိန်များနှင့် လက်မှတ်စျေးနှုန်းများ။',
    enIntro: 'Routes, departure times, and ticket prices.',
  },
  {
    slug: 'populars',
    items: POPULARS,
    mm: 'လူကြိုက်များသော',
    en: 'Popular place',
    mmAll: 'လူကြိုက်များသော နေရာ အားလုံး',
    enAll: 'All popular places',
    mmIntro: 'ခရီးသွားများ အများဆုံး ရွေးချယ်သော နေရာတစ်ခု။',
    enIntro: 'One of the places travelers choose most often.',
  },
];

export function findPlaceKind(slug: string): PlaceKind | undefined {
  return PLACE_KINDS.find((kind) => kind.slug === slug);
}

/**
 * Seed hrefs use readable slugs (`/hotels/sedona-yangon`) while records carry
 * short ids (`ph2`), so match on the trailing segment either way.
 */
export function findPlace(kind: PlaceKind, id: string): CardListing | undefined {
  return kind.items.find((item) => item.id === id || item.href?.endsWith(`/${id}`));
}
