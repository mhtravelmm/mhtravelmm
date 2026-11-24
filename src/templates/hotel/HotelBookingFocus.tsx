import { CalendarCheck, Phone, Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `hotel_booking_focus`: the booking is the page. A segmented tab bar
 * replaces the nav, the stay panel sits above the fold, and every room is its
 * own bookable card — the shape a hotel uses when the room is the product.
 */
export function HotelBookingFocus({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);

  return (
    <div className="mx-auto max-w-3xl">
      <nav
        className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2"
        aria-label={t('shop_page_kicker')}
        tabIndex={0}
      >
        {[t('shop_page_catalog'), t('shop_page_gallery'), t('shop_page_reviews'), t('shop_page_contact')].map((label, index) => (
          <span
            key={label}
            className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold ${
              index === 0 ? 'bg-brand-blueDark text-white' : 'bg-bg-cardAlt text-text-muted'
            }`}
          >
            {label}
          </span>
        ))}
      </nav>

      <header className="px-4 pt-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-link">{t('shop_page_kicker')}</p>
        <h1 className="mt-1 text-xl font-extrabold leading-7 text-text-primary">
          {language === 'mm' ? data.nameMm : data.nameEn}
        </h1>
        <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-ratingText">
          <Star size={11} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)} · {data.address}
        </p>
      </header>

      <section className="mx-4 mt-3 rounded-xl border border-border bg-bg-cardAlt p-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase text-text-muted">{t('shop_page_checkin')}</p>
            <p className="text-sm font-extrabold text-text-primary">{data.checkIn}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase text-text-muted">{t('shop_page_checkout')}</p>
            <p className="text-sm font-extrabold text-text-primary">{data.checkOut}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1 text-[10px] text-text-muted">
            <CalendarCheck size={11} /> {data.openTime}–{data.closeTime}
          </p>
          <BookingCta data={data} language={language} t={t} className="bg-brand-blueDark text-white" />
        </div>
      </section>

      <p className="px-4 pt-3 text-[11px] leading-5 text-text-muted">
        {language === 'mm' ? data.descriptionMm : data.descriptionEn}
      </p>

      <section className="mt-4 px-4">
        <h2 className="text-sm font-bold text-text-primary">{t('shop_page_catalog')}</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {data.catalog.map((item) => (
            <article key={item.id} className="rounded-xl border border-border p-3">
              <p className="text-[11px] font-bold leading-4 text-text-primary">{catalogName(item, language)}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" />
                <BookingCta data={data} language={language} t={t} className="bg-bg-cardAlt px-2 py-1 text-text-primary" />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-4">
        <h2 className="px-4 text-sm font-bold text-text-primary">{t('shop_page_gallery')}</h2>
        <div className="mt-2 flex snap-x gap-2 overflow-x-auto px-4 pb-2" tabIndex={0} role="group" aria-label={t('shop_page_gallery')}>
          {data.photos.map((photo) => (
            <img
              key={photo.key}
              src={photo.key}
              alt={photoAlt(photo, language)}
              className="h-32 w-44 shrink-0 snap-start rounded-lg object-cover"
            />
          ))}
        </div>
      </section>

      <section className="mt-4 px-4">
        <h2 className="text-sm font-bold text-text-primary">{t('shop_page_reviews')}</h2>
        <ul className="mt-2 space-y-2">
          {data.reviews.map((review) => (
            <li key={review.id} className="rounded-xl border border-border p-3">
              <p className="text-[11px] font-bold text-ratingText">{'★'.repeat(review.rating)}</p>
              <p className="mt-1 text-[11px] leading-5 text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 px-4 pb-6 text-[11px] text-text-muted">
        <h2 className="text-sm font-bold text-text-primary">{t('shop_page_contact')}</h2>
        <p className="mt-1 flex items-center gap-1"><Phone size={11} /> {data.contact.phone}</p>
        <p>{data.contact.email}</p>
      </section>
    </div>
  );
}
