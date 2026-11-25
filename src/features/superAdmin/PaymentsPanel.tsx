import { useMemo, useState } from 'react';
import { CircleDollarSign, WalletCards } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useCurrency } from '../../lib/currency';
import { canOpenSection, type WorkspaceSection } from '../../lib/adminWorkspace';
import {
  PAYMENT_KINDS,
  adminBookings,
  ledgerFromBookings,
  ledgerDayReconciles,
  ledgerTotalsByDay,
  type PaymentLedgerRow,
} from '../../lib/adminBookings';
import { useCollection } from '../../lib/collection';
import { CsvExportButton, NotAllowedState } from './shared/DashboardPieces';
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
  INPUT_CLASS,
  SELECT_CLASS,
} from './shared/sectionStyles';

import type { TranslationKey } from '../../lib/translations';

/**
 * Plan §3A.9, ticket O-63. The ledger view for Super Admin and Payment Admin:
 * transactions with gross, commission and net, filters by kind, owner and date,
 * and a per-day total that must equal the sum of its entries.
 *
 * The reconciliation line is the point of the screen, so it is computed from
 * the rows on screen rather than trusted: a day whose gross does not equal
 * commission plus net turns red.
 */

const KIND_KEYS: Record<PaymentLedgerRow['kind'], TranslationKey> = {
  booking: 'pay_kind_booking',
  rental: 'pay_kind_rental',
  commission: 'pay_kind_commission',
  subscription: 'pay_kind_subscription',
  template: 'pay_kind_template',
  ad: 'pay_kind_ad',
  guide: 'pay_kind_guide',
};

const CSV_COLUMNS: CsvColumn<PaymentLedgerRow>[] = [
  { header: 'day', value: (row) => row.day },
  { header: 'kind', value: (row) => row.kind },
  { header: 'reference', value: (row) => row.reference },
  { header: 'owner', value: (row) => row.owner },
  { header: 'gross_usd', value: (row) => row.gross_usd },
  { header: 'commission_usd', value: (row) => row.commission_usd },
  { header: 'net_usd', value: (row) => row.net_usd },
];

export function PaymentsPanel() {
  const { t } = useLanguage();
  const { adminRole } = useAuth();
  const { formatPrice } = useCurrency();
  const [kind, setKind] = useState<'all' | PaymentLedgerRow['kind']>('all');
  const [owner, setOwner] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const allowed = canOpenSection(adminRole, 'payments' as WorkspaceSection);

  const { rows: bookingRows } = useCollection(adminBookings);
  const allRows = useMemo(() => ledgerFromBookings(bookingRows), [bookingRows]);
  const owners = useMemo(() => [...new Set(allRows.map((row) => row.owner))].sort(), [allRows]);

  const filtered = useMemo(
    () =>
      allRows.filter((row) => {
        if (kind !== 'all' && row.kind !== kind) return false;
        if (owner !== 'all' && row.owner !== owner) return false;
        if (from && row.day < from) return false;
        if (to && row.day > to) return false;
        return true;
      }),
    [allRows, kind, owner, from, to],
  );

  const daily = useMemo(() => ledgerTotalsByDay(filtered), [filtered]);
  const totals = useMemo(
    () => ({
      gross: Math.round(filtered.reduce((sum, row) => sum + row.gross_usd, 0) * 100) / 100,
      commission: Math.round(filtered.reduce((sum, row) => sum + row.commission_usd, 0) * 100) / 100,
      net: Math.round(filtered.reduce((sum, row) => sum + row.net_usd, 0) * 100) / 100,
    }),
    [filtered],
  );

  if (!allowed) return <NotAllowedState />;

  return (
    <div className="mx-auto max-w-[1200px] space-y-3">
      <SectionHeader kickerKey="pay_kicker" titleKey="pay_title" introKey="pay_intro">
        <CsvExportButton section="payments" columns={CSV_COLUMNS} rows={filtered} />
      </SectionHeader>

      <div className="grid grid-cols-3 gap-2">
        <SummaryCard icon={CircleDollarSign} label={t('pay_summary_gross')} value={formatPrice(totals.gross)} tone="blue" />
        <SummaryCard icon={WalletCards} label={t('pay_summary_commission')} value={formatPrice(totals.commission)} tone="purple" />
        <SummaryCard icon={WalletCards} label={t('pay_summary_net')} value={formatPrice(totals.net)} tone="green" />
      </div>

      <Panel>
        <PanelTitle icon={WalletCards} title={t('pay_daily_totals')} />
        <div className="grid gap-2 border-b border-[#244668] bg-[#091a31] p-2 sm:grid-cols-4">
          <Field label={t('pay_filter_kind')}>
            <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)} className={SELECT_CLASS}>
              <option value="all">{t('sa_all')}</option>
              {PAYMENT_KINDS.map((entry) => (
                <option key={entry} value={entry}>
                  {t(KIND_KEYS[entry])}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('pay_filter_owner')}>
            <select value={owner} onChange={(event) => setOwner(event.target.value)} className={SELECT_CLASS}>
              <option value="all">{t('sa_all')}</option>
              {owners.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('rp_from')}>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={INPUT_CLASS} />
          </Field>
          <Field label={t('rp_to')}>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={INPUT_CLASS} />
          </Field>
        </div>

        {daily.length === 0 ? (
          <div className="p-3">
            <EmptyState />
          </div>
        ) : (
          <TableWrap minWidth={720}>
            <TableHead>
              <tr>
                <Th>{t('sec_col_date')}</Th>
                <Th>{t('sec_col_gross')}</Th>
                <Th>{t('sec_col_commission')}</Th>
                <Th>{t('sec_col_net')}</Th>
                <Th>{t('sec_col_status')}</Th>
              </tr>
            </TableHead>
            <tbody>
              {daily.map((entry) => {
                const ok = ledgerDayReconciles(entry);
                return (
                  <TableRow key={entry.day}>
                    <Td className="whitespace-nowrap font-semibold text-white">{entry.day}</Td>
                    <Td>{formatPrice(entry.gross)}</Td>
                    <Td>{formatPrice(entry.commission)}</Td>
                    <Td>{formatPrice(entry.net)}</Td>
                    <Td>
                      <StatusPill tone={ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}>
                        {ok ? t('pay_reconciles') : t('pay_not_reconciled')}
                      </StatusPill>
                    </Td>
                  </TableRow>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Panel>
        <PanelTitle icon={CircleDollarSign} title={t('pay_transactions')} />
        {filtered.length === 0 ? (
          <div className="p-3">
            <EmptyState />
          </div>
        ) : (
          <TableWrap minWidth={860}>
            <TableHead>
              <tr>
                <Th>{t('sec_col_date')}</Th>
                <Th>{t('sec_col_kind')}</Th>
                <Th>{t('sec_col_reference')}</Th>
                <Th>{t('sec_col_owner')}</Th>
                <Th>{t('sec_col_gross')}</Th>
                <Th>{t('sec_col_commission')}</Th>
                <Th>{t('sec_col_net')}</Th>
              </tr>
            </TableHead>
            <tbody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <Td className="whitespace-nowrap">{row.day}</Td>
                  <Td>{t(KIND_KEYS[row.kind])}</Td>
                  <Td className="font-semibold text-cyan-300">{row.reference}</Td>
                  <Td>{row.owner}</Td>
                  <Td>{formatPrice(row.gross_usd)}</Td>
                  <Td>{formatPrice(row.commission_usd)}</Td>
                  <Td>{formatPrice(row.net_usd)}</Td>
                </TableRow>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}
