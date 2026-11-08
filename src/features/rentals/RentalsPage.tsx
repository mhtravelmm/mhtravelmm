import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Bike,
  Car,
  Check,
  ChevronRight,
  Compass,
  Heart,
  Headphones,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  ShipWheel,
  Star,
  TentTree,
  UserRound,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useCurrency } from '../../lib/currency';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';
import { RENTAL_PAGE_LISTINGS } from '../../data/cityPageData';
import type { RentalCategory } from '../../types';

type CustomerType = 'citizen' | 'foreigner';
type Fulfillment = 'delivery' | 'branch';
type CarTypeId = 'family_car' | 'minibus_35' | 'bus_45';
type CategoryInfo = {
  icon: LucideIcon;
  image: string;
  title: TranslationKey;
  detail: TranslationKey;
  rate: number;
  foreignRate: number;
};

type City = {
  id: string;
  name: { mm: string; en: string };
  branches: { mm: string; en: string }[];
  categories: RentalCategory[];
};

const cities: City[] = [
  { id: 'yangon', name: { mm: 'ရန်ကုန်', en: 'Yangon' }, branches: [{ mm: 'ရန်ကုန် MH Travel ရုံးခွဲ — Downtown', en: 'Yangon MH Travel Branch — Downtown' }], categories: ['bicycle', 'ebike', 'motorbike', 'scooter', 'car', 'self_drive_car', 'travel_guide'] },
  { id: 'bagan', name: { mm: 'ပုဂံ', en: 'Bagan' }, branches: [{ mm: 'ပုဂံ MH Travel ရုံးခွဲ — Nyaung-U', en: 'Bagan MH Travel Branch — Nyaung-U' }], categories: ['bicycle', 'ebike', 'motorbike', 'scooter', 'car', 'self_drive_car', 'horse_carriage', 'camping_tent', 'travel_guide'] },
  { id: 'mandalay', name: { mm: 'မန္တလေး', en: 'Mandalay' }, branches: [{ mm: 'မန္တလေး MH Travel ရုံးခွဲ — 78th Street', en: 'Mandalay MH Travel Branch — 78th Street' }], categories: ['bicycle', 'ebike', 'motorbike', 'scooter', 'car', 'self_drive_car', 'travel_guide'] },
  { id: 'inle', name: { mm: 'အင်းလေး', en: 'Inle Lake' }, branches: [{ mm: 'ညောင်ရွှေ MH Travel ရုံးခွဲ', en: 'Nyaung Shwe MH Travel Branch' }], categories: ['bicycle', 'ebike', 'motorbike', 'motorboat', 'camping_tent', 'travel_guide'] },
  { id: 'ngapali', name: { mm: 'ငပလီ', en: 'Ngapali' }, branches: [{ mm: 'ငပလီ MH Travel ရုံးခွဲ', en: 'Ngapali MH Travel Branch' }], categories: ['bicycle', 'ebike', 'motorbike', 'scooter', 'motorboat', 'camping_tent'] },
];

