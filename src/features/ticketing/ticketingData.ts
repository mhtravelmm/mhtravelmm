export type TicketType = 'flight' | 'bus' | 'events' | 'cinema' | 'train';
export type LocalizedText = { mm: string; en: string };

export type TicketPlace = {
  id: string;
  name: LocalizedText;
  code?: string;
};

export type TicketService = {
  id: string;
  type: TicketType;
  operator: LocalizedText;
  mark: string;
  brandClass: string;
  route: LocalizedText;
  depart: string;
  arrive: string;
  duration: string;
  price: number;
  seats: number;
  image: string;
  badge: LocalizedText;
  from?: string;
  to?: string;
  city?: string;
  venueId?: string;
};

export type PopularRoute = {
  id: string;
  from: string;
  to: string;
  price: number;
  tone: string;
};

export const TICKETING_PLACES: TicketPlace[] = [
  { id: 'yangon', name: { mm: 'ရန်ကုန်', en: 'Yangon' }, code: 'RGN' },
  { id: 'bagan', name: { mm: 'ပုဂံ', en: 'Bagan' }, code: 'NYU' },
  { id: 'mandalay', name: { mm: 'မန္တလေး', en: 'Mandalay' }, code: 'MDL' },
  { id: 'inle', name: { mm: 'အင်းလေး', en: 'Inle Lake' }, code: 'HEH' },
  { id: 'naypyidaw', name: { mm: 'နေပြည်တော်', en: 'Naypyidaw' }, code: 'NYT' },
  { id: 'bangkok', name: { mm: 'ဘန်ကောက်', en: 'Bangkok' }, code: 'BKK' },
  { id: 'singapore', name: { mm: 'စင်ကာပူ', en: 'Singapore' }, code: 'SIN' },
  { id: 'kuala-lumpur', name: { mm: 'ကွာလာလမ်ပူ', en: 'Kuala Lumpur' }, code: 'KUL' },
  { id: 'dubai', name: { mm: 'ဒူဘိုင်း', en: 'Dubai' }, code: 'DXB' },
  { id: 'paris', name: { mm: 'ပါရီ', en: 'Paris' }, code: 'CDG' },
];

export const TICKETING_CINEMA_VENUES = [
  { id: 'j-yangon', city: 'yangon', name: { mm: 'J Cineplex — ရန်ကုန်', en: 'J Cineplex — Yangon' } },
  { id: 'mingalar-yangon', city: 'yangon', name: { mm: 'Mingalar Cinema — ရန်ကုန်', en: 'Mingalar Cinema — Yangon' } },
  { id: 'mingalar-mandalay', city: 'mandalay', name: { mm: 'Mingalar Mandalay', en: 'Mingalar Mandalay' } },
];

