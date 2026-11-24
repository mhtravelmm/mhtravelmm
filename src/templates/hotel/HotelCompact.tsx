import { Grid2x2, Home, MapPin, Phone, Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt, priceVisible } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `hotel_compact`: a two-column page with a bottom tab bar, a split
 * hero, a price table catalog and a floating booking button — the app shape.
 * The tab bar is the navigation, so the page has no top nav at all.
 */
export function HotelCompact({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);
  const hero = data.photos[0];
  const cheapest = Math.min(...data.catalog.map((item) => item.priceMmk));

  return (
    <div className="mx-auto max-w-2xl pb-28">
      <header className="grid grid-cols-2 items-stretch gap-2 p-3">
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-link">{t('shop_page_kicker')}</p>
          <h1 className="text-lg font-extrabold leading-6 text-text-primary">{language === 'mm' ? data.nameMm : data.nameEn}</h1>
          <p className="flex items-center gap-1 text-[10px] text-text-muted"><MapPin size={10} /> {data.address}</p>
          <p className="flex items-center gap-1 text-[11px] font-bold text-ratingText">
            <Star size={11} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
          </p>
        </div>
        {hero && (
          <img src={hero.key} alt={photoAlt(hero, language)} className="h-32 w-full rounded-xl object-cover" />
        )}
      </header>

      <p className="px-3 text-[11px] leading-5 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>

      {data.category === 'hotel' && (
        <div className="mx-3 mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-bg-cardAlt p-2">
            <p className="text-[9px] font-bold uppercase text-text-muted">{t('shop_page_checkin')}</p>
            <p className="text-xs font-extrabold text-text-primary">{data.checkIn}</p>
          </div>
          <div className="rounded-lg bg-bg-cardAlt p-2">
            <p className="text-[9px] font-bold uppercase text-text-muted">{t('shop_page_checkout')}</p>
            <p className="text-xs font-extrabold text-text-primary">{data.checkOut}</p>
          </div>
        </div>
      )}

      <section className="mt-3 px-3">
        <h2 className="mb-1.5 text-xs font-bold text-text-primary">{t('shop_page_catalog')}</h2>
        <table className="w-full border-collapse overflow-hidden rounded-lg text-left text-[11px]">
          <thead className="bg-bg-cardAlt text-text-muted">
            <tr>
              <th className="px-2 py-1.5 font-semibold">{t('shop_page_item')}</th>
              <th className="px-2 py-1.5 text-right font-semibold">{t('shop_page_price')}</th>
            </tr>
          </thead>
          <tbody>
            {data.catalog.map((item) => (
              <tr key={item.id} className="border-t border-border">
                <td className="px-2 py-1.5 font-semibold text-text-primary">{catalogName(item, language)}</td>
                <td className="px-2 py-1.5 text-right"><PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-3 px-3">
        <h2 className="mb-1.5 text-xs font-bold text-text-primary">{t('shop_page_gallery')}</h2>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {data.photos.slice(1).map((photo) => (
            <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-16 w-24 shrink-0 rounded object-cover" />
          ))}
        </div>
      </section>

      <section className="mt-3 px-3">
        <h2 className="mb-1.5 text-xs font-bold text-text-primary">{t('shop_page_reviews')}</h2>
        <ul className="space-y-1.5">
          {data.reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-border p-2">
              <p className="text-[10px] font-bold text-ratingText">{'★'.repeat(review.rating)}</p>
              <p className="text-[11px] leading-4 text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-3 px-3 pb-4 text-[11px] text-text-muted">
        <h2 className="mb-1 text-xs font-bold text-text-primary">{t('shop_page_contact')}</h2>
        <p className="flex items-center gap-1"><Phone size={10} /> {data.contact.phone}</p>
        <p>{data.contact.email}</p>
      </section>

      <BookingCta
        data={data}
        language={language}
        t={t}
        className="fixed bottom-20 right-4 z-20 bg-brand-blueDark px-4 py-3 text-white shadow-lg"
      />

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t border-border bg-bg-card/95 backdrop-blur">
        <a href="#top" className="flex flex-col items-center gap-0.5 py-2 text-[9px] font-bold text-link">
          <Home size={15} /> {t('shop_page_tab_home')}
        </a>
        <a href="#catalog" className="flex flex-col items-center gap-0.5 py-2 text-[9px] font-bold text-text-muted">
          <Grid2x2 size={15} /> {t('shop_page_catalog')}
        </a>
        <a href={`tel:${data.contact.phone.replace(/\s/g, '')}`} className="flex flex-col items-center gap-0.5 py-2 text-[9px] font-bold text-text-muted">
          <Phone size={15} /> {t('shop_page_tab_call')}
        </a>
      </nav>
      <p className="sr-only">{priceVisible(data) ? cheapest : ''}</p>
    </div>
  );
}
