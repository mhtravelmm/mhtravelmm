import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  List,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  RefreshCcw,
  Star,
  Stethoscope,
  Store,
  Utensils,
  Wine,
  type LucideIcon,
} from 'lucide-react';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { ListingCard } from '../../components/ui/ListingCard';
import { AdSlot } from '../../components/ui/AdSlot';
import { cardGridStyle } from '../../lib/cardGrid';
import { FALLBACK_LOCATION, readLocation, rememberLocation, requestGps, type ReaderLocation } from '../../lib/location';
import { NEARBY_KINDS, NEARBY_RADIUS_KM, runNearby, type NearbyItem } from '../../lib/nearbyApi';
import type { SearchKind } from '../../lib/searchIndex';
import type { CardListing } from '../../types';
import { MapView } from './MapView';

/**
 * Plan §16H.9 and §16H.1, ticket O-51. The page holds no matching rule of its
 * own: `runNearby()` answers from `search_nearby` when `VITE_BACKEND_SEARCH` is
 * on and from the seeded index otherwise, and both arrive as `NearbyItem[]`.
 *
 * What is here is the page behaviour §16H.9 keeps after the founder's changes:
 * the category row, Quick Filters (distance, Top Rated, Near Me, Open Now), the
 * List/Map toggle, favorites and the cards. The city selector, the radius chips
 * and the keyword field were removed at the founder's request and stay removed.
 */

type QuickFilter = 'all' | 'within_1' | 'one_to_five' | 'five_to_ten' | 'top_rated' | 'near_me' | 'open_now';
type ViewMode = 'list' | 'map';

/**
 * §12's category row, in its order: hotels, guesthouses, restaurants, cafes,
 * bars, exchange, hospitals, clinics, book shops, gyms, temples and attractions,
 * city markets, plus rentals. Each is one `SearchKind`, so a chip's list is a
 * `search_nearby` call rather than a page-level filter.
 */
const KIND_META: { id: SearchKind; label: TranslationKey; icon: LucideIcon }[] = [
  { id: 'hotels', label: 'nearby_category_hotel', icon: Hotel },
  { id: 'guesthouses', label: 'nearby_category_guesthouse', icon: Home },
  { id: 'restaurants', label: 'nearby_category_restaurant', icon: Utensils },
  { id: 'cafes', label: 'nearby_category_cafe', icon: Coffee },
  { id: 'bars', label: 'nearby_category_bar', icon: Wine },
  { id: 'exchange', label: 'nearby_category_exchange', icon: RefreshCcw },
  { id: 'hospitals', label: 'nearby_category_hospital', icon: Building2 },
  { id: 'clinics', label: 'nearby_category_clinic', icon: Stethoscope },
  { id: 'bookshops', label: 'nearby_category_book_shop', icon: BookOpen },
  { id: 'gyms', label: 'nearby_category_gym', icon: Dumbbell },
  { id: 'attractions', label: 'nearby_category_attraction', icon: Landmark },
  { id: 'markets', label: 'nearby_category_market', icon: Store },
  { id: 'rentals', label: 'nearby_category_rental', icon: Bike },
];

const CATEGORY_ITEMS = [
  { id: 'all' as const, label: 'nearby_all_categories' as const, icon: MapPin },
  ...KIND_META,
];

const QUICK_FILTERS: { id: Exclude<QuickFilter, 'all'>; label: TranslationKey; icon: LucideIcon }[] = [
  { id: 'within_1', label: 'nearby_quick_within1', icon: MapPin },
  { id: 'one_to_five', label: 'nearby_quick_1to5', icon: MapPin },
  { id: 'five_to_ten', label: 'nearby_quick_5to10', icon: MapPin },
  { id: 'top_rated', label: 'nearby_quick_top_rated', icon: Star },
  { id: 'near_me', label: 'nearby_quick_near_me', icon: LocateFixed },
  { id: 'open_now', label: 'nearby_quick_open_now', icon: Clock3 },
];

/** §16H.9: the radius each distance band asks the function for. */
const RADIUS_FOR: Partial<Record<QuickFilter, number>> = {
  within_1: 1,
  one_to_five: 5,
  five_to_ten: 10,
};

const chipClass = (active: boolean) =>
  `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-[10px] font-medium transition ${
    active
      ? 'border-brand-blue bg-brand-blue text-white'
      : 'border-border bg-bg text-text-secondary hover:border-brand-blue/30 hover:bg-bg-cardAlt'
  }`;

/** One `NearbyItem` as the shared card draws it. */
function toCardListing(item: NearbyItem): CardListing {
  return {
    id: item.ref_id,
    title: item.title,
    subtitle: item.subtitle ?? item.address ?? undefined,
    imageUrl: item.thumbnail_url ?? undefined,
    rating: item.rating ?? 0,
    distanceKm: item.distance_km,
    isFavorited: false,
    views: 0,
    href: item.href,
  };
}

