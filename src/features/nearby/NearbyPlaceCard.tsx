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
  variant?: 'standard' | 'mini';
}

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
  const destination = listing.href ?? '/nearby';

  return (
    <article className={`group relative overflow-hidden rounded-card border border-border bg-bg-card transition hover:border-brand-blue/40 hover:shadow-md ${isMini ? 'w-36 shrink-0' : 'min-w-0'}`}>
      <a href={destination} className={isMini ? 'block' : 'flex h-full flex-row md:flex-col'}>
        <div className={`relative shrink-0 overflow-hidden bg-bg-cardAlt ${isMini ? 'h-20 w-full' : 'h-24 w-24 md:h-32 md:w-full'}`}>
          {listing.imageUrl && <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />}
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 text-[10px] font-medium text-amber-300">
            <Star size={10} fill="currentColor" />{listing.rating.toFixed(1)}
          </span>
          {!isMini && <span className={`absolute bottom-2 left-2 rounded-full px-2 py-1 text-[9px] font-medium ${listing.openNow ? 'bg-emerald-500/90 text-white' : 'bg-black/75 text-white'}`}>
            {listing.openNow ? openNowLabel : closedLabel}
          </span>}
        </div>

        <div className={`flex min-w-0 flex-1 flex-col justify-between ${isMini ? 'p-2' : 'p-2.5 md:p-3'}`}>
          <div className="min-w-0 pr-5">
            <h3 className={`${isMini ? 'text-[10px]' : 'text-xs md:text-sm'} truncate font-semibold text-text-primary`}>{listing.title}</h3>
            <p className="mt-1 truncate text-[9px] text-brand-blue">{categoryLabel} <span className="text-text-faint">·</span> {listing.distanceKm.toFixed(1)} km</p>
            {!isMini && <>
              {listing.subtitle && <p className="mt-1 line-clamp-1 text-[10px] text-text-secondary">{listing.subtitle}</p>}
              <p className="mt-1 flex items-center gap-1 truncate text-[9px] text-text-faint"><MapPin size={10} className="shrink-0" />{listing.address}</p>
            </>}
          </div>

          <div className={`mt-2 flex items-center justify-between gap-2 text-[9px] text-text-faint ${isMini ? '' : 'border-t border-border/70 pt-2'}`}>
            <span className="inline-flex items-center gap-1"><Eye size={10} />{formatViews(listing.views)}</span>
            {!isMini && <span className="inline-flex items-center gap-1 font-medium text-brand-blue">{viewDetailsLabel}<ArrowRight size={11} /></span>}
          </div>
        </div>
      </a>

      <button
        type="button"
        onClick={() => onToggleFavorite(listing.id)}
        aria-label={isFavorited ? removeLabel : saveLabel}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-brand-red shadow-sm transition hover:scale-105"
      >
        <Heart size={14} fill={isFavorited ? 'currentColor' : 'none'} />
      </button>
    </article>
  );
}

function formatViews(count: number) {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
}
