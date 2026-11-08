import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BusFront,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Clock3,
  MapPin,
  Plane,
  Search,
  Ticket,
  TrainFront,
  Users,
} from 'lucide-react';
import { useCurrency } from '../../lib/currency';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import {
  POPULAR_FLIGHT_ROUTES,
  TICKETING_CINEMA_VENUES,
  TICKETING_PLACES,
  TICKETING_SERVICES,
  type PopularRoute,
  type TicketPlace,
  type TicketService,
  type TicketType,
} from './ticketingData';

const PRIMARY_PRODUCTS: { id: TicketType; icon: typeof Plane; labelKey: TranslationKey }[] = [
  { id: 'flight', icon: Plane, labelKey: 'ticketing_flights' },
  { id: 'bus', icon: BusFront, labelKey: 'ticketing_bus_tickets' },
  { id: 'events', icon: Ticket, labelKey: 'ticketing_events' },
  { id: 'cinema', icon: Clapperboard, labelKey: 'ticketing_cinema' },
  { id: 'train', icon: TrainFront, labelKey: 'ticketing_train' },
];

const PRODUCT_LABELS: Record<TicketType, TranslationKey> = {
  flight: 'ticketing_flights',
  bus: 'ticketing_bus_tickets',
  train: 'ticketing_train',
  events: 'ticketing_events',
  cinema: 'ticketing_cinema',
};

type FieldOption = { value: string; label: string };

function placeOptions(language: 'mm' | 'en'): FieldOption[] {
  return TICKETING_PLACES.map((place) => ({
    value: place.id,
    label: `${place.name[language]}${place.code ? ` (${place.code})` : ''}`,
  }));
}

function eventPlaceOptions(language: 'mm' | 'en'): FieldOption[] {
  return TICKETING_PLACES
    .filter((place) => TICKETING_SERVICES.some((service) => service.type === 'events' && service.city === place.id))
    .map((place) => ({ value: place.id, label: place.name[language] }));
}

function venuePlaceOptions(language: 'mm' | 'en'): FieldOption[] {
  return TICKETING_PLACES
    .filter((place) => TICKETING_CINEMA_VENUES.some((venue) => venue.city === place.id))
    .map((place) => ({ value: place.id, label: place.name[language] }));
}

function getPlace(id: string): TicketPlace {
  return TICKETING_PLACES.find((place) => place.id === id) ?? TICKETING_PLACES[0];
}