export const TICKETING_SERVICES: TicketService[] = [
  { id: 'flight-mai-bkk', type: 'flight', operator: { mm: 'Myanmar Airways International', en: 'Myanmar Airways International' }, mark: 'MAI', brandClass: 'bg-amber-400 text-slate-950', route: { mm: 'ရန်ကုန် (RGN) → ဘန်ကောက် (BKK)', en: 'RGN → BKK · Yangon to Bangkok' }, depart: '08:15', arrive: '09:50', duration: '1h 35m', price: 120, seats: 18, image: '/images/blog/shwedagon-evening.webp', badge: { mm: 'လူကြိုက်များ', en: 'Popular' }, from: 'yangon', to: 'bangkok' },
  { id: 'flight-airasia-kul', type: 'flight', operator: { mm: 'AirAsia', en: 'AirAsia' }, mark: 'air', brandClass: 'bg-rose-600 text-white', route: { mm: 'ရန်ကုန် (RGN) → ကွာလာလမ်ပူ (KUL)', en: 'RGN → KUL · Yangon to Kuala Lumpur' }, depart: '10:20', arrive: '14:10', duration: '3h 50m', price: 150, seats: 11, image: '/images/blog/ubein-evening.webp', badge: { mm: 'အကောင်းဆုံးဈေး', en: 'Best value' }, from: 'yangon', to: 'kuala-lumpur' },
  { id: 'flight-sia-sin', type: 'flight', operator: { mm: 'Singapore Airlines', en: 'Singapore Airlines' }, mark: 'SQ', brandClass: 'bg-sky-900 text-amber-200', route: { mm: 'ရန်ကုန် (RGN) → စင်ကာပူ (SIN)', en: 'RGN → SIN · Yangon to Singapore' }, depart: '16:45', arrive: '20:55', duration: '4h 10m', price: 180, seats: 9, image: '/images/blog/inle-stilt-houses.webp', badge: { mm: 'တိုက်ရိုက်ခရီးစဉ်', en: 'Direct flight' }, from: 'yangon', to: 'singapore' },
  { id: 'flight-emirates-dxb', type: 'flight', operator: { mm: 'Emirates', en: 'Emirates' }, mark: 'EK', brandClass: 'bg-red-700 text-white', route: { mm: 'ရန်ကုန် (RGN) → ဒူဘိုင်း (DXB)', en: 'RGN → DXB · Yangon to Dubai' }, depart: '22:30', arrive: '03:15 +1', duration: '6h 45m', price: 420, seats: 6, image: '/images/blog/bagan-sunrise.webp', badge: { mm: 'ညခရီးစဉ်', en: 'Overnight' }, from: 'yangon', to: 'dubai' },
  { id: 'flight-paris-cdg', type: 'flight', operator: { mm: 'Air France', en: 'Air France' }, mark: 'AF', brandClass: 'bg-indigo-900 text-white', route: { mm: 'ရန်ကုန် (RGN) → ပါရီ (CDG)', en: 'RGN → CDG · Yangon to Paris' }, depart: '21:40', arrive: '07:15 +1', duration: '12h 35m', price: 680, seats: 4, image: '/images/blog/shwedagon-evening.webp', badge: { mm: 'အဝေးပြေးခရီးစဉ်', en: 'Long-haul' }, from: 'yangon', to: 'paris' },

  { id: 'bus-jj', type: 'bus', operator: { mm: 'JJ Express', en: 'JJ Express' }, mark: 'JJ', brandClass: 'bg-sky-700 text-white', route: { mm: 'ရန်ကုန် → ပုဂံ', en: 'Yangon → Bagan' }, depart: '20:00', arrive: '05:30', duration: '9h 30m', price: 28, seats: 12, image: '/images/blog/bagan-sunrise.webp', badge: { mm: 'လူကြိုက်များ', en: 'Popular' }, from: 'yangon', to: 'bagan' },
  { id: 'bus-elite', type: 'bus', operator: { mm: 'Elite Express', en: 'Elite Express' }, mark: 'EL', brandClass: 'bg-orange-700 text-white', route: { mm: 'ရန်ကုန် → မန္တလေး', en: 'Yangon → Mandalay' }, depart: '18:30', arrive: '06:30', duration: '12h', price: 31, seats: 8, image: '/images/blog/shwedagon-evening.webp', badge: { mm: 'သက်သာသော', en: 'Best value' }, from: 'yangon', to: 'mandalay' },

  { id: 'train-1', type: 'train', operator: { mm: 'Myanmar Railways', en: 'Myanmar Railways' }, mark: 'MR', brandClass: 'bg-emerald-700 text-white', route: { mm: 'ရန်ကုန် → မန္တလေး', en: 'Yangon → Mandalay' }, depart: '06:00', arrive: '20:30', duration: '14h 30m', price: 18, seats: 24, image: '/images/blog/ubein-evening.webp', badge: { mm: 'ရထားခရီး', en: 'Rail journey' }, from: 'yangon', to: 'mandalay' },

  { id: 'event-1', type: 'events', operator: { mm: 'MH Travel Events', en: 'MH Travel Events' }, mark: 'EV', brandClass: 'bg-pink-700 text-white', route: { mm: 'ရန်ကုန် ညပွဲတော်', en: 'Yangon City Night Live' }, depart: '18:00', arrive: '22:00', duration: '4h', price: 12, seats: 80, image: '/images/blog/shwedagon-evening.webp', badge: { mm: 'ယခုလ', en: 'This month' }, city: 'yangon' },
  { id: 'event-2', type: 'events', operator: { mm: 'MH Travel Events', en: 'MH Travel Events' }, mark: 'EV', brandClass: 'bg-violet-700 text-white', route: { mm: 'မန္တလေး ဂီတည', en: 'Mandalay Live Music Night' }, depart: '17:30', arrive: '22:00', duration: '4h 30m', price: 15, seats: 50, image: '/images/blog/ubein-evening.webp', badge: { mm: 'တိုက်ရိုက်ဂီတ', en: 'Live music' }, city: 'mandalay' },

  { id: 'cinema-1', type: 'cinema', operator: { mm: 'J Cineplex', en: 'J Cineplex' }, mark: 'J', brandClass: 'bg-red-700 text-white', route: { mm: 'ပြသနေသော ရုပ်ရှင်များ', en: 'Now showing' }, depart: '19:00', arrive: '21:10', duration: '2h 10m', price: 6, seats: 34, image: '/images/blog/shwedagon-evening.webp', badge: { mm: 'အသစ်ထွက်', en: 'New release' }, venueId: 'j-yangon' },
  { id: 'cinema-2', type: 'cinema', operator: { mm: 'Mingalar Cinema', en: 'Mingalar Cinema' }, mark: 'M', brandClass: 'bg-amber-600 text-slate-950', route: { mm: 'ပြသနေသော ရုပ်ရှင်များ', en: 'Now showing' }, depart: '16:30', arrive: '18:45', duration: '2h 15m', price: 5, seats: 21, image: '/images/blog/bagan-sunrise.webp', badge: { mm: 'လူကြိုက်များ', en: 'Popular' }, venueId: 'mingalar-yangon' },
];

export const POPULAR_FLIGHT_ROUTES: PopularRoute[] = [
  { id: 'yangon-bangkok', from: 'yangon', to: 'bangkok', price: 120, tone: 'from-[#0e2d54] via-[#145b82] to-[#06a4bc]' },
  { id: 'yangon-singapore', from: 'yangon', to: 'singapore', price: 180, tone: 'from-[#182d55] via-[#345f95] to-[#27b5c7]' },
  { id: 'yangon-kuala-lumpur', from: 'yangon', to: 'kuala-lumpur', price: 150, tone: 'from-[#172642] via-[#6b3b7d] to-[#dc6859]' },
  { id: 'yangon-dubai', from: 'yangon', to: 'dubai', price: 420, tone: 'from-[#132d3c] via-[#187b82] to-[#f29a48]' },
  { id: 'yangon-paris', from: 'yangon', to: 'paris', price: 680, tone: 'from-[#172954] via-[#426caa] to-[#a95c84]' },
];
