import { formatMmk } from '../lib/moneyFormat';
import type { ShopPageData } from '../lib/shopTemplates';
import { priceVisible, type TemplateProps, type Translate } from './templateHelpers';

/** One shape for the booking CTA, so every template links the same way. */
export function BookingCta({ data, t, className = '' }: TemplateProps & { className?: string }) {
  return (
    <a
      href={data.bookingCta.href}
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-bold ${className}`}
    >
      {data.bookingCta.mode === 'instant' ? t('shop_page_buy_now') : t('shop_page_request_booking')}
    </a>
  );
}

/** The catalog price cell, which every template shows or hides the same way. */
export function PriceCell({ data, amount, t, className = '' }: { data: ShopPageData; amount: number; t: Translate; className?: string }) {
  if (!priceVisible(data)) {
    return <span className={`text-[11px] font-semibold text-text-muted ${className}`}>{t('shop_page_price_hidden')}</span>;
  }
  return <span className={`text-xs font-extrabold ${className}`}>{formatMmk(amount)}</span>;
}
