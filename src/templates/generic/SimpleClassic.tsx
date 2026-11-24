import { Clock3, MapPin, Phone, Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4: the free baseline for restaurant, cafe and attraction. Those
 * categories launch on one free design each (§4 order: hotel first, then the
 * rest), and the shape is the same because their data is the same.
 */
export function SimpleClassic({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);
  const hero = data.photos[0];

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <header className="border-b border-border px-4 py-2">
        <span className="text-sm font-extrabold text-text-primary">{language === 'mm' ? data.nameMm : data.nameEn}</span>
      </header>

      {hero && <img src={hero.key} alt={photoAlt(hero, language)} className="h-48 w-full object-cover sm:h-64" />}

      <section className="space-y-2 px-4 py-3">
        <h1 className="text-xl font-extrabold text-text-primary">{language === 'mm' ? data.nameMm : data.nameEn}</h1>
        <p className="flex items-center gap-1 text-[11px] text-text-muted"><MapPin size={11} /> {data.address}</p>
        <p className="flex items-center gap-1 text-[11px] text-text-muted">
          <Clock3 size={11} /> {data.openTime}–{data.closeTime}
          <Star size={11} className="ml-2 fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
        </p>
        <p className="text-xs leading-5 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>
      </section>

      <section className="px-4">
        <h2 className="mb-2 text-sm font-bold text-text-primary">{t('shop_page_catalog')}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {data.catalog.map((item) => (
            <article key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-bg-card p-3">
              <p className="text-[11px] font-bold text-text-primary">{catalogName(item, language)}</p>
              <PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" />
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-3">
        <h2 className="mb-2 text-sm font-bold text-text-primary">{t('shop_page_gallery')}</h2>
        <div className="grid grid-cols-3 gap-1">
          {data.photos.slice(1).map((photo) => (
            <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-20 w-full rounded object-cover" />
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

      <section className="px-4 pb-4 text-[11px] text-text-muted">
        <h2 className="mb-1 text-sm font-bold text-text-primary">{t('shop_page_contact')}</h2>
        <p className="flex items-center gap-1"><Phone size={11} /> {data.contact.phone}</p>
        <p>{data.contact.email}</p>
        <div className="mt-3"><BookingCta data={data} language={language} t={t} className="bg-brand-blueDark text-white" /></div>
      </section>
    </div>
  );
}
