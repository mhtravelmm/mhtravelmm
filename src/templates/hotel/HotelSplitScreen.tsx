import { ChevronDown, MapPin, Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `hotel_split_screen`: the page is one fixed frame. An icon rail on the
 * left, a half-screen image that never scrolls away on the right, and the
 * catalog as an accordion so a room is opened rather than scrolled past. The
 * booking ask sits in the header, which is always visible.
 */
export function HotelSplitScreen({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);
  const hero = data.photos[0];
  const name = language === 'mm' ? data.nameMm : data.nameEn;

  return (
    <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[64px_minmax(0,1fr)_320px]">
      <nav className="flex gap-1 overflow-x-auto border-b border-border p-2 lg:flex-col lg:border-b-0 lg:border-r" aria-label={t('shop_page_kicker')} tabIndex={0}>
        {[t('shop_page_catalog'), t('shop_page_gallery'), t('shop_page_reviews'), t('shop_page_contact')].map((label, index) => (
          <span
            key={label}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-[9px] font-black ${
              index === 0 ? 'bg-brand-blueDark text-white' : 'bg-bg-cardAlt text-text-muted'
            }`}
            title={label}
          >
            {label.slice(0, 2)}
          </span>
        ))}
      </nav>

      <div className="min-w-0">
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h1 className="truncate text-base font-extrabold text-text-primary">{name}</h1>
            <p className="flex items-center gap-1 text-[10px] text-text-muted">
              <MapPin size={10} /> {data.address}
            </p>
          </div>
          <BookingCta data={data} language={language} t={t} className="shrink-0 bg-brand-blueDark text-white" />
        </header>

        <section className="space-y-1 p-4">
          <p className="text-[11px] leading-5 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>
          <p className="flex items-center gap-1 text-[11px] font-bold text-ratingText">
            <Star size={11} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
            {data.category === 'hotel' && <span className="font-normal text-text-muted">· {data.checkIn}–{data.checkOut}</span>}
          </p>
        </section>

        <section className="px-4 pb-4">
          <h2 className="mb-2 text-xs font-bold text-text-primary">{t('shop_page_catalog')}</h2>
          <div className="divide-y divide-border rounded-xl border border-border">
            {data.catalog.map((item) => (
              <details key={item.id} className="group px-3 py-2">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-text-primary">{catalogName(item, language)}</span>
                  <span className="flex items-center gap-2">
                    <PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" />
                    <ChevronDown size={13} className="text-text-muted group-open:rotate-180" />
                  </span>
                </summary>
                <p className="mt-1 text-[10px] leading-4 text-text-muted">{data.openTime}–{data.closeTime}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="px-4 pb-4">
          <h2 className="mb-2 text-xs font-bold text-text-primary">{t('shop_page_reviews')}</h2>
          <ul className="space-y-2">
            {data.reviews.map((review) => (
              <li key={review.id} className="rounded-lg bg-bg-cardAlt p-2">
                <p className="text-[10px] font-bold text-ratingText">{'★'.repeat(review.rating)}</p>
                <p className="text-[11px] leading-4 text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="px-4 pb-6 text-[11px] text-text-muted">
          <h2 className="mb-1 text-xs font-bold text-text-primary">{t('shop_page_contact')}</h2>
          <p>{data.contact.phone}</p>
          <p className="break-all">{data.contact.email}</p>
        </section>
      </div>

      <aside className="hidden lg:block lg:sticky lg:top-0 lg:h-screen">
        {hero && <img src={hero.key} alt={photoAlt(hero, language)} className="h-full w-full object-cover" />}
      </aside>

      <section className="px-4 pb-6 lg:hidden">
        <h2 className="mb-2 text-xs font-bold text-text-primary">{t('shop_page_gallery')}</h2>
        <div className="flex gap-1 overflow-x-auto pb-1" tabIndex={0} role="group" aria-label={t('shop_page_gallery')}>
          {data.photos.slice(1).map((photo) => (
            <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-16 w-24 shrink-0 rounded object-cover" />
          ))}
        </div>
      </section>
    </div>
  );
}
