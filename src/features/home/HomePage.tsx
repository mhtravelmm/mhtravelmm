import { AdSlot } from '../../components/ui/AdSlot';
import { fetchMockAd } from '../../data/ads';
import { Hero } from './sections/Hero';
import { Categories } from './sections/Categories';
import { ListingGridSection } from './sections/ListingGridSection';
import { Reviews } from './sections/Reviews';
import { Awards } from './sections/Awards';
import { Partners } from './sections/Partners';
import { TRAVEL_PLANS, TRAVEL_GUIDES, BLOGS, POPULARS } from '../../data/homeData';
import {
  TOP_ATTRACTIONS,
  POPULAR_HOTELS,
  POPULAR_RESTAURANTS,
  POPULAR_BOOK_SHOPS,
  POPULAR_RENTALS,
  POPULAR_TRANSPORT,
  POPULAR_CAFES,
  POPULAR_MARKETS,
  POPULAR_SEARCHES,
} from '../../data/cityPageData';
import { useLanguage } from '../../lib/i18n';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';

function BreakAd({ placement }: { placement: string }) {
  return (
    <div className="mb-5">
      <AdSlot placement={placement} fetchAd={fetchMockAd} />
    </div>
  );
}

export function HomePage() {
  const { t } = useLanguage();

  // Each section manages its own favorite state so tapping the heart
  // on a card actually toggles it (this is a client-side placeholder
  // until Favorites is backed by Supabase — see useToggleFavorite).
  const travelPlans = useToggleFavorite(TRAVEL_PLANS);
  const travelGuides = useToggleFavorite(TRAVEL_GUIDES);
  const blogs = useToggleFavorite(BLOGS);
  const populars = useToggleFavorite(POPULARS);
  const attractions = useToggleFavorite(TOP_ATTRACTIONS);
  const hotels = useToggleFavorite(POPULAR_HOTELS);
  const restaurants = useToggleFavorite(POPULAR_RESTAURANTS);
  const bookShops = useToggleFavorite(POPULAR_BOOK_SHOPS);
  const rentals = useToggleFavorite(POPULAR_RENTALS);
  const transport = useToggleFavorite(POPULAR_TRANSPORT);
  const cafes = useToggleFavorite(POPULAR_CAFES);
  const markets = useToggleFavorite(POPULAR_MARKETS);

  return (
    <>
      <Hero />
      <Categories />

      <ListingGridSection
        title={t('section_travel_plans')}
        viewAllHref="/travel-plans"
        listings={travelPlans.listings}
        onToggleFavorite={travelPlans.toggle}
        columns={3}
      />
      <BreakAd placement="home_after_travel_plans" />

      <ListingGridSection
        title={t('section_travel_guide')}
        viewAllHref="/travel-guide"
        listings={travelGuides.listings}
        onToggleFavorite={travelGuides.toggle}
        columns={4}
        cardSize="sm"
        cardVariant="guide"
      />
      <ListingGridSection title={t('section_top_attractions')} viewAllHref="/attractions" listings={attractions.listings} onToggleFavorite={attractions.toggle} columns={5} cardSize="md" />
      <ListingGridSection title={t('section_popular_hotels')} viewAllHref="/hotels" listings={hotels.listings} onToggleFavorite={hotels.toggle} columns={5} cardSize="md" />
      <ListingGridSection title={t('section_restaurants')} viewAllHref="/restaurants" listings={restaurants.listings} onToggleFavorite={restaurants.toggle} columns={5} cardSize="md" />
      <ListingGridSection
        title={t('section_blogs')}
        viewAllHref="/blogs"
        listings={blogs.listings}
        onToggleFavorite={blogs.toggle}
        cardSize="sm"
      />
      <ListingGridSection title={t('section_book_shops')} viewAllHref="/book-shops" listings={bookShops.listings} onToggleFavorite={bookShops.toggle} columns={5} cardSize="md" />
      <ListingGridSection title={t('section_rentals')} viewAllHref="/rentals" listings={rentals.listings} onToggleFavorite={rentals.toggle} columns={5} cardSize="md" />
      <ListingGridSection title={t('section_transport_operators')} viewAllHref="/ticketing" listings={transport.listings} onToggleFavorite={transport.toggle} columns={5} cardSize="md" />
      <ListingGridSection title={t('section_cafes')} viewAllHref="/cafes" listings={cafes.listings} onToggleFavorite={cafes.toggle} columns={5} cardSize="md" />
      <ListingGridSection title={t('section_markets')} viewAllHref="/markets" listings={markets.listings} onToggleFavorite={markets.toggle} columns={5} cardSize="md" />
      <section className="mb-5"><h2 className="mb-2.5 text-sm font-medium text-text-primary">{t('section_popular_searches')}</h2><div className="flex flex-wrap gap-2">{POPULAR_SEARCHES.map((query) => <span key={query} className="rounded-full bg-bg-card px-3 py-1.5 text-[10px] text-text-secondary">{query}</span>)}</div></section>
      <BreakAd placement="home_after_blogs" />

      <ListingGridSection
        title={t('section_populars')}
        viewAllHref="/populars"
        listings={populars.listings}
        onToggleFavorite={populars.toggle}
        columns={6}
        cardSize="sm"
      />
      <Reviews />
      <BreakAd placement="home_after_reviews" />

      <Awards />
      <Partners />
      <BreakAd placement="home_after_partners" />
    </>
  );
}