function formatDate(value: string, language: 'mm' | 'en'): string {
  return new Intl.DateTimeFormat(language === 'mm' ? 'my-MM' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`));
}

export function TicketingPage() {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [type, setType] = useState<TicketType>('flight');
  const [fromCity, setFromCity] = useState('yangon');
  const [toCity, setToCity] = useState('bangkok');
  const [eventCity, setEventCity] = useState('yangon');
  const [venueCity, setVenueCity] = useState('yangon');
  const [venueId, setVenueId] = useState('j-yangon');
  const [date, setDate] = useState('2026-11-15');
  const [returnDate, setReturnDate] = useState('2026-11-18');
  const [passengers, setPassengers] = useState(1);
  const [customerType, setCustomerType] = useState<'citizen' | 'foreigner'>('citizen');
  const [searched, setSearched] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [boardingPoint, setBoardingPoint] = useState('MH Travel Yangon Branch');
  const [dropoffPoint, setDropoffPoint] = useState('Nyaung-U Bus Station');
  const [departureTime, setDepartureTime] = useState('20:00');
  const [ordered, setOrdered] = useState(false);
  const [movieId, setMovieId] = useState('movie-1');
  const [hall, setHall] = useState('hall-1');
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const candidates = useMemo(() => TICKETING_SERVICES.filter((service) => service.type === type), [type]);
  const shown = useMemo(() => {
    if (!searched) return candidates;
    const matches = candidates.filter((service) => {
      if (type === 'cinema') return service.venueId === venueId;
      if (type === 'events') return service.city === eventCity;
      return service.from === fromCity && service.to === toCity;
    });
    return matches;
  }, [candidates, searched, type, eventCity, venueId, fromCity, toCity]);

  const selectedService = TICKETING_SERVICES.find((service) => service.id === selectedServiceId);
  const venues = TICKETING_CINEMA_VENUES.filter((venue) => venue.city === venueCity);
  const venue = TICKETING_CINEMA_VENUES.find((item) => item.id === venueId) ?? venues[0];
  const movies = [
    { id: 'movie-1', name: language === 'mm' ? 'ရုပ်ရှင်ကား (၁) — နောက်ဆုံးခရီး' : 'Movie 1 — The Last Journey' },
    { id: 'movie-2', name: language === 'mm' ? 'ရုပ်ရှင်ကား (၂) — မြို့ရဲ့အလင်း' : 'Movie 2 — City Lights' },
  ];

  function changeType(nextType: TicketType) {
    setType(nextType);
    setSearched(false);
    setSelectedServiceId(null);
    setSelectedSeats([]);
    setOrdered(false);
    if (nextType === 'bus' || nextType === 'train') {
      setFromCity('yangon');
      setToCity(nextType === 'bus' ? 'bagan' : 'mandalay');
    } else if (nextType === 'flight') {
      setFromCity('yangon');
      setToCity('bangkok');
    } else if (nextType === 'events') {
      setEventCity('yangon');
    }
  }

  function changeVenueCity(value: string) {
    const nextVenue = TICKETING_CINEMA_VENUES.find((item) => item.city === value);
    setVenueCity(value);
    setVenueId(nextVenue?.id ?? '');
    setSearched(false);
    setSelectedServiceId(null);
  }

  function selectService(id: string) {
    const service = TICKETING_SERVICES.find((item) => item.id === id);
    setSelectedServiceId(id);
    setSelectedSeats([]);
    setDepartureTime(service?.depart ?? '20:00');
    setOrdered(false);
    if (service?.type === 'bus') {
      const from = getPlace(service.from ?? 'yangon');
      const to = getPlace(service.to ?? 'bagan');
      setBoardingPoint(`${from.name.en} MH Travel Branch`);
      setDropoffPoint(`${to.name.en} Bus Station`);
    }
  }

  function chooseSeat(seat: number) {
    setSelectedSeats((current) => current.includes(seat)
      ? current.filter((item) => item !== seat)
      : current.length < passengers ? [...current, seat] : current);
  }

  function choosePopularRoute(route: PopularRoute) {
    setType('flight');
    setFromCity(route.from);
    setToCity(route.to);
    setSearched(true);
    setSelectedServiceId(null);
    setSelectedSeats([]);
    document.getElementById('ticket-deals')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const canOrder = Boolean(selectedService)
    && (!selectedService || (selectedService.type !== 'bus' && selectedService.type !== 'cinema') || selectedSeats.length === passengers);
  const orderQuantity = passengers;
  const orderQuantityLabel = String(passengers);

  if (ordered && selectedService) {
    const orderNumber = `MH-${selectedService.id.toUpperCase()}-${date.replace(/-/g, '')}`;
    return (
      <div className="mx-auto max-w-2xl pb-10 pt-5">
        <section className="rounded-2xl border border-status-success/30 bg-bg-card p-5 text-center sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-status-success/15 text-status-success"><CheckCircle2 size={30} /></div>
          <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-status-success">{t('ticketing_confirmation_status')}</p>
          <h1 className="mt-2 text-2xl font-semibold text-text-primary">{t('ticketing_confirmation_title')}</h1>
          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-text-muted">{t('ticketing_confirmation_intro')}</p>
          <div className="mt-5 rounded-xl bg-bg-cardAlt px-3 py-2 text-left"><p className="text-[9px] text-text-faint">{t('ticketing_order_number')}</p><p className="mt-1 font-mono text-sm text-brand-blue">{orderNumber}</p></div>
          <div className="mt-4 grid gap-2 text-left sm:grid-cols-2">
            <ConfirmationItem label={t('ticketing_product')} value={t(PRODUCT_LABELS[selectedService.type])} />
            <ConfirmationItem label={t('ticketing_provider')} value={selectedService.operator[language]} />
            <ConfirmationItem label={t('ticketing_trip')} value={selectedService.route[language]} />
            <ConfirmationItem label={t('ticketing_date')} value={type === 'flight' ? `${formatDate(date, language)} – ${formatDate(returnDate, language)}` : `${formatDate(date, language)} · ${departureTime}`} />
            <ConfirmationItem label={t(selectedService.type === 'events' || selectedService.type === 'cinema' ? 'ticketing_ticket_quantity' : 'ticketing_passengers')} value={orderQuantityLabel} />
            {(selectedService.type === 'bus' || selectedService.type === 'cinema') && <ConfirmationItem label={t('ticketing_selected_seats')} value={selectedSeats.join(', ')} />}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-left"><span className="text-xs text-text-muted">{t('ticketing_total_estimate')}</span><strong className="text-lg text-brand-red">{formatPrice(selectedService.price * orderQuantity)}</strong></div>
          <p className="mt-4 rounded-xl border border-brand-blue/20 bg-brand-blue/10 p-3 text-[10px] leading-4 text-text-secondary">{t('ticketing_confirmation_contact')}</p>
          <button type="button" onClick={() => { setOrdered(false); setSelectedServiceId(null); setSelectedSeats([]); }} className="mt-5 rounded-lg bg-brand-blue px-4 py-2.5 text-xs font-semibold text-white">{t('ticketing_back_to_search')}</button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 pb-10 pt-2 sm:space-y-5 sm:pt-5">
      <section className="relative isolate min-h-[176px] overflow-hidden rounded-2xl bg-slate-950 sm:min-h-[214px] md:min-h-[242px]">
        <img src="/images/blog/shwedagon-evening.webp" alt="Shwedagon Pagoda at dusk" className="absolute inset-0 h-full w-full object-cover object-[68%_67%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#06162c]/95 via-[#071a31]/75 to-[#071a31]/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06162c]/45 via-transparent to-[#06162c]/10" />
        <Plane className="absolute right-[24%] top-8 hidden -rotate-6 text-white/85 drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)] md:block" size={76} strokeWidth={1.5} />
        <Plane className="absolute right-5 top-5 rotate-[-10deg] text-white/75 drop-shadow-lg md:hidden" size={34} strokeWidth={1.5} />
        <div className="relative z-10 flex min-h-[176px] items-center px-4 py-5 sm:min-h-[214px] sm:px-7 md:min-h-[242px] md:px-10">
          <div className="max-w-xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-200/25 bg-slate-950/45 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-cyan-100 backdrop-blur sm:text-[10px]">
              <Ticket size={12} /> {t('ticketing_eyebrow')}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl md:text-[40px]">{t('ticketing_page_heading')}</h1>
            <p className="mt-1.5 text-xs font-semibold text-white sm:text-sm md:text-base">{t('ticketing_title')}</p>
            <p className="mt-1 text-[10px] text-slate-200 sm:text-xs">{t('ticketing_intro')}</p>
            <a href="#ticket-search" className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-3.5 py-2 text-[10px] font-bold text-slate-950 shadow-lg shadow-cyan-950/35 transition hover:-translate-y-0.5 hover:bg-cyan-300 sm:mt-4 sm:px-4 sm:py-2.5 sm:text-xs">
              <Search size={13} /> {t(type === 'flight' ? 'ticketing_search_flights' : 'ticketing_search')}
              <ArrowRight size={13} />
            </a>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-bg-card shadow-sm">
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border px-2 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-3">
          {PRIMARY_PRODUCTS.map((product) => {
            const Icon = product.icon;
            const active = type === product.id;
            return (
              <button type="button" key={product.id} role="tab" aria-selected={active} onClick={() => changeType(product.id)} className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[10px] font-semibold transition sm:px-4 sm:text-xs ${active ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-text-muted hover:text-text-primary'}`}>
                <Icon size={14} /> {t(product.labelKey)}
              </button>
            );
          })}
        </div>

        <div id="ticket-search" className="p-3 sm:p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-400">{t('ticketing_search_label')}</p><h2 className="mt-0.5 text-sm font-bold text-text-primary sm:text-base">{t(PRODUCT_LABELS[type])} · {t('ticketing_search')}</h2></div>
            <span className="hidden items-center gap-1 rounded-full bg-status-success/10 px-2 py-1 text-[9px] font-semibold text-status-success sm:inline-flex"><CheckCircle2 size={12} />{t('ticketing_live_availability')}</span>
          </div>
          {type === 'flight' || type === 'bus' || type === 'train' ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
              <SelectField label={t('ticketing_from_city')} value={fromCity} onChange={(value) => { setFromCity(value); setSearched(false); setSelectedServiceId(null); }} options={placeOptions(language)} icon={<Plane size={13} />} />
              <SelectField label={t('ticketing_to_city')} value={toCity} onChange={(value) => { setToCity(value); setSearched(false); setSelectedServiceId(null); }} options={placeOptions(language)} icon={<MapPin size={13} />} />
              <DateField date={date} setDate={(value) => { setDate(value); setSearched(false); }} label={t('ticketing_date')} />
              {type === 'flight' && <DateField date={returnDate} setDate={(value) => { setReturnDate(value); setSearched(false); }} label={t('ticketing_return_date')} />}
              <NumberField label={t('ticketing_passengers')} value={passengers} onChange={(value) => { setPassengers(value); setSelectedSeats([]); }} max={9} />
              <SearchButton onClick={() => { setSearched(true); setSelectedServiceId(null); }} label={t(type === 'flight' ? 'ticketing_search_flights' : type === 'bus' ? 'ticketing_search_bus' : 'ticketing_search_train')} />
            </div>
          ) : type === 'events' ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
              <SelectField label={t('ticketing_city')} value={eventCity} onChange={(value) => { setEventCity(value); setSearched(false); setSelectedServiceId(null); }} options={eventPlaceOptions(language)} icon={<MapPin size={13} />} />
              <DateField date={date} setDate={(value) => { setDate(value); setSearched(false); }} label={t('ticketing_date')} />
              <NumberField label={t('ticketing_ticket_quantity')} value={passengers} onChange={setPassengers} max={9} />
              <SearchButton onClick={() => { setSearched(true); setSelectedServiceId(null); }} label={t('ticketing_search_event')} />
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[1fr_1.2fr_1fr_auto]">
              <SelectField label={t('ticketing_city')} value={venueCity} onChange={changeVenueCity} options={venuePlaceOptions(language)} icon={<MapPin size={13} />} />
              <SelectField label={t('ticketing_cinema_name')} value={venue?.id ?? ''} onChange={(value) => { setVenueId(value); setSearched(false); setSelectedServiceId(null); }} options={venues.map((item) => ({ value: item.id, label: item.name[language] }))} />
              <DateField date={date} setDate={(value) => { setDate(value); setSearched(false); }} label={t('ticketing_date')} />
              <SearchButton onClick={() => { setSearched(true); setSelectedServiceId(null); }} label={t('ticketing_search_cinema')} />
            </div>
          )}
          {searched && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-400/25 bg-cyan-400/5 px-3 py-2 text-[9px] text-text-secondary sm:text-[10px]">
            <span>{type === 'flight' || type === 'bus' || type === 'train' ? `${getPlace(fromCity).name[language]}${getPlace(fromCity).code ? ` (${getPlace(fromCity).code})` : ''} → ${getPlace(toCity).name[language]}${getPlace(toCity).code ? ` (${getPlace(toCity).code})` : ''} · ${formatDate(date, language)}` : type === 'events' ? `${getPlace(eventCity).name[language]} · ${formatDate(date, language)} · ${passengers} ${t('ticketing_ticket_quantity')}` : `${venue?.name[language]} · ${formatDate(date, language)}`}</span>
            <button type="button" onClick={() => setSearched(false)} className="font-semibold text-cyan-400 hover:text-cyan-200">{t('ticketing_edit')}</button>
          </div>}
        </div>
      </section>

      {type === 'flight' && <section>
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-400">{t('ticketing_discover')}</p><h2 className="mt-0.5 text-sm font-bold text-text-primary sm:text-base">{t('ticketing_popular_routes')}</h2></div>
          <span className="hidden text-[9px] text-text-faint sm:inline">{t('ticketing_click_route')}</span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3 lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
          {POPULAR_FLIGHT_ROUTES.map((route) => <PopularRouteCard key={route.id} route={route} language={language} formatPrice={formatPrice} onClick={() => choosePopularRoute(route)} />)}
        </div>
      </section>}

      <section id="ticket-deals" className="scroll-mt-24">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-400">{t('ticketing_curated')}</p><h2 className="mt-0.5 text-sm font-bold text-text-primary sm:text-base">{t('ticketing_best_deals')}</h2><p className="mt-1 text-[9px] text-text-faint">{shown.length} {t('ticketing_options')}</p></div>
          <span className="inline-flex items-center gap-1 rounded-full bg-status-success/10 px-2 py-1 text-[9px] font-semibold text-status-success"><CheckCircle2 size={11} />{t('ticketing_live_availability')}</span>
        </div>
        <div className={selectedService ? 'grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_300px]' : ''}>
          <div className="space-y-2">
            {shown.length > 0 ? shown.map((service) => <DealRow key={service.id} service={service} language={language} formatPrice={formatPrice} label={t(PRODUCT_LABELS[service.type])} remainingLabel={t(service.type === 'events' ? 'ticketing_spots_left' : 'ticketing_seats_left')} selected={selectedServiceId === service.id} onSelect={() => selectService(service.id)} />) : (
              <div className="rounded-2xl border border-dashed border-border bg-bg-card px-4 py-9 text-center"><Plane className="mx-auto text-text-muted" size={24} /><p className="mt-2 text-xs font-semibold text-text-primary">{t('ticketing_no_deals')}</p><p className="mt-1 text-[10px] text-text-muted">{t('ticketing_no_deals_detail')}</p></div>
            )}
          </div>
          {selectedService && (
            <aside className="h-fit rounded-2xl border border-cyan-400/20 bg-bg-card p-3.5 shadow-sm sm:p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-400">{t('ticketing_booking_title')}</p><h3 className="mt-1 text-sm font-bold text-text-primary">{selectedService.operator[language]}</h3><p className="mt-1 text-[10px] text-text-muted">{selectedService.route[language]}</p></div><button type="button" onClick={() => { setSelectedServiceId(null); setSelectedSeats([]); }} aria-label={t('ticketing_close_booking')} className="rounded-full bg-bg-cardAlt p-1.5 text-text-muted hover:text-text-primary"><ChevronRight size={14} /></button></div>
              <div className="mt-3 flex items-center justify-between border-y border-border py-2 text-[10px]"><span className="text-text-muted">{t('ticketing_price')}</span><strong className="text-sm text-brand-red">{formatPrice(selectedService.price)}{t('ticketing_per_ticket')}</strong></div>
              {selectedService.type === 'bus' && <>
                <div className="mt-3 grid grid-cols-2 gap-2"><NumberField label={t('ticketing_passengers')} value={passengers} onChange={(value) => { setPassengers(value); setSelectedSeats([]); }} max={8} /><SelectField label={t('ticketing_nationality')} value={customerType} onChange={(value) => setCustomerType(value as 'citizen' | 'foreigner')} options={[{ value: 'citizen', label: t('ticketing_citizen') }, { value: 'foreigner', label: t('ticketing_foreigner') }]} /></div>
                <SelectField label={t('ticketing_departure_time')} value={departureTime} onChange={setDepartureTime} options={['06:00', '09:00', '12:00', '18:30', '20:00'].map((time) => ({ value: time, label: time }))} />
                <SelectField label={t('ticketing_boarding_point')} value={boardingPoint} onChange={setBoardingPoint} options={[`${getPlace(fromCity).name.en} MH Travel Branch`, `${getPlace(fromCity).name.en} Central Bus Terminal`, 'Downtown Pickup Stop'].map((point) => ({ value: point, label: point }))} />
                <SelectField label={t('ticketing_dropoff_point')} value={dropoffPoint} onChange={setDropoffPoint} options={[`${getPlace(toCity).name.en} Bus Station`, `${getPlace(toCity).name.en} Downtown Stop`, `${getPlace(toCity).name.en} Airport Stop`].map((point) => ({ value: point, label: point }))} />
                <SeatPicker selectedSeats={selectedSeats} passengers={passengers} onSeat={chooseSeat} label={t('ticketing_select_seats')} />
              </>}
              {selectedService.type === 'cinema' && <>
                <SelectField label={t('ticketing_movie')} value={movieId} onChange={setMovieId} options={movies.map((movie) => ({ value: movie.id, label: movie.name }))} />
                <SelectField label={t('ticketing_hall')} value={hall} onChange={setHall} options={[{ value: 'hall-1', label: t('ticketing_hall_one') }, { value: 'hall-2', label: t('ticketing_hall_two') }]} />
                <NumberField label={t('ticketing_ticket_quantity')} value={passengers} onChange={(value) => { setPassengers(value); setSelectedSeats([]); }} max={9} />
                <SeatPicker selectedSeats={selectedSeats} passengers={passengers} onSeat={chooseSeat} label={t('ticketing_select_seats')} />
              </>}
              {selectedService.type === 'events' && <NumberField label={t('ticketing_ticket_quantity')} value={passengers} onChange={setPassengers} max={9} />}
              {selectedService.type !== 'bus' && selectedService.type !== 'cinema' && selectedService.type !== 'events' && <NumberField label={t('ticketing_passengers')} value={passengers} onChange={setPassengers} max={9} />}
              <button type="button" disabled={!canOrder} onClick={() => setOrdered(true)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-3 py-2.5 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{t('ticketing_book_now')}<ArrowRight size={13} /></button>
              <p className="mt-2 text-center text-[9px] leading-4 text-text-faint">{selectedService.type === 'bus' || selectedService.type === 'cinema' ? `${selectedSeats.length}/${passengers} · ${t('ticketing_select_seats')}` : t('ticketing_confirmation_contact')}</p>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}

function PopularRouteCard({ route, language, formatPrice, onClick }: { route: PopularRoute; language: 'mm' | 'en'; formatPrice: (amount: number) => string; onClick: () => void }) {
  const from = getPlace(route.from);
  const to = getPlace(route.to);
  return (
    <button type="button" onClick={onClick} className="group w-[68%] min-w-[160px] max-w-[225px] shrink-0 overflow-hidden rounded-xl border border-border bg-bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:shadow-lg lg:w-auto lg:min-w-0 lg:max-w-none">
      <div className={`relative flex h-[74px] items-end justify-between overflow-hidden bg-gradient-to-br ${route.tone} px-3 pb-2.5 pt-2`}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 25%, white 0 1px, transparent 1.5px), radial-gradient(circle at 78% 45%, white 0 1px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
        <span className="relative z-10 text-sm font-extrabold tracking-wide text-white">{from.code}</span>
        <span className="relative z-10 flex items-center gap-1 text-white/90"><span className="h-px w-5 bg-white/50" /><Plane size={17} className="-rotate-6" /><span className="h-px w-5 bg-white/50" /></span>
        <span className="relative z-10 text-sm font-extrabold tracking-wide text-white">{to.code}</span>
      </div>
      <div className="p-2.5">
        <p className="truncate text-[10px] font-bold text-text-primary">{from.name[language]} <span className="text-cyan-400">→</span> {to.name[language]}</p>
        <div className="mt-1.5 flex items-center justify-between gap-1"><span className="text-[8px] uppercase tracking-wide text-text-faint">{language === 'mm' ? 'စတင်ဈေး' : 'From'}</span><strong className="text-[10px] text-brand-red">{formatPrice(route.price)}</strong><ArrowRight size={12} className="text-cyan-400 transition group-hover:translate-x-0.5" /></div>
      </div>
    </button>
  );
}

function DealRow({ service, language, formatPrice, label, remainingLabel, selected, onSelect }: { service: TicketService; language: 'mm' | 'en'; formatPrice: (amount: number) => string; label: string; remainingLabel: string; selected: boolean; onSelect: () => void }) {
  return (
    <article className={`grid grid-cols-[38px_minmax(0,1fr)] items-center gap-2.5 rounded-xl border bg-bg-card p-2.5 transition sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:gap-3 ${selected ? 'border-cyan-400/60 ring-1 ring-cyan-400/20' : 'border-border hover:border-cyan-400/25'}`}>
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-[9px] font-extrabold tracking-tight sm:h-10 sm:w-10 ${service.brandClass}`}>{service.mark}</div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><h3 className="truncate text-[10px] font-bold text-text-primary sm:text-xs">{service.operator[language]}</h3><span className="rounded-full bg-bg-cardAlt px-1.5 py-0.5 text-[8px] text-text-muted">{label}</span><span className="inline-flex items-center gap-1 text-[8px] text-status-success"><CheckCircle2 size={9} />{service.badge[language]}</span></div>
        <p className="mt-1 truncate text-[9px] text-text-secondary sm:text-[10px]">{service.route[language]}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[8px] text-text-faint sm:text-[9px]">
          <span className="inline-flex items-center gap-1 font-semibold text-text-primary"><Clock3 size={9} />{service.depart}</span><ArrowRight size={9} /><span>{service.arrive}</span><span className="hidden text-border sm:inline">·</span><span>{service.duration}</span><span className="hidden text-border sm:inline">·</span><span>{service.seats} {remainingLabel}</span>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-between gap-3 border-t border-border pt-2 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:text-right">
        <strong className="text-sm text-brand-red sm:text-base">{formatPrice(service.price)}<small className="ml-1 text-[8px] font-normal text-text-faint">{language === 'mm' ? '/ လက်မှတ်' : '/ ticket'}</small></strong>
        <button type="button" onClick={onSelect} className={`inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-[9px] font-bold text-white transition hover:brightness-110 sm:mt-1 sm:w-full ${selected ? 'bg-cyan-600' : 'bg-brand-blue'}`}>{selected ? (language === 'mm' ? 'ရွေးပြီး' : 'Selected') : (language === 'mm' ? 'ယခုမှာယူရန်' : 'Book Now')}<ArrowRight size={10} /></button>
      </div>
    </article>
  );
}

function SelectField({ label, value, onChange, options, icon }: { label: string; value: string; onChange: (value: string) => void; options: FieldOption[]; icon?: React.ReactNode }) {
  return <label className="block min-w-0"><span className="mb-1 block text-[8px] font-semibold text-text-faint sm:text-[9px]">{label}</span><span className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-bg px-2.5 py-2.5 text-cyan-400 focus-within:border-cyan-400/60"><span className="shrink-0">{icon}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 w-full appearance-none bg-transparent text-[10px] text-text-primary outline-none sm:text-xs">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><ChevronDown size={12} className="shrink-0 text-text-faint" /></span></label>;
}

function DateField({ label, date, setDate }: { label: string; date: string; setDate: (value: string) => void }) {
  return <label className="block min-w-0"><span className="mb-1 block text-[8px] font-semibold text-text-faint sm:text-[9px]">{label}</span><span className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-bg px-2.5 py-2 text-text-secondary focus-within:border-cyan-400/60"><CalendarDays size={13} className="shrink-0 text-cyan-400" /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-w-0 w-full bg-transparent text-[10px] text-text-primary outline-none sm:text-xs" /></span></label>;
}

function NumberField({ label, value, onChange, max = 45 }: { label: string; value: number; onChange: (value: number) => void; max?: number }) {
  return <label className="block min-w-0"><span className="mb-1 block text-[8px] font-semibold text-text-faint sm:text-[9px]">{label}</span><span className="flex items-center gap-2 rounded-lg border border-border bg-bg px-2.5 py-2.5 text-cyan-400 focus-within:border-cyan-400/60"><Users size={13} className="shrink-0" /><input type="number" min={1} max={max} value={value} onChange={(event) => onChange(Math.max(1, Math.min(max, Number(event.target.value))))} className="w-full min-w-0 bg-transparent text-[10px] text-text-primary outline-none sm:text-xs" /></span></label>;
}

function SearchButton({ onClick, label }: { onClick: () => void; label: string }) {
  return <button type="button" onClick={onClick} className="mt-auto inline-flex min-h-[39px] items-center justify-center gap-2 rounded-lg bg-cyan-500 px-3 py-2.5 text-[10px] font-extrabold text-slate-950 transition hover:bg-cyan-300 sm:col-span-2 sm:text-xs xl:col-span-1"><Search size={14} />{label}<ArrowRight size={13} /></button>;
}

function SeatPicker({ selectedSeats, passengers, onSeat, label }: { selectedSeats: number[]; passengers: number; onSeat: (seat: number) => void; label: string }) {
  return <div className="mt-3"><div className="mb-1.5 flex items-center justify-between"><span className="text-[9px] text-text-faint">{label}</span><span className="text-[9px] text-text-muted">{selectedSeats.length}/{passengers}</span></div><div className="grid grid-cols-5 gap-1">{Array.from({ length: 20 }, (_, index) => index + 1).map((seat) => <button type="button" key={seat} onClick={() => onSeat(seat)} className={`rounded-md px-1 py-1.5 text-[8px] font-semibold transition ${selectedSeats.includes(seat) ? 'bg-brand-red text-white' : 'bg-bg-cardAlt text-text-muted hover:bg-cyan-400/15 hover:text-cyan-300'}`}>{seat}</button>)}</div></div>;
}

function ConfirmationItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border bg-bg-cardAlt p-2.5"><p className="text-[9px] text-text-faint">{label}</p><p className="mt-1 text-[11px] text-text-primary">{value}</p></div>;
}
