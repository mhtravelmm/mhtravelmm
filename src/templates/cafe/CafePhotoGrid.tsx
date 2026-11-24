import { Coffee, MapPin, Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `cafe_photo_grid`: the room sells the coffee. A tiled photo wall fills
 * the first screen, the menu is a compact two-column chip grid underneath, and
 * the CTA is a single quiet line at the end rather than a button in the hero.
 */
export function CafePhotoGrid({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);
  const [lead, ...rest] = data.photos;

  return (
    <div className="mx-auto max-w-3xl pb-6">
      <div className="grid grid-cols-3 gap-0.5">
        {lead && <img src={lead.key} alt={photoAlt(lead, language)} className="col-span-2 h-40 w-full object-cover sm:h-64" />}
        <div className="grid grid-rows-2 gap-0.5">
          {rest.slice(0, 2).map((photo) => (
            <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-[4.94rem] w-full object-cover sm:h-[7.94rem]" />
          ))}
        </div>
      </div>

      <header className="px-4 pt-4">
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-link">
          <Coffee size={11} /> {t('shop_page_kicker')}
        </p>
        <h1 className="mt-1 text-xl font-extrabold text-text-primary">{language === 'mm' ? data.nameMm : data.nameEn}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-text-muted">
          <span className="flex items-center gap-1"><MapPin size={10} /> {data.address}</span>
          <span>{data.openTime}–{data.closeTime}</span>
          <span className="flex items-center gap-1 font-bold text-ratingText">
            <Star size={10} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
          </span>
        </p>
      </header>

      <p className="px-4 pt-2 text-[11px] leading-5 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>

      <section className="mt-4 px-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-text-primary">{t('shop_page_catalog')}</h2>
        <ul className="mt-2 grid grid-cols-2 gap-1.5">
          {data.catalog.map((item) => (
            <li key={item.id} className="rounded-lg bg-bg-cardAlt px-2.5 py-2">
              <p className="text-[11px] font-semibold leading-4 text-text-primary">{catalogName(item, language)}</p>
              <PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 px-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-text-primary">{t('shop_page_reviews')}</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {data.reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-border p-2.5">
              <p className="text-[10px] font-bold text-ratingText">{'★'.repeat(review.rating)}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 flex flex-wrap items-center justify-between gap-2 px-4 text-[11px] text-text-muted">
        <p>{data.contact.phone} · {data.contact.email}</p>
        <BookingCta data={data} language={language} t={t} className="text-link" />
      </section>
    </div>
  );
}
