import type { Language } from '../types';

/**
 * Plan §8: rentals are MH Travel's own product and the first priority module,
 * so every rule that used to live in the page's JSX is data here. A new type
 * (an e-bike, a tricycle, a boat) is a new record in this file or an edit in
 * the Rental Admin panel — never new page code.
 */

export type Bilingual = { mm: string; en: string };

/** Icon names the rentals page resolves to a lucide component. */
export type RentalIconName = 'bike' | 'bolt' | 'car' | 'compass' | 'tent' | 'boat' | 'person' | 'tricycle';

export type RentalCustomerType = 'citizen' | 'foreigner';

/** Plan §8.3: `simple` books the category, `driver_vehicle` also picks a variant. */
export type RentalFlow = 'simple' | 'driver_vehicle';

/** A bookable variant inside a category: the car sizes, bicycle models, boat types. */
export type RentalVariant = {
  id: string;
  label: Bilingual;
  seats: number | null;
  rules: Bilingual;
  active: boolean;
  sortOrder: number;
  rateUsd: number;
  foreignRateUsd: number;
};

export type RentalType = {
  id: string;
  label: Bilingual;
  detail: Bilingual;
  image: string;
  icon: RentalIconName;
  /** Listing whose rating, distance, views and heart the card reuses. */
  listingId?: string;
  flow: RentalFlow;
  driverRequired: boolean;
  /** Charged days never drop below this; car types count the return leg. */
  minDays: number;
  rateUsd: number;
  foreignRateUsd: number;
  variants: RentalVariant[];
  terms: Bilingual;
  /** A retired category stays here so past orders still resolve; it is not offered. */
  active: boolean;
  sortOrder: number;
};

export type RentalBranch = { id: string; name: Bilingual; address: string; phone: string };

export type RentalCity = { id: string; name: Bilingual; branches: RentalBranch[] };

/** `availability[cityId][typeId]` — the city × type matrix the Admin edits. */
export type RentalAvailability = Record<string, Record<string, boolean>>;

/**
 * Plan §8.4 step 1: the most specific row wins. A null `cityId` or `variantId`
 * is the default, so a category needs one base rate and only exceptions are
 * listed.
 */
export type RentalRate = {
  id: string;
  categoryId: string;
  variantId: string | null;
  cityId: string | null;
  rateLocalUsd: number;
  rateForeignUsd: number;
  /** A row with no dates is the standing rate; dated rows form the history. */
  effectiveFrom?: string;
  effectiveTo?: string | null;
};

/** A superseded terms version stays here so an old order still prints its own policy. */
export type RentalTermsVersion = { version: string; body: Bilingual; publishedAt: string };

/** Plan §8.8 Settings: the two thresholds the dashboard and the form read. */
export type RentalSettings = {
  /** A Requested order older than this is highlighted for staff. */
  highlightAfterHours: number;
  /** How many days ahead the traveler must book. */
  minNoticeDays: number;
};

export type RentalCatalog = {
  termsVersion: string;
  terms: Bilingual;
  termsHistory: RentalTermsVersion[];
  types: RentalType[];
  cities: RentalCity[];
  availability: RentalAvailability;
  rates: RentalRate[];
  settings: RentalSettings;
};

export function localized(value: Bilingual, language: Language): string {
  return language === 'mm' ? value.mm : value.en;
}

const NO_RULES: Bilingual = { mm: '', en: '' };

const CAR_TERMS: Bilingual = {
  mm: 'ကားငှားရမ်းခြင်းတွင် ယာဉ်မောင်း ပါဝင်ပါသည်။ ခရီးစဉ်အတွက် ပြန်လာသည့်ရက်ကို ထည့်တွက်ပါသည်။',
  en: 'Car rental includes a driver. The return leg counts toward the charged days.',
};

const SELF_DRIVE_TERMS: Bilingual = {
  mm: 'ကိုယ်တိုင်မောင်းနှင်ပါက တရားဝင် ယာဉ်မောင်းလိုင်စင် ပြသရန် လိုအပ်ပါသည်။',
  en: 'Self-drive rentals require a valid driving licence at pickup.',
};

