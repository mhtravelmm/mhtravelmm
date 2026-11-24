import { BookOpen, Clock3, MapPin } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `book_shop_shelf`: the shop is a shelf. Books are the rows, each with
 * a spine-coloured rule down the left, a compact meta line and the price at the
 * end; the shop facts sit in a narrow sidebar that sticks while the shelf
 * scrolls. No card grid, so a long catalog reads like a catalogue.
 */
export function BookShopShelf({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);

  return (
    <div className="mx-auto max-w-4xl lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-4 lg:px-4 lg:py-5">
      <aside className="border-b border-border px-4 py-4 lg:sticky lg:top-4 lg:h-fit lg:self-start lg:rounded-xl lg:border lg:bg-bg-cardAlt">
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.2em] text-link">
          <BookOpen size={11} /> {t('shop_page_kicker')}
        </p>
        <h1 className="mt-1 text-lg font-extrabold leading-6 text-text-primary">{language === 'mm' ? data.nameMm : data.nameEn}</h1>
        <p className="mt-1 flex items-center gap-1 text-[10px] text-text-muted"><MapPin size={10} /> {data.address}</p>
        <p className="flex items-center gap-1 text-[10px] text-text-muted"><Clock3 size={10} /> {data.openTime}–{data.closeTime}</p>
        <p className="mt-1 text-[10px] font-bold text-ratingText">{'★'.repeat(Math.round(rating))} {rating.toFixed(1)}</p>
        <BookingCta data={data} language={language} t={t} className="mt-2 w-full bg-brand-blueDark text-white" />
        <p className="mt-2 break-all text-[10px] text-text-muted">{data.contact.phone}<br />{data.contact.email}</p>
      </aside>

      <main className="min-w-0 px-4 py-4 lg:px-0 lg:py-0">
        <p className="text-[11px] leading-5 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>

        <section className="mt-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-text-primary">{t('shop_page_catalog')}</h2>
          <ul className="mt-2 divide-y divide-border border-y border-border">
            {data.catalog.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3 py-2.5">
                <span aria-hidden="true" className={`h-9 w-1.5 shrink-0 rounded-sm ${['bg-brand-navy', 'bg-brand-blueDark', 'bg-link', 'bg-text-muted'][index % 4]}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-text-primary">{catalogName(item, language)}</p>
                  <p className="text-[10px] text-text-muted">{data.openTime}–{data.closeTime}</p>
                </div>
                <PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-text-primary">{t('shop_page_gallery')}</h2>
          <div className="mt-2 flex gap-1 overflow-x-auto pb-1" tabIndex={0} role="group" aria-label={t('shop_page_gallery')}>
            {data.photos.map((photo) => (
              <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-20 w-28 shrink-0 rounded object-cover" />
            ))}
          </div>
        </section>

        <section className="mt-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-text-primary">{t('shop_page_reviews')}</h2>
          <ul className="mt-2 space-y-2">
            {data.reviews.map((review) => (
              <li key={review.id} className="text-[11px] leading-5 text-text-muted">
                <span className="mr-1 font-bold text-ratingText">{review.rating}/5</span>
                {language === 'mm' ? review.bodyMm : review.bodyEn}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
