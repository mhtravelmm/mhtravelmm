import { ArrowRight, Eye, Heart, MapPin, Star } from 'lucide-react';
import type { NearbyListing } from '../../data/nearbyData';

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
  /** Card size — the design system allows exactly these three. */
  variant?: 'standard' | 'mini';
}

const CARD_SIZES = {
  standard: {
    image: 'h-24 w-24 md:h-[70px] md:w-full',
    body: 'p-2',
    title: 'text-[11px] md:text-xs',
    rating: 'left-1.5 top-1.5 px-1.5 py-0.5 text-[9px]',
    open: 'bottom-1.5 left-1.5 px-1.5 py-0.5 text-[8px]',
    heart: 'right-1.5 top-1.5 h-6 w-6',
    heartIcon: 12,
  },
  mini: {
    image: 'h-16 w-full',
    body: 'p-1.5',
    title: 'text-[10px]',
    rating: 'left-1 top-1 px-1 py-0.5 text-[8px]',
    open: 'bottom-1 left-1 px-1 py-0.5 text-[8px]',
    heart: 'right-1 top-1 h-6 w-6',
    heartIcon: 11,
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
  variant = 'standard',
}: NearbyPlaceCardProps) {
  const isMini = variant === 'mini';
  const s = CARD_SIZES[variant];
  const destination = listing.href ?? '/nearby';

  return (
    <article className={`group relative overflow-hidden rounded-card border border-border bg-bg-card transition hover:border-brand-blue/40 hover:shadow-md ${isMini ? 'w-32 shrink-0' : 'min-w-0'}`}>
      <a href={destination} className={isMini ? 'block' : 'flex h-full flex-row md:flex-col'}>
        <div className={`relative shrink-0 overflow-hidden bg-bg-cardAlt ${s.image}`}>
          {listing.imageUrl && <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />}
          <span className={`absolute inline-flex items-center gap-1 rounded-full bg-black/75 font-medium text-amber-300 ${s.rating}`}>
            <Star size={9} fill="currentColor" />{listing.rating.toFixed(1)}
          </span>
          {!isMini && <span className={`absolute rounded-full font-medium ${s.open} ${listing.openNow ? 'bg-emerald-500/90 text-white' : 'bg-black/75 text-white'}`}>
            {listing.openNow ? openNowLabel : closedLabel}
          </span>}
        </div>

        <div className={`flex min-w-0 flex-1 flex-col justify-between ${s.body}`}>
          <div className="min-w-0 pr-4">
            <h3 className={`${s.title} truncate font-semibold text-text-primary`}>{listing.title}</h3>
            <p className="mt-0.5 truncate text-[9px] text-brand-blue">{categoryLabel} <span className="text-text-faint">·</span> {listing.distanceKm.toFixed(1)} km</p>
            {!isMini && <>
              {listing.subtitle && <p className="mt-1 line-clamp-1 text-[10px] text-text-secondary">{listing.subtitle}</p>}
              <p className="mt-0.5 flex items-center gap-1 truncate text-[9px] text-text-faint"><MapPin size={9} className="shrink-0" />{listing.address}</p>
            </>}
          </div>

          <div className={`mt-1.5 flex items-center justify-between gap-2 text-[9px] text-text-faint ${isMini ? '' : 'border-t border-border/70 pt-1.5'}`}>
            <span className="inline-flex items-center gap-1"><Eye size={9} />{formatViews(listing.views)}</span>
            {!isMini && <span className="inline-flex items-center gap-1 font-medium text-brand-blue">{viewDetailsLabel}<ArrowRight size={10} /></span>}
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
