import { useMemo, useState } from 'react';
import { BadgeCheck, Coins, Play, ShieldAlert, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { fillPair, translatePair } from '../../lib/translations';
import { canRunPayouts, canSetCommission } from '../../lib/adminWorkspace';
import { recordAdminAudit } from '../../lib/adminAudit';
import { pushFeedNotice } from '../../lib/adminNotices';
import { formatMmk } from '../../lib/moneyFormat';
import {
  MINIMUM_PAYOUT_MMK,
  commissionFor,
  duePayouts,
  latestDueWindow,
  replayPayout,
  statementFor,
  upcomingDueDays,
  type PayoutRun,
} from '../../lib/ownerLedger';
import { runDuePayouts, saveCommission, useCommissionSettings, useLedgerRows, usePayoutRuns } from '../../lib/ownerLedgerStore';

/**
 * Plan §9 and the §16D Phase 3 gate. §16B.1 gives "Payments, payouts, exchange
 * rates" to Super Admin and Payment Admin, so Admin never opens this section;
 * the owner reads the same numbers through the shop workspace instead.
 */
export function OwnerPayoutsPanel() {
  const { t } = useLanguage();
  const { user, adminRole } = useAuth();
  const rows = useLedgerRows();
  const runs = usePayoutRuns();
  const settings = useCommissionSettings();
  const [notice, setNotice] = useState('');

  const mayRun = canRunPayouts(adminRole);
  const maySetCommission = canSetCommission(adminRole);
  const due = useMemo(() => duePayouts(rows), [rows]);
  const window = useMemo(() => latestDueWindow(), []);
  const nextDue = useMemo(() => upcomingDueDays(), []);
  const paidTotal = useMemo(() => runs.reduce((sum, run) => sum + run.netMmk, 0), [runs]);

  const owedTotal = useMemo(() => due.reduce((sum, plan) => sum + plan.netMmk, 0), [due]);
  const payableCount = due.filter((plan) => plan.payable).length;
  const carriedTotal = due.filter((plan) => !plan.payable).reduce((sum, plan) => sum + plan.netMmk, 0);

  const shops = useMemo(() => [...new Set(rows.map((row) => row.shopId))].sort(), [rows]);

  function runNow() {
    if (!mayRun) return;
    const actor = user?.name ?? '';
    const result = runDuePayouts(actor);
    for (const run of result.runs) {
      // Plan §16B.2: money leaving is a write, so it names the actor.
      recordAdminAudit({
        actor,
        actorRole: adminRole ?? 'system',
        action: 'payment',
        objectType: 'owner_payout',
        objectId: run.id,
        summary: `${run.netMmk} MMK to ${run.shopName} (${run.window.dueDay})`,
        source: 'payouts',
      });
      pushFeedNotice('owner_payout', {
        title: translatePair('po_notice_run_title'),
        message: fillPair('po_notice_run_body', {
          shop: run.shopName,
          amount: formatMmk(run.netMmk),
          day: run.window.dueDay,
        }),
        recipients: [{ kind: 'author', value: run.ownerName }],
        href: '/shop-owner',
      });
    }
    setNotice(
      result.runs.length === 0
        ? t('po_run_none')
        : t('po_run_done').replace('{count}', String(result.runs.length)),
    );
  }

  function commitCommission(shopId: string, percent: number) {
    if (!maySetCommission) return;
    const actor = user?.name ?? '';
    saveCommission(shopId, percent, actor);
    recordAdminAudit({
      actor,
      actorRole: adminRole ?? 'system',
      action: 'updated',
      objectType: 'owner_commission',
      objectId: shopId,
      summary: `commission ${percent}%`,
      source: 'payouts',
    });
    setNotice(t('po_commission_saved').replace('{shop}', shopId).replace('{percent}', String(percent)));
  }

  return (
    <div className="mx-auto max-w-[1150px] space-y-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">{t('sa_payouts_kicker')}</p>
          <h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('po_title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{t('po_intro')}</p>
        </div>
        <button
          type="button"
          onClick={runNow}
          disabled={!mayRun || payableCount === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          <Play size={14} /> {t('po_run')}
        </button>
      </div>

      {notice && <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">{notice}</p>}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('po_stat_owed')} value={formatMmk(owedTotal)} icon={Coins} />
        <Stat label={t('po_stat_payable')} value={String(payableCount)} icon={BadgeCheck} />
        <Stat label={t('po_stat_carried')} value={formatMmk(carriedTotal)} icon={ShieldAlert} />
        <Stat label={t('po_stat_paid')} value={formatMmk(paidTotal)} icon={TrendingUp} />
      </div>

      <Section title={t('po_section_due')}>
        <p className="mb-2 text-[10px] text-slate-500">
          {t('po_due_today')}: {window.dueDay} · {t('po_next_due')}: {nextDue.join(' · ')} ·{' '}
          {t('owner_pay_minimum').replace('{minimum}', formatMmk(MINIMUM_PAYOUT_MMK))}
        </p>
        {due.length === 0 ? (
          <Empty text={t('po_empty')} />
        ) : (
          <Table
            head={[t('po_col_shop'), t('po_window'), t('po_col_rows'), t('po_col_gross'), t('po_col_commission'), t('po_col_net'), t('po_col_state')]}
            rows={due.map((plan) => [
              plan.shopName || plan.shopId,
              `${plan.window.startDay} → ${plan.window.endDay}`,
              String(plan.rowIds.length),
              formatMmk(plan.grossMmk),
              formatMmk(plan.commissionMmk),
              formatMmk(plan.netMmk),
              plan.payable ? t('po_payable') : t('po_carried'),
            ])}
          />
        )}
      </Section>

      <div className="grid gap-3 lg:grid-cols-2">
        <Section title={t('po_section_commission')}>
          <p className="mb-2 text-[10px] text-slate-500">{t('po_commission_hint')}</p>
          <div className="space-y-2">
            {shops.map((shopId) => (
              <CommissionRow
                key={shopId}
                shopId={shopId}
                percent={commissionFor(settings, shopId)}
                disabled={!maySetCommission}
                onSave={commitCommission}
              />
            ))}
          </div>
        </Section>

        <Section title={t('po_section_verify')}>
          {runs.length === 0 ? (
            <Empty text={t('po_empty')} />
          ) : (
            <div className="space-y-1.5">
              {runs.map((run) => {
                const replay = replayPayout(rows, run);
                return (
                  <div key={run.id} className="flex items-center justify-between gap-2 rounded border border-[#1d3a5c] px-2 py-1.5 text-[10px]">
                    <span className="text-slate-200">{run.id}</span>
                    <span className="text-slate-400">{formatMmk(run.netMmk)}</span>
                    <span className={replay.matches ? 'text-emerald-300' : 'text-red-300'}>
                      {replay.matches ? t('po_verified') : t('po_mismatch')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <Section title={t('po_section_runs')}>
        {runs.length === 0 ? (
          <Empty text={t('po_empty')} />
        ) : (
          <Table
            head={[t('po_col_shop'), t('po_window'), t('po_due_day'), t('po_col_net'), t('po_stat_paid')]}
            rows={[...runs]
              .sort((a, b) => b.runAt.localeCompare(a.runAt))
              .map((run) => [
                run.shopName || run.shopId,
                `${run.window.startDay} → ${run.window.endDay}`,
                run.window.dueDay,
                formatMmk(run.netMmk),
                run.runAt.slice(0, 10),
              ])}
          />
        )}
      </Section>

      <Section title={t('po_section_ledger')}>
        <LedgerTable runs={runs} shops={shops} />
      </Section>
    </div>
  );
}

function LedgerTable({ runs, shops }: { runs: PayoutRun[]; shops: string[] }) {
  const { t } = useLanguage();
  const rows = useLedgerRows();
  // The statement is the same read the owner sees, so nothing here can drift.
  const statements = shops.map((shopId) => statementFor(rows, runs, shopId));
  const all = statements.flatMap((statement) => statement.rows);
  if (all.length === 0) return <Empty text={t('po_empty')} />;
  return (
    <Table
      head={[t('po_col_shop'), t('owner_pay_col_day'), t('owner_pay_col_ref'), t('owner_pay_col_gross'), t('owner_pay_col_commission'), t('owner_pay_col_net'), t('owner_pay_col_state')]}
      rows={all.map((row) => [
        row.shopName || row.shopId,
        row.paidDay,
        row.bookingRef,
        formatMmk(row.grossMmk),
        `${formatMmk(row.commissionMmk)} (${row.commissionPercent}%)`,
        formatMmk(row.netMmk),
        row.payoutId === null ? t('owner_pay_state_owed') : t('owner_pay_state_paid'),
      ])}
    />
  );
}

function CommissionRow({
  shopId,
  percent,
  disabled,
  onSave,
}: {
  shopId: string;
  percent: number;
  disabled: boolean;
  onSave: (shopId: string, percent: number) => void;
}) {
  const [value, setValue] = useState(String(percent));
  return (
    <div className="flex items-center justify-between gap-2 rounded border border-[#1d3a5c] px-2 py-1.5">
      <span className="truncate text-[11px] text-slate-200">{shopId}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          className="w-16 rounded border border-[#2b527d] bg-[#0b203b] px-1.5 py-1 text-right text-[11px] text-white outline-none disabled:opacity-40"
        />
        <span className="text-[10px] text-slate-500">%</span>
        <button
          type="button"
          disabled={disabled || value === '' || Number(value) === percent}
          onClick={() => onSave(shopId, Number(value))}
          className="rounded bg-[#147bea] px-2 py-1 text-[10px] font-bold text-white hover:bg-[#0b63c4] disabled:opacity-30"
        >
          ✓
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Coins }) {
  return (
    <div className="rounded-lg border border-[#294d76] bg-[#0b203b] p-3 shadow-xl">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"><Icon size={11} /> {label}</p>
      <p className="mt-1 text-lg font-extrabold text-white">{value}</p>
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
    <table className="w-full min-w-[460px] text-left text-[10px]">
      <thead className="text-slate-300">
        <tr>{head.map((cell) => <th key={cell} className="px-2 py-1.5 font-semibold">{cell}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row[0]}-${row[2] ?? index}-${index}`} className="border-t border-[#1d3a5c]">
            {row.map((cell, cellIndex) => (
              <td key={`${cell}-${cellIndex}`} className={`px-2 py-1.5 ${cellIndex === 0 ? 'text-slate-100' : 'text-slate-300'}`}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