export function NearbyPage() {
  const { t, language } = useLanguage();
  const [params, setParams] = useSearchParams();

  const requestedKind = params.get('kind') ?? '';
  const view: ViewMode = params.get('view') === 'map' ? 'map' : 'list';
  const quick = (params.get('quick') ?? 'all') as QuickFilter;

  const [location, setLocation] = useState<ReaderLocation>(() => readLocation() ?? FALLBACK_LOCATION);
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const gpsAsked = useRef(false);

  // §16H.9: GPS is asked for silently and a refusal leaves the Yangon centre,
  // so the page is useful before the reader answers the prompt.
  const askGps = useCallback(() => {
    gpsAsked.current = true;
    void requestGps().then((point) => {
      if (!point) return;
      const next: ReaderLocation = { point, source: 'gps' };
      rememberLocation(next);
      setLocation(next);
    });
  }, []);

  useEffect(() => {
    if (readLocation() || gpsAsked.current) return;
    askGps();
  }, [askGps]);

  const kind = KIND_META.some((entry) => entry.id === requestedKind) ? (requestedKind as SearchKind) : null;
  const radiusKm = RADIUS_FOR[quick] ?? NEARBY_RADIUS_KM;

  const writeParams = useCallback(
    (next: { kind?: string; view?: ViewMode; quick?: QuickFilter }) => {
      const merged = { kind: requestedKind, view, quick, ...next };
      const search = new URLSearchParams();
      if (merged.kind) search.set('kind', merged.kind);
      if (merged.view === 'map') search.set('view', 'map');
      if (merged.quick && merged.quick !== 'all') search.set('quick', merged.quick);
      setParams(search, { replace: true });
    },
    [quick, requestedKind, setParams, view],
  );

  /**
   * One call per change of what the reader asked for. `open_now` is a filter
   * inside the function, so the count and the list cannot disagree about it.
   */
  useEffect(() => {
    let active = true;
    void runNearby({
      lat: location.point.lat,
      lng: location.point.lng,
      radiusKm,
      kinds: kind ? [kind] : NEARBY_KINDS,
      openNow: quick === 'open_now',
      limit: 50,
      // The card's name comes back in the reader's language (§16H.7).
      lang: language,
    }).then((outcome) => {
      if (!active) return;
      setItems(outcome.ok ? outcome.result.items : []);
    });
    return () => {
      active = false;
    };
  }, [kind, language, location.point.lat, location.point.lng, quick, radiusKm]);

  /** Top Rated and the two distance bands are the page's own slices of one answer. */
  const filtered = useMemo(
    () =>
      items
        .filter((item) => {
          if (quick === 'within_1') return item.distance_km <= 1;
          if (quick === 'one_to_five') return item.distance_km > 1 && item.distance_km <= 5;
          if (quick === 'five_to_ten') return item.distance_km > 5 && item.distance_km <= 10;
          return true;
        })
        .filter((item) => quick !== 'top_rated' || (item.rating ?? 0) >= 4.5)
        .sort((a, b) => a.distance_km - b.distance_km || (b.rating ?? 0) - (a.rating ?? 0)),
    [items, quick],
  );

  const popular = useMemo(
    () => [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.distance_km - b.distance_km),
    [items],
  );

  const visible = view === 'map' || showAll ? filtered : filtered.slice(0, 6);
  const visiblePopular = popular.slice(0, 5);

  function chooseQuickFilter(value: Exclude<QuickFilter, 'all'>) {
    setShowAll(false);
    if (value === 'near_me') {
      askGps();
      writeParams({ quick: 'all' });
      return;
    }
    writeParams({ quick: quick === value ? 'all' : value });
  }

  // §16H.9: the map is centred on the same point the distances were measured
  // from — GPS, a chosen city, or the Yangon fallback.
  const center = location.point;
  const locationLine =
    location.source === 'gps'
      ? t('nearby_location_ready_detail')
      : location.source === 'manual'
        ? t('search_location_manual')
        : t('nearby_location_fallback');

  return (
    <div className="mx-auto w-full max-w-7xl pb-10 pt-2 sm:pt-4">
      <section className="mh-page-hero relative mb-4 overflow-hidden rounded-card border border-border bg-bg-card">
        <img src="/images/blog/shwedagon-evening.webp" alt="Shwedagon Pagoda at sunset" className="absolute inset-0 h-full w-full object-cover object-[50%_62%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071a37]/95 via-[#071a37]/80 to-[#071a37]/20" />
        <div aria-hidden="true" className="absolute right-[8%] top-[10%] hidden h-36 w-36 rounded-full border border-white/15 bg-white/5 sm:block" />
        <MapPin aria-hidden="true" size={42} className="absolute right-[22%] top-[23%] hidden fill-brand-blue text-brand-blue drop-shadow-lg sm:block" />
        <MapPin aria-hidden="true" size={22} className="absolute right-[12%] bottom-[25%] hidden fill-cyan-400 text-cyan-400 sm:block" />
        <div className="relative z-10 flex h-full items-center px-4 py-4 sm:px-8">
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

      <div className="mb-4"><AdSlot placement="nearby_top" /></div>

      <section className="mb-4">
        <h2 className="mb-2 text-sm font-semibold text-text-primary">{t('nearby_categories_title')}</h2>
        <div className="overflow-hidden" role="region" aria-label={t('nearby_categories_title')}>
          <div className="animate-marquee flex w-max gap-4">
            {[0, 1].map((copyIndex) => (
              <div key={copyIndex} className="flex w-max shrink-0 items-start gap-4" aria-hidden={copyIndex === 1}>
                {CATEGORY_ITEMS.map(({ id, label, icon: Icon }) => {
                  const active = id === 'all' ? kind === null : kind === id;
                  return (
                    <button
                      key={`${copyIndex}-${id}`}
                      type="button"
                      tabIndex={copyIndex === 1 ? -1 : undefined}
                      onClick={() => {
                        setShowAll(false);
                        writeParams({ kind: id === 'all' || kind === id ? '' : id });
                      }}
                      aria-label={t(label)}
                      aria-pressed={active}
                      className="flex shrink-0 basis-[64px] flex-col items-center gap-1 text-center text-text-secondary transition hover:text-brand-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                    >
                      <span className={`flex h-9 w-9 items-center justify-center rounded-full transition ${active ? 'bg-brand-blue text-white shadow-[0_0_0_4px_rgb(59_130_246/0.12)]' : 'bg-brand-blueDark/20 text-brand-blue hover:bg-brand-blue/30'}`}>
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <span className="whitespace-nowrap text-center text-[8px] text-text-muted">{t(label)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="nearby-places" className="mb-5 scroll-mt-20">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{t('nearby_nearest_title')}</h2>
            <p className="mt-0.5 text-[10px] text-text-muted">
              {t('nearby_result_count').replace('{count}', String(filtered.length))} · {locationLine}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex overflow-hidden rounded-full border border-border" role="group" aria-label={`${t('nearby_list_view')} / ${t('nearby_map_view')}`}>
              <button
                type="button"
                onClick={() => writeParams({ view: 'list' })}
                aria-pressed={view === 'list'}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium ${view === 'list' ? 'bg-brand-blue text-white' : 'text-text-secondary hover:bg-bg-cardAlt'}`}
              >
                <List size={11} />{t('nearby_list_view')}
              </button>
              <button
                type="button"
                onClick={() => writeParams({ view: 'map' })}
                aria-pressed={view === 'map'}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-medium ${view === 'map' ? 'bg-brand-blue text-white' : 'text-text-secondary hover:bg-bg-cardAlt'}`}
              >
                <MapIcon size={11} />{t('nearby_map_view')}
              </button>
            </div>
            {view === 'list' && filtered.length > 6 && (
              <button type="button" onClick={() => setShowAll((value) => !value)} className="shrink-0 text-[10px] font-medium text-brand-blue hover:underline">
                {showAll ? t('nearby_show_less') : t('nearby_view_all')}
              </button>
            )}
          </div>
        </div>

        {view === 'map' && (
          <div className="mb-3">
            <MapView
              items={filtered}
              center={center}
              selected={selected}
              onSelect={setSelected}
              labels={{ loading: t('nearby_map_loading'), unavailable: t('nearby_map_unavailable'), hint: t('nearby_map_hint') }}
            />
          </div>
        )}

        {visible.length > 0 ? (
          <div className="grid grid-cols-2 justify-items-center gap-2.5 sm:grid-cols-3 lg:grid-cols-5" style={cardGridStyle(5, 'md')}>
            {visible.map((item) => (
              <ListingCard key={`${item.kind}-${item.ref_id}`} listing={toCardListing(item)} size="md" />
            ))}
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
              aria-pressed={quick === id}
              className={chipClass(quick === id)}
            >
              <Icon size={12} />{t(label)}
            </button>
          ))}
          {quick !== 'all' && (
            <button type="button" onClick={() => writeParams({ quick: 'all' })} className="shrink-0 rounded-full px-3 py-2 text-[10px] text-text-muted hover:bg-bg-cardAlt">
              {t('nearby_clear_filter')}
            </button>
          )}
        </div>
      </section>

      <section className="mb-2">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{t('nearby_popular_title')}</h2>
            <p className="mt-0.5 text-[10px] text-text-muted">{t('nearby_popular_intro')}</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {visiblePopular.map((item) => (
            <div key={`popular-${item.ref_id}`} className="w-36 shrink-0">
              <ListingCard listing={toCardListing(item)} size="sm" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-card border border-dashed border-border bg-bg-card px-4 py-10 text-center text-xs text-text-muted"><MapPin size={18} className="mx-auto mb-2 text-brand-blue" />{text}</div>;
}
