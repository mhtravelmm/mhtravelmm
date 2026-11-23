import { ArrowRight, Eye, Heart, MapPin, Star } from 'lucide-react';
import type { NearbyListing } from '../../data/nearbyData';
import { formatDistance, formatRating, hasDistance, hasRating } from '../../lib/cardMeta';
import type { Language } from '../../types';

interface NearbyPlaceCardProps {
  listing: NearbyListing;
  categoryLabel: string;
  viewDetailsLabel: string;
  openNowLabel: string;
  closedLabel: string;
  saveLabel: string;
  removeLabel: string;
  isFavorited: boolean;
  onToggleFavorite: (id: string) => void;
  language: Language;
  /** Card size — the design system allows exactly these five. */
  variant?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/** Same five sizes as the shared ListingCard, tuned for the Nearby layout. */
const CARD_SIZES = {
  xs: {
    image: 'h-12 w-12 md:h-[40px] md:w-full',
    body: 'p-1',
    title: 'text-[9px] md:text-[10px]',
    rating: 'left-1 top-1 px-1 py-0.5 text-[7px]',
    open: 'bottom-1 left-1 px-1 py-0.5 text-[7px]',
    heart: 'right-1 top-1 h-5 w-5',
    heartIcon: 10,
    detail: 'hidden',
    address: 'hidden',
  },
  sm: {
    image: 'h-16 w-16 md:h-[44px] md:w-full',
    body: 'p-1.5',
    title: 'text-[10px] md:text-[11px]',
    rating: 'left-1 top-1 px-1 py-0.5 text-[8px]',
    open: 'bottom-1 left-1 px-1 py-0.5 text-[8px]',
    heart: 'right-1 top-1 h-6 w-6',
    heartIcon: 11,
    detail: 'hidden',
    address: 'hidden',
  },
  md: {
    image: 'h-20 w-20 md:h-[52px] md:w-full',
    body: 'p-1.5 md:p-2',
    title: 'text-[11px] md:text-xs',
    rating: 'left-1.5 top-1.5 px-1.5 py-0.5 text-[9px]',
    open: 'bottom-1.5 left-1.5 px-1.5 py-0.5 text-[8px]',
    heart: 'right-1.5 top-1.5 h-6 w-6',
    heartIcon: 12,
    detail: 'hidden md:block',
    address: 'hidden',
  },
  lg: {
    image: 'h-24 w-24 md:h-[60px] md:w-full',
    body: 'p-2',
    title: 'text-xs md:text-[13px]',
    rating: 'left-1.5 top-1.5 px-1.5 py-0.5 text-[9px]',
    open: 'bottom-1.5 left-1.5 px-1.5 py-0.5 text-[8px]',
    heart: 'right-1.5 top-1.5 h-6 w-6',
    heartIcon: 12,
    detail: 'block',
    address: 'hidden md:flex',
  },
  xl: {
    image: 'h-28 w-28 md:h-[68px] md:w-full',
    body: 'p-2 md:p-2.5',
    title: 'text-[13px] md:text-sm',
    rating: 'left-2 top-2 px-1.5 py-0.5 text-[9px]',
    open: 'bottom-2 left-2 px-1.5 py-0.5 text-[9px]',
    heart: 'right-2 top-2 h-7 w-7',
    heartIcon: 13,
    detail: 'block',
    address: 'flex',
  },
} as const;

export function NearbyPlaceCard({
  listing,
  categoryLabel,
  viewDetailsLabel,
  openNowLabel,
  closedLabel,
  saveLabel,
  removeLabel,
  isFavorited,
  onToggleFavorite,
  language,
  variant = 'md',
}: NearbyPlaceCardProps) {
  const s = CARD_SIZES[variant];
  const destination = listing.href ?? '/nearby';

  return (
    <article className="group relative min-w-0 overflow-hidden rounded-card border border-border bg-bg-card transition hover:border-brand-blue/40 hover:shadow-md">
      <a href={destination} className="flex h-full flex-row md:flex-col">
        <div className={`relative shrink-0 overflow-hidden bg-bg-cardAlt ${s.image}`}>
          {listing.imageUrl && <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />}
          {hasRating(listing) && (
            <span className={`absolute inline-flex items-center gap-1 rounded-full bg-black/75 font-medium text-amber-300 ${s.rating}`}>
              <Star size={9} fill="currentColor" />{formatRating(listing.rating, language)}
            </span>
          )}
          <span className={`absolute rounded-full font-medium ${s.open} ${listing.openNow ? 'bg-emerald-500/90 text-white' : 'bg-black/75 text-white'}`}>
            {listing.openNow ? openNowLabel : closedLabel}
          </span>
        </div>

        <div className={`flex min-w-0 flex-1 flex-col justify-between ${s.body}`}>
          <div className="min-w-0 pr-4">
            <h3 className={`${s.title} truncate font-semibold text-text-primary`}>{listing.title}</h3>
            <p className="mt-0.5 truncate text-[9px] text-brand-blue">
              {categoryLabel}
              {hasDistance(listing) && <><span className="text-text-faint"> · </span>{formatDistance(listing.distanceKm, language)}</>}
            </p>
            {listing.subtitle && <p className={`mt-0.5 line-clamp-1 text-[10px] text-text-secondary ${s.detail}`}>{listing.subtitle}</p>}
            <p className={`mt-0.5 items-center gap-1 truncate text-[9px] text-text-faint ${s.address}`}><MapPin size={9} className="shrink-0" />{listing.address}</p>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2 border-t border-border/70 pt-1 text-[9px] text-text-faint">
            <span className="inline-flex items-center gap-1"><Eye size={9} />{formatViews(listing.views)}</span>
            <span className="inline-flex items-center gap-1 font-medium text-brand-blue">{viewDetailsLabel}<ArrowRight size={10} /></span>
          </div>
        </div>
      </a>

      <button
        type="button"
        onClick={() => onToggleFavorite(listing.id)}
        aria-label={isFavorited ? removeLabel : saveLabel}
        className={`absolute flex items-center justify-center rounded-full bg-white/95 text-brand-red shadow-sm transition hover:scale-105 ${s.heart}`}
      >
        <Heart size={s.heartIcon} fill={isFavorited ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}

function formatViews(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}
