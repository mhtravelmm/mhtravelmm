import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  Eye,
  Heart,
  MapPin,
  Search,
  Share2,
  Star,
  X,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { AdSlot } from '../../components/ui/AdSlot';
import { fetchMockAd } from '../../data/ads';
import { BLOG_POSTS, type BlogBlock, type BlogPost } from '../../data/blogsData';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import type { Language } from '../../types';

const FAVORITES_STORAGE_KEY = 'mh-travel-blog-favorite-overrides';
const VIEWS_STORAGE_KEY = 'mh-travel-blog-view-counts';

type SortMode = 'latest' | 'popular';
type Translate = (key: TranslationKey) => string;

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
}: {
  post: BlogPost;
  views: number;
  language: Language;
  t: Translate;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-text-muted">
      <span className="inline-flex items-center gap-1 text-status-rating" aria-label={`${t('blog_rating')}: ${formatNumber(post.rating, language, 1)}`}>
        <Star size={13} fill="currentColor" />
        <span>{formatNumber(post.rating, language, 1)}</span>
      </span>
      <span className="inline-flex items-center gap-1">
        <MapPin size={13} />
        <span>
          {formatNumber(post.distanceKm, language, 1)} km {t('blog_away')}
        </span>
      </span>
      <span className="inline-flex items-center gap-1">
        <Eye size={13} />
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
}: {
  post: BlogPost;
  language: Language;
  t: Translate;
  views: number;
  isFavorited: boolean;
  onOpen: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
}) {
  const copy = getLocalizedCopy(post, language);

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-bg-card transition duration-300 hover:-translate-y-1 hover:border-brand-blue/40 hover:shadow-xl hover:shadow-black/10">
      <div className="relative aspect-[1.55/1] overflow-hidden bg-bg-cardAlt">
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
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        </button>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={t(isFavorited ? 'blog_saved' : 'blog_save')}
            aria-pressed={isFavorited}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur transition hover:bg-black/70"
          >
            <Heart size={16} fill={isFavorited ? 'currentColor' : 'none'} className={isFavorited ? 'text-brand-redLight' : ''} />
          </button>
          <button
            type="button"
            onClick={onShare}
            aria-label={t('blog_share')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur transition hover:bg-black/70"
          >
            <Share2 size={15} />
          </button>
        </div>
        <span className="absolute bottom-3 left-4 flex items-center gap-1.5 text-xs text-white">
          <MapPin size={12} />
          {post.location[language]}
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.12em] text-text-faint">
          <time dateTime={post.publishedAt} className="inline-flex items-center gap-1.5">
            <CalendarDays size={12} />
            {formatDate(post.publishedAt, language)}
          </time>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={12} />
            {getReadTime(post.readMinutes, language, t)}
          </span>
        </div>

        <button type="button" onClick={onOpen} className="text-left">
          <h2 className="font-serif text-xl leading-snug text-text-primary transition group-hover:text-brand-blue sm:text-[22px]">
            {copy.title}
          </h2>
        </button>
        <p className="mt-2.5 line-clamp-3 text-sm leading-6 text-text-muted">{copy.excerpt}</p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
          <span className="min-w-0 truncate text-xs text-text-secondary">
            {t('blog_author_prefix')} {post.author[language]}
          </span>
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-brand-blue transition hover:text-text-primary"
          >
            {t('blog_read_story')}
            <ArrowRight size={14} />
          </button>
        </div>
        <div className="mt-4 border-t border-border pt-3.5">
          <StoryMetrics post={post} views={views} language={language} t={t} />
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
}: {
  post: BlogPost;
  language: Language;
  t: Translate;
  views: number;
  isFavorited: boolean;
  onClose: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
}) {
  const copy = getLocalizedCopy(post, language);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      role="presentation"
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="blog-reader-title"
        aria-label={t('blog_reader_label')}
        className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-border bg-bg shadow-2xl sm:max-h-[90vh] sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute right-3 top-3 z-10 flex gap-2">
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
          <div className="absolute bottom-4 left-5 right-5 sm:bottom-6 sm:left-8 sm:right-8">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[11px] text-white backdrop-blur">
              <MapPin size={12} /> {post.location[language]}
            </span>
            <h2 id="blog-reader-title" className="max-w-3xl font-serif text-2xl leading-tight text-white sm:text-3xl md:text-4xl">
              {copy.title}
            </h2>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-6 sm:px-9 sm:py-8">
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
              <div>
                <p className="text-sm font-medium text-text-primary">{post.author[language]}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-faint">
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, language)}</time>
                  <span>{getReadTime(post.readMinutes, language, t)}</span>
                </div>
              </div>
              <StoryMetrics post={post} views={views} language={language} t={t} />
            </div>

            <p className="mb-7 border-l-2 border-brand-blue pl-4 text-base leading-7 text-text-secondary sm:text-lg">
              {copy.excerpt}
            </p>
            <div className="space-y-6">
              {post.blocks.map((block, index) => renderBlock(block, index, post, language))}
            </div>
          </div>
        </div>
      </article>
    </div>,
    document.body,
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
  const featuredPost = BLOG_POSTS[0];
  const featuredCopy = getLocalizedCopy(featuredPost, language);
  const storySlug = searchParams.get('story');
  const selectedPost = BLOG_POSTS.find((post) => post.slug === storySlug) ?? null;
  const countedStoryRef = useRef<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>(() => readStoredValue(FAVORITES_STORAGE_KEY, {}));
  const [viewIncrements, setViewIncrements] = useState<Record<string, number>>(() => readStoredValue(VIEWS_STORAGE_KEY, {}));
  const [toast, setToast] = useState('');

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteOverrides));
  }, [favoriteOverrides]);

  useEffect(() => {
    window.localStorage.setItem(VIEWS_STORAGE_KEY, JSON.stringify(viewIncrements));
  }, [viewIncrements]);

  useEffect(() => {
    if (!storySlug) {
      countedStoryRef.current = null;
      return;
    }

    const post = BLOG_POSTS.find((item) => item.slug === storySlug);
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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedPost]);

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

  const isFavorited = (post: BlogPost) => favoriteOverrides[post.id] ?? post.isFavorited;
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
    setFavoriteOverrides((current) => ({
      ...current,
      [post.id]: !(current[post.id] ?? post.isFavorited),
    }));
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
    return BLOG_POSTS
      .filter((post) => post.id !== featuredPost.id)
      .filter((post) => {
        if (!normalizedQuery) return true;
        const content = getLocalizedCopy(post, language);
        return [content.title, content.excerpt, post.location[language]]
          .some((value) => value.toLocaleLowerCase(language === 'mm' ? 'my-MM' : 'en-US').includes(normalizedQuery));
      })
      .sort((a, b) => sortMode === 'popular'
        ? (b.views + (viewIncrements[b.id] ?? 0)) - (a.views + (viewIncrements[a.id] ?? 0))
        : b.publishedAt.localeCompare(a.publishedAt));
  }, [featuredPost.id, language, query, sortMode, viewIncrements]);

  return (
    <div className="mx-auto max-w-7xl pb-8 pt-5 sm:pt-8">
      <div className="mb-5 flex items-center gap-2 text-xs text-text-faint">
        <span>MH Travel</span>
        <span aria-hidden="true">/</span>
        <span className="text-text-secondary">{t('nav_blogs')}</span>
      </div>

      <section className="relative mb-12 overflow-hidden rounded-2xl border border-border bg-bg-card sm:rounded-[26px]">
        <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-brand-blue/10 blur-3xl" />
        <div className="grid lg:grid-cols-[1.02fr_0.98fr]">
          <div className="relative z-10 flex flex-col justify-center px-5 py-7 sm:px-8 sm:py-9 lg:px-11 lg:py-12">
            <p className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-blue sm:text-xs">
              <span className="h-px w-7 bg-brand-blue" />
              {t('blog_eyebrow')}
            </p>
            <h1 className="max-w-2xl font-serif text-3xl leading-[1.12] text-text-primary sm:text-4xl lg:text-[48px]">
              {t('blog_title')}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-text-muted sm:text-base sm:leading-8">
              {t('blog_intro')}
            </p>

            <div className="mt-8 border-t border-border pt-6">
              <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-redLight">
                <BookOpen size={13} />
                {t('blog_featured_story')}
              </div>
              <h2 className="max-w-xl font-serif text-xl leading-snug text-text-primary sm:text-2xl">
                {featuredCopy.title}
              </h2>
              <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-6 text-text-muted">
                {featuredCopy.excerpt}
              </p>
              <div className="mt-4">
                <StoryMetrics post={featuredPost} views={viewsFor(featuredPost)} language={language} t={t} />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openPost(featuredPost)}
                  className="inline-flex items-center gap-2 rounded-full bg-brand-red px-5 py-3 text-sm font-medium text-white shadow-lg shadow-brand-red/15 transition hover:brightness-110"
                >
                  {t('blog_read_story')}
                  <ArrowRight size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => void sharePost(featuredPost)}
                  aria-label={t('blog_share')}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-text-secondary transition hover:border-brand-blue/50 hover:text-brand-blue"
                >
                  <Share2 size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(featuredPost)}
                  aria-label={t(isFavorited(featuredPost) ? 'blog_saved' : 'blog_save')}
                  aria-pressed={isFavorited(featuredPost)}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-border transition hover:border-brand-red/50 ${isFavorited(featuredPost) ? 'text-brand-redLight' : 'text-text-secondary hover:text-brand-redLight'}`}
                >
                  <Heart size={16} fill={isFavorited(featuredPost) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          </div>

          <div className="relative min-h-[260px] overflow-hidden bg-bg-cardAlt sm:min-h-[340px] lg:min-h-[580px]">
            <img
              src={featuredPost.imageUrl}
              alt={featuredCopy.title}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-[1.025]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/10" />
            <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur sm:left-6 sm:top-6">
              {t('blog_featured_story')}
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 sm:bottom-6 sm:left-6 sm:right-6">
              <div className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white backdrop-blur">
                {featuredPost.location[language]}
              </div>
              <button
                type="button"
                onClick={() => toggleFavorite(featuredPost)}
                aria-label={t(isFavorited(featuredPost) ? 'blog_saved' : 'blog_save')}
                aria-pressed={isFavorited(featuredPost)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur transition hover:bg-black/65"
              >
                <Heart size={17} fill={isFavorited(featuredPost) ? 'currentColor' : 'none'} className={isFavorited(featuredPost) ? 'text-brand-redLight' : ''} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="latest-stories-title">
        <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-blue">{t('blog_eyebrow')}</p>
            <h2 id="latest-stories-title" className="font-serif text-2xl text-text-primary sm:text-3xl">
              {t('blog_latest_title')}
            </h2>
            <p className="mt-1.5 text-sm text-text-muted">{t('blog_latest_intro')}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative block min-w-0 sm:w-64">
              <span className="sr-only">{t('blog_search_label')}</span>
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('blog_search_placeholder')}
                aria-label={t('blog_search_label')}
                className="w-full rounded-full border border-border bg-bg-card py-2.5 pl-9 pr-10 text-xs text-text-primary outline-none transition placeholder:text-text-faint focus:border-brand-blue/70"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
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
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                aria-label={t('blog_sort_label')}
                className="w-full rounded-full border border-border bg-bg-card px-4 py-2.5 text-xs text-text-secondary outline-none transition focus:border-brand-blue/70 sm:w-auto"
              >
                <option value="latest">{t('blog_sort_latest')}</option>
                <option value="popular">{t('blog_sort_popular')}</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mb-4 text-xs text-text-faint">
          {t('blog_story_count').replace('{count}', formatNumber(visiblePosts.length, language))}
        </div>

        {visiblePosts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-5">
            {visiblePosts.map((post) => (
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
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-bg-card/50 px-5 text-center">
            <Search size={22} className="mb-3 text-text-faint" />
            <p className="text-sm text-text-secondary">{t('blog_no_results')}</p>
            {query && (
              <button type="button" onClick={() => setQuery('')} className="mt-3 text-xs text-brand-blue hover:underline">
                {t('blog_clear_search')}
              </button>
            )}
          </div>
        )}
      </section>

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[120] -translate-x-1/2 rounded-full border border-border bg-bg-card px-4 py-2.5 text-xs text-text-primary shadow-xl">
          {toast}
        </div>
      )}

      {selectedPost && (
        <StoryReader
          post={selectedPost}
          language={language}
          t={t}
          views={viewsFor(selectedPost)}
          isFavorited={isFavorited(selectedPost)}
          onClose={closePost}
          onToggleFavorite={() => toggleFavorite(selectedPost)}
          onShare={() => void sharePost(selectedPost)}
        />
      )}
    </div>
  );
}
