import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Search as SearchIcon, X } from 'lucide-react';
import { ListingCard } from '../../components/ui/ListingCard';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { cardGridStyle } from '../../lib/cardGrid';
import {
  CITY_IDS,
  SUGGEST_MIN_LENGTH,
  clearRecentSearches,
  readRecentSearches,
  rememberSearch,
  suggest,
  type SearchCityId,
  type SearchKind,
  type SearchResult,
  type SearchSort,
} from '../../lib/searchIndex';
import { runSearch, runSuggest } from '../../lib/searchApi';
import { logSearch, logSearchClick } from '../../lib/searchLog';
import type { ErrorCode } from '../../lib/backend';
import {
  CITY_CENTERS,
  FALLBACK_LOCATION,
  LOCATION_CITY_IDS,
  cityCenter,
  readLocation,
  rememberLocation,
  requestGps,
  type ReaderLocation,
} from '../../lib/location';
import type { CardListing } from '../../types';

/**
 * Plan §16H, ticket O-50. The page holds no matching rule of its own: `searchApi`
 * answers from `search_all` when the flag is on and from the seeded preview
 * otherwise, and both arrive as one `SearchResult`. What lives here is the page
 * behaviour of §16H.10 — the debounce, the suggestion list, the recent
 * searches, the URL state, the interpreted chips and the zero-result offer.
 */

const DEBOUNCE_MS = 250;
const CITY_WINDOW_MS = 10000;
const CITY_WINDOW_SIZE = 3;

const KIND_KEYS: Record<SearchKind, TranslationKey> = {
  hotels: 'search_hotels',
  guesthouses: 'search_guesthouses',
  restaurants: 'search_restaurants',
  bookshops: 'search_bookshops',
  cafes: 'search_cafes',
  bars: 'search_bars',
  exchange: 'search_exchange',
  hospitals: 'search_hospitals',
  clinics: 'search_clinics',
  gyms: 'search_gyms',
  rentals: 'search_rentals',
  attractions: 'search_attractions',
  markets: 'search_markets',
  transport: 'search_transport',
  plans: 'search_plans',
  guides: 'search_guides',
  blogs: 'search_blogs',
  cities: 'search_cities',
};

const CITY_KEYS: Record<string, TranslationKey> = {
  yangon: 'search_yangon',
  bago: 'search_bago',
  naypyidaw: 'search_naypyidaw',
  mandalay: 'search_mandalay',
  bagan: 'search_bagan',
  inle: 'search_inle',
};

const SORT_KEYS: Record<SearchSort, TranslationKey> = {
  relevance: 'search_sort_relevance',
  rating: 'search_sort_rating',
  nearest: 'search_sort_nearest',
  newest: 'search_sort_newest',
};

/** §16H.7: `newest` only means something for writing, so a browse does not offer it. */
const SORTS_FOR_MODE: Record<SearchResult['interpreted']['mode'], SearchSort[]> = {
  browse: ['relevance', 'rating', 'nearest'],
  city: ['relevance', 'rating', 'nearest'],
  category: ['relevance', 'rating', 'nearest'],
  city_category: ['relevance', 'rating', 'nearest'],
  text: ['relevance', 'rating', 'nearest', 'newest'],
};

/** §16H.6: the categories a city result narrows to, in chip order. */
const BROWSE_KINDS: SearchKind[] = [
  'hotels', 'restaurants', 'bookshops', 'cafes', 'rentals', 'attractions', 'markets', 'transport',
];

const POPULAR_KINDS: SearchKind[] = ['hotels', 'restaurants', 'attractions', 'markets'];

const chipClass = (active: boolean) =>
  `shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-medium transition sm:px-3 sm:py-1.5 sm:text-[10px] ${
    active
      ? 'border-brand-blue bg-brand-blue text-white'
      : 'border-border bg-bg-card text-text-muted hover:border-brand-blue/50 hover:text-text-primary'
  }`;

