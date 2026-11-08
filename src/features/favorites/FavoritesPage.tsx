import { useState } from 'react';
import { Heart } from 'lucide-react';
import { ListingCard } from '../../components/ui/ListingCard';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { BLOGS, POPULARS, TRAVEL_GUIDES, TRAVEL_PLANS } from '../../data/homeData';
import { TOP_ATTRACTIONS, POPULAR_CAFES, POPULAR_HOTELS, POPULAR_BOOK_SHOPS, POPULAR_MARKETS, POPULAR_RENTALS, POPULAR_RESTAURANTS, POPULAR_TRANSPORT } from '../../data/cityPageData';
import type { CardListing } from '../../types';

type FavoriteCategory = 'all' | 'blogs' | 'plans' | 'guides' | 'hotels' | 'restaurants' | 'bookshops' | 'rentals' | 'transport' | 'cafes' | 'markets' | 'attractions';

type FavoriteGroup = { id: FavoriteCategory; label: TranslationKey; listings: CardListing[] };

const ALL_LISTINGS = [...TRAVEL_PLANS, ...TRAVEL_GUIDES, ...BLOGS, ...POPULARS, ...TOP_ATTRACTIONS, ...POPULAR_HOTELS, ...POPULAR_RESTAURANTS, ...POPULAR_BOOK_SHOPS, ...POPULAR_RENTALS, ...POPULAR_TRANSPORT, ...POPULAR_CAFES, ...POPULAR_MARKETS];

const GROUPS: FavoriteGroup[] = [
  { id: 'all', label: 'favorites_all', listings: ALL_LISTINGS },
  { id: 'blogs', label: 'favorites_blogs', listings: BLOGS },
  { id: 'plans', label: 'favorites_plans', listings: TRAVEL_PLANS },
  { id: 'guides', label: 'favorites_guides', listings: TRAVEL_GUIDES },
  { id: 'hotels', label: 'favorites_hotels', listings: POPULAR_HOTELS },
  { id: 'restaurants', label: 'favorites_restaurants', listings: POPULAR_RESTAURANTS },
  { id: 'bookshops', label: 'favorites_bookshops', listings: POPULAR_BOOK_SHOPS },
  { id: 'rentals', label: 'favorites_rentals', listings: POPULAR_RENTALS },
  { id: 'transport', label: 'favorites_transport', listings: POPULAR_TRANSPORT },
  { id: 'cafes', label: 'favorites_cafes', listings: POPULAR_CAFES },
  { id: 'markets', label: 'favorites_markets', listings: POPULAR_MARKETS },
  { id: 'attractions', label: 'favorites_attractions', listings: TOP_ATTRACTIONS },
];

export function FavoritesPage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<FavoriteCategory>('all');
  const favorites = useToggleFavorite(ALL_LISTINGS);
  const activeGroup = GROUPS.find((group) => group.id === activeCategory) ?? GROUPS[0];
  const saved = activeGroup.listings
    .map((item) => favorites.listings.find((listing) => listing.id === item.id) ?? item)
    .filter((listing) => listing.isFavorited);
  const allSaved = favorites.listings.filter((listing) => listing.isFavorited);

  return <div className="mx-auto max-w-7xl pb-8 pt-2 sm:pt-4">
    <div className="mb-4 flex items-center gap-2">
      <Heart size={17} className="text-brand-red" fill="currentColor" />
      <div>
        <h1 className="text-lg font-medium text-text-primary">{t('account_favorites')}</h1>
        <p className="mt-1 text-[11px] text-text-muted">{t('account_favorites_intro')}</p>
      </div>
    </div>

    <div className="mb-4 flex gap-1.5 overflow-x-auto border-b border-border pb-2">
      {GROUPS.map((group) => {
        const count = group.id === 'all' ? allSaved.length : group.listings.filter((item) => favorites.listings.find((listing) => listing.id === item.id)?.isFavorited).length;
        return <button key={group.id} type="button" onClick={() => setActiveCategory(group.id)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-[10px] transition ${activeCategory === group.id ? 'bg-brand-blue text-white' : 'text-text-secondary hover:bg-bg-cardAlt hover:text-text-primary'}`}>
          {t(group.label)}<span className={`rounded-full px-1.5 py-0.5 text-[9px] ${activeCategory === group.id ? 'bg-white/20 text-white' : 'bg-bg-card text-text-faint'}`}>{count}</span>
        </button>;
      })}
    </div>

    <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-medium text-text-primary">{t(activeGroup.label)}</h2><span className="text-[10px] text-text-faint">{saved.length} {t('favorites_saved_items')}</span></div>
    {saved.length > 0 ? <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">{saved.map((listing) => <ListingCard key={listing.id} listing={listing} onToggleFavorite={favorites.toggle} size="md" />)}</div> : <div className="rounded-card border border-dashed border-border bg-bg-card p-10 text-center text-xs text-text-muted">{t('account_no_favorites')}</div>}
  </div>;
}
