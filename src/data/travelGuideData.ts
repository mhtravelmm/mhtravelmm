import type { CardListing } from '../types';

export type GuideCategory = 'myanmar' | 'nature' | 'adventure' | 'culture' | 'food' | 'city_tour';

export interface LocalizedGuideCopy {
  mm: string;
  en: string;
}

export interface GuideStop {
  time: string;
  place: string;
  title: LocalizedGuideCopy;
  description: LocalizedGuideCopy;
}

export interface TravelGuideStory extends CardListing {
  category: GuideCategory;
  localizedTitle: LocalizedGuideCopy;
  summary: LocalizedGuideCopy;
  publishedAt: string;
  author: LocalizedGuideCopy;
  duration: LocalizedGuideCopy;
  stops: GuideStop[];
}

function stop(
  time: string,
  place: string,
  title: LocalizedGuideCopy,
  description: LocalizedGuideCopy,
): GuideStop {
  return { time, place, title, description };
}

const YANGON_STOPS = [
  stop(
    '08:00',
    'Shwedagon Pagoda, Yangon',
    { mm: 'ရွှေတိဂုံစေတီတော်', en: 'Shwedagon Pagoda' },
    { mm: 'မြို့ရဲ့ အထင်ကရ စေတီတော်ကို မနက်ခင်းအေးအေးမှာ လေ့လာပါ။', en: 'Begin with a calm morning visit to the city’s most recognized landmark.' },
  ),
  stop(
    '11:00',
    'Downtown Yangon, Myanmar',
    { mm: 'ရန်ကုန်မြို့လယ် လမ်းလျှောက်ခရီး', en: 'Downtown heritage walk' },
    { mm: 'ကိုလိုနီခေတ် အဆောက်အအုံများနှင့် လမ်းဘေးစားသောက်ဆိုင်များကို ကြည့်ရှုပါ။', en: 'Explore historic streets, architecture, and local lunch stops at an easy pace.' },
  ),
  stop(
    '16:30',
    'Sule Pagoda, Yangon',
    { mm: 'ဆူးလေဘုရားဝန်းကျင်', en: 'Sule Pagoda and the city center' },
    { mm: 'နေဝင်ချိန်မတိုင်မီ မြို့လယ်ဧရိယာကို အေးအေးဆေးဆေး လည်ပတ်ပါ။', en: 'Finish near the city center with time to rest before the evening.' },
  ),
];

