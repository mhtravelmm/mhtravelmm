import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  Clock3,
  Compass,
  Eye,
  Heart,
  Landmark,
  Leaf,
  Map as MapIcon,
  MapPin,
  Navigation,
  Search,
  Star,
  Utensils,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { TranslationKey } from '../../lib/i18n';
import { useLanguage } from '../../lib/i18n';
import type { Language } from '../../types';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';
import { TRAVEL_GUIDE_STORIES, type GuideCategory, type TravelGuideStory } from '../../data/travelGuideData';

const INITIAL_VISIBLE_GUIDES = 6;

type GuideFilter = 'all' | GuideCategory;
type Translate = (key: TranslationKey) => string;

const CATEGORY_LABELS: Record<GuideCategory, TranslationKey> = {
  myanmar: 'guide_category_myanmar',
  nature: 'guide_category_nature',
  adventure: 'guide_category_adventure',
  culture: 'guide_category_culture',
  food: 'guide_category_food',
  city_tour: 'guide_category_city',
};

const CATEGORY_FILTERS: { id: GuideFilter; labelKey: TranslationKey; icon: LucideIcon }[] = [
  { id: 'all', labelKey: 'guide_category_all', icon: BookOpen },
  { id: 'myanmar', labelKey: 'guide_category_myanmar', icon: MapIcon },
  { id: 'nature', labelKey: 'guide_category_nature', icon: Leaf },
  { id: 'adventure', labelKey: 'guide_category_adventure', icon: Compass },
  { id: 'culture', labelKey: 'guide_category_culture', icon: Landmark },
  { id: 'food', labelKey: 'guide_category_food', icon: Utensils },
  { id: 'city_tour', labelKey: 'guide_category_city', icon: Building2 },
];

function formatNumber(value: number, language: Language, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(language === 'mm' ? 'my-MM' : 'en-US', { maximumFractionDigits }).format(value);
}

