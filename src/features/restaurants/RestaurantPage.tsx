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
import { Link, useParams } from 'react-router-dom';
import { useCurrency } from '../../lib/currency';
import { useLanguage } from '../../lib/i18n';
import { formatRating, hasRating } from '../../lib/cardMeta';
import { useFavorites } from '../../lib/favorites';
import { mapSearchUrl, telHref } from '../../lib/placeActions';
import { categoryOptions, filterByCategory } from '../../lib/categoryFilter';
import { localizedOrFallback } from '../../lib/translationCache';
import type { Language } from '../../types';
import { RecordNotFound } from '../../components/ui/RecordNotFound';
import { resolveDetailRecord } from '../../lib/detailRoutes';

type Copy = { mm: string; en: string };

const PHOTO_ASSETS = [
  '/images/blog/shwedagon-evening.webp',
  '/images/blog/inle-stilt-houses.webp',
  '/images/blog/bagan-sunrise.webp',
  '/images/blog/ubein-evening.webp',
];

const DISHES: { name: Copy; category: Copy; description: Copy; price: number; image: string; badge?: Copy }[] = [
  { name: { mm: 'မုန့်ဟင်းခါး', en: 'Mohinga' }, category: { mm: 'ခေါက်ဆွဲ', en: 'Noodles' }, description: { mm: 'ငါးနှင့် ဆေးဖက်ဝင်အပင်များ ပါဝင်သော ရိုးရာ မုန့်ဟင်းခါး။', en: 'Traditional Burmese rice noodle soup with fish and herbs.' }, price: 2500, image: PHOTO_ASSETS[1], badge: { mm: 'အရောင်းရဆုံး', en: 'Best seller' } },
  { name: { mm: 'ရှမ်းခေါက်ဆွဲ', en: 'Shan Noodle' }, category: { mm: 'ခေါက်ဆွဲ', en: 'Noodles' }, description: { mm: 'ခရမ်းချဉ်သီးငံပြာရည်နှင့် ဝက်သားမွှဖြင့် ရှမ်းခေါက်ဆွဲ။', en: 'Rice noodles with spicy tomato sauce and minced pork.' }, price: 3000, image: PHOTO_ASSETS[2] },
  { name: { mm: 'ကြက်သားဟင်း', en: 'Chicken Curry' }, category: { mm: 'ရိုးရာအစားအစာ', en: 'Traditional dishes' }, description: { mm: 'အုန်းနို့ပါဝင်သော မြန်မာ့ပုံစံ ကြက်သားဟင်း။', en: 'Burmese style chicken curry with coconut milk.' }, price: 4000, image: PHOTO_ASSETS[0] },
  { name: { mm: 'ဝက်နံရိုးကင်', en: 'Pork Spare Ribs' }, category: { mm: 'အသားကင်', en: 'BBQ' }, description: { mm: 'ဆိုင်ရဲ့ အထူးငံပြာရည်နှင့် ဝက်နံရိုးကင်။', en: 'BBQ pork spare ribs with a special house sauce.' }, price: 6000, image: PHOTO_ASSETS[3] },
  { name: { mm: 'လက်ဖက်သုပ်', en: 'Tea Leaf Salad' }, category: { mm: 'အသုပ်များ', en: 'Salads' }, description: { mm: 'အခွံမာသီးများ ပါဝင်သော ရိုးရာ လက်ဖက်သုပ်။', en: 'Traditional fermented tea leaf salad with nuts.' }, price: 2500, image: PHOTO_ASSETS[1] },
  { name: { mm: 'ငါးကြော်', en: 'Fried Fish' }, category: { mm: 'ပင်လယ်စာ', en: 'Seafood' }, description: { mm: 'ကြက်သွန်ဖြူ ငံပြာရည်နှင့် ကြွပ်ရွသော ငါးကြော်။', en: 'Crispy fried fish with spicy garlic sauce.' }, price: 5000, image: PHOTO_ASSETS[2] },
];

