import { AdSlot } from '../../components/ui/AdSlot';
import { fetchMockAd } from '../../data/ads';
import { Hero } from './sections/Hero';
import { Categories } from './sections/Categories';
import { ListingGridSection } from './sections/ListingGridSection';
import { Reviews } from './sections/Reviews';
import { Awards } from './sections/Awards';
import { Partners } from './sections/Partners';
import { TRAVEL_PLANS, TRAVEL_GUIDES, BLOGS, POPULARS } from '../../data/homeData';
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
      />
      <ListingGridSection
        title={t('section_blogs')}
        viewAllHref="/blogs"
        listings={blogs.listings}
        onToggleFavorite={blogs.toggle}
        columns={4}
      />
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
