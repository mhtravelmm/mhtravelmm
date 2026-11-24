import { MapPin, Phone, Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt, priceVisible } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `hotel_classic`: the free baseline. One column, a top bar, one hero
 * photo, a card grid catalog and a booking bar that stays at the foot.
 */
export function HotelClassic({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);
  const hero = data.photos[0];

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <nav className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-sm font-extrabold text-text-primary">{language === 'mm' ? data.nameMm : data.nameEn}</span>
        <span className="flex items-center gap-1 text-[11px] text-text-muted">
          <Star size={11} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
        </span>
      </nav>

      {hero && (
        <div className="relative h-56 w-full overflow-hidden sm:h-72">
          <img src={hero.key} alt={photoAlt(hero, language)} className="h-full w-full object-cover" />
        </div>
      )}

      <section className="space-y-2 px-4 py-4">
        <h1 className="text-xl font-extrabold text-text-primary">{language === 'mm' ? data.nameMm : data.nameEn}</h1>
        <p className="text-xs text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>
        <p className="flex items-center gap-1 text-[11px] text-text-muted"><MapPin size={11} /> {data.address}</p>
        {data.category === 'hotel' && (
          <p className="text-[11px] text-text-muted">
            {t('shop_page_checkin')} {data.checkIn} · {t('shop_page_checkout')} {data.checkOut}
          </p>
        )}
      </section>

      <section className="px-4">
        <h2 className="mb-2 text-sm font-bold text-text-primary">{t('shop_page_catalog')}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.catalog.map((item) => (
            <article key={item.id} className="rounded-lg border border-border bg-bg-card p-3">
              <p className="text-xs font-bold text-text-primary">{catalogName(item, language)}</p>
              <div className="mt-1 flex items-center justify-between">
                <PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-4">
        <h2 className="mb-2 text-sm font-bold text-text-primary">{t('shop_page_gallery')}</h2>
        <div className="columns-2 gap-2 [&>*]:mb-2">
          {data.photos.slice(1).map((photo) => (
            <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="w-full rounded-lg object-cover" />
          ))}
        </div>
      </section>

      <section className="px-4 pb-4">
        <h2 className="mb-2 text-sm font-bold text-text-primary">{t('shop_page_reviews')}</h2>
        <ul className="space-y-2">
          {data.reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-border bg-bg-card p-3">
              <p className="text-[11px] font-bold text-ratingText">{'★'.repeat(review.rating)}</p>
              <p className="mt-1 text-[11px] text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pb-6 text-[11px] text-text-muted">
        <h2 className="mb-1 text-sm font-bold text-text-primary">{t('shop_page_contact')}</h2>
        <p className="flex items-center gap-1"><Phone size={11} /> {data.contact.phone}</p>
        <p>{data.contact.email}</p>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-bg-card/95 px-4 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-xs font-bold text-text-primary">
            {priceVisible(data) ? `${Math.min(...data.catalog.map((item) => item.priceMmk)).toLocaleString('en-US')} Ks` : t('shop_page_price_hidden')}
          </span>
          <BookingCta data={data} language={language} t={t} className="bg-brand-blueDark text-white" />
        </div>
      </div>
    </div>
  );
}