const NEARBY: { name: Copy; distance: string; image: string }[] = [
  { name: { mm: 'ရွှေတိဂုံဘုရား', en: 'Shwedagon Pagoda' }, distance: '2.1 km', image: PHOTO_ASSETS[0] },
  { name: { mm: 'အင်းလျားကန်', en: 'Inya Lake' }, distance: '1.4 km', image: PHOTO_ASSETS[1] },
  { name: { mm: 'ဗိုလ်ချုပ်ဈေး', en: 'Bogyoke Market' }, distance: '3.8 km', image: PHOTO_ASSETS[2] },
  { name: { mm: 'ကန်တော်ကြီးပန်းခြံ', en: 'Kandawgyi Park' }, distance: '2.7 km', image: PHOTO_ASSETS[3] },
];

const RESTAURANT_PHONE = '09 777 123 456';

const AMENITIES: { icon: typeof Utensils; label: Copy }[] = [
  { icon: Utensils, label: { mm: 'ဥယျာဉ်ထဲ စားသောက်နိုင်သည်', en: 'Garden dining' } },
  { icon: Users, label: { mm: 'မိသားစုနှင့် သင့်တော်သည်', en: 'Family friendly' } },
  { icon: Wifi, label: { mm: 'Wi-Fi အခမဲ့', en: 'Free Wi-Fi' } },
  { icon: CreditCard, label: { mm: 'ကတ်ဖြင့် ပေးချေနိုင်သည်', en: 'Card accepted' } },
];

