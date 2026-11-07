import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
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
import { ListingCard } from '../../components/ui/ListingCard';
import { fetchMockAd } from '../../data/ads';
import { BLOG_POSTS, type BlogBlock, type BlogPost } from '../../data/blogsData';
import { POPULAR_HOTELS } from '../../data/cityPageData';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';
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
    <article className="group overflow-hidden rounded-card border border-border bg-bg-card transition duration-300 hover:brightness-110">
      <div className="relative h-24 overflow-hidden bg-bg-cardAlt sm:h-28">
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
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={t(isFavorited ? 'blog_saved' : 'blog_save')}
            aria-pressed={isFavorited}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur transition hover:bg-black/70"
          >
            <Heart size={12} fill={isFavorited ? 'currentColor' : 'none'} className={isFavorited ? 'text-brand-redLight' : ''} />
          </button>
          <button
            type="button"
            onClick={onShare}
            aria-label={t('blog_share')}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur transition hover:bg-black/70"
          >
            <Share2 size={12} />
          </button>
        </div>
        <span className="absolute bottom-1.5 left-2 flex items-center gap-0.5 text-[9px] text-white">
          <MapPin size={9} />
          {post.location[language]}
        </span>
      </div>

      <div className="p-2">
        <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[8px] uppercase tracking-[0.05em] text-text-faint">
          <time dateTime={post.publishedAt} className="inline-flex items-center gap-1.5">
            <CalendarDays size={9} />
            {formatDate(post.publishedAt, language)}
          </time>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={9} />
            {getReadTime(post.readMinutes, language, t)}
          </span>
        </div>

        <button type="button" onClick={onOpen} className="text-left">
          <h2 className="line-clamp-1 font-serif text-sm leading-snug text-text-primary transition group-hover:text-brand-blue sm:text-base">
            {copy.title}
          </h2>
        </button>
        <p className="mt-0.5 line-clamp-1 text-[10px] leading-4 text-text-muted">{copy.excerpt}</p>

        <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-border pt-1.5">
          <span className="min-w-0 truncate text-[9px] text-text-secondary">
            {t('blog_author_prefix')} {post.author[language]}
          </span>
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex shrink-0 items-center gap-0.5 text-[9px] font-medium text-brand-blue transition hover:text-text-primary"
          >
            {t('blog_read_story')}
            <ArrowRight size={10} />
          </button>
        </div>
        <div className="mt-1.5 border-t border-border pt-1.5">
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

  return (
    <section className="mx-auto max-w-5xl overflow-hidden">
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
          <div className="absolute bottom-4 left-5 right-5 sm:bottom-6 sm:left-8 sm:right-8">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-3 py-1 text-[11px] text-white backdrop-blur">
              <MapPin size={12} /> {post.location[language]}
            </span>
            <h2 id="blog-reader-title" className="max-w-3xl font-serif text-2xl leading-tight text-white sm:text-3xl md:text-4xl">
              {copy.title}
            </h2>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-9 sm:py-8">
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
  const selectedPost = BLOG_POSTS.find((post) => post.slug === storySlug) ?? null;
  const countedStoryRef = useRef<string | null>(null);
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [favoriteOverrides, setFavoriteOverrides] = useState<Record<string, boolean>>(() => readStoredValue(FAVORITES_STORAGE_KEY, {}));
  const [viewIncrements, setViewIncrements] = useState<Record<string, number>>(() => readStoredValue(VIEWS_STORAGE_KEY, {}));
  const [toast, setToast] = useState('');
  const relatedHotels = useToggleFavorite(POPULAR_HOTELS);

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
      .filter((post) => {
        if (!normalizedQuery) return true;
        const content = getLocalizedCopy(post, language);
        return [content.title, content.excerpt, post.location[language]]
          .some((value) => value.toLocaleLowerCase(language === 'mm' ? 'my-MM' : 'en-US').includes(normalizedQuery));
      })
      .sort((a, b) => sortMode === 'popular'
        ? (b.views + (viewIncrements[b.id] ?? 0)) - (a.views + (viewIncrements[a.id] ?? 0))
        : b.publishedAt.localeCompare(a.publishedAt));
  }, [language, query, sortMode, viewIncrements]);

  return (
    <div className="mx-auto max-w-7xl pb-8 pt-5 sm:pt-8">
      {!selectedPost && <section aria-labelledby="latest-stories-title">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 xl:gap-4">
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
      </section>}

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[120] -translate-x-1/2 rounded-full border border-border bg-bg-card px-4 py-2.5 text-xs text-text-primary shadow-xl">
          {toast}
        </div>
      )}

      {selectedPost && (
        <div className="mt-5">
          <button type="button" onClick={closePost} className="mb-3 inline-flex items-center gap-1.5 text-xs text-brand-blue hover:text-text-primary">
            <ArrowRight size={13} className="rotate-180" /> {t('blog_back_to_stories')}
          </button>
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
