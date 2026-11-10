import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListingCard } from '../../components/ui/ListingCard';
import { BLOGS, POPULARS, TRAVEL_GUIDES, TRAVEL_PLANS } from '../../data/homeData';
import {
  CITIES,
  POPULAR_BOOK_SHOPS,
  POPULAR_CAFES,
  POPULAR_HOTELS,
  POPULAR_MARKETS,
  POPULAR_RENTALS,
  POPULAR_RESTAURANTS,
  POPULAR_TRANSPORT,
  TOP_ATTRACTIONS,
} from '../../data/cityPageData';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import type { CardListing } from '../../types';

type ResultCategory = 'plans' | 'guides' | 'blogs' | 'hotels' | 'restaurants' | 'bookshops' | 'cafes' | 'rentals' | 'attractions' | 'markets' | 'transport';
type SearchCity = 'yangon' | 'bago' | 'naypyidaw' | 'mandalay' | 'bagan' | 'other';
type ResultFilter = 'all' | ResultCategory | Exclude<SearchCity, 'other'>;
type SortMode = 'default' | 'rating' | 'nearby';

type SearchEntry = {
  listing: CardListing;
  category: ResultCategory;
  city: SearchCity;
};

const entries = (listing: CardListing, category: ResultCategory, city: SearchCity = 'yangon'): SearchEntry => ({ listing, category, city });

const SEARCH_ENTRIES: SearchEntry[] = [
  ...TRAVEL_PLANS.map((item) => entries(item, 'plans')),
  ...TRAVEL_GUIDES.map((item) => entries(item, 'guides')),
  ...BLOGS.map((item) => entries(item, 'blogs')),
  ...POPULARS.map((item) => entries(item, item.href?.includes('/hotels/') ? 'hotels' : item.href?.includes('/book-shops/') ? 'bookshops' : 'markets')),
  ...CITIES.map((item) => entries(item, 'attractions', item.id === 'yangon' ? 'yangon' : item.id === 'bago' ? 'bago' : item.id === 'bagan' ? 'bagan' : item.id === 'mandalay' ? 'mandalay' : 'other')),
  ...TOP_ATTRACTIONS.map((item) => entries(item, 'attractions', item.title.toLowerCase().includes('bein') ? 'mandalay' : 'yangon')),
  ...POPULAR_HOTELS.map((item, index) => entries(item, 'hotels', index > 2 ? 'bago' : 'yangon')),
  ...POPULAR_RESTAURANTS.map((item, index) => entries(item, 'restaurants', index % 2 === 1 ? 'bago' : 'yangon')),
  ...POPULAR_BOOK_SHOPS.map((item) => entries(item, 'bookshops')),
  ...POPULAR_RENTALS.map((item) => entries(item, 'rentals')),
  ...POPULAR_CAFES.map((item) => entries(item, 'cafes')),
  ...POPULAR_MARKETS.map((item) => entries(item, 'markets')),
  ...POPULAR_TRANSPORT.map((item) => entries(item, 'transport', item.title.toLowerCase().includes('inle') ? 'other' : 'yangon')),
];

const CATEGORY_ALIASES: { id: ResultCategory; terms: string[]; key: TranslationKey }[] = [
  { id: 'hotels', terms: ['hotel', 'hotels', 'ဟိုတယ်', 'ဟိုတယ်များ'], key: 'search_hotels' },
  { id: 'restaurants', terms: ['restaurant', 'restaurants', 'စားသောက်ဆိုင်', 'စားသောက်ဆိုင်များ'], key: 'search_restaurants' },
  { id: 'bookshops', terms: ['book', 'bookshop', 'bookshops', 'စာအုပ်ဆိုင်', 'စာအုပ်ဆိုင်များ'], key: 'search_bookshops' },
  { id: 'cafes', terms: ['cafe', 'cafes', 'ကဖေး', 'ကဖေးများ'], key: 'search_cafes' },
  { id: 'rentals', terms: ['rental', 'rentals', 'ငှားရမ်း', 'ငှားရမ်းရန်'], key: 'search_rentals' },
  { id: 'attractions', terms: ['attraction', 'attractions', 'လည်ပတ်စရာ', 'လည်ပတ်စရာများ'], key: 'search_attractions' },
  { id: 'markets', terms: ['market', 'markets', 'ဈေး', 'ဈေးများ'], key: 'search_markets' },
  { id: 'plans', terms: ['plan', 'plans', 'ခရီးစဉ်'], key: 'search_plans' },
  { id: 'guides', terms: ['guide', 'guides', 'လမ်းညွှန်'], key: 'search_guides' },
  { id: 'blogs', terms: ['blog', 'blogs', 'ဘလော့'], key: 'search_blogs' },
];

