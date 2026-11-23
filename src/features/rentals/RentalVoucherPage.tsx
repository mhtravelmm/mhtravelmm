import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Clock, Printer, X } from 'lucide-react';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { useCurrency } from '../../lib/currency';
import { useRentalCatalog } from '../../lib/rentalCatalogStore';
import { findRentalType, findVariant, localized } from '../../data/rentalCatalog';
import { extrasTotalUsd, findOrderByCode, orderTotalUsd, paymentTimeLeft, useRentalOrders, type RentalOrder } from '../../lib/rentalOrders';
import { useAuth } from '../../lib/auth';

/**
 * Plan §8.6: the voucher is the 17 fields of Plan §6, printable, with a QR code
 * that encodes the request code. Staff open the same page to print it, so this
 * is one component rather than two.
 */
const STATUS_KEY = {
  requested: 'rv_status_requested',
  accepted: 'rv_status_accepted',
  paid: 'rv_status_paid',
  completed: 'rv_status_completed',
  expired: 'rv_status_expired',
  cancelled: 'rv_status_cancelled',
} as const;

const PAYMENT_KEY = {
  cash: 'rv_payment_cash',
  bank_transfer: 'rv_payment_bank_transfer',
  mobile_wallet: 'rv_payment_mobile_wallet',
} as const;

const RESCHEDULE_KEY: Record<string, TranslationKey> = {
  reschedule_not_paid: 'rv_reschedule_not_paid',
  reschedule_too_late: 'rv_reschedule_too_late',
  reschedule_too_soon: 'rv_reschedule_too_soon',
  reschedule_unchanged: 'rv_reschedule_unchanged',
  reschedule_limit: 'rv_reschedule_limit',
  order_missing: 'rv_not_found',
};

