import { ArrowLeft, CalendarDays, Compass, MapPin, Search as SearchIcon } from 'lucide-react';
import { AdSlot } from '../../components/ui/AdSlot';
import { fetchMockAd } from '../../data/ads';
import { ListingGridSection } from '../home/sections/ListingGridSection';
import { SectionHeader } from '../home/sections/SectionHeader';
import { ListingCard } from '../../components/ui/ListingCard';
import { useLanguage } from '../../lib/i18n';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
      <section className="mh-page-hero relative isolate mb-5 overflow-hidden rounded-2xl bg-slate-950">
        <img src="/images/blog/shwedagon-evening.webp" alt="Shwedagon Pagoda at dusk" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06162c]/95 via-[#071a31]/72 to-[#071a31]/15" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06162c]/45 via-transparent to-[#06162c]/10" />
        <MapPin className="absolute right-[13%] top-8 hidden text-cyan-200/80 drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] md:block" size={74} strokeWidth={1.35} />
        <div className="relative z-10 flex h-full items-center px-4 py-5 sm:px-7 md:px-10">
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


const CITY_DETAIL_CONTENT: Record<string, { image: string; mmTitle: string; intro: string; mmIntro: string; bestFor: string; stay: string; travel: string }> = {
  yangon: { image: '/images/blog/shwedagon-evening.webp', mmTitle: 'ရန်ကုန်', intro: 'Myanmar’s lively gateway city blends golden pagodas, colonial streets, food markets, and modern city energy.', mmIntro: 'ရွှေတိဂုံဘုရား၊ ကိုလိုနီခေတ်လမ်းများ၊ အစားအသောက်ဈေးများနှင့် မြို့ပြအတွေ့အကြုံများကို တစ်နေရာတည်းမှာ ရှာဖွေပါ။', bestFor: 'Culture, food & city discovery', stay: '2–3 days', travel: 'Yangon International Airport · Bus terminal' },
  bagan: { image: '/images/blog/bagan-sunrise.webp', mmTitle: 'ပုဂံ', intro: 'Watch the sunrise over ancient temples and experience one of Myanmar’s most unforgettable heritage destinations.', mmIntro: 'ရှေးဟောင်းဘုရားများပေါ်မှ နေထွက်ချိန်ကို ကြည့်ရှုပြီး မြန်မာ့ယဉ်ကျေးမှုအမွေအနှစ်ကို ခံစားနိုင်ပါသည်။', bestFor: 'Heritage, temples & sunrise', stay: '2–4 days', travel: 'Nyaung-U Airport · Express bus' },
  mandalay: { image: '/images/blog/ubein-evening.webp', mmTitle: 'မန္တလေး', intro: 'Discover royal history, craft workshops, riverside views, and the warm local rhythm of Upper Myanmar.', mmIntro: 'နန်းမြို့ဟောင်းသမိုင်း၊ လက်မှုပညာဆိုင်များ၊ မြစ်ကမ်းမြင်ကွင်းများနှင့် အထက်မြန်မာပြည်အတွေ့အကြုံများကို လေ့လာပါ။', bestFor: 'History, crafts & day trips', stay: '2–3 days', travel: 'Mandalay International Airport · Railway' },
  inle: { image: '/images/blog/inle-stilt-houses.webp', mmTitle: 'အင်းလေးကန်', intro: 'Float through stilt villages, floating gardens, and quiet mountain landscapes around Inle Lake.', mmIntro: 'တိုင်အိမ်ရွာများ၊ ရေပေါ်ဥယျာဉ်များနှင့် တောင်တန်းရှုခင်းများကြား အင်းလေးကန်ကို လှေဖြင့် လည်ပတ်ပါ။', bestFor: 'Nature, lake life & photography', stay: '2–3 days', travel: 'Heho Airport · Nyaung Shwe transfer' },
  ngapali: { image: '/images/blog/inle-stilt-houses.webp', mmTitle: 'ငပလီကမ်းခြေ', intro: 'Slow down beside clear water, palm-lined beaches, seafood restaurants, and unforgettable coastal sunsets.', mmIntro: 'ကြည်လင်သောပင်လယ်ရေ၊ ထန်းပင်တန်းကမ်းခြေ၊ ပင်လယ်စာနှင့် နေဝင်ချိန်များကို အေးချမ်းစွာ ခံစားပါ။', bestFor: 'Beach, seafood & relaxation', stay: '3–5 days', travel: 'Thandwe Airport · Coastal transfer' },
  bago: { image: '/images/blog/shwedagon-evening.webp', mmTitle: 'ပဲခူး', intro: 'Take a short cultural escape from Yangon to explore monasteries, pagodas, and royal-era stories.', mmIntro: 'ရန်ကုန်မှ အချိန်တိုအတွင်း သွားရောက်နိုင်သော ဘုရားများ၊ ကျောင်းများနှင့် နန်းမြို့ဟောင်းသမိုင်းကို လေ့လာပါ။', bestFor: 'Day trips & culture', stay: '1–2 days', travel: 'Yangon–Bago highway · Railway' },
  mawlamyine: { image: '/images/blog/ubein-evening.webp', mmTitle: 'မော်လမြိုင်', intro: 'Enjoy breezy waterfront views, island day trips, Mon heritage, and a slower southern Myanmar pace.', mmIntro: 'ပင်လယ်ကမ်းမြင်ကွင်း၊ ကျွန်းခရီးစဉ်များ၊ မွန်ယဉ်ကျေးမှုနှင့် တောင်ပိုင်းမြန်မာပြည်အေးချမ်းမှုကို ခံစားပါ။', bestFor: 'Coast, culture & islands', stay: '2–3 days', travel: 'Mawlamyine Airport · Highway bus' },
  kyaiktiyo: { image: '/images/blog/bagan-sunrise.webp', mmTitle: 'ကျိုက်ထီးရိုး', intro: 'Make a memorable pilgrimage to the Golden Rock and enjoy mountain air, viewpoints, and local stories.', mmIntro: 'ကျိုက်ထီးရိုးစေတီတော်သို့ သွားရောက်ဖူးမြော်ပြီး တောင်ပေါ်လေ၊ မြင်ကွင်းနှင့် ဒေသခံအတွေ့အကြုံများကို ခံစားပါ။', bestFor: 'Pilgrimage & mountain views', stay: '1–2 days', travel: 'Kyaikhto transfer · Mountain truck' },
  taunggyi: { image: '/images/blog/inle-stilt-houses.webp', mmTitle: 'တောင်ကြီး', intro: 'Explore Shan highlands, cool weather, markets, viewpoints, and gateway experiences to Inle Lake.', mmIntro: 'ရှမ်းပြည်တောင်တန်း၊ အေးမြသောရာသီဥတု၊ ဈေးများနှင့် အင်းလေးကန်သို့ ဝင်ပေါက်အတွေ့အကြုံများကို ရှာဖွေပါ။', bestFor: 'Highlands, markets & nature', stay: '2–3 days', travel: 'Heho Airport · Shan highway' },
  kalaw: { image: '/images/blog/ubein-evening.webp', mmTitle: 'ကလော', intro: 'Breathe in the cool pine air and set off on scenic walks through villages and mountain trails.', mmIntro: 'အေးမြသောထင်းရှူးလေထု၊ ရွာလမ်းလျှောက်ခရီးနှင့် တောင်တန်းလမ်းကြောင်းများကို ခံစားပါ။', bestFor: 'Trekking, nature & wellness', stay: '2–3 days', travel: 'Heho Airport · Mountain road' },
};

export function CityDetailPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { cityId } = useParams<{ cityId: string }>();
  const city = CITIES.find((item) => item.id === cityId || item.href?.endsWith(`/${cityId}`));
  const content = city ? CITY_DETAIL_CONTENT[city.id] : undefined;
  const [activeCategory, setActiveCategory] = useState('all');
  const [businessQuery, setBusinessQuery] = useState('');
  const [showAllBusinesses, setShowAllBusinesses] = useState(false);

  if (!city || !content) return <div className="mx-auto max-w-3xl px-4 py-16 text-center"><p className="text-sm text-text-muted">City not found.</p><button type="button" onClick={() => navigate('/cities')} className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-blue px-4 py-2 text-xs font-semibold text-white"><ArrowLeft size={14} /> Back to Cities</button></div>;

  const title = language === 'mm' ? content.mmTitle : city.title;
  const intro = language === 'mm' ? content.mmIntro : content.intro;
  const categoryGroups = [
    { id: 'all', label: language === 'mm' ? 'အားလုံး' : 'All', items: [...TOP_ATTRACTIONS, ...POPULAR_HOTELS, ...POPULAR_RESTAURANTS, ...POPULAR_BOOK_SHOPS, ...POPULAR_RENTALS, ...POPULAR_TRANSPORT, ...POPULAR_CAFES, ...POPULAR_MARKETS] },
    { id: 'attractions', label: language === 'mm' ? 'လည်ပတ်စရာ' : 'Attractions', items: TOP_ATTRACTIONS },
    { id: 'hotels', label: language === 'mm' ? 'ဟိုတယ်များ' : 'Hotels', items: POPULAR_HOTELS },
    { id: 'restaurants', label: language === 'mm' ? 'စားသောက်ဆိုင်များ' : 'Restaurants', items: POPULAR_RESTAURANTS },
    { id: 'bookshops', label: language === 'mm' ? 'စာအုပ်ဆိုင်များ' : 'Book shops', items: POPULAR_BOOK_SHOPS },
    { id: 'rentals', label: language === 'mm' ? 'ငှားရမ်းမှုများ' : 'Rentals', items: POPULAR_RENTALS },
    { id: 'transport', label: language === 'mm' ? 'သယ်ယူပို့ဆောင်ရေး' : 'Transport', items: POPULAR_TRANSPORT },
    { id: 'cafes', label: language === 'mm' ? 'ကဖေးများ' : 'Cafes', items: POPULAR_CAFES },
    { id: 'markets', label: language === 'mm' ? 'ဈေးများ' : 'Markets', items: POPULAR_MARKETS },
  ];
  const selectedCategory = categoryGroups.find((item) => item.id === activeCategory) ?? categoryGroups[0];
  const needle = businessQuery.trim().toLocaleLowerCase(language === 'mm' ? 'my-MM' : 'en-US');
  const filteredBusinesses = selectedCategory.items.filter((item) => !needle || item.title.toLocaleLowerCase(language === 'mm' ? 'my-MM' : 'en-US').includes(needle));
  const visibleBusinesses = showAllBusinesses ? filteredBusinesses : filteredBusinesses.slice(0, 12);

  return <div className="mx-auto max-w-7xl pb-10 pt-3 sm:pt-5">
    <button type="button" onClick={() => navigate('/cities')} className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:text-brand-blueLight"><ArrowLeft size={14} /> {language === 'mm' ? 'မြို့များသို့ ပြန်သွားရန်' : 'Back to Cities'}</button>
    <section className="relative overflow-hidden rounded-2xl border border-border bg-slate-950"><img src={content.image} alt={title} className="h-64 w-full object-cover sm:h-80 md:h-[360px]" /><div className="absolute inset-0 bg-gradient-to-t from-[#06162c] via-[#06162c]/60 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{language === 'mm' ? 'မြန်မာနိုင်ငံကို ရှာဖွေပါ' : 'Discover Myanmar'}</p><h1 className="mt-1 text-3xl font-extrabold text-white sm:text-5xl">{title}</h1><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-200 sm:text-sm">{intro}</p></div><button type="button" onClick={() => navigate('/travel-plans')} className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-cyan-300"><Compass size={15} /> {language === 'mm' ? 'ခရီးစဉ်စီစဉ်မည်' : 'Plan a trip'}</button></div></div></section>
    <div className="mt-4 grid gap-3 sm:grid-cols-3"><CityFact icon={MapPin} label={language === 'mm' ? 'လည်ပတ်ရန်အကောင်းဆုံး' : 'Best for'} value={content.bestFor} /><CityFact icon={CalendarDays} label={language === 'mm' ? 'အကြံပြုရက်' : 'Recommended stay'} value={content.stay} /><CityFact icon={Compass} label={language === 'mm' ? 'သွားလာရန်' : 'Getting there'} value={content.travel} /></div>
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brand-blue">{language === 'mm' ? 'မြို့အတွင်း ရှာဖွေပါ' : 'Explore the city'}</p><h2 className="mt-1 text-xl font-bold text-text-primary">{language === 'mm' ? `${title} မှ လုပ်ငန်းများနှင့် နေရာများ` : `Places and businesses in ${title}`}</h2></div><span className="hidden text-xs text-text-muted sm:block">★ {city.rating.toFixed(1)} · {city.views.toLocaleString()} views</span></div>
      <div className="rounded-2xl border border-border bg-bg-card p-3 sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row"><label className="relative min-w-0 flex-1"><span className="sr-only">Search businesses</span><SearchIcon size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" /><input value={businessQuery} onChange={(event) => { setBusinessQuery(event.target.value); setShowAllBusinesses(false); }} placeholder={language === 'mm' ? `${title} အတွင်း ရှာဖွေပါ...` : `Search hotels, restaurants, places in ${title}...`} className="w-full rounded-md border border-border bg-bg py-2.5 pl-9 pr-3 text-xs text-text-primary outline-none placeholder:text-text-faint focus:border-brand-blue/60" /></label><span className="flex items-center justify-center rounded-md bg-brand-blue/10 px-3 py-2 text-[11px] font-semibold text-brand-blue">{filteredBusinesses.length} {language === 'mm' ? 'ခုတွေ့ရှိ' : 'results'}</span></div>
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">{categoryGroups.map((category) => <button key={category.id} type="button" onClick={() => { setActiveCategory(category.id); setShowAllBusinesses(false); }} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${activeCategory === category.id ? 'bg-brand-blue text-white' : 'bg-bg text-text-secondary hover:bg-brand-blue/10 hover:text-brand-blue'}`}>{category.label}<span className="ml-1 opacity-70">{category.items.length}</span></button>)}</div>
        {visibleBusinesses.length > 0 ? <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{visibleBusinesses.map((item, index) => <ListingCard key={`${activeCategory}-${item.id}-${index}`} listing={item} />)}</div> : <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-10 text-center text-xs text-text-muted">{language === 'mm' ? 'ကိုက်ညီသော လုပ်ငန်းမတွေ့ပါ။' : 'No matching businesses found.'}</div>}
        {filteredBusinesses.length > 12 && <button type="button" onClick={() => setShowAllBusinesses((current) => !current)} className="mt-4 w-full rounded-md border border-brand-blue/30 px-4 py-2.5 text-xs font-semibold text-brand-blue hover:bg-brand-blue/10">{showAllBusinesses ? (language === 'mm' ? 'လျှော့ပြမည်' : 'Show less') : (language === 'mm' ? `နောက်ထပ် ${filteredBusinesses.length - 12} ခုကြည့်မည်` : `Show ${filteredBusinesses.length - 12} more`)}</button>}
      </div>
    </section>
    <section className="mt-7 rounded-2xl border border-brand-blue/25 bg-bg-card p-4 sm:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-blue">{language === 'mm' ? 'သင့်ခရီးစဉ်ကို စတင်ပါ' : 'Start your journey'}</p><h2 className="mt-1 text-xl font-bold text-text-primary">{language === 'mm' ? `${title} ခရီးစဉ်ကို စီစဉ်ပါ` : `Plan your ${title} trip`}</h2><p className="mt-1 text-xs leading-5 text-text-muted">{language === 'mm' ? 'နေ့ရက်၊ သယ်ယူပို့ဆောင်ရေးနှင့် တည်းခိုနေရာကို စိတ်ကြိုက်ရွေးချယ်ပြီး MH Travel quotation တောင်းနိုင်ပါသည်။' : 'Choose your dates, transport, and stay preferences, then request a personalized MH Travel quotation.'}</p></div><button type="button" onClick={() => navigate('/travel-plans#custom-plan')} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-brand-red px-4 py-3 text-xs font-semibold text-white hover:brightness-110">{language === 'mm' ? 'Custom Plan တောင်းမည်' : 'Build a Custom Plan'}</button></div></section>
  </div>;
}

function CityFact({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) { return <div className="flex items-start gap-3 rounded-xl border border-border bg-bg-card p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue"><Icon size={17} /></span><div><p className="text-[10px] text-text-faint">{label}</p><p className="mt-0.5 text-xs font-semibold text-text-primary">{value}</p></div></div>; }
