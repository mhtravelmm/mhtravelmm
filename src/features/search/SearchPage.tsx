import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListingCard } from '../../components/ui/ListingCard';
import {
  BLOGS,
  POPULARS,
  TRAVEL_GUIDES,
  TRAVEL_PLANS,
} from '../../data/homeData';
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
type SearchCity = 'yangon' | 'naypyidaw' | 'mandalay' | 'bagan' | 'other';
type ResultFilter = 'all' | ResultCategory | Exclude<SearchCity, 'other'>;

type SearchEntry = {
  listing: CardListing;
  category: ResultCategory;
  city: SearchCity;
};

const entries = (listing: CardListing, category: ResultCategory, city: SearchEntry['city'] = 'yangon'): SearchEntry => ({ listing, category, city });

const SEARCH_ENTRIES: SearchEntry[] = [
  ...TRAVEL_PLANS.map((item) => entries(item, 'plans', 'yangon')),
  ...TRAVEL_GUIDES.map((item) => entries(item, 'guides', 'yangon')),
  ...BLOGS.map((item) => entries(item, 'blogs', 'yangon')),
  ...POPULARS.map((item) => entries(item, item.href?.includes('/hotels/') ? 'hotels' : item.href?.includes('/book-shops/') ? 'bookshops' : 'markets', 'yangon')),
  ...CITIES.map((item) => entries(item, 'attractions', item.id === 'yangon' ? 'yangon' : item.id === 'bagan' ? 'bagan' : item.id === 'mandalay' ? 'mandalay' : 'other')),
  ...TOP_ATTRACTIONS.map((item) => entries(item, 'attractions', item.title.toLowerCase().includes('bein') ? 'mandalay' : 'yangon')),
  ...POPULAR_HOTELS.map((item) => entries(item, 'hotels', 'yangon')),
  ...POPULAR_RESTAURANTS.map((item) => entries(item, 'restaurants', 'yangon')),
  ...POPULAR_BOOK_SHOPS.map((item) => entries(item, 'bookshops', 'yangon')),
  ...POPULAR_RENTALS.map((item) => entries(item, 'rentals', 'yangon')),
  ...POPULAR_CAFES.map((item) => entries(item, 'cafes', 'yangon')),
  ...POPULAR_MARKETS.map((item) => entries(item, 'markets', 'yangon')),
  ...POPULAR_TRANSPORT.map((item) => entries(item, 'transport', item.title.toLowerCase().includes('inle') ? 'bagan' : 'yangon')),
];

const CATEGORY_FILTERS: { id: ResultCategory; key: TranslationKey }[] = [
  { id: 'plans', key: 'search_plans' },
  { id: 'guides', key: 'search_guides' },
  { id: 'blogs', key: 'search_blogs' },
  { id: 'hotels', key: 'search_hotels' },
  { id: 'restaurants', key: 'search_restaurants' },
  { id: 'bookshops', key: 'search_bookshops' },
  { id: 'cafes', key: 'search_cafes' },
  { id: 'rentals', key: 'search_rentals' },
  { id: 'attractions', key: 'search_attractions' },
  { id: 'markets', key: 'search_markets' },
];

const CITY_FILTERS: { id: Extract<ResultFilter, 'yangon' | 'naypyidaw' | 'mandalay' | 'bagan'>; key: TranslationKey }[] = [
  { id: 'yangon', key: 'search_yangon' },
  { id: 'naypyidaw', key: 'search_naypyidaw' },
  { id: 'mandalay', key: 'search_mandalay' },
  { id: 'bagan', key: 'search_bagan' },
];

