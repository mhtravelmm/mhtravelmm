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
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useCurrency } from '../../lib/currency';
import { useLanguage } from '../../lib/i18n';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';
import { useRentalOrders, type RentalFulfillment } from '../../lib/rentalOrders';
import { useRentalCatalog } from '../../lib/rentalCatalogStore';
import { RENTAL_PAGE_LISTINGS } from '../../data/cityPageData';
import {
  activeTypes,
  activeVariants,
  cardMetrics,
  cityHasType,
  estimateRental,
  availableTypes,
  findRentalType,
  firstCityForType,
  localized,
  minimumEndDate,
  type RentalCustomerType,
  type RentalIconName,
  type RentalType,
} from '../../data/rentalCatalog';
import type { CardListing } from '../../types';

type CustomerType = RentalCustomerType;
type Fulfillment = RentalFulfillment;

const ICONS: Record<RentalIconName, LucideIcon> = {
  bike: Bike,
  bolt: Zap,
  car: Car,
  compass: Compass,
  tent: TentTree,
  boat: ShipWheel,
  person: UserRound,
  tricycle: ShipWheel,
};

/** Plan §8: the catalog carries `sortOrder`, so the selector just reads it. */
const PRIMARY_TYPES = ['bicycle', 'ebike', 'motorbike', 'scooter', 'tricycle', 'car'];

function addDaysFromToday(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + Math.max(1, days));
  return date.toISOString().slice(0, 10);
}

