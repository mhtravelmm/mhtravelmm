import { Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `hotel_panorama`: the hero takes the whole first screen and the name
 * sits on the photo. Navigation is an underlined tab row, rooms are a
 * side-by-side comparison matrix rather than a list, and the booking ask is a
 * bar pinned to the bottom of the viewport.
 */
export function HotelPanorama({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);
  const hero = data.photos[0];
  const cheapest = data.catalog.length ? Math.min(...data.catalog.map((item) => item.priceMmk)) : 0;

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <section className="relative">
        {hero && <img src={hero.key} alt={photoAlt(hero, language)} className="h-64 w-full object-cover sm:h-96" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <h1 className="text-2xl font-black leading-8 text-white sm:text-4xl sm:leading-[3rem]">
            {language === 'mm' ? data.nameMm : data.nameEn}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-[11px] text-white/85">
            <Star size={11} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
            <span>·</span>
            {data.address}
          </p>
        </div>
      </section>

      <nav className="flex gap-5 overflow-x-auto border-b border-border px-5" aria-label={t('shop_page_kicker')} tabIndex={0}>
        {[t('shop_page_catalog'), t('shop_page_gallery'), t('shop_page_reviews'), t('shop_page_contact')].map((label, index) => (
          <span
            key={label}
            className={`shrink-0 border-b-2 py-2.5 text-[11px] font-bold ${
              index === 0 ? 'border-link text-link' : 'border-transparent text-text-muted'
            }`}
          >
            {label}
          </span>
        ))}
      </nav>

      <p className="px-5 pt-4 text-xs leading-6 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>

      {data.category === 'hotel' && (
        <p className="px-5 pt-2 text-[11px] text-text-muted">
          {t('shop_page_checkin')} {data.checkIn} · {t('shop_page_checkout')} {data.checkOut} · {data.openTime}–{data.closeTime}
        </p>
      )}

      <section className="mt-4 px-5">
        <h2 className="text-sm font-bold text-text-primary">{t('shop_page_catalog')}</h2>
        <div className="mt-2 overflow-x-auto" tabIndex={0}>
          <table className="w-full min-w-[28rem] border-collapse text-left text-[11px]">
            <thead>
              <tr className="border-y border-border text-text-muted">
                <th className="py-2 pr-3 font-semibold">{t('shop_page_item')}</th>
                <th className="py-2 pr-3 font-semibold">{t('shop_page_price')}</th>
                <th className="py-2 font-semibold">{t('shop_page_checkin')}</th>
              </tr>
            </thead>
            <tbody>
              {data.catalog.map((item) => (
                <tr key={item.id} className="border-b border-border">
                  <td className="py-2 pr-3 font-semibold text-text-primary">{catalogName(item, language)}</td>
                  <td className="py-2 pr-3"><PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" /></td>
                  <td className="py-2 text-text-muted">{data.checkIn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5">
        <h2 className="px-5 text-sm font-bold text-text-primary">{t('shop_page_gallery')}</h2>
        <div className="mt-2 flex snap-x gap-0 overflow-x-auto" tabIndex={0} role="group" aria-label={t('shop_page_gallery')}>
          {data.photos.slice(1).map((photo) => (
            <img
              key={photo.key}
              src={photo.key}
              alt={photoAlt(photo, language)}
              className="h-44 w-64 shrink-0 snap-start object-cover sm:h-56 sm:w-80"
            />
          ))}
        </div>
      </section>

      <section className="mt-5 px-5">
        <h2 className="text-sm font-bold text-text-primary">{t('shop_page_reviews')}</h2>
        <ul className="mt-2 space-y-3">
          {data.reviews.map((review) => (
            <li key={review.id} className="flex gap-3">
              <span className="mt-0.5 text-[10px] font-black text-ratingText">{review.rating}.0</span>
              <p className="text-[11px] leading-5 text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 px-5 text-[11px] text-text-muted">
        <h2 className="text-sm font-bold text-text-primary">{t('shop_page_contact')}</h2>
        <p className="mt-1">{data.contact.phone}</p>
        <p>{data.contact.email}</p>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-bg-card/95 px-4 py-2.5 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <PriceCell data={data} amount={cheapest} t={t} className="text-link" />
          <BookingCta data={data} language={language} t={t} className="bg-brand-blueDark text-white" />
        </div>
      </div>
    </div>
  );
}