function normalizeSearchTerm(value: string) {
  const term = value.trim().toLowerCase();
  if (term === 'ရန်ကုန်') return 'yangon';
  if (term === 'နေပြည်တော်') return 'naypyidaw';
  if (term === 'မန္တလေး') return 'mandalay';
  if (term === 'ပုဂံ') return 'bagan';
  if (term === 'စားသောက်ဆိုင်' || term === 'စားသောက်ဆိုင်များ') return 'restaurants';
  if (term === 'ဟိုတယ်' || term === 'ဟိုတယ်များ') return 'hotels';
  if (term === 'ကဖေး' || term === 'ကဖေးများ') return 'cafes';
  if (term === 'စာအုပ်ဆိုင်' || term === 'စာအုပ်ဆိုင်များ') return 'bookshops';
  return term;
}

function matchesQuery(entry: SearchEntry, query: string) {
  const term = normalizeSearchTerm(query);
  if (!term) return true;
  const haystack = `${entry.listing.title} ${entry.listing.subtitle ?? ''} ${entry.category} ${entry.city}`.toLowerCase();
  return haystack.includes(term === 'restaurant' ? 'restaurants' : term);
}

export function SearchPage() {
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const query = params.get('q')?.trim() ?? '';
  const [filter, setFilter] = useState<ResultFilter>('all');
  const categoryQuery = /hotel|restaurant|book|cafe|rental|attraction|market|plan|guide|blog|ticket|ဟိုတယ်|စားသောက်ဆိုင်|စာအုပ်ဆိုင်|ကဖေး|ငှားရမ်း|လည်ပတ်စရာ|ဈေး/i.test(query);
  const cityQuery = /yangon|ရန်ကုန်|naypyidaw|နေပြည်တော်|mandalay|မန္တလေး|bagan|ပုဂံ/i.test(query);

  const results = useMemo(() => SEARCH_ENTRIES.filter((entry) => {
    if (!matchesQuery(entry, query)) return false;
    if (filter === 'all') return true;
    return entry.category === filter || entry.city === filter;
  }), [filter, query]);

  const chipClass = (active: boolean) => `shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-medium transition sm:px-3 sm:py-1.5 sm:text-[10px] ${active ? 'border-brand-blue bg-brand-blue text-white' : 'border-border bg-bg-card text-text-muted hover:border-brand-blue/50 hover:text-text-primary'}`;

  return (
    <div className="mx-auto max-w-7xl py-3 sm:py-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-medium text-text-primary">{t('search_title')}</h1>
          <p className="mt-1 text-[11px] text-text-muted">
            {query ? `${t('search_results_for')} “${query}”` : t('search_all_results')}
          </p>
        </div>
        <span className="text-[10px] text-text-faint">{results.length} {t('search_matches')}</span>
      </div>

      <div className="space-y-2 rounded-card border border-border bg-bg-card/60 p-2.5">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide" aria-label={t('search_category_filters')}>
          <button type="button" onClick={() => setFilter('all')} className={chipClass(filter === 'all')}>{t('search_all')}</button>
          {CATEGORY_FILTERS.map(({ id, key }) => (
            <button key={id} type="button" onClick={() => setFilter(id)} className={chipClass(filter === id)}>{t(key)}</button>
          ))}
        </div>
        {(categoryQuery || cityQuery || query.length === 0) && (
          <div className="flex gap-1.5 overflow-x-auto border-t border-border/70 pt-2 scrollbar-hide" aria-label={t('search_city_filters')}>
            <span className="self-center pr-1 text-[9px] text-text-faint">{t('search_by_city')}</span>
            {CITY_FILTERS.map(({ id, key }) => (
              <button key={id} type="button" onClick={() => setFilter(id)} className={chipClass(filter === id)}>{t(key)}</button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-3 mt-5 flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-primary">{query ? `${t('search_results_for')} “${query}”` : t('search_all_results')}</h2>
        {filter !== 'all' && <button type="button" onClick={() => setFilter('all')} className="text-[10px] text-brand-blue">{t('search_clear_filter')}</button>}
      </div>

      {results.length ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {results.map(({ listing }) => <ListingCard key={listing.id} listing={listing} size="md" />)}
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-border p-10 text-center text-xs text-text-muted">{t('search_no_results')}</div>
      )}
    </div>
  );
}
