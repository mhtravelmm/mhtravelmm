import { useMemo, useState } from 'react';
import { Bike, Car, Check, ChevronRight, Compass, MapPin, Phone, Search, ShipWheel, TentTree, UserRound } from 'lucide-react';
import { AdSlot } from '../../components/ui/AdSlot';
import { useLanguage } from '../../lib/i18n';

type RentalCategory = 'motorbike' | 'bicycle' | 'car' | 'horse_carriage' | 'camping_tent' | 'motorboat' | 'travel_guide';
type CustomerType = 'citizen' | 'foreigner';
type Fulfillment = 'delivery' | 'branch';
type CarTypeId = 'family_car' | 'minibus_35' | 'bus_45';

type City = {
  id: string;
  name: { mm: string; en: string };
  branches: { mm: string; en: string }[];
  categories: RentalCategory[];
};

const cities: City[] = [
  { id: 'yangon', name: { mm: 'ရန်ကုန်', en: 'Yangon' }, branches: [{ mm: 'ရန်ကုန် MH Travel ရုံးခွဲ — Downtown', en: 'Yangon MH Travel Branch — Downtown' }], categories: ['motorbike', 'bicycle', 'car', 'travel_guide'] },
  { id: 'bagan', name: { mm: 'ပုဂံ', en: 'Bagan' }, branches: [{ mm: 'ပုဂံ MH Travel ရုံးခွဲ — Nyaung-U', en: 'Bagan MH Travel Branch — Nyaung-U' }], categories: ['motorbike', 'bicycle', 'car', 'horse_carriage', 'camping_tent', 'travel_guide'] },
  { id: 'mandalay', name: { mm: 'မန္တလေး', en: 'Mandalay' }, branches: [{ mm: 'မန္တလေး MH Travel ရုံးခွဲ — 78th Street', en: 'Mandalay MH Travel Branch — 78th Street' }], categories: ['motorbike', 'bicycle', 'car', 'travel_guide'] },
  { id: 'inle', name: { mm: 'အင်းလေး', en: 'Inle Lake' }, branches: [{ mm: 'ညောင်ရွှေ MH Travel ရုံးခွဲ', en: 'Nyaung Shwe MH Travel Branch' }], categories: ['bicycle', 'motorboat', 'camping_tent', 'travel_guide'] },
  { id: 'ngapali', name: { mm: 'ငပလီ', en: 'Ngapali' }, branches: [{ mm: 'ငပလီ MH Travel ရုံးခွဲ', en: 'Ngapali MH Travel Branch' }], categories: ['bicycle', 'motorbike', 'motorboat', 'camping_tent'] },
];

const categoryInfo: Record<RentalCategory, { icon: typeof Bike; image: string; title: { mm: string; en: string }; detail: { mm: string; en: string }; rate: number; foreignRate: number }> = {
  motorbike: { icon: Bike, image: '/images/blog/ubein-evening.webp', title: { mm: 'ဆိုင်ကယ်', en: 'Motorbike' }, detail: { mm: 'ဆိုင်ကယ်နဲ့ စက်ဘီး flow တူညီသည်', en: 'Simple self-drive flow' }, rate: 18, foreignRate: 22 },
  bicycle: { icon: Bike, image: '/images/blog/shwedagon-evening.webp', title: { mm: 'စက်ဘီး', en: 'Bicycle' }, detail: { mm: 'မြို့တွင်း လွတ်လပ်စွာစီးရန်', en: 'Explore the city at your pace' }, rate: 8, foreignRate: 10 },
  car: { icon: Car, image: '/images/blog/shwedagon-evening.webp', title: { mm: 'ကား', en: 'Car' }, detail: { mm: 'အိမ်စီးကား၊ ၃၅ ယောက်စီး၊ ၄၅ ယောက်စီး ရွေးချယ်ရန်', en: 'Family car, 35-seat, or 45-seat options' }, rate: 42, foreignRate: 55 },
  horse_carriage: { icon: Compass, image: '/images/blog/bagan-sunrise.webp', title: { mm: 'မြင်းလှည်း', en: 'Horse carriage' }, detail: { mm: 'ပုဂံဒေသ လည်ပတ်ရန်', en: 'Explore Bagan in style' }, rate: 28, foreignRate: 34 },
  camping_tent: { icon: TentTree, image: '/images/blog/inle-stilt-houses.webp', title: { mm: 'ရွက်ဖျင်တဲ', en: 'Camping tent' }, detail: { mm: 'သဘာဝထဲတွင် တည်းခိုရန်', en: 'Stay close to nature' }, rate: 12, foreignRate: 15 },
  motorboat: { icon: ShipWheel, image: '/images/blog/inle-stilt-houses.webp', title: { mm: 'စက်လှေ', en: 'Motorboat' }, detail: { mm: 'ရေကြောင်းခရီးအတွက်', en: 'For lake and river trips' }, rate: 55, foreignRate: 68 },
  travel_guide: { icon: UserRound, image: '/images/blog/bagan-sunrise.webp', title: { mm: 'Travel Guide', en: 'Travel guide' }, detail: { mm: 'ဒေသခံလမ်းညွှန် ငှားရန်', en: 'Hire a local guide' }, rate: 35, foreignRate: 45 },
};

