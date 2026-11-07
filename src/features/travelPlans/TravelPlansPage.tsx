import { useMemo, useState } from 'react';
import { Clock3, Search, SlidersHorizontal } from 'lucide-react';
import { ListingCard } from '../../components/ui/ListingCard';
import { TRAVEL_PLANS } from '../../data/homeData';
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
      <section className="mb-5 border-b border-border pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-base font-medium text-text-primary sm:text-lg">{t('travel_plans_page_title')}</h1>
            <p className="mt-0.5 text-xs text-text-muted">{t('travel_plans_page_intro')}</p>
          </div>
          <span className="hidden items-center gap-1 text-[10px] text-text-faint sm:inline-flex">
            <Clock3 size={12} /> {t('travel_plans_duration_hint')}
          </span>
        </div>
      </section>

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
    </div>
  );
}
