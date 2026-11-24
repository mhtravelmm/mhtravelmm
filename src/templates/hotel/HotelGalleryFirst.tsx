import { Menu, Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt, priceVisible } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `hotel_gallery_first`: the photos lead. A collage hero, an overlay
 * menu, a horizontal catalog carousel and a grid lightbox — the booking bar sits
 * inline under the collage so the page reads as a gallery with an offer.
 */
export function HotelGalleryFirst({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);
  const [lead, ...rest] = data.photos;

  return (
    <div className="mx-auto max-w-4xl pb-8">
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="text-sm font-black tracking-tight text-text-primary">{language === 'mm' ? data.nameMm : data.nameEn}</h1>
        <button type="button" className="rounded-lg border border-border p-1.5 text-text-primary" aria-label={t('shop_page_menu')}>
          <Menu size={16} />
        </button>
      </header>

      <div className="grid grid-cols-2 gap-1 px-1 sm:grid-cols-4">
        {lead && (
          <img
            src={lead.key}
            alt={photoAlt(lead, language)}
            className="col-span-2 h-52 w-full rounded-lg object-cover sm:col-span-2 sm:h-72"
          />
        )}
        {rest.map((photo) => (
          <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-24 w-full rounded-lg object-cover sm:h-[8.5rem]" />
        ))}
      </div>

      <div className="mx-4 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-navy px-3 py-2">
        <div>
          <p className="text-xs font-extrabold text-white">{language === 'mm' ? data.nameMm : data.nameEn}</p>
          <p className="flex items-center gap-1 text-[10px] text-slate-300">
            <Star size={10} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)} · {data.address}
          </p>
        </div>
        <BookingCta data={data} language={language} t={t} className="bg-brand-blueDark text-white" />
      </div>

      <p className="px-4 pt-3 text-xs leading-5 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>

      {data.category === 'hotel' && (
        <p className="px-4 pt-1 text-[11px] text-text-muted">
          {t('shop_page_checkin')} {data.checkIn} · {t('shop_page_checkout')} {data.checkOut} · {data.openTime}–{data.closeTime}
        </p>
      )}

      <section className="mt-4">
        <h2 className="px-4 text-sm font-bold text-text-primary">{t('shop_page_catalog')}</h2>
        <div
          className="mt-2 flex snap-x gap-2 overflow-x-auto px-4 pb-2"
          tabIndex={0}
          role="group"
          aria-label={t('shop_page_catalog')}
        >
          {data.catalog.map((item) => (
            <article key={item.id} className="w-40 shrink-0 snap-start rounded-xl border border-border bg-bg-card p-3">
              <p className="text-[11px] font-bold leading-4 text-text-primary">{catalogName(item, language)}</p>
              <div className="mt-2"><PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" /></div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-4 px-4">
        <h2 className="text-sm font-bold text-text-primary">{t('shop_page_reviews')}</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {data.reviews.map((review) => (
            <div key={review.id} className="rounded-xl bg-bg-cardAlt p-3">
              <p className="text-[11px] font-bold text-ratingText">{'★'.repeat(review.rating)}</p>
              <p className="mt-1 text-[11px] leading-5 text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 px-4 text-[11px] text-text-muted">
        <h2 className="text-sm font-bold text-text-primary">{t('shop_page_contact')}</h2>
        <p>{data.contact.phone}</p>
        <p>{data.contact.email}</p>
        {!priceVisible(data) && <p className="italic">{t('shop_page_price_hidden')}</p>}
      </section>
    </div>
  );
}
