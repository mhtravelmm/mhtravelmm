import { MapPin, Search as SearchIcon } from 'lucide-react';
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
      <section className="relative isolate mb-5 min-h-[176px] overflow-hidden rounded-2xl bg-slate-950 sm:min-h-[214px] md:min-h-[242px]">
        <img src="/images/blog/shwedagon-evening.webp" alt="Shwedagon Pagoda at dusk" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06162c]/95 via-[#071a31]/72 to-[#071a31]/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06162c]/45 via-transparent to-[#06162c]/10" />
        <MapPin className="absolute right-[13%] top-8 hidden text-cyan-200/80 drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] md:block" size={74} strokeWidth={1.35} />
        <div className="relative z-10 flex min-h-[176px] items-center px-4 py-5 sm:min-h-[214px] sm:px-7 md:min-h-[242px] md:px-10">
          <div className="max-w-xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-slate-950/45 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-100 backdrop-blur sm:text-[10px]">
              <MapPin size={12} /> {t('city_hero_badge')}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-[40px]">{t('city_hero_title')}</h1>
            <p className="mt-1.5 text-xs font-semibold text-white sm:text-sm md:text-base">{t('city_hero_subtitle')}</p>
            <p className="mt-1 text-[10px] text-slate-200 sm:text-xs">{t('city_hero_detail')}</p>
            <a href="#city-list" className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-3.5 py-2 text-[10px] font-bold text-slate-950 shadow-lg shadow-cyan-950/35 transition hover:-translate-y-0.5 hover:bg-cyan-300 sm:mt-4 sm:px-4 sm:py-2.5 sm:text-xs">
              {t('city_hero_browse')} <SearchIcon size={13} />
            </a>
          </div>
        </div>
      </section>

      <section id="city-list" className="mb-5 scroll-mt-24">
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
        cardSize="lg"
      />

      <ListingGridSection
        title={t('section_top_attractions')}
        viewAllHref="/attractions"
        listings={TOP_ATTRACTIONS}
        columns={5}
        cardSize="sm"
      />

      <BreakAd placement="city_after_attractions" />

      <ListingGridSection
        title={t('section_popular_hotels')}
        viewAllHref="/hotels"
        listings={POPULAR_HOTELS}
        columns={5}
        cardSize="md"
      />
      <ListingGridSection
        title={t('section_restaurants')}
        viewAllHref="/restaurants"
        listings={POPULAR_RESTAURANTS}
        columns={5}
        cardSize="md"
      />
      <ListingGridSection
        title={t('section_book_shops')}
        viewAllHref="/book-shops"
        listings={POPULAR_BOOK_SHOPS}
        columns={5}
        cardSize="md"
      />

      <BreakAd placement="city_after_shopping" />

      <ListingGridSection
        title={t('section_rentals')}
        viewAllHref="/rentals"
        listings={POPULAR_RENTALS}
        columns={5}
        cardSize="md"
      />
      <ListingGridSection
        title={t('section_transport_operators')}
        viewAllHref="/ticketing"
        listings={POPULAR_TRANSPORT}
        columns={5}
        cardSize="md"
      />
      <ListingGridSection
        title={t('section_cafes')}
        viewAllHref="/cafes"
        listings={POPULAR_CAFES}
        columns={5}
        cardSize="md"
      />
      <ListingGridSection
        title={t('section_markets')}
        viewAllHref="/markets"
        listings={POPULAR_MARKETS}
        columns={5}
        cardSize="md"
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
