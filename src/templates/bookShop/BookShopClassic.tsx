import { MapPin, Phone, Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `book_shop_classic`: the free baseline for a book shop. A single
 * column, a shelf-strip hero and a two-column product grid.
 */
export function BookShopClassic({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <header className="border-b border-border px-4 py-2">
        <span className="text-sm font-extrabold text-text-primary">{language === 'mm' ? data.nameMm : data.nameEn}</span>
      </header>

      <div className="flex gap-1 overflow-hidden px-1 pt-1">
        {data.photos.map((photo) => (
          <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-24 w-1/3 rounded object-cover" />
        ))}
      </div>

      <section className="space-y-2 px-4 py-3">
        <h1 className="text-xl font-extrabold text-text-primary">{language === 'mm' ? data.nameMm : data.nameEn}</h1>
        <p className="flex items-center gap-1 text-[11px] text-text-muted"><MapPin size={11} /> {data.address}</p>
        <p className="flex items-center gap-1 text-[11px] text-text-muted"><Star size={11} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)} · {data.openTime}–{data.closeTime}</p>
        <p className="text-xs text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>
      </section>

      <section className="px-4">
        <h2 className="mb-2 text-sm font-bold text-text-primary">{t('shop_page_catalog')}</h2>
        <div className="grid grid-cols-2 gap-2">
          {data.catalog.map((item) => (
            <article key={item.id} className="rounded-lg border border-border bg-bg-card p-3">
              <p className="text-[11px] font-bold leading-4 text-text-primary">{catalogName(item, language)}</p>
              <div className="mt-2"><PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" /></div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-3">
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

      <section className="px-4 pb-4 text-[11px] text-text-muted">
        <h2 className="mb-1 text-sm font-bold text-text-primary">{t('shop_page_contact')}</h2>
        <p className="flex items-center gap-1"><Phone size={11} /> {data.contact.phone}</p>
        <p>{data.contact.email}</p>
        <div className="mt-3"><BookingCta data={data} language={language} t={t} className="bg-brand-blueDark text-white" /></div>
      </section>
    </div>
  );
}
