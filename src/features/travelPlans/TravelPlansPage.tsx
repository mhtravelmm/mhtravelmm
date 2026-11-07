import { useMemo, useState } from 'react';
import { MapPinned, Search, SlidersHorizontal } from 'lucide-react';
import { ListingCard } from '../../components/ui/ListingCard';
import { POPULARS, TRAVEL_PLANS } from '../../data/homeData';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';
import { useLanguage } from '../../lib/i18n';
import type { CardListing } from '../../types';

type DurationFilter = 'all' | 'short' | 'long';
type SortMode = 'popular' | 'rating' | 'price';

type PlanListing = CardListing & {
  durationDays: number;
  durationLabel: { en: string; mm: string };
};

const PLAN_LISTINGS: PlanListing[] = [
  { ...TRAVEL_PLANS[0], durationDays: 3, durationLabel: { en: '3 days 2 nights', mm: '၃ ရက် ၂ ည' } },
  { ...TRAVEL_PLANS[1], durationDays: 3, durationLabel: { en: '3 days 2 nights', mm: '၃ ရက် ၂ ည' } },
  { ...TRAVEL_PLANS[2], durationDays: 3, durationLabel: { en: '3 days 2 nights', mm: '၃ ရက် ၂ ည' } },
  {
    id: 'tp4',
    title: 'Yangon - Inle Lake - Mandalay',
    subtitle: '6 days 5 nights',
    rating: 4.7,
    distanceKm: 18,
    isFavorited: false,
    views: 2200,
    priceUsd: 920,
    href: '/travel-plans/tp4',
    durationDays: 6,
    durationLabel: { en: '6 days 5 nights', mm: '၆ ရက် ၅ ည' },
  },
  {
    id: 'tp5',
    title: 'Mandalay - Mingun - Pyin Oo Lwin',
    subtitle: '2 days 1 night',
    rating: 4.3,
    distanceKm: 10,
    isFavorited: false,
    views: 1280,
    priceUsd: 360,
    href: '/travel-plans/tp5',
    durationDays: 2,
    durationLabel: { en: '2 days 1 night', mm: '၂ ရက် ၁ ည' },
  },
  {
    id: 'tp6',
    title: 'Yangon - Ngapali - Gwa',
    subtitle: '5 days 4 nights',
    rating: 4.6,
    distanceKm: 26,
    isFavorited: false,
    views: 1840,
    priceUsd: 760,
    href: '/travel-plans/tp6',
    durationDays: 5,
    durationLabel: { en: '5 days 4 nights', mm: '၅ ရက် ၄ ည' },
  },
];

const AVAILABLE_HOTELS = Array.from(
  new Map(
    POPULARS
      .filter((listing) => listing.href?.startsWith('/hotels/'))
      .map((listing) => [listing.id, listing]),
  ).values(),
);

const AVAILABLE_PLACES = Array.from(
  new Set(PLAN_LISTINGS.flatMap((plan) => plan.title.split(' - '))),
);

function localizedPlanTitle(title: string, language: 'en' | 'mm'): string {
  if (language === 'en') return title;
  return title
    .replace('Yangon', 'ရန်ကုန်')
    .replace('Bagan', 'ပုဂံ')
    .replace('Bago', 'ပဲခူး')
    .replace('Inle Lake', 'အင်းလေးကန်')
    .replace('Mandalay', 'မန္တလေး')
    .replace('Mingun', 'မင်းကွန်း')
    .replace('Pyin Oo Lwin', 'ပြင်ဦးလွင်')
    .replace('Ngapali', 'ငပလီ')
    .replace('Gwa', 'ဂွ');
}

