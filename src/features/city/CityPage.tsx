import { Search as SearchIcon } from 'lucide-react';
import { AdSlot } from '../../components/ui/AdSlot';
import { fetchMockAd } from '../../data/ads';
import { ListingGridSection } from '../home/sections/ListingGridSection';
import { SectionHeader } from '../home/sections/SectionHeader';
import { ListingCard } from '../../components/ui/ListingCard';
import { useLanguage } from '../../lib/i18n';
import {
  CITIES,
  CITY_TRAVEL_GUIDES,
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

function BreakAd({ placement }: { placement: string }) {
  return (
    <div className="mb-5">
      <AdSlot placement={placement} fetchAd={fetchMockAd} />
    </div>
  );
}

export function CityPage() {
  const { t } = useLanguage();

  return (
    <>
      <div className="mb-5">
        <AdSlot placement="city_hero" fetchAd={fetchMockAd} />
      </div>

      <section className="mb-5">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <h1 className="text-base font-medium text-text-primary">{t('section_cities')}</h1>
          <div className="flex w-40 items-center gap-2 rounded-full bg-bg-card px-3 py-1.5">
            <SearchIcon size={12} className="text-text-faint" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              className="w-full bg-transparent text-[10px] text-text-primary placeholder:text-text-faint focus:outline-none"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
          {CITIES.map((city) => (
            <ListingCard key={city.id} listing={city} />
          ))}
        </div>
        <div className="mt-3 text-center">
          <button
            type="button"
            className="rounded-full bg-bg-card px-4 py-1.5 text-[10px] text-brand-blue"
          >
            {t('see_more_cities')}
          </button>
        </div>
      </section>

      <BreakAd placement="city_after_cities" />

      <ListingGridSection
        title={t('section_travel_guide')}
        viewAllHref="/travel-guide"
        listings={CITY_TRAVEL_GUIDES}
        columns={3}
      />

      <ListingGridSection
        title={t('section_top_attractions')}
        viewAllHref="/attractions"
        listings={TOP_ATTRACTIONS}
        columns={6}
        cardSize="sm"
      />

      <BreakAd placement="city_after_attractions" />

      <ListingGridSection
        title={t('section_popular_hotels')}
        viewAllHref="/hotels"
        listings={POPULAR_HOTELS}
        columns={6}
        cardSize="sm"
      />
      <ListingGridSection
        title={t('section_restaurants')}
        viewAllHref="/restaurants"
        listings={POPULAR_RESTAURANTS}
        columns={6}
        cardSize="sm"
      />
      <ListingGridSection
        title={t('section_book_shops')}
        viewAllHref="/book-shops"
        listings={POPULAR_BOOK_SHOPS}
        columns={6}
        cardSize="sm"
      />

      <BreakAd placement="city_after_shopping" />

      <ListingGridSection
        title={t('section_rentals')}
        viewAllHref="/rentals"
        listings={POPULAR_RENTALS}
        columns={6}
        cardSize="sm"
      />
      <ListingGridSection
        title={t('section_transport_operators')}
        viewAllHref="/ticketing"
        listings={POPULAR_TRANSPORT}
        columns={6}
        cardSize="sm"
      />
      <ListingGridSection
        title={t('section_cafes')}
        viewAllHref="/cafes"
        listings={POPULAR_CAFES}
        columns={6}
        cardSize="sm"
      />
      <ListingGridSection
        title={t('section_markets')}
        viewAllHref="/markets"
        listings={POPULAR_MARKETS}
        columns={6}
        cardSize="sm"
      />

      <section className="mb-5">
        <SectionHeader title={t('section_popular_searches')} />
        <div className="flex flex-wrap gap-2">
          {POPULAR_SEARCHES.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 rounded-full bg-bg-card px-3 py-1.5 text-[9px] text-text-secondary"
            >
              <SearchIcon size={9} />
              {s}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