function formatDateTime(value: string, language: 'mm' | 'en'): string {
  const date = new Date(value);
  return date.toLocaleString(language === 'mm' ? 'my-MM' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function RentalVoucherPage() {
  const { requestCode = '' } = useParams<{ requestCode: string }>();
  const { language, t } = useLanguage();
  const { formatPrice, currency, exchangeRate } = useCurrency();
  const { allOrders, orders, expireOverdue, reschedule } = useRentalOrders();
  const { catalog } = useRentalCatalog();
  const { user } = useAuth();
  const [qr, setQr] = useState<string | null>(null);
  const [nextStart, setNextStart] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState<TranslationKey | null>(null);

  useEffect(() => {
    expireOverdue();
  }, [expireOverdue]);

  // Staff and the traveler both land here; a traveler sees only their own order.
  const order: RentalOrder | undefined = useMemo(
    () => findOrderByCode(allOrders, requestCode) ?? findOrderByCode(orders, requestCode),
    [allOrders, orders, requestCode],
  );

  useEffect(() => {
    if (!order) return;
    let active = true;
    // Loaded on demand: only the voucher page needs the QR encoder.
    void import('qrcode').then(({ default: QRCode }) =>
      QRCode.toDataURL(order.requestCode, { margin: 1, width: 160 }).then((url) => {
        if (active) setQr(url);
      }),
    );
    return () => {
      active = false;
    };
  }, [order]);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl py-10 text-center">
        <p className="text-sm text-text-muted">{t('rv_not_found')}</p>
        <Link to="/account" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-link">
          <ArrowLeft size={13} /> {t('rv_back_to_account')}
        </Link>
      </div>
    );
  }

  const type = findRentalType(catalog, order.categoryId);
  const variant = findVariant(type, order.variantId);
  const city = catalog.cities.find((item) => item.id === order.cityId);
  const branch = city?.branches.find((item) => item.id === order.branchId);
  const itemLabel = [type ? localized(type.label, language) : order.categoryId, variant ? localized(variant.label, language) : null]
    .filter(Boolean)
    .join(' · ');
  const deadlineLeft = paymentTimeLeft(order.paymentDeadline, new Date());
  const deadlineHours = Math.floor(deadlineLeft / 3600000);
  const deadlineMinutes = Math.floor((deadlineLeft % 3600000) / 60000);
  const extrasUsd = extrasTotalUsd(order);
  const dueUsd = orderTotalUsd(order);
  const mmkTotal = Math.round((dueUsd * order.fxMmkPerUsd) / 100) * 100;

  const rows: { label: string; value: string }[] = [
    {
      label: t('rv_business'),
      value: branch
        ? `MH Travel Rental — ${localized(branch.name, language)}${branch.address ? `, ${branch.address}` : ''}`
        : 'MH Travel Rental',
    },
    { label: t('rv_city'), value: city ? localized(city.name, language) : order.cityId },
    { label: t('rv_dates'), value: `${order.startDate} → ${order.endDate}` },
    { label: t('rv_days'), value: `${order.days} ${t('rentals_day_count')}` },
    { label: t('rv_item'), value: itemLabel },
    { label: t('rv_participants'), value: String(order.participants) },
    { label: t('rv_customer'), value: order.customerName },
    { label: t('rv_phone'), value: branch?.phone ? `${order.phone} · ${branch.phone}` : order.phone },
    {
      label: t('rv_handover'),
      value: order.fulfillment === 'branch'
        ? branch ? localized(branch.name, language) : t('rentals_branch_pickup')
        : order.deliveryAddress,
    },
    { label: t('rv_amount'), value: formatPrice(order.totalUsd) },
    ...(extrasUsd > 0
      ? [
          { label: t('rv_extras'), value: (order.extras ?? []).map((extra) => `${extra.description} — $${extra.amountUsd.toFixed(2)}`).join(', ') },
          { label: t('rv_amount_due'), value: `${formatPrice(dueUsd)} (${mmkTotal.toLocaleString('en-US')} Ks / $ ${dueUsd.toFixed(2)})` },
        ]
      : []),
    { label: t('rv_payment_method'), value: order.paymentMethod ? t(PAYMENT_KEY[order.paymentMethod]) : t('rv_payment_pending') },
    { label: t('rv_booked_on'), value: formatDateTime(order.createdAt, language) },
    { label: t('rv_voucher_version'), value: `v${order.voucherVersion || 1}` },
    { label: t('rv_owner'), value: 'MH Travel' },
    { label: t('rv_cancellation'), value: `${t('rv_terms_version')} ${order.termsVersion}` },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-3 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link to="/account" className="inline-flex items-center gap-1.5 text-xs font-semibold text-link">
          <ArrowLeft size={13} /> {t('rv_back_to_account')}
        </Link>
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-2 text-[11px] font-semibold text-white hover:brightness-110">
          <Printer size={14} /> {t('rv_print')}
        </button>
      </div>

      <article className="overflow-hidden rounded-2xl border border-border bg-bg-card shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-bg-cardAlt px-4 py-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-blue">{t('rv_kicker')}</p>
            <h1 className="mt-0.5 text-lg font-extrabold text-text-primary">{t('rv_title')}</h1>
            <p className="mt-1 font-mono text-xs text-text-secondary">{order.requestCode}</p>
          </div>
          <div className="flex items-center gap-3">
            {qr && <img src={qr} alt={order.requestCode} className="h-20 w-20 rounded bg-white p-1" />}
            <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-[10px] font-bold text-brand-blue">
              {t(STATUS_KEY[order.status])}
            </span>
          </div>
        </header>

        {order.status === 'accepted' && deadlineLeft > 0 && (
          <p role="status" className="flex items-center gap-2 border-b border-border bg-status-warningBg px-4 py-2 text-[10px] font-semibold text-status-warning">
            <Clock size={13} /> {t('rv_payment_window')} {deadlineHours}h {deadlineMinutes}m
          </p>
        )}
        {order.status === 'expired' && (
          <p role="status" className="flex items-center gap-2 border-b border-border bg-status-warningBg px-4 py-2 text-[10px] font-semibold text-status-warning">
            <X size={13} /> {t('rv_expired_note')}
          </p>
        )}
        {order.status === 'paid' && (
          <p role="status" className="flex items-center gap-2 border-b border-border bg-status-success/10 px-4 py-2 text-[10px] font-semibold text-status-success">
            <Check size={13} /> {t('rv_paid_note')}
          </p>
        )}

        <dl className="divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-wrap items-start justify-between gap-2 px-4 py-2 text-[11px]">
              <dt className="text-text-faint">{row.label}</dt>
              <dd className="text-right font-medium text-text-primary">{row.value}</dd>
            </div>
          ))}
        </dl>

        {order.specialRequests.trim() && (
          <div className="border-t border-border px-4 py-3">
            <p className="text-[10px] font-semibold text-text-faint">{t('rentals_special_requests')}</p>
            <p className="mt-1 text-[11px] leading-4 text-text-secondary">{order.specialRequests}</p>
          </div>
        )}

        {order.status === 'paid' && user?.id === order.userId && (
          <div className="border-t border-border px-4 py-3 print:hidden">
            <p className="text-[10px] font-semibold text-text-faint">{t('rv_reschedule_heading')}</p>
            {order.rescheduledCount > 0 ? (
              <p className="mt-1 text-[10px] text-text-muted">{t('rv_reschedule_used')}</p>
            ) : (
              <>
                <p className="mt-1 text-[10px] leading-4 text-text-muted">{t('rv_reschedule_intro')}</p>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <label className="text-[10px] font-semibold text-text-faint">
                    <span className="mb-1 block">{t('rv_reschedule_new_date')}</span>
                    <input
                      type="date"
                      value={nextStart}
                      onChange={(event) => { setNextStart(event.target.value); setRescheduleNote(null); }}
                      className="rounded border border-border bg-bg-card px-2 py-1 text-[11px] text-text-primary outline-none focus:border-brand-blue"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={!nextStart}
                    onClick={() => {
                      const result = reschedule(order.id, nextStart);
                      setRescheduleNote(result.ok ? 'rv_reschedule_done' : RESCHEDULE_KEY[result.reason] ?? 'rv_not_found');
                    }}
                    className="rounded-lg bg-brand-blue px-3 py-2 text-[10px] font-semibold text-white hover:brightness-110 disabled:opacity-40"
                  >
                    {t('rv_reschedule_action')}
                  </button>
                </div>
                {rescheduleNote && <p role="status" className="mt-2 text-[10px] font-semibold text-text-secondary">{t(rescheduleNote)}</p>}
              </>
            )}
          </div>
        )}

        <footer className="border-t border-border bg-bg-cardAlt px-4 py-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-text-faint">{t('rv_terms_heading')}</p>
          <p className="mt-1 text-[10px] leading-4 text-text-muted">{localized(catalog.terms, language)}</p>
          <p className="mt-2 text-[9px] text-text-faint">
            {t('rv_display_currency')}: {currency} · 1 USD = {exchangeRate.toLocaleString('en-US')} Ks
          </p>
        </footer>
      </article>
    </div>
  );
}
