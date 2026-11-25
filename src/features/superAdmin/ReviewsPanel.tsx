import { useMemo, useState } from 'react';
import { Star, Flag, EyeOff, RotateCcw, Trash2 } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useAuditRecorder } from '../../lib/adminAudit';
import { pushAdminNotice } from '../../lib/adminNotices';
import type { TranslationKey } from '../../lib/translations';
import { canOpenSection, type WorkspaceSection } from '../../lib/adminWorkspace';
import {
  LISTING_REPORT_THRESHOLD,
  RATING_ADJUSTMENT_MAX,
  RATING_ADJUSTMENT_MIN,
  adjustedRating,
  adminReviews,
  clampAdjustment,
  deleteReview,
  hideReview,
  listingReports,
  restoreReview,
  reviewQueue,
  reviewSummary,
  type AdminReviewRow,
  type ReviewQueueFilter,
  type ReviewReason,
} from '../../lib/adminReviews';
import { useCollection } from '../../lib/collection';
import { ConfirmDialog, CsvExportButton, NotAllowedState } from './shared/DashboardPieces';
import type { CsvColumn } from '../../lib/dashboardPieces';
import {
  EmptyState,
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
  statusTone,
} from './shared/sectionStyles';


/**
 * Plan §11 and §3A.10, ticket O-65. The moderation queue: reported and
 * auto-hidden reviews with hide, restore and delete, plus the listing reports
 * with the rating-adjustment control (−1.5 to 0).
 *
 * §11: a reporter is never told what happened, so nothing here writes a feed
 * row for a traveler. Deleting is soft, so an audit row still resolves.
 */

const REASON_KEYS: Record<ReviewReason, TranslationKey> = {
  spam: 'rv_reason_spam',
  abusive: 'rv_reason_abusive',
  off_topic: 'rv_reason_off_topic',
  fake: 'rv_reason_fake',
  personal_information: 'rv_reason_personal_information',
  other: 'rv_reason_other',
};

const STATUS_KEYS: Record<string, TranslationKey> = {
  visible: 'sec_status_visible',
  hidden: 'sec_status_hidden',
  deleted: 'sec_status_deleted',
};

const CSV_COLUMNS: CsvColumn<AdminReviewRow>[] = [
  { header: 'id', value: (row) => row.id },
  { header: 'listing_id', value: (row) => row.listing_id },
  { header: 'listing', value: (row) => row.listing_name },
  { header: 'author', value: (row) => row.author_name },
  { header: 'rating', value: (row) => row.rating },
  { header: 'body', value: (row) => row.body },
  { header: 'status', value: (row) => row.status },
  { header: 'reports', value: (row) => row.reports },
  { header: 'reasons', value: (row) => row.reasons.join('|') },
  { header: 'auto_hidden', value: (row) => (row.auto_hidden ? 'yes' : 'no') },
  { header: 'moderated_by', value: (row) => row.moderated_by },
  { header: 'moderated_at', value: (row) => row.moderated_at },
  { header: 'created_at', value: (row) => row.created_at },
];