const GUIDE_TERMS: Bilingual = {
  mm: 'လမ်းညွှန်ခအပြင် လမ်းညွှန်၏ တည်းခိုစရိတ်၊ စားစရိတ်နှင့် ခရီးစရိတ်ကို အသုံးပြုသူက ကျခံရပါမည်။',
  en: 'Beyond the daily rate, the traveler covers the guide’s lodging, food, and travel costs.',
};

const GEAR_TERMS: Bilingual = {
  mm: 'ငှားရမ်းချိန်အတွင်း ပျက်စီးမှုအတွက် တာဝန်ယူရပါမည်။ ပြန်အပ်သည့်အခါ အခြေအနေ စစ်ဆေးပါမည်။',
  en: 'You are responsible for damage during the rental; condition is checked at return.',
};

export const DEFAULT_RENTAL_CATALOG: RentalCatalog = {
  termsVersion: '2026-11-22',
  terms: {
    mm: 'ငှားရမ်းမှု တောင်းဆိုချက်ကို MH Travel မှ ရရှိနိုင်မှု စစ်ဆေးပြီး အတည်ပြုပါမည်။ ငှားရမ်းချိန်အတွင်း ထိခိုက်မှုအတွက် တာဝန်ယူရပါမည်။',
    en: 'MH Travel checks availability and confirms each request. You are responsible for the vehicle while it is with you.',
  },
  types: [
    {
      id: 'bicycle',
      label: { mm: 'စက်ဘီး', en: 'Bicycle' },
      detail: { mm: 'မြို့တွင်းကို သက်တောင့်သက်သာ စီးနင်းလည်ပတ်ရန်', en: 'Explore the city at your own pace.' },
      image: '/images/blog/ubein-evening.webp',
      icon: 'bike',
      listingId: 'pre3',
      flow: 'simple',
      driverRequired: false,
      minDays: 1,
      rateUsd: 8,
      foreignRateUsd: 10,
      variants: [
        {
          id: 'standard_bicycle',
          label: { mm: 'စံစက်ဘီး', en: 'Standard bicycle' },
          seats: 1,
          rules: NO_RULES,
          active: true,
          sortOrder: 1,
          rateUsd: 8,
          foreignRateUsd: 10,
        },
      ],
      terms: GEAR_TERMS,
      active: true,
      sortOrder: 1,
    },
    {
      id: 'ebike',
      label: { mm: 'လျှပ်စစ်စက်ဘီး', en: 'E-Bike' },
      detail: { mm: 'လျှပ်စစ်အကူအညီဖြင့် ပိုမိုလွယ်ကူစွာ စီးနင်းရန်', en: 'Cover more ground with pedal assist.' },
      image: '/images/blog/shwedagon-evening.webp',
      icon: 'bolt',
      listingId: 'pre6',
      flow: 'simple',
      driverRequired: false,
      minDays: 1,
      rateUsd: 12,
      foreignRateUsd: 15,
      variants: [],
      terms: GEAR_TERMS,
      active: true,
      sortOrder: 2,
    },
    {
      id: 'motorbike',
      label: { mm: 'ဆိုင်ကယ်', en: 'Motorbike' },
      detail: { mm: 'ကိုယ်တိုင်မောင်းပြီး မြို့နှင့် ပတ်ဝန်းကျင်ကို လည်ပတ်ရန်', en: 'A simple self-drive ride for local trips.' },
      image: '/images/blog/bagan-sunrise.webp',
      icon: 'bike',
      listingId: 'pre2',
      flow: 'simple',
      driverRequired: false,
      minDays: 1,
      rateUsd: 18,
      foreignRateUsd: 22,
      variants: [],
      terms: SELF_DRIVE_TERMS,
      active: true,
      sortOrder: 3,
    },
    {
      id: 'scooter',
      label: { mm: 'စကူတာ', en: 'Scooter' },
      detail: { mm: 'မြို့တွင်း အမြန်သွားလာရန်', en: 'A convenient ride around town.' },
      image: '/images/blog/inle-stilt-houses.webp',
      icon: 'bike',
      listingId: 'pre7',
      flow: 'simple',
      driverRequired: false,
      minDays: 1,
      rateUsd: 10,
      foreignRateUsd: 13,
      variants: [],
      terms: SELF_DRIVE_TERMS,
      active: true,
      sortOrder: 4,
    },
    {
      id: 'tricycle',
      label: { mm: 'သုံးဘီး', en: 'Tricycle' },
      detail: { mm: 'မြို့တွင်း တိုတောင်းသော ခရီးများအတွက်', en: 'Short hops around town with a driver.' },
      image: '/images/blog/ubein-evening.webp',
      icon: 'tricycle',
      listingId: 'pre11',
      flow: 'simple',
      driverRequired: true,
      minDays: 1,
      rateUsd: 14,
      foreignRateUsd: 18,
      variants: [],
      terms: GEAR_TERMS,
      active: true,
      sortOrder: 5,
    },
    {
      id: 'car',
      label: { mm: 'ယာဉ်မောင်းပါကား', en: 'Car with Driver' },
      detail: { mm: 'မိသားစုနှင့် အဖွဲ့လိုက်ခရီးများအတွက် ယာဉ်မောင်းပါဝင်သည်', en: 'Comfortable full-day trips with a driver.' },
      image: '/images/blog/shwedagon-evening.webp',
      icon: 'car',
      listingId: 'pre1',
      flow: 'driver_vehicle',
      driverRequired: true,
      minDays: 2,
      rateUsd: 42,
      foreignRateUsd: 55,
      variants: [
        {
          id: 'family_car',
          label: { mm: 'အိမ်စီးကား (၄–၅ ယောက်စီး)', en: 'Family car (4–5 seats)' },
          seats: 5,
          rules: NO_RULES,
          active: true,
          sortOrder: 1,
          rateUsd: 42,
          foreignRateUsd: 55,
        },
        {
          id: 'minibus_35',
          label: { mm: '၃၅ ယောက်စီးကား', en: '35-seat minibus' },
          seats: 35,
          rules: NO_RULES,
          active: true,
          sortOrder: 2,
          rateUsd: 180,
          foreignRateUsd: 225,
        },
        {
          id: 'bus_45',
          label: { mm: '၄၅ ယောက်စီးကား', en: '45-seat bus' },
          seats: 45,
          rules: NO_RULES,
          active: true,
          sortOrder: 3,
          rateUsd: 240,
          foreignRateUsd: 295,
        },
      ],
      terms: CAR_TERMS,
      active: true,
      sortOrder: 6,
    },
    {
      // Plan §8.2: retired. The record stays so a past self-drive order still resolves.
      id: 'self_drive_car',
      label: { mm: 'ကိုယ်တိုင်မောင်းကား', en: 'Self-drive Car' },
      detail: { mm: 'လွတ်လပ်စွာ လမ်းကြောင်းရွေး၍ ကိုယ်တိုင်မောင်းနှင်ရန်', en: 'Choose your route and drive yourself.' },
      image: '/images/blog/ubein-evening.webp',
      icon: 'car',
      listingId: 'pre8',
      flow: 'simple',
      driverRequired: false,
      minDays: 2,
      rateUsd: 32,
      foreignRateUsd: 42,
      variants: [],
      terms: SELF_DRIVE_TERMS,
      active: false,
      sortOrder: 7,
    },
    {
      id: 'horse_carriage',
      label: { mm: 'မြင်းလှည်း', en: 'Horse carriage' },
      detail: { mm: 'ပုဂံဒေသကို ရိုးရာပုံစံဖြင့် လည်ပတ်ရန်', en: 'Explore Bagan in a traditional style.' },
      image: '/images/blog/bagan-sunrise.webp',
      icon: 'compass',
      listingId: 'pre9',
      flow: 'simple',
      driverRequired: true,
      minDays: 1,
      rateUsd: 28,
      foreignRateUsd: 34,
      variants: [],
      terms: GEAR_TERMS,
      active: true,
      sortOrder: 8,
    },
    {
      id: 'camping_tent',
      label: { mm: 'ရွက်ဖျင်တဲ', en: 'Camping Tent' },
      detail: { mm: 'သဘာဝအနီးတွင် တည်းခိုရန်', en: 'Stay close to nature.' },
      image: '/images/blog/inle-stilt-houses.webp',
      icon: 'tent',
      listingId: 'pre10',
      flow: 'simple',
      driverRequired: false,
      minDays: 1,
      rateUsd: 12,
      foreignRateUsd: 15,
      variants: [],
      terms: GEAR_TERMS,
      active: true,
      sortOrder: 9,
    },
    {
      // Plan §8.2: one Boat category; "Motorboat" is its seeded variant.
      id: 'boat',
      label: { mm: 'လှေ', en: 'Boat' },
      detail: { mm: 'အင်းလေးကန်နှင့် ရေလမ်းခရီးများအတွက်', en: 'For lake and river trips.' },
      image: '/images/blog/inle-stilt-houses.webp',
      icon: 'boat',
      listingId: 'pre5',
      flow: 'driver_vehicle',
      driverRequired: true,
      minDays: 1,
      rateUsd: 55,
      foreignRateUsd: 68,
      variants: [
        {
          id: 'motorboat',
          label: { mm: 'စက်လှေ', en: 'Motorboat' },
          seats: 6,
          rules: NO_RULES,
          active: true,
          sortOrder: 1,
          rateUsd: 55,
          foreignRateUsd: 68,
        },
      ],
      terms: GEAR_TERMS,
      active: true,
      sortOrder: 10,
    },
    {
      id: 'travel_guide',
      label: { mm: 'လမ်းညွှန်', en: 'Travel guide' },
      detail: { mm: 'ဒေသခံလမ်းညွှန်နှင့်အတူ စူးစမ်းလေ့လာရန်', en: 'Explore with a knowledgeable local guide.' },
      image: '/images/blog/bagan-sunrise.webp',
      icon: 'person',
      listingId: 'pre4',
      flow: 'simple',
      driverRequired: true,
      minDays: 1,
      rateUsd: 35,
      foreignRateUsd: 45,
      variants: [],
      terms: GUIDE_TERMS,
      active: true,
      sortOrder: 11,
    },
  ],
  cities: [
    {
      id: 'yangon',
      name: { mm: 'ရန်ကုန်', en: 'Yangon' },
      branches: [{
        id: 'yangon-downtown',
        name: { mm: 'ရန်ကုန် MH Travel ရုံးခွဲ — Downtown', en: 'Yangon MH Travel Branch — Downtown' },
        address: 'No. 168, Sule Pagoda Road, Kyauktada Township, Yangon',
        phone: '+95 9 770 000 101',
      }],
    },
    {
      id: 'bagan',
      name: { mm: 'ပုဂံ', en: 'Bagan' },
      branches: [{
        id: 'bagan-nyaung-u',
        name: { mm: 'ပုဂံ MH Travel ရုံးခွဲ — Nyaung-U', en: 'Bagan MH Travel Branch — Nyaung-U' },
        address: 'Thiripyitsaya Road, Nyaung-U, Bagan',
        phone: '+95 9 770 000 102',
      }],
    },
    {
      id: 'mandalay',
      name: { mm: 'မန္တလေး', en: 'Mandalay' },
      branches: [{
        id: 'mandalay-78',
        name: { mm: 'မန္တလေး MH Travel ရုံးခွဲ — 78th Street', en: 'Mandalay MH Travel Branch — 78th Street' },
        address: 'No. 22, 78th Street, Chanayethazan Township, Mandalay',
        phone: '+95 9 770 000 103',
      }],
    },
    {
      id: 'inle',
      name: { mm: 'အင်းလေး', en: 'Inle Lake' },
      branches: [{
        id: 'inle-nyaung-shwe',
        name: { mm: 'ညောင်ရွှေ MH Travel ရုံးခွဲ', en: 'Nyaung Shwe MH Travel Branch' },
        address: 'Mingala Road, Nyaung Shwe, Shan State',
        phone: '+95 9 770 000 104',
      }],
    },
    {
      id: 'ngapali',
      name: { mm: 'ငပလီ', en: 'Ngapali' },
      branches: [{
        id: 'ngapali-branch',
        name: { mm: 'ငပလီ MH Travel ရုံးခွဲ', en: 'Ngapali MH Travel Branch' },
        address: 'Main Road, Ngapali Beach, Thandwe, Rakhine State',
        phone: '+95 9 770 000 105',
      }],
    },
  ],
  availability: {
    // Plan §8.2: Yangon has no motorbike rental, and a scooter is a motorbike.
    yangon: { bicycle: true, ebike: true, tricycle: true, car: true, travel_guide: true },
    bagan: { bicycle: true, ebike: true, motorbike: true, scooter: true, car: true, horse_carriage: true, camping_tent: true, travel_guide: true },
    mandalay: { bicycle: true, ebike: true, motorbike: true, scooter: true, tricycle: true, car: true, travel_guide: true },
    inle: { bicycle: true, ebike: true, motorbike: true, boat: true, camping_tent: true, travel_guide: true },
    ngapali: { bicycle: true, ebike: true, motorbike: true, scooter: true, boat: true, camping_tent: true },
  },
  // Plan §8.8 Terms: the published versions, newest first. The current one is
  // also the catalog's `termsVersion`/`terms`, so the reader needs one field.
  termsHistory: [
    {
      version: '2026-11-22',
      body: {
        mm: 'ငှားရမ်းမှု တောင်းဆိုချက်ကို MH Travel မှ ရရှိနိုင်မှု စစ်ဆေးပြီး အတည်ပြုပါမည်။ ငှားရမ်းချိန်အတွင်း ထိခိုက်မှုအတွက် တာဝန်ယူရပါမည်။',
        en: 'MH Travel checks availability and confirms each request. You are responsible for the vehicle while it is with you.',
      },
      publishedAt: '2026-11-22T00:00:00.000Z',
    },
  ],
  // Plan §8.4: a category needs no rate row to be priced; rows are exceptions
  // for one city or one variant, so the seed starts empty and the panel adds them.
  rates: [],
  settings: { highlightAfterHours: 2, minNoticeDays: 1 },
};

