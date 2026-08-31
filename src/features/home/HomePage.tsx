import { AdSlot } from '../../components/ui/AdSlot';
import { Hero } from './sections/Hero';
import { Categories } from './sections/Categories';
import { ListingGridSection } from './sections/ListingGridSection';
import { Reviews } from './sections/Reviews';
import { Awards } from './sections/Awards';
import { Partners } from './sections/Partners';
import { TRAVEL_PLANS, TRAVEL_GUIDES, BLOGS, POPULARS } from '../../data/homeData';

function BreakAd({ placement }: { placement: string }) {
  return (
    <div className="mb-5">
      <AdSlot
        placement={placement}
        devPlaceholder="Ad slot — collapses automatically if no ad is available"
      />
    </div>
  );
}

export function HomePage() {
  return (
    <>
      <Hero />
      <Categories />

      <ListingGridSection title="Travel plans" viewAllHref="/travel-plans" listings={TRAVEL_PLANS} columns={3} />
      <BreakAd placement="home_after_travel_plans" />

      <ListingGridSection title="Travel guide" viewAllHref="/travel-guide" listings={TRAVEL_GUIDES} columns={4} />
      <ListingGridSection title="Blogs" viewAllHref="/blogs" listings={BLOGS} columns={4} />
      <BreakAd placement="home_after_blogs" />

      <ListingGridSection title="Populars" viewAllHref="/populars" listings={POPULARS} columns={6} cardSize="sm" />
      <Reviews />
      <BreakAd placement="home_after_reviews" />

      <Awards />
      <Partners />
      <BreakAd placement="home_after_partners" />
    </>
  );
}
