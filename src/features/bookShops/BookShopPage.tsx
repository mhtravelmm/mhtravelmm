import { useState } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, Camera, ChevronRight, Coffee, CreditCard, Gift, Heart, MapPin, Navigation, Phone, Star, Users, Wifi, Clock3 } from 'lucide-react';
import { useCurrency } from '../../lib/currency';
import { useLanguage } from '../../lib/i18n';

const PHOTOS = ['/images/blog/ubein-evening.webp', '/images/blog/shwedagon-evening.webp', '/images/blog/inle-stilt-houses.webp', '/images/blog/bagan-sunrise.webp'];
const BOOKS = [
  { title: 'The Midnight Library', author: 'Matt Haig', price: 8000, image: PHOTOS[0] },
  { title: 'Atomic Habits', author: 'James Clear', price: 7500, image: PHOTOS[1] },
  { title: 'Sapiens', author: 'Yuval Noah Harari', price: 9000, image: PHOTOS[2] },
  { title: 'The Alchemist', author: 'Paulo Coelho', price: 6500, image: PHOTOS[3] },
  { title: 'Where the Crawdads Sing', author: 'Delia Owens', price: 8000, image: PHOTOS[1] },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', price: 8500, image: PHOTOS[2] },
  { title: 'Rich Dad Poor Dad', author: 'Robert Kiyosaki', price: 7000, image: PHOTOS[0] },
  { title: 'Ikigai', author: 'Hector Garcia', price: 6000, image: PHOTOS[3] },
];
const NEARBY = [
  { name: 'Kandawgyi Lake', distance: '1.2 km', image: PHOTOS[1] },
  { name: 'Shwedagon Pagoda', distance: '2.3 km', image: PHOTOS[0] },
  { name: 'Bogyoke Market', distance: '1.8 km', image: PHOTOS[2] },
  { name: "People's Park", distance: '2.0 km', image: PHOTOS[3] },
];
const SERVICES = [
  { icon: BookOpen, label: 'English Books' },
  { icon: Users, label: 'Local Authors' },
  { icon: Coffee, label: 'Coffee & Drinks' },
  { icon: BookOpen, label: 'Reading Corner' },
  { icon: Wifi, label: 'Free Wi-Fi' },
  { icon: CalendarDays, label: 'Events & Talks' },
];

type ShopTab = 'books' | 'stationery' | 'gifts' | 'photos' | 'reviews';

