import type { CardListing } from '../../../types';
import { ListingCard, type CardSize } from '../../../components/ui/ListingCard';
import { SectionHeader } from './SectionHeader';

interface ListingGridSectionProps {
  title: string;
  viewAllHref?: string;
  listings: CardListing[];
  columns?: 3 | 4 | 5 | 6;
  cardSize?: CardSize;
  cardVariant?: 'default' | 'guide';
  onToggleFavorite?: (id: string) => void;
  singleRow?: boolean;
}

/**
 * Widest a card of each size may render. The row is capped at
 * `columns` cards of this width, so cards never stretch into long bars on a
 * wide screen. Mirrors `maxWidth` in ListingCard's CARD_SIZES.
 */
const CARD_WIDTH: Record<CardSize, number> = { xs: 150, sm: 190, md: 240, lg: 300, xl: 340 };
const GAP_PX = 10;

export function ListingGridSection({
  title,
  viewAllHref,
  listings,
  columns = 5,
  cardSize = 'md',
  cardVariant = 'default',
  onToggleFavorite,
  singleRow = false,
}: ListingGridSectionProps) {
  if (listings.length === 0) return null;

  const cardWidth = CARD_WIDTH[cardSize];
  const rowWidth = columns * cardWidth + (columns - 1) * GAP_PX;

  return (
    <section className="mb-5">
      <SectionHeader title={title} viewAllHref={viewAllHref} />
      <div
        className={singleRow ? 'flex gap-2.5 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible lg:pb-0' : 'flex flex-wrap gap-2.5'}
        style={singleRow ? undefined : ({ maxWidth: rowWidth, '--card-w': `${cardWidth}px` } as React.CSSProperties)}
      >
        {listings.map((listing) => {
          const card = (
            <ListingCard
              key={listing.id}
              listing={listing}
              size={cardSize}
              variant={cardVariant}
              onToggleFavorite={onToggleFavorite}
            />
          );

          if (singleRow) {
            return (
              <div key={listing.id} className="w-[68%] min-w-[145px] shrink-0 sm:w-[29%] lg:w-[var(--card-w)]">
                {card}
              </div>
            );
          }

          return (
            <div key={listing.id} className="w-[calc(50%-0.3125rem)] sm:w-[var(--card-w)]">
              {card}
            </div>
          );
        })}
      </div>
    </section>
  );
}
