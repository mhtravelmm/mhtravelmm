import { useMemo, useState } from 'react';
import { CalendarDays, CircleDollarSign, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useCurrency } from '../../lib/currency';
import { useAuditRecorder } from '../../lib/adminAudit';
import { pushAdminNotice } from '../../lib/adminNotices';
import { fillPair, translatePair, type TranslationKey } from '../../lib/translations';
import { pushFeedEvent } from '../../lib/notificationFeed';
import { canOpenSection, type WorkspaceSection } from '../../lib/adminWorkspace';
import {
  BOOKING_CATEGORIES,
  BOOKING_STATUSES,
  EMPTY_BOOKING_FILTERS,
  adminBookings,
  bookingCanFollow,
  bookingCanReschedule,
  bookingFacets,
  bookingNextStatuses,
  bookingSummary,
  filterBookings,
  moveBooking,
  recordBookingPayment,
  type AdminBookingRow,
  type BookingCategory,
  type BookingFilters,
  type BookingStatus,
  type PaymentMethod,
} from '../../lib/adminBookings';
import { useCollection } from '../../lib/collection';
import { ConfirmDialog, CsvExportButton, NotAllowedState } from './shared/DashboardPieces';
import type { CsvColumn } from '../../lib/dashboardPieces';
import {
  EmptyState,
  Field,
  Panel,
  PanelTitle,
  SectionHeader,
  StatusPill,
  SummaryCard,
  TableHead,
  TableRow,
  TableWrap,
  Td,
  Th,
} from './shared/SectionShell';
import {
  DANGER_BUTTON,
  GHOST_BUTTON,
  INPUT_CLASS,
  PRIMARY_BUTTON,
  SELECT_CLASS,
  statusTone,
} from './shared/sectionStyles';


/**
 * Plan §3A.9 and §6.1, ticket O-63. One booking list across hotels,
 * restaurants, events and rentals, with the §6.1 status machine behind every
 * button: a move the table does not list is not offered, and the refusal is
 * shown in the reader's language rather than as a database message.
 *
 * §3A.9: "Nobody edits a total." The detail shows the timeline, the voucher and
 * the payment record, and the only writes are status moves, a recorded payment
 * and a note.
 */

const STATUS_KEYS: Record<BookingStatus, TranslationKey> = {
  requested: 'sec_status_requested',
  accepted: 'sec_status_accepted',
  paid: 'sec_status_paid',
  completed: 'sec_status_completed',
  expired: 'sec_status_expired',
  cancelled: 'sec_status_cancelled',
};

const CATEGORY_KEYS: Record<BookingCategory, TranslationKey> = {
  hotel: 'sa_cat_hotel',
  restaurant: 'sa_cat_restaurant',
  event: 'sa_cat_event',
  rental: 'sa_cat_rental',
  ticket: 'sa_nav_tickets',
  plan: 'sa_nav_plans',
};

const METHOD_KEYS: Record<PaymentMethod, TranslationKey> = {
  cash: 'bk_method_cash',
  bank_transfer: 'bk_method_bank_transfer',
  mobile_wallet: 'bk_method_mobile_wallet',
};

const CSV_COLUMNS: CsvColumn<AdminBookingRow>[] = [
  { header: 'code', value: (row) => row.code },
  { header: 'category', value: (row) => row.category },
  { header: 'listing', value: (row) => row.listing_name },
  { header: 'city', value: (row) => row.city_id },
  { header: 'owner', value: (row) => row.owner_id },
  { header: 'traveler', value: (row) => row.traveler_name },
  { header: 'phone', value: (row) => row.traveler_phone },
  { header: 'start_date', value: (row) => row.start_date },
  { header: 'end_date', value: (row) => row.end_date },
  { header: 'guests', value: (row) => row.guests },
  { header: 'total_usd', value: (row) => row.total_usd },
  { header: 'commission_usd', value: (row) => row.commission_usd },
  { header: 'status', value: (row) => row.status },
  { header: 'flow', value: (row) => row.flow },
  { header: 'payment_method', value: (row) => row.payment_method },
  { header: 'created_at', value: (row) => row.created_at },
];