const CITY_ALIASES: { id: Exclude<SearchCity, 'other'>; terms: string[]; key: TranslationKey }[] = [
  { id: 'yangon', terms: ['yangon', 'ရန်ကုန်'], key: 'search_yangon' },
  { id: 'bago', terms: ['bago', 'ပဲခူး'], key: 'search_bago' },
  { id: 'naypyidaw', terms: ['naypyidaw', 'nay pyi taw', 'နေပြည်တော်'], key: 'search_naypyidaw' },
  { id: 'mandalay', terms: ['mandalay', 'မန္တလေး'], key: 'search_mandalay' },
  { id: 'bagan', terms: ['bagan', 'ပုဂံ'], key: 'search_bagan' },
];

function normalizeQuery(value: string) {
  return value.trim().toLowerCase().replace(/[,၊]/g, ' ');
}

function findCategory(query: string) {
  return CATEGORY_ALIASES.find(({ terms }) => terms.some((term) => query.includes(term)))?.id;
}

function findCity(query: string) {
  return CITY_ALIASES.find(({ terms }) => terms.some((term) => query.includes(term)))?.id;
}

function filterLabel(filter: ResultFilter, t: (key: TranslationKey) => string) {
  if (filter === 'all') return t('search_all');
  const category = CATEGORY_ALIASES.find((item) => item.id === filter);
  if (category) return t(category.key);
  return t(CITY_ALIASES.find((item) => item.id === filter)?.key ?? 'search_all');
}

