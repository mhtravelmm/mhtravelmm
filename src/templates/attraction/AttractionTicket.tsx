import { Clock3, MapPin, Ticket } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `attraction_ticket`: the visit is the product. A numbered "what you
 * will see" sequence replaces the catalog grid, opening hours and the ticket
 * price are stated as facts at the top, and the CTA is a single ticket line.
 * Attractions are MH-managed, so this design carries no owner branding.
 */
export function AttractionTicket({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);
  const hero = data.photos[0];

  return (
    <div className="mx-auto max-w-3xl pb-8">
      {hero && (
        <div className="relative">
          <img src={hero.key} alt={photoAlt(hero, language)} className="h-56 w-full object-cover sm:h-72" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <h1 className="text-xl font-black leading-7 text-white sm:text-3xl">{language === 'mm' ? data.nameMm : data.nameEn}</h1>
            <p className="mt-1 flex items-center gap-1 text-[11px] text-white/85"><MapPin size={10} /> {data.address}</p>
          </div>
        </div>
      )}

      <dl className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="px-3 py-2">
          <dt className="text-[9px] font-bold uppercase text-text-muted">{t('shop_page_checkin')}</dt>
          <dd className="flex items-center gap-1 text-[11px] font-extrabold text-text-primary"><Clock3 size={10} /> {data.openTime}</dd>
        </div>
        <div className="px-3 py-2">
          <dt className="text-[9px] font-bold uppercase text-text-muted">{t('shop_page_checkout')}</dt>
          <dd className="text-[11px] font-extrabold text-text-primary">{data.closeTime}</dd>
        </div>
        <div className="px-3 py-2">
          <dt className="text-[9px] font-bold uppercase text-text-muted">{t('shop_page_reviews')}</dt>
          <dd className="text-[11px] font-extrabold text-ratingText">{rating.toFixed(1)} / 5</dd>
        </div>
      </dl>

      <p className="px-4 pt-3 text-[11px] leading-5 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>

      <section className="mt-4 px-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-text-primary">{t('shop_page_catalog')}</h2>
        <ol className="mt-2 space-y-2">
          {data.catalog.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3 border-b border-border pb-2 last:border-0">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-navy text-[10px] font-black text-white">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 text-[11px] font-semibold text-text-primary">{catalogName(item, language)}</span>
              <PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" />
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-4 px-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-text-primary">{t('shop_page_gallery')}</h2>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {data.photos.slice(1).map((photo) => (
            <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-20 w-full rounded object-cover" />
          ))}
        </div>
      </section>

      <section className="mt-4 px-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-text-primary">{t('shop_page_reviews')}</h2>
        <ul className="mt-2 space-y-2">
          {data.reviews.map((review) => (
            <li key={review.id} className="rounded-lg bg-bg-cardAlt p-2.5">
              <p className="text-[10px] font-bold text-ratingText">{'★'.repeat(review.rating)}</p>
              <p className="text-[11px] leading-4 text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-4 mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5">
        <div className="min-w-0 text-[11px] text-text-muted">
          <h2 className="text-xs font-bold text-text-primary">{t('shop_page_contact')}</h2>
          <p className="truncate">{data.contact.phone} · {data.contact.email}</p>
        </div>
        <span className="flex items-center gap-1">
          <Ticket size={12} className="text-link" />
          <BookingCta data={data} language={language} t={t} className="bg-brand-blueDark text-white" />
        </span>
      </section>
    </div>
  );
}
