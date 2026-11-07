import { useMemo, useState } from 'react';
import { ArrowRight, BusFront, CalendarDays, CheckCircle2, Clapperboard, MapPin, Search, Ticket, TrainFront, Users } from 'lucide-react';
import { useCurrency } from '../../lib/currency';
import { useLanguage } from '../../lib/i18n';

type TicketType = 'bus' | 'train' | 'events' | 'cinema';
type Place = { id: string; name: { mm: string; en: string }; townships: { id: string; name: { mm: string; en: string } }[] };

type Service = {
  id: string;
  type: TicketType;
  operator: { mm: string; en: string };
  route: { mm: string; en: string };
  depart: string;
  arrive: string;
  duration: string;
  price: number;
  seats: number;
  image: string;
  badge: { mm: string; en: string };
};

const places: Place[] = [
  { id: 'yangon', name: { mm: 'ရန်ကုန်', en: 'Yangon' }, townships: [{ id: 'downtown', name: { mm: 'မြို့လယ်', en: 'Downtown' } }, { id: 'hlaing', name: { mm: 'လှိုင်', en: 'Hlaing' } }, { id: 'ahlone', name: { mm: 'အလုံ', en: 'Ahlone' } }] },
  { id: 'bagan', name: { mm: 'ပုဂံ', en: 'Bagan' }, townships: [{ id: 'nyaung-u', name: { mm: 'ညောင်ဦး', en: 'Nyaung-U' } }, { id: 'old-bagan', name: { mm: 'ပုဂံဟောင်း', en: 'Old Bagan' } }] },
  { id: 'mandalay', name: { mm: 'မန္တလေး', en: 'Mandalay' }, townships: [{ id: 'chanayethazan', name: { mm: 'ချမ်းအေးသာဇံ', en: 'Chanayethazan' } }, { id: 'amarapura', name: { mm: 'အမရပူရ', en: 'Amarapura' } }] },
  { id: 'inle', name: { mm: 'အင်းလေး', en: 'Inle Lake' }, townships: [{ id: 'nyaung-shwe', name: { mm: 'ညောင်ရွှေ', en: 'Nyaung Shwe' } }] },
  { id: 'naypyidaw', name: { mm: 'နေပြည်တော်', en: 'Naypyidaw' }, townships: [{ id: 'zabuthiri', name: { mm: 'ဇမ္ဗူသီရိ', en: 'Zabuthiri' } }, { id: 'dekhinathiri', name: { mm: 'ဒက္ခိဏသီရိ', en: 'Dekkhinathiri' } }] },
];

const cinemaVenues = [
  { id: 'j-yangon', city: 'yangon', township: 'downtown', name: { mm: 'J Cineplex — မြို့လယ်', en: 'J Cineplex — Downtown' } },
  { id: 'mingalar-yangon', city: 'yangon', township: 'hlaing', name: { mm: 'Mingalar Cinema — လှိုင်', en: 'Mingalar Cinema — Hlaing' } },
  { id: 'mingalar-mandalay', city: 'mandalay', township: 'chanayethazan', name: { mm: 'Mingalar Mandalay', en: 'Mingalar Mandalay' } },
];

const eventVenues = [
  { id: 'city-night', city: 'yangon', township: 'downtown', name: { mm: 'မြို့ပြညပွဲ — မြို့လယ်', en: 'City Night Live — Downtown' } },
  { id: 'bagan-festival', city: 'bagan', township: 'old-bagan', name: { mm: 'ပုဂံယဉ်ကျေးမှုပွဲ', en: 'Bagan Culture Festival' } },
];

const services: Service[] = [
  { id: 'bus-jj', type: 'bus', operator: { mm: 'JJ Express', en: 'JJ Express' }, route: { mm: 'ရန်ကုန် → ပုဂံ', en: 'Yangon → Bagan' }, depart: '20:00', arrive: '05:30', duration: '9h 30m', price: 28, seats: 12, image: '/images/blog/bagan-sunrise.webp', badge: { mm: 'လူကြိုက်များ', en: 'Popular' } },
  { id: 'bus-elite', type: 'bus', operator: { mm: 'Elite Express', en: 'Elite Express' }, route: { mm: 'ရန်ကုန် → မန္တလေး', en: 'Yangon → Mandalay' }, depart: '18:30', arrive: '06:30', duration: '12h', price: 31, seats: 8, image: '/images/blog/shwedagon-evening.webp', badge: { mm: 'သက်သာသော', en: 'Best value' } },
  { id: 'train-1', type: 'train', operator: { mm: 'Myanmar Railways', en: 'Myanmar Railways' }, route: { mm: 'ရန်ကုန် → မန္တလေး', en: 'Yangon → Mandalay' }, depart: '06:00', arrive: '20:30', duration: '14h 30m', price: 18, seats: 24, image: '/images/blog/ubein-evening.webp', badge: { mm: 'ရထားခရီး', en: 'Rail journey' } },
  { id: 'cinema-1', type: 'cinema', operator: { mm: 'J Cineplex', en: 'J Cineplex' }, route: { mm: 'ယနေ့ပြသမှု', en: 'Showing today' }, depart: '19:00', arrive: '21:10', duration: '2h 10m', price: 6, seats: 34, image: '/images/blog/shwedagon-evening.webp', badge: { mm: 'အသစ်ထွက်', en: 'New release' } },
  { id: 'event-1', type: 'events', operator: { mm: 'MH Travel Events', en: 'MH Travel Events' }, route: { mm: 'မြို့ပြညပွဲ', en: 'City Night Live' }, depart: '18:00', arrive: '22:00', duration: '4h', price: 12, seats: 80, image: '/images/blog/bagan-sunrise.webp', badge: { mm: 'ယခုလ', en: 'This month' } },
];