function formatCompactCount(value: number, language: Language): string {
  return new Intl.NumberFormat(language === 'mm' ? 'my-MM' : 'en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatDate(value: string, language: Language): string {
  return new Intl.DateTimeFormat(language === 'mm' ? 'my-MM' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

function categoryLabel(guide: TravelGuideStory, t: Translate): string {
  return t(CATEGORY_LABELS[guide.category]);
}

function GuideMetrics({ guide, language, t, compact = false }: {
  guide: TravelGuideStory;
  language: Language;
  t: Translate;
  compact?: boolean;
}) {
  const iconSize = compact ? 11 : 14;
  return (
    <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-1 text-text-muted ${compact ? 'text-[9px] sm:text-[10px]' : 'text-xs'}`}>
      <span className="inline-flex items-center gap-1 text-status-rating" aria-label={`${formatNumber(guide.rating, language, 1)} rating`}>
        <Star size={iconSize} fill="currentColor" />
        <span>{formatNumber(guide.rating, language, 1)}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <MapPin size={iconSize} />
        <span>{formatNumber(guide.distanceKm, language, 1)} {t('guide_km_away')}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Eye size={iconSize} />
        <span>{formatCompactCount(guide.views, language)} {t('guide_views')}</span>
      </span>
    </div>
  );
}

function GuideCard({
  guide,
  language,
  t,
  onToggleFavorite,
}: {
  guide: TravelGuideStory;
  language: Language;
  t: Translate;
  onToggleFavorite: () => void;
}) {
  const title = guide.localizedTitle[language];
  const summary = guide.summary[language];

  return (
    <article className="group flex overflow-hidden rounded-xl border border-border bg-bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg md:flex-col">
      <div className="relative min-h-[154px] w-[36%] max-w-[142px] shrink-0 overflow-hidden sm:max-w-[160px] md:h-44 md:w-full md:max-w-none md:min-h-0">
        <Link to={`/travel-guide/${guide.id}`} className="absolute inset-0" aria-label={title}>
          <img
            src={guide.imageUrl}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-slate-950/10" />
        </Link>
        <span className="pointer-events-none absolute left-2 top-2 max-w-[calc(100%-3rem)] truncate rounded-full bg-[#061b2a]/85 px-2 py-1 text-[9px] font-semibold text-white backdrop-blur sm:left-3 sm:top-3 sm:text-[10px]">
          {categoryLabel(guide, t)}
        </span>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={guide.isFavorited ? t('guide_remove_favorite') : t('guide_save_favorite')}
          aria-pressed={guide.isFavorited}
          className={`absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/30 shadow-sm backdrop-blur transition sm:right-3 sm:top-3 ${guide.isFavorited ? 'bg-rose-500 text-white' : 'bg-slate-950/45 text-white hover:bg-rose-500'}`}
        >
          <Heart size={15} fill={guide.isFavorited ? 'currentColor' : 'none'} />
        </button>
        <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-slate-950/70 px-2 py-1 text-[9px] text-white backdrop-blur sm:bottom-3 sm:left-3 sm:text-[10px]">
          <CalendarDays size={11} />
          {formatDate(guide.publishedAt, language)}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-3.5 md:p-4">
        <Link to={`/travel-guide/${guide.id}`} className="line-clamp-2 text-[13px] font-bold leading-snug text-text-primary transition hover:text-brand-blue sm:text-sm md:text-base">
          {title}
        </Link>
        <p className="mt-1.5 line-clamp-2 text-[10px] leading-relaxed text-text-secondary sm:text-[11px] md:text-xs">
          {summary}
        </p>
        <div className="mt-auto pt-2.5">
          <GuideMetrics guide={guide} language={language} t={t} compact />
          <Link
            to={`/travel-guide/${guide.id}`}
            className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-brand-blue transition hover:gap-2.5 sm:text-[11px]"
          >
            {t('guide_view_guide')}
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </article>
  );
}

function GuideDetail({
  guide,
  language,
  t,
  onToggleFavorite,
}: {
  guide: TravelGuideStory;
  language: Language;
  t: Translate;
  onToggleFavorite: () => void;
}) {
  const title = guide.localizedTitle[language];

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-4 md:space-y-6">
      <Link to="/travel-guide" className="inline-flex items-center gap-2 rounded-lg px-1 py-1.5 text-xs font-semibold text-text-secondary transition hover:text-brand-blue sm:text-sm">
        <ArrowLeft size={16} />
        {t('guide_back')}
      </Link>

      <section className="relative isolate min-h-[190px] overflow-hidden rounded-2xl bg-slate-950 md:min-h-[280px]">
        <img src={guide.imageUrl} alt={title} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/10" />
        <div className="relative flex min-h-[190px] items-end justify-between gap-4 p-4 sm:p-6 md:min-h-[280px] md:p-9">
          <div className="max-w-3xl text-white">
            <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-semibold backdrop-blur sm:text-xs">
              {categoryLabel(guide, t)}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-white/85 sm:text-sm md:text-base">{guide.summary[language]}</p>
          </div>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={guide.isFavorited ? t('guide_remove_favorite') : t('guide_save_favorite')}
            aria-pressed={guide.isFavorited}
            className={`mb-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/30 text-white backdrop-blur transition ${guide.isFavorited ? 'bg-rose-500' : 'bg-slate-950/45 hover:bg-rose-500'}`}
          >
            <Heart size={18} fill={guide.isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-6">
        <section className="rounded-2xl border border-border bg-bg-card p-4 sm:p-5 md:p-6">
          <div className="flex items-center gap-2 text-brand-blue">
            <Navigation size={18} />
            <h2 className="text-base font-bold text-text-primary sm:text-lg">{t('guide_itinerary')}</h2>
          </div>
          <p className="mt-1 text-xs text-text-muted sm:text-sm">{t('guide_itinerary_intro')}</p>
          <div className="mt-5 space-y-0">
            {guide.stops.map((stop, index) => (
              <div key={`${stop.time}-${stop.place}`} className="relative grid grid-cols-[56px_18px_minmax(0,1fr)] gap-2 sm:grid-cols-[68px_20px_minmax(0,1fr)] sm:gap-3">
                <div className="pt-1 text-[11px] font-bold tabular-nums text-brand-blue sm:text-xs">{stop.time}</div>
                <div className="relative flex justify-center">
                  <span className="z-10 mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-brand-blue bg-bg-card" />
                  {index < guide.stops.length - 1 && <span className="absolute bottom-0 top-4 w-px bg-border" />}
                </div>
                <div className={`pb-5 ${index === guide.stops.length - 1 ? 'pb-0' : ''}`}>
                  <h3 className="text-sm font-semibold leading-snug text-text-primary sm:text-base">{stop.title[language]}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary sm:text-sm">{stop.description[language]}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.place)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold text-brand-blue hover:underline sm:text-xs"
                  >
                    <MapPin size={13} />
                    {t('guide_directions')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-border bg-bg-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
            <span className="text-xs font-semibold text-text-muted">{t('guide_duration')}</span>
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-text-primary">
              <Clock3 size={15} className="text-brand-blue" />
              {guide.duration[language]}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 py-4">
            <div className="rounded-xl bg-bg-cardAlt p-3">
              <span className="text-[10px] text-text-muted">{t('blog_rating')}</span>
              <span className="mt-1 flex items-center gap-1 text-sm font-bold text-text-primary">
                <Star size={14} className="text-status-rating" fill="currentColor" />
                {formatNumber(guide.rating, language, 1)}
              </span>
            </div>
            <div className="rounded-xl bg-bg-cardAlt p-3">
              <span className="text-[10px] text-text-muted">{t('guide_views')}</span>
              <span className="mt-1 flex items-center gap-1 text-sm font-bold text-text-primary">
                <Eye size={14} className="text-brand-blue" />
                {formatCompactCount(guide.views, language)}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2 border-t border-border pt-4">
            <BookOpen size={15} className="mt-0.5 shrink-0 text-brand-blue" />
            <div>
              <p className="text-[10px] text-text-muted">{t('guide_author')}</p>
              <p className="mt-0.5 text-sm font-semibold text-text-primary">{guide.author[language]}</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2">
            <MapPin size={15} className="mt-0.5 shrink-0 text-brand-blue" />
            <div>
              <p className="text-[10px] text-text-muted">{t('guide_directions')}</p>
              <p className="mt-0.5 text-sm font-semibold text-text-primary">{formatNumber(guide.distanceKm, language, 1)} {t('guide_km_away')}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function TravelGuidePage() {
  const { guideId } = useParams<{ guideId?: string }>();
  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<GuideFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_GUIDES);
  const favoriteState = useToggleFavorite(TRAVEL_GUIDE_STORIES);

  const favoriteById = useMemo(() => new Map(favoriteState.listings.map((guide) => [guide.id, guide.isFavorited])), [favoriteState.listings]);
  const guideWithFavorite = (guide: TravelGuideStory): TravelGuideStory => ({
    ...guide,
    isFavorited: favoriteById.get(guide.id) ?? guide.isFavorited,
  });

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_GUIDES);
  }, [activeCategory, searchQuery]);

  const filteredGuides = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
    return TRAVEL_GUIDE_STORIES.filter((guide) => {
      const matchesCategory = activeCategory === 'all'
        || activeCategory === 'myanmar'
        || guide.category === activeCategory;
      const matchesQuery = !normalizedQuery || [
        guide.localizedTitle.mm,
        guide.localizedTitle.en,
        guide.summary.mm,
        guide.summary.en,
        guide.author.mm,
        guide.author.en,
      ].join(' ').toLocaleLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  const selectedGuide = guideId ? TRAVEL_GUIDE_STORIES.find((guide) => guide.id === guideId) : undefined;

  if (guideId) {
    if (!selectedGuide) {
      return (
        <div className="mx-auto flex min-h-[45vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
          <MapIcon className="text-brand-blue" size={32} />
          <h1 className="mt-3 text-xl font-bold text-text-primary">{t('guide_detail_not_found')}</h1>
          <Link to="/travel-guide" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white">
            <ArrowLeft size={15} />
            {t('guide_back')}
          </Link>
        </div>
      );
    }

    const guide = guideWithFavorite(selectedGuide);
    return <GuideDetail guide={guide} language={language} t={t} onToggleFavorite={() => favoriteState.toggle(guide.id)} />;
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-4 sm:space-y-5 md:space-y-6">
      <section className="relative isolate min-h-[176px] overflow-hidden rounded-2xl bg-slate-950 sm:min-h-[210px] md:min-h-[245px]">
        <img
          src="/images/blog/shwedagon-evening.webp"
          alt="Shwedagon Pagoda glowing at dusk in Yangon"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-slate-950/10" />
        <div className="relative flex min-h-[176px] max-w-3xl flex-col items-start justify-center px-4 py-5 text-white sm:min-h-[210px] sm:px-7 md:min-h-[245px] md:px-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[9px] font-semibold tracking-wide text-cyan-100 backdrop-blur sm:text-[10px]">
            <BookOpen size={12} />
            {t('guide_page_title')}
          </span>
          <h1 className="mt-2.5 text-2xl font-extrabold leading-tight sm:mt-3 sm:text-3xl md:text-4xl">{t('guide_hero_subtitle')}</h1>
          <p className="mt-2 max-w-2xl text-[11px] leading-relaxed text-white/85 sm:text-sm md:text-base">{t('guide_hero_description')}</p>
          <a href="#guide-list" className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cyan-400 px-3.5 py-2 text-[10px] font-bold text-slate-950 shadow-lg transition hover:bg-cyan-300 sm:mt-4 sm:px-4 sm:text-xs">
            {t('guide_hero_explore')}
            <ArrowRight size={14} />
          </a>
        </div>
      </section>

      <section aria-label={t('guide_results_heading')}>
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
          {CATEGORY_FILTERS.map(({ id, labelKey, icon: Icon }) => {
            const active = activeCategory === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveCategory(id)}
                aria-pressed={active}
                className={`inline-flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-lg border px-1.5 py-1.5 text-[9px] font-semibold transition sm:min-h-10 sm:gap-1.5 sm:px-3 sm:text-[11px] ${active ? 'border-[#072135] bg-[#072135] text-white shadow-sm' : 'border-border bg-bg-card text-text-secondary hover:border-cyan-400 hover:text-text-primary'}`}
              >
                <Icon size={12} className="shrink-0 sm:h-[14px] sm:w-[14px]" />
                <span className="truncate">{t(labelKey)}</span>
              </button>
            );
          })}
          <label className="relative col-span-2 block min-w-0 sm:ml-auto sm:w-64 sm:flex-none">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('guide_search_placeholder')}
              className="h-9 w-full rounded-lg border border-border bg-bg-card pl-9 pr-3 text-[10px] text-text-primary outline-none transition placeholder:text-text-muted focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 sm:h-10 sm:text-xs"
            />
          </label>
        </div>
      </section>

      <section id="guide-list" className="scroll-mt-24">
        <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-blue sm:text-[10px]">{t('guide_page_title')}</p>
            <h2 className="mt-0.5 text-base font-extrabold text-text-primary sm:text-lg md:text-xl">{t('guide_results_heading')}</h2>
          </div>
          <button
            type="button"
            onClick={() => { setActiveCategory('all'); setSearchQuery(''); setVisibleCount(TRAVEL_GUIDE_STORIES.length); }}
            className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-brand-blue hover:underline sm:text-xs"
          >
            {t('view_all')}
            <ArrowRight size={13} />
          </button>
        </div>

        {filteredGuides.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3.5 lg:grid-cols-3 lg:gap-4">
              {filteredGuides.slice(0, visibleCount).map((guide) => (
                <GuideCard
                  key={guide.id}
                  guide={guideWithFavorite(guide)}
                  language={language}
                  t={t}
                  onToggleFavorite={() => favoriteState.toggle(guide.id)}
                />
              ))}
            </div>
            {visibleCount < filteredGuides.length && (
              <div className="mt-5 flex justify-center sm:mt-7">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE_GUIDES)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-card px-4 py-2.5 text-xs font-semibold text-text-primary transition hover:border-cyan-400 hover:text-brand-blue sm:px-5 sm:text-sm"
                >
                  {t('guide_load_more')}
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-bg-card px-4 py-10 text-center">
            <Compass className="mx-auto text-text-muted" size={26} />
            <h3 className="mt-3 text-sm font-bold text-text-primary sm:text-base">{t('guide_empty_title')}</h3>
            <p className="mt-1 text-xs text-text-muted sm:text-sm">{t('guide_empty_detail')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
