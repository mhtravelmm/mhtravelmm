import type { CardListing } from '../../../types';
import { ListingCard } from '../../../components/ui/ListingCard';
import { SectionHeader } from './SectionHeader';

interface ListingGridSectionProps {
  title: string;
  viewAllHref?: string;
  listings: CardListing[];
  columns?: 3 | 4 | 5 | 6;
  cardSize?: 'sm' | 'md' | 'lg';
  cardVariant?: 'default' | 'guide';
  onToggleFavorite?: (id: string) => void;
  singleRow?: boolean;
}

const COLS: Record<number, string> = {
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-5',
  6: 'grid-cols-3 sm:grid-cols-6',
};

export function ListingGridSection({
  title,
  viewAllHref,
  listings,
  columns = 4,
  cardSize = 'md',
  cardVariant = 'default',
  onToggleFavorite,
  singleRow = false,
}: ListingGridSectionProps) {
  if (listings.length === 0) return null;

  return (
    <section className="mb-5">
      <SectionHeader title={title} viewAllHref={viewAllHref} />
      <div className={singleRow ? 'flex gap-2.5 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:overflow-visible lg:pb-0' : `grid gap-2.5 ${COLS[columns]}`}>
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

          return singleRow ? (
            <div key={listing.id} className="w-[68%] min-w-[145px] max-w-[230px] shrink-0 sm:w-[29%] sm:max-w-none lg:w-[calc((100%_-_2.5rem)/5)]">
              {card}
            </div>
          ) : card;
        })}
      </div>
    </section>
  );
}