export function BookShopPage() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<ShopTab>('books');
  const [bookCategory, setBookCategory] = useState('All categories');
  const tabs: { id: ShopTab; icon: typeof BookOpen; label: string }[] = [
    { id: 'books', icon: BookOpen, label: t('bookshop_books') },
    { id: 'stationery', icon: BookOpen, label: t('bookshop_stationery') },
    { id: 'gifts', icon: Gift, label: t('bookshop_gifts') },
    { id: 'photos', icon: Camera, label: t('bookshop_photos') },
    { id: 'reviews', icon: Star, label: `${t('bookshop_reviews')} (156)` },
  ];
  const categories = ['All categories', 'Fiction', 'Non-fiction', 'Travel', 'History', 'Business', 'Children', 'Burmese books', 'Magazines'];

  return <div className="mx-auto max-w-7xl pb-8 pt-2 sm:pt-4">
    <div className="mb-3 flex items-center gap-2 text-[10px] text-text-faint"><ArrowLeft size={12} /><span>{t('bookshop_breadcrumb')}</span><ChevronRight size={11} /><span className="text-text-secondary">{t('bookshop_name')}</span></div>
    <section className="overflow-hidden rounded-card border border-border bg-bg-card">
      <div className="relative min-h-[250px] overflow-hidden sm:min-h-[310px]"><img src={PHOTOS[0]} alt={t('bookshop_name')} className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" /><div className="relative flex min-h-[250px] items-end gap-3 p-4 sm:min-h-[310px] sm:p-6"><div className="hidden h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/90 bg-slate-100 sm:flex"><BookOpen size={44} className="text-slate-800" /></div><div className="min-w-0 pb-1"><span className="mb-2 inline-flex rounded-full bg-status-success px-2 py-1 text-[10px] font-medium text-white">{t('bookshop_open_now')}</span><h1 className="font-serif text-2xl text-white sm:text-4xl">{t('bookshop_name')}</h1><div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/90"><span className="inline-flex items-center gap-1 text-status-rating"><Star size={13} fill="currentColor" /> 4.8</span><span>(156 {t('bookshop_reviews')})</span><span>·</span><span>Bookstore · Cafe · Community Space</span></div><p className="mt-2 max-w-xl text-xs leading-5 text-white/80 sm:text-sm">{t('bookshop_description')}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => setSaved((value) => !value)} className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-900"><Heart size={14} fill={saved ? 'currentColor' : 'none'} /> {saved ? t('bookshop_saved') : t('bookshop_save')}</button><button type="button" className="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-3 py-2 text-xs font-medium text-white"><Navigation size={14} /> {t('bookshop_directions')}</button><button type="button" className="inline-flex items-center gap-1.5 rounded-md bg-brand-red px-3 py-2 text-xs font-medium text-white"><Phone size={14} /> {t('bookshop_call')}</button></div></div></div></div>
      <div className="grid border-t border-border sm:grid-cols-5"><InfoCell icon={MapPin} label={t('bookshop_address')} value="No. 62, Pyay Road, Sanchaung Township, Yangon" link={t('bookshop_view_map')} /><InfoCell icon={Clock3} label={t('bookshop_open_hours')} value="9:00 AM – 8:00 PM" accent={t('bookshop_open_everyday')} /><InfoCell icon={Phone} label={t('bookshop_phone')} value="09 777 123 456" /><InfoCell icon={CreditCard} label={t('bookshop_price_range')} value="$ (1,000 – 10,000 MMK)" accent={t('bookshop_affordable')} /><InfoCell icon={Users} label={t('bookshop_services')} value="Books, Cafe, Events" /></div>
    </section>

    <section className="mt-3 grid overflow-hidden rounded-card border border-border bg-bg-card sm:grid-cols-6">{SERVICES.map(({ icon: Icon, label }) => <div key={label} className="flex items-center justify-center gap-1.5 border-b border-border p-3 text-center text-[10px] text-text-secondary last:border-b-0 sm:flex-col sm:border-b-0 sm:border-r sm:last:border-r-0"><Icon size={18} className="text-brand-blue" />{label}</div>)}</section>
    <section className="mt-3 grid gap-3 overflow-hidden rounded-card border border-border bg-bg-card p-3 sm:grid-cols-[1fr_1.2fr] sm:p-4"><div><h2 className="text-sm font-medium text-text-primary">{t('bookshop_about_title')}</h2><p className="mt-2 text-[11px] leading-5 text-text-muted">{t('bookshop_about_body')}</p></div><div className="grid grid-cols-2 gap-2"><img src={PHOTOS[1]} alt="" className="h-32 w-full rounded-md object-cover" /><img src={PHOTOS[2]} alt="" className="h-32 w-full rounded-md object-cover" /></div></section>

    <section className="mt-5 overflow-hidden rounded-card border border-border bg-bg-card"><div className="flex overflow-x-auto border-b border-border">{tabs.map(({ id, icon: Icon, label }) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-xs ${activeTab === id ? 'border-brand-blue text-brand-blue' : 'border-transparent text-text-secondary'}`}><Icon size={14} />{label}</button>)}</div>{activeTab === 'books' && <div className="grid lg:grid-cols-[150px_1fr]"><aside className="border-b border-border p-2 lg:border-b-0 lg:border-r">{categories.map((category) => <button key={category} type="button" onClick={() => setBookCategory(category)} className={`block w-full rounded-md px-3 py-2 text-left text-[10px] ${bookCategory === category ? 'bg-brand-blue text-white' : 'text-text-secondary hover:bg-bg-cardAlt'}`}>{category}</button>)}</aside><div className="p-3 sm:p-4"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-medium text-text-primary">{t('bookshop_popular_books')}</h2><button type="button" className="text-[10px] text-brand-blue">{t('bookshop_view_all_books')}</button></div><div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4">{BOOKS.map((book) => <BookCard key={book.title} book={book} formatPrice={formatPrice} />)}</div><button type="button" className="mx-auto mt-4 block rounded-md border border-brand-blue px-4 py-2 text-[10px] text-brand-blue">{t('bookshop_view_all_books')}</button></div></div>}{activeTab === 'stationery' && <EmptyTab icon={BookOpen} text={t('bookshop_stationery_coming')} />}{activeTab === 'gifts' && <EmptyTab icon={Gift} text={t('bookshop_gifts_coming')} />}{activeTab === 'photos' && <PhotoGrid />}{activeTab === 'reviews' && <ReviewsPanel />}</section>

    <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.15fr]"><ReviewsPanel compact /><section className="rounded-card border border-border bg-bg-card p-3 sm:p-4"><SectionTitle icon={Camera} title={t('bookshop_venue_photos')} action={t('bookshop_view_all_photos')} /><PhotoGrid compact /></section></div>
    <section className="mt-5"><SectionTitle icon={MapPin} title={t('bookshop_nearby_attractions')} action={t('bookshop_view_all_attractions')} /><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{NEARBY.map((place) => <div key={place.name} className="overflow-hidden rounded-card border border-border bg-bg-card"><img src={place.image} alt={place.name} className="h-20 w-full object-cover" /><div className="p-2"><p className="truncate text-[10px] text-text-primary">{place.name}</p><p className="mt-1 flex items-center gap-1 text-[9px] text-text-faint"><MapPin size={9} />{place.distance}</p></div></div>)}</div></section>
    <section className="mt-5 flex flex-col items-start justify-between gap-3 overflow-hidden rounded-card bg-gradient-to-r from-brand-blueDark to-brand-blue p-4 sm:flex-row sm:items-center"><div><h2 className="text-base font-medium text-white">{t('bookshop_cta_title')}</h2><p className="mt-1 text-xs text-white/75">{t('bookshop_cta_body')}</p></div><button type="button" className="rounded-md bg-white px-4 py-2 text-xs font-medium text-brand-blue">{t('bookshop_explore_button')}</button></section>
  </div>;
}

function InfoCell({ icon: Icon, label, value, link, accent }: { icon: typeof MapPin; label: string; value: string; link?: string; accent?: string }) { return <div className="border-b border-border p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><div className="flex items-start gap-2"><Icon size={15} className="mt-0.5 shrink-0 text-text-secondary" /><div><p className="text-[10px] font-medium text-text-primary">{label}</p><p className="mt-1 text-[10px] leading-4 text-text-secondary">{value}</p>{link && <p className="mt-1 text-[10px] text-brand-blue">{link}</p>}{accent && <p className="mt-1 text-[10px] text-status-success">{accent}</p>}</div></div></div>; }
function SectionTitle({ icon: Icon, title, action }: { icon: typeof Camera; title: string; action: string }) { return <div className="mb-3 flex items-center justify-between"><h2 className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary"><Icon size={15} className="text-brand-blue" />{title}</h2><button type="button" className="text-[10px] text-brand-blue">{action}</button></div>; }
function BookCard({ book, formatPrice }: { book: (typeof BOOKS)[number]; formatPrice: (usd: number) => string }) { return <article className="overflow-hidden rounded-card border border-border bg-bg-cardAlt"><img src={book.image} alt={book.title} className="h-36 w-full object-cover" /><div className="p-2"><h3 className="line-clamp-2 text-xs font-medium text-text-primary">{book.title}</h3><p className="mt-1 text-[10px] text-text-muted">{book.author}</p><p className="mt-2 text-right text-xs font-medium text-brand-blue">{formatPrice(book.price / 4500)}</p></div></article>; }
function EmptyTab({ icon: Icon, text }: { icon: typeof BookOpen; text: string }) { return <div className="flex min-h-44 flex-col items-center justify-center gap-2 text-text-muted"><Icon size={24} className="text-brand-blue" /><p className="text-xs">{text}</p></div>; }
function PhotoGrid({ compact = false }: { compact?: boolean }) { return <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-5'} gap-2 p-3 sm:p-4`}>{PHOTOS.concat(PHOTOS[0]).map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={`Book shop ${index + 1}`} className={`${compact && index === 0 ? 'col-span-2 row-span-2 h-full min-h-32' : 'h-24'} w-full rounded-md object-cover`} />)}</div>; }
function ReviewsPanel({ compact = false }: { compact?: boolean }) { const reviews = [{ name: 'Thiri Htet', text: 'Great collection of books and a lovely cozy atmosphere.', time: '2 days ago' }, { name: 'Ko Min', text: 'My favorite bookstore in Yangon. The coffee is amazing too!', time: '1 week ago' }, { name: 'Emily Carter', text: 'A must-visit place for any book lover in Myanmar.', time: '2 weeks ago' }]; return <section className={`${compact ? 'rounded-card border border-border bg-bg-card p-3 sm:p-4' : 'p-3 sm:p-4'}`}><SectionTitle icon={Star} title={compact ? 'Top reviews' : 'Reviews'} action="View all" /><div className="space-y-3">{reviews.slice(0, compact ? 3 : 1).map((review) => <div key={review.name} className="flex gap-2"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-xs text-brand-blue">{review.name[0]}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[11px] font-medium text-text-primary">{review.name}</p><span className="text-status-rating">★★★★★</span><span className="text-[9px] text-text-faint">{review.time}</span></div><p className="mt-1 text-[10px] leading-4 text-text-muted">{review.text}</p></div></div>)}</div></section>; }
