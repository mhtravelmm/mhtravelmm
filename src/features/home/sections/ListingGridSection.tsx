import type { CardListing } from '../../../types';
import { ListingCard } from '../../../components/ui/ListingCard';
import { SectionHeader } from './SectionHeader';

interface ListingGridSectionProps {
  title: string;
  viewAllHref?: string;
  listings: CardListing[];
  columns?: 3 | 4 | 6;
  cardSize?: 'sm' | 'md';
  onToggleFavorite?: (id: string) => void;
}

const COLS: Record<number, string> = {
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  6: 'grid-cols-3 sm:grid-cols-6',
};

export function ListingGridSection({
  title,
  viewAllHref,
  listings,
  columns = 4,
  cardSize = 'md',
  onToggleFavorite,
}: ListingGridSectionProps) {
  if (listings.length === 0) return null;

  return (
    <section className="mb-5">
      <SectionHeader title={title} viewAllHref={viewAllHref} />
      <div className={`grid gap-2.5 ${COLS[columns]}`}>
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            size={cardSize}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>
    </section>
  );
}
