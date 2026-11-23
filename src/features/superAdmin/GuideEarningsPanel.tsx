import { useMemo, useState } from 'react';
import { BadgeCheck, Coins, Search, Wallet } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { fillPair, translatePair } from '../../lib/translations';
import { useAuth } from '../../lib/auth';
import { useCurrency } from '../../lib/currency';
import {
  canMarkEarningPaid,
  canReadAllEarnings,
  canSetEarningAmount,
} from '../../lib/adminWorkspace';
import { authorTotals, earningsForAuthor } from '../../lib/guideEarnings';
import { useGuideEarnings } from '../../lib/guideEarningsStore';
import { recordAdminAudit } from '../../lib/adminAudit';
import { pushAdminNotice } from '../../lib/adminNotices';
import { pushFeedEvent } from '../../lib/notificationFeed';

/**
 * Plan §16B.1: guide earnings belong to Payment Admin (`F`), with Admin on `R`
 * and the author's own rows on `O (read)` for Guide Content Admin. The section
 * is shared; what differs per role is whether the amount and the settle button
 * are editable, and whose rows are listed.
 */
type State = 'all' | 'needs_amount' | 'payable' | 'paid';

const STATES: State[] = ['all', 'needs_amount', 'payable', 'paid'];

export function GuideEarningsPanel() {
  const { t } = useLanguage();
  const { user, adminRole } = useAuth();
  const { formatCurrencyAmount } = useCurrency();
  const { rows, setAmount, markPaid } = useGuideEarnings();
  const [query, setQuery] = useState('');
  const [state, setState] = useState<State>('all');

  const maySetAmount = canSetEarningAmount(adminRole);
  const mayMarkPaid = canMarkEarningPaid(adminRole);
  const readsAll = canReadAllEarnings(adminRole);

  // A Guide Content Admin reads only its own rows; the author name on the row is
  // the guide's byline, so the account name has to match it.
  const visible = useMemo(() => {
    const scoped = readsAll ? rows : earningsForAuthor(rows, user?.name ?? '');
    const needle = query.trim().toLowerCase();
    return scoped.filter((row) => {
      if (needle && !`${row.guideTitle} ${row.guideId} ${row.author}`.toLowerCase().includes(needle)) return false;
      if (state === 'needs_amount') return row.amountUsd === null;
      if (state === 'payable') return row.amountUsd !== null && !row.paid;
      if (state === 'paid') return row.paid;
      return true;
    });
  }, [rows, readsAll, user?.name, query, state]);

  const totals = useMemo(() => authorTotals(visible), [visible]);
  const payable = totals.reduce((sum, total) => sum + total.payableUsd, 0);
  const settled = totals.reduce((sum, total) => sum + total.paidUsd, 0);
  const waiting = totals.reduce((sum, total) => sum + total.pendingRows, 0);

  // Plan §16B.2: setting the amount and settling it are both writes, so each
  // one appends an audit row naming the actor and the guide.
  function commitAmount(rowId: string, amountUsd: number, guideTitle: string) {
    setAmount(rowId, amountUsd);
    if (!Number.isFinite(amountUsd) || amountUsd < 0) return;
    recordAdminAudit({
      actor: user?.name ?? '',
      actorRole: adminRole ?? 'system',
      action: 'updated',
      objectType: 'guide_earning',
      objectId: guideTitle || rowId,
      summary: `amount ${amountUsd} USD`,
      source: 'earnings',
    });
    const title = t('sa_notice_earning_amount_title');
    const message = t('sa_notice_earning_amount_body')
      .replace('{guide}', guideTitle || rowId)
      .replace('{amount}', `${amountUsd} USD`);
    pushAdminNotice({ title, message });
    // Plan §16B.3: the author is the recipient, so the row names them rather
    // than every admin.
    const author = rows.find((row) => row.id === rowId)?.author ?? '';
    // The author is a traveler, so the row carries both languages (§16B.4).
    if (author) {
      pushFeedEvent('guide_earning', {
        title: translatePair('sa_notice_earning_amount_title'),
        message: fillPair('sa_notice_earning_amount_body', { guide: guideTitle || rowId, amount: `${amountUsd} USD` }),
        recipients: [{ kind: 'author', value: author }],
      });
    }
  }

  function commitPaid(rowId: string, guideTitle: string, amountUsd: number | null) {
    markPaid(rowId);
    recordAdminAudit({
      actor: user?.name ?? '',
      actorRole: adminRole ?? 'system',
      action: 'payment',
      objectType: 'guide_earning',
      objectId: guideTitle || rowId,
      summary: `paid ${amountUsd ?? 0} USD`,
      source: 'earnings',
    });
    const title = t('sa_notice_earning_paid_title');
    const message = t('sa_notice_earning_paid_body')
      .replace('{guide}', guideTitle || rowId)
      .replace('{amount}', `${amountUsd ?? 0} USD`);
    pushAdminNotice({ title, message });
    const author = rows.find((row) => row.id === rowId)?.author ?? '';
    if (author) {
      pushFeedEvent('guide_earning', {
        title: translatePair('sa_notice_earning_paid_title'),
        message: fillPair('sa_notice_earning_paid_body', { guide: guideTitle || rowId, amount: `${amountUsd ?? 0} USD` }),
        recipients: [{ kind: 'author', value: author }],
      });
    }
  }

  const stateKey = {
    needs_amount: 'ge_state_needs_amount',
    payable: 'ge_state_payable',
    paid: 'ge_state_paid',
  } as const;

  return (
    <div className="mx-auto max-w-[1150px] space-y-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('ge_kicker')}</p>
          <h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('ge_title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{readsAll ? t('ge_intro') : t('ge_intro_own')}</p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-[#2b527d] bg-[#0b203b] px-2.5 py-1.5">
          <Search size={14} className="text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('ge_search')}
            aria-label={t('ge_search')}
            className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Stat icon={Wallet} label={t('ge_payable')} value={formatCurrencyAmount(payable, 'USD')} />
        <Stat icon={BadgeCheck} label={t('ge_settled')} value={formatCurrencyAmount(settled, 'USD')} />
        <Stat icon={Coins} label={t('ge_waiting')} value={String(waiting)} />
      </div>

      <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#244668] p-2">
          {STATES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setState(option)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${state === option ? 'bg-[#168df4] text-white' : 'border border-[#2b527d] text-slate-300 hover:bg-white/5'}`}
            >
              {t(option === 'all' ? 'ge_filter_all' : stateKey[option])}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[11px]">
            <thead className="bg-[#091a31] text-slate-300">
              <tr>
                <th className="px-3 py-2">{t('tg_col_guide')}</th>
                <th className="px-2 py-2">{t('tg_col_author')}</th>
                <th className="px-2 py-2">{t('tg_col_published')}</th>
                <th className="px-2 py-2">{t('tg_col_amount')}</th>
                <th className="px-3 py-2">{t('tg_col_state')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="border-t border-[#1d3a5c] text-slate-200">
                  <td className="px-3 py-2 font-semibold text-white">{row.guideTitle || row.guideId}</td>
                  <td className="px-2 py-2">{row.author}</td>
                  <td className="px-2 py-2 text-slate-400">{row.publishedAt}</td>
                  <td className="px-2 py-2">
                    {maySetAmount ? (
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={row.amountUsd ?? ''}
                        onChange={(event) => commitAmount(row.id, Number(event.target.value), row.guideTitle)}
                        aria-label={t('tg_aria_amount').replace('{id}', row.guideId)}
                        className="h-7 w-20 rounded border border-[#2b527d] bg-[#081a31] px-2 text-[11px] text-white outline-none"
                      />
                    ) : (
                      <span className="text-slate-300">
                        {row.amountUsd === null ? '—' : formatCurrencyAmount(row.amountUsd, 'USD')}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {row.paid ? (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[9px] font-bold text-emerald-300">{t('tg_state_paid')}</span>
                    ) : row.amountUsd === null ? (
                      <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[9px] font-bold text-amber-200">{t('ge_state_needs_amount')}</span>
                    ) : mayMarkPaid ? (
                      <button
                        type="button"
                        onClick={() => commitPaid(row.id, row.guideTitle, row.amountUsd)}
                        className="rounded border border-cyan-300/40 px-2 py-1 text-[9px] font-bold text-cyan-200 hover:bg-cyan-400/10"
                      >
                        {t('tg_mark_paid')}
                      </button>
                    ) : (
                      <span className="rounded-full bg-sky-500/20 px-2 py-1 text-[9px] font-bold text-sky-200">{t('ge_state_payable')}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visible.length === 0 && <p className="p-6 text-center text-xs text-slate-500">{t('ge_empty')}</p>}
        <div className="border-t border-[#244668] p-3 text-[10px] text-slate-400">
          {totals.length === 0
            ? <p>{t('ge_empty')}</p>
            : totals.map((total) => (
                <p key={total.author}>
                  {t('ge_author_summary')
                    .replace('{author}', total.author)
                    .replace('{payable}', formatCurrencyAmount(total.payableUsd, 'USD'))
                    .replace('{paid}', formatCurrencyAmount(total.paidUsd, 'USD'))
                    .replace('{count}', String(total.pendingRows))}
                </p>
              ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#294d76] bg-[#0b203b] p-3 shadow-xl">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"><Icon size={11} /> {label}</p>
      <p className="mt-1 text-lg font-extrabold text-white">{value}</p>
    </div>
  );
}
