import { useState } from 'react';
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Clock3,
  CreditCard,
  Heart,
  MapPin,
  Navigation,
  Phone,
  Star,
  Utensils,
  Wifi,
  Users,
  Wine,
} from 'lucide-react';
import { useCurrency } from '../../lib/currency';
import { useLanguage } from '../../lib/i18n';

const PHOTO_ASSETS = [
  '/images/blog/shwedagon-evening.webp',
  '/images/blog/inle-stilt-houses.webp',
  '/images/blog/bagan-sunrise.webp',
  '/images/blog/ubein-evening.webp',
];

const DISHES = [
  { name: 'Mohinga', description: 'Traditional Burmese rice noodle soup with fish and herbs.', price: 2500, image: PHOTO_ASSETS[1], badge: 'Best seller' },
  { name: 'Shan Noodle', description: 'Rice noodles with spicy tomato sauce and minced pork.', price: 3000, image: PHOTO_ASSETS[2] },
  { name: 'Chicken Curry', description: 'Burmese style chicken curry with coconut milk.', price: 4000, image: PHOTO_ASSETS[0] },
  { name: 'Pork Spare Ribs', description: 'BBQ pork spare ribs with a special house sauce.', price: 6000, image: PHOTO_ASSETS[3] },
  { name: 'Tea Leaf Salad', description: 'Traditional fermented tea leaf salad with nuts.', price: 2500, image: PHOTO_ASSETS[1] },
  { name: 'Fried Fish', description: 'Crispy fried fish with spicy garlic sauce.', price: 5000, image: PHOTO_ASSETS[2] },
];

const NEARBY = [
  { name: 'Shwedagon Pagoda', distance: '2.1 km', image: PHOTO_ASSETS[0] },
  { name: 'Inya Lake', distance: '1.4 km', image: PHOTO_ASSETS[1] },
  { name: 'Bogyoke Market', distance: '3.8 km', image: PHOTO_ASSETS[2] },
  { name: 'Kandawgyi Park', distance: '2.7 km', image: PHOTO_ASSETS[3] },
];

const AMENITIES = [
  { icon: Utensils, label: 'Garden dining' },
  { icon: Users, label: 'Family friendly' },
  { icon: Wifi, label: 'Free Wi-Fi' },
  { icon: CreditCard, label: 'Card accepted' },
];

