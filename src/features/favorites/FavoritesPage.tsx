import { Heart } from 'lucide-react';
import { ListingCard } from '../../components/ui/ListingCard';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';
import { useLanguage } from '../../lib/i18n';
import { BLOGS, POPULARS, TRAVEL_GUIDES, TRAVEL_PLANS } from '../../data/homeData';
import { TOP_ATTRACTIONS, POPULAR_CAFES, POPULAR_HOTELS, POPULAR_BOOK_SHOPS, POPULAR_MARKETS, POPULAR_RENTALS, POPULAR_RESTAURANTS, POPULAR_TRANSPORT } from '../../data/cityPageData';

export function FavoritesPage() {
  const { t } = useLanguage();
  const favorites = useToggleFavorite([
    ...TRAVEL_PLANS,
    ...TRAVEL_GUIDES,
    ...BLOGS,
    ...POPULARS,
    ...TOP_ATTRACTIONS,
    ...POPULAR_HOTELS,
    ...POPULAR_RESTAURANTS,
    ...POPULAR_BOOK_SHOPS,
    ...POPULAR_RENTALS,
    ...POPULAR_TRANSPORT,
    ...POPULAR_CAFES,
    ...POPULAR_MARKETS,
  ]);
  const saved = favorites.listings.filter((listing) => listing.isFavorited);

  return <div className="mx-auto max-w-7xl pb-8 pt-2 sm:pt-4">
    <div className="mb-4 flex items-center gap-2">
      <Heart size={17} className="text-brand-red" fill="currentColor" />
      <div>
        <h1 className="text-lg font-medium text-text-primary">{t('account_favorites')}</h1>
        <p className="mt-1 text-[11px] text-text-muted">{t('account_favorites_intro')}</p>
      </div>
    </div>
    {saved.length > 0 ? <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">{saved.map((listing) => <ListingCard key={listing.id} listing={listing} onToggleFavorite={favorites.toggle} size="md" />)}</div> : <div className="rounded-card border border-dashed border-border bg-bg-card p-10 text-center text-xs text-text-muted">{t('account_no_favorites')}</div>}
  </div>;
}
