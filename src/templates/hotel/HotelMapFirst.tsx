import { MapPin, Phone, Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `hotel_map_first`: the location is the pitch. A sticky map card leads
 * the page, the sidebar holds contact and hours, and the catalog is a plain
 * definition list — the shape a city hotel uses when guests pick by address.
 */
export function HotelMapFirst({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);
  const hero = data.photos[0];

  return (
    <div className="mx-auto grid max-w-5xl gap-3 px-3 py-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <main className="min-w-0 space-y-3">
        <section className="relative overflow-hidden rounded-2xl border border-border">
          {hero && <img src={hero.key} alt={photoAlt(hero, language)} className="h-40 w-full object-cover sm:h-56" />}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3">
            <h1 className="text-base font-extrabold leading-6 text-white sm:text-xl">
              {language === 'mm' ? data.nameMm : data.nameEn}
            </h1>
            <p className="flex items-center gap-1 text-[10px] text-white/85">
              <MapPin size={10} /> {data.address}
            </p>
          </div>
        </section>

        <p className="text-[11px] leading-5 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>

        <section>
          <h2 className="text-sm font-bold text-text-primary">{t('shop_page_catalog')}</h2>
          <dl className="mt-2 divide-y divide-border rounded-xl border border-border">
            {data.catalog.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <dt className="text-[11px] font-semibold text-text-primary">{catalogName(item, language)}</dt>
                <dd><PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" /></dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h2 className="text-sm font-bold text-text-primary">{t('shop_page_reviews')}</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {data.reviews.map((review) => (
              <div key={review.id} className="rounded-xl bg-bg-cardAlt p-3">
                <p className="text-[11px] font-bold text-ratingText">{'★'.repeat(review.rating)}</p>
                <p className="mt-1 text-[11px] leading-5 text-text-muted">{language === 'mm' ? review.bodyMm : review.bodyEn}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <aside className="space-y-2 lg:sticky lg:top-3 lg:self-start">
        <div className="rounded-xl border border-border p-3">
          <p className="flex items-center gap-1 text-[11px] font-bold text-ratingText">
            <Star size={11} className="fill-amber-400 text-amber-400" /> {rating.toFixed(1)}
          </p>
          {data.category === 'hotel' && (
            <p className="mt-1 text-[10px] text-text-muted">
              {t('shop_page_checkin')} {data.checkIn} · {t('shop_page_checkout')} {data.checkOut}
            </p>
          )}
          <p className="text-[10px] text-text-muted">{data.openTime}–{data.closeTime}</p>
          <BookingCta data={data} language={language} t={t} className="mt-2 w-full bg-brand-blueDark text-white" />
        </div>

        <div className="rounded-xl border border-border p-3 text-[11px] text-text-muted">
          <h2 className="text-xs font-bold text-text-primary">{t('shop_page_contact')}</h2>
          <p className="mt-1 flex items-center gap-1"><Phone size={10} /> {data.contact.phone}</p>
          <p className="break-all">{data.contact.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-1">
          {data.photos.slice(1).map((photo) => (
            <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-16 w-full rounded object-cover" />
          ))}
        </div>
      </aside>
    </div>
  );
}
