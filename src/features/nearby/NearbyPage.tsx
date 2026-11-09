import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bike,
  BookOpen,
  Building2,
  Clock3,
  Coffee,
  Dumbbell,
  Hotel,
  Home,
  Landmark,
  LocateFixed,
  MapPin,
  RefreshCcw,
  Star,
  Store,
  Stethoscope,
  Utensils,
  Wine,
  type LucideIcon,
} from 'lucide-react';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { NEARBY_LISTINGS, type NearbyCategory } from '../../data/nearbyData';
import { NearbyPlaceCard } from './NearbyPlaceCard';

type QuickFilter = 'all' | 'within_1' | 'one_to_five' | 'five_to_ten' | 'top_rated' | 'near_me' | 'open_now';

const CATEGORY_META: { id: NearbyCategory; label: TranslationKey; icon: LucideIcon }[] = [
  { id: 'hotel', label: 'nearby_category_hotel', icon: Hotel },
  { id: 'guesthouse', label: 'nearby_category_guesthouse', icon: Home },
  { id: 'restaurant', label: 'nearby_category_restaurant', icon: Utensils },
  { id: 'cafe', label: 'nearby_category_cafe', icon: Coffee },
  { id: 'bar', label: 'nearby_category_bar', icon: Wine },
  { id: 'exchange', label: 'nearby_category_exchange', icon: RefreshCcw },
  { id: 'hospital', label: 'nearby_category_hospital', icon: Building2 },
  { id: 'clinic', label: 'nearby_category_clinic', icon: Stethoscope },
  { id: 'book_shop', label: 'nearby_category_book_shop', icon: BookOpen },
  { id: 'gym', label: 'nearby_category_gym', icon: Dumbbell },
  { id: 'attraction', label: 'nearby_category_attraction', icon: Landmark },
  { id: 'market', label: 'nearby_category_market', icon: Store },
  { id: 'rental', label: 'nearby_category_rental', icon: Bike },
];

const CATEGORY_ITEMS = [
  { id: 'all' as const, label: 'nearby_all_categories' as const, icon: MapPin },
  ...CATEGORY_META,
];

const QUICK_FILTERS: { id: Exclude<QuickFilter, 'all'>; label: TranslationKey; icon: LucideIcon }[] = [
  { id: 'within_1', label: 'nearby_quick_within1', icon: MapPin },
  { id: 'one_to_five', label: 'nearby_quick_1to5', icon: MapPin },
  { id: 'five_to_ten', label: 'nearby_quick_5to10', icon: MapPin },
  { id: 'top_rated', label: 'nearby_quick_top_rated', icon: Star },
  { id: 'near_me', label: 'nearby_quick_near_me', icon: LocateFixed },
  { id: 'open_now', label: 'nearby_quick_open_now', icon: Clock3 },
];

const CATEGORY_KEYS: Record<NearbyCategory, TranslationKey> = {
  hotel: 'nearby_category_hotel',
  guesthouse: 'nearby_category_guesthouse',
  restaurant: 'nearby_category_restaurant',
  cafe: 'nearby_category_cafe',
  bar: 'nearby_category_bar',
  exchange: 'nearby_category_exchange',
  hospital: 'nearby_category_hospital',
  clinic: 'nearby_category_clinic',
  book_shop: 'nearby_category_book_shop',
  gym: 'nearby_category_gym',
  attraction: 'nearby_category_attraction',
  market: 'nearby_category_market',
  rental: 'nearby_category_rental',
};

function distanceBetweenKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function NearbyPage() {
  const { t } = useLanguage();
  const favorites = useToggleFavorite(NEARBY_LISTINGS);
  const [category, setCategory] = useState<'all' | NearbyCategory>('all');
  const [radiusKm, setRadiusKm] = useState(5);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [showAllPlaces, setShowAllPlaces] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const locationRequestId = useRef(0);

  const requestLocation = useCallback(() => {
    const requestId = ++locationRequestId.current;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (locationRequestId.current !== requestId) return;
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
      },
      () => {
        if (locationRequestId.current !== requestId) return;
        setUserLocation(null);
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const listings = useMemo(() => favorites.listings.map((listing) => ({
    ...listing,
    distanceKm: userLocation
      ? Number(distanceBetweenKm(userLocation.lat, userLocation.lng, listing.lat, listing.lng).toFixed(1))
      : listing.distanceKm,
  })), [favorites.listings, userLocation]);

  const filtered = useMemo(() => {
    return listings
      .filter((listing) => category === 'all' || listing.category === category)
      .filter((listing) => {
        if (quickFilter === 'within_1') return listing.distanceKm <= 1;
        if (quickFilter === 'one_to_five') return listing.distanceKm > 1 && listing.distanceKm <= 5;
        if (quickFilter === 'five_to_ten') return listing.distanceKm > 5 && listing.distanceKm <= 10;
        return listing.distanceKm <= radiusKm;
      })
      .filter((listing) => quickFilter !== 'top_rated' || listing.rating >= 4.5)
      .filter((listing) => quickFilter !== 'open_now' || listing.openNow)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [category, listings, quickFilter, radiusKm]);

  const popular = useMemo(() => [...listings]
    .sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm), [listings]);
  const visiblePlaces = showAllPlaces ? filtered : filtered.slice(0, 6);
  const visiblePopular = showAllPopular ? popular : popular.slice(0, 5);

  function chooseQuickFilter(value: Exclude<QuickFilter, 'all'>) {
    if (quickFilter === value) {
      setQuickFilter('all');
      setRadiusKm(5);
      setShowAllPlaces(false);
      return;
    }
    setQuickFilter(value);
    setShowAllPlaces(false);
    if (value === 'within_1') setRadiusKm(1);
    if (value === 'one_to_five') setRadiusKm(5);
    if (value === 'five_to_ten') setRadiusKm(10);
    if (value === 'near_me') {
      setRadiusKm(5);
      requestLocation();
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl pb-10 pt-2 sm:pt-4">
      <section className="relative mb-4 min-h-[150px] overflow-hidden rounded-card border border-border bg-bg-card sm:min-h-[190px]">
        <img src="/images/blog/shwedagon-evening.webp" alt="Shwedagon Pagoda at sunset" className="absolute inset-0 h-full w-full object-cover object-[50%_62%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071a37]/95 via-[#071a37]/80 to-[#071a37]/20" />
        <div aria-hidden="true" className="absolute right-[8%] top-[10%] hidden h-36 w-36 rounded-full border border-white/15 bg-white/5 sm:block" />
        <MapPin aria-hidden="true" size={42} className="absolute right-[22%] top-[23%] hidden fill-brand-blue text-brand-blue drop-shadow-lg sm:block" />
        <MapPin aria-hidden="true" size={22} className="absolute right-[12%] bottom-[25%] hidden fill-cyan-400 text-cyan-400 sm:block" />
        <div className="relative z-10 flex min-h-[150px] items-center px-4 py-4 sm:min-h-[190px] sm:px-8">
          <div className="max-w-2xl">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-cyan-200">
              <MapPin size={11} />{t('nearby_hero_badge')}
            </span>
            <h1 className="text-2xl font-semibold leading-tight text-white sm:text-4xl">{t('nearby_title')}</h1>
            <p className="mt-1 text-sm font-medium text-white sm:text-lg">{t('nearby_hero_subtitle')}</p>
            <p className="mt-1 text-[10px] text-slate-200 sm:text-xs">{t('nearby_hero_support')}</p>
          </div>
        </div>
      </section>

      <section className="mb-5">
        <h2 className="mb-2 text-sm font-semibold text-text-primary">{t('nearby_categories_title')}</h2>
        <div className="overflow-hidden" role="region" aria-label={t('nearby_categories_title')}>
          <div className="animate-marquee flex w-max gap-4">
            {[0, 1].map((copyIndex) => (
              <div
                key={copyIndex}
                className="flex w-max shrink-0 items-start gap-4"
                aria-hidden={copyIndex === 1}
              >
                {CATEGORY_ITEMS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={`${copyIndex}-${id}`}
                    type="button"
                    tabIndex={copyIndex === 1 ? -1 : undefined}
                    onClick={() => { setCategory((current) => id === 'all' || current === id ? 'all' : id); setShowAllPlaces(false); }}
                    aria-label={t(label)}
                    aria-pressed={category === id}
                    className="flex shrink-0 basis-[64px] flex-col items-center gap-1 text-center text-text-secondary transition hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  >
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full transition ${category === id ? 'bg-brand-blue text-white shadow-[0_0_0_4px_rgb(59_130_246/0.12)]' : 'bg-brand-blueDark/20 text-brand-blue hover:bg-brand-blue/30'}`}>
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span className="whitespace-nowrap text-center text-[8px] text-text-muted">{t(label)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="nearby-places" className="mb-5 scroll-mt-20">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{t('nearby_nearest_title')}</h2>
            <p className="mt-0.5 text-[10px] text-text-muted">{filtered.length} {t('nearby_places')}</p>
          </div>
          {filtered.length > 6 && <button type="button" onClick={() => setShowAllPlaces((value) => !value)} className="shrink-0 text-[10px] font-medium text-brand-blue hover:underline">
            {showAllPlaces ? t('nearby_show_less') : t('nearby_view_all')}
          </button>}
        </div>
        {visiblePlaces.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {visiblePlaces.map((listing) => <NearbyPlaceCard
              key={listing.id}
              listing={listing}
              categoryLabel={t(CATEGORY_KEYS[listing.category])}
              viewDetailsLabel={t('nearby_view_details')}
              openNowLabel={t('nearby_open_now_label')}
              closedLabel={t('nearby_closed_label')}
              saveLabel={t('nearby_save_place')}
              removeLabel={t('nearby_remove_place')}
              isFavorited={listing.isFavorited}
              onToggleFavorite={favorites.toggle}
            />)}
          </div>
        ) : <EmptyState text={t('nearby_no_results')} />}
      </section>

      <section className="mb-5 rounded-card border border-border bg-bg-card p-3 sm:p-4">
        <div className="mb-2 flex items-center gap-2"><h2 className="text-sm font-semibold text-text-primary">{t('nearby_quick_filters')}</h2><span className="h-px flex-1 bg-border" /></div>
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label={t('nearby_quick_filters')}>
          {QUICK_FILTERS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => chooseQuickFilter(id)}
              aria-pressed={quickFilter === id}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-medium transition ${quickFilter === id ? 'border-brand-blue bg-brand-blue text-white' : 'border-border bg-bg text-text-secondary hover:border-brand-blue/30 hover:bg-bg-cardAlt'}`}
            >
              <Icon size={12} />{t(label)}
            </button>
          ))}
          {quickFilter !== 'all' && <button type="button" onClick={() => { setQuickFilter('all'); setRadiusKm(5); }} className="shrink-0 rounded-full px-3 py-2 text-[10px] text-text-muted hover:bg-bg-cardAlt">{t('nearby_clear_filter')}</button>}
        </div>
      </section>

      <section className="mb-2">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{t('nearby_popular_title')}</h2>
            <p className="mt-0.5 text-[10px] text-text-muted">{t('nearby_popular_intro')}</p>
          </div>
          {popular.length > 5 && <button type="button" onClick={() => setShowAllPopular((value) => !value)} className="shrink-0 text-[10px] font-medium text-brand-blue hover:underline">{showAllPopular ? t('nearby_show_less') : t('nearby_view_all')}</button>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {visiblePopular.map((listing) => <NearbyPlaceCard
            key={`popular-${listing.id}`}
            variant="mini"
            listing={listing}
            categoryLabel={t(CATEGORY_KEYS[listing.category])}
            viewDetailsLabel={t('nearby_view_details')}
            openNowLabel={t('nearby_open_now_label')}
            closedLabel={t('nearby_closed_label')}
            saveLabel={t('nearby_save_place')}
            removeLabel={t('nearby_remove_place')}
            isFavorited={listing.isFavorited}
            onToggleFavorite={favorites.toggle}
          />)}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-card border border-dashed border-border bg-bg-card px-4 py-10 text-center text-xs text-text-muted"><MapPin size={18} className="mx-auto mb-2 text-brand-blue" />{text}</div>;
}