export function RestaurantPage() {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { id } = useParams<{ id: string }>();
  const restaurant = id ? resolveDetailRecord('restaurants', id) : undefined;
  const saved = restaurant ? isFavorite(restaurant.id, restaurant.isFavorited) : false;
  const [activeTab, setActiveTab] = useState<'food' | 'drinks' | 'photos' | 'reviews'>('food');
  const [menuCategory, setMenuCategory] = useState('All dishes');

  // The English label is the stable filter key; the button shows the reader's
  // language, so switching language never drops the selected category.
  const dishRows = DISHES.map((dish) => ({ ...dish, category: dish.category.en }));
  const menuCategories = categoryOptions(dishRows, 'All dishes');
  const visibleDishes = filterByCategory(dishRows, menuCategory, 'All dishes');
  const dishCategoryLabel = (key: string) => key === 'All dishes'
    ? t('restaurant_all_dishes')
    : localizedOrFallback(DISHES.find((dish) => dish.category.en === key)?.category, language);
  if (!restaurant) return <RecordNotFound />;

  const directionsUrl = mapSearchUrl(`${restaurant.title}, Yangon`);
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
        <span className="text-text-secondary">{restaurant.title}</span>
      </div>

      <section className="overflow-hidden rounded-card border border-border bg-bg-card">
        <div className="relative min-h-[250px] overflow-hidden sm:min-h-[310px]">
          <img src={restaurant.imageUrl ?? PHOTO_ASSETS[0]} alt={restaurant.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
          <div className="relative flex min-h-[250px] items-end gap-3 p-4 sm:min-h-[310px] sm:p-6">
            <div className="hidden h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-white/90 sm:block">
              <img src={restaurant.imageUrl ?? PHOTO_ASSETS[0]} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="min-w-0 pb-1">
              <span className="mb-2 inline-flex rounded-full bg-status-success px-2 py-1 text-[10px] font-medium text-white">{t('restaurant_open_now')}</span>
              <h1 className="font-serif text-2xl text-white sm:text-4xl">{restaurant.title}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/90">
                {hasRating(restaurant) && (
                  <span className="inline-flex items-center gap-1 text-status-rating"><Star size={13} fill="currentColor" /> {formatRating(restaurant.rating, language)}</span>
                )}
                <span>(230 {t('restaurant_reviews')})</span>
                <span>·</span>
                <span>{t('restaurant_cuisine_value')}</span>
                <span>·</span>
                <span>$$</span>
              </div>
              <p className="mt-2 max-w-xl text-xs leading-5 text-white/80 sm:text-sm">{t('restaurant_description')}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => toggleFavorite(restaurant.id, restaurant.isFavorited)} className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-900"><Heart size={14} fill={saved ? 'currentColor' : 'none'} /> {saved ? t('restaurant_saved') : t('restaurant_save')}</button>
                <a href={directionsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-3 py-2 text-xs font-medium text-white"><Navigation size={14} /> {t('restaurant_directions')}</a>
                <a href={telHref(RESTAURANT_PHONE)} className="inline-flex items-center gap-1.5 rounded-md bg-brand-red px-3 py-2 text-xs font-medium text-white"><Phone size={14} /> {t('restaurant_call')}</a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid border-t border-border sm:grid-cols-4">
          <InfoCell icon={MapPin} label={t('restaurant_address')} value={t('restaurant_address_value')} link={t('restaurant_view_map')} />
          <InfoCell icon={Clock3} label={t('restaurant_open_hours')} value={t('restaurant_hours_value')} accent={t('restaurant_open_everyday')} />
          <InfoCell icon={CreditCard} label={t('restaurant_price_range')} value={t('restaurant_price_value')} accent={t('restaurant_mid_range')} />
          <InfoCell icon={Utensils} label={t('restaurant_cuisine')} value={t('restaurant_cuisine_value')} accent={t('restaurant_local_restaurant')} />
        </div>
      </section>

      <section className="mt-3 grid overflow-hidden rounded-card border border-border bg-bg-card lg:grid-cols-[1.1fr_1fr]">
        <div className="relative min-h-[170px] overflow-hidden bg-bg-cardAlt">
          <img src={PHOTO_ASSETS[1]} alt={t('restaurant_map')} className="h-full w-full object-cover opacity-70 grayscale" />
          <div className="absolute inset-0 bg-brand-blue/15" />
          <a href={directionsUrl} target="_blank" rel="noreferrer" className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-brand-blue px-3 py-2 text-xs font-medium text-white"><MapPin size={13} /> {t('restaurant_view_map')}</a>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4 lg:grid-cols-2">
          {AMENITIES.map(({ icon: Icon, label }) => <div key={label.en} className="flex flex-col items-center justify-center gap-1 bg-bg-card p-3 text-center text-[10px] text-text-secondary"><Icon size={18} className="text-brand-blue" />{localizedOrFallback(label, language)}</div>)}
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-card border border-border bg-bg-card">
        <div className="flex overflow-x-auto border-b border-border">
          {restaurantTabs.map(({ id, Icon, label }) => <button key={id} type="button" onClick={() => setActiveTab(id)} className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-3 text-xs ${activeTab === id ? 'border-brand-blue text-brand-blue' : 'border-transparent text-text-secondary'}`}><Icon size={14} />{label}</button>)}
        </div>

        {activeTab === 'food' && (
          <div className="grid lg:grid-cols-[150px_1fr]">
            <aside className="border-b border-border p-2 lg:border-b-0 lg:border-r">
              {menuCategories.map((category) => <button key={category} type="button" onClick={() => setMenuCategory(category)} className={`block w-full rounded-md px-3 py-2 text-left text-[10px] ${menuCategory === category ? 'bg-brand-blue text-white' : 'text-text-secondary hover:bg-bg-cardAlt'}`}>{dishCategoryLabel(category)}</button>)}
            </aside>
            <div className="p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-medium text-text-primary">{t('restaurant_popular_dishes')}</h2></div>
              <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {visibleDishes.length > 0
                  ? visibleDishes.map((dish) => <DishCard key={dish.name.en} dish={dish} language={language} formatPrice={formatPrice} />)
                  : <p className="rounded-md border border-dashed border-border px-3 py-8 text-center text-[10px] text-text-muted">{t('restaurant_no_dishes')}</p>}
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
        <section className="rounded-card border border-border bg-bg-card p-3 sm:p-4"><SectionTitle icon={Camera} title={t('restaurant_venue_photos')} /><PhotoGrid compact /></section>
      </div>

      <section className="mt-5"><SectionTitle icon={MapPin} title={t('restaurant_nearby_attractions')} /><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{NEARBY.map((place) => { const name = localizedOrFallback(place.name, language); return <div key={place.name.en} className="overflow-hidden rounded-card border border-border bg-bg-card"><img src={place.image} alt={name} className="h-20 w-full object-cover" /><div className="p-2"><p className="truncate text-[10px] text-text-primary">{name}</p><p className="mt-1 flex items-center gap-1 text-[9px] text-text-faint"><MapPin size={9} />{place.distance}</p></div></div>; })}</div></section>

      <section className="mt-5 flex flex-col items-start justify-between gap-3 overflow-hidden rounded-card bg-gradient-to-r from-brand-blueDark to-brand-blue p-4 sm:flex-row sm:items-center"><div><h2 className="text-base font-medium text-white">{t('restaurant_cta_title')}</h2><p className="mt-1 text-xs text-white/75">{t('restaurant_cta_body')}</p></div><Link to="/travel-plans" className="rounded-md bg-white px-4 py-2 text-xs font-medium text-brand-blue">{t('restaurant_explore_button')}</Link></section>
    </div>
  );
}

function InfoCell({ icon: Icon, label, value, link, accent }: { icon: typeof MapPin; label: string; value: string; link?: string; accent?: string }) {
  return <div className="border-b border-border p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><div className="flex items-start gap-2"><Icon size={15} className="mt-0.5 shrink-0 text-text-secondary" /><div><p className="text-[10px] font-medium text-text-primary">{label}</p><p className="mt-1 text-[10px] leading-4 text-text-secondary">{value}</p>{link && <p className="mt-1 text-[10px] text-brand-blue">{link}</p>}{accent && <p className="mt-1 text-[10px] text-status-success">{accent}</p>}</div></div></div>;
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Camera; title: string }) {
  return <div className="mb-3 flex items-center justify-between"><h2 className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary"><Icon size={15} className="text-brand-blue" />{title}</h2></div>;
}

type DishRow = Omit<(typeof DISHES)[number], 'category'> & { category: string };

function DishCard({ dish, language, formatPrice }: { dish: DishRow; language: Language; formatPrice: (usd: number) => string }) {
  // A dish name and its description are editorial copy, so they go through the
  // reader seam; a card face falls back rather than asking the Worker.
  const name = localizedOrFallback(dish.name, language);
  return <article className="overflow-hidden rounded-card border border-border bg-bg-cardAlt"><div className="relative"><img src={dish.image} alt={name} className="h-28 w-full object-cover" />{dish.badge && <span className="absolute left-2 top-2 rounded bg-brand-red px-1.5 py-1 text-[9px] text-white">{localizedOrFallback(dish.badge, language)}</span>}</div><div className="p-2"><h3 className="text-xs font-medium text-text-primary">{name}</h3><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-text-muted">{localizedOrFallback(dish.description, language)}</p><p className="mt-2 text-right text-xs font-medium text-brand-blue">{formatPrice(dish.price / 4500)}</p></div></article>;
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
  return <section className={`${compact ? 'rounded-card border border-border bg-bg-card p-3 sm:p-4' : 'p-3 sm:p-4'}`}><SectionTitle icon={Star} title={compact ? 'Top reviews' : 'Reviews'} /><div className="space-y-3">{reviews.slice(0, compact ? 3 : 1).map((review) => <div key={review.name} className="flex gap-2"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-xs text-brand-blue">{review.name[0]}</div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[11px] font-medium text-text-primary">{review.name}</p><span className="text-status-rating">★★★★★</span><span className="text-[9px] text-text-faint">{review.time}</span></div><p className="mt-1 text-[10px] leading-4 text-text-muted">{review.text}</p></div></div>)}</div></section>;
}
