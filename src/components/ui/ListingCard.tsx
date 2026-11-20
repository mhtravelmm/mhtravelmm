import { Star, MapPin, Heart, Eye } from 'lucide-react';
import type { CardListing } from '../../types';
import { useCurrency } from '../../lib/currency';
import { useFavorites } from '../../lib/favorites';

interface ListingCardProps {
  listing: CardListing;
  onToggleFavorite?: (id: string) => void;
  /** Card size — the design system allows exactly these five. */
  size?: CardSize;
}

export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface CardSizeTokens {
  box: string;
  image: string;
  body: string;
  title: string;
  meta: string;
  icon: number;
  price: string;
  heart: string;
}

/**
 * The five allowed card sizes. See Design System Rules in Plan/PROJECT-PLAN.md.
 * Every size is a fixed box (width × height); a card never stretches to fill
 * its grid cell, so no card can render as a long thin bar.
 */
const CARD_SIZES: Record<CardSize, CardSizeTokens> = {
  xs: { box: 'w-[150px] h-[80px]', image: 'w-14', body: 'p-1.5', title: 'text-[9px]', meta: 'text-[7px]', icon: 8, price: 'text-[8px] px-1 py-0.5', heart: 'h-4 w-4' },
  sm: { box: 'w-[150px] h-[100px]', image: 'w-16', body: 'p-1.5', title: 'text-[10px]', meta: 'text-[8px]', icon: 9, price: 'text-[9px] px-1 py-0.5', heart: 'h-5 w-5' },
  md: { box: 'w-[180px] h-[80px]', image: 'w-16', body: 'p-1.5', title: 'text-[10px]', meta: 'text-[8px]', icon: 9, price: 'text-[9px] px-1 py-0.5', heart: 'h-5 w-5' },
  lg: { box: 'w-[200px] h-[100px]', image: 'w-[72px]', body: 'p-2', title: 'text-[11px]', meta: 'text-[8px]', icon: 10, price: 'text-[10px] px-1.5 py-0.5', heart: 'h-5 w-5' },
  xl: { box: 'w-[200px] h-[100px]', image: 'w-[76px]', body: 'p-2', title: 'text-[11px]', meta: 'text-[9px]', icon: 10, price: 'text-[10px] px-1.5 py-0.5', heart: 'h-6 w-6' },
};

/**
 * The single card component used everywhere a listing/content item is
 * shown (Travel Plans, Travel Guide, Blogs, Populars, Nearby, City cards,
 * business listings...). Rating, distance, favorite, and views are always
 * rendered — this is a confirmed, non-negotiable design rule, so it is
 * enforced here in one place rather than left to each call site.
 */
export function ListingCard({ listing, onToggleFavorite, size = 'md' }: ListingCardProps) {
  const { formatPrice } = useCurrency();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favoriteState = onToggleFavorite ? listing.isFavorited : isFavorite(listing.id, listing.isFavorited);
  const s = CARD_SIZES[size];

  return (
    <a
      href={listing.href ?? '#'}
      className={`relative flex ${s.box} overflow-hidden rounded-card border border-border bg-bg-card transition hover:border-brand-blue/40 hover:shadow-md`}
    >
      <div className={`relative h-full ${s.image} shrink-0 overflow-hidden bg-gradient-to-br from-bg-cardAlt to-bg`}>
        {listing.imageUrl && (
          <img src={listing.imageUrl} alt={listing.title} className="absolute inset-0 h-full w-full object-cover" />
        )}

        <span className="absolute left-1 top-1 flex items-center gap-0.5 rounded bg-black/70 px-1 py-0.5 text-[8px] text-status-rating">
          <Star size={8} fill="currentColor" />
          {listing.rating.toFixed(1)}
        </span>
      </div>

      <div className={`flex min-w-0 flex-1 flex-col justify-between ${s.body}`}>
        <div className="min-w-0">
          <p className={`${s.title} truncate font-semibold leading-snug text-text-primary`}>{listing.title}</p>
          {listing.subtitle && (
            <p className="mt-0.5 truncate text-[8px] text-text-faint">{listing.subtitle}</p>
          )}
        </div>

        <div>
          <div className={`flex items-center justify-between ${s.meta} text-text-faint`}>
            <span className="flex items-center gap-0.5">
              <MapPin size={s.icon} />
              {listing.distanceKm} km
            </span>
            <span className="flex items-center gap-0.5">
              <Eye size={s.icon} />
              {formatCount(listing.views)}
            </span>
          </div>

          {listing.priceUsd !== undefined && (
            <div className={`${s.price} mt-1 rounded bg-brand-red text-center text-white`}>
              {formatPrice(listing.priceUsd)}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          if (onToggleFavorite) onToggleFavorite(listing.id);
          else toggleFavorite(listing.id, listing.isFavorited);
        }}
        aria-label={favoriteState ? 'Remove from favorites' : 'Save to favorites'}
        className={`absolute right-1 top-1 flex ${s.heart} items-center justify-center rounded-full bg-white/95 text-brand-red shadow-sm`}
      >
        <Heart size={9} className="text-brand-red" fill={favoriteState ? 'currentColor' : 'none'} />
      </button>
    </a>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
