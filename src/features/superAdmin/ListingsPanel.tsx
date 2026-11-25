import { useMemo, useState } from 'react';
import { CheckCircle2, EyeOff, Pencil, Search, ShieldOff, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { fillPair, translatePair, type TranslationKey } from '../../lib/translations';
import { recordAdminAudit } from '../../lib/adminAudit';
import { pushAdminNotice } from '../../lib/adminNotices';
import { pushFeedEvent } from '../../lib/notificationFeed';
import { formatMmk, formatUsd } from '../../lib/moneyFormat';
import {
  LISTING_CATEGORIES,
  BOOKING_FLOW_MODES,
  PRICE_DISPLAY_MODES,
  type ListingRow,
  type ListingStatus,
} from '../../lib/listingRows';
import { ConfirmDialog, CsvExportButton } from './shared/DashboardPieces';
import type { CsvColumn } from '../../lib/dashboardPieces';
import {
  applyListingDraft,
  canApproveListings,
  canEditListing,
  listingDraftProblems,
  listingsForViewer,
  useListings,
  type ListingDraft,
  type ListingProblem,
} from '../../lib/listingStore';

/**
 * §16C.3 step 2: the Admin listing screen. An Admin sees every row and may
 * approve, suspend and retire. An Owner reaches the same component through the
 * Owner workspace and sees only their own rows, with no approval action —
 * §16B.1 gives them `O (own listing)`.
 *
 * The rules themselves live in `listingStore.ts` and in the migration; this file
 * decides only what to show and which write to record.
 */

type Filter = 'all' | ListingStatus;

const FILTERS: Filter[] = ['all', 'pending', 'active', 'suspended', 'retired'];

const FILTER_KEYS = {
  all: 'li_filter_all',
  pending: 'li_filter_pending',
  active: 'li_filter_active',
  suspended: 'li_filter_suspended',
  retired: 'li_filter_retired',
} as const;

const STATE_KEYS = {
  pending: 'li_state_pending',
  active: 'li_state_active',
  suspended: 'li_state_suspended',
  retired: 'li_state_retired',
} as const;

type TranslationFn = (key: TranslationKey) => string;

const STATE_TONES: Record<ListingStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-200',
  active: 'bg-emerald-500/20 text-emerald-300',
  suspended: 'bg-orange-500/20 text-orange-200',
  retired: 'bg-slate-500/20 text-slate-300',
};

const PROBLEM_KEYS: Record<ListingProblem, TranslationKey> = {
  name_en_required: 'li_problem_name_en_required',
  city_required: 'li_problem_city_required',
  category_unknown: 'li_problem_category_unknown',
  price_mode_needs_price: 'li_problem_price_mode_needs_price',
  price_negative: 'li_problem_price_negative',
  usd_and_mmk_both_set: 'li_problem_usd_and_mmk_both_set',
  open_times_required: 'li_problem_open_times_required',
  hotel_times_required: 'li_problem_hotel_times_required',
  time_format_invalid: 'li_problem_time_format_invalid',
  photo_quota_reached: 'li_problem_photo_quota_reached',
};

const CSV_COLUMNS: CsvColumn<ListingRow>[] = [
  { header: 'id', value: (row) => row.id },
  { header: 'name_en', value: (row) => row.name_en },
  { header: 'name_mm', value: (row) => row.name_mm },
  { header: 'category', value: (row) => row.category },
  { header: 'city_id', value: (row) => row.city_id },
  { header: 'status', value: (row) => row.status },
  { header: 'price_from_mmk', value: (row) => row.price_from_mmk },
  { header: 'price_from_usd', value: (row) => row.price_from_usd },
  { header: 'photo_quota', value: (row) => row.photo_quota },
  { header: 'first_approved_at', value: (row) => row.first_approved_at },
  { header: 'updated_at', value: (row) => row.updated_at },
];

const PRICE_KEYS = {
  hidden: 'li_price_hidden',
  after_payment: 'li_price_after_payment',
  public: 'li_price_public',
} as const;

function draftFor(row: ListingRow): ListingDraft {
  return {
    name_en: row.name_en,
    name_mm: row.name_mm,
    description_en: row.description_en,
    description_mm: row.description_mm,
    address: row.address,
    category: row.category,
    city_id: row.city_id,
    open_time: row.open_time,
    close_time: row.close_time,
    checkin_time: row.checkin_time,
    checkout_time: row.checkout_time,
    price_display: row.price_display,
    price_from_mmk: row.price_from_mmk,
    price_from_usd: row.price_from_usd,
    booking_flow_mode: row.booking_flow_mode,
  };
}