const categoryInfo: Record<RentalCategory, CategoryInfo> = {
  bicycle: { icon: Bike, image: '/images/blog/ubein-evening.webp', title: 'rentals_city_bicycle', detail: 'rentals_detail_bicycle', rate: 8, foreignRate: 10 },
  ebike: { icon: Zap, image: '/images/blog/shwedagon-evening.webp', title: 'rental_cat_ebike', detail: 'rentals_detail_ebike', rate: 12, foreignRate: 15 },
  motorbike: { icon: Bike, image: '/images/blog/bagan-sunrise.webp', title: 'rental_cat_motorbike', detail: 'rentals_detail_motorbike', rate: 18, foreignRate: 22 },
  scooter: { icon: Bike, image: '/images/blog/inle-stilt-houses.webp', title: 'rental_cat_scooter', detail: 'rentals_detail_scooter', rate: 10, foreignRate: 13 },
  car: { icon: Car, image: '/images/blog/shwedagon-evening.webp', title: 'rental_cat_car_driver', detail: 'rentals_detail_car_driver', rate: 42, foreignRate: 55 },
  self_drive_car: { icon: Car, image: '/images/blog/ubein-evening.webp', title: 'rental_cat_self_drive_car', detail: 'rentals_detail_self_drive_car', rate: 32, foreignRate: 42 },
  horse_carriage: { icon: Compass, image: '/images/blog/bagan-sunrise.webp', title: 'rental_cat_horse_carriage', detail: 'rentals_detail_horse_carriage', rate: 28, foreignRate: 34 },
  camping_tent: { icon: TentTree, image: '/images/blog/inle-stilt-houses.webp', title: 'rental_cat_camping_tent', detail: 'rentals_detail_camping_tent', rate: 12, foreignRate: 15 },
  motorboat: { icon: ShipWheel, image: '/images/blog/inle-stilt-houses.webp', title: 'rental_cat_motorboat', detail: 'rentals_detail_motorboat', rate: 55, foreignRate: 68 },
  travel_guide: { icon: UserRound, image: '/images/blog/bagan-sunrise.webp', title: 'rental_cat_travel_guide', detail: 'rentals_detail_travel_guide', rate: 35, foreignRate: 45 },
};

const primaryCategories: RentalCategory[] = ['bicycle', 'ebike', 'motorbike', 'scooter', 'car', 'self_drive_car'];
const additionalCategories: RentalCategory[] = ['horse_carriage', 'camping_tent', 'motorboat', 'travel_guide'];
const categorySelectorOrder: RentalCategory[] = ['bicycle', 'motorbike', 'car', 'camping_tent', 'motorboat', 'horse_carriage', 'ebike', 'scooter', 'self_drive_car', 'travel_guide'];
const allRentalCategories: RentalCategory[] = [...primaryCategories, ...additionalCategories];
const favoriteIdByCategory: Record<RentalCategory, string> = {
  bicycle: 'pre3',
  ebike: 'pre6',
  motorbike: 'pre2',
  scooter: 'pre7',
  car: 'pre1',
  self_drive_car: 'pre8',
  horse_carriage: 'pre9',
  camping_tent: 'pre10',
  motorboat: 'pre5',
  travel_guide: 'pre4',
};

const carTypes: Record<CarTypeId, { label: { mm: string; en: string }; rate: number; foreignRate: number }> = {
  family_car: { label: { mm: 'အိမ်စီးကား (၄–၅ ယောက်စီး)', en: 'Family car (4–5 seats)' }, rate: 42, foreignRate: 55 },
  minibus_35: { label: { mm: '၃၅ ယောက်စီးကား', en: '35-seat minibus' }, rate: 180, foreignRate: 225 },
  bus_45: { label: { mm: '၄၅ ယောက်စီးကား', en: '45-seat bus' }, rate: 240, foreignRate: 295 },
};

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function addDays(dateString: string, amount: number) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return date.toISOString().slice(0, 10);
}

function inclusiveDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00`).getTime();
  const end = new Date(`${endDate}T12:00:00`).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

export function RentalsPage() {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const favorites = useToggleFavorite(RENTAL_PAGE_LISTINGS);
  const favoriteListings = new Map(favorites.listings.map((listing) => [listing.id, listing]));
  const [cityId, setCityId] = useState('yangon');
  const [category, setCategory] = useState<RentalCategory | null>(null);
  const [activeFilter, setActiveFilter] = useState<RentalCategory | null>(null);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const [date, setDate] = useState(tomorrow());
  const [endDate, setEndDate] = useState(tomorrow());
  const [participants, setParticipants] = useState(1);
  const [customerType, setCustomerType] = useState<CustomerType>('citizen');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');
  const [address, setAddress] = useState('');
  const [branch, setBranch] = useState('');
  const [phone, setPhone] = useState('');
  const [carTypeId, setCarTypeId] = useState<CarTypeId>('family_car');
  const [submitted, setSubmitted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const city = cities.find((item) => item.id === cityId) ?? cities[0];
  const selected = category ? categoryInfo[category] : null;
  const carType = carTypes[carTypeId];
  const isCarRental = category === 'car' || category === 'self_drive_car';
  const minimumEndDate = addDays(date, isCarRental ? 1 : 0);
  const validEndDate = endDate < minimumEndDate ? minimumEndDate : endDate;
  const rentalDays = inclusiveDays(date, validEndDate);
  const rate = selected
    ? category === 'car'
      ? customerType === 'foreigner' ? carType.foreignRate : carType.rate
      : customerType === 'foreigner' ? selected.foreignRate : selected.rate
    : 0;
  const total = rate * rentalDays;
  const locationReady = fulfillment === 'branch' ? Boolean(branch) : address.trim().length >= 3;
  const canSubmit = Boolean(category && phone.trim().length >= 7 && locationReady && termsAccepted);
  const availableCategories = useMemo(() => city.categories.map((item) => ({ id: item, ...categoryInfo[item] })), [city]);
  const visibleCategoryIds = showAll || query.trim() || activeFilter
    ? allRentalCategories
    : primaryCategories;
  const visibleRentals = visibleCategoryIds.filter((id) => {
    if (activeFilter && activeFilter !== id) return false;
    if (!query.trim()) return true;
    const listing = favoriteListings.get(favoriteIdByCategory[id]);
    const searchable = `${t(categoryInfo[id].title)} ${t(categoryInfo[id].detail)} ${listing?.title ?? ''}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase());
  });

  function changeCity(value: string) {
    setCityId(value);
    const nextCity = cities.find((item) => item.id === value) ?? cities[0];
    if (category && !nextCity.categories.includes(category)) setCategory(null);
    setBranch('');
    setSubmitted(false);
  }

  function beginRental(nextCategory: RentalCategory) {
    const currentCityHasType = city.categories.includes(nextCategory);
    if (!currentCityHasType) {
      const firstAvailableCity = cities.find((item) => item.categories.includes(nextCategory));
      if (firstAvailableCity) setCityId(firstAvailableCity.id);
    }
    setCategory(nextCategory);
    setSubmitted(false);
    setTermsAccepted(false);
    setBookingOpen(true);
    window.setTimeout(() => document.getElementById('rentals-order')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 pb-10 pt-2 sm:space-y-5 sm:pt-5">
      <section className="relative isolate min-h-[190px] overflow-hidden rounded-2xl bg-slate-950 sm:min-h-[230px] md:min-h-[270px]">
        <img src="/images/blog/shwedagon-evening.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[68%_55%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06162c]/95 via-[#071a31]/75 to-[#071a31]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06162c]/55 via-transparent to-[#06162c]/10" />
        <div className="absolute bottom-4 right-[8%] hidden rounded-[2rem] border border-white/15 bg-slate-950/20 p-4 text-white/90 drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)] backdrop-blur-[1px] md:block">
          <Car size={116} strokeWidth={1.25} />
        </div>
        <div className="absolute bottom-5 right-5 text-white/85 drop-shadow-lg md:hidden"><Car size={52} strokeWidth={1.4} /></div>
        <div className="relative z-10 flex min-h-[190px] items-center px-4 py-5 sm:min-h-[230px] sm:px-7 md:min-h-[270px] md:px-10">
          <div className="max-w-xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-slate-950/45 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-100 backdrop-blur sm:text-[10px]">
              <Bike size={13} /> MH Travel Rentals
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">{t('rentals_hero_title')}</h1>
            <p className="mt-1.5 text-xs font-semibold text-white sm:text-sm md:text-base">{t('rentals_hero_subtitle')}</p>
            <p className="mt-1 max-w-md text-[10px] text-slate-200 sm:text-xs">{t('rentals_hero_detail')}</p>
            <a href="#rental-catalog" className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-3.5 py-2 text-[10px] font-bold text-slate-950 shadow-lg shadow-cyan-950/35 transition hover:-translate-y-0.5 hover:bg-cyan-300 sm:mt-4 sm:px-4 sm:py-2.5 sm:text-xs">
              {t('rentals_browse')} <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-bg-card p-2.5 shadow-sm sm:p-3">
        <p className="mb-2 px-1 text-[10px] font-semibold text-text-secondary">{t('rentals_choose_type')}</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {categorySelectorOrder.map((id) => {
            const Icon = categoryInfo[id].icon;
            const isActive = activeFilter === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveFilter((current) => current === id ? null : id)}
                className={`flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center transition sm:min-h-[66px] ${isActive ? 'border-brand-blue bg-brand-blue text-white shadow-sm' : 'border-transparent bg-bg-cardAlt text-text-secondary hover:border-brand-blue/35 hover:text-brand-blue'}`}
              >
                <Icon size={18} />
                <span className="text-[9px] font-medium leading-3 sm:text-[10px]">{t(categoryInfo[id].title)}</span>
              </button>
            );
          })}
        </div>
        <label className="mt-2.5 flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2.5 focus-within:border-brand-blue/60">
          <Search size={16} className="shrink-0 text-brand-blue" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('rentals_search')} className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-faint" />
          {query && <button type="button" aria-label={t('rentals_clear_search')} onClick={() => setQuery('')} className="rounded-full p-1 text-text-faint hover:bg-bg-cardAlt hover:text-text-primary"><X size={14} /></button>}
        </label>
      </section>

      <section id="rental-catalog" className="scroll-mt-20">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-blue">{t('rentals_featured_eyebrow')}</p>
            <h2 className="mt-0.5 text-base font-semibold text-text-primary sm:text-lg">{t('rentals_popular_title')}</h2>
          </div>
          <button type="button" onClick={() => { setShowAll((current) => !current); setActiveFilter(null); }} className="shrink-0 text-[10px] font-semibold text-brand-blue hover:text-brand-blue/80 sm:text-xs">
            {showAll ? t('rentals_show_less') : t('rentals_view_all')} <ChevronRight size={13} className="inline" />
          </button>
        </div>
        {visibleRentals.length > 0 ? (
          <div className="grid gap-2 sm:gap-2.5 lg:grid-cols-6">
            {visibleRentals.map((id) => {
              const info = categoryInfo[id];
              const Icon = info.icon;
              const favoriteId = favoriteIdByCategory[id];
              const listing = favoriteListings.get(favoriteId);
              if (!listing) return null;
              return (
                <article key={id} className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-bg-card p-2 transition hover:border-brand-blue/35 hover:shadow-md lg:block lg:overflow-hidden lg:p-0">
                  <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-lg bg-bg-cardAlt sm:h-[84px] sm:w-[84px] lg:h-[102px] lg:w-full lg:rounded-none">
                    <img src={info.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/5 to-slate-950/15" />
                    <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-slate-950/75 px-1.5 py-1 text-[9px] font-bold text-amber-300 backdrop-blur"><Star size={9} fill="currentColor" />{listing.rating.toFixed(1)}</span>
                    <span className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-400 text-slate-950"><Icon size={13} /></span>
                    <button type="button" aria-label={listing.isFavorited ? t('rentals_remove_favorite') : t('rentals_add_favorite')} onClick={() => favorites.toggle(favoriteId)} className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur transition ${listing.isFavorited ? 'bg-brand-red text-white' : 'bg-slate-950/65 text-white hover:bg-brand-red'}`}>
                      <Heart size={14} fill={listing.isFavorited ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2 lg:block lg:p-2.5">
                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-semibold text-text-primary lg:text-[11px]">{t(info.title)}</h3>
                      <p className="hidden truncate text-[9px] text-text-faint lg:mt-0.5 lg:block">{t(info.detail)}</p>
                      <p className="mt-1 text-[10px] font-semibold text-brand-red">{formatPrice(info.rate)} <span className="font-normal text-text-faint">/ {t('rentals_day')}</span></p>
                    </div>
                    <button type="button" onClick={() => beginRental(id)} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-blue px-2.5 py-2 text-[9px] font-semibold text-white transition hover:bg-brand-blue/85 sm:px-3 lg:mt-2 lg:w-full lg:justify-center lg:py-2">{t('rentals_rent_now')} <ArrowRight size={11} /></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-bg-card p-7 text-center text-xs text-text-muted">{t('rentals_no_results')}</div>
        )}
      </section>

      {bookingOpen && (
        <section id="rentals-order" className="scroll-mt-20 rounded-2xl border border-border bg-bg-card p-3 shadow-sm sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3 border-b border-border pb-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-brand-blue">{t('rentals_order_title')}</p>
              <h2 className="mt-1 text-base font-semibold text-text-primary">{selected ? t(selected.title) : t('rentals_select_first')}</h2>
              <p className="mt-1 text-[10px] text-text-muted">{city.name[language]} · {availableCategories.length} {t('rentals_available_types')}</p>
            </div>
            <button type="button" aria-label={t('rentals_close_order')} onClick={() => setBookingOpen(false)} className="rounded-lg border border-border p-2 text-text-muted hover:bg-bg-cardAlt hover:text-text-primary"><X size={15} /></button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="space-y-4">
              <section>
                <p className="mb-2 text-[10px] font-semibold text-text-secondary">{t('rentals_choose_type')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableCategories.map((item) => {
                    const Icon = item.icon;
                    return <button key={item.id} type="button" onClick={() => { setCategory(item.id); setSubmitted(false); }} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[9px] transition ${category === item.id ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' : 'border-border text-text-secondary hover:border-brand-blue/40'}`}><Icon size={13} />{t(item.title)}</button>;
                  })}
                </div>
              </section>

              <div className="grid gap-2.5 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[10px] text-text-faint">{t('rentals_choose_city')}</span>
                  <span className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2.5"><MapPin size={14} className="text-brand-blue" /><select value={cityId} onChange={(event) => changeCity(event.target.value)} className="w-full bg-transparent text-xs text-text-primary outline-none">{cities.map((item) => <option key={item.id} value={item.id}>{item.name[language]}</option>)}</select></span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] text-text-faint">{t('rentals_start_date')}</span>
                  <input type="date" min={tomorrow()} value={date} onChange={(event) => { const nextDate = event.target.value; setDate(nextDate); if (validEndDate < addDays(nextDate, isCarRental ? 1 : 0)) setEndDate(addDays(nextDate, isCarRental ? 1 : 0)); }} className="w-full rounded-lg border border-border bg-bg px-2.5 py-2.5 text-[11px] text-text-primary outline-none" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] text-text-faint">{t('rentals_end_date')}</span>
                  <input type="date" min={minimumEndDate} value={validEndDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-lg border border-border bg-bg px-2.5 py-2.5 text-[11px] text-text-primary outline-none" />
                </label>
              </div>
              <p className="flex items-center gap-1.5 text-[9px] text-brand-blue"><Check size={12} />{isCarRental ? t('rentals_car_minimum_days') : t('rentals_advance_note')}</p>

              {selected && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="rounded-lg bg-bg-cardAlt p-2.5"><span className="block text-[9px] text-text-faint">{t('rentals_participants')}</span><input type="number" min={1} max={45} value={participants} onChange={(event) => setParticipants(Math.max(1, Number(event.target.value)))} className="mt-1 w-full bg-transparent text-sm text-text-primary outline-none" /></label>
                    <label className="rounded-lg bg-bg-cardAlt p-2.5"><span className="block text-[9px] text-text-faint">{t('rentals_nationality')}</span><select value={customerType} onChange={(event) => setCustomerType(event.target.value as CustomerType)} className="mt-1 w-full bg-transparent text-[11px] text-text-primary outline-none"><option value="citizen">{t('rentals_citizen')}</option><option value="foreigner">{t('rentals_foreigner')}</option></select></label>
                  </div>
                  {category === 'car' && (
                    <>
                      <label className="block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_car_type')}</span><select value={carTypeId} onChange={(event) => setCarTypeId(event.target.value as CarTypeId)} className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[11px] text-text-primary outline-none">{Object.entries(carTypes).map(([id, item]) => <option key={id} value={id}>{item.label[language]}</option>)}</select></label>
                      <p className="rounded-lg bg-status-warningBg px-3 py-2 text-[10px] leading-4 text-status-warning">{t('rentals_car_note')}</p>
                    </>
                  )}
                  {category === 'self_drive_car' && <p className="rounded-lg bg-status-warningBg px-3 py-2 text-[10px] leading-4 text-status-warning">{t('rentals_self_drive_note')}</p>}

                  <div>
                    <span className="mb-1.5 block text-[10px] text-text-faint">{t('rentals_receive_method')}</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button type="button" onClick={() => setFulfillment('delivery')} className={`rounded-lg border px-2 py-2.5 text-[10px] ${fulfillment === 'delivery' ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' : 'border-border text-text-muted'}`}>{t('rentals_delivery')}</button>
                      <button type="button" onClick={() => setFulfillment('branch')} className={`rounded-lg border px-2 py-2.5 text-[10px] ${fulfillment === 'branch' ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' : 'border-border text-text-muted'}`}>{t('rentals_branch_pickup')}</button>
                    </div>
                  </div>
                  {fulfillment === 'delivery' ? (
                    <label className="block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_delivery_address')}</span><textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={2} placeholder={t('rentals_delivery_placeholder')} className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-[11px] text-text-primary outline-none placeholder:text-text-faint" /></label>
                  ) : (
                    <label className="block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_choose_branch')}</span><select value={branch} onChange={(event) => setBranch(event.target.value)} className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[11px] text-text-primary outline-none"><option value="">{t('rentals_choose_branch_placeholder')}</option>{city.branches.map((item) => <option key={item.en} value={item.en}>{item[language]}</option>)}</select></label>
                  )}
                  <label className="block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_phone')}</span><span className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2.5"><Phone size={14} className="text-brand-blue" /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t('rentals_phone_placeholder')} className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-faint" /></span></label>
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-bg-cardAlt px-3 py-2.5 text-[10px] leading-4 text-text-secondary">
                    <input type="checkbox" checked={termsAccepted} onChange={(event) => { setTermsAccepted(event.target.checked); setSubmitted(false); }} className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-brand-blue" />
                    <span>{t('rentals_accept_terms')}</span>
                  </label>
                  <button type="button" onClick={() => canSubmit && setSubmitted(true)} disabled={!canSubmit} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-3 py-3 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{t('rentals_submit_order')} <ChevronRight size={14} /></button>
                  <p className="text-center text-[9px] leading-4 text-text-faint">{t('rentals_contact_note')}</p>
                  {submitted && <div role="status" className="flex items-start gap-2 rounded-lg border border-status-success/30 bg-status-success/10 px-3 py-2 text-[10px] leading-4 text-status-success"><Check size={14} className="mt-0.5 shrink-0" />{t('rentals_submitted')}</div>}
                </>
              )}
            </div>

            <aside className="h-fit rounded-xl border border-border bg-bg-cardAlt p-4 xl:sticky xl:top-24">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-brand-blue">{t('rentals_estimate')}</p>
              {selected ? (
                <>
                  <h3 className="mt-1 text-base font-semibold text-text-primary">{t(selected.title)}</h3>
                  <p className="mt-1 text-[10px] leading-4 text-text-muted">{t(selected.detail)}</p>
                  <div className="my-3 space-y-2 border-y border-border py-3 text-[10px] text-text-muted">
                    <div className="flex justify-between gap-2"><span>{t('rentals_city_label')}</span><span className="font-medium text-text-primary">{city.name[language]}</span></div>
                    <div className="flex justify-between gap-2"><span>{t('rentals_start_date')}</span><span className="text-text-primary">{date}</span></div>
                    <div className="flex justify-between gap-2"><span>{t('rentals_end_date')}</span><span className="text-text-primary">{validEndDate}</span></div>
                    <div className="flex justify-between gap-2"><span>{t('rentals_days')}</span><span className="text-text-primary">{rentalDays} {t('rentals_day_count')}</span></div>
                    <div className="flex justify-between gap-2"><span>{t('rentals_rate')}</span><span className="text-text-primary">{formatPrice(rate)} / {t('rentals_day')}</span></div>
                  </div>
                  <div className="flex items-end justify-between gap-2"><span className="text-[10px] text-text-muted">{t('rentals_estimate')}</span><strong className="text-xl text-brand-red">{formatPrice(total)}</strong></div>
                </>
              ) : (
                <p className="mt-2 text-[10px] leading-4 text-text-muted">{t('rentals_select_first_detail')}</p>
              )}
              <p className="mt-4 rounded-lg border border-brand-blue/20 bg-brand-blue/10 p-2.5 text-[9px] leading-4 text-text-secondary">{t('rentals_manual_note')}</p>
            </aside>
          </div>
        </section>
      )}

      <section className="relative isolate overflow-hidden rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-[#062b43] via-[#0b4260] to-[#124d65] p-4 text-white sm:p-5">
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/15 text-cyan-200"><ShieldCheck size={23} /></div>
            <div>
              <h2 className="text-sm font-semibold sm:text-base">{t('rentals_safe_title')}</h2>
              <p className="mt-1 text-[10px] text-cyan-50/75 sm:text-xs">{t('rentals_safe_detail')}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-medium text-cyan-50/90 sm:text-[10px]">
                <span className="inline-flex items-center gap-1.5"><Wrench size={13} className="text-cyan-200" />{t('rentals_well_maintained')}</span>
                <span className="inline-flex items-center gap-1.5"><Check size={13} className="text-cyan-200" />{t('rentals_affordable')}</span>
                <span className="inline-flex items-center gap-1.5"><Headphones size={13} className="text-cyan-200" />{t('rentals_support')}</span>
              </div>
            </div>
          </div>
          <button type="button" aria-expanded={showPolicies} onClick={() => setShowPolicies((current) => !current)} className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-cyan-100/30 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-white/10 sm:self-center">{showPolicies ? t('rentals_show_less') : t('rentals_learn_more')} <ArrowRight size={13} /></button>
        </div>
      </section>

      {showPolicies && (
        <section className="grid gap-2 sm:grid-cols-3">
          {[
            { icon: Check, title: 'rentals_rule_daily', detail: 'rentals_rule_daily_detail' },
            { icon: MapPin, title: 'rentals_rule_distance', detail: 'rentals_rule_distance_detail' },
            { icon: UserRound, title: 'rentals_rule_driver', detail: 'rentals_rule_driver_detail' },
          ].map(({ icon: Icon, title, detail }) => (
            <article key={title} className="rounded-xl border border-border bg-bg-card p-3">
              <Icon size={16} className="text-brand-blue" />
              <h3 className="mt-2 text-[10px] font-semibold text-text-primary">{t(title as TranslationKey)}</h3>
              <p className="mt-1 text-[9px] leading-4 text-text-muted">{t(detail as TranslationKey)}</p>
            </article>
          ))}
        </section>
      )}

      {showAll && <p className="text-center text-[9px] text-text-faint">{t('rentals_city_availability_note')}</p>}
    </div>
  );
}
