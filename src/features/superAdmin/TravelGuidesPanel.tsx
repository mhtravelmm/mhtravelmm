import { useMemo, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, CalendarDays, Compass, Edit3, EyeOff, ImagePlus, Plus, Search, Send, Trash2, X } from 'lucide-react';
import { LISTING_IDS, LISTING_INDEX, listingTitle } from '../../data/listingIndex';
import type { GuideCategory } from '../../data/travelGuideData';
import { uploadContentImage, type MediaErrorCode } from '../../lib/mediaApi';
import { addEarningForGuide } from '../../lib/guideEarningsStore';
import {
  actionForSave,
  actionLabelKey,
  appendAudit,
  auditFor,
  recordRevision,
  revisionsFor,
  type AuditEntry,
  type Revision,
} from '../../lib/contentWorkflow';
import {
  useContentAudit,
  useGuides,
  useRevisions,
  type AdminGuide,
} from '../../lib/contentStore';
import { formatScheduleLabel, myanmarWallClockToUtc, utcToMyanmarWallClock } from '../../lib/scheduleRules';
import {
  isStaleSave,
  restoreGuide,
  softDeleteGuide,
  unpublishGuide,
} from '../../lib/contentLifecycle';
import {
  createStop,
  guidePublishCheck,
  moveStop,
  sortStopsByTime,
  type GuideDraft,
  type GuideStopDraft,
} from '../../lib/guideItinerary';
import { fill } from '../../lib/fill';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { useAuditRecorder } from '../../lib/adminAudit';
import { problemMessage } from './publishProblemText';
import { pushFeedEvent } from '../../lib/notificationFeed';

const CATEGORY_KEYS: Record<GuideCategory, TranslationKey> = {
  myanmar: 'guide_category_myanmar',
  nature: 'guide_category_nature',
  adventure: 'guide_category_adventure',
  culture: 'guide_category_culture',
  food: 'guide_category_food',
  city_tour: 'guide_category_city',
};

const STATUS_KEYS: Record<GuideDraft['status'], TranslationKey> = {
  Draft: 'cw_status_draft',
  Published: 'cw_status_published',
  Scheduled: 'cw_status_scheduled',
};

const MEDIA_KEYS: Record<MediaErrorCode, TranslationKey> = {
  choose_image: 'cw_media_choose_image',
  original_too_large: 'cw_media_original_too_large',
  unreadable: 'cw_media_unreadable',
  preview_failed: 'cw_media_preview_failed',
  unsupported: 'cw_media_unsupported',
  compress_failed: 'cw_media_compress_failed',
  still_large: 'cw_media_still_large',
  r2_failed: 'cw_media_r2_failed',
  generic: 'cw_media_generic',
  unsupported_type: 'cw_media_unsupported_type',
  too_large: 'cw_media_too_large',
  video_too_long: 'cw_media_video_too_long',
  shop_required: 'cw_media_shop_required',
  quota_reached: 'cw_media_quota_reached',
};

const emptyDraft: GuideDraft = {
  titleEn: '',
  titleMm: '',
  excerptEn: '',
  excerptMm: '',
  category: 'myanmar',
  coverUrl: '/images/blog/shwedagon-evening.webp',
  author: 'MH Travel Guides',
  stops: [createStop()],
  status: 'Draft',
  scheduledDate: '',
  scheduledTime: '',
};

