import type { ShopPageData } from '../lib/shopTemplates';

/**
 * Plan §4: the fixture a template renders while listings live in compiled data.
 * Every template receives exactly this shape, so a template cannot reach the
 * owner's business data and a switch cannot lose it.
 */

const PHOTOS = {
  shwedagon: '/images/blog/shwedagon-evening.webp',
  inle: '/images/blog/inle-stilt-houses.webp',
  bagan: '/images/blog/bagan-sunrise.webp',
  ubein: '/images/blog/ubein-evening.webp',
  food: '/images/blog/myanmar-food.webp',
  wellness: '/images/blog/myanmar-wellness.webp',
};

function photo(key: string, altEn: string, altMm: string) {
  return { key, altEn, altMm };
}

export const SHOP_PAGES: ShopPageData[] = [
  {
    shopId: 'rangoon_house',
    nameMm: 'ရွှေတိဂုံ အိမ်တော်',
    nameEn: 'The Rangoon House',
    descriptionMm:
      'ရွှေတိဂုံဘုရားအနီး ရန်ကုန်မြို့လယ်ရှိ ဟိုတယ်တစ်ခု။ မြို့လယ်ခေတ်ဟောင်း ဗိသုကာနှင့် ခေတ်သစ်အခန်းများ ပေါင်းစပ်ထားသည်။',
    descriptionEn:
      'A hotel in downtown Yangon, a short walk from Shwedagon Pagoda, pairing colonial architecture with modern rooms.',
    address: 'Inya Road, Kamayut, Yangon',
    category: 'hotel',
    openTime: '24 hours',
    closeTime: '24 hours',
    checkIn: '14:00',
    checkOut: '12:00',
    photos: [
      photo(PHOTOS.shwedagon, 'Shwedagon Pagoda at dusk', 'ညနေခင်း ရွှေတိဂုံစေတီ'),
      photo(PHOTOS.inle, 'Stilt houses on Inle Lake', 'အင်းလေးကန်ရှိ ရေပေါ်အိမ်များ'),
      photo(PHOTOS.bagan, 'Sunrise over Bagan', 'ပုဂံ အရုဏ်တက်'),
      photo(PHOTOS.ubein, 'U Bein bridge in the evening', 'ညနေခင်း ဦးပိန် တံတား'),
    ],
    catalog: [
      { id: 'room-deluxe', nameMm: 'ဒီလပ်စ် အခန်း', nameEn: 'Deluxe Room', priceMmk: 145000 },
      { id: 'room-suite', nameMm: 'ဆူးဝစ် အခန်း', nameEn: 'Suite', priceMmk: 265000 },
      { id: 'room-family', nameMm: 'မိသားစု အခန်း', nameEn: 'Family Room', priceMmk: 198000 },
      { id: 'room-twin', nameMm: 'တွင် အခန်း', nameEn: 'Twin Room', priceMmk: 132000 },
    ],
    priceDisplay: 'public',
    reviews: [
      { id: 'rv1', rating: 5, bodyMm: 'ဝန်ဆောင်မှု အလွန်ကောင်းသည်။ မနက်စာ ကောင်းသည်။', bodyEn: 'Wonderful service and a very good breakfast.' },
      { id: 'rv2', rating: 4, bodyMm: 'တည်နေရာ ကောင်းသည်။ အခန်း ကျယ်သည်။', bodyEn: 'Great location and a spacious room.' },
      { id: 'rv3', rating: 5, bodyMm: 'ရွှေတိဂုံဘုရားနှင့် နီးသည်။', bodyEn: 'Close to Shwedagon Pagoda.' },
    ],
    contact: { phone: '09 777 123 456', email: 'stay@rangoonhouse.mm' },
    bookingCta: { href: '/travel-plans', mode: 'manual' },
  },
  {
    shopId: 'mandalay_booknook',
    nameMm: 'မန္တလေး စာအုပ်တိုက်',
    nameEn: 'Mandalay Book Nook',
    descriptionMm: 'မြန်မာစာပေ၊ သမိုင်းနှင့် ခရီးသွား စာအုပ်များ ရနိုင်သော စာအုပ်ဆိုင်။',
    descriptionEn: 'A book shop for Burmese literature, history and travel writing, with a small stationery counter.',
    address: 'Zegyo Market, Mandalay',
    category: 'book_shop',
    openTime: '09:00',
    closeTime: '19:00',
    checkIn: '',
    checkOut: '',
    photos: [
      photo(PHOTOS.ubein, 'U Bein bridge in the evening', 'ညနေခင်း ဦးပိန် တံတား'),
      photo(PHOTOS.bagan, 'Sunrise over Bagan', 'ပုဂံ အရုဏ်တက်'),
    ],
    catalog: [
      { id: 'book-history', nameMm: 'မြန်မာ့သမိုင်း', nameEn: 'A History of Burma', priceMmk: 18000 },
      { id: 'book-travel', nameMm: 'မြန်မာ ခရီးသွား လမ်းညွှန်', nameEn: 'Myanmar Travel Companion', priceMmk: 24000 },
      { id: 'book-poetry', nameMm: 'ကဗျာ စုစည်းမှု', nameEn: 'Collected Poems', priceMmk: 12000 },
    ],
    priceDisplay: 'after_payment',
    reviews: [
      { id: 'rv1', rating: 5, bodyMm: 'စာအုပ် ရွေးချယ်မှု ကောင်းသည်။', bodyEn: 'A well chosen collection.' },
      { id: 'rv2', rating: 4, bodyMm: 'ဝန်ထမ်းများ ကူညီသည်။', bodyEn: 'Helpful staff.' },
    ],
    contact: { phone: '09 555 010 220', email: 'hello@mandalaybooknook.mm' },
    bookingCta: { href: '/book-shops/book-nook', mode: 'instant' },
  },
  {
    shopId: 'yangon_teahouse',
    nameMm: 'ရန်ကုန် လက်ဖက်ရည်ဆိုင်',
    nameEn: 'Yangon Teahouse',
    descriptionMm: 'မြန်မာ့ ရိုးရာ လက်ဖက်ရည်ဆိုင်တစ်ခု။ နံနက်စာ၊ မုန့်ဟင်းခါးနှင့် လက်ဖက်ရည် ရနိုင်သည်။',
    descriptionEn: 'A traditional Myanmar teahouse serving breakfast, mohinga and strong sweet tea all morning.',
    address: '19th Street, Latha, Yangon',
    category: 'restaurant',
    openTime: '06:00',
    closeTime: '21:00',
    checkIn: '',
    checkOut: '',
    photos: [
      photo(PHOTOS.food, 'Myanmar dishes on a table', 'စားပွဲပေါ်ရှိ မြန်မာ့အစားအစာများ'),
      photo(PHOTOS.wellness, 'A quiet courtyard', 'တိတ်ဆိတ်သော ဝင်းအတွင်း'),
      photo(PHOTOS.bagan, 'Sunrise over Bagan', 'ပုဂံ အရုဏ်တက်'),
    ],
    catalog: [
      { id: 'dish-mohinga', nameMm: 'မုန့်ဟင်းခါး', nameEn: 'Mohinga', priceMmk: 3500 },
      { id: 'dish-tea', nameMm: 'လက်ဖက်ရည်', nameEn: 'Milk Tea', priceMmk: 1200 },
      { id: 'dish-paratha', nameMm: 'ပလာတာ', nameEn: 'Paratha', priceMmk: 2500 },
      { id: 'dish-noodles', nameMm: 'ရှမ်းခေါက်ဆွဲ', nameEn: 'Shan Noodles', priceMmk: 4000 },
    ],
    priceDisplay: 'public',
    reviews: [
      { id: 'rv1', rating: 5, bodyMm: 'လက်ဖက်ရည် အရသာ ကောင်းသည်။', bodyEn: 'The tea is exactly right.' },
      { id: 'rv2', rating: 4, bodyMm: 'မနက်စာ မြန်သည်။', bodyEn: 'Breakfast came quickly.' },
    ],
    contact: { phone: '09 450 118 907', email: 'hello@yangonteahouse.mm' },
    bookingCta: { href: '/restaurants', mode: 'manual' },
  },
  {
    shopId: 'bagan_roastery',
    nameMm: 'ပုဂံ ကော်ဖီ',
    nameEn: 'Bagan Roastery',
    descriptionMm: 'ပုဂံဒေသ ကော်ဖီစေ့များကို လှော်ထားသော ကော်ဖီဆိုင်။ နေဝင်ချိန် ကြည့်ရန် အကောင်းဆုံး။',
    descriptionEn: 'A roastery working with Bagan beans, with a terrace built for the sunset.',
    address: 'Nyaung U, Bagan',
    category: 'cafe',
    openTime: '07:00',
    closeTime: '22:00',
    checkIn: '',
    checkOut: '',
    photos: [
      photo(PHOTOS.bagan, 'Sunrise over Bagan', 'ပုဂံ အရုဏ်တက်'),
      photo(PHOTOS.wellness, 'A quiet courtyard', 'တိတ်ဆိတ်သော ဝင်းအတွင်း'),
      photo(PHOTOS.food, 'Myanmar dishes on a table', 'စားပွဲပေါ်ရှိ မြန်မာ့အစားအစာများ'),
    ],
    catalog: [
      { id: 'drink-espresso', nameMm: 'အီစပရက်ဆို', nameEn: 'Espresso', priceMmk: 2500 },
      { id: 'drink-latte', nameMm: 'လတ်တေး', nameEn: 'Latte', priceMmk: 3800 },
      { id: 'drink-coldbrew', nameMm: 'အအေး ကော်ဖီ', nameEn: 'Cold Brew', priceMmk: 4200 },
    ],
    priceDisplay: 'public',
    reviews: [
      { id: 'rv1', rating: 5, bodyMm: 'နေဝင်ချိန် မြင်ကွင်း လှသည်။', bodyEn: 'The sunset view is the reason to come.' },
      { id: 'rv2', rating: 4, bodyMm: 'ကော်ဖီ ကောင်းသည်။', bodyEn: 'Good coffee, unhurried service.' },
    ],
    contact: { phone: '09 260 774 118', email: 'stay@baganroastery.mm' },
    bookingCta: { href: '/cafes', mode: 'manual' },
  },
  {
    shopId: 'shwedagon_pagoda',
    nameMm: 'ရွှေတိဂုံ စေတီတော်',
    nameEn: 'Shwedagon Pagoda',
    descriptionMm: 'မြန်မာနိုင်ငံ၏ အထွတ်အမြတ်ထားရာ စေတီတော်။ နေဝင်ချိန်တွင် ရွှေရောင်တောက်ပနေသည်။',
    descriptionEn: 'The most sacred pagoda in Myanmar, its gold stupa brightest in the last hour of daylight.',
    address: 'Singuttara Hill, Dagon, Yangon',
    category: 'attraction',
    openTime: '04:00',
    closeTime: '22:00',
    checkIn: '',
    checkOut: '',
    photos: [
      photo(PHOTOS.shwedagon, 'Shwedagon Pagoda at dusk', 'ညနေခင်း ရွှေတိဂုံစေတီ'),
      photo(PHOTOS.ubein, 'U Bein bridge in the evening', 'ညနေခင်း ဦးပိန် တံတား'),
      photo(PHOTOS.inle, 'Stilt houses on Inle Lake', 'အင်းလေးကန်ရှိ ရေပေါ်အိမ်များ'),
    ],
    catalog: [
      { id: 'ticket-foreign', nameMm: 'နိုင်ငံခြားသား လက်မှတ်', nameEn: 'Foreign visitor ticket', priceMmk: 10000 },
      { id: 'ticket-guide', nameMm: 'လမ်းညွှန် ဝန်ဆောင်မှု', nameEn: 'Guided tour', priceMmk: 25000 },
      { id: 'ticket-offering', nameMm: 'ဆွမ်းတော်တင်လှူ', nameEn: 'Offering set', priceMmk: 5000 },
    ],
    priceDisplay: 'public',
    reviews: [
      { id: 'rv1', rating: 5, bodyMm: 'ညနေခင်း အလွန်လှသည်။', bodyEn: 'Unforgettable at dusk.' },
      { id: 'rv2', rating: 5, bodyMm: 'ငြိမ်းချမ်းမှုကို ခံစားရသည်။', bodyEn: 'A calm place even when it is busy.' },
    ],
    contact: { phone: '09 970 440 112', email: 'visit@shwedagon.mm' },
    bookingCta: { href: '/travel-plans', mode: 'instant' },
  },
];

export function shopPageData(shopId: string): ShopPageData | undefined {
  return SHOP_PAGES.find((page) => page.shopId === shopId);
}

export function shopIds(): string[] {
  return SHOP_PAGES.map((page) => page.shopId);
}
