import { useEffect, useMemo, useState } from 'react';
import { LocateFixed, MapPin, Search, SlidersHorizontal, Star } from 'lucide-react';
import { ListingCard } from '../../components/ui/ListingCard';
import { SectionHeader } from '../home/sections/SectionHeader';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';
import { NEARBY_LISTINGS, type NearbyCategory } from '../../data/nearbyData';

const CATEGORY_KEYS: Record<NearbyCategory, TranslationKey> = {
  hotel: 'nearby_category_hotel',
  restaurant: 'nearby_category_restaurant',
  cafe: 'nearby_category_cafe',
  book_shop: 'nearby_category_book_shop',
  attraction: 'nearby_category_attraction',
  market: 'nearby_category_market',
  rental: 'nearby_category_rental',
};

const CATEGORY_ORDER: NearbyCategory[] = ['hotel', 'restaurant', 'cafe', 'book_shop', 'attraction', 'market', 'rental'];

function distanceBetweenKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const earthRadius = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function NearbyPage() {
  const { t } = useLanguage();
  const favorites = useToggleFavorite(NEARBY_LISTINGS);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | NearbyCategory>('all');
  const [minRating, setMinRating] = useState('0');
  const [maxDistance, setMaxDistance] = useState('20');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'fallback' | 'loading' | 'ready' | 'denied'>('fallback');

  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude });
        setLocationStatus('ready');
      },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 },
    );
  }, []);

  const listings = useMemo(() => favorites.listings.map((listing) => ({
    ...listing,
    distanceKm: userLocation ? Number(distanceBetweenKm(userLocation.lat, userLocation.lng, listing.lat, listing.lng).toFixed(1)) : listing.distanceKm,
  })), [favorites.listings, userLocation]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return listings
      .filter((listing) => category === 'all' || listing.category === category)
      .filter((listing) => listing.rating >= Number(minRating))
      .filter((listing) => listing.distanceKm <= Number(maxDistance))
      .filter((listing) => !normalized || `${listing.title} ${listing.category} ${listing.address}`.toLowerCase().includes(normalized))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [category, listings, maxDistance, minRating, query]);

  const nearest = filtered.slice(0, 8);
  const recommended = filtered.slice(8).sort((a, b) => b.rating - a.rating || a.distanceKm - b.distanceKm);

  return (
    <div className="mx-auto max-w-7xl pb-8 pt-2 sm:pt-4">
      <section className="mb-5 rounded-card border border-border bg-bg-card p-3 sm:p-4">
        <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-base font-medium text-text-primary">{t('nearby_title')}</h1>
            <p className="mt-1 text-[11px] text-text-muted">{t('nearby_intro')}</p>
          </div>
          <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-1.5 self-start rounded-full bg-brand-blue/10 px-3 py-1.5 text-[10px] text-brand-blue"><LocateFixed size={12} />{locationStatus === 'ready' ? t('nearby_location_ready') : t('nearby_use_location')}</button>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
          <label className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2"><Search size={14} className="text-text-faint" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('nearby_search_placeholder')} className="w-full bg-transparent text-xs text-text-primary outline-none placeholder:text-text-faint" /></label>
          <label className="flex items-center gap-2 rounded-md border border-border bg-bg px-3 py-2 text-[10px] text-text-secondary"><SlidersHorizontal size={12} /><select value={category} onChange={(event) => setCategory(event.target.value as 'all' | NearbyCategory)} className="bg-transparent outline-none"><option value="all">{t('nearby_all_categories')}</option>{CATEGORY_ORDER.map((item) => <option key={item} value={item}>{t(CATEGORY_KEYS[item])}</option>)}</select></label>
          <label className="rounded-md border border-border bg-bg px-3 py-2 text-[10px] text-text-secondary"><select value={minRating} onChange={(event) => setMinRating(event.target.value)} className="bg-transparent outline-none"><option value="0">{t('nearby_all_ratings')}</option><option value="4">4.0+ {t('nearby_rating_label')}</option><option value="4.5">4.5+ {t('nearby_rating_label')}</option><option value="4.8">4.8+ {t('nearby_rating_label')}</option></select></label>
          <label className="rounded-md border border-border bg-bg px-3 py-2 text-[10px] text-text-secondary"><select value={maxDistance} onChange={(event) => setMaxDistance(event.target.value)} className="bg-transparent outline-none"><option value="5">{t('nearby_within_5')}</option><option value="10">{t('nearby_within_10')}</option><option value="20">{t('nearby_within_20')}</option><option value="1000">{t('nearby_any_distance')}</option></select></label>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[10px] text-text-faint"><MapPin size={12} className="text-brand-blue" />{locationStatus === 'loading' ? t('nearby_location_loading') : locationStatus === 'ready' ? t('nearby_location_ready_detail') : t('nearby_location_fallback')}</div>
      </section>

      <section className="mb-5">
        <SectionHeader title={t('nearby_nearest_title')} />
        {nearest.length > 0 ? <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">{nearest.map((listing) => <ListingCard key={listing.id} listing={listing} onToggleFavorite={favorites.toggle} size="md" />)}</div> : <EmptyState text={t('nearby_no_results')} />}
      </section>

      <section className="mb-5">
        <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-medium text-text-primary">{t('nearby_recommended_title')}</h2><p className="mt-1 text-[10px] text-text-muted">{t('nearby_recommended_intro')}</p></div><span className="text-[10px] text-text-faint">{recommended.length} {t('nearby_places')}</span></div>
        {CATEGORY_ORDER.map((item) => {
          const categoryListings = recommended.filter((listing) => listing.category === item).slice(0, 4);
          if (categoryListings.length === 0) return null;
          return <div key={item} className="mb-4"><div className="mb-2 flex items-center gap-2"><h3 className="text-xs font-medium text-text-secondary">{t(CATEGORY_KEYS[item])}</h3><span className="h-px flex-1 bg-border" /></div><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">{categoryListings.map((listing) => <ListingCard key={listing.id} listing={listing} onToggleFavorite={favorites.toggle} size="md" />)}</div></div>;
        })}
        {recommended.length === 0 && <EmptyState text={t('nearby_no_recommendations')} />}
      </section>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-card border border-dashed border-border bg-bg-card px-4 py-10 text-center text-xs text-text-muted"><Star size={18} className="mx-auto mb-2 text-status-rating" />{text}</div>;
}