const products = [
  { id: 'bus' as const, icon: BusFront, label: { mm: 'ကားလက်မှတ်', en: 'Bus' } },
  { id: 'train' as const, icon: TrainFront, label: { mm: 'ရထားလက်မှတ်', en: 'Train' } },
  { id: 'events' as const, icon: Ticket, label: { mm: 'Event လက်မှတ်', en: 'Events' } },
  { id: 'cinema' as const, icon: Clapperboard, label: { mm: 'ရုပ်ရှင်ရုံလက်မှတ်', en: 'Cinema' } },
];

function townshipsFor(cityId: string) { return places.find((place) => place.id === cityId)?.townships ?? []; }
function placeName(cityId: string, townshipId: string, language: 'mm' | 'en') { const city = places.find((place) => place.id === cityId); const township = city?.townships.find((item) => item.id === townshipId); return township ? `${city?.name[language]} — ${township.name[language]}` : city?.name[language] ?? ''; }

export function TicketingPage() {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [type, setType] = useState<TicketType>('bus');
  const [fromCity, setFromCity] = useState('yangon');
  const [fromTownship, setFromTownship] = useState('downtown');
  const [toCity, setToCity] = useState('bagan');
  const [toTownship, setToTownship] = useState('nyaung-u');
  const [venueCity, setVenueCity] = useState('yangon');
  const [venueTownship, setVenueTownship] = useState('downtown');
  const [venueId, setVenueId] = useState('j-yangon');
  const [date, setDate] = useState('2026-11-15');
  const [passengers, setPassengers] = useState(1);
  const [boardingPoint, setBoardingPoint] = useState('MH Travel Yangon Branch');
  const [dropoffPoint, setDropoffPoint] = useState('Nyaung-U Bus Station');
  const [busLine, setBusLine] = useState('JJ Express');
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [searched, setSearched] = useState(false);

  const shown = useMemo(() => services.filter((item) => item.type === type), [type]);
  const venues = type === 'cinema' ? cinemaVenues : eventVenues;
  const currentVenue = venues.find((venue) => venue.id === venueId) ?? venues[0];
  const fromTownships = townshipsFor(fromCity);
  const toTownships = townshipsFor(toCity);
  const venueTownships = townshipsFor(venueCity);

  function changeType(nextType: TicketType) {
    setType(nextType);
    setSearched(false);
    setSelectedSeats([]);
    const nextVenues = nextType === 'cinema' ? cinemaVenues : eventVenues;
    setVenueId(nextVenues[0].id);
    setVenueCity(nextVenues[0].city);
    setVenueTownship(nextVenues[0].township);
  }

  function changeFromCity(value: string) { setFromCity(value); setFromTownship(townshipsFor(value)[0]?.id ?? ''); }
  function changeToCity(value: string) { setToCity(value); setToTownship(townshipsFor(value)[0]?.id ?? ''); }
  function changeVenueCity(value: string) { const next = venues.filter((venue) => venue.city === value); setVenueCity(value); setVenueTownship(townshipsFor(value)[0]?.id ?? ''); setVenueId(next[0]?.id ?? ''); }
  function chooseSeat(seat: number) { setSelectedSeats((current) => current.includes(seat) ? current.filter((item) => item !== seat) : current.length < passengers ? [...current, seat] : current); }

  return <div className="mx-auto max-w-7xl pb-10 pt-2 sm:pt-5">
    <section className="mb-5"><p className="text-[10px] uppercase tracking-[0.2em] text-brand-blue">{t('ticketing_eyebrow')}</p><h1 className="mt-2 text-2xl font-medium text-text-primary">{t('ticketing_title')}</h1><p className="mt-1 max-w-2xl text-xs text-text-muted">{t('ticketing_intro')}</p></section>
    <section className="rounded-card border border-border bg-bg-card p-3 sm:p-4"><div className="mb-4 flex gap-1 overflow-x-auto pb-1 scrollbar-hide">{products.map((product) => { const Icon = product.icon; return <button type="button" key={product.id} onClick={() => changeType(product.id)} className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-[10px] ${type === product.id ? 'bg-brand-blue text-white' : 'bg-bg-cardAlt text-text-muted'}`}><Icon size={13} />{product.label[language]}</button>; })}</div>{type === 'cinema' || type === 'events' ? <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_170px_auto] md:items-end"><SelectField label={t('ticketing_city')} value={venueCity} onChange={changeVenueCity} options={places.map((place) => ({ value: place.id, label: place.name[language] }))} /><SelectField label={t('ticketing_township')} value={venueTownship} onChange={(value) => { setVenueTownship(value); setVenueId(venues.find((venue) => venue.city === venueCity && venue.township === value)?.id ?? ''); }} options={venueTownships.map((township) => ({ value: township.id, label: township.name[language] }))} /><SelectField label={type === 'cinema' ? t('ticketing_cinema_name') : t('ticketing_event_name')} value={currentVenue?.id ?? ''} onChange={setVenueId} options={venues.filter((venue) => venue.city === venueCity && venue.township === venueTownship).map((venue) => ({ value: venue.id, label: venue.name[language] }))} /><DateField date={date} setDate={setDate} label={t('ticketing_date')} /><SearchButton onClick={() => setSearched(true)} label={t('ticketing_search')} /></div> : <><div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_1fr]"><SelectField label={t('ticketing_from_city')} value={fromCity} onChange={changeFromCity} options={places.map((place) => ({ value: place.id, label: place.name[language] }))} /><SelectField label={t('ticketing_from_township')} value={fromTownship} onChange={setFromTownship} options={fromTownships.map((township) => ({ value: township.id, label: township.name[language] }))} /><SelectField label={t('ticketing_to_city')} value={toCity} onChange={changeToCity} options={places.map((place) => ({ value: place.id, label: place.name[language] }))} /><SelectField label={t('ticketing_to_township')} value={toTownship} onChange={setToTownship} options={toTownships.map((township) => ({ value: township.id, label: township.name[language] }))} /></div><div className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_170px_100px_auto] md:items-end"><SelectField label={type === 'bus' ? t('ticketing_bus_line') : t('ticketing_train_line')} value={busLine} onChange={setBusLine} options={(type === 'bus' ? ['JJ Express', 'Elite Express', 'Mandalar Minn', 'Shwe Mandalar'] : ['Myanmar Railways', 'Upper Myanmar Express']).map((item) => ({ value: item, label: item }))} /><Field label={t('ticketing_boarding_point')} value={boardingPoint} onChange={setBoardingPoint} placeholder={t('ticketing_boarding_placeholder')} /><DateField date={date} setDate={setDate} label={t('ticketing_date')} /><NumberField label={t('ticketing_passengers')} value={passengers} onChange={setPassengers} /><SearchButton onClick={() => setSearched(true)} label={t('ticketing_search')} /></div><div className="mt-2 grid gap-2 md:grid-cols-[1fr_170px]"><Field label={t('ticketing_dropoff_point')} value={dropoffPoint} onChange={setDropoffPoint} placeholder={t('ticketing_dropoff_placeholder')} /><div className="flex items-end text-[10px] text-text-faint">{t('ticketing_board_drop_note')}</div></div></>}</section>
    {searched && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-brand-blue/30 bg-brand-blue/10 px-3 py-2 text-[10px] text-text-secondary"><span>{type === 'cinema' || type === 'events' ? `${placeName(venueCity, venueTownship, language)} · ${currentVenue?.name[language]}` : `${placeName(fromCity, fromTownship, language)} → ${placeName(toCity, toTownship, language)} · ${busLine}`} · {date} · {passengers} {t('ticketing_passenger_unit')}</span><button type="button" onClick={() => setSearched(false)} className="text-brand-blue">{t('ticketing_edit')}</button></div>}
    <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]"><section><div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-medium text-text-primary">{t('ticketing_results')}</h2><p className="mt-1 text-[10px] text-text-faint">{shown.length} {t('ticketing_options')}</p></div><span className="flex items-center gap-1 text-[10px] text-status-success"><CheckCircle2 size={13} />{t('ticketing_live_availability')}</span></div><div className="space-y-2.5">{shown.map((item) => <article key={item.id} className="grid gap-3 rounded-card border border-border bg-bg-card p-3 sm:grid-cols-[82px_1fr_auto] sm:items-center"><div className="relative h-20 overflow-hidden rounded-md bg-bg-cardAlt"><img src={item.image} alt={item.operator[language]} className="h-full w-full object-cover" /><span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[8px] text-white">{item.badge[language]}</span></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium text-text-primary">{item.operator[language]}</h3><span className="text-[9px] text-text-faint">{products.find((product) => product.id === item.type)?.label[language]}</span></div><p className="mt-1 text-xs text-text-secondary">{type === 'cinema' || type === 'events' ? currentVenue?.name[language] : `${placeName(fromCity, fromTownship, language)} → ${placeName(toCity, toTownship, language)}`}</p><div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-text-faint"><span className="font-medium text-text-primary">{item.depart}</span><ArrowRight size={11} /><span>{item.arrive}</span><span>· {item.duration}</span><span>· {item.seats} {t('ticketing_seats_left')}</span></div></div><div className="flex items-center justify-between gap-3 border-t border-border pt-2 sm:block sm:border-t-0 sm:pt-0 sm:text-right"><div><strong className="text-base text-brand-red">{formatPrice(item.price)}</strong><span className="ml-1 text-[9px] text-text-faint">/ {t('ticketing_person')}</span></div>{type === 'bus' ? <div className="mt-2 grid grid-cols-5 gap-1 sm:w-28">{Array.from({ length: 10 }, (_, index) => index + 1).map((seat) => <button type="button" key={seat} onClick={() => chooseSeat(seat)} className={`rounded px-1 py-1 text-[8px] ${selectedSeats.includes(seat) ? 'bg-brand-red text-white' : 'bg-bg-cardAlt text-text-muted hover:bg-brand-blue/20'}`}>{seat}</button>)}</div> : <button type="button" className="mt-1 inline-flex items-center gap-1 rounded-md bg-brand-blue px-2.5 py-1.5 text-[10px] font-medium text-white hover:brightness-110">{t('ticketing_continue')}<ArrowRight size={11} /></button>}</div></article>)}</div></section><aside className="h-fit rounded-card border border-border bg-bg-card p-4"><div className="flex items-center gap-2"><MapPin size={17} className="text-brand-blue" /><h2 className="text-sm font-medium text-text-primary">{t('ticketing_flow_title')}</h2></div><p className="mt-2 text-[10px] leading-4 text-text-muted">{t('ticketing_flow_note')}</p>{type === 'bus' && <div className="mt-4 rounded-md bg-bg-cardAlt p-3"><p className="text-[10px] font-medium text-text-primary">{t('ticketing_selected_seats')}</p><p className="mt-1 text-lg text-brand-red">{selectedSeats.length ? selectedSeats.join(', ') : '—'}</p><p className="mt-1 text-[10px] text-text-muted">{boardingPoint} → {dropoffPoint}</p></div>}<div className="mt-3 rounded-md border border-status-success/20 bg-status-success/10 p-3"><p className="text-[10px] font-medium text-status-success">{t('ticketing_live_title')}</p><p className="mt-1 text-[10px] leading-4 text-text-muted">{t('ticketing_live_note')}</p></div></aside></div>
  </div>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label className="block"><span className="mb-1 block text-[9px] text-text-faint">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-border bg-bg px-2.5 py-2.5 text-xs text-text-primary outline-none">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="block"><span className="mb-1 block text-[9px] text-text-faint">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-md border border-border bg-bg px-2.5 py-2.5 text-xs text-text-primary outline-none placeholder:text-text-faint focus:border-brand-blue/60" /></label>; }
function DateField({ label, date, setDate }: { label: string; date: string; setDate: (value: string) => void }) { return <label className="block"><span className="mb-1 block text-[9px] text-text-faint">{label}</span><span className="flex items-center gap-2 rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-secondary"><CalendarDays size={13} className="text-brand-blue" /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-w-0 bg-transparent text-xs text-text-primary outline-none" /></span></label>; }
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="block"><span className="mb-1 block text-[9px] text-text-faint">{label}</span><span className="flex items-center gap-2 rounded-md border border-border bg-bg px-2.5 py-2 text-xs text-text-secondary"><Users size={13} className="text-brand-blue" /><input type="number" min={1} max={45} value={value} onChange={(event) => onChange(Math.max(1, Number(event.target.value)))} className="w-full bg-transparent text-xs text-text-primary outline-none" /></span></label>; }
function SearchButton({ onClick, label }: { onClick: () => void; label: string }) { return <button type="button" onClick={onClick} className="flex items-center justify-center gap-2 rounded-md bg-brand-red px-3 py-2.5 text-xs font-medium text-white hover:brightness-110"><Search size={14} />{label}</button>; }