export const TRAVEL_GUIDE_STORIES: TravelGuideStory[] = [
  {
    id: 'tg1',
    title: '3 Days in Bagan',
    localizedTitle: { mm: 'ပုဂံ ၃ ရက် ခရီးစဉ်', en: '3 Days in Bagan' },
    subtitle: 'A sunrise-to-sunset route through the temple plains.',
    summary: { mm: 'ပုဂံဘုရားပုထိုးများ၊ ဒေသခံလက်မှုပညာနှင့် ဧရာဝတီမြစ်ကမ်းအတွေ့အကြုံများကို ၃ ရက်အတွင်း စီစဉ်လိုက်ပါ။', en: 'Follow a sunrise-to-sunset route through Bagan’s temple plains, local craft stops, and riverside evenings.' },
    category: 'culture',
    imageUrl: '/images/blog/bagan-sunrise.webp',
    rating: 4.9,
    distanceKm: 4,
    isFavorited: false,
    views: 12500,
    publishedAt: '2026-11-05',
    author: { mm: 'မင်းထက်', en: 'Min Htet' },
    duration: { mm: '၃ ရက် ၂ ည', en: '3 days, 2 nights' },
    href: '/travel-guide/tg1',
    stops: [
      stop('05:45', 'Bagan, Myanmar', { mm: 'ပုဂံ နေထွက်မြင်ကွင်း', en: 'Sunrise over the temple plains' }, { mm: 'နေ့မစမီ အေးမြတဲ့အချိန်မှာ မြင်ကွင်းကို ခံစားပြီး ခရီးစဉ်စတင်ပါ။', en: 'Start early to enjoy the cooler morning light across the plains.' }),
      stop('09:00', 'Old Bagan, Myanmar', { mm: 'ရှေးဟောင်းဘုရားပုထိုး လမ်းကြောင်း', en: 'Old Bagan temple circuit' }, { mm: 'ဘုရားပုထိုးများကို အလျင်မလိုဘဲ အစီအစဉ်တကျ လေ့လာပါ။', en: 'Explore a short group of historic temples at a relaxed pace.' }),
      stop('16:30', 'Bagan riverside, Myanmar', { mm: 'ဧရာဝတီမြစ်ကမ်း ညနေခင်း', en: 'Evening by the Irrawaddy' }, { mm: 'ဒေသခံလက်မှုပစ္စည်းများနှင့် မြစ်ကမ်းဘေးညနေခင်းကို အဆုံးသတ်အဖြစ် ထည့်ပါ။', en: 'Leave room for local crafts and a quiet riverside finish.' }),
    ],
  },
  {
    id: 'tg2',
    title: 'Inle Lake: A Tranquil Journey',
    localizedTitle: { mm: 'အင်းလေးကန် အေးချမ်းသော ခရီးစဉ်', en: 'Inle Lake: A Tranquil Journey' },
    subtitle: 'A gentle lake route with villages, gardens, and open water.',
    summary: { mm: 'အင်းလေးကန်ပေါ်က လှေခရီး၊ ရေပေါ်ဥယျာဉ်များနှင့် ဒေသခံကျေးရွာများကို အေးအေးချမ်းချမ်း လည်ပတ်ပါ။', en: 'Plan a gentle lake route with a boat ride, floating gardens, and time in local villages.' },
    category: 'nature',
    imageUrl: '/images/blog/inle-stilt-houses.webp',
    rating: 4.8,
    distanceKm: 2,
    isFavorited: false,
    views: 10800,
    publishedAt: '2026-10-28',
    author: { mm: 'သီရိ', en: 'Thiri' },
    duration: { mm: '၂ ရက် ၁ ည', en: '2 days, 1 night' },
    href: '/travel-guide/tg2',
    stops: [
      stop('06:00', 'Inle Lake, Myanmar', { mm: 'အင်းလေးကန် နံနက်ခင်း လှေခရီး', en: 'Morning boat ride on Inle Lake' }, { mm: 'အေးမြတဲ့နံနက်ခင်းမှာ ရေပြင်နှင့် တောင်တန်းမြင်ကွင်းကို ခံစားပါ။', en: 'Take in the quiet water and surrounding hills in the early morning.' }),
      stop('10:00', 'Inle Lake floating gardens, Myanmar', { mm: 'ရေပေါ်ဥယျာဉ်များ', en: 'Floating gardens' }, { mm: 'ကန်ရဲ့ ရေပေါ်စိုက်ပျိုးရေးနှင့် နေ့စဉ်လူနေမှုကို လေ့လာပါ။', en: 'See the lake’s floating gardens and the everyday rhythm around them.' }),
      stop('15:30', 'Nyaungshwe, Myanmar', { mm: 'ညောင်ရွှေ အေးအေးဆေးဆေး လမ်းလျှောက်ခရီး', en: 'Easy afternoon in Nyaungshwe' }, { mm: 'ရွာလမ်းများ၊ ဒေသခံဈေးဆိုင်များနှင့် ကော်ဖီဆိုင်များအတွက် အချိန်ပေးပါ။', en: 'Save time for village lanes, local shops, and a relaxed café stop.' }),
    ],
  },
  {
    id: 'tg3',
    title: 'Yangon City Explorer',
    localizedTitle: { mm: 'ရန်ကုန်မြို့ လေ့လာရေးခရီးစဉ်', en: 'Yangon City Explorer' },
    subtitle: 'A one-day introduction to the city’s landmarks and neighborhoods.',
    summary: { mm: 'ရွှေတိဂုံ၊ မြို့လယ်အမွေအနှစ်လမ်းများနှင့် ဒေသခံအစားအစာများကို တစ်နေ့တာအတွင်း ပေါင်းစပ်လည်ပတ်ပါ။', en: 'Combine Shwedagon, downtown heritage streets, and local food for an easy first day in Yangon.' },
    category: 'city_tour',
    imageUrl: '/images/blog/shwedagon-evening.webp',
    rating: 4.8,
    distanceKm: 3,
    isFavorited: false,
    views: 9700,
    publishedAt: '2026-10-20',
    author: { mm: 'မင်းထက်', en: 'Min Htet' },
    duration: { mm: '၁ ရက်', en: '1 day' },
    href: '/travel-guide/tg3',
    stops: YANGON_STOPS,
  },
  {
    id: 'tg4',
    title: 'Mandalay Heritage Walk',
    localizedTitle: { mm: 'မန္တလေး အမွေအနှစ် လမ်းလျှောက်ခရီး', en: 'Mandalay Heritage Walk' },
    subtitle: 'A slow route through Mandalay and nearby Amarapura.',
    summary: { mm: 'မန္တလေးနှင့် အနီးတစ်ဝိုက်က အမွေအနှစ်နေရာများကို အချိန်ပေးပြီး လေ့လာနိုင်မည့် ခရီးစဉ်ဖြစ်ပါတယ်။', en: 'Take a slower route through Mandalay’s heritage sites and nearby Amarapura.' },
    category: 'culture',
    imageUrl: '/images/blog/ubein-evening.webp',
    rating: 4.7,
    distanceKm: 6,
    isFavorited: false,
    views: 8900,
    publishedAt: '2026-10-08',
    author: { mm: 'အောင်ကို', en: 'Aung Ko' },
    duration: { mm: '၂ ရက်', en: '2 days' },
    href: '/travel-guide/tg4',
    stops: [
      stop('06:00', 'U Bein Bridge, Amarapura', { mm: 'ဦးပိန်တံတား နံနက်ခင်း', en: 'U Bein Bridge in the morning' }, { mm: 'အလင်းရောင်ပျော့ပျောင်းတဲ့အချိန်ကို ရွေးပြီး တံတားနှင့် ကန်ပတ်ဝန်းကျင်ကို လေ့လာပါ။', en: 'Choose a cooler hour to explore the bridge and nearby water.' }),
      stop('10:30', 'Mandalay, Myanmar', { mm: 'မန္တလေး မြို့လယ် အမွေအနှစ်များ', en: 'Mandalay heritage district' }, { mm: 'မြို့တွင်းနေရာများကို အချိန်ပေးပြီး လမ်းလျှောက်လေ့လာပါ။', en: 'Allow enough time to explore the city’s historic places on foot.' }),
      stop('16:00', 'Mandalay Hill, Myanmar', { mm: 'မန္တလေးတောင် ညနေခင်း', en: 'Late afternoon viewpoint' }, { mm: 'ခရီးစဉ်ကို အေးဆေးတဲ့ မြင်ကွင်းတစ်ခုနဲ့ အဆုံးသတ်ပါ။', en: 'Finish the day with a relaxed view before returning to town.' }),
    ],
  },
  {
    id: 'tg5',
    title: 'Yangon Food Walk',
    localizedTitle: { mm: 'ရန်ကုန် အစားအသောက် လမ်းလျှောက်ခရီး', en: 'Yangon Food Walk' },
    subtitle: 'A flexible route for tea shops, street snacks, and local flavors.',
    summary: { mm: 'လက်ဖက်ရည်ဆိုင်မှ ညနေခင်းအဆာပြေအထိ ဒေသခံအရသာများကို လမ်းလျှောက်ရင်း မြည်းစမ်းပါ။', en: 'Sample local flavors on a flexible walk through tea shops, market stalls, and evening snacks.' },
    category: 'food',
    imageUrl: '/images/blog/myanmar-food.webp',
    rating: 4.9,
    distanceKm: 2,
    isFavorited: false,
    views: 8100,
    publishedAt: '2026-10-02',
    author: { mm: 'ခင်', en: 'Khin' },
    duration: { mm: 'တစ်ဝက်နေ့', en: 'Half day' },
    href: '/travel-guide/tg5',
    stops: [
      stop('08:00', 'Yangon tea house', { mm: 'လက်ဖက်ရည်ဆိုင် နံနက်စာ', en: 'Tea-shop breakfast' }, { mm: 'မနက်ခင်းမှာ မုန့်ဟင်းခါးနဲ့ လက်ဖက်ရည်ကို ဒေသခံပုံစံနဲ့ စတင်ပါ။', en: 'Start with a traditional breakfast and tea at a neighborhood shop.' }),
      stop('12:30', 'Yangon local restaurant', { mm: 'နေ့လယ်စာနှင့် ဒေသခံဟင်းလျာများ', en: 'Local lunch stop' }, { mm: 'မျှဝေစားသုံးနိုင်တဲ့ ဒေသခံဟင်းလျာများကို ရွေးချယ်ပါ။', en: 'Choose a few regional dishes that are easy to share.' }),
      stop('17:00', 'Yangon night market', { mm: 'ညနေခင်း လမ်းဘေးအစားအစာများ', en: 'Evening street-food stop' }, { mm: 'ဆိုင်ခန်းများကို အေးအေးဆေးဆေး ကြည့်ပြီး ကိုယ်နှစ်သက်ရာကို ရွေးပါ။', en: 'Browse at an easy pace and pick a few small bites to finish.' }),
    ],
  },
  {
    id: 'tg6',
    title: 'Myanmar Mountain Trail Essentials',
    localizedTitle: { mm: 'မြန်မာတောင်တန်း ခရီးလမ်း ပြင်ဆင်မှု', en: 'Myanmar Mountain Trail Essentials' },
    subtitle: 'A practical checklist and route rhythm for a guided nature walk.',
    summary: { mm: 'တောင်တန်းခရီးအတွက် သယ်ဆောင်ပစ္စည်း၊ လမ်းပြနှင့် အနားယူချိန်များကို ကြိုတင်စီစဉ်ပါ။', en: 'Plan a guided nature walk with a practical packing list, a local guide, and a comfortable pace.' },
    category: 'adventure',
    imageUrl: '/images/blog/myanmar-travel-safety.webp',
    rating: 4.7,
    distanceKm: 8,
    isFavorited: false,
    views: 7500,
    publishedAt: '2026-09-21',
    author: { mm: 'အောင်ကို', en: 'Aung Ko' },
    duration: { mm: '၁ ရက်', en: '1 day' },
    href: '/travel-guide/tg6',
    stops: [
      stop('07:00', 'Kalaw, Myanmar', { mm: 'လမ်းခရီးအတွက် ပြင်ဆင်ခြင်း', en: 'Prepare for the trail' }, { mm: 'ရေ၊ နေရောင်ကာပစ္စည်းနှင့် သင့်လျော်သော ဖိနပ်ကို စစ်ဆေးပါ။', en: 'Check water, sun protection, and comfortable footwear before setting out.' }),
      stop('09:00', 'Kalaw nature trail, Myanmar', { mm: 'ဒေသခံလမ်းပြနှင့် သဘာဝလမ်းကြောင်း', en: 'Guided nature walk' }, { mm: 'ရာသီဥတုနှင့် အဖွဲ့၏ လုပ်နိုင်စွမ်းအလိုက် အရှိန်ကို ချိန်ညှိပါ။', en: 'Let a local guide adjust the pace for the weather and group.' }),
      stop('15:00', 'Kalaw, Myanmar', { mm: 'အနားယူပြီး လုံခြုံရေးစစ်ဆေးခြင်း', en: 'Rest and check in' }, { mm: 'လမ်းကြောင်းပြီးဆုံးချိန်တွင် အဖွဲ့နှင့်အတူ ပြန်လည်စစ်ဆေးပါ။', en: 'Finish with a check-in and a clear plan for the return.' }),
    ],
  },
  {
    id: 'ctg1',
    title: 'Yangon in 5 Places, 1 Day',
    localizedTitle: { mm: 'တစ်ရက်အတွင်း ရန်ကုန် ၅ နေရာ', en: 'Yangon in 5 Places, 1 Day' },
    subtitle: 'A compact route linking central Yangon highlights.',
    summary: { mm: 'မြို့လယ်က အထင်ကရနေရာများကို အဆင်ပြေသော အစီအစဉ်တစ်ခုဖြင့် လည်ပတ်ပါ။', en: 'Connect central Yangon highlights in a compact, easy-to-follow day route.' },
    category: 'city_tour',
    imageUrl: '/images/blog/shwedagon-evening.webp',
    rating: 4.3,
    distanceKm: 3,
    isFavorited: false,
    views: 1500,
    publishedAt: '2026-09-17',
    author: { mm: 'မင်းထက်', en: 'Min Htet' },
    duration: { mm: '၁ ရက်', en: '1 day' },
    href: '/travel-guide/ctg1',
    stops: YANGON_STOPS,
  },
  {
    id: 'ctg2',
    title: 'Yangon Heritage Walk',
    localizedTitle: { mm: 'ရန်ကုန် အမွေအနှစ် လမ်းလျှောက်ခရီး', en: 'Yangon Heritage Walk' },
    subtitle: 'Historic streets, local lunch, and an unhurried afternoon.',
    summary: { mm: 'ရန်ကုန်မြို့လယ်ရှိ အမွေအနှစ်အဆောက်အအုံများနှင့် လူစည်ကားသောလမ်းများကို လမ်းလျှောက်လေ့လာပါ။', en: 'Explore central Yangon’s historic buildings and busy streets on foot.' },
    category: 'city_tour',
    imageUrl: '/images/blog/shwedagon-evening.webp',
    rating: 4.1,
    distanceKm: 5,
    isFavorited: false,
    views: 1500,
    publishedAt: '2026-09-12',
    author: { mm: 'သီရိ', en: 'Thiri' },
    duration: { mm: 'တစ်ဝက်နေ့', en: 'Half day' },
    href: '/travel-guide/ctg2',
    stops: YANGON_STOPS,
  },
  {
    id: 'ctg3',
    title: 'Yangon at Golden Hour',
    localizedTitle: { mm: 'ရွှေရောင်ညနေခင်း ရန်ကုန်ခရီး', en: 'Yangon at Golden Hour' },
    subtitle: 'A late-day route for landmark views and local snacks.',
    summary: { mm: 'ညနေခင်းအလင်းရောင်၊ မြို့လယ်မြင်ကွင်းနှင့် ဒေသခံစားစရာများကို တစ်ခရီးတည်းမှာ ပေါင်းစပ်ပါ။', en: 'Pair late-day city views with a relaxed stop for local snacks.' },
    category: 'city_tour',
    imageUrl: '/images/blog/shwedagon-evening.webp',
    rating: 4.6,
    distanceKm: 2,
    isFavorited: false,
    views: 1500,
    publishedAt: '2026-09-05',
    author: { mm: 'အောင်ကို', en: 'Aung Ko' },
    duration: { mm: 'တစ်ဝက်နေ့', en: 'Half day' },
    href: '/travel-guide/ctg3',
    stops: YANGON_STOPS,
  },
];
