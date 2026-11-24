import { Clock3, MapPin, Star, UtensilsCrossed } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `restaurant_menu_board`: a menu, not a listing. Dishes and prices sit
 * on one line joined by a dotted leader, a dark menu header carries the facts,
 * and the booking ask is a table-request strip under the menu. No card grid.
 */
export function RestaurantMenuBoard({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="bg-brand-navy px-5 py-6 text-white">
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-300">
          <UtensilsCrossed size={11} /> {t('shop_page_kicker')}
        </p>
        <h1 className="mt-2 text-2xl font-black leading-8">{language === 'mm' ? data.nameMm : data.nameEn}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300">
          <span className="flex items-center gap-1"><MapPin size={11} /> {data.address}</span>
          <span className="flex items-center gap-1"><Clock3 size={11} /> {data.openTime}–{data.closeTime}</span>
          <span className="flex items-center gap-1"><Star size={11} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)}</span>
        </p>
      </header>

      <p className="px-5 pt-4 text-[11px] leading-5 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>

      <section className="mt-4 px-5">
        <h2 className="border-b-2 border-text-primary pb-1 text-xs font-black uppercase tracking-[0.2em] text-text-primary">
          {t('shop_page_catalog')}
        </h2>
        <ul className="mt-2 space-y-1.5">
          {data.catalog.map((item) => (
            <li key={item.id} className="flex items-baseline gap-2 text-[12px]">
              <span className="font-semibold text-text-primary">{catalogName(item, language)}</span>
              <span aria-hidden="true" className="min-w-4 flex-1 border-b border-dotted border-border" />
              <PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" />
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 px-5">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-text-primary">{t('shop_page_gallery')}</h2>
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1" tabIndex={0} role="group" aria-label={t('shop_page_gallery')}>
          {data.photos.map((photo) => (
            <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-20 w-28 shrink-0 rounded object-cover" />
          ))}
        </div>
      </section>

      <section className="mt-5 px-5">
        <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-text-primary">{t('shop_page_reviews')}</h2>
        <ul className="mt-2 space-y-2">
          {data.reviews.map((review) => (
            <li key={review.id} className="border-l-2 border-link pl-2">
              <p className="text-[10px] font-bold text-ratingText">{'★'.repeat(review.rating)}</p>
              <p className="text-[11px] leading-4 text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 flex flex-wrap items-center justify-between gap-2 bg-bg-cardAlt px-5 py-3">
        <div className="min-w-0 text-[11px] text-text-muted">
          <h2 className="text-xs font-bold text-text-primary">{t('shop_page_contact')}</h2>
          <p className="truncate">{data.contact.phone} · {data.contact.email}</p>
        </div>
        <BookingCta data={data} language={language} t={t} className="bg-brand-blueDark text-white" />
      </section>
    </div>
  );
}