export function RestaurantPage() {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'food' | 'drinks' | 'photos' | 'reviews'>('food');
  const [menuCategory, setMenuCategory] = useState('All dishes');

  const menuCategories = ['All dishes', 'Traditional dishes', 'Rice dishes', 'Noodles', 'Seafood', 'Soups', 'Salads', 'BBQ'];
  const restaurantTabs: { id: typeof activeTab; Icon: typeof Utensils; label: string }[] = [
    { id: 'food', Icon: Utensils, label: t('restaurant_food_menu') },
    { id: 'drinks', Icon: Wine, label: t('restaurant_drinks_menu') },
    { id: 'photos', Icon: Camera, label: t('restaurant_photos') },
    { id: 'reviews', Icon: Star, label: `${t('restaurant_reviews')} (230)` },
  ];

  return (
    <div className="mx-auto max-w-7xl pb-8 pt-2 sm:pt-4">
      <div className="mb-3 flex items-center gap-2 text-[10px] text-text-faint">
        <ArrowLeft size={12} />
        <span>{t('restaurant_breadcrumb_restaurants')}</span>
        <ChevronRight size={11} />
        <span className="text-text-secondary">{t('restaurant_name')}</span>
      </div>

      <section className="overflow-hidden rounded-card border border-border bg-bg-card">
        <div className="relative min-h-[250px] overflow-hidden sm:min-h-[310px]">
          <img src={PHOTO_ASSETS[0]} alt={t('restaurant_name')} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
          <div className="relative flex min-h-[250px] items-end gap-3 p-4 sm:min-h-[310px] sm:p-6">
            <div className="hidden h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white/90 sm:block">
              <img src={PHOTO_ASSETS[0]} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 pb-1">
              <span className="mb-2 inline-flex rounded-full bg-status-success px-2 py-1 text-[10px] font-medium text-white">{t('restaurant_open_now')}</span>
              <h1 className="font-serif text-2xl text-white sm:text-4xl">{t('restaurant_name')}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/90">
                <span className="inline-flex items-center gap-1 text-status-rating"><Star size={13} fill="currentColor" /> 4.6</span>
                <span>(230 {t('restaurant_reviews')})</span>
                <span>·</span>
                <span>Burmese, Asian</span>
                <span>·</span>
                <span>$$</span>
              </div>
              <p className="mt-2 max-w-xl text-xs leading-5 text-white/80 sm:text-sm">{t('restaurant_description')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => setSaved((value) => !value)} className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-900"><Heart size={14} fill={saved ? 'currentColor' : 'none'} /> {saved ? t('restaurant_saved') : t('restaurant_save')}</button>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-3 py-2 text-xs font-medium text-white"><Navigation size={14} /> {t('restaurant_directions')}</button>
                <button type="button" className="inline-flex items-center gap-1.5 rounded-md bg-brand-red px-3 py-2 text-xs font-medium text-white"><Phone size={14} /> {t('restaurant_call')}</button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid border-t border-border sm:grid-cols-4">
          <InfoCell icon={MapPin} label={t('restaurant_address')} value="No. 45, Inya Road, Kamayut, Yangon" link={t('restaurant_view_map')} />
          <InfoCell icon={Clock3} label={t('restaurant_open_hours')} value="10:00 AM – 10:00 PM" accent={t('restaurant_open_everyday')} />
          <InfoCell icon={CreditCard} label={t('restaurant_price_range')} value="8,000 – 20,000 MMK" accent={t('restaurant_mid_range')} />
          <InfoCell icon={Utensils} label={t('restaurant_cuisine')} value="Burmese, Asian" accent={t('restaurant_local_restaurant')} />
        </div>
      </section>

      <section className="mt-3 grid overflow-hidden rounded-card border border-border bg-bg-card lg:grid-cols-[1.1fr_1fr]">
        <div className="relative min-h-[170px] overflow-hidden bg-bg-cardAlt">
          <img src={PHOTO_ASSETS[1]} alt={t('restaurant_map')} className="h-full w-full object-cover opacity-70 grayscale" />
          <div className="absolute inset-0 bg-brand-blue/15" />
          <button type="button" className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-3 py-2 text-xs font-medium text-white"><MapPin size={13} /> {t('restaurant_view_map')}</button>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4 lg:grid-cols-2">
          {AMENITIES.map(({ icon: Icon, label }) => <div key={label} className="flex flex-col items-center justify-center gap-1 bg-bg-card p-3 text-center text-[10px] text-text-secondary"><Icon size={18} className="text-brand-blue" />{label}</div>)}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-card border border-border bg-bg-card">
        <div className="flex overflow-x-auto border-b border-border">
          {restaurantTabs.map(({ id, Icon, label }) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-xs ${activeTab === id ? 'border-brand-blue text-brand-blue' : 'border-transparent text-text-secondary'}`}><Icon size={14} />{label}</button>)}
        </div>

        {activeTab === 'food' && (
          <div className="grid lg:grid-cols-[150px_1fr]">
            <aside className="border-b border-border p-2 lg:border-b-0 lg:border-r">
              {menuCategories.map((category) => <button key={category} type="button" onClick={() => setMenuCategory(category)} className={`block w-full rounded-md px-3 py-2 text-left text-[10px] ${menuCategory === category ? 'bg-brand-blue text-white' : 'text-text-secondary hover:bg-bg-cardAlt'}`}>{category}</button>)}
            </aside>
            <div className="p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-medium text-text-primary">{t('restaurant_popular_dishes')}</h2><button type="button" className="text-[10px] text-brand-blue">{t('restaurant_view_all_menu')}</button></div>
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {DISHES.map((dish) => <DishCard key={dish.name} dish={dish} formatPrice={formatPrice} />)}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'drinks' && <EmptyTab icon={Wine} text={t('restaurant_drinks_coming')} />}
        {activeTab === 'photos' && <PhotoGrid />}
        {activeTab === 'reviews' && <ReviewsPanel />}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <ReviewsPanel compact />
        <section className="rounded-card border border-border bg-bg-card p-3 sm:p-4"><SectionTitle icon={Camera} title={t('restaurant_venue_photos')} action={t('restaurant_view_all_photos')} /><PhotoGrid compact /></section>
      </div>

      <section className="mt-5"><SectionTitle icon={MapPin} title={t('restaurant_nearby_attractions')} action={t('restaurant_view_all_attractions')} /><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{NEARBY.map((place) => <div key={place.name} className="overflow-hidden rounded-card border border-border bg-bg-card"><img src={place.image} alt={place.name} className="h-20 w-full object-cover" /><div className="p-2"><p className="truncate text-[10px] text-text-primary">{place.name}</p><p className="mt-1 flex items-center gap-1 text-[9px] text-text-faint"><MapPin size={9} />{place.distance}</p></div></div>)}</div></section>

      <section className="mt-5 flex flex-col items-start justify-between gap-3 overflow-hidden rounded-card bg-gradient-to-r from-brand-blueDark to-brand-blue p-4 sm:flex-row sm:items-center"><div><h2 className="text-base font-medium text-white">{t('restaurant_cta_title')}</h2><p className="mt-1 text-xs text-white/75">{t('restaurant_cta_body')}</p></div><button type="button" className="rounded-md bg-white px-4 py-2 text-xs font-medium text-brand-blue">{t('restaurant_explore_button')}</button></section>
    </div>
  );
}

function InfoCell({ icon: Icon, label, value, link, accent }: { icon: typeof MapPin; label: string; value: string; link?: string; accent?: string }) {
  return <div className="border-b border-border p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><div className="flex items-start gap-2"><Icon size={15} className="mt-0.5 shrink-0 text-text-secondary" /><div><p className="text-[10px] font-medium text-text-primary">{label}</p><p className="mt-1 text-[10px] leading-4 text-text-secondary">{value}</p>{link && <p className="mt-1 text-[10px] text-brand-blue">{link}</p>}{accent && <p className="mt-1 text-[10px] text-status-success">{accent}</p>}</div></div></div>;
}

function SectionTitle({ icon: Icon, title, action }: { icon: typeof Camera; title: string; action: string }) {
  return <div className="mb-3 flex items-center justify-between"><h2 className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary"><Icon size={15} className="text-brand-blue" />{title}</h2><button type="button" className="text-[10px] text-brand-blue">{action}</button></div>;
}

function DishCard({ dish, formatPrice }: { dish: (typeof DISHES)[number]; formatPrice: (usd: number) => string }) {
  return <article className="overflow-hidden rounded-card border border-border bg-bg-cardAlt"><div className="relative"><img src={dish.image} alt={dish.name} className="h-28 w-full object-cover" />{dish.badge && <span className="absolute left-2 top-2 rounded bg-brand-red px-1.5 py-1 text-[9px] text-white">{dish.badge}</span>}</div><div className="p-2"><h3 className="text-xs font-medium text-text-primary">{dish.name}</h3><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-text-muted">{dish.description}</p><p className="mt-2 text-right text-xs font-medium text-brand-blue">{formatPrice(dish.price / 4500)}</p></div></article>;
}

function EmptyTab({ icon: Icon, text }: { icon: typeof Wine; text: string }) {
  return <div className="flex min-h-44 flex-col items-center justify-center gap-2 text-text-muted"><Icon size={24} className="text-brand-blue" /><p className="text-xs">{text}</p></div>;
}

function PhotoGrid({ compact = false }: { compact?: boolean }) {
  return <div className={`grid ${compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'} gap-2`}>{PHOTO_ASSETS.map((photo, index) => <img key={photo} src={photo} alt={`Restaurant ${index + 1}`} className={`${compact && index === 0 ? 'col-span-2 row-span-2 h-full min-h-32' : 'h-24'} w-full rounded-md object-cover`} />)}</div>;
}

function ReviewsPanel({ compact = false }: { compact?: boolean }) {
  const reviews = [
    { name: 'Aung Aung', text: 'Amazing atmosphere, delicious food and great service!', time: '2 days ago' },
    { name: 'May Thu', text: 'The Mohinga is the best! Highly recommended.', time: '4 days ago' },
    { name: 'Kyaw Min', text: 'Beautiful rooftop view and authentic Burmese taste.', time: '1 week ago' },
  ];
  return <section className={`${compact ? 'rounded-card border border-border bg-bg-card p-3 sm:p-4' : 'p-3 sm:p-4'}`}><SectionTitle icon={Star} title={compact ? 'Top reviews' : 'Reviews'} action="View all" /><div className="space-y-3">{reviews.slice(0, compact ? 3 : 1).map((review) => <div key={review.name} className="flex gap-2"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-xs text-brand-blue">{review.name[0]}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[11px] font-medium text-text-primary">{review.name}</p><span className="text-status-rating">★★★★★</span><span className="text-[9px] text-text-faint">{review.time}</span></div><p className="mt-1 text-[10px] leading-4 text-text-muted">{review.text}</p></div></div>)}</div></section>;
}
