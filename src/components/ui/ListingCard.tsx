import { Star, MapPin, Heart, Eye } from 'lucide-react';
import type { CardListing } from '../../types';
import { useCurrency } from '../../lib/currency';

interface ListingCardProps {
  listing: CardListing;
  onToggleFavorite?: (id: string) => void;
  /** Visual size — 'md' for grid rows of 3-4, 'sm' for dense rows of 5-6 */
  size?: 'sm' | 'md';
  /** Optional horizontal treatment used by compact Travel Guide cards. */
  variant?: 'default' | 'guide';
}

/**
 * The single card component used everywhere a listing/content item is
 * shown (Travel Plans, Travel Guide, Blogs, Populars, Nearby, City cards,
 * business listings...). Rating, distance, favorite, and views are always
 * rendered — this is a confirmed, non-negotiable design rule, so it is
 * enforced here in one place rather than left to each call site.
 */
export function ListingCard({ listing, onToggleFavorite, size = 'md', variant = 'default' }: ListingCardProps) {
  const { formatPrice } = useCurrency();
  const imageHeight = size === 'sm' ? 'h-11' : 'h-[70px] md:h-[90px]';
  const titleSize = size === 'sm' ? 'text-[10px]' : 'text-xs md:text-sm';
  const isGuide = variant === 'guide';

  return (
    <a
      href={listing.href ?? '#'}
      className={`${isGuide ? 'flex items-stretch' : 'block'} overflow-hidden rounded-card bg-bg-card transition hover:brightness-110`}
    >
      <div className={`relative ${isGuide ? 'm-1.5 h-11 w-11 shrink-0 rounded-full' : imageHeight} bg-gradient-to-br from-bg-cardAlt to-bg`}>
        {listing.imageUrl && (
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className={`absolute inset-0 h-full w-full object-cover ${isGuide ? 'rounded-full' : ''}`}
          />
        )}

        <span className={`absolute ${isGuide ? 'left-0.5 top-0.5' : 'left-1.5 top-1.5'} flex items-center gap-0.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-status-rating`}>
          <Star size={9} fill="currentColor" />
          {listing.rating.toFixed(1)}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite?.(listing.id);
          }}
          aria-label={listing.isFavorited ? 'Remove from favorites' : 'Save to favorites'}
          className={`absolute ${isGuide ? 'right-0.5 top-0.5' : 'right-1.5 top-1.5'} flex h-4 w-4 items-center justify-center rounded-full bg-white`}
        >
          <Heart
            size={9}
            className={listing.isFavorited ? 'text-brand-red' : 'text-brand-red/70'}
            fill={listing.isFavorited ? 'currentColor' : 'none'}
          />
        </button>

        {listing.badgeLabel && (
          <span className="absolute bottom-1.5 left-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-text-secondary">
            {listing.badgeLabel}
          </span>
        )}
      </div>

      <div className={`${isGuide ? 'min-w-0 flex-1 py-1.5 pr-1.5' : 'p-2'}`}>
        <p className={`${titleSize} text-text-primary leading-snug line-clamp-1`}>{listing.title}</p>
        {listing.subtitle && (
          <p className="mt-0.5 text-[9px] text-text-faint line-clamp-1">{listing.subtitle}</p>
        )}

        <div className="mt-1 flex items-center justify-between text-[8px] text-text-faint">
          <span className="flex items-center gap-0.5">
            <MapPin size={8} />
            {listing.distanceKm} km
          </span>
          <span className="flex items-center gap-0.5">
            <Eye size={8} />
            {formatCount(listing.views)}
          </span>
        </div>

        {listing.priceUsd !== undefined && (
          <div className="mt-1.5 rounded-md bg-brand-red py-1 text-center text-[11px] text-white">
            {formatPrice(listing.priceUsd)}
          </div>
        )}
      </div>
    </a>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
