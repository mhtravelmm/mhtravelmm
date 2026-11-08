import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Eye,
  Heart,
  Landmark,
  LayoutGrid,
  MapPin,
  MoreHorizontal,
  Mountain,
  Send,
  Search,
  ShieldCheck,
  Share2,
  Star,
  Utensils,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AdSlot } from '../../components/ui/AdSlot';
import { ListingCard } from '../../components/ui/ListingCard';
import { fetchMockAd } from '../../data/ads';
import { BLOG_POSTS, type BlogBlock, type BlogCategory, type BlogPost } from '../../data/blogsData';
import { ADDITIONAL_BLOG_POSTS } from '../../data/additionalBlogPosts';
import { POPULAR_HOTELS } from '../../data/cityPageData';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';
import { useFavorites } from '../../lib/favorites';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import type { Language } from '../../types';

const VIEWS_STORAGE_KEY = 'mh-travel-blog-view-counts';

type SortMode = 'latest' | 'popular';
type CategoryFilter = 'all' | BlogCategory;
type Translate = (key: TranslationKey) => string;

const ALL_BLOG_POSTS = [...BLOG_POSTS, ...ADDITIONAL_BLOG_POSTS];

const CATEGORY_FILTERS: { id: CategoryFilter; labelKey: TranslationKey; icon: LucideIcon; tone: string; activeTone: string }[] = [
  { id: 'all', labelKey: 'blog_category_all', icon: LayoutGrid, tone: 'text-sky-300', activeTone: 'bg-sky-500' },
  { id: 'travel_tips', labelKey: 'blog_category_travel_tips', icon: Send, tone: 'text-sky-300', activeTone: 'bg-sky-500' },
  { id: 'nature', labelKey: 'blog_category_nature', icon: Mountain, tone: 'text-emerald-300', activeTone: 'bg-emerald-500' },
  { id: 'food', labelKey: 'blog_category_food', icon: Utensils, tone: 'text-amber-300', activeTone: 'bg-amber-500' },
  { id: 'health', labelKey: 'blog_category_health', icon: Heart, tone: 'text-pink-300', activeTone: 'bg-pink-500' },
  { id: 'culture', labelKey: 'blog_category_culture', icon: Landmark, tone: 'text-yellow-300', activeTone: 'bg-yellow-500' },
  { id: 'safety', labelKey: 'blog_category_safety', icon: ShieldCheck, tone: 'text-teal-300', activeTone: 'bg-teal-500' },
  { id: 'others', labelKey: 'blog_category_others', icon: MoreHorizontal, tone: 'text-slate-300', activeTone: 'bg-slate-500' },
];

function getLocalizedCopy(post: BlogPost, language: Language) {
  return { title: post.title[language], excerpt: post.excerpt[language] };
}

