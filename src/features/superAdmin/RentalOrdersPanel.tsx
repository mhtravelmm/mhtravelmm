import { useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronRight, Clock, FileText, RefreshCw, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useCurrency } from '../../lib/currency';
import { useRentalCatalog } from '../../lib/rentalCatalogStore';
import { findRentalType, findVariant, localized } from '../../data/rentalCatalog';
import {
  nextStatuses,
  paymentTimeLeft,
  useRentalOrders,
  type RentalOrder,
  type RentalOrderStatus,
  type RentalPaymentMethod,
} from '../../lib/rentalOrders';

/** Plan §8.6: the Rental Admin sees every order and drives it through the lifecycle. */
const STATUS_KEY = {
  requested: 'rv_status_requested',
  accepted: 'rv_status_accepted',
  paid: 'rv_status_paid',
  completed: 'rv_status_completed',
  expired: 'rv_status_expired',
  cancelled: 'rv_status_cancelled',
} as const;

const STATUS_TONE: Record<RentalOrderStatus, string> = {
  requested: 'bg-sky-400/15 text-sky-200',
  accepted: 'bg-amber-400/20 text-amber-100',
  paid: 'bg-emerald-400/20 text-emerald-100',
  completed: 'bg-slate-400/20 text-slate-200',
  expired: 'bg-orange-400/20 text-orange-100',
  cancelled: 'bg-red-400/20 text-red-100',
};

const ACTION_KEY: Record<RentalOrderStatus, 'ra_order_accept' | 'ra_order_mark_paid' | 'ra_order_complete' | 'ra_order_expire' | 'ra_order_cancel'> = {
  requested: 'ra_order_cancel',
  accepted: 'ra_order_cancel',
  paid: 'ra_order_complete',
  completed: 'ra_order_complete',
  expired: 'ra_order_expire',
  cancelled: 'ra_order_cancel',
};

function actionKey(to: RentalOrderStatus) {
  if (to === 'accepted') return 'ra_order_accept';
  if (to === 'paid') return 'ra_order_mark_paid';
  if (to === 'completed') return 'ra_order_complete';
  if (to === 'expired') return 'ra_order_expire';
  return ACTION_KEY.requested;
}

const FILTERS: (RentalOrderStatus | 'all')[] = ['all', 'requested', 'accepted', 'paid', 'completed', 'expired', 'cancelled'];

const PAYMENTS: RentalPaymentMethod[] = ['cash', 'bank_transfer', 'mobile_wallet'];

