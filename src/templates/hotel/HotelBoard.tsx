import { Clock3, MapPin, Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `hotel_board`: the page is a noticeboard. A dark masthead with the
 * name set large, then every section as a bordered tile on a grid — hours,
 * rooms, photos, reviews and contact each get their own card, and the booking
 * ask is a full-width strip between the rooms and the reviews.
 */
export function HotelBoard({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);
  const hero = data.photos[0];

  return (
    <div className="mx-auto max-w-4xl bg-bg-cardAlt pb-8">
      <header className="bg-brand-navy px-5 py-6 text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-300">{t('shop_page_kicker')}</p>
        <h1 className="mt-2 text-2xl font-black leading-8 sm:text-3xl">{language === 'mm' ? data.nameMm : data.nameEn}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300">
          <span className="flex items-center gap-1"><MapPin size={11} /> {data.address}</span>
          <span className="flex items-center gap-1"><Star size={11} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)}</span>
          <span className="flex items-center gap-1"><Clock3 size={11} /> {data.openTime}–{data.closeTime}</span>
        </p>
      </header>

      {hero && <img src={hero.key} alt={photoAlt(hero, language)} className="h-40 w-full object-cover sm:h-56" />}

      <div className="grid gap-3 p-3 sm:grid-cols-2">
        <section className="rounded-xl bg-bg-card p-3 sm:col-span-2">
          <p className="text-[11px] leading-5 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>
          {data.category === 'hotel' && (
            <p className="mt-2 text-[11px] font-semibold text-text-primary">
              {t('shop_page_checkin')} {data.checkIn} · {t('shop_page_checkout')} {data.checkOut}
            </p>
          )}
        </section>

        <section className="rounded-xl bg-bg-card p-3 sm:col-span-2">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-text-primary">{t('shop_page_catalog')}</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {data.catalog.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2 py-1.5">
                <span className="min-w-0 truncate text-[11px] font-semibold text-text-primary">{catalogName(item, language)}</span>
                <PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" />
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl bg-bg-card p-3">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-text-primary">{t('shop_page_gallery')}</h2>
          <div className="grid grid-cols-2 gap-1">
            {data.photos.map((photo) => (
              <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-20 w-full rounded object-cover" />
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-bg-card p-3">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-text-primary">{t('shop_page_reviews')}</h2>
          <ul className="space-y-2">
            {data.reviews.map((review) => (
              <li key={review.id}>
                <p className="text-[10px] font-bold text-ratingText">{'★'.repeat(review.rating)}</p>
                <p className="text-[11px] leading-4 text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mx-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-blueDark px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-extrabold text-white">{language === 'mm' ? data.nameMm : data.nameEn}</p>
          <p className="truncate text-[10px] text-white">{data.contact.phone} · {data.contact.email}</p>
        </div>
        <BookingCta data={data} language={language} t={t} className="bg-white text-brand-blueDark" />
      </div>
    </div>
  );
}