export function SearchPage() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const rawQuery = params.get('q')?.trim() ?? '';
  const query = normalizeQuery(rawQuery);
  const category = findCategory(query);
  const city = findCity(query);
  const categoryOnly = Boolean(category && !city);
  const cityOnly = Boolean(city && !category);
  const combined = Boolean(category && city);
  const [filter, setFilter] = useState<ResultFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const selectedCategoryCity = categoryOnly && filter !== 'all' && CITY_ALIASES.some(({ id }) => id === filter)
    ? filter as Exclude<SearchCity, 'other'>
    : undefined;

  const resultEntries = useMemo(() => {
    let result = SEARCH_ENTRIES.filter((entry) => {
      if (combined) return entry.category === category && entry.city === city;
      if (cityOnly) return entry.city === city && (filter === 'all' || entry.category === filter);
      if (selectedCategoryCity) return entry.category === category && entry.city === selectedCategoryCity;
      if (categoryOnly && sortMode !== 'default') return entry.category === category;
      if (categoryOnly) return false;
      if (filter === 'all') return !query || `${entry.listing.title} ${entry.listing.subtitle ?? ''}`.toLowerCase().includes(query);
      return entry.category === filter || entry.city === filter;
    });

    if (sortMode === 'rating') result = [...result].sort((a, b) => b.listing.rating - a.listing.rating);
    if (sortMode === 'nearby') result = [...result].sort((a, b) => a.listing.distanceKm - b.listing.distanceKm);
    return result;
  }, [category, categoryOnly, city, cityOnly, combined, filter, query, selectedCategoryCity, sortMode]);

  const [cityWindowStart, setCityWindowStart] = useState(0);

  useEffect(() => {
    if (!categoryOnly) return undefined;
    const timer = window.setInterval(() => {
      setCityWindowStart((current) => (current + 1) % CITY_ALIASES.length);
    }, 10000);
    return () => window.clearInterval(timer);
  }, [categoryOnly]);

  const visibleCityAliases = CITY_ALIASES.map((_, index) => CITY_ALIASES[(cityWindowStart + index) % CITY_ALIASES.length]).slice(0, 3);

  const chipClass = (active: boolean) => `shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-medium transition sm:px-3 sm:py-1.5 sm:text-[10px] ${active ? 'border-brand-blue bg-brand-blue text-white' : 'border-border bg-bg-card text-text-muted hover:border-brand-blue/50 hover:text-text-primary'}`;

  function chooseCity(cityId: Exclude<SearchCity, 'other'>) {
    setFilter(cityId);
    setSortMode('default');
  }

  return (
    <div className="mx-auto max-w-7xl py-3 sm:py-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-text-primary">{t('search_title')}</h1>
          <p className="mt-1 text-[11px] text-text-muted">{rawQuery ? `${t('search_results_for')} “${rawQuery}”` : t('search_all_results')}</p>
        </div>
        {(!categoryOnly || selectedCategoryCity) && <span className="text-[10px] text-text-faint">{resultEntries.length} {t('search_matches')}</span>}
      </div>

      {categoryOnly && (
        <section aria-label={t('search_city_results')} className="mb-4 border-b border-border pb-2">
          <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
            <button type="button" onClick={() => { setFilter('all'); setSortMode('default'); }} className={chipClass(filter === 'all' && sortMode === 'default')}>{t('search_all')}</button>
            <button type="button" onClick={() => { setFilter('all'); setSortMode('rating'); }} className={chipClass(sortMode === 'rating')}>{t('search_rating')}</button>
            <button type="button" onClick={() => { setFilter('all'); setSortMode('nearby'); }} className={chipClass(sortMode === 'nearby')}>{t('search_nearby')}</button>
            <div className="flex min-w-0 shrink-0 gap-1.5" key={cityWindowStart}>
              {visibleCityAliases.map(({ id, key }) => (
                <button key={id} type="button" onClick={() => chooseCity(id)} className={chipClass(filter === id)}>{t(key)}</button>
              ))}
            </div>
          </div>
        </section>
      )}

      {cityOnly && (
        <div className="mb-4 flex gap-1.5 overflow-x-auto border-b border-border pb-2 scrollbar-hide">
          <button type="button" onClick={() => { setFilter('all'); setSortMode('default'); }} className={chipClass(filter === 'all' && sortMode === 'default')}>{t('search_all')}</button>
          <button type="button" onClick={() => { setFilter('all'); setSortMode('rating'); }} className={chipClass(sortMode === 'rating')}>{t('search_rating')}</button>
          <button type="button" onClick={() => { setFilter('all'); setSortMode('nearby'); }} className={chipClass(sortMode === 'nearby')}>{t('search_nearby')}</button>
          {CATEGORY_ALIASES.filter(({ id }) => !['plans', 'guides', 'blogs'].includes(id)).map(({ id, key }) => (
            <button key={id} type="button" onClick={() => { setFilter(id); setSortMode('default'); }} className={chipClass(filter === id)}>{t(key)}</button>
          ))}
        </div>
      )}

      {(combined || selectedCategoryCity) && (
        <div className="mb-4 flex gap-1.5 overflow-x-auto border-b border-border pb-2 scrollbar-hide">
          <button type="button" onClick={() => setSortMode('default')} className={chipClass(sortMode === 'default')}>{t('search_all')}</button>
          <button type="button" onClick={() => setSortMode('rating')} className={chipClass(sortMode === 'rating')}>{t('search_rating')}</button>
          <button type="button" onClick={() => setSortMode('nearby')} className={chipClass(sortMode === 'nearby')}>{t('search_nearby')}</button>
        </div>
      )}

      {(!categoryOnly || selectedCategoryCity || sortMode !== 'default') && (
        <>
          {(combined || selectedCategoryCity) && <p className="mb-3 text-[11px] text-text-muted">{filterLabel(category!, t)} · {filterLabel(combined ? city! : selectedCategoryCity!, t)}</p>}
          {resultEntries.length ? (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {resultEntries.map(({ listing }) => <ListingCard key={listing.id} listing={listing} size="md" />)}
            </div>
          ) : (
            <div className="rounded-card border border-dashed border-border p-10 text-center text-xs text-text-muted">{t('search_no_results')}</div>
          )}
        </>
      )}
    </div>
  );
}