export function RentalOrdersPanel() {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { catalog } = useRentalCatalog();
  const { allOrders, setStatus, recordPayment, noteOrder, expireOverdue } = useRentalOrders();
  const [filter, setFilter] = useState<RentalOrderStatus | 'all'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [paymentDraft, setPaymentDraft] = useState<Record<string, RentalPaymentMethod>>({});

  const visible = useMemo(
    () => (filter === 'all' ? allOrders : allOrders.filter((order) => order.status === filter)),
    [allOrders, filter],
  );

  const counts = useMemo(() => {
    const tally: Record<string, number> = { all: allOrders.length };
    for (const order of allOrders) tally[order.status] = (tally[order.status] ?? 0) + 1;
    return tally;
  }, [allOrders]);

  function orderLabel(order: RentalOrder): string {
    const type = findRentalType(catalog, order.categoryId);
    const variant = findVariant(type, order.variantId);
    const base = type ? localized(type.label, language) : order.categoryId;
    return variant ? `${base} · ${localized(variant.label, language)}` : base;
  }

  function cityLabel(order: RentalOrder): string {
    const city = catalog.cities.find((item) => item.id === order.cityId);
    return city ? localized(city.name, language) : order.cityId;
  }

  return (
    <div className="mx-auto max-w-[1150px] space-y-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('ra_kicker')}</p>
          <h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('ra_orders_title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('ra_orders_intro')}</p>
        </div>
        <button type="button" onClick={expireOverdue} className="inline-flex items-center gap-2 self-start rounded-lg border border-[#2f6192] px-3 py-2 text-[11px] font-semibold text-slate-300 hover:bg-white/10">
          <RefreshCw size={15} /> {t('ra_orders_run_expiry')}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            aria-pressed={filter === status}
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${filter === status ? 'bg-[#168df4] text-white' : 'bg-[#102c51] text-slate-300 hover:bg-[#16385f]'}`}
          >
            {status === 'all' ? t('ra_orders_filter_all') : t(STATUS_KEY[status])} ({counts[status] ?? 0})
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#2b527d] bg-[#0b203b] px-3 py-8 text-center text-[11px] text-slate-400">{t('ra_orders_empty')}</p>
      ) : (
        <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
          <div className="divide-y divide-[#1d3a5c]">
            {visible.map((order) => {
              const open = openId === order.id;
              const left = paymentTimeLeft(order.paymentDeadline, new Date());
              const hours = Math.floor(left / 3600000);
              const minutes = Math.floor((left % 3600000) / 60000);
              const canChange = nextStatuses(order.status);
              const method = paymentDraft[order.id] ?? order.paymentMethod ?? 'cash';
              return (
                <div key={order.id}>
                  <button type="button" onClick={() => setOpenId(open ? null : order.id)} className="flex w-full flex-wrap items-center gap-2 px-3 py-2 text-left hover:bg-white/5">
                    <span className="font-mono text-[10px] text-cyan-200">{order.requestCode}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-100">{orderLabel(order)} · {cityLabel(order)}</span>
                    <span className="text-[10px] text-slate-400">{order.startDate} → {order.endDate}</span>
                    <span className="text-[10px] font-semibold text-slate-200">{formatPrice(order.totalUsd)}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${STATUS_TONE[order.status]}`}>{t(STATUS_KEY[order.status])}</span>
                    {order.status === 'accepted' && left > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[9px] font-bold text-amber-100"><Clock size={10} />{hours}h {minutes}m</span>
                    )}
                    <ChevronRight size={14} className={`shrink-0 text-slate-400 transition ${open ? 'rotate-90' : ''}`} />
                  </button>

                  {open && (
                    <div className="space-y-2.5 bg-[#091b32] p-3 text-[10px] text-slate-300">
                      <div className="grid gap-2 sm:grid-cols-3">
                        <p><span className="text-slate-500">{t('rv_customer')}: </span>{order.customerName}</p>
                        <p><span className="text-slate-500">{t('rv_phone')}: </span>{order.phone}</p>
                        <p><span className="text-slate-500">{t('rv_days')}: </span>{order.days} · {order.participants} {t('rentals_participants')}</p>
                        <p><span className="text-slate-500">{t('rv_handover')}: </span>{order.fulfillment === 'branch' ? order.branchId : order.deliveryAddress}</p>
                        <p><span className="text-slate-500">{t('rv_amount')}: </span>{formatPrice(order.totalUsd)} ({order.totalUsd} USD)</p>
                        <p><span className="text-slate-500">{t('rv_cancellation')}: </span>{order.termsVersion}</p>
                      </div>
                      {order.specialRequests.trim() && (
                        <p className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1.5"><span className="text-slate-500">{t('rentals_special_requests')}: </span>{order.specialRequests}</p>
                      )}

                      {canChange.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {canChange.map((to) => (
                            <button
                              key={to}
                              type="button"
                              onClick={() => {
                                if (to === 'paid') recordPayment(order.id, method);
                                else setStatus(order.id, to);
                              }}
                              className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[10px] font-bold ${to === 'cancelled' || to === 'expired' ? 'border-red-400/40 text-red-200 hover:bg-red-500/10' : 'border-cyan-300/40 text-cyan-100 hover:bg-cyan-400/10'}`}
                            >
                              {to === 'cancelled' ? <X size={10} /> : to === 'completed' ? <Check size={10} /> : <ChevronRight size={10} />}
                              {t(actionKey(to))}
                            </button>
                          ))}
                          {canChange.includes('paid') && (
                            <select value={method} onChange={(event) => setPaymentDraft((current) => ({ ...current, [order.id]: event.target.value as RentalPaymentMethod }))} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none">
                              {PAYMENTS.map((payment) => <option key={payment} value={payment}>{t(payment === 'cash' ? 'rv_payment_cash' : payment === 'bank_transfer' ? 'rv_payment_bank_transfer' : 'rv_payment_mobile_wallet')}</option>)}
                            </select>
                          )}
                        </div>
                      )}

                      <label className="block">
                        <span className="mb-1 block font-semibold text-slate-400">{t('ra_orders_note')}</span>
                        <textarea
                          rows={2}
                          value={order.adminNote}
                          onChange={(event) => noteOrder(order.id, event.target.value)}
                          className="w-full resize-none rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none focus:border-cyan-300"
                        />
                      </label>

                      <div>
                        <p className="mb-1 flex items-center gap-1 font-semibold text-slate-400"><FileText size={11} /> {t('ra_orders_timeline')}</p>
                        <ul className="space-y-1 border-l border-[#2b527d] pl-2">
                          {order.events.map((event, index) => (
                            <li key={`${event.at}-${index}`} className="text-[10px] text-slate-400">
                              <span className="text-slate-200">{t(STATUS_KEY[event.to])}</span> · {event.actor} · {new Date(event.at).toLocaleString(language === 'mm' ? 'my-MM' : 'en-GB')}
                              {event.note && <span className="text-slate-500"> — {event.note}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {order.status === 'paid' && (
                        <p className="flex items-center gap-1.5 rounded border border-amber-300/30 bg-amber-400/10 px-2 py-1.5 text-[10px] text-amber-100">
                          <AlertTriangle size={11} /> {t('ra_orders_reschedule_note')} ({order.rescheduledCount}/1)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