const carTypes: Record<CarTypeId, { label: { mm: string; en: string }; rate: number; foreignRate: number }> = {
  family_car: { label: { mm: 'အိမ်စီးကား (၄–၅ ယောက်စီး)', en: 'Family car (4–5 seats)' }, rate: 42, foreignRate: 55 },
  minibus_35: { label: { mm: '၃၅ ယောက်စီးကား', en: '35-seat minibus' }, rate: 180, foreignRate: 225 },
  bus_45: { label: { mm: '၄၅ ယောက်စီးကား', en: '45-seat bus' }, rate: 240, foreignRate: 295 },
};

function tomorrow() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function RentalsPage() {
  const { language, t } = useLanguage();
  const [cityId, setCityId] = useState('yangon');
  const [category, setCategory] = useState<RentalCategory | null>(null);
  const [date, setDate] = useState(tomorrow());
  const [days, setDays] = useState(1);
  const [customerType, setCustomerType] = useState<CustomerType>('citizen');
  const [fulfillment, setFulfillment] = useState<Fulfillment>('delivery');
  const [address, setAddress] = useState('');
  const [branch, setBranch] = useState('');
  const [phone, setPhone] = useState('');
  const [carTypeId, setCarTypeId] = useState<CarTypeId>('family_car');
  const [submitted, setSubmitted] = useState(false);
  const city = cities.find((item) => item.id === cityId) ?? cities[0];
  const selected = category ? categoryInfo[category] : null;
  const carType = carTypes[carTypeId];
  const rate = selected
    ? category === 'car'
      ? customerType === 'foreigner' ? carType.foreignRate : carType.rate
      : customerType === 'foreigner' ? selected.foreignRate : selected.rate
    : 0;
  const total = rate * days;
  const locationReady = fulfillment === 'branch' ? Boolean(branch) : address.trim().length >= 3;
  const canSubmit = Boolean(category && phone.trim().length >= 7 && locationReady);
  const availableCategories = useMemo(() => city.categories.map((item) => ({ id: item, ...categoryInfo[item] })), [city.categories]);

  function changeCity(value: string) {
    setCityId(value);
    const nextCity = cities.find((item) => item.id === value) ?? cities[0];
    if (category && !nextCity.categories.includes(category)) setCategory(null);
    setBranch('');
    setSubmitted(false);
  }

  return <div className="mx-auto max-w-7xl pb-10 pt-2 sm:pt-5">
    <AdSlot placement="rentals-top" devPlaceholder={<div className="flex items-center justify-between gap-3"><div><p className="text-[9px] uppercase tracking-[0.18em]">{t('rentals_ad_label')}</p><p className="mt-1 text-xs font-medium">{t('rentals_ad_banner')}</p></div><span className="rounded bg-ad-text/10 px-2 py-1 text-[9px]">{t('rentals_ad_action')}</span></div>} />
    <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_390px]">
      <section>
        <div className="mb-3"><h2 className="text-sm font-medium text-text-primary">{t('rentals_choose_type')}</h2><p className="mt-1 text-[10px] text-text-faint">{city.name[language]} · {availableCategories.length} {t('rentals_available_types')}</p></div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">{availableCategories.map((item) => { const Icon = item.icon; return <button type="button" key={item.id} onClick={() => { setCategory(item.id); setSubmitted(false); }} className={`overflow-hidden rounded-card border text-left transition ${category === item.id ? 'border-brand-blue bg-brand-blue/10 ring-1 ring-brand-blue/30' : 'border-border bg-bg-card hover:border-brand-blue/40'}`}><div className="relative h-20"><img src={item.image} alt={item.title[language]} className="h-full w-full object-cover" /><span className={`absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full ${category === item.id ? 'bg-brand-blue text-white' : 'bg-black/65 text-white'}`}><Icon size={16} /></span><ChevronRight size={14} className="absolute right-2 top-2 text-white drop-shadow" /></div><div className="p-3"><p className="text-xs font-medium text-text-primary">{item.title[language]}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-text-muted">{item.detail[language]}</p><p className="mt-2 text-[10px] text-brand-red">${item.rate} <span className="text-text-faint">/ {t('rentals_day')}</span></p></div></button>; })}</div>
        <div className="mt-4 rounded-card border border-border bg-bg-card p-3"><div className="flex items-center gap-2"><Search size={15} className="text-brand-blue" /><p className="text-xs font-medium text-text-primary">{t('rentals_different_city_title')}</p></div><p className="mt-1 text-[10px] leading-4 text-text-muted">{t('rentals_different_city_detail')}</p></div>
      </section>
      <aside className="h-fit rounded-card border border-border bg-bg-card p-4 xl:sticky xl:top-24">
        <div className="mb-4"><p className="text-[10px] uppercase tracking-[0.15em] text-brand-blue">{t('rentals_order_title')}</p><h2 className="mt-1 text-base font-medium text-text-primary">{selected ? selected.title[language] : t('rentals_select_first')}</h2></div>
        <div className="space-y-3 border-b border-border pb-4"><label className="block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_choose_city')}</span><span className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2.5"><MapPin size={14} className="text-brand-blue" /><select value={cityId} onChange={(event) => changeCity(event.target.value)} className="w-full bg-transparent text-xs text-text-primary outline-none">{cities.map((item) => <option key={item.id} value={item.id}>{item.name[language]}</option>)}</select></span></label><label className="block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_start_date')}</span><input type="date" min={tomorrow()} value={date} onChange={(event) => setDate(event.target.value)} className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-xs text-text-primary outline-none" /></label><p className="flex items-center gap-1.5 text-[9px] text-brand-blue"><Check size={12} />{t('rentals_advance_note')}</p></div>
        {!selected ? <div className="mt-4 rounded-md border border-dashed border-border p-5 text-center text-[10px] leading-4 text-text-muted">{t('rentals_select_first_detail')}</div> : <div className="mt-4"><div className="grid grid-cols-2 gap-2"><label className="rounded-md bg-bg-cardAlt p-2"><span className="block text-[9px] text-text-faint">{t('rentals_days')}</span><input type="number" min={1} max={30} value={days} onChange={(event) => setDays(Math.max(1, Number(event.target.value)))} className="mt-1 w-full bg-transparent text-sm text-text-primary outline-none" /></label><label className="rounded-md bg-bg-cardAlt p-2"><span className="block text-[9px] text-text-faint">{t('rentals_nationality')}</span><select value={customerType} onChange={(event) => setCustomerType(event.target.value as CustomerType)} className="mt-1 w-full bg-transparent text-[11px] text-text-primary outline-none"><option value="citizen">{t('rentals_citizen')}</option><option value="foreigner">{t('rentals_foreigner')}</option></select></label></div>{category === 'car' && <><label className="mt-3 block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_car_type')}</span><select value={carTypeId} onChange={(event) => setCarTypeId(event.target.value as CarTypeId)} className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-[11px] text-text-primary outline-none">{Object.entries(carTypes).map(([id, item]) => <option key={id} value={id}>{item.label[language]}</option>)}</select></label><p className="mt-2 rounded-md bg-status-warningBg px-3 py-2 text-[10px] leading-4 text-status-warning">{t('rentals_car_note')}</p></>}<div className="mt-3"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_receive_method')}</span><div className="grid grid-cols-2 gap-1.5"><button type="button" onClick={() => setFulfillment('delivery')} className={`rounded-md border px-2 py-2 text-[10px] ${fulfillment === 'delivery' ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' : 'border-border text-text-muted'}`}>{t('rentals_delivery')}</button><button type="button" onClick={() => setFulfillment('branch')} className={`rounded-md border px-2 py-2 text-[10px] ${fulfillment === 'branch' ? 'border-brand-blue bg-brand-blue/10 text-brand-blue' : 'border-border text-text-muted'}`}>{t('rentals_branch_pickup')}</button></div></div>{fulfillment === 'delivery' ? <label className="mt-3 block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_delivery_address')}</span><textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={2} placeholder={t('rentals_delivery_placeholder')} className="w-full resize-none rounded-md border border-border bg-bg px-3 py-2 text-[11px] text-text-primary outline-none placeholder:text-text-faint" /></label> : <label className="mt-3 block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_choose_branch')}</span><select value={branch} onChange={(event) => setBranch(event.target.value)} className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-[11px] text-text-primary outline-none"><option value="">{t('rentals_choose_branch_placeholder')}</option>{city.branches.map((item) => <option key={item.en} value={item.en}>{item[language]}</option>)}</select></label>}<label className="mt-3 block"><span className="mb-1 block text-[10px] text-text-faint">{t('rentals_phone')}</span><span className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2.5"><Phone size={14} className="text-brand-blue" /><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t('rentals_phone_placeholder')} className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-faint" /></span></label><div className="mt-4 flex items-center justify-between border-t border-border pt-3"><span className="text-[10px] text-text-muted">{t('rentals_estimate')} · {days} {t('rentals_day_count')}</span><strong className="text-lg text-brand-red">${total}</strong></div><button type="button" onClick={() => canSubmit && setSubmitted(true)} disabled={!canSubmit} className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-brand-red px-3 py-2.5 text-xs font-medium text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">{t('rentals_submit_order')}<ChevronRight size={14} /></button><p className="mt-2 text-center text-[9px] leading-4 text-text-faint">{t('rentals_contact_note')}</p>{submitted && <div className="mt-3 flex items-start gap-2 rounded-md border border-status-success/30 bg-status-success/10 px-3 py-2 text-[10px] leading-4 text-status-success"><Check size={14} className="mt-0.5 shrink-0" />{t('rentals_submitted')}</div>}</div>}
      </aside>
    </div>
  </div>;
}