function toListing(hit: SearchResult['hits'][number]): CardListing {
  return {
    id: hit.id,
    title: hit.title,
    subtitle: hit.subtitle || undefined,
    imageUrl: hit.imageUrl,
    rating: hit.rating,
    distanceKm: hit.distanceKm,
    isFavorited: false,
    views: hit.views,
    priceUsd: hit.priceUsd,
    href: hit.href,
  };
}

/** §16H.9: the panel says which of the three points the distances come from. */
function locationStatus(source: ReaderLocation['source'], t: (key: TranslationKey) => string): string {
  if (source === 'gps') return t('search_location_gps');
  if (source === 'manual') return t('search_location_manual');
  return t('search_location_fallback');
}

function samePoint(a: { lat: number; lng: number }, b: { lat: number; lng: number }): boolean {
  return Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;
}

export function SearchPage() {
  const { t, language } = useLanguage();
  const [params, setParams] = useSearchParams();

  const q = params.get('q') ?? '';
  const city = params.get('city') ?? '';
  const kind = params.get('kind') ?? '';
  const sort = (params.get('sort') ?? 'relevance') as SearchSort;

  const [draft, setDraft] = useState(q);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [recent, setRecent] = useState<string[]>(() => readRecentSearches());
  const [location, setLocation] = useState<ReaderLocation>(() => readLocation() ?? FALLBACK_LOCATION);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [problem, setProblem] = useState<ErrorCode | null>(null);
  const composing = useRef(false);
  const cityWindow = useRef(0);
  /** The `search_log` row the next card click belongs to (§16H.11). */
  const lastLogId = useRef<string | null>(null);
  const [cityTick, setCityTick] = useState(0);

  /**
   * One writer for the URL: §16H.10 keeps `?q=&city=&kind=&sort=`, so a shared
   * link and a reload give the same page. An empty value drops its parameter,
   * which keeps a copied link short.
   */
  const writeParams = useCallback(
    (next: { q?: string; city?: string; kind?: string; sort?: SearchSort }) => {
      const merged = { q, city, kind, sort: sort as string, ...next };
      const search = new URLSearchParams();
      if (merged.q) search.set('q', merged.q);
      if (merged.city) search.set('city', merged.city);
      if (merged.kind) search.set('kind', merged.kind);
      if (merged.sort && merged.sort !== 'relevance') search.set('sort', merged.sort);
      setParams(search, { replace: true });
    },
    [city, kind, q, setParams, sort],
  );

  // §16H.9: GPS is asked for silently, and a refusal leaves the Yangon centre.
  useEffect(() => {
    if (readLocation()) return undefined;
    let active = true;
    void requestGps().then((point) => {
      if (!active || !point) return;
      const next: ReaderLocation = { point, source: 'gps' };
      rememberLocation(next);
      setLocation(next);
    });
    return () => {
      active = false;
    };
  }, []);

  // §16H.10: the draft is committed after 250 ms, and never mid-composition.
  useEffect(() => {
    if (draft === q) return undefined;
    const timer = window.setTimeout(() => {
      if (composing.current) return;
      writeParams({ q: draft.trim() });
      if (draft.trim()) setRecent(rememberSearch(draft.trim()));
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draft, q, writeParams]);

  // A query arriving from the header, a shared link or a recent chip fills the box.
  useEffect(() => {
    setDraft(q);
  }, [q]);

  useEffect(() => {
    let active = true;
    setProblem(null);
    void runSearch({
      q,
      city: city || undefined,
      kind: kind || undefined,
      sort,
      lat: location.point.lat,
      lng: location.point.lng,
      lang: language,
    }).then((outcome) => {
      if (!active) return;
      if (!outcome.ok) {
        setProblem(outcome.code);
        setResult(null);
        return;
      }
      setResult(outcome.result);
      // §16H.11: one row per settled search, and its id is what a later click
      // names. A refusal is not logged: nobody searched for an error.
      if (outcome.result.interpreted.text || outcome.result.hits.length > 0) {
        void logSearch({
          q: outcome.result.interpreted.text || q,
          lang: language,
          kind: outcome.result.interpreted.kind,
          resultCount: outcome.result.hits.length,
        }).then((id) => {
          if (active) lastLogId.current = id;
        });
      }
    });
    return () => {
      active = false;
    };
  }, [city, kind, language, location.point.lat, location.point.lng, q, sort]);

  const suggestions = useMemo(
    () => (suggestOpen && [...draft.trim()].length >= SUGGEST_MIN_LENGTH ? suggest(draft) : []),
    [draft, suggestOpen],
  );

  // §16H.8: `search_suggest()` sees the alias table, so an alias an Admin added
  // is offered before the page's own seed knows it. The seeded list above paints
  // at once and this replaces it when the function answers, so the field never
  // waits on a round trip to show something.
  const [remoteSuggestions, setRemoteSuggestions] = useState<string[] | null>(null);
  useEffect(() => {
    if (!suggestOpen || [...draft.trim()].length < SUGGEST_MIN_LENGTH) {
      setRemoteSuggestions(null);
      return undefined;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      void runSuggest(draft, language).then((rows) => {
        if (active) setRemoteSuggestions(rows);
      });
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [draft, suggestOpen, language]);
  const suggestionList = remoteSuggestions && remoteSuggestions.length > 0 ? remoteSuggestions : suggestions;

  // §16H.6: a category-only query rotates the city chips every 10 seconds.
  const mode = result?.interpreted.mode ?? 'browse';
  const categoryOnly = mode === 'category';

  useEffect(() => {
    if (!categoryOnly) return undefined;
    const timer = window.setInterval(() => {
      cityWindow.current += 1;
      setCityTick((tick) => tick + 1);
    }, CITY_WINDOW_MS);
    return () => window.clearInterval(timer);
  }, [categoryOnly]);

  const rotatingCities = useMemo(() => {
    const start = cityWindow.current % CITY_IDS.length;
    return Array.from({ length: CITY_WINDOW_SIZE }, (_, offset) => CITY_IDS[(start + offset) % CITY_IDS.length]);
    // `cityTick` is the clock: the window moves when it changes. The start
    // offset lives in a ref, so the linter cannot see why this must re-run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityTick]);

  const interpreted = result?.interpreted;
  const chips = useMemo(() => {
    const list: { key: string; label: string; clear: () => void }[] = [];
    if (interpreted?.city) {
      list.push({
        key: `city-${interpreted.city}`,
        label: t(CITY_KEYS[interpreted.city] ?? 'search_all'),
        clear: () => writeParams({ city: '' }),
      });
    }
    if (interpreted?.kind) {
      list.push({
        key: `kind-${interpreted.kind}`,
        label: t(KIND_KEYS[interpreted.kind]),
        clear: () => writeParams({ kind: '' }),
      });
    }
    return list;
  }, [interpreted, t, writeParams]);

  const hits = result?.hits ?? [];
  const counts = result?.counts;

  function chooseSuggestion(text: string) {
    setSuggestOpen(false);
    setActiveSuggestion(-1);
    setDraft(text);
    writeParams({ q: text });
    setRecent(rememberSearch(text));
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setSuggestOpen(false);
      setActiveSuggestion(-1);
      return;
    }
    if (!suggestionList.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion((index) => (index + 1) % suggestionList.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion((index) => (index <= 0 ? suggestionList.length - 1 : index - 1));
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault();
      chooseSuggestion(suggestionList[activeSuggestion]);
    }
  }

  const sorts = SORTS_FOR_MODE[mode] ?? SORTS_FOR_MODE.text;

  return (
    <div className="mx-auto max-w-7xl py-3 sm:py-4">
      <h1 className="text-lg font-medium text-text-primary">{t('search_title')}</h1>

      <div className="relative mt-2">
        <label className="flex items-center gap-2 rounded-lg border border-border bg-bg-card px-3 py-2">
          <SearchIcon size={15} className="shrink-0 text-brand-blue" />
          <input
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setSuggestOpen(true);
              setActiveSuggestion(-1);
            }}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
            }}
            onFocus={() => setSuggestOpen(true)}
            onBlur={() => window.setTimeout(() => setSuggestOpen(false), 150)}
            onKeyDown={onKeyDown}
            placeholder={t('search_results_placeholder')}
            aria-label={t('search_results_placeholder')}
            role="combobox"
            aria-expanded={suggestionList.length > 0}
            aria-controls="search-suggestions"
            className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-faint focus:outline-none"
          />
          {draft && (
            <button
              type="button"
              onClick={() => {
                setDraft('');
                writeParams({ q: '' });
              }}
              aria-label={t('search_clear')}
              className="shrink-0 text-text-faint hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </label>

        {suggestionList.length > 0 && (
          <ul
            id="search-suggestions"
            role="listbox"
            aria-label={t('search_suggestions')}
            className="absolute left-0 right-0 top-full z-40 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-bg-card p-1 shadow-xl"
          >
            {suggestionList.map((text, index) => (
              <li key={text} role="option" aria-selected={index === activeSuggestion}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseSuggestion(text)}
                  className={`w-full rounded px-2 py-1.5 text-left text-[11px] ${
                    index === activeSuggestion ? 'bg-brand-blue/10 text-brand-blue' : 'text-text-primary hover:bg-bg-cardAlt'
                  }`}
                >
                  {text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!draft && recent.length > 0 && (
        <section aria-label={t('search_recent')} className="mt-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-medium text-text-muted">{t('search_recent')}</p>
            <button
              type="button"
              onClick={() => setRecent(clearRecentSearches())}
              className="text-[10px] text-text-faint underline hover:text-text-primary"
            >
              {t('search_recent_clear')}
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {recent.map((text) => (
              <button key={text} type="button" onClick={() => chooseSuggestion(text)} className={chipClass(false)}>
                {text}
              </button>
            ))}
          </div>
        </section>
      )}

      <section aria-label={t('search_location_label')} className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="flex items-center gap-1 text-[10px] text-text-muted">
          <MapPin size={11} />
          {t('search_location_label')}:
          <span className="text-text-primary">{locationStatus(location.source, t)}</span>
        </span>
        {LOCATION_CITY_IDS.map((id) => {
          const active = location.source === 'manual' && samePoint(location.point, cityCenter(id));
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                const next: ReaderLocation = { point: cityCenter(id), source: 'manual' };
                rememberLocation(next);
                setLocation(next);
              }}
              aria-pressed={active}
              className={chipClass(active)}
            >
              {t(CITY_CENTERS[id].labelKey as TranslationKey)}
            </button>
          );
        })}
      </section>

      {chips.length > 0 && (
        <section aria-label={t('search_interpreted')} className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-text-muted">{t('search_interpreted')}:</span>
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="flex items-center gap-1 rounded-full border border-brand-blue/40 bg-brand-blue/10 px-2.5 py-1 text-[9px] text-brand-blue sm:text-[10px]"
            >
              {chip.label}
              <X size={9} aria-label={t('search_remove_chip')} />
            </button>
          ))}
        </section>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 overflow-x-auto border-b border-border pb-2">
        {sorts.map((sortMode) => (
          <button
            key={sortMode}
            type="button"
            onClick={() => writeParams({ sort: sortMode })}
            aria-pressed={sort === sortMode}
            className={chipClass(sort === sortMode)}
          >
            {t(SORT_KEYS[sortMode])}
          </button>
        ))}
        {mode === 'city' && <span className="mx-1 h-4 w-px bg-border" aria-hidden />}
        {mode === 'city' &&
          BROWSE_KINDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => writeParams({ kind: kind === id ? '' : id })}
              aria-pressed={kind === id}
              className={chipClass(kind === id)}
            >
              {t(KIND_KEYS[id])}
              {counts ? ` (${counts[id]})` : ''}
            </button>
          ))}
      </div>

      {problem && (
        <div role="alert" className="mt-4 rounded-card border border-dashed border-border p-6 text-center text-xs text-text-muted">
          {t(problem)}
        </div>
      )}

      {!problem && result && (
        categoryOnly ? (
          <CityCards result={result} onChoose={(id) => writeParams({ city: id })} rotating={rotatingCities} />
        ) : hits.length > 0 ? (
          <>
            <p className="mt-3 text-[10px] text-text-faint">
              {hits.length} {t('search_matches')}
            </p>
            <div
              className="mt-2 grid grid-cols-2 justify-items-center gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
              style={cardGridStyle(5, 'md')}
            >
              {hits.map((hit) => (
                <div
                  key={`${hit.kind}-${hit.id}`}
                  onClickCapture={() => void logSearchClick(lastLogId.current, `${hit.kind}:${hit.id}`)}
                >
                  <ListingCard listing={toListing(hit)} size="md" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <NoResults
            didYouMean={result.didYouMean}
            onPick={chooseSuggestion}
            onCity={(id) => writeParams({ city: id })}
            onKind={(id) => writeParams({ kind: id })}
          />
        )
      )}
    </div>
  );
}

/**
 * §16H.6: a category-only query shows one card per city that has matches, so the
 * reader picks a city instead of scrolling a long list. The counts come from
 * `city_counts`, so a card never promises more than the drill-down shows.
 */
function CityCards({
  result,
  onChoose,
  rotating,
}: {
  result: SearchResult;
  onChoose: (city: SearchCityId) => void;
  rotating: string[];
}) {
  const { t } = useLanguage();
  return (
    <div className="mt-3">
      <p className="text-[10px] text-text-muted">{t('search_cities_only')}</p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {result.cityCounts.map((entry) => (
          <button
            key={entry.city}
            type="button"
            onClick={() => onChoose(entry.city)}
            aria-label={`${t(CITY_KEYS[entry.city] ?? 'search_all')} · ${entry.count}`}
            className={`rounded-card border bg-bg-card p-3 text-left transition hover:border-brand-blue/50 ${
              rotating.includes(entry.city) ? 'border-brand-blue/40' : 'border-border'
            }`}
          >
            <span className="block text-xs text-text-primary">{t(CITY_KEYS[entry.city] ?? 'search_all')}</span>
            <span className="mt-0.5 block text-[10px] text-text-faint">
              {t('search_city_card_count').replace('{count}', String(entry.count))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** §16H.10: nothing matched, so offer the closest title, then cities and categories. */
function NoResults({
  didYouMean,
  onPick,
  onCity,
  onKind,
}: {
  didYouMean?: string;
  onPick: (text: string) => void;
  onCity: (city: string) => void;
  onKind: (kind: SearchKind) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="mt-4 rounded-card border border-dashed border-border p-6">
      <p className="text-center text-xs text-text-muted">{t('search_no_results')}</p>
      {didYouMean && (
        <p className="mt-3 text-center text-[11px] text-text-muted">
          {t('search_did_you_mean')}{' '}
          <button type="button" onClick={() => onPick(didYouMean)} className="font-medium text-brand-blue underline">
            {didYouMean}
          </button>
        </p>
      )}
      <p className="mt-4 text-center text-[10px] font-medium text-text-muted">{t('search_popular_cities')}</p>
      <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
        {LOCATION_CITY_IDS.map((id) => (
          <button key={id} type="button" onClick={() => onCity(id)} className={chipClass(false)}>
            {t(CITY_CENTERS[id].labelKey as TranslationKey)}
          </button>
        ))}
      </div>
      <p className="mt-4 text-center text-[10px] font-medium text-text-muted">{t('search_popular_categories')}</p>
      <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
        {POPULAR_KINDS.map((id) => (
          <button key={id} type="button" onClick={() => onKind(id)} className={chipClass(false)}>
            {t(KIND_KEYS[id])}
          </button>
        ))}
      </div>
    </div>
  );
}