export function RentalsPage() {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { createOrder } = useRentalOrders();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currency, exchangeRate } = useCurrency();
  const { catalog } = useRentalCatalog();
  const favorites = useToggleFavorite(RENTAL_PAGE_LISTINGS);
  const favoriteListings = new Map(favorites.listings.map((listing) => [listing.id, listing]));
  const [cityId, setCityId] = useState(catalog.cities[0]?.id ?? 'yangon');
  const [typeId, setTypeId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [showPolicies, setShowPolicies] = useState(false);
  const earliestStart = addDaysFromToday(catalog.settings.minNoticeDays);
  const [date, setDate] = useState(earliestStart);
  const [endDate, setEndDate] = useState(earliestStart);
  const [participants, setParticipants] = useState(1);
  const [customerType, setCustomerType] = useState<CustomerType>('citizen');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');
  const [address, setAddress] = useState('');
  const [branch, setBranch] = useState('');
  const [phone, setPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [variantId, setVariantId] = useState<string | null>(null);
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const city = catalog.cities.find((item) => item.id === cityId) ?? catalog.cities[0];
  const selected = findRentalType(catalog, typeId);
  const variants = activeVariants(selected);
  const chosenVariant = variants.find((variant) => variant.id === variantId) ?? variants[0];
  const earliestEnd = minimumEndDate(date, selected);
  const validEndDate = endDate < earliestEnd ? earliestEnd : endDate;
  const estimate = estimateRental({
    catalog,
    cityId: city.id,
    type: selected,
    customerType,
    variantId: chosenVariant?.id ?? null,
    startDate: date,
    endDate: validEndDate,
  });
  const locationReady = fulfillment === 'branch' ? Boolean(branch) : address.trim().length >= 3;
  const nameReady = customerName.trim().length >= 2;
  const canSubmit = Boolean(selected && nameReady && phone.trim().length >= 7 && locationReady && termsAccepted);
  const cityTypes = useMemo(() => availableTypes(catalog, city.id), [catalog, city.id]);
  const driverTypes = useMemo(() => activeTypes(catalog).filter((type) => type.driverRequired), [catalog]);
  // Plan §8.2: the page only offers what the chosen city actually has, so
  // Yangon never shows a motorbike or a scooter.
  const orderedTypes = useMemo(() => availableTypes(catalog, city.id), [catalog, city.id]);
  const visibleTypes = showAll || query.trim() || activeFilter
    ? orderedTypes
    : orderedTypes.filter((type) => PRIMARY_TYPES.includes(type.id) || orderedTypes.length <= 6);
  const visibleRentals = visibleTypes.filter((type) => {
    if (activeFilter && activeFilter !== type.id) return false;
    if (!query.trim()) return true;
    const listing = type.listingId ? favoriteListings.get(type.listingId) : undefined;
    const searchable = `${localized(type.label, language)} ${localized(type.detail, language)} ${listing?.title ?? ''}`.toLowerCase();
    return searchable.includes(query.trim().toLowerCase());
  });

  function changeCity(value: string) {
    setCityId(value);
    if (typeId && !cityHasType(catalog, value, typeId)) setTypeId(null);
    setBranch('');
    setSubmittedCode(null);
  }

  function changeType(nextTypeId: string) {
    setTypeId(nextTypeId);
    setVariantId(null);
    setSubmittedCode(null);
  }

  function beginRental(nextTypeId: string) {
    // Plan §8.2 decision 11: a traveler must sign in, so the order lands in My Bookings.
    if (!user) {
      navigate(`/login?next=${encodeURIComponent('/rentals')}`);
      return;
    }
    if (!cityHasType(catalog, city.id, nextTypeId)) {
      const nextCity = firstCityForType(catalog, nextTypeId);
      if (nextCity) setCityId(nextCity.id);
    }
    setTypeId(nextTypeId);
    setVariantId(null);
    setSubmittedCode(null);
    setTermsAccepted(false);
    setBookingOpen(true);
    window.setTimeout(() => document.getElementById('rentals-order')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  }

  function submitOrder() {
    if (!canSubmit || !selected || !user) return;
    // The client total is a preview; the server recomputes it (Plan §8.7).
    const order = createOrder({
      userId: user.id,
      customerName: customerName.trim(),
      phone: phone.trim(),
      cityId: city.id,
      categoryId: selected.id,
      variantId: chosenVariant?.id ?? null,
      startDate: date,
      endDate: validEndDate,
      originalStartDate: date,
      days: estimate.days,
      participants,
      customerType,
      fulfillment,
      branchId: fulfillment === 'branch' ? branch : null,
      deliveryAddress: fulfillment === 'delivery' ? address.trim() : '',
      specialRequests: specialRequests.trim(),
      termsVersion: catalog.termsVersion,
      rateUsd: estimate.rateUsd,
      totalUsd: estimate.totalUsd,
      displayCurrency: currency,
      fxMmkPerUsd: exchangeRate,
    });
    setSubmittedCode(order.requestCode);
  }

  /** A type with no seed listing still needs the four card fields (Plan §4). */
  function cardListing(type: RentalType): CardListing {
    const seeded = type.listingId ? favoriteListings.get(type.listingId) : undefined;
    if (seeded) return seeded;
    const metrics = cardMetrics(type);
    return {
      id: type.id,
      title: localized(type.label, language),
      imageUrl: type.image,
      rating: metrics.rating,
      distanceKm: metrics.distanceKm,
      isFavorited: false,
      views: metrics.views,
      href: '/rentals',
    };
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 pb-10 pt-2 sm:space-y-5 sm:pt-5">
      <section className="mh-page-hero relative isolate overflow-hidden rounded-2xl bg-slate-950">
        <img src="/images/blog/shwedagon-evening.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[68%_55%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06162c]/95 via-[#071a31]/75 to-[#071a31]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06162c]/55 via-transparent to-[#06162c]/10" />
        <div className="absolute bottom-4 right-[8%] hidden rounded-[2rem] border border-white/15 bg-slate-950/20 p-4 text-white/90 drop-shadow-[0_10px_24px_rgba(0,0,0,0.45)] backdrop-blur-[1px] md:block">
          <Car size={116} strokeWidth={1.25} />
        </div>
        <div className="absolute bottom-5 right-5 text-white/85 drop-shadow-lg md:hidden"><Car size={52} strokeWidth={1.4} /></div>
        <div className="relative z-10 flex h-full items-center px-4 py-5 sm:px-7 md:px-10">
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
          {orderedTypes.map((type) => {
            const Icon = ICONS[type.icon];
            const isActive = activeFilter === type.id;
            return (
              <button
                key={type.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveFilter((current) => current === type.id ? null : type.id)}
                className={`flex min-h-[62px] flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-2 text-center transition sm:min-h-[66px] ${isActive ? 'border-brand-blue bg-brand-blue text-white shadow-sm' : 'border-transparent bg-bg-cardAlt text-text-secondary hover:border-brand-blue/35 hover:text-brand-blue'}`}
              >
                <Icon size={18} />
                <span className="text-[9px] font-medium leading-3 sm:text-[10px]">{localized(type.label, language)}</span>
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
            {visibleRentals.map((type) => {
              const Icon = ICONS[type.icon];
              const listing = cardListing(type);
              const favoriteId = type.listingId ?? type.id;
              return (
                <article key={type.id} className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-border bg-bg-card p-2 transition hover:border-brand-blue/35 hover:shadow-md lg:block lg:overflow-hidden lg:p-0">
                  <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-lg bg-bg-cardAlt sm:h-[84px] sm:w-[84px] lg:h-[102px] lg:w-full lg:rounded-none">
                    <img src={type.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/5 to-slate-950/15" />
                    <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-slate-950/75 px-1.5 py-1 text-[9px] font-bold text-amber-300 backdrop-blur"><Star size={9} fill="currentColor" />{listing.rating.toFixed(1)}</span>
                    <span className="absolute bottom-1.5 left-1.5 flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-400 text-slate-950"><Icon size={13} /></span>
                    <button type="button" aria-label={listing.isFavorited ? t('rentals_remove_favorite') : t('rentals_add_favorite')} onClick={() => favorites.toggle(favoriteId)} className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full backdrop-blur transition ${listing.isFavorited ? 'bg-brand-red text-white' : 'bg-slate-950/65 text-white hover:bg-brand-red'}`}>
                      <Heart size={14} fill={listing.isFavorited ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center justify-between gap-2 lg:block lg:p-2.5">
                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-semibold text-text-primary lg:text-[11px]">{localized(type.label, language)}</h3>
                      <p className="hidden truncate text-[9px] text-text-faint lg:mt-0.5 lg:block">{localized(type.detail, language)}</p>
                      <p className="mt-1 text-[10px] font-semibold text-brand-red">{formatPrice(type.rateUsd)} <span className="font-normal text-text-faint">/ {t('rentals_day')}</span></p>
                    </div>
                    <button type="button" onClick={() => beginRental(type.id)} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-blue px-2.5 py-2 text-[9px] font-semibold text-white transition hover:bg-brand-blue/85 sm:px-3 lg:mt-2 lg:w-full lg:justify-center lg:py-2">{t('rentals_rent_now')} <ArrowRight size={11} /></button>
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
              <h2 className="mt-1 text-base font-semibold text-text-primary">{selected ? localized(selected.label, language) : t('rentals_select_first')}</h2>
              <p className="mt-1 text-[10px] text-text-muted">{localized(city.name, language)} · {cityTypes.length} {t('rentals_available_types')}</p>
            </div>
            <button type="button" aria-label={t('rentals_close_order')} onClick={() => setBookingOpen(false)} className="rounded-lg border border-border p-2 text-text-muted hover:bg-bg-cardAlt hover:text-text-primary"><X size={15} /></button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
            <div className="space-y-4">
              <section>
                <p className="mb-2 text-[10px] font-semibold text-text-secondary">{t('rentals_choose_type')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cityTypes.map((type) => {
                    const Icon = ICONS[type.icon];
                    return <button key={type.id} type="button" onClick={() => changeType(type.id)} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-[9px] transition ${typeId === type.id ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' : 'border-border text-text-secondary hover:border-brand-blue/40'}`}><Icon size={13} />{localized(type.label, language)}</button>;
                  })}
                </div>
              </section>

              <div className="grid gap-2.5 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[10px] text-text-faint">{t('rentals_choose_city')}</span>
                  <span className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2.5"><MapPin size={14} className="text-brand-blue" /><select value={city.id} onChange={(event) => changeCity(event.target.value)} className="w-full bg-transparent text-xs text-text-primary outline-none">{catalog.cities.map((item) => <option key={item.id} value={item.id}>{localized(item.name, language)}</option>)}</select></span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] text-text-faint">{t('rentals_start_date')}</span>
                  <input type="date" min={earliestStart} value={date} onChange={(event) => { const nextDate = event.target.value; setDate(nextDate); const nextEarliest = minimumEndDate(nextDate, selected); if (validEndDate < nextEarliest) setEndDate(nextEarliest); }} className="w-full rounded-lg border border-border bg-bg px-2.5 py-2.5 text-[11px] text-text-primary outline-none" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] text-text-faint">{t('rentals_end_date')}</span>
                  <input type="date" min={earliestEnd} value={validEndDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-lg border border-border bg-bg px-2.5 py-2.5 text-[11px] text-text-primary outline-none" />
                </label>
              </div>
              <p className="flex items-center gap-1.5 text-[9px] text-brand-blue"><Check size={12} />{selected && selected.minDays > 1 ? t('rentals_car_minimum_days') : t('rentals_advance_note')}</p>

              {selected && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="rounded-lg bg-bg-cardAlt p-2.5"><span className="block text-[9px] text-text-faint">{t('rentals_participants')}</span><input type="number" min={1} max={45} value={participants} onChange={(event) => setParticipants(Math.max(1, Number(event.target.value)))} className="mt-1 w-full bg-transparent text-sm text-text-primary outline-none" /></label>
                    <label className="rounded-lg bg-bg-cardAlt p-2.5"><span className="block text-[9px] text-text-faint">{t('rentals_nationality')}</span><select value={customerType} onChange={(event) => setCustomerType(event.target.value as CustomerType)} className="mt-1 w-full bg-transparent text-[11px] text-text-primary outline-none"><option value="citizen">{t('rentals_citizen')}</option><option value="foreigner">{t('rentals_foreigner')}</option></select></label>
                  </div>
                  {variants.length > 0 && (
                    <>
                      <label className="block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_car_type')}</span><select value={chosenVariant?.id ?? ''} onChange={(event) => { setVariantId(event.target.value); setSubmittedCode(null); }} className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[11px] text-text-primary outline-none">{variants.map((variant) => <option key={variant.id} value={variant.id}>{localized(variant.label, language)}</option>)}</select></label>
                      <p className="rounded-lg bg-status-warningBg px-3 py-2 text-[10px] leading-4 text-status-warning">{t('rentals_car_note')}</p>
                    </>
                  )}
                  <p className="rounded-lg bg-status-warningBg px-3 py-2 text-[10px] leading-4 text-status-warning">{localized(selected.terms, language)}</p>

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
                    <label className="block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_choose_branch')}</span><select value={branch} onChange={(event) => setBranch(event.target.value)} className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[11px] text-text-primary outline-none"><option value="">{t('rentals_choose_branch_placeholder')}</option>{city.branches.map((item) => <option key={item.id} value={item.id}>{localized(item.name, language)}</option>)}</select></label>
                  )}
                  <label className="block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_customer_name')}</span><input value={customerName} onChange={(event) => { setCustomerName(event.target.value); setSubmittedCode(null); }} placeholder={t('rentals_customer_name_placeholder')} className="w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-[11px] text-text-primary outline-none placeholder:text-text-faint" /></label>
                  <label className="block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_phone')}</span><span className="flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2.5"><Phone size={14} className="text-brand-blue" /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t('rentals_phone_placeholder')} className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-faint" /></span></label>
                  <label className="block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_special_requests')}</span><textarea value={specialRequests} onChange={(event) => setSpecialRequests(event.target.value)} rows={2} placeholder={t('rentals_special_requests_placeholder')} className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-[11px] text-text-primary outline-none placeholder:text-text-faint" /></label>
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border bg-bg-cardAlt px-3 py-2.5 text-[10px] leading-4 text-text-secondary">
                    <input type="checkbox" checked={termsAccepted} onChange={(event) => { setTermsAccepted(event.target.checked); setSubmittedCode(null); }} className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-brand-blue" />
                    <span>{t('rentals_accept_terms')}</span>
                  </label>
                  <button type="button" onClick={submitOrder} disabled={!canSubmit} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue px-3 py-3 text-xs font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{t('rentals_submit_order')} <ChevronRight size={14} /></button>
                  <p className="text-center text-[9px] leading-4 text-text-faint">{t('rentals_contact_note')}</p>
                  {submittedCode && (
                    <div role="status" className="space-y-1.5 rounded-lg border border-status-success/30 bg-status-success/10 px-3 py-2 text-[10px] leading-4 text-status-success">
                      <p className="flex items-start gap-2"><Check size={14} className="mt-0.5 shrink-0" /><span>{t('rentals_submitted')}</span></p>
                      <p className="font-mono">{t('account_request_reference')}: {submittedCode}</p>
                      <Link to={`/account/bookings/${submittedCode}`} className="inline-flex items-center gap-1 font-semibold underline">{t('rentals_view_voucher')} <ArrowRight size={11} /></Link>
                    </div>
                  )}
                </>
              )}
            </div>

            <aside className="h-fit rounded-xl border border-border bg-bg-cardAlt p-4 xl:sticky xl:top-24">
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-brand-blue">{t('rentals_estimate')}</p>
              {selected ? (
                <>
                  <h3 className="mt-1 text-base font-semibold text-text-primary">{localized(selected.label, language)}</h3>
                  <p className="mt-1 text-[10px] leading-4 text-text-muted">{localized(selected.detail, language)}</p>
                  <div className="my-3 space-y-2 border-y border-border py-3 text-[10px] text-text-muted">
                    <div className="flex justify-between gap-2"><span>{t('rentals_city_label')}</span><span className="font-medium text-text-primary">{localized(city.name, language)}</span></div>
                    <div className="flex justify-between gap-2"><span>{t('rentals_start_date')}</span><span className="text-text-primary">{date}</span></div>
                    <div className="flex justify-between gap-2"><span>{t('rentals_end_date')}</span><span className="text-text-primary">{validEndDate}</span></div>
                    <div className="flex justify-between gap-2"><span>{t('rentals_days')}</span><span className="text-text-primary">{estimate.days} {t('rentals_day_count')}</span></div>
                    <div className="flex justify-between gap-2"><span>{t('rentals_rate')}</span><span className="text-text-primary">{formatPrice(estimate.rateUsd)} / {t('rentals_day')}</span></div>
                  </div>
                  <div className="flex items-end justify-between gap-2"><span className="text-[10px] text-text-muted">{t('rentals_estimate')}</span><strong className="text-xl text-brand-red">{formatPrice(estimate.totalUsd)}</strong></div>
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
          <article className="rounded-xl border border-border bg-bg-card p-3">
            <Check size={16} className="text-brand-blue" />
            <h3 className="mt-2 text-[10px] font-semibold text-text-primary">{t('rentals_rule_daily')}</h3>
            <p className="mt-1 text-[9px] leading-4 text-text-muted">{t('rentals_rule_daily_detail')}</p>
          </article>
          <article className="rounded-xl border border-border bg-bg-card p-3">
            <MapPin size={16} className="text-brand-blue" />
            <h3 className="mt-2 text-[10px] font-semibold text-text-primary">{t('rentals_rule_distance')}</h3>
            <p className="mt-1 text-[9px] leading-4 text-text-muted">{t('rentals_rule_distance_detail')}</p>
          </article>
          <article className="rounded-xl border border-border bg-bg-card p-3">
            <UserRound size={16} className="text-brand-blue" />
            <h3 className="mt-2 text-[10px] font-semibold text-text-primary">{t('rentals_rule_driver')}</h3>
            <p className="mt-1 text-[9px] leading-4 text-text-muted">
              {driverTypes.length > 0
                ? `${t('rentals_rule_driver_detail')} ${driverTypes.map((type) => localized(type.label, language)).join(', ')}.`
                : t('rentals_rule_driver_detail')}
            </p>
          </article>
          <article className="rounded-xl border border-border bg-bg-card p-3 sm:col-span-3">
            <ShieldCheck size={16} className="text-brand-blue" />
            <h3 className="mt-2 text-[10px] font-semibold text-text-primary">{t('rentals_terms_title')}</h3>
            <p className="mt-1 text-[9px] leading-4 text-text-muted">{localized(catalog.terms, language)}</p>
          </article>
        </section>
      )}

      {showAll && <p className="text-center text-[9px] text-text-faint">{t('rentals_city_availability_note')}</p>}
    </div>
  );
}