export function BookingsPanel() {
  const { t } = useLanguage();
  const { adminRole, user } = useAuth();
  const { formatPrice } = useCurrency();
  const audit = useAuditRecorder();
  const { rows, save } = useCollection(adminBookings);

  const [filters, setFilters] = useState<BookingFilters>(EMPTY_BOOKING_FILTERS);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AdminBookingRow | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [refusal, setRefusal] = useState<string | null>(null);

  const allowed = canOpenSection(adminRole, 'bookings' as WorkspaceSection);
  const filtered = useMemo(() => filterBookings(rows, filters), [rows, filters]);
  const facets = useMemo(() => bookingFacets(rows), [rows]);
  const summary = bookingSummary(filtered);
  const detail = rows.find((row) => row.id === detailId) ?? null;

  if (!allowed) return <NotAllowedState />;

  function update(patch: Partial<BookingFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function writeRow(next: AdminBookingRow, summaryLine: string) {
    save(rows.map((row) => (row.id === next.id ? next : row)));
    audit({ action: 'updated', objectType: 'booking', objectId: next.id, summary: summaryLine, source: 'bookings' });
    pushAdminNotice({
      title: t('bk_notice_moved_title'),
      message: t('bk_notice_moved_body').replace('{name}', next.code).replace('{status}', t(STATUS_KEYS[next.status])),
    });
    pushFeedEvent('booking_status', {
      title: translatePair('bk_notice_moved_title'),
      message: fillPair('bk_notice_moved_body', { name: next.code, status: t(STATUS_KEYS[next.status]) }),
      recipients: [{ kind: 'user', value: next.traveler_phone }],
    });
  }

  /** §6.1: the move is checked against the table before anything is written. */
  function move(row: AdminBookingRow, status: BookingStatus) {
    if (!bookingCanFollow(row.status, status)) {
      setRefusal(t('bk_status_move_refused'));
      return;
    }
    setRefusal(null);
    writeRow(moveBooking(row, status, user?.name ?? 'staff'), `${row.code} · ${row.status} → ${status}`);
  }

  function recordPayment(row: AdminBookingRow, method: PaymentMethod) {
    writeRow(recordBookingPayment(row, method, user?.name ?? 'staff'), `${row.code} · paid · ${method}`);
  }

  function cancel(row: AdminBookingRow, reason: string) {
    const next = moveBooking(row, 'cancelled', user?.name ?? 'staff', new Date(), reason);
    writeRow(next, `${row.code} · cancelled · ${reason}`);
    setCancelTarget(null);
  }

  function addNote(row: AdminBookingRow) {
    const text = noteDraft.trim();
    if (!text) return;
    writeRow({ ...row, note: row.note ? `${row.note} · ${text}` : text }, `${row.code} · note`);
    setNoteDraft('');
  }

  return (
    <div className="mx-auto max-w-[1250px] space-y-3">
      <SectionHeader kickerKey="bk_kicker" titleKey="bk_title" introKey="bk_intro">
        <label className="flex items-center gap-2 rounded-lg border border-[#2b527d] bg-[#0b203b] px-2.5 py-1.5">
          <CalendarDays size={14} className="text-slate-400" />
          <input
            value={filters.query}
            onChange={(event) => update({ query: event.target.value })}
            placeholder={t('bk_search')}
            aria-label={t('bk_search')}
            className="min-w-0 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-500"
          />
        </label>
        <CsvExportButton section="bookings" columns={CSV_COLUMNS} rows={filtered} />
      </SectionHeader>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-5">
        <SummaryCard icon={CalendarDays} label={t('bk_summary_total')} value={String(summary.total)} tone="cyan" />
        <SummaryCard icon={CircleDollarSign} label={t('bk_summary_paid')} value={String(summary.paid)} tone="green" />
        <SummaryCard icon={CalendarDays} label={t('bk_summary_requested')} value={String(summary.requested)} tone="amber" />
        <SummaryCard icon={CircleDollarSign} label={t('bk_summary_gross')} value={formatPrice(summary.gross)} tone="blue" />
        <SummaryCard icon={CircleDollarSign} label={t('bk_summary_commission')} value={formatPrice(summary.commission)} tone="purple" />
      </div>

      <Panel>
        <PanelTitle icon={CalendarDays} title={t('bk_title')} />
        <div className="grid gap-2 border-b border-[#244668] bg-[#091a31] p-2 sm:grid-cols-3 xl:grid-cols-6">
          <Field label={t('sec_col_category')}>
            <select value={filters.category} onChange={(event) => update({ category: event.target.value as BookingFilters['category'] })} className={SELECT_CLASS}>
              <option value="all">{t('sa_all')}</option>
              {BOOKING_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {t(CATEGORY_KEYS[category])}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('sec_col_status')}>
            <select value={filters.status} onChange={(event) => update({ status: event.target.value as BookingFilters['status'] })} className={SELECT_CLASS}>
              <option value="all">{t('sa_all')}</option>
              {BOOKING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(STATUS_KEYS[status])}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('sec_col_city')}>
            <select value={filters.city} onChange={(event) => update({ city: event.target.value })} className={SELECT_CLASS}>
              <option value="all">{t('sa_all')}</option>
              {facets.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('sec_col_owner')}>
            <select value={filters.owner} onChange={(event) => update({ owner: event.target.value })} className={SELECT_CLASS}>
              <option value="all">{t('sa_all')}</option>
              {facets.owners.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('bk_filter_from')}>
            <input type="date" value={filters.from ?? ''} onChange={(event) => update({ from: event.target.value || null })} className={INPUT_CLASS} />
          </Field>
          <Field label={t('bk_filter_to')}>
            <input type="date" value={filters.to ?? ''} onChange={(event) => update({ to: event.target.value || null })} className={INPUT_CLASS} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#244668] px-3 py-1.5 text-[10px] text-slate-400">
          <span>
            {t('sec_showing')} <strong className="text-cyan-300">{filtered.length}</strong> {t('sec_of')} {rows.length} {t('sec_rows')}
          </span>
        </div>

        {refusal && (
          <p role="alert" className="mx-3 mt-2 rounded border border-amber-400/40 bg-amber-400/10 px-2 py-1.5 text-[11px] text-amber-100">
            {refusal}
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="p-3">
            <EmptyState />
          </div>
        ) : (
          <TableWrap minWidth={1080}>
            <TableHead>
              <tr>
                <Th>{t('sec_col_reference')}</Th>
                <Th>{t('sec_col_category')}</Th>
                <Th>{t('sec_col_listing')}</Th>
                <Th>{t('sec_col_traveler')}</Th>
                <Th>{t('sec_col_dates')}</Th>
                <Th>{t('sec_col_total')}</Th>
                <Th>{t('sec_col_status')}</Th>
                <Th>{t('sec_col_flow')}</Th>
                <Th>{t('sec_col_created')}</Th>
                <Th>{t('sec_col_actions')}</Th>
              </tr>
            </TableHead>
            <tbody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <Td>
                    <button type="button" onClick={() => setDetailId(row.id)} className="font-semibold text-cyan-300 hover:text-white">
                      {row.code}
                    </button>
                  </Td>
                  <Td>{t(CATEGORY_KEYS[row.category])}</Td>
                  <Td className="max-w-[160px] truncate">{row.listing_name}</Td>
                  <Td>{row.traveler_name}</Td>
                  <Td className="whitespace-nowrap">
                    {row.start_date}
                    {row.end_date !== row.start_date ? ` → ${row.end_date}` : ''}
                  </Td>
                  <Td className="whitespace-nowrap">{formatPrice(row.total_usd)}</Td>
                  <Td>
                    <StatusPill tone={statusTone(row.status)}>{t(STATUS_KEYS[row.status])}</StatusPill>
                  </Td>
                  <Td className="text-slate-400">{row.flow === 'instant' ? 'Instant' : 'Full manual'}</Td>
                  <Td className="whitespace-nowrap text-slate-400">{row.created_at.slice(0, 10)}</Td>
                  <Td>
                    <button type="button" onClick={() => setDetailId(row.id)} className={GHOST_BUTTON}>
                      {t('usr_action_view')}
                    </button>
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      {detail && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-black/60" role="dialog" aria-modal="true" aria-label={t('bk_detail_title')}>
          <div className="h-full w-full max-w-lg overflow-y-auto border-l border-[#315985] bg-[#081a31] p-3">
            <div className="flex items-start justify-between gap-2 border-b border-[#244668] pb-2">
              <div>
                <h2 className="text-sm font-extrabold text-white">{detail.code}</h2>
                <p className="text-[11px] text-slate-400">
                  {detail.listing_name} · {t(CATEGORY_KEYS[detail.category])}
                </p>
              </div>
              <button type="button" onClick={() => setDetailId(null)} aria-label={t('sec_close')} className="rounded-full p-1 text-slate-400 hover:bg-white/10 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <dt className="text-slate-400">{t('sec_col_traveler')}</dt>
                <dd className="text-white">{detail.traveler_name}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('sec_col_phone')}</dt>
                <dd className="text-white">{detail.traveler_phone}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('sec_col_dates')}</dt>
                <dd className="text-white">
                  {detail.start_date} → {detail.end_date}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('sec_col_total')}</dt>
                <dd className="text-white">{formatPrice(detail.total_usd)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('sec_col_commission')}</dt>
                <dd className="text-white">{formatPrice(detail.commission_usd)}</dd>
              </div>
              <div>
                <dt className="text-slate-400">{t('sec_col_status')}</dt>
                <dd>
                  <StatusPill tone={statusTone(detail.status)}>{t(STATUS_KEYS[detail.status])}</StatusPill>
                </dd>
              </div>
            </dl>

            <p className="mt-2 text-[10px] italic text-slate-500">{t('bk_detail_not_editable')}</p>

            <h3 className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">{t('bk_detail_timeline')}</h3>
            <ol className="mt-1 space-y-1 border-l border-[#244668] pl-3">
              {detail.events.map((event, index) => (
                <li key={`${event.at}-${index}`} className="text-[11px] text-slate-300">
                  <span className="text-slate-500">{event.at.slice(0, 16).replace('T', ' ')}</span>{' '}
                  <strong className="text-white">{t(STATUS_KEYS[event.status])}</strong> · {event.by}
                  {event.note && <span className="block text-[10px] text-slate-400">{event.note}</span>}
                </li>
              ))}
            </ol>

            <h3 className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">{t('bk_detail_payment')}</h3>
            <p className="mt-1 text-[11px] text-slate-300">
              {detail.payment_method ? t(METHOD_KEYS[detail.payment_method]) : '—'}
              {detail.paid_at && <span className="text-slate-500"> · {detail.paid_at.slice(0, 10)}</span>}
            </p>

            {detail.note && (
              <>
                <h3 className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">{t('sec_note')}</h3>
                <p className="mt-1 text-[11px] text-slate-300">{detail.note}</p>
              </>
            )}

            <h3 className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">{t('sec_col_actions')}</h3>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {bookingNextStatuses(detail.status)
                .filter((status) => status !== 'paid' && status !== 'cancelled')
                .map((status) => (
                  <button key={status} type="button" onClick={() => move(detail, status)} className={PRIMARY_BUTTON}>
                    {t(STATUS_KEYS[status])}
                  </button>
                ))}
              {detail.status === 'accepted' && (
                <button type="button" onClick={() => recordPayment(detail, 'cash')} className={PRIMARY_BUTTON}>
                  {t('bk_action_pay')}
                </button>
              )}
              {bookingCanReschedule(detail) && (
                <span className="rounded-md border border-[#2b527d] px-2 py-1 text-[10px] text-slate-400">Reschedule stays with the traveler (§6.3)</span>
              )}
              {bookingNextStatuses(detail.status).includes('cancelled') && (
                <button type="button" onClick={() => setCancelTarget(detail)} className={DANGER_BUTTON}>
                  {t('bk_action_cancel')}
                </button>
              )}
            </div>

            <div className="mt-4 flex items-end gap-1.5">
              <div className="flex-1">
                <Field label={t('bk_action_note')}>
                  <input value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} className={INPUT_CLASS} />
                </Field>
              </div>
              <button type="button" onClick={() => addNote(detail)} disabled={!noteDraft.trim()} className={GHOST_BUTTON}>
                {t('sec_save')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={cancelTarget !== null}
        action="cancel_order"
        objectName={cancelTarget?.code ?? ''}
        onCancel={() => setCancelTarget(null)}
        onConfirm={(reason) => {
          if (cancelTarget) cancel(cancelTarget, reason);
        }}
      />
    </div>
  );
}