function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatNumber(value: number, language: Language, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat(language === 'mm' ? 'my-MM' : 'en-US', {
    maximumFractionDigits,
  }).format(value);
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

function getReadTime(minutes: number, language: Language, t: Translate): string {
  return t('blog_read_time').replace('{minutes}', formatNumber(minutes, language));
}

function StoryMetrics({
  post,
  views,
  language,
  t,
  showDistance = true,
  compact = false,
}: {
  post: BlogPost;
  views: number;
  language: Language;
  t: Translate;
  showDistance?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-text-muted ${compact ? 'text-[9px] sm:text-[10px]' : 'text-[11px]'}`}>
      <span className="inline-flex items-center gap-1 text-status-rating" aria-label={`${t('blog_rating')}: ${formatNumber(post.rating, language, 1)}`}>
        <Star size={compact ? 10 : 13} fill="currentColor" />
        <span>{formatNumber(post.rating, language, 1)}</span>
      </span>
      {showDistance && <span className="inline-flex items-center gap-1">
        <MapPin size={compact ? 10 : 13} />
        <span>
          {formatNumber(post.distanceKm, language, 1)} km {t('blog_away')}
        </span>
      </span>}
      <span className="inline-flex items-center gap-1">
        <Eye size={compact ? 10 : 13} />
        <span>{formatCompactCount(views, language)}</span>
      </span>
    </div>
  );
}

function StoryCard({
  post,
  language,
  t,
  views,
  isFavorited,
  onOpen,
  onToggleFavorite,
  onShare,
  showDistance,
}: {
  post: BlogPost;
  language: Language;
  t: Translate;
  views: number;
  isFavorited: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  showDistance: boolean;
}) {
  const copy = getLocalizedCopy(post, language);
  const category = CATEGORY_FILTERS.find((item) => item.id === post.category);
  const CategoryIcon = category?.icon ?? BookOpen;
  const categoryLabel = category ? t(category.labelKey) : '';
  const favoriteTotal = post.favoriteCount + (isFavorited ? 1 : 0);
  const publishedDate = formatDate(post.publishedAt, language);

  return (
    <article className="group flex min-w-0 overflow-hidden rounded-xl border border-border bg-bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand-blue/40 hover:shadow-lg hover:shadow-black/15 sm:flex-col">
      <div className="relative h-auto min-h-[126px] w-[98px] shrink-0 self-stretch overflow-hidden bg-bg-cardAlt sm:h-[140px] sm:min-h-0 sm:w-full sm:self-auto 2xl:h-[150px]">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${t('blog_read_story')}: ${copy.title}`}
          className="absolute inset-0 h-full w-full"
        >
          <img
            src={post.imageUrl}
            alt={copy.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </button>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/15" />
        {category && <span className="absolute left-2 top-2 hidden items-center gap-1 rounded-full border border-white/15 bg-slate-950/65 px-2 py-1 text-[9px] font-semibold text-white shadow backdrop-blur sm:inline-flex">
          <CategoryIcon size={11} className={category.tone} />{categoryLabel}
        </span>}
        <time dateTime={post.publishedAt} className="absolute right-2 top-2 hidden items-center gap-1 rounded-full border border-white/15 bg-slate-950/65 px-2 py-1 text-[9px] text-white shadow backdrop-blur sm:inline-flex">
          <CalendarDays size={10} />{publishedDate}
        </time>
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={t(isFavorited ? 'blog_saved' : 'blog_save')}
          aria-pressed={isFavorited}
          title={t(isFavorited ? 'blog_saved' : 'blog_save')}
          className={`absolute bottom-2 right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 shadow-lg backdrop-blur transition hover:scale-105 sm:h-8 sm:w-8 ${isFavorited ? 'bg-brand-red text-white' : 'bg-slate-950/65 text-white hover:bg-brand-red'}`}
        >
          <Heart size={14} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>
        <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-[8px] text-white sm:bottom-2 sm:left-2 sm:text-[9px]">
          <MapPin size={8} />
          {post.location[language]}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between p-2 sm:p-2.5">
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-1 sm:hidden">
            <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-bg-cardAlt px-1.5 py-0.5 text-[8px] font-medium text-text-secondary">
              <CategoryIcon size={10} className={category?.tone ?? 'text-brand-blue'} /><span className="truncate">{categoryLabel}</span>
            </span>
            <time dateTime={post.publishedAt} className="inline-flex shrink-0 items-center gap-1 text-[8px] text-text-faint"><CalendarDays size={9} />{publishedDate}</time>
          </div>
          <button type="button" onClick={onOpen} className="text-left">
            <h2 className="line-clamp-2 text-[11px] font-semibold leading-[1.3] text-text-primary transition group-hover:text-brand-blue sm:text-sm">
              {copy.title}
            </h2>
          </button>
          <p className="mt-1 line-clamp-2 text-[9px] leading-[1.4] text-text-muted sm:text-[11px] sm:leading-4">{copy.excerpt}</p>
          <div className="mt-1.5">
            <StoryMetrics post={post} views={views} language={language} t={t} showDistance={showDistance} compact />
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between gap-1 border-t border-border pt-1.5">
          <div className="flex items-center gap-1">
            <span className={`inline-flex items-center gap-1 px-1 py-1 text-[9px] ${isFavorited ? 'text-brand-redLight' : 'text-text-muted'}`}>
              <Heart size={11} fill={isFavorited ? 'currentColor' : 'none'} />{formatCompactCount(favoriteTotal, language)}
            </span>
            <button type="button" onClick={onShare} aria-label={t('blog_share')} className="flex h-6 w-6 items-center justify-center rounded-lg text-text-muted transition hover:bg-bg-cardAlt hover:text-brand-blue"><Share2 size={11} /></button>
          </div>
          <button type="button" onClick={onOpen} aria-label={`${t('blog_read_story')}: ${copy.title}`} className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-blue px-2 py-1 text-[8px] font-semibold text-white transition hover:bg-brand-blueDark sm:px-2.5 sm:text-[9px]">
            <span className="hidden sm:inline">{t('blog_read_story')}</span><ArrowRight size={11} />
          </button>
        </div>
      </div>
    </article>
  );
}

function renderBlock(block: BlogBlock, index: number, post: BlogPost, language: Language) {
  if (block.type === 'paragraph') {
    return (
      <p key={`${post.id}-paragraph-${index}`} className="text-[15px] leading-8 text-text-secondary sm:text-base">
        {block.text[language]}
      </p>
    );
  }

  if (block.type === 'image') {
    return (
      <figure key={`${post.id}-image-${index}`} className="overflow-hidden rounded-xl border border-border bg-bg-cardAlt">
        <img src={block.imageUrl} alt={block.alt[language]} loading="lazy" className="max-h-[480px] w-full object-cover" />
        {block.caption && (
          <figcaption className="px-4 py-3 text-xs leading-5 text-text-faint">{block.caption[language]}</figcaption>
        )}
      </figure>
    );
  }

  return (
    <div key={`${post.id}-ad-${index}`} className="my-2">
      <AdSlot placement={`blog_${post.id}_reader`} fetchAd={fetchMockAd} />
    </div>
  );
}

function StoryReader({
  post,
  language,
  t,
  views,
  isFavorited,
  onClose,
  onToggleFavorite,
  onShare,
  showDistance,
}: {
  post: BlogPost;
  language: Language;
  t: Translate;
  views: number;
  isFavorited: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
  showDistance: boolean;
}) {
  const copy = getLocalizedCopy(post, language);

  return (
    <section className="w-full max-w-none overflow-hidden">
      <article
        aria-labelledby="blog-reader-title"
        aria-label={t('blog_reader_label')}
        className="relative overflow-hidden"
      >
        <div className="absolute right-3 top-3 z-10 flex gap-2 sm:right-5 sm:top-5">
          <button
            type="button"
            onClick={onShare}
            aria-label={t('blog_share')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
          >
            <Share2 size={16} />
          </button>
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={t(isFavorited ? 'blog_saved' : 'blog_save')}
            aria-pressed={isFavorited}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
          >
            <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} className={isFavorited ? 'text-brand-redLight' : ''} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('blog_close')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
          >
            <X size={17} />
          </button>
        </div>

        <div className="relative h-48 shrink-0 overflow-hidden bg-bg-cardAlt sm:h-64 md:h-72">
          <img src={post.imageUrl} alt={copy.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/10" />
          <div className="absolute bottom-4 left-2 right-2 sm:bottom-6 sm:left-4 sm:right-4">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[11px] text-white backdrop-blur">
              <MapPin size={12} /> {post.location[language]}
            </span>
            <h2 id="blog-reader-title" className="w-full max-w-none font-serif text-2xl leading-tight text-white sm:text-3xl md:text-4xl">
              {copy.title}
            </h2>
          </div>
        </div>

        <div className="px-2 py-4 sm:px-3 sm:py-5 md:px-4 md:py-6">
          <div className="w-full max-w-none">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
              <div>
                <p className="text-sm font-medium text-text-primary">{post.author[language]}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-faint">
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, language)}</time>
                  <span>{getReadTime(post.readMinutes, language, t)}</span>
                </div>
              </div>
              <StoryMetrics post={post} views={views} language={language} t={t} showDistance={showDistance} />
            </div>

            <p className="mb-7 border-l-2 border-brand-blue pl-4 text-base leading-7 text-text-secondary sm:text-lg">
              {copy.excerpt}
            </p>
            <div className="mb-6">
              <AdSlot placement="blog_post_top" fetchAd={fetchMockAd} />
            </div>
            <div className="space-y-6">
              {post.blocks.map((block, index) => renderBlock(block, index, post, language))}
            </div>
            <div className="mt-8">
              <AdSlot placement="blog_post_bottom" fetchAd={fetchMockAd} />
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement('textarea');
  input.value = value;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('Clipboard access is unavailable.');
}

export function BlogsPage() {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const storySlug = searchParams.get('story');
  const selectedPost = ALL_BLOG_POSTS.find((post) => post.slug === storySlug) ?? null;
  const countedStoryRef = useRef<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [visibleCount, setVisibleCount] = useState(6);
  const [viewIncrements, setViewIncrements] = useState<Record<string, number>>(() => readStoredValue(VIEWS_STORAGE_KEY, {}));
  const [toast, setToast] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const relatedHotels = useToggleFavorite(POPULAR_HOTELS);
  const { isFavorite, toggleFavorite: toggleSharedFavorite } = useFavorites();

  useEffect(() => {
    if (!navigator.geolocation || !navigator.permissions) return;
    let cancelled = false;
    void navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
      if (permission.state !== 'granted') return;
      navigator.geolocation.getCurrentPosition(
        () => { if (!cancelled) setLocationEnabled(true); },
        () => { if (!cancelled) setLocationEnabled(false); },
        { maximumAge: 300000, timeout: 5000 },
      );
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(viewIncrements));
  }, [viewIncrements]);

  useEffect(() => {
    if (!storySlug) {
      countedStoryRef.current = null;
      return;
    }

    const post = ALL_BLOG_POSTS.find((item) => item.slug === storySlug);
    if (!post) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('story');
        return next;
      }, { replace: true });
      countedStoryRef.current = null;
      return;
    }

    if (countedStoryRef.current !== storySlug) {
      countedStoryRef.current = storySlug;
      setViewIncrements((current) => ({ ...current, [post.id]: (current[post.id] ?? 0) + 1 }));
    }
  }, [storySlug, setSearchParams]);

  useEffect(() => {
    if (!selectedPost) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          next.delete('story');
          return next;
        }, { replace: true });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPost, setSearchParams]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const isFavorited = (post: BlogPost) => isFavorite(post.id, post.isFavorited);
  const viewsFor = (post: BlogPost) => post.views + (viewIncrements[post.id] ?? 0);

  function openPost(post: BlogPost) {
    setSearchParams({ story: post.slug });
  }

  function closePost() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('story');
      return next;
    }, { replace: true });
  }

  function toggleFavorite(post: BlogPost) {
    toggleSharedFavorite(post.id, post.isFavorited);
  }

  async function sharePost(post: BlogPost) {
    const copy = getLocalizedCopy(post, language);
    const url = new URL(`/blogs?story=${encodeURIComponent(post.slug)}`, window.location.origin).toString();

    if (navigator.share) {
      try {
        await navigator.share({ title: copy.title, text: copy.excerpt, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }

    try {
      await copyText(url);
      setToast(t('blog_link_copied'));
    } catch {
      setToast(t('blog_share_unavailable'));
    }
  }

  const visiblePosts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(language === 'mm' ? 'my-MM' : 'en-US');
    return ALL_BLOG_POSTS
      .filter((post) => {
        if (activeCategory !== 'all' && post.category !== activeCategory) return false;
        if (!normalizedQuery) return true;
        const content = getLocalizedCopy(post, language);
        return [content.title, content.excerpt, post.location[language]]
          .some((value) => value.toLocaleLowerCase(language === 'mm' ? 'my-MM' : 'en-US').includes(normalizedQuery));
      })
      .sort((a, b) => sortMode === 'popular'
        ? (b.views + (viewIncrements[b.id] ?? 0)) - (a.views + (viewIncrements[a.id] ?? 0))
        : b.publishedAt.localeCompare(a.publishedAt));
  }, [activeCategory, language, query, sortMode, viewIncrements]);
  const displayedPosts = visiblePosts.slice(0, visibleCount);

  return (
    <div className="w-full pb-8 pt-3 sm:pt-5">
      {!selectedPost && (
        <>
          <section aria-labelledby="blog-hero-title" className="relative isolate mb-5 flex min-h-[190px] overflow-hidden rounded-2xl border border-border sm:min-h-[210px] lg:min-h-[235px]">
            <img src="/images/blog/shwedagon-evening.webp" alt={t('blog_hero_alt')} className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#04172c]/95 via-[#04172c]/75 to-[#04172c]/15" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#06172c]/45 to-transparent" />
            <div className="flex max-w-3xl flex-col justify-center p-5 sm:p-7 lg:p-8">
              <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.19em] text-sky-200 sm:text-xs"><BookOpen size={16} />MH TRAVEL JOURNAL</span>
              <h1 id="blog-hero-title" className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">{t('blog_page_hero_title')}</h1>
              <p className="mt-1 text-base font-semibold text-sky-100 sm:text-xl">{t('blog_page_hero_subtitle')}</p>
              <p className="mt-1 max-w-xl text-[11px] leading-5 text-slate-100/90 sm:text-sm">{t('blog_page_hero_intro')}</p>
            </div>
          </section>

          <section aria-label={t('blog_filter_label')} className="mb-5">
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2.5">
              {CATEGORY_FILTERS.map(({ id, labelKey, icon: Icon, tone, activeTone }) => {
                const active = activeCategory === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => { setActiveCategory(id); setVisibleCount(6); }}
                    aria-pressed={active}
                    className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border px-2.5 py-2 text-[10px] font-medium transition sm:min-h-11 sm:gap-2 sm:px-3.5 sm:text-xs ${active ? `${activeTone} border-transparent text-white shadow-lg shadow-black/10` : 'border-border bg-bg-card text-text-secondary hover:border-brand-blue/50 hover:bg-bg-cardAlt'}`}
                  >
                    <Icon size={15} className={active ? 'text-white' : tone} />{t(labelKey)}
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-label={t('blog_story_count')}>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary sm:text-xl">{t('blog_latest_title')}</h2>
                <p className="mt-0.5 text-[10px] text-text-faint sm:text-xs">{t('blog_story_count').replace('{count}', formatNumber(visiblePosts.length, language))}</p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <label className="relative block min-w-0 sm:w-64">
                  <span className="sr-only">{t('blog_search_label')}</span>
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => { setQuery(event.target.value); setVisibleCount(6); }}
                    placeholder={t('blog_search_placeholder')}
                    aria-label={t('blog_search_label')}
                    className="w-full rounded-full border border-border bg-bg-card py-2.5 pl-9 pr-10 text-xs text-text-primary outline-none transition placeholder:text-text-faint focus:border-brand-blue/70"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => { setQuery(''); setVisibleCount(6); }}
                      aria-label={t('blog_clear_search')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-primary"
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>
                <label>
                  <span className="sr-only">{t('blog_sort_label')}</span>
                  <select
                    value={sortMode}
                    onChange={(event) => { setSortMode(event.target.value as SortMode); setVisibleCount(6); }}
                    aria-label={t('blog_sort_label')}
                    className="w-full rounded-full border border-border bg-bg-card px-4 py-2.5 text-xs text-text-secondary outline-none transition focus:border-brand-blue/70 sm:w-auto"
                  >
                    <option value="latest">{t('blog_sort_latest')}</option>
                    <option value="popular">{t('blog_sort_popular')}</option>
                  </select>
                </label>
              </div>
            </div>

            {displayedPosts.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4 xl:gap-3">
                {displayedPosts.map((post) => (
                  <StoryCard
                    key={post.id}
                    post={post}
                    language={language}
                    t={t}
                    views={viewsFor(post)}
                    isFavorited={isFavorited(post)}
                    onOpen={() => openPost(post)}
                    onToggleFavorite={() => toggleFavorite(post)}
                    onShare={() => void sharePost(post)}
                    showDistance={locationEnabled}
                  />
                ))}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card/50 px-5 text-center">
                <Search size={22} className="mb-3 text-text-faint" />
                <p className="text-sm text-text-secondary">{t('blog_no_results')}</p>
                {query && (
                  <button type="button" onClick={() => { setQuery(''); setVisibleCount(6); }} className="mt-3 text-xs text-brand-blue hover:underline">
                    {t('blog_clear_search')}
                  </button>
                )}
              </div>
            )}

            {visiblePosts.length > displayedPosts.length && (
              <div className="mt-6 flex justify-center">
                <button type="button" onClick={() => setVisibleCount((count) => count + 6)} className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-brand-blue/20 transition hover:-translate-y-0.5 hover:bg-brand-blueDark">
                  {t('blog_load_more')}<ArrowRight size={14} className="rotate-90" />
                </button>
              </div>
            )}
          </section>
        </>
      )}

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[120] -translate-x-1/2 rounded-full border border-border bg-bg-card px-4 py-2.5 text-xs text-text-primary shadow-xl">
          {toast}
        </div>
      )}

      {selectedPost && (
        <div className="mt-5">
          <StoryReader
            post={selectedPost}
            language={language}
            t={t}
            views={viewsFor(selectedPost)}
            isFavorited={isFavorited(selectedPost)}
            onClose={closePost}
            onToggleFavorite={() => toggleFavorite(selectedPost)}
            onShare={() => void sharePost(selectedPost)}
            showDistance={locationEnabled}
          />
          <section className="mt-10 border-t border-border pt-6" aria-labelledby="related-stories-title">
            <h2 id="related-stories-title" className="mb-3 text-base font-medium text-text-primary">{t('blog_related_stories')}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_BLOG_POSTS.filter((post) => post.id !== selectedPost.id && post.location[language] === selectedPost.location[language]).concat(
                ALL_BLOG_POSTS.filter((post) => post.id !== selectedPost.id && post.location[language] !== selectedPost.location[language]),
              ).slice(0, 3).map((post) => (
                <StoryCard
                  key={post.id}
                  post={post}
                  language={language}
                  t={t}
                  views={viewsFor(post)}
                  isFavorited={isFavorited(post)}
                  onOpen={() => openPost(post)}
                  onToggleFavorite={() => toggleFavorite(post)}
                  onShare={() => void sharePost(post)}
                  showDistance={locationEnabled}
                />
              ))}
            </div>
          </section>
          <section className="mt-10 border-t border-border pt-6" aria-labelledby="related-hotels-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="related-hotels-title" className="text-base font-medium text-text-primary">{t('blog_related_hotels')}</h2>
              <a href="/hotels" className="text-[10px] text-brand-blue hover:text-text-primary">{t('blog_view_all_hotels')}</a>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {relatedHotels.listings.map((hotel) => <ListingCard key={hotel.id} listing={hotel} size="md" onToggleFavorite={relatedHotels.toggle} />)}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
