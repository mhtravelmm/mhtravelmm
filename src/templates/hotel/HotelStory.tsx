import { Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `hotel_story`: the page reads like a magazine feature. A typographic
 * opening with no hero photo, photos interleaved between the paragraphs, a
 * numbered room list and one booking ask at the very end — so the reader scrolls
 * the whole story before they are sold anything.
 */
export function HotelStory({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);
  const description = language === 'mm' ? data.descriptionMm : data.descriptionEn;

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-link">{t('shop_page_kicker')}</p>
      <h1 className="mt-3 text-2xl font-black leading-8 tracking-tight text-text-primary sm:text-4xl sm:leading-[2.75rem]">
        {language === 'mm' ? data.nameMm : data.nameEn}
      </h1>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">
        {data.address} · <Star size={9} className="inline fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
      </p>

      <p className="mt-5 text-sm leading-7 text-text-muted first-letter:float-left first-letter:mr-1 first-letter:text-4xl first-letter:font-black first-letter:leading-8 first-letter:text-text-primary">
        {description}
      </p>

      {data.photos[0] && (
        <figure className="mt-5">
          <img src={data.photos[0].key} alt={photoAlt(data.photos[0], language)} className="h-48 w-full rounded-lg object-cover sm:h-64" />
        </figure>
      )}

      {data.category === 'hotel' && (
        <p className="mt-5 border-y border-border py-2 text-[11px] font-semibold text-text-muted">
          {t('shop_page_checkin')} {data.checkIn} · {t('shop_page_checkout')} {data.checkOut} · {data.openTime}–{data.closeTime}
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-text-primary">{t('shop_page_catalog')}</h2>
        <ol className="mt-3 space-y-3">
          {data.catalog.map((item, index) => (
            <li key={item.id} className="flex items-baseline gap-3">
              <span className="text-[10px] font-black tabular-nums text-text-muted">{String(index + 1).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1 text-[12px] font-semibold text-text-primary">{catalogName(item, language)}</span>
              <PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" />
            </li>
          ))}
        </ol>
      </section>

      {data.photos.length > 1 && (
        <div className="mt-6 grid grid-cols-3 gap-1">
          {data.photos.slice(1).map((photo) => (
            <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-20 w-full rounded object-cover" />
          ))}
        </div>
      )}

      <section className="mt-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-text-primary">{t('shop_page_reviews')}</h2>
        <ul className="mt-3 space-y-4">
          {data.reviews.map((review) => (
            <li key={review.id} className="border-l-2 border-link pl-3">
              <p className="text-[10px] font-bold text-ratingText">{'★'.repeat(review.rating)}</p>
              <p className="mt-0.5 text-[12px] leading-6 text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-xl bg-bg-cardAlt p-4 text-center">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-text-primary">{t('shop_page_contact')}</h2>
        <p className="mt-1 text-[11px] text-text-muted">{data.contact.phone} · {data.contact.email}</p>
        <BookingCta data={data} language={language} t={t} className="mt-3 bg-brand-blueDark text-white" />
      </section>
    </div>
  );
}