function priceLabel(t: TranslationFn, row: ListingRow): string {
  if (row.price_display === 'hidden') return t(PRICE_KEYS.hidden);
  if (row.price_from_usd !== null) return formatUsd(row.price_from_usd);
  if (row.price_from_mmk !== null) return formatMmk(row.price_from_mmk);
  return '—';
}

/** Splits a `HH:MM` input into what Postgres `time` accepts, or null. */
function timeValue(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function ListingsPanel() {
  const { t } = useLanguage();
  const { user, adminRole } = useAuth();
  const { rows, save } = useListings();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ListingDraft | null>(null);
  // §3A.2 rule 7: retiring a listing asks for a reason, so the audit row says
  // why the shop left the catalog.
  const [retiring, setRetiring] = useState<ListingRow | null>(null);

  const mayApprove = canApproveListings(adminRole);
  const mayEdit = canEditListing(adminRole);
  const isStaff = mayApprove;

  // An Owner reads only their own shop's rows (§16B.1). The account name is the
  // owner id the row stores, so the scope follows the signed-in account.
  const visible = useMemo(() => {
    const scoped = listingsForViewer(rows, { ownerId: user?.name ?? null, isStaff });
    const needle = query.trim().toLowerCase();
    return scoped.filter((row) => {
      if (filter !== 'all' && row.status !== filter) return false;
      if (!needle) return true;
      return `${row.name_en} ${row.name_mm ?? ''} ${row.id} ${row.city_id}`.toLowerCase().includes(needle);
    });
  }, [rows, isStaff, user?.name, query, filter]);

  const totals = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((row) => row.status === 'pending').length,
      active: rows.filter((row) => row.status === 'active').length,
    }),
    [rows],
  );

  function writeRow(
    next: ListingRow,
    action: 'approved' | 'updated',
    noticeTitle: TranslationKey,
    noticeBody: TranslationKey,
    reason?: string,
  ) {
    save(rows.map((row) => (row.id === next.id ? next : row)));
    // §16B.2: every admin write records one row.
    recordAdminAudit({
      actor: user?.name ?? '',
      actorRole: adminRole ?? 'system',
      action,
      objectType: 'listing',
      objectId: next.id,
      summary: reason ? `${next.name_en} · ${next.status} · ${reason}` : `${next.name_en} · ${next.status}`,
      source: 'listings',
    });
    pushAdminNotice({
      title: t(noticeTitle),
      message: t(noticeBody).replace('{name}', next.name_en || next.id),
    });
    // The owner is a traveler-facing recipient, so the feed row carries both
    // languages (§16B.4) rather than the admin's current one.
    if (next.owner_id) {
      pushFeedEvent('listing_status', {
        title: translatePair(noticeTitle),
        message: fillPair(noticeBody, { name: next.name_en || next.id }),
        recipients: [{ kind: 'user', value: next.owner_id }],
      });
    }
  }

  function setStatus(row: ListingRow, status: ListingStatus, reason?: string) {
    // Approval stamps the row, which is what makes an owner's later edit stay
    // live (§9). Only staff reach this function.
    const next: ListingRow = {
      ...row,
      status,
      first_approved_at:
        status === 'active' && row.first_approved_at === null
          ? new Date().toISOString()
          : row.first_approved_at,
      updated_at: new Date().toISOString(),
    };
    writeRow(
      next,
      status === 'active' ? 'approved' : 'updated',
      status === 'active' ? 'li_notice_approved_title' : 'li_notice_updated_title',
      status === 'active' ? 'li_notice_approved_body' : 'li_notice_updated_body',
      reason,
    );
  }

  function saveDraft() {
    if (!draft || !editingId) return;
    const current = rows.find((row) => row.id === editingId);
    if (!current) return;
    if (listingDraftProblems(draft).length > 0) return;
    const next = applyListingDraft(current, draft, { isStaff });
    writeRow(next, 'updated', 'li_notice_updated_title', 'li_notice_updated_body');
    setEditingId(null);
    setDraft(null);
  }

  const problems: ListingProblem[] = draft ? listingDraftProblems(draft) : [];

  return (
    <div className="mx-auto max-w-[1150px] space-y-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('li_kicker')}</p>
          <h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('li_title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{t('li_intro')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-[#2b527d] bg-[#0b203b] px-2.5 py-1.5">
            <Search size={14} className="text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('li_search')}
              aria-label={t('li_search')}
              className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-500"
            />
          </label>
          {/* §3A.14: the export writes the filtered rows, not the whole table. */}
          <CsvExportButton section="listings" columns={CSV_COLUMNS} rows={visible} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Stat label={t('li_stat_total')} value={String(totals.total)} />
        <Stat label={t('li_stat_pending')} value={String(totals.pending)} />
        <Stat label={t('li_stat_active')} value={String(totals.active)} />
      </div>

      <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#244668] p-2">
          {FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${filter === option ? 'bg-[#168df4] text-white' : 'border border-[#2b527d] text-slate-300 hover:bg-white/5'}`}
            >
              {t(FILTER_KEYS[option])}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-[11px]">
            <thead className="bg-[#091a31] text-slate-300">
              <tr>
                <th className="px-3 py-2">{t('li_col_name')}</th>
                <th className="px-2 py-2">{t('li_col_category')}</th>
                <th className="px-2 py-2">{t('li_col_city')}</th>
                <th className="px-2 py-2">{t('li_col_price')}</th>
                <th className="px-2 py-2">{t('li_col_photos')}</th>
                <th className="px-2 py-2">{t('li_col_state')}</th>
                <th className="px-3 py-2">{t('li_col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id} className="border-t border-[#1d3a5c] text-slate-200">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-white">{row.name_en}</p>
                    <p className="text-[10px] text-slate-400">{row.name_mm ?? row.id}</p>
                  </td>
                  <td className="px-2 py-2 text-slate-300">{row.category}</td>
                  <td className="px-2 py-2 text-slate-300">{row.city_id}</td>
                  <td className="px-2 py-2">{priceLabel(t, row)}</td>
                  <td className="px-2 py-2 text-slate-300">{row.photo_quota}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${STATE_TONES[row.status]}`}>
                      {t(STATE_KEYS[row.status])}
                    </span>
                    <p className="mt-1 text-[9px] text-slate-500">
                      {row.first_approved_at
                        ? t('li_approved_on').replace('{date}', row.first_approved_at.slice(0, 10))
                        : t('li_never_approved')}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {mayEdit ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(row.id);
                            setDraft(draftFor(row));
                          }}
                          className="flex items-center gap-1 rounded border border-[#2b527d] px-2 py-1 text-[10px] hover:bg-white/5"
                        >
                          <Pencil size={11} /> {t('li_edit')}
                        </button>
                      ) : null}
                      {mayApprove && row.status !== 'active' ? (
                        <button
                          type="button"
                          onClick={() => setStatus(row, 'active')}
                          className="flex items-center gap-1 rounded bg-emerald-600/80 px-2 py-1 text-[10px] hover:bg-emerald-600"
                        >
                          <CheckCircle2 size={11} /> {t('li_approve')}
                        </button>
                      ) : null}
                      {mayApprove && row.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => setStatus(row, 'suspended')}
                          className="flex items-center gap-1 rounded border border-orange-400/50 px-2 py-1 text-[10px] text-orange-200 hover:bg-orange-500/10"
                        >
                          <EyeOff size={11} /> {t('li_suspend')}
                        </button>
                      ) : null}
                      {mayApprove && row.status !== 'retired' ? (
                        <button
                          type="button"
                          onClick={() => setRetiring(row)}
                          className="flex items-center gap-1 rounded border border-red-400/50 px-2 py-1 text-[10px] text-red-200 hover:bg-red-500/10"
                        >
                          <ShieldOff size={11} /> {t('li_retire')}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                    {t('li_empty')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        open={retiring !== null}
        action="retire_listing"
        objectName={retiring?.name_en ?? ''}
        onCancel={() => setRetiring(null)}
        onConfirm={(reason) => {
          if (retiring) setStatus(retiring, 'retired', reason);
          setRetiring(null);
        }}
      />

      {draft && editingId ? (
        <section className="rounded-lg border border-[#294d76] bg-[#0b203b] p-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#244668] pb-2">
            <h2 className="text-sm font-bold text-white">{t('li_edit_title')}</h2>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setDraft(null);
              }}
              className="text-slate-400 hover:text-white"
              aria-label={t('li_cancel')}
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Field label={t('li_field_name_en')}>
              <input
                value={draft.name_en}
                onChange={(event) => setDraft({ ...draft, name_en: event.target.value })}
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              />
            </Field>
            <Field label={t('li_field_name_mm')}>
              <input
                value={draft.name_mm ?? ''}
                onChange={(event) => setDraft({ ...draft, name_mm: event.target.value || null })}
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              />
            </Field>
            <Field label={t('li_field_desc_en')}>
              <input
                value={draft.description_en ?? ''}
                onChange={(event) => setDraft({ ...draft, description_en: event.target.value || null })}
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              />
            </Field>
            <Field label={t('li_field_desc_mm')}>
              <input
                value={draft.description_mm ?? ''}
                onChange={(event) => setDraft({ ...draft, description_mm: event.target.value || null })}
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              />
            </Field>
            <Field label={t('li_field_address')}>
              <input
                value={draft.address ?? ''}
                onChange={(event) => setDraft({ ...draft, address: event.target.value || null })}
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              />
            </Field>
            <Field label={t('li_field_city')}>
              <input
                value={draft.city_id}
                onChange={(event) => setDraft({ ...draft, city_id: event.target.value })}
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              />
            </Field>
            <Field label={t('li_field_category')}>
              <select
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value as ListingDraft['category'] })}
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              >
                {LISTING_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('li_field_price_display')}>
              <select
                value={draft.price_display}
                onChange={(event) =>
                  setDraft({ ...draft, price_display: event.target.value as ListingDraft['price_display'] })
                }
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              >
                {PRICE_DISPLAY_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {t(PRICE_KEYS[mode])}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('li_field_price_usd')}>
              <input
                type="number"
                min={0}
                value={draft.price_from_usd ?? ''}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    price_from_usd: event.target.value === '' ? null : Number(event.target.value),
                    // One price, one currency: filling USD clears MMK.
                    price_from_mmk: event.target.value === '' ? draft.price_from_mmk : null,
                  })
                }
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              />
            </Field>
            <Field label={t('li_field_price_mmk')}>
              <input
                type="number"
                min={0}
                value={draft.price_from_mmk ?? ''}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    price_from_mmk: event.target.value === '' ? null : Number(event.target.value),
                    price_from_usd: event.target.value === '' ? draft.price_from_usd : null,
                  })
                }
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              />
            </Field>
            <Field label={t('li_field_open')}>
              <input
                type="time"
                value={draft.open_time ?? ''}
                onChange={(event) => setDraft({ ...draft, open_time: timeValue(event.target.value) })}
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              />
            </Field>
            <Field label={t('li_field_close')}>
              <input
                type="time"
                value={draft.close_time ?? ''}
                onChange={(event) => setDraft({ ...draft, close_time: timeValue(event.target.value) })}
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              />
            </Field>
            <Field label={t('li_field_checkin')}>
              <input
                type="time"
                value={draft.checkin_time ?? ''}
                onChange={(event) => setDraft({ ...draft, checkin_time: timeValue(event.target.value) })}
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              />
            </Field>
            <Field label={t('li_field_checkout')}>
              <input
                type="time"
                value={draft.checkout_time ?? ''}
                onChange={(event) => setDraft({ ...draft, checkout_time: timeValue(event.target.value) })}
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              />
            </Field>
            <Field label={t('li_field_flow')}>
              <select
                value={draft.booking_flow_mode}
                onChange={(event) =>
                  setDraft({ ...draft, booking_flow_mode: event.target.value as ListingDraft['booking_flow_mode'] })
                }
                className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none"
              >
                {BOOKING_FLOW_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {t(mode === 'instant' ? 'li_flow_instant' : 'li_flow_full_manual')}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {problems.length > 0 ? (
            <ul className="mt-2 space-y-1 rounded border border-amber-400/40 bg-amber-500/10 p-2 text-[10px] text-amber-100">
              {problems.map((problem) => (
                <li key={problem}>{t(PROBLEM_KEYS[problem])}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setDraft(null);
              }}
              className="rounded border border-[#2b527d] px-3 py-1 text-[11px] text-slate-300 hover:bg-white/5"
            >
              {t('li_cancel')}
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={problems.length > 0}
              className="rounded bg-[#168df4] px-3 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
            >
              {t('li_save')}
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#294d76] bg-[#0b203b] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-lg font-extrabold text-white">{value}</p>
    </div>
  );
}