/** Bookable types in catalog order; a retired record stays for history only. */
export function activeTypes(catalog: RentalCatalog): RentalType[] {
  return catalog.types.filter((type) => type.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function findRentalType(catalog: RentalCatalog, typeId: string | null): RentalType | undefined {
  if (!typeId) return undefined;
  return catalog.types.find((type) => type.id === typeId);
}

export function cityHasType(catalog: RentalCatalog, cityId: string, typeId: string): boolean {
  const type = findRentalType(catalog, typeId);
  if (!type?.active) return false;
  return catalog.availability[cityId]?.[typeId] === true;
}

/** Types the chosen city actually offers, in catalog order. */
export function availableTypes(catalog: RentalCatalog, cityId: string): RentalType[] {
  return activeTypes(catalog).filter((type) => cityHasType(catalog, cityId, type.id));
}

/** The first city that offers the type, used when the traveler picks a type the city lacks. */
export function firstCityForType(catalog: RentalCatalog, typeId: string): RentalCity | undefined {
  return catalog.cities.find((city) => cityHasType(catalog, city.id, typeId));
}

export function activeVariants(type: RentalType | undefined): RentalVariant[] {
  if (!type) return [];
  return type.variants.filter((variant) => variant.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function findVariant(type: RentalType | undefined, variantId: string | null): RentalVariant | undefined {
  if (!type || !variantId) return undefined;
  return type.variants.find((variant) => variant.id === variantId);
}

/**
 * Plan §8.3: a rate row is only in force between its own dates. A row with no
 * dates is the standing rate, so the seed and the tests need no dates.
 */
export function rateInForce(rate: RentalRate, on: string): boolean {
  if (rate.effectiveFrom && rate.effectiveFrom > on) return false;
  if (rate.effectiveTo && rate.effectiveTo < on) return false;
  return true;
}

/** The newest in-force row for one key, so a dated row beats a standing one. */
function newestRate(rows: RentalRate[], city: string | null, variant: string | null, on: string): RentalRate | undefined {
  return rows
    .filter((rate) => (rate.cityId ?? null) === city && (rate.variantId ?? null) === variant && rateInForce(rate, on))
    .sort((a, b) => (b.effectiveFrom ?? '').localeCompare(a.effectiveFrom ?? ''))[0];
}

/** Plan §8.4 step 1: city + category + variant, then each less specific row. */
export function findRate(
  catalog: RentalCatalog,
  cityId: string,
  categoryId: string,
  variantId: string | null,
  on = new Date().toISOString().slice(0, 10),
): RentalRate | undefined {
  const rows = catalog.rates.filter((rate) => rate.categoryId === categoryId);
  return newestRate(rows, cityId, variantId, on)
    ?? newestRate(rows, cityId, null, on)
    ?? newestRate(rows, null, variantId, on)
    ?? newestRate(rows, null, null, on);
}

/** Every row for one key, newest first: the history the Rates section lists. */
export function rateHistory(
  catalog: RentalCatalog,
  categoryId: string,
  variantId: string | null,
  cityId: string | null,
): RentalRate[] {
  return catalog.rates
    .filter(
      (rate) =>
        rate.categoryId === categoryId
        && (rate.variantId ?? null) === (variantId ?? null)
        && (rate.cityId ?? null) === (cityId ?? null),
    )
    .sort((a, b) => (b.effectiveFrom ?? '').localeCompare(a.effectiveFrom ?? ''));
}

export type RateQuery = {
  cityId: string;
  type: RentalType | undefined;
  variantId?: string | null;
  customerType: RentalCustomerType;
};

/** Plan §8.4 steps 1–2: the most specific row wins, then the customer column. */
export function typeRateUsd(catalog: RentalCatalog, query: RateQuery): number {
  const { type, customerType } = query;
  if (!type) return 0;
  const variantId = query.variantId ?? null;
  const variant = findVariant(type, variantId);
  const rate = findRate(catalog, query.cityId, type.id, variantId);
  const local = rate?.rateLocalUsd ?? variant?.rateUsd ?? type.rateUsd;
  const foreign = rate?.rateForeignUsd ?? variant?.foreignRateUsd ?? type.foreignRateUsd;
  return customerType === 'foreigner' ? foreign : local;
}

export function addDays(dateString: string, amount: number): string {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

/** Both endpoints count, so a same-day rental is one day. */
export function inclusiveDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T12:00:00`).getTime();
  const end = new Date(`${endDate}T12:00:00`).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

export function minimumEndDate(startDate: string, type: RentalType | undefined): string {
  return addDays(startDate, Math.max(0, (type?.minDays ?? 1) - 1));
}

export type RentalEstimateInput = {
  catalog: RentalCatalog;
  cityId: string;
  type: RentalType | undefined;
  customerType: RentalCustomerType;
  variantId?: string | null;
  startDate: string;
  endDate: string;
};

export type RentalEstimate = { days: number; rateUsd: number; totalUsd: number };

/** Plan §8.4 steps 3–4: rate × charged days, minimum days enforced, USD to 2 decimals. */
export function estimateRental(input: RentalEstimateInput): RentalEstimate {
  const { type } = input;
  if (!type) return { days: 0, rateUsd: 0, totalUsd: 0 };
  const days = Math.max(type.minDays, inclusiveDays(input.startDate, input.endDate));
  const rateUsd = typeRateUsd(input.catalog, {
    cityId: input.cityId,
    type,
    variantId: input.variantId,
    customerType: input.customerType,
  });
  return { days, rateUsd, totalUsd: Math.round(rateUsd * days * 100) / 100 };
}

function idHash(id: string): number {
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) hash = (hash * 31 + id.charCodeAt(index)) | 0;
  return Math.abs(hash);
}

/**
 * Plan §4 requires rating, distance, views and favourite on every card. A type
 * added from the Admin panel has no seed listing, so its metrics come from its
 * id and stay stable across renders.
 */
export function cardMetrics(type: RentalType): { rating: number; distanceKm: number; views: number } {
  const hash = idHash(type.id);
  return {
    rating: Math.round((4.3 + (hash % 7) / 10) * 10) / 10,
    distanceKm: Math.round((1 + (hash % 25) / 10) * 10) / 10,
    views: 300 + (hash % 1200),
  };
}

/** Problems the Admin panel shows before saving, so a broken catalog never reaches a traveler. */
export function rentalCatalogProblems(catalog: RentalCatalog): string[] {
  const problems: string[] = [];
  const bookable = activeTypes(catalog);
  if (bookable.length === 0) problems.push('no_types');
  if (catalog.cities.length === 0) problems.push('no_cities');
  const typeIds = catalog.types.map((type) => type.id);
  if (new Set(typeIds).size !== typeIds.length) problems.push('duplicate_type');

  for (const type of catalog.types) {
    if (!type.label.mm.trim() || !type.label.en.trim()) problems.push(`type_label:${type.id}`);
    if (!(type.rateUsd > 0)) problems.push(`type_rate:${type.id}`);
    if (!(type.foreignRateUsd > 0)) problems.push(`type_foreign_rate:${type.id}`);
    if (!Number.isInteger(type.minDays) || type.minDays < 1) problems.push(`type_min_days:${type.id}`);
    if (!type.active) continue;
    const variantIds = type.variants.map((variant) => variant.id);
    if (new Set(variantIds).size !== variantIds.length) problems.push(`variant_duplicate:${type.id}`);
    for (const variant of type.variants) {
      if (!variant.label.mm.trim() || !variant.label.en.trim()) problems.push(`variant_label:${type.id}:${variant.id}`);
      if (!(variant.rateUsd > 0) || !(variant.foreignRateUsd > 0)) problems.push(`variant_rate:${type.id}:${variant.id}`);
    }
    if (type.flow === 'driver_vehicle' && activeVariants(type).length === 0) problems.push(`type_no_variant:${type.id}`);
  }

  const cityIds = catalog.cities.map((city) => city.id);
  if (new Set(cityIds).size !== cityIds.length) problems.push('duplicate_city');
  for (const city of catalog.cities) {
    if (city.branches.length === 0) problems.push(`city_no_branch:${city.id}`);
    const branchIds = city.branches.map((branch) => branch.id);
    if (new Set(branchIds).size !== branchIds.length) problems.push(`branch_duplicate:${city.id}`);
    if (!city.branches.every((branch) => branch.name.mm.trim() && branch.name.en.trim())) problems.push(`branch_label:${city.id}`);
    if (!city.branches.every((branch) => branch.address.trim().length >= 3)) problems.push(`branch_address:${city.id}`);
    if (!city.branches.every((branch) => branch.phone.trim().length >= 7)) problems.push(`branch_phone:${city.id}`);
    const offered = Object.entries(catalog.availability[city.id] ?? {}).filter(([, on]) => on).map(([typeId]) => typeId);
    if (offered.length === 0) problems.push(`city_no_types:${city.id}`);
    if (offered.some((typeId) => !bookable.some((type) => type.id === typeId))) problems.push(`city_unknown_type:${city.id}`);
  }

  const rateIds = catalog.rates.map((rate) => rate.id);
  if (new Set(rateIds).size !== rateIds.length) problems.push('duplicate_rate');
  for (const rate of catalog.rates) {
    if (!(rate.rateLocalUsd > 0) || !(rate.rateForeignUsd > 0)) problems.push(`rate_value:${rate.id}`);
    if (!typeIds.includes(rate.categoryId)) problems.push(`rate_category:${rate.id}`);
    if (rate.cityId && !cityIds.includes(rate.cityId)) problems.push(`rate_city:${rate.id}`);
    const type = catalog.types.find((item) => item.id === rate.categoryId);
    if (rate.variantId && !type?.variants.some((variant) => variant.id === rate.variantId)) problems.push(`rate_variant:${rate.id}`);
    if (rate.effectiveFrom && rate.effectiveTo && rate.effectiveTo < rate.effectiveFrom) problems.push(`rate_range:${rate.id}`);
  }

  if (!catalog.termsVersion.trim()) problems.push('terms_version');
  if (!catalog.terms.mm.trim() || !catalog.terms.en.trim()) problems.push('terms');
  if (!(catalog.settings.highlightAfterHours >= 1)) problems.push('settings_highlight');
  if (!(catalog.settings.minNoticeDays >= 0)) problems.push('settings_notice');
  return problems;
}
