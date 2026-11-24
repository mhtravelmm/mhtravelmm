import { Clock3, Mail, MapPin, Phone, Star } from 'lucide-react';
import { BookingCta, PriceCell } from '../templateParts';
import { averageRating, catalogName, photoAlt } from '../templateHelpers';
import type { TemplateProps } from '../templateHelpers';

/**
 * Plan §4 `hotel_directory`: the page reads like a directory entry. A sticky
 * index column lists the sections, the content is one narrow column of labelled
 * rows, and there is no hero image at all — the phone number and the address are
 * the most prominent things on the page.
 */
export function HotelDirectory({ data, language, t }: TemplateProps) {
  const rating = averageRating(data.reviews);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="border-b-2 border-text-primary pb-3">
        <h1 className="text-xl font-black uppercase tracking-tight text-text-primary sm:text-2xl">
          {language === 'mm' ? data.nameMm : data.nameEn}
        </h1>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
          {t('shop_page_kicker')} · {rating.toFixed(1)} / 5
        </p>
      </header>

      <dl className="mt-4 divide-y divide-border text-[11px]">
        <div className="flex gap-3 py-2">
          <dt className="w-28 shrink-0 font-bold uppercase tracking-wide text-text-muted">{t('shop_page_contact')}</dt>
          <dd className="min-w-0 space-y-1 text-text-primary">
            <p className="flex items-center gap-1"><Phone size={11} /> {data.contact.phone}</p>
            <p className="flex items-center gap-1 break-all"><Mail size={11} /> {data.contact.email}</p>
            <p className="flex items-center gap-1"><MapPin size={11} /> {data.address}</p>
            <p className="flex items-center gap-1"><Clock3 size={11} /> {data.openTime}–{data.closeTime}</p>
          </dd>
        </div>

        {data.category === 'hotel' && (
          <div className="flex gap-3 py-2">
            <dt className="w-28 shrink-0 font-bold uppercase tracking-wide text-text-muted">{t('shop_page_checkin')}</dt>
            <dd className="text-text-primary">{data.checkIn} — {t('shop_page_checkout')} {data.checkOut}</dd>
          </div>
        )}

        <div className="flex gap-3 py-2">
          <dt className="w-28 shrink-0 font-bold uppercase tracking-wide text-text-muted">{t('shop_page_catalog')}</dt>
          <dd className="min-w-0 flex-1">
            <ul className="space-y-1">
              {data.catalog.map((item) => (
                <li key={item.id} className="flex items-baseline justify-between gap-2 border-b border-dotted border-border pb-1 last:border-0">
                  <span className="text-text-primary">{catalogName(item, language)}</span>
                  <PriceCell data={data} amount={item.priceMmk} t={t} className="text-link" />
                </li>
              ))}
            </ul>
          </dd>
        </div>

        <div className="flex gap-3 py-2">
          <dt className="w-28 shrink-0 font-bold uppercase tracking-wide text-text-muted">{t('shop_page_gallery')}</dt>
          <dd className="flex min-w-0 flex-1 gap-1 overflow-x-auto" tabIndex={0}>
            {data.photos.map((photo) => (
              <img key={photo.key} src={photo.key} alt={photoAlt(photo, language)} className="h-14 w-20 shrink-0 rounded object-cover" />
            ))}
          </dd>
        </div>

        <div className="flex gap-3 py-2">
          <dt className="w-28 shrink-0 font-bold uppercase tracking-wide text-text-muted">{t('shop_page_reviews')}</dt>
          <dd className="min-w-0 flex-1 space-y-2">
            {data.reviews.map((review) => (
              <p key={review.id} className="text-text-muted">
                <Star size={9} className="mr-1 inline fill-amber-400 text-amber-400" />
                {review.rating}/5 — {language === 'mm' ? review.bodyMm : review.bodyEn}
              </p>
            ))}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-[11px] leading-5 text-text-muted">{language === 'mm' ? data.descriptionMm : data.descriptionEn}</p>

      <BookingCta data={data} language={language} t={t} className="mt-4 w-full bg-brand-blueDark text-white" />
    </div>
  );
}
