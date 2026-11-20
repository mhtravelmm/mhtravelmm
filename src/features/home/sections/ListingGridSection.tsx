import type { CardListing } from '../../../types';
import { ListingCard, type CardSize } from '../../../components/ui/ListingCard';
import { SectionHeader } from './SectionHeader';

interface ListingGridSectionProps {
  title: string;
  viewAllHref?: string;
  listings: CardListing[];
  cardSize?: CardSize;
  onToggleFavorite?: (id: string) => void;
  singleRow?: boolean;
}

/** Fixed box width of each card size, in pixels. Mirrors CARD_SIZES.box. */
const CARD_WIDTH: Record<CardSize, number> = { xs: 180, sm: 210, md: 240, lg: 270, xl: 300 };

/**
 * Cards are fixed-size boxes, so a row is simply as many boxes as fit and
 * wrap. Nothing stretches: each card keeps its own width and height.
 */
export function ListingGridSection({
  title,
  viewAllHref,
  listings,
  cardSize = 'md',
  onToggleFavorite,
  singleRow = false,
}: ListingGridSectionProps) {
  if (listings.length === 0) return null;

  return (
    <section className="mb-5">
      <SectionHeader title={title} viewAllHref={viewAllHref} />
      <div
        className={
          singleRow
            ? 'flex gap-2.5 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            : 'flex flex-wrap gap-2.5'
        }
        style={{ '--card-w': `${CARD_WIDTH[cardSize]}px` } as React.CSSProperties}
      >
        {listings.map((listing) => (
          <div key={listing.id} className="w-[calc(50%-0.3125rem)] shrink-0 sm:w-[var(--card-w)]">
            <ListingCard
              listing={listing}
              size={cardSize}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