export function ReviewsPanel() {
  const { t } = useLanguage();
  const { adminRole, user } = useAuth();
  const audit = useAuditRecorder();
  const { rows, save } = useCollection(adminReviews);

  const [filter, setFilter] = useState<ReviewQueueFilter>('reported');
  const [deleteTarget, setDeleteTarget] = useState<AdminReviewRow | null>(null);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});

  const allowed = canOpenSection(adminRole, 'reviews' as WorkspaceSection);
  const queue = useMemo(() => reviewQueue(rows, filter), [rows, filter]);
  const summary = reviewSummary(rows);
  const reports = useMemo(() => listingReports(rows), [rows]);

  if (!allowed) return <NotAllowedState />;

  function writeRow(next: AdminReviewRow, line: string) {
    save(rows.map((row) => (row.id === next.id ? next : row)));
    audit({ action: 'updated', objectType: 'review', objectId: next.id, summary: line, source: 'reviews' });
    pushAdminNotice({ title: t('rv_notice_hidden_title'), message: t('rv_notice_hidden_body').replace('{name}', next.author_name) });
  }

  function hide(row: AdminReviewRow) {
    const next = hideReview(row, user?.name ?? 'staff', 'Hidden from the queue');
    writeRow(next, `${row.listing_name} · ${row.author_name} · hidden`);
    pushAdminNotice({ title: t('rv_notice_hidden_title'), message: t('rv_notice_hidden_body').replace('{name}', row.author_name) });
  }

  function restore(row: AdminReviewRow) {
    const next = restoreReview(row, user?.name ?? 'staff');
    writeRow(next, `${row.listing_name} · ${row.author_name} · restored`);
    pushAdminNotice({ title: t('rv_notice_restored_title'), message: t('rv_notice_restored_body').replace('{name}', row.author_name) });
  }

  function remove(row: AdminReviewRow, reason: string) {
    const next = deleteReview(row, user?.name ?? 'staff', reason);
    writeRow(next, `${row.listing_name} · ${row.author_name} · deleted · ${reason}`);
    pushAdminNotice({ title: t('rv_notice_deleted_title'), message: t('rv_notice_deleted_body').replace('{name}', row.author_name) });
    setDeleteTarget(null);
  }

  function saveAdjustment(listingId: string, listingName: string) {
    const value = clampAdjustment(adjustments[listingId] ?? 0);
    setAdjustments((current) => ({ ...current, [listingId]: value }));
    audit({
      action: 'updated',
      objectType: 'review',
      objectId: listingId,
      summary: `${listingName} · rating adjustment ${value}`,
      source: 'reviews',
    });
    pushAdminNotice({ title: t('rv_notice_adjusted_title'), message: t('rv_notice_adjusted_body').replace('{name}', listingName).replace('{rating}', String(value)) });
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-3">
      <SectionHeader kickerKey="rv_kicker" titleKey="rv_title" introKey="rv_intro">
        <CsvExportButton section="reviews" columns={CSV_COLUMNS} rows={queue} />
      </SectionHeader>

      <div className="grid grid-cols-3 gap-2">
        <SummaryCard icon={Flag} label={t('rv_summary_reported')} value={String(summary.reported)} tone="amber" />
        <SummaryCard icon={EyeOff} label={t('rv_summary_auto_hidden')} value={String(summary.autoHidden)} tone="purple" />
        <SummaryCard icon={Star} label={t('rv_summary_average')} value={String(summary.average)} tone="cyan" />
      </div>

      <div className="flex flex-wrap gap-1">
        {(['reported', 'auto_hidden', 'all'] as ReviewQueueFilter[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${filter === value ? 'bg-[#168df4] text-white' : 'border border-[#2b527d] text-slate-300'}`}
          >
            {value === 'reported' ? t('rv_filter_reported') : value === 'auto_hidden' ? t('rv_filter_auto_hidden') : t('sa_all')}
          </button>
        ))}
      </div>

      <Panel>
        <PanelTitle icon={Flag} title={t('rv_title')} />
        {queue.length === 0 ? (
          <div className="p-3">
            <EmptyState />
          </div>
        ) : (
          <TableWrap minWidth={1000}>
            <TableHead>
              <tr>
                <Th>{t('sec_col_listing')}</Th>
                <Th>{t('sec_col_name')}</Th>
                <Th>{t('sec_col_rating')}</Th>
                <Th>{t('sec_col_reports')}</Th>
                <Th>{t('rv_reasons')}</Th>
                <Th>{t('sec_col_status')}</Th>
                <Th>{t('sec_col_date')}</Th>
                <Th>{t('sec_col_actions')}</Th>
              </tr>
            </TableHead>
            <tbody>
              {queue.map((row) => (
                <TableRow key={row.id}>
                  <Td className="font-semibold text-white">{row.listing_name}</Td>
                  <Td>
                    {row.author_name}
                    <span className="mt-0.5 block max-w-[260px] truncate text-[10px] text-slate-400">{row.body}</span>
                  </Td>
                  <Td>{row.rating}</Td>
                  <Td>{row.reports}</Td>
                  <Td className="text-[10px] text-slate-400">
                    {row.reasons.length === 0 ? '—' : row.reasons.map((reason) => t(REASON_KEYS[reason])).join(', ')}
                  </Td>
                  <Td>
                    <StatusPill tone={statusTone(row.status)}>{t(STATUS_KEYS[row.status])}</StatusPill>
                    {row.auto_hidden && <span className="ml-1 text-[9px] text-purple-300">{t('rv_auto_hidden_badge')}</span>}
                  </Td>
                  <Td className="whitespace-nowrap text-slate-400">{row.created_at.slice(0, 10)}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {row.status === 'visible' ? (
                        <button type="button" onClick={() => hide(row)} className={GHOST_BUTTON}>
                          <EyeOff size={12} /> {t('rv_action_hide')}
                        </button>
                      ) : (
                        <button type="button" onClick={() => restore(row)} className={GHOST_BUTTON}>
                          <RotateCcw size={12} /> {t('rv_action_restore')}
                        </button>
                      )}
                      <button type="button" onClick={() => setDeleteTarget(row)} className={DANGER_BUTTON}>
                        <Trash2 size={12} /> {t('rv_action_delete')}
                      </button>
                    </div>
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Panel>
        <PanelTitle icon={Star} title={t('rv_listing_reports')} />
        <p className="px-3 pt-2 text-[10px] text-slate-500">{t('rv_threshold_hint')}</p>
        {reports.length === 0 ? (
          <div className="p-3">
            <EmptyState />
          </div>
        ) : (
          <TableWrap minWidth={760}>
            <TableHead>
              <tr>
                <Th>{t('sec_col_listing')}</Th>
                <Th>{t('sec_col_reports')}</Th>
                <Th>{t('sec_col_rating')}</Th>
                <Th>{t('sec_col_adjustment')}</Th>
                <Th>{t('rv_effective_rating')}</Th>
                <Th>{t('sec_col_actions')}</Th>
              </tr>
            </TableHead>
            <tbody>
              {reports.map((entry) => {
                const value = adjustments[entry.listing_id] ?? entry.adjustment;
                return (
                  <TableRow key={entry.listing_id}>
                    <Td className="font-semibold text-white">
                      {entry.listing_name}
                      {entry.reports >= LISTING_REPORT_THRESHOLD && (
                        <span className="ml-1 rounded bg-amber-400/20 px-1 text-[9px] font-bold text-amber-200">≥{LISTING_REPORT_THRESHOLD}</span>
                      )}
                    </Td>
                    <Td>{entry.reports}</Td>
                    <Td>{entry.effective_rating}</Td>
                    <Td>
                      <input
                        type="range"
                        min={RATING_ADJUSTMENT_MIN}
                        max={RATING_ADJUSTMENT_MAX}
                        step={0.1}
                        value={value}
                        aria-label={`${t('rv_rating_adjustment')} ${entry.listing_name}`}
                        onChange={(event) => setAdjustments((current) => ({ ...current, [entry.listing_id]: Number(event.target.value) }))}
                        className="w-28"
                      />
                      <span className="ml-1 text-[10px] text-slate-300">{value.toFixed(1)}</span>
                    </Td>
                    <Td className="font-bold text-cyan-300">{adjustedRating(entry.effective_rating, value)}</Td>
                    <Td>
                      <button type="button" onClick={() => saveAdjustment(entry.listing_id, entry.listing_name)} className={GHOST_BUTTON}>
                        {t('sec_save')}
                      </button>
                    </Td>
                  </TableRow>
                );
              })}
            </tbody>
          </TableWrap>
        )}
        <p className="px-3 pb-2 text-[10px] text-slate-500">{t('rv_adjustment_hint')}</p>
      </Panel>

      <ConfirmDialog
        open={deleteTarget !== null}
        action="delete"
        objectName={deleteTarget?.author_name ?? ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={(reason) => {
          if (deleteTarget) remove(deleteTarget, reason);
        }}
      />
    </div>
  );
}