export function TravelGuidesPanel({ runAction }: { runAction: (label: string) => void }) {
  const { t, language } = useLanguage();
  const recordAdminAction = useAuditRecorder();
  const [guides, setGuides] = useGuides();
  const [draft, setDraft] = useState<GuideDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVersion, setEditingVersion] = useState(0);
  const [restoredFrom, setRestoredFrom] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [revisions, setRevisions] = useRevisions<GuideDraft>('guide');
  const [audit, setAudit] = useContentAudit('guide');

  const filtered = useMemo(
    () => guides.filter((guide) => `${guide.titleEn} ${guide.titleMm} ${guide.author}`.toLowerCase().includes(query.toLowerCase())),
    [guides, query],
  );

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2800);
  }

  function update<K extends keyof GuideDraft>(key: K, value: GuideDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function openNew() {
    setEditingId(null);
    setEditingVersion(0);
    setRestoredFrom(null);
    setConflict(false);
    setDraft({ ...emptyDraft, stops: [createStop()] });
    setShowEditor(true);
  }

  function openEdit(guide: AdminGuide) {
    const wall = guide.status === 'Scheduled' && guide.scheduledFor
      ? utcToMyanmarWallClock(guide.scheduledFor)
      : null;
    setEditingId(guide.id);
    setEditingVersion(guide.version);
    setRestoredFrom(null);
    setConflict(false);
    setDraft({
      titleEn: guide.titleEn,
      titleMm: guide.titleMm,
      excerptEn: guide.excerptEn,
      excerptMm: guide.excerptMm,
      category: guide.category,
      coverUrl: guide.coverUrl,
      author: guide.author,
      stops: guide.stops,
      status: guide.status,
      scheduledDate: wall?.date ?? '',
      scheduledTime: wall?.time ?? '',
    });
    setShowEditor(true);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const existing = editingId ? guides.find((guide) => guide.id === editingId) : undefined;
    // Plan §10 §7 acceptance 5: the same version guard as Blog.
    if (isStaleSave(existing, editingVersion)) {
      setConflict(true);
      return notify(problemMessage(t, { code: 'version_conflict' }));
    }
    const check = guidePublishCheck(draft, LISTING_IDS);
    if (draft.status !== 'Draft' && !check.ok) return notify(problemMessage(t, check.problems[0]));
    // Plan §10 §4: Myanmar Time in, UTC stored, same rule as Blog.
    const scheduledFor = draft.status === 'Scheduled'
      ? myanmarWallClockToUtc(draft.scheduledDate, draft.scheduledTime)
      : null;
    if (draft.status === 'Scheduled' && !scheduledFor) return notify(problemMessage(t, { code: 'schedule' }));

    const now = new Date().toISOString().slice(0, 10);
    const next: AdminGuide = {
      ...draft,
      stops: sortStopsByTime(draft.stops),
      id: editingId ?? `guide-${Date.now()}`,
      publishedAt: draft.status === 'Published'
        ? now
        : (existing?.publishedAt ?? ''),
      scheduledFor,
      deletedAt: existing?.deletedAt ?? null,
      version: (existing?.version ?? 0) + 1,
      views: existing?.views ?? 0,
    };
    setGuides((current) => (editingId ? current.map((guide) => (guide.id === editingId ? next : guide)) : [next, ...current]));
    setRevisions((current) => recordRevision(current, {
      id: `rev-${Date.now()}`,
      contentId: next.id,
      savedAt: new Date().toISOString(),
      status: next.status,
      snapshot: draft,
    }));
    setAudit((current) => appendAudit(current, {
      id: `audit-${Date.now()}`,
      contentId: next.id,
      action: restoredFrom ? 'restored' : actionForSave(next.status, !editingId),
      at: new Date().toISOString(),
      actor: draft.author || 'Travel Guide Content Admin',
    }));
    recordAdminAction({
      action: next.status === 'Draft' ? (editingId ? 'updated' : 'created') : 'published',
      objectType: 'guide',
      objectId: next.id,
      summary: next.status === 'Scheduled'
        ? `${next.titleEn} · scheduled ${next.scheduledDate} ${next.scheduledTime} (MMT)`
        : `${next.titleEn} · ${next.status}`,
      source: 'content',
    });
    if (next.status === 'Published') {
      // Plan §16B.1: the row is created here and owned by Payment Admin, so it
      // is written to the shared store rather than this panel's state.
      addEarningForGuide({
        guideId: next.id,
        guideTitle: next.titleEn,
        author: next.author,
        publishedAt: next.publishedAt,
      });
    }
    setShowEditor(false);
    setRestoredFrom(null);
    notify(draft.status === 'Published' ? t('tg_notice_published') : draft.status === 'Scheduled' ? t('tg_notice_scheduled') : t('tg_notice_draft'));
  }

  function reloadAfterConflict() {
    const row = editingId ? guides.find((guide) => guide.id === editingId) : undefined;
    setConflict(false);
    if (!row) {
      setShowEditor(false);
      return notify(t('cw_conflict_row_gone'));
    }
    openEdit(row);
    notify(fill(t('cw_conflict_reloaded'), { title: row.titleEn }));
  }

  function unpublish(guide: AdminGuide) {
    setGuides((current) => current.map((item) => (item.id === guide.id ? unpublishGuide(item) : item)));
    setAudit((current) => appendAudit(current, {
      id: `audit-${Date.now()}`,
      contentId: guide.id,
      action: 'unpublished',
      at: new Date().toISOString(),
      actor: guide.author,
    }));
    recordAdminAction({
      action: 'updated',
      objectType: 'guide',
      objectId: guide.id,
      summary: `${guide.titleEn} · unpublished to Draft`,
      source: 'content',
    });
    notify(fill(t('tg_notice_unpublished'), { title: guide.titleEn }));
  }

  function remove(guide: AdminGuide) {
    setGuides((current) => current.map((item) => (item.id === guide.id
      ? softDeleteGuide(item, new Date().toISOString())
      : item)));
    setAudit((current) => appendAudit(current, {
      id: `audit-${Date.now()}`,
      contentId: guide.id,
      action: 'deleted',
      at: new Date().toISOString(),
      actor: guide.author,
    }));
    recordAdminAction({
      action: 'deleted',
      objectType: 'guide',
      objectId: guide.id,
      summary: `${guide.titleEn} · deleted`,
      source: 'content',
    });
    notify(fill(t('tg_notice_deleted'), { title: guide.titleEn }));
  }

  function undelete(guide: AdminGuide) {
    setGuides((current) => current.map((item) => (item.id === guide.id ? restoreGuide(item) : item)));
    setAudit((current) => appendAudit(current, {
      id: `audit-${Date.now()}`,
      contentId: guide.id,
      action: 'restored',
      at: new Date().toISOString(),
      actor: guide.author,
    }));
    recordAdminAction({
      action: 'updated',
      objectType: 'guide',
      objectId: guide.id,
      summary: `${guide.titleEn} · restored from the deleted list`,
      source: 'content',
    });
    notify(fill(t('tg_notice_undeleted'), { title: guide.titleEn }));
  }

  function publish(guide: AdminGuide) {
    const check = guidePublishCheck({ ...guide, status: 'Published' }, LISTING_IDS);
    const seededWithoutListings = guide.stops.length > 0 && guide.stops.every((stop) => !stop.listingId);
    if (!check.ok && !seededWithoutListings) return notify(problemMessage(t, check.problems[0]));
    setGuides((current) => current.map((item) => (item.id === guide.id
      ? {
          ...item,
          status: 'Published',
          publishedAt: new Date().toISOString().slice(0, 10),
          scheduledFor: null,
          deletedAt: null,
          version: item.version + 1,
        }
      : item)));
    setAudit((current) => appendAudit(current, {
      id: `audit-${Date.now()}`,
      contentId: guide.id,
      action: 'published',
      at: new Date().toISOString(),
      actor: guide.author,
    }));
    recordAdminAction({
      action: 'published',
      objectType: 'guide',
      objectId: guide.id,
      summary: guide.titleEn,
      source: 'content',
    });
    addEarningForGuide({
      guideId: guide.id,
      guideTitle: guide.titleEn,
      author: guide.author,
      publishedAt: new Date().toISOString().slice(0, 10),
    });
    pushFeedEvent('guide_published', {
      title: t('tg_feed_published_title'),
      message: fill(t('tg_feed_published_body'), { title: guide.titleEn }),
      href: `/travel-guide/${guide.id}`,
    });
    notify(fill(t('tg_notice_now_published'), { title: guide.titleEn }));
  }

  return (
    <div className="mx-auto max-w-[1320px] space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('tg_kicker')}</p>
          <h1 className="mt-1 text-2xl font-extrabold text-white">{t('tg_title')}</h1>
          <p className="mt-1 max-w-2xl text-[11px] text-slate-400">{t('tg_intro')}</p>
        </div>
        <button type="button" onClick={openNew} className="inline-flex items-center gap-1.5 rounded-md bg-[#168df4] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#2aa6ff]"><Plus size={14} /> {t('tg_new')}</button>
      </div>

      {notice && <div role="status" className="rounded-md border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-[11px] text-cyan-100">{notice}</div>}

      <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
        <div className="flex items-center gap-2 border-b border-[#244668] p-3">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-[#2b527d] bg-[#081a31] px-2.5 py-1.5">
            <Search size={14} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('tg_search')} aria-label={t('tg_search')} className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-[11px]">
            <thead className="bg-[#091a31] text-slate-300">
              <tr>
                <th className="px-3 py-2.5">{t('tg_col_guide')}</th>
                <th className="px-2 py-2.5">{t('tg_col_category')}</th>
                <th className="px-2 py-2.5">{t('tg_col_stops')}</th>
                <th className="px-2 py-2.5">{t('tg_col_author')}</th>
                <th className="px-2 py-2.5">{t('tg_col_status')}</th>
                <th className="px-3 py-2.5">{t('tg_col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((guide) => (
                <tr key={guide.id} className={`border-t border-[#1d3a5c] text-slate-200 ${guide.deletedAt ? 'opacity-55' : ''}`}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <img src={guide.coverUrl} alt="" className="h-9 w-14 rounded object-cover" />
                      <div>
                        <p className="font-semibold text-white">{guide.titleEn}</p>
                        {guide.deletedAt && <p className="text-[9px] text-red-300">{t('cw_deleted_marker')}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-slate-400">{t(CATEGORY_KEYS[guide.category])}</td>
                  <td className="px-2 py-2.5 text-slate-400">{guide.stops.length}</td>
                  <td className="px-2 py-2.5">{guide.author}</td>
                  <td className="px-2 py-2.5">
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${guide.status === 'Published' ? 'bg-green-500/20 text-green-300' : guide.status === 'Scheduled' ? 'bg-purple-500/20 text-purple-300' : 'bg-amber-500/20 text-amber-300'}`}>{t(STATUS_KEYS[guide.status])}</span>
                    {guide.status === 'Scheduled' && guide.scheduledFor && (
                      <p className="mt-1 text-[9px] text-slate-500">{formatScheduleLabel(guide.scheduledFor, language)}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openEdit(guide)} className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-cyan-300" aria-label={fill(t('tg_aria_edit'), { title: guide.titleEn })}><Edit3 size={14} /></button>
                      {guide.status !== 'Published' && !guide.deletedAt && <button type="button" onClick={() => publish(guide)} className="rounded p-1.5 text-green-300 hover:bg-white/10" aria-label={fill(t('tg_aria_publish'), { title: guide.titleEn })}><Send size={14} /></button>}
                      {guide.status === 'Published' && !guide.deletedAt && <button type="button" onClick={() => unpublish(guide)} className="rounded p-1.5 text-amber-300 hover:bg-white/10" aria-label={fill(t('tg_aria_unpublish'), { title: guide.titleEn })}><EyeOff size={14} /></button>}
                      <button type="button" onClick={() => (guide.deletedAt ? undelete(guide) : remove(guide))} className={`rounded p-1.5 hover:bg-white/10 ${guide.deletedAt ? 'text-cyan-300' : 'text-red-300'}`} aria-label={fill(t(guide.deletedAt ? 'tg_aria_undelete' : 'tg_aria_delete'), { title: guide.titleEn })}><Trash2 size={14} /></button>
                      <button type="button" onClick={() => runAction(`${t('tg_aria_preview')} ${guide.titleEn}`)} className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-cyan-300" aria-label={fill(t('tg_aria_preview'), { title: guide.titleEn })}><Compass size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-6 text-center text-xs text-slate-500">{t('tg_empty')}</p>}
        </div>
      </section>

      {showEditor && (
        <GuideEditor
          draft={draft}
          editing={Boolean(editingId)}
          onChange={update}
          onStops={(stops) => update('stops', stops)}
          onClose={() => setShowEditor(false)}
          onSubmit={save}
          history={editingId ? revisionsFor(revisions, editingId) : []}
          auditTrail={editingId ? auditFor(audit, editingId) : []}
          onRestore={(snapshot, revisionId) => {
            setDraft(snapshot);
            setRestoredFrom(revisionId);
          }}
          conflict={conflict}
          onReload={reloadAfterConflict}
        />
      )}
    </div>
  );
}

function GuideEditor({ draft, editing, onChange, onStops, onClose, onSubmit, history, auditTrail, onRestore, conflict, onReload }: {
  draft: GuideDraft;
  editing: boolean;
  onChange: <K extends keyof GuideDraft>(key: K, value: GuideDraft[K]) => void;
  onStops: (stops: GuideStopDraft[]) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  history: Revision<GuideDraft>[];
  auditTrail: AuditEntry[];
  onRestore: (snapshot: GuideDraft, revisionId: string) => void;
  conflict: boolean;
  onReload: () => void;
}) {
  const { t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const check = guidePublishCheck(draft, LISTING_IDS);

  async function upload(file: File | undefined, stopId?: string) {
    if (!file) return;
    setUploading(true);
    setUploadMessage(t('cw_compress'));
    const result = await uploadContentImage(file, 'guide-stops');
    setUploading(false);
    if (!result.ok) return setUploadMessage(t(MEDIA_KEYS[result.code]));
    if (stopId) onStops(draft.stops.map((stop) => (stop.id === stopId ? { ...stop, imageUrl: result.url } : stop)));
    else onChange('coverUrl', result.url);
    setUploadMessage(fill(t('cw_upload_ok'), {
      size: Math.max(1, Math.round(result.bytes / 1024)),
      target: result.source === 'r2' ? fill(t('cw_upload_target_r2'), { folder: 'guide-stops' }) : t('cw_upload_target_preview'),
    }));
  }

  function replaceStop(next: GuideStopDraft) {
    onStops(draft.stops.map((stop) => (stop.id === next.id ? next : stop)));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-3">
      <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-xl border border-[#315985] bg-[#081a31] shadow-2xl sm:rounded-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#244668] bg-[#081a31] px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('tg_editor_kicker')}</p>
            <h2 className="mt-0.5 text-base font-extrabold text-white">{editing ? t('tg_editor_edit') : t('tg_editor_new')}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={t('cw_editor_close')}><X size={17} /></button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3 p-4 md:grid-cols-2">
          <div className="space-y-2.5">
            <Field label={t('cw_field_title_en')} value={draft.titleEn} onChange={(value) => onChange('titleEn', value)} />
            <Field label={t('cw_field_title_mm')} value={draft.titleMm} onChange={(value) => onChange('titleMm', value)} />
            <TextField label={t('cw_field_excerpt_en')} value={draft.excerptEn} onChange={(value) => onChange('excerptEn', value)} />
            <TextField label={t('cw_field_excerpt_mm')} value={draft.excerptMm} onChange={(value) => onChange('excerptMm', value)} />

            <div className="rounded-md border border-[#2b527d] bg-[#0b203b] p-2.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-200">{t('tg_itinerary')}</span>
                <button type="button" onClick={() => onStops([...draft.stops, createStop()])} className="inline-flex items-center gap-1 rounded bg-cyan-400/15 px-2 py-1 text-[9px] font-bold text-cyan-200"><Plus size={11} /> {t('tg_add_stop')}</button>
              </div>

              <ol className="space-y-2">
                {draft.stops.map((stop, index) => (
                  <li key={stop.id} className="rounded border border-[#244668] p-2">
                    <div className="mb-1.5 flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold text-slate-500">{fill(t('tg_stop_n'), { count: index + 1 })}</span>
                      <div className="flex gap-0.5">
                        <button type="button" onClick={() => onStops(moveStop(draft.stops, index, -1))} disabled={index === 0} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-cyan-200 disabled:opacity-30" aria-label={fill(t('tg_aria_move_up'), { count: index + 1 })}><ArrowUp size={12} /></button>
                        <button type="button" onClick={() => onStops(moveStop(draft.stops, index, 1))} disabled={index === draft.stops.length - 1} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-cyan-200 disabled:opacity-30" aria-label={fill(t('tg_aria_move_down'), { count: index + 1 })}><ArrowDown size={12} /></button>
                        <button type="button" onClick={() => onStops(draft.stops.filter((item) => item.id !== stop.id))} className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-red-300" aria-label={fill(t('tg_aria_remove_stop'), { count: index + 1 })}><Trash2 size={12} /></button>
                      </div>
                    </div>

                    <div className="grid gap-1.5 sm:grid-cols-[88px_minmax(0,1fr)]">
                      <input type="time" value={stop.time} onChange={(event) => replaceStop({ ...stop, time: event.target.value })} aria-label={fill(t('tg_aria_stop_time'), { count: index + 1 })} className="h-8 rounded border border-[#2b527d] bg-[#081a31] px-2 text-[11px] text-white outline-none" />
                      <select value={stop.listingId} onChange={(event) => replaceStop({ ...stop, listingId: event.target.value })} aria-label={fill(t('tg_aria_stop_listing'), { count: index + 1 })} className="h-8 rounded border border-[#2b527d] bg-[#081a31] px-2 text-[11px] text-white outline-none">
                        <option value="">{t('tg_choose_listing')}</option>
                        {LISTING_INDEX.map((listing) => <option key={listing.id} value={listing.id}>{listing.title}</option>)}
                      </select>
                    </div>
                    {stop.listingId && <p className="mt-1 text-[9px] text-slate-500">{fill(t('tg_directions_uses'), { title: listingTitle(stop.listingId) })}</p>}

                    <div className="mt-1.5 grid gap-1.5">
                      <input value={stop.titleEn} onChange={(event) => replaceStop({ ...stop, titleEn: event.target.value })} placeholder={t('tg_ph_stop_title_en')} aria-label={t('tg_ph_stop_title_en')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none placeholder:text-slate-600" />
                      <input value={stop.titleMm} onChange={(event) => replaceStop({ ...stop, titleMm: event.target.value })} placeholder={t('tg_ph_stop_title_mm')} aria-label={t('tg_ph_stop_title_mm')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none placeholder:text-slate-600" />
                      <textarea value={stop.descriptionEn} onChange={(event) => replaceStop({ ...stop, descriptionEn: event.target.value })} rows={2} placeholder={t('tg_ph_stop_desc_en')} aria-label={t('tg_ph_stop_desc_en')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none placeholder:text-slate-600" />
                      <textarea value={stop.descriptionMm} onChange={(event) => replaceStop({ ...stop, descriptionMm: event.target.value })} rows={2} placeholder={t('tg_ph_stop_desc_mm')} aria-label={t('tg_ph_stop_desc_mm')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none placeholder:text-slate-600" />
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5">
                      {stop.imageUrl && <img src={stop.imageUrl} alt="" className="h-9 w-14 rounded object-cover" />}
                      <label className="inline-flex cursor-pointer items-center gap-1 rounded bg-cyan-400/15 px-2 py-1 text-[9px] font-bold text-cyan-200">
                        <ImagePlus size={11} /> {stop.imageUrl ? t('tg_replace_photo') : t('tg_stop_photo')}
                        <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={(event) => { void upload(event.target.files?.[0], stop.id); event.currentTarget.value = ''; }} />
                      </label>
                      {stop.imageUrl && (
                        <button type="button" onClick={() => replaceStop({ ...stop, imageUrl: '' })} className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-red-300" aria-label={fill(t('tg_aria_remove_stop_photo'), { count: index + 1 })}><Trash2 size={11} /></button>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
              {draft.stops.length > 1 && (
                <button type="button" onClick={() => onStops(sortStopsByTime(draft.stops))} className="mt-2 rounded border border-cyan-300/40 px-2 py-1 text-[9px] font-bold text-cyan-200">{t('tg_sort_by_time')}</button>
              )}
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block">
              <span className="mb-1 block text-[9px] font-semibold text-slate-300">{t('tg_category_required')}</span>
              <select value={draft.category} onChange={(event) => onChange('category', event.target.value as GuideCategory)} className="h-8 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 text-[11px] text-white outline-none">
                {(Object.keys(CATEGORY_KEYS) as GuideCategory[]).map((key) => <option key={key} value={key}>{t(CATEGORY_KEYS[key])}</option>)}
              </select>
            </label>

            <Field label={t('cw_field_author_required')} value={draft.author} onChange={(value) => onChange('author', value)} />

            <label className="block">
              <span className="mb-1 block text-[9px] font-semibold text-slate-300">{t('cw_field_cover')}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { void upload(event.target.files?.[0]); event.currentTarget.value = ''; }} className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1.5 text-[10px] text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-cyan-400 file:px-2 file:py-1 file:text-[9px] file:font-bold file:text-[#061426]" />
            </label>
            {draft.coverUrl && <img src={draft.coverUrl} alt="" className="h-20 w-full rounded object-cover" />}
            {uploadMessage && <p className="text-[9px] text-cyan-200">{uploadMessage}</p>}

            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="mb-1 block text-[9px] font-semibold text-slate-300">{t('cw_publish_date')}</span>
                <input type="date" value={draft.scheduledDate} onChange={(event) => onChange('scheduledDate', event.target.value)} className="h-8 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 text-[11px] text-white outline-none" />
              </label>
              <label>
                <span className="mb-1 block text-[9px] font-semibold text-slate-300">{t('cw_publish_time')}</span>
                <input type="time" value={draft.scheduledTime} onChange={(event) => onChange('scheduledTime', event.target.value)} className="h-8 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 text-[11px] text-white outline-none" />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-[9px] font-semibold text-slate-300">{t('cw_status')}</span>
              <select value={draft.status} onChange={(event) => onChange('status', event.target.value as GuideDraft['status'])} className="h-8 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 text-[11px] text-white outline-none">
                {(['Draft', 'Published', 'Scheduled'] as GuideDraft['status'][]).map((status) => (
                  <option key={status} value={status}>{t(STATUS_KEYS[status])}</option>
                ))}
              </select>
            </label>

            {(history.length > 0 || auditTrail.length > 0) && (
              <div className="rounded-md border border-[#2b527d] bg-[#0b203b] p-2.5">
                <p className="text-[10px] font-bold text-cyan-200">{t('cw_history')}</p>
                {auditTrail.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 text-[9px] text-slate-400">
                    {auditTrail.slice(0, 4).map((entry) => (
                      <li key={entry.id}>{t(actionLabelKey(entry.action))} · {entry.actor} · {entry.at.slice(0, 16).replace('T', ' ')}</li>
                    ))}
                  </ul>
                )}
                {history.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {history.slice(0, 3).map((revision) => (
                      <div key={revision.id} className="flex items-center justify-between gap-2 rounded bg-[#081a31] px-1.5 py-1">
                        <span className="text-[9px] text-slate-400">{revision.status} · {revision.savedAt.slice(0, 16).replace('T', ' ')}</span>
                        <button type="button" onClick={() => onRestore(revision.snapshot, revision.id)} className="rounded border border-cyan-300/40 px-1.5 py-0.5 text-[9px] font-bold text-cyan-200">{t('cw_restore')}</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {conflict && (
              <div role="alert" className="rounded-md border border-red-400/40 bg-red-500/10 px-2.5 py-2 text-[10px] text-red-100">
                <p className="font-bold">{t('cw_problem_version_conflict')}</p>
                <button type="button" onClick={onReload} className="mt-1.5 rounded border border-red-300/50 px-2 py-1 text-[10px] font-bold text-red-100 hover:bg-red-500/20">{t('cw_conflict_reload')}</button>
              </div>
            )}

            <div className={`rounded-md border px-2.5 py-2 text-[10px] ${check.ok ? 'border-green-400/30 bg-green-500/10 text-green-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-100'}`}>
              <p className="font-bold">{check.ok ? t('cw_ready_publish') : fill(t('cw_checks_left'), { count: check.problems.length })}</p>
              {!check.ok && (
                <ul className="mt-1 list-disc space-y-0.5 pl-3.5">
                  {check.problems.map((problem) => <li key={problem.code}>{problemMessage(t, problem)}</li>)}
                </ul>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#244668] pt-3 md:col-span-2">
            <button type="button" onClick={onClose} className="rounded border border-[#2b527d] px-3 py-1.5 text-[10px] font-semibold text-slate-300">{t('cw_cancel')}</button>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded bg-[#168df4] px-4 py-1.5 text-[10px] font-bold text-white">
              <CalendarDays size={13} />{draft.status === 'Published' ? t('cw_publish') : draft.status === 'Scheduled' ? t('cw_schedule') : t('cw_save_draft')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-semibold text-slate-300">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-8 w-full rounded border border-[#2b527d] bg-[#081a31] px-2.5 text-[11px] text-white outline-none placeholder:text-slate-600" />
    </label>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-semibold text-slate-300">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={2} className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2.5 py-1.5 text-[11px] text-white outline-none placeholder:text-slate-600" />
    </label>
  );
}
