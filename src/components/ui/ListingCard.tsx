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
  subtitle: string;
  meta: string;
  icon: number;
  price: string;
  heart: string;
}

/**
 * The five allowed card sizes. See Design System Rules in Plan/PROJECT-PLAN.md.
 * Every size is a fixed 3:2 box, so the whole set shares one proportion and
 * the cards read as a single family. Width is capped rather than fixed so a
 * phone can fit two cards per row; the height stays constant per size.
 */
const CARD_SIZES: Record<CardSize, CardSizeTokens> = {
  xs: { box: 'max-w-[180px] h-[120px]', image: 'w-[42%] sm:w-[72px]', body: 'p-2 pr-[30px]', title: 'text-[12px]', subtitle: 'text-[10px]', meta: 'text-[9px]', icon: 10, price: 'text-[10px] px-1.5 py-0.5', heart: 'h-5 w-5' },
  sm: { box: 'max-w-[210px] h-[140px]', image: 'w-[42%] sm:w-[86px]', body: 'p-2.5 pr-[34px]', title: 'text-[13px]', subtitle: 'text-[10px]', meta: 'text-[10px]', icon: 11, price: 'text-[11px] px-1.5 py-0.5', heart: 'h-6 w-6' },
  md: { box: 'max-w-[240px] h-[160px]', image: 'w-[42%] sm:w-[100px]', body: 'p-2.5 pr-[34px]', title: 'text-[13px]', subtitle: 'text-[11px]', meta: 'text-[10px]', icon: 11, price: 'text-[11px] px-2 py-0.5', heart: 'h-6 w-6' },
  lg: { box: 'max-w-[270px] h-[180px]', image: 'w-[42%] sm:w-[112px]', body: 'p-3 pr-[38px]', title: 'text-[14px]', subtitle: 'text-[11px]', meta: 'text-[11px]', icon: 12, price: 'text-[12px] px-2 py-1', heart: 'h-7 w-7' },
  xl: { box: 'max-w-[300px] h-[200px]', image: 'w-[42%] sm:w-[126px]', body: 'p-3 pr-[38px]', title: 'text-[15px]', subtitle: 'text-[12px]', meta: 'text-[11px]', icon: 12, price: 'text-[12px] px-2 py-1', heart: 'h-7 w-7' },
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
      className={`relative flex w-full ${s.box} overflow-hidden rounded-card border border-border bg-bg-card transition hover:border-brand-blue/40 hover:shadow-md`}
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
            <p className={`mt-0.5 truncate ${s.subtitle} text-text-faint`}>{listing.subtitle}</p>
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
        <Heart size={s.icon} className="text-brand-red" fill={favoriteState ? 'currentColor' : 'none'} />
      </button>
    </a>
  );
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
