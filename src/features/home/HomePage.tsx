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

function BreakAd({ placement }: { placement: string }) {
  return (
    <div className="mb-5">
      <AdSlot placement={placement} fetchAd={fetchMockAd} />
    </div>
  );
}

export function HomePage() {
  const { t } = useLanguage();

  return (
    <>
      <Hero />
      <Categories />

      <ListingGridSection
        title={t('section_travel_plans')}
        viewAllHref="/travel-plans"
        listings={TRAVEL_PLANS}
        columns={3}
      />
      <BreakAd placement="home_after_travel_plans" />

      <ListingGridSection
        title={t('section_travel_guide')}
        viewAllHref="/travel-guide"
        listings={TRAVEL_GUIDES}
        columns={4}
      />
      <ListingGridSection title={t('section_blogs')} viewAllHref="/blogs" listings={BLOGS} columns={4} />
      <BreakAd placement="home_after_blogs" />

      <ListingGridSection
        title={t('section_populars')}
        viewAllHref="/populars"
        listings={POPULARS}
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