export function TravelPlansPage() {
  const { language, t } = useLanguage();
  const { listings, toggle } = useToggleFavorite(PLAN_LISTINGS);
  const [query, setQuery] = useState('');
  const [duration, setDuration] = useState<DurationFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('popular');
  const [customStart, setCustomStart] = useState('');
  const [customDestination, setCustomDestination] = useState('');
  const [customNationality, setCustomNationality] = useState('citizen');
  const [customHotel, setCustomHotel] = useState('');
  const [customPlaces, setCustomPlaces] = useState<string[]>([]);
  const [customDays, setCustomDays] = useState('3');
  const [customTravelers, setCustomTravelers] = useState('2');
  const [customBudget, setCustomBudget] = useState('mid');
  const [customTransport, setCustomTransport] = useState('car');
  const [customStay, setCustomStay] = useState('hotel');
  const [customNotes, setCustomNotes] = useState('');
  const [customPlanSaved, setCustomPlanSaved] = useState(false);

  const visiblePlans = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(language === 'mm' ? 'my-MM' : 'en-US');
    return listings
      .filter((plan) => {
        if (duration === 'short') return plan.durationDays <= 3;
        if (duration === 'long') return plan.durationDays >= 5;
        return true;
      })
      .filter((plan) => {
        if (!needle) return true;
        const title = localizedPlanTitle(plan.title, language).toLocaleLowerCase(language === 'mm' ? 'my-MM' : 'en-US');
        const subtitle = plan.durationLabel[language].toLocaleLowerCase(language === 'mm' ? 'my-MM' : 'en-US');
        return title.includes(needle) || subtitle.includes(needle);
      })
      .sort((a, b) => {
        if (sortMode === 'rating') return b.rating - a.rating;
        if (sortMode === 'price') return (a.priceUsd ?? 0) - (b.priceUsd ?? 0);
        return b.views - a.views;
      })
      .map((plan) => ({
        ...plan,
        title: localizedPlanTitle(plan.title, language),
        subtitle: plan.durationLabel[language],
      }));
  }, [duration, language, listings, query, sortMode]);

  return (
    <div className="mx-auto max-w-7xl pb-8 pt-3 sm:pt-5">
      <section className="mb-4 flex flex-col gap-2 rounded-card border border-border bg-bg-card p-2 sm:flex-row sm:items-center">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">{t('travel_plans_search_label')}</span>
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('travel_plans_search_placeholder')}
            aria-label={t('travel_plans_search_label')}
            className="w-full rounded-md border border-border bg-bg px-8 py-2 text-xs text-text-primary outline-none placeholder:text-text-faint focus:border-brand-blue/60"
          />
        </label>
        <div className="flex gap-2">
          <label className="min-w-0 flex-1 sm:flex-none">
            <span className="sr-only">{t('travel_plans_duration_label')}</span>
            <select
              value={duration}
              onChange={(event) => setDuration(event.target.value as DurationFilter)}
              aria-label={t('travel_plans_duration_label')}
              className="w-full rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-secondary outline-none focus:border-brand-blue/60 sm:w-auto"
            >
              <option value="all">{t('travel_plans_all_durations')}</option>
              <option value="short">{t('travel_plans_short')}</option>
              <option value="long">{t('travel_plans_long')}</option>
            </select>
          </label>
          <label className="min-w-0 flex-1 sm:flex-none">
            <span className="sr-only">{t('travel_plans_sort_label')}</span>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              aria-label={t('travel_plans_sort_label')}
              className="w-full rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-secondary outline-none focus:border-brand-blue/60 sm:w-auto"
            >
              <option value="popular">{t('travel_plans_most_viewed')}</option>
              <option value="rating">{t('travel_plans_top_rated')}</option>
              <option value="price">{t('travel_plans_lowest_price')}</option>
            </select>
          </label>
        </div>
      </section>

      <div className="mb-2 flex items-center justify-between text-[10px] text-text-faint">
        <span className="inline-flex items-center gap-1"><SlidersHorizontal size={11} /> {t('travel_plans_results')}</span>
        <span>{visiblePlans.length}</span>
      </div>

      {visiblePlans.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {visiblePlans.map((plan) => (
            <ListingCard key={plan.id} listing={plan} onToggleFavorite={toggle} />
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-border px-4 py-12 text-center text-xs text-text-muted">
          {t('travel_plans_no_results')}
        </div>
      )}

      <section className="mt-8 rounded-card border border-brand-blue/25 bg-bg-card p-3 sm:p-4">
        <div className="mb-3 flex items-start gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue">
            <MapPinned size={16} />
          </span>
          <div>
            <h2 className="text-sm font-medium text-text-primary">{t('travel_plans_custom_title')}</h2>
            <p className="mt-0.5 text-[11px] leading-5 text-text-muted">{t('travel_plans_custom_intro')}</p>
          </div>
        </div>

        <form
          className="grid gap-2 sm:grid-cols-[1.4fr_0.7fr_1.5fr_auto] sm:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            if (customStart.trim() && (customDestination.trim() || customPlaces.length > 0)) setCustomPlanSaved(true);
          }}
        >
          <label className="block">
            <span className="mb-1 block text-[10px] text-text-faint">{t('travel_plans_custom_start')}</span>
            <input
              value={customStart}
              onChange={(event) => {
                setCustomStart(event.target.value);
                setCustomPlanSaved(false);
              }}
              placeholder={t('travel_plans_custom_start_placeholder')}
              className="w-full rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-primary outline-none placeholder:text-text-faint focus:border-brand-blue/60"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] text-text-faint">{t('travel_plans_custom_destination')}</span>
            <input
              value={customDestination}
              onChange={(event) => {
                setCustomDestination(event.target.value);
                setCustomPlanSaved(false);
              }}
              placeholder={t('travel_plans_custom_destination_placeholder')}
              className="w-full rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-primary outline-none placeholder:text-text-faint focus:border-brand-blue/60"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] text-text-faint">{t('travel_plans_custom_days')}</span>
            <select
              value={customDays}
              onChange={(event) => setCustomDays(event.target.value)}
              className="w-full rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-secondary outline-none focus:border-brand-blue/60"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((days) => <option key={days} value={days}>{days}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] text-text-faint">{t('travel_plans_custom_travelers')}</span>
            <select value={customTravelers} onChange={(event) => setCustomTravelers(event.target.value)} className="w-full rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-secondary outline-none focus:border-brand-blue/60">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => <option key={count} value={count}>{count}</option>)}
            </select>
          </label>

          <div className="grid gap-2 sm:col-span-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[10px] text-text-faint">{t('travel_plans_custom_nationality')}</span>
              <select value={customNationality} onChange={(event) => setCustomNationality(event.target.value)} className="w-full rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-secondary outline-none focus:border-brand-blue/60">
                <option value="citizen">{t('travel_plans_custom_nationality_citizen')}</option>
                <option value="foreigner">{t('travel_plans_custom_nationality_foreigner')}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] text-text-faint">{t('travel_plans_custom_hotel')}</span>
              <select value={customHotel} onChange={(event) => setCustomHotel(event.target.value)} className="w-full rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-secondary outline-none focus:border-brand-blue/60">
                <option value="">{t('travel_plans_custom_hotel_later')}</option>
                {AVAILABLE_HOTELS.map((hotel) => <option key={hotel.id} value={hotel.id}>{hotel.title}</option>)}
              </select>
            </label>
          </div>

          <fieldset className="rounded-md border border-border bg-bg/50 p-2 sm:col-span-4">
            <legend className="px-1 text-[10px] text-text-faint">{t('travel_plans_custom_places')}</legend>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {AVAILABLE_PLACES.map((place) => (
                <label key={place} className="flex cursor-pointer items-center gap-1.5 text-[11px] text-text-secondary">
                  <input
                    type="checkbox"
                    checked={customPlaces.includes(place)}
                    onChange={() => setCustomPlaces((current) => current.includes(place) ? current.filter((item) => item !== place) : [...current, place])}
                    className="accent-brand-blue"
                  />
                  {localizedPlanTitle(place, language)}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-2 sm:col-span-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[10px] text-text-faint">{t('travel_plans_custom_budget')}</span>
              <select value={customBudget} onChange={(event) => setCustomBudget(event.target.value)} className="w-full rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-secondary outline-none focus:border-brand-blue/60">
                <option value="low">{t('travel_plans_custom_budget_low')}</option>
                <option value="mid">{t('travel_plans_custom_budget_mid')}</option>
                <option value="high">{t('travel_plans_custom_budget_high')}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] text-text-faint">{t('travel_plans_custom_transport')}</span>
              <select value={customTransport} onChange={(event) => setCustomTransport(event.target.value)} className="w-full rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-secondary outline-none focus:border-brand-blue/60">
                <option value="car">{t('travel_plans_custom_transport_car')}</option>
                <option value="bus">{t('travel_plans_custom_transport_bus')}</option>
                <option value="mixed">{t('travel_plans_custom_transport_mixed')}</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] text-text-faint">{t('travel_plans_custom_stay')}</span>
              <select value={customStay} onChange={(event) => setCustomStay(event.target.value)} className="w-full rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-secondary outline-none focus:border-brand-blue/60">
                <option value="hotel">{t('travel_plans_custom_stay_hotel')}</option>
                <option value="guesthouse">{t('travel_plans_custom_stay_guesthouse')}</option>
                <option value="flexible">{t('travel_plans_custom_stay_flexible')}</option>
              </select>
            </label>
          </div>

          <label className="block sm:col-span-3">
            <span className="mb-1 block text-[10px] text-text-faint">{t('travel_plans_custom_notes')}</span>
            <textarea
              value={customNotes}
              onChange={(event) => setCustomNotes(event.target.value)}
              placeholder={t('travel_plans_custom_notes_placeholder')}
              rows={2}
              className="w-full resize-y rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-primary outline-none placeholder:text-text-faint focus:border-brand-blue/60"
            />
          </label>
          <button type="submit" className="rounded-md bg-brand-red px-3 py-2 text-xs font-medium text-white transition hover:brightness-110 sm:self-end">
            {t('travel_plans_custom_button')}
          </button>
        </form>

        {customPlanSaved && (
          <p className="mt-3 rounded-md bg-brand-blue/10 px-2.5 py-2 text-[11px] text-brand-blue">
            {t('travel_plans_custom_saved')} {customStart} → {customDestination || customPlaces.map((place) => localizedPlanTitle(place, language)).join(', ')} · {customDays} {t('travel_plans_custom_day_suffix')} · {customTravelers} {t('travel_plans_custom_travelers_suffix')} · {t(`travel_plans_custom_nationality_${customNationality}` as 'travel_plans_custom_nationality_citizen' | 'travel_plans_custom_nationality_foreigner')} · {customHotel ? AVAILABLE_HOTELS.find((hotel) => hotel.id === customHotel)?.title : t('travel_plans_custom_hotel_later')} · {t(`travel_plans_custom_budget_${customBudget}` as 'travel_plans_custom_budget_low' | 'travel_plans_custom_budget_mid' | 'travel_plans_custom_budget_high')} · {t(`travel_plans_custom_transport_${customTransport}` as 'travel_plans_custom_transport_car' | 'travel_plans_custom_transport_bus' | 'travel_plans_custom_transport_mixed')} · {t(`travel_plans_custom_stay_${customStay}` as 'travel_plans_custom_stay_hotel' | 'travel_plans_custom_stay_guesthouse' | 'travel_plans_custom_stay_flexible')}
            {customNotes.trim() ? ` · ${customNotes.trim()}` : ''}
          </p>
        )}
      </section>
    </div>
  );
}
