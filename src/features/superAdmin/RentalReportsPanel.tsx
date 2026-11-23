import { useMemo, useState } from 'react';
import { Download, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useCurrency } from '../../lib/currency';
import { useRentalCatalog } from '../../lib/rentalCatalogStore';
import { localized } from '../../data/rentalCatalog';
import { useRentalOrders } from '../../lib/rentalOrders';
import { buildRentalReport, ordersToCsv } from '../../lib/rentalReports';

/** Plan §8.9: orders by status, city, category and day, plus the CSV export. */
const STATUS_KEY = {
  requested: 'rv_status_requested',
  accepted: 'rv_status_accepted',
  paid: 'rv_status_paid',
  completed: 'rv_status_completed',
  expired: 'rv_status_expired',
  cancelled: 'rv_status_cancelled',
} as const;

export function RentalReportsPanel() {
  const { language, t } = useLanguage();
  const { formatCurrencyAmount } = useCurrency();
  const { catalog } = useRentalCatalog();
  const { allOrders } = useRentalOrders();
  const [days, setDays] = useState(30);

  const from = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().slice(0, 10);
  }, [days]);

  // The window compares against the order's own start date, which is what the
  // founder asks about ("what is booked in the next month").
  const scoped = useMemo(() => allOrders.filter((order) => order.startDate >= from), [allOrders, from]);
  const report = useMemo(() => buildRentalReport(scoped), [scoped]);

  function cityLabel(cityId: string): string {
    const city = catalog.cities.find((item) => item.id === cityId);
    return city ? localized(city.name, language) : cityId;
  }

  function categoryLabel(categoryId: string): string {
    const type = catalog.types.find((item) => item.id === categoryId);
    return type ? localized(type.label, language) : categoryId;
  }

  function exportCsv() {
    const csv = ordersToCsv(scoped);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rental-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const conversionPercent = Math.round(report.conversion.ratio * 1000) / 10;

  return (
    <div className="mx-auto max-w-[1150px] space-y-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('ra_kicker')}</p>
          <h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('rr_title')}</h1>
          <p className="mt-1 text-sm text-slate-400">{t('rr_intro')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="rounded-lg border border-[#2b527d] bg-[#0b203b] px-2 py-2 text-[11px] text-white outline-none">
            {[7, 30, 90, 365].map((option) => <option key={option} value={option}>{t('rr_window_days').replace('{days}', String(option))}</option>)}
          </select>
          <button type="button" onClick={exportCsv} disabled={scoped.length === 0} className="inline-flex items-center gap-2 rounded-lg border border-[#2f6192] px-3 py-2 text-[11px] font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-40">
            <Download size={15} /> {t('rr_export')}
          </button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('rr_total_orders')} value={String(scoped.length)} />
        <Stat label={t('rr_conversion')} value={`${conversionPercent}%`} hint={`${report.conversion.paid}/${report.conversion.requested}`} />
        <Stat label={t('rr_median_accept')} value={report.medianAcceptHours === null ? '—' : `${report.medianAcceptHours}h`} />
        <Stat
          label={t('rr_settled')}
          value={formatCurrencyAmount(report.settled.usd, 'USD')}
          hint={`${report.settled.mmk.toLocaleString('en-US')} Ks`}
        />
      </div>

      <Section title={t('rr_by_status')}>
        <Table
          head={[t('rr_col_status'), t('rr_col_count'), t('rr_col_total')]}
          rows={report.statuses.map((row) => [t(STATUS_KEY[row.status]), String(row.count), formatCurrencyAmount(row.totalUsd, 'USD')])}
        />
      </Section>

      <div className="grid gap-3 lg:grid-cols-2">
        <Section title={t('rr_by_city')}>
          {report.cities.length === 0
            ? <Empty text={t('rr_empty')} />
            : <Table head={[t('ra_col_city'), t('rr_col_count'), t('rr_col_total')]} rows={report.cities.map((row) => [cityLabel(row.key), String(row.count), formatCurrencyAmount(row.totalUsd, 'USD')])} />}
        </Section>
        <Section title={t('rr_by_category')}>
          {report.categories.length === 0
            ? <Empty text={t('rr_empty')} />
            : <Table head={[t('ra_col_type'), t('rr_col_count'), t('rr_col_total')]} rows={report.categories.map((row) => [categoryLabel(row.key), String(row.count), formatCurrencyAmount(row.totalUsd, 'USD')])} />}
        </Section>
      </div>

      <Section title={t('rr_by_day')}>
        {report.days.length === 0
          ? <Empty text={t('rr_empty')} />
          : <Table head={[t('rr_col_day'), t('rr_col_count'), t('rr_col_total')]} rows={report.days.map((row) => [row.key, String(row.count), formatCurrencyAmount(row.totalUsd, 'USD')])} />}
      </Section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-[#294d76] bg-[#0b203b] p-3 shadow-xl">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"><TrendingUp size={11} /> {label}</p>
      <p className="mt-1 text-lg font-extrabold text-white">{value}</p>
      {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
      <div className="border-b border-[#244668] px-3 py-2"><h2 className="text-sm font-bold">{title}</h2></div>
      <div className="overflow-x-auto p-3">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded border border-dashed border-[#2b527d] px-3 py-6 text-center text-[10px] text-slate-500">{text}</p>;
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <table className="w-full min-w-[380px] text-left text-[10px]">
      <thead className="text-slate-300">
        <tr>{head.map((cell) => <th key={cell} className="px-2 py-1.5 font-semibold">{cell}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.join('|')} className="border-t border-[#1d3a5c]">
            {row.map((cell, index) => <td key={`${cell}-${index}`} className={`px-2 py-1.5 ${index === 0 ? 'text-slate-100' : 'text-slate-300'}`}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
