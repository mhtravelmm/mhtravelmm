import { MapPin, Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt, priceVisible } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `hotel_editorial`: two text columns with a side rail, a full-bleed
 * hero, a long list catalog and the booking CTA inline in the copy — the
 * magazine shape, not the shop shape.
 */
export function HotelEditorial({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);
  const hero = data.photos[0];
  const name = language === 'mm' ? data.nameMm : data.nameEn;

  return (
    <div className="mx-auto flex max-w-5xl gap-4 px-4 py-4">
      <aside className="hidden w-44 shrink-0 sm:block">
        <div className="sticky top-20 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-link">{t('shop_page_kicker')}</p>
          <p className="text-sm font-extrabold leading-5 text-text-primary">{name}</p>
          <ul className="space-y-1 border-l-2 border-border pl-2 text-[11px] text-text-muted">
            <li><a href="#catalog" className="hover:text-link">{t('shop_page_catalog')}</a></li>
            <li><a href="#gallery" className="hover:text-link">{t('shop_page_gallery')}</a></li>
            <li><a href="#reviews" className="hover:text-link">{t('shop_page_reviews')}</a></li>
            <li><a href="#contact" className="hover:text-link">{t('shop_page_contact')}</a></li>
          </ul>
          <p className="flex items-center gap-1 text-[11px] font-bold text-ratingText">
            <Star size={11} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)} · {data.reviews.length}
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {hero && (
          <div className="-mx-4 h-64 w-[calc(100%+2rem)] overflow-hidden sm:h-80">
            <img src={hero.key} alt={photoAlt(hero, language)} className="h-full w-full object-cover" />
          </div>
        )}

        <article className="mt-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-link">{t('shop_page_kicker')}</p>
          <h1 className="text-2xl font-black leading-8 text-text-primary">{name}</h1>
          <p className="flex items-center gap-1 text-[11px] text-text-muted"><MapPin size={11} /> {data.address}</p>
          <p className="text-sm leading-6 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>
          {data.category === 'hotel' && (
            <p className="border-y border-border py-2 text-[11px] text-text-muted">
              {t('shop_page_checkin')} {data.checkIn} · {t('shop_page_checkout')} {data.checkOut}
            </p>
          )}
          <BookingCta data={data} language={language} t={t} className="bg-brand-navy text-white" />
        </article>

        <section id="catalog" className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-text-primary">{t('shop_page_catalog')}</h2>
          <ul className="divide-y divide-border">
            {data.catalog.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-3 py-2">
                <span className="text-xs font-semibold text-text-primary">{catalogName(item, language)}</span>
                <PriceCell data={data} amount={item.priceMmk} t={t} className="shrink-0 text-link" />
              </li>
            ))}
          </ul>
        </section>

        <section id="gallery" className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-text-primary">{t('shop_page_gallery')}</h2>
          <div
            className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2"
            tabIndex={0}
            role="group"
            aria-label={t('shop_page_gallery')}
          >
            {data.photos.slice(1).map((photo) => (
              <img
                key={photo.key}
                src={photo.key}
                alt={photoAlt(photo, language)}
                className="h-36 w-56 shrink-0 snap-start rounded-lg object-cover"
              />
            ))}
          </div>
        </section>

        <section id="reviews" className="mt-6">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-text-primary">{t('shop_page_reviews')}</h2>
          <ul className="space-y-2">
            {data.reviews.map((review) => (
              <li key={review.id} className="border-l-2 border-brand-blueDark pl-2">
                <p className="text-[11px] font-bold text-ratingText">{'★'.repeat(review.rating)}</p>
                <p className="text-[11px] leading-5 text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="contact" className="mt-6 border-t border-border pt-3 text-[11px] text-text-muted">
          <h2 className="mb-1 text-sm font-bold text-text-primary">{t('shop_page_contact')}</h2>
          <p>{data.contact.phone}</p>
          <p>{data.contact.email}</p>
          {!priceVisible(data) && <p className="mt-1 italic">{t('shop_page_price_hidden')}</p>}
        </section>
      </div>
    </div>
  );
}
