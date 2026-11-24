import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Heart, MapPin, Star } from 'lucide-react';
import { ListingCard } from '../../components/ui/ListingCard';
import { useFavorites } from '../../lib/favorites';
import { useLanguage } from '../../lib/i18n';
import { formatDistance, formatRating, hasDistance, hasRating } from '../../lib/cardMeta';
import { useCurrency } from '../../lib/currency';
import { findPlaceKind } from './placeCatalog';
import { RecordNotFound } from '../../components/ui/RecordNotFound';
import { resolveDetailRecord } from '../../lib/detailRoutes';
import { cardGridStyle } from '../../lib/cardGrid';

export function PlaceDetailPage({ kind: kindSlug }: { kind: string }) {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();

  const kind = findPlaceKind(kindSlug);
  const listing = kind && id ? resolveDetailRecord(kindSlug, id) : undefined;

  if (!kind || !listing) return <RecordNotFound />;

  const saved = isFavorite(listing.id, listing.isFavorited);
  const related = kind.items.filter((item) => item.id !== listing.id).slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl pb-10 pt-3 sm:pt-5">
      <button
        type="button"
        onClick={() => navigate(`/${kind.slug}`)}
        className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-blue hover:text-brand-blueLight"
      >
        <ArrowLeft size={14} /> {language === 'mm' ? kind.mmAll : kind.enAll}
      </button>

      <section className="relative overflow-hidden rounded-2xl border border-border bg-slate-950">
        {listing.imageUrl ? (
          <img src={listing.imageUrl} alt={listing.title} className="h-56 w-full object-cover sm:h-72 md:h-80" />
        ) : (
          <div className="h-56 w-full bg-slate-900 sm:h-72 md:h-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06162c] via-[#06162c]/55 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-200">
            {language === 'mm' ? kind.mm : kind.en}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-white sm:text-3xl">{listing.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-200">
            {hasRating(listing) && (
              <span className="inline-flex items-center gap-1 text-status-rating">
                <Star size={12} fill="currentColor" /> {formatRating(listing.rating, language)}
              </span>
            )}
            {hasDistance(listing) && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} /> {formatDistance(listing.distanceKm, language)}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Eye size={12} /> {listing.views.toLocaleString()}
            </span>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_280px]">
        <div className="rounded-xl border border-border bg-bg-card p-4">
          <h2 className="text-sm font-semibold text-text-primary">
            {t('place_about')}
          </h2>
          <p className="mt-2 text-xs leading-6 text-text-secondary">
            {language === 'mm' ? kind.mmIntro : kind.enIntro}
          </p>
          {listing.subtitle && <p className="mt-2 text-xs text-text-muted">{listing.subtitle}</p>}
        </div>

        <aside className="rounded-xl border border-border bg-bg-card p-4">
          {typeof listing.priceUsd === 'number' && (
            <p className="text-lg font-bold text-brand-red">
              {formatPrice(listing.priceUsd)}
              {kind.slug === 'rentals' && (
                <span className="ml-1 text-[10px] font-normal text-text-muted">
                  {t('place_per_day')}
                </span>
              )}
            </p>
          )}
          <button
            type="button"
            onClick={() => toggleFavorite(listing.id, listing.isFavorited)}
            className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold ${
              saved ? 'bg-brand-red text-white' : 'border border-border text-text-primary hover:border-brand-red/50'
            }`}
          >
            <Heart size={14} fill={saved ? 'currentColor' : 'none'} />
            {saved ? t('place_saved') : t('place_save')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/travel-plans')}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-blue px-3 py-2 text-xs font-semibold text-white hover:bg-brand-blueDark"
          >
            {t('place_plan_trip')}
          </button>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 text-base font-medium text-text-primary">
            {t('place_related')}
          </h2>
          <div className="grid grid-cols-2 justify-items-center gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5" style={cardGridStyle(5, 'md')}>
            {related.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
