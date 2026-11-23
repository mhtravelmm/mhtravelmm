import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, CalendarDays, Edit3, Eye, EyeOff, ImagePlus, Megaphone, Plus, Search, Send, Trash2, X } from 'lucide-react';
import { uploadContentImage, type MediaErrorCode } from '../../lib/mediaApi';
import { registerMediaObject, touchMediaUrls } from '../../lib/mediaObjects';
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
  useBlogPosts,
  useContentAudit,
  useRevisions,
  type AdminPost,
} from '../../lib/contentStore';
import { formatScheduleLabel, myanmarWallClockToUtc, utcToMyanmarWallClock } from '../../lib/scheduleRules';
import {
  isStaleSave,
  restorePost,
  softDeletePost,
  unpublishPost,
} from '../../lib/contentLifecycle';
import {
  adSlotProblem,
  blogPublishCheck,
  createAdBlock,
  createImageBlock,
  createTextBlock,
  moveBlock,
  normalizeAdSlots,
  type BlogBlock,
  type BlogPostStatus,
} from '../../lib/blogBlocks';
import { fill } from '../../lib/fill';
import { normalizeTags, removeTag, tagToAdd } from '../../lib/tagList';
import {
  EMPTY_AUTOSAVE,
  afterAutosave,
  formFingerprint,
  isWritableDraft,
  shouldAutosave,
  type AutosaveState,
} from '../../lib/draftAutosave';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { useAuditRecorder } from '../../lib/adminAudit';
import { problemMessage } from './publishProblemText';
import { pushFeedEvent } from '../../lib/notificationFeed';

type FormState = {
  titleEn: string;
  titleMm: string;
  excerptEn: string;
  excerptMm: string;
  category: string;
  authorEn: string;
  authorMm: string;
  locationEn: string;
  locationMm: string;
  imageUrl: string;
  blocks: BlogBlock[];
  /** Plan §10 §1: a list. `seoTagDraft` is the text of a tag not added yet. */
  seoTags: string[];
  seoTagDraft: string;
  status: BlogPostStatus;
  scheduledDate: string;
  scheduledTime: string;
};

const CATEGORY_KEYS: Record<string, TranslationKey> = {
  travel_tips: 'blog_category_travel_tips',
  nature: 'blog_category_nature',
  food: 'blog_category_food',
  health: 'blog_category_health',
  culture: 'blog_category_culture',
  safety: 'blog_category_safety',
  others: 'blog_category_others',
};

const STATUS_KEYS: Record<BlogPostStatus, TranslationKey> = {
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

const emptyForm: FormState = {
  titleEn: '',
  titleMm: '',
  excerptEn: '',
  excerptMm: '',
  category: 'travel_tips',
  authorEn: 'MH Travel Editorial',
  authorMm: 'MH Travel Editorial',
  locationEn: '',
  locationMm: '',
  imageUrl: '/images/blog/shwedagon-evening.webp',
  blocks: [createTextBlock()],
  seoTags: [],
  seoTagDraft: '',
  status: 'Draft',
  scheduledDate: '',
  scheduledTime: '',
};

const EMPTY_FORM_FINGERPRINT = formFingerprint([
  emptyForm.titleEn, emptyForm.titleMm, emptyForm.excerptEn, emptyForm.excerptMm, emptyForm.category,
  emptyForm.authorEn, emptyForm.authorMm, emptyForm.locationEn, emptyForm.locationMm, emptyForm.imageUrl,
  emptyForm.blocks, emptyForm.seoTags, emptyForm.seoTagDraft,
]);


function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">{children}</section>;
}

function Summary({ label, value, tone }: { label: string; value: number; tone: 'blue' | 'green' | 'amber' | 'purple' }) {
  const colors = { blue: 'text-cyan-300', green: 'text-green-300', amber: 'text-amber-300', purple: 'text-purple-300' };
  return (
    <div className="rounded-lg border border-[#294d76] bg-[#0b203b] p-3">
      <p className="text-[10px] text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-extrabold ${colors[tone]}`}>{value}</p>
    </div>
  );
}

export function BlogPostsPanel({ runAction }: { runAction: (label: string) => void }) {
  const { t, language } = useLanguage();
  const recordAdminAction = useAuditRecorder();
  const [posts, setPosts] = useBlogPosts();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showEditor, setShowEditor] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | BlogPostStatus>('All');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingVersion, setEditingVersion] = useState(0);
  const [restoredFrom, setRestoredFrom] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [revisions, setRevisions] = useRevisions<FormState>('blog');
  const [audit, setAudit] = useContentAudit('blog');
  const [autosavedAt, setAutosavedAt] = useState<number | null>(null);
  const autosave = useRef<AutosaveState>(EMPTY_AUTOSAVE);
  const formRef = useRef(form);
  formRef.current = form;
  const postsRef = useRef(posts);
  postsRef.current = posts;
  const editingIdRef = useRef(editingId);
  editingIdRef.current = editingId;

  const filteredPosts = useMemo(
    () => posts.filter((post) => (statusFilter === 'All' || post.status === statusFilter)
      && `${post.titleEn} ${post.titleMm} ${post.category} ${post.authorEn} ${post.authorMm}`.toLowerCase().includes(query.toLowerCase())),
    [posts, query, statusFilter],
  );

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openNew() {
    autosave.current = EMPTY_AUTOSAVE;
    setAutosavedAt(null);
    setEditingId(null);
    setEditingVersion(0);
    setRestoredFrom(null);
    setConflict(false);
    setForm({ ...emptyForm, blocks: [createTextBlock()] });
    setShowEditor(true);
  }

  function openEdit(post: AdminPost) {
    const wall = post.status === 'Scheduled' && post.scheduledFor
      ? utcToMyanmarWallClock(post.scheduledFor)
      : null;
    const date = wall?.date ?? '';
    const time = wall?.time ?? '';
    autosave.current = EMPTY_AUTOSAVE;
    setAutosavedAt(null);
    setEditingId(post.id);
    setEditingVersion(post.version);
    setRestoredFrom(null);
    setConflict(false);
    setForm({
      ...emptyForm,
      titleEn: post.titleEn,
      titleMm: post.titleMm,
      excerptEn: post.excerptEn,
      excerptMm: post.excerptMm,
      category: post.category,
      authorEn: post.authorEn,
      authorMm: post.authorMm,
      locationEn: post.locationEn,
      locationMm: post.locationMm,
      imageUrl: post.imageUrl,
      blocks: post.blocks.length ? post.blocks : [createTextBlock()],
      seoTags: normalizeTags(post.seoTags),
      seoTagDraft: '',
      status: post.status,
      scheduledDate: date,
      scheduledTime: time,
    });
    setShowEditor(true);
  }

  /** Plan §10 §4 Concurrency: Reload takes the row as the other editor left it. */
  function reloadAfterConflict() {
    const row = editingId ? posts.find((post) => post.id === editingId) : undefined;
    setConflict(false);
    if (!row) {
      setShowEditor(false);
      return notify(t('cw_conflict_row_gone'));
    }
    openEdit(row);
    notify(fill(t('cw_conflict_reloaded'), { title: row.titleEn }));
  }

  function addCategory(label: string) {
    const slug = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    if (!slug || slug.length < 2) return notify(t('bp_category_too_short'));
    if (Object.prototype.hasOwnProperty.call(CATEGORY_KEYS, slug) || customCategories.includes(slug)) {
      return notify(t('bp_category_exists'));
    }
    setCustomCategories((current) => [...current, slug]);
    update('category', slug);
    notify(fill(t('bp_category_added'), { name: label.trim() }));
  }

  /**
   * The row a save writes. Autosave and the explicit Save share it, so a draft
   * that was autosaved and one that was saved cannot disagree about a field.
   * `status` is a parameter because autosave never changes it: publishing is an
   * explicit act, and it runs the checks in `submit`.
   */
  const composeRow = useCallback((id: string, status: BlogPostStatus, existing: AdminPost | undefined, version: number): AdminPost => {
    const form = formRef.current;
    const now = new Date().toISOString().slice(0, 10);
    return {
      id,
      titleEn: form.titleEn.trim(),
      titleMm: form.titleMm.trim(),
      excerptEn: form.excerptEn.trim(),
      excerptMm: form.excerptMm.trim(),
      category: form.category,
      // Plan §10 §2: an empty second language falls back to the one that was
      // written, so a byline is never blank on the other side of the site.
      authorEn: form.authorEn.trim() || form.authorMm.trim() || 'MH Travel Editorial',
      authorMm: form.authorMm.trim() || form.authorEn.trim() || 'MH Travel Editorial',
      locationEn: form.locationEn.trim() || form.locationMm.trim() || 'Myanmar',
      locationMm: form.locationMm.trim() || form.locationEn.trim() || 'Myanmar',
      imageUrl: form.imageUrl.trim(),
      blocks: normalizeAdSlots(form.blocks),
      seoTags: normalizeTags([...form.seoTags, form.seoTagDraft]),
      status,
      // A Scheduled post has no publish date yet; the job sets it when the
      // time arrives, so the table never shows a future post as published.
      publishedAt: status === 'Published' ? now : (existing?.publishedAt ?? ''),
      scheduledFor: status === 'Scheduled'
        ? myanmarWallClockToUtc(form.scheduledDate, form.scheduledTime)
        : null,
      deletedAt: existing?.deletedAt ?? null,
      version,
      views: existing?.views ?? 0,
      updatedAt: now,
    };
    // Reads the form through the ref so the identity stays stable: a new
    // identity per keystroke would restart the autosave timer on every
    // keystroke and the write would never come due.
  }, []);

  /**
   * Plan §10 §4 "Draft save": the draft row is written every 30 seconds with no
   * revision and no audit row — both belong to an explicit Save. Only a Draft is
   * autosaved; a Published or Scheduled post changes through `submit`, which
   * runs the publish checks and the version guard.
   *
   * The form is read through a ref so continuous typing does not restart the
   * timer and postpone the write forever. The first write of a new post creates
   * its row, so a long draft is never held only in the editor. A write advances
   * `editingVersion`, otherwise the explicit Save that follows would be refused
   * as stale against our own write.
   */
  useEffect(() => {
    if (!showEditor || conflict) return;
    const tick = window.setInterval(() => {
      const current = formRef.current;
      const fingerprint = formFingerprint([
        current.titleEn, current.titleMm, current.excerptEn, current.excerptMm, current.category,
        current.authorEn, current.authorMm, current.locationEn, current.locationMm, current.imageUrl,
        current.blocks, current.seoTags, current.seoTagDraft,
      ]);
      if (!isWritableDraft(EMPTY_FORM_FINGERPRINT, fingerprint)) return;
      const now = Date.now();
      if (!shouldAutosave(autosave.current, fingerprint, now)) return;

      const id = editingIdRef.current ?? `admin-blog-${now}`;
      const existing = postsRef.current.find((post) => post.id === id);
      if (existing && existing.status !== 'Draft') return;

      const version = (existing?.version ?? 0) + 1;
      autosave.current = afterAutosave(fingerprint, now);
      setAutosavedAt(now);
      setEditingId(id);
      setEditingVersion(version);
      setPosts((rows) => (existing
        ? rows.map((row) => (row.id === id ? composeRow(id, row.status, row, version) : row))
        : [composeRow(id, 'Draft', undefined, version), ...rows]));
    }, 5000);
    return () => window.clearInterval(tick);
  }, [showEditor, conflict, composeRow, setPosts]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const existing = editingId ? posts.find((post) => post.id === editingId) : undefined;
    // Plan §10 §7 acceptance 5: the save carries the version it loaded, so a
    // second editor cannot silently overwrite the first one's work.
    if (isStaleSave(existing, editingVersion)) {
      // The notice sits under the overlay, so the editor itself has to carry
      // the refusal and the Reload that Plan §10 §4 asks for.
      setConflict(true);
      return notify(problemMessage(t, { code: 'version_conflict' }));
    }
    const check = blogPublishCheck({
      status: form.status,
      titleEn: form.titleEn,
      titleMm: form.titleMm,
      excerptEn: form.excerptEn,
      excerptMm: form.excerptMm,
      category: form.category,
      coverUrl: form.imageUrl,
      blocks: form.blocks,
      scheduledDate: form.scheduledDate,
      scheduledTime: form.scheduledTime,
    });
    if (!check.ok) return notify(problemMessage(t, check.problems[0]));

    // Plan §10 §4: the editor collects Myanmar Time and the row stores UTC.
    // A date or time that is not a real instant is refused here rather than
    // stored, so the publishing job never sees a schedule it cannot read.
    const scheduledFor = form.status === 'Scheduled'
      ? myanmarWallClockToUtc(form.scheduledDate, form.scheduledTime)
      : null;
    if (form.status === 'Scheduled' && !scheduledFor) return notify(problemMessage(t, { code: 'schedule' }));

    const id = editingId ?? `admin-blog-${Date.now()}`;
    const next = composeRow(id, form.status, existing, (existing?.version ?? 0) + 1);

    setPosts((current) => (editingId ? current.map((post) => (post.id === editingId ? next : post)) : [next, ...current]));
    setRevisions((current) => recordRevision(current, {
      id: `rev-${Date.now()}`,
      contentId: id,
      savedAt: new Date().toISOString(),
      status: next.status,
      snapshot: form,
    }));
    setAudit((current) => appendAudit(current, {
      id: `audit-${Date.now()}`,
      contentId: id,
      action: restoredFrom ? 'restored' : actionForSave(next.status, !editingId),
      at: new Date().toISOString(),
      actor: 'Super Admin',
    }));
    recordAdminAction({
      action: next.status === 'Draft' ? (editingId ? 'updated' : 'created') : 'published',
      objectType: 'blog',
      objectId: id,
      summary: next.status === 'Scheduled'
        ? `${next.titleEn} · scheduled ${form.scheduledDate} ${form.scheduledTime} (MMT)`
        : `${next.titleEn} · ${next.status}`,
      source: 'content',
    });
    // Plan §16B.6: the save says which photos it still uses, so the nightly
    // job can tell a dropped photo from one that is simply older.
    touchMediaUrls([next.imageUrl, ...next.blocks.flatMap((block) => (block.type === 'image' ? [block.imageUrl] : []))]);
    setShowEditor(false);
    setRestoredFrom(null);
    notify(form.status === 'Published' ? t('bp_notice_published') : form.status === 'Scheduled' ? t('bp_notice_scheduled') : t('bp_notice_draft'));
  }

  /**
   * Plan §10 §4 Unpublish: back to Draft, with the publish date cleared so the
   * reader stops showing it as live and the table stops claiming a date.
   */
  function unpublish(post: AdminPost) {
    setPosts((current) => current.map((item) => (item.id === post.id ? unpublishPost(item) : item)));
    setAudit((current) => appendAudit(current, {
      id: `audit-${Date.now()}`,
      contentId: post.id,
      action: 'unpublished',
      at: new Date().toISOString(),
      actor: 'Super Admin',
    }));
    recordAdminAction({
      action: 'updated',
      objectType: 'blog',
      objectId: post.id,
      summary: `${post.titleEn} · unpublished to Draft`,
      source: 'content',
    });
    notify(fill(t('bp_notice_unpublished'), { title: post.titleEn }));
  }

  /** Plan §10 §4 Delete: soft delete, audited, and the reader drops it at once. */
  function remove(post: AdminPost) {
    setPosts((current) => current.map((item) => (item.id === post.id
      ? softDeletePost(item, new Date().toISOString())
      : item)));
    setAudit((current) => appendAudit(current, {
      id: `audit-${Date.now()}`,
      contentId: post.id,
      action: 'deleted',
      at: new Date().toISOString(),
      actor: 'Super Admin',
    }));
    recordAdminAction({
      action: 'deleted',
      objectType: 'blog',
      objectId: post.id,
      summary: `${post.titleEn} · deleted`,
      source: 'content',
    });
    notify(fill(t('bp_notice_deleted'), { title: post.titleEn }));
  }

  function undelete(post: AdminPost) {
    setPosts((current) => current.map((item) => (item.id === post.id ? restorePost(item) : item)));
    setAudit((current) => appendAudit(current, {
      id: `audit-${Date.now()}`,
      contentId: post.id,
      action: 'restored',
      at: new Date().toISOString(),
      actor: 'Super Admin',
    }));
    recordAdminAction({
      action: 'updated',
      objectType: 'blog',
      objectId: post.id,
      summary: `${post.titleEn} · restored from the deleted list`,
      source: 'content',
    });
    notify(fill(t('bp_notice_undeleted'), { title: post.titleEn }));
  }

  function publish(post: AdminPost) {
    const check = blogPublishCheck({
      status: 'Published',
      titleEn: post.titleEn,
      titleMm: post.titleMm,
      excerptEn: post.excerptEn,
      excerptMm: post.excerptMm,
      category: post.category,
      coverUrl: post.imageUrl,
      blocks: post.blocks,
      scheduledDate: '',
      scheduledTime: '',
    });
    if (!check.ok) return notify(problemMessage(t, check.problems[0]));
    setPosts((current) => current.map((item) => (item.id === post.id
      ? {
          ...item,
          status: 'Published',
          publishedAt: new Date().toISOString().slice(0, 10),
          scheduledFor: null,
          deletedAt: null,
          version: item.version + 1,
          updatedAt: new Date().toISOString().slice(0, 10),
        }
      : item)));
    setAudit((current) => appendAudit(current, {
      id: `audit-${Date.now()}`,
      contentId: post.id,
      action: 'published',
      at: new Date().toISOString(),
      actor: 'Super Admin',
    }));
    recordAdminAction({
      action: 'published',
      objectType: 'blog',
      objectId: post.id,
      summary: post.titleEn,
      source: 'content',
    });
    // Plan §16B.3: a published post is a feed row for every reader, so the bell
    // shows it without each traveler being written to one by one.
    pushFeedEvent('blog_published', {
      title: t('bp_feed_published_title'),
      message: fill(t('bp_feed_published_body'), { title: post.titleEn }),
      href: `/blogs/${post.id}`,
    });
    notify(fill(t('bp_notice_now_published'), { title: post.titleEn }));
  }

  const categoryLabel = (value: string) => (CATEGORY_KEYS[value] ? t(CATEGORY_KEYS[value]) : value.replace(/_/g, ' '));
  const filters: ('All' | BlogPostStatus)[] = ['All', 'Published', 'Draft', 'Scheduled'];

  return (
    <div className="mx-auto max-w-[1320px] space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('bp_kicker')}</p>
          <h1 className="mt-1 text-2xl font-extrabold text-white">{t('bp_title')}</h1>
        </div>
        <button type="button" onClick={openNew} className="inline-flex items-center gap-1.5 rounded-md bg-[#168df4] px-3 py-2 text-[11px] font-bold text-white hover:bg-[#2aa6ff]">
          <Plus size={14} /> {t('bp_new')}
        </button>
      </div>

      {notice && <div role="status" className="rounded-md border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-[11px] text-cyan-100">{notice}</div>}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Summary label={t('bp_summary_all')} value={posts.length} tone="blue" />
        <Summary label={t('bp_summary_published')} value={posts.filter((post) => post.status === 'Published').length} tone="green" />
        <Summary label={t('bp_summary_drafts')} value={posts.filter((post) => post.status === 'Draft').length} tone="amber" />
        <Summary label={t('bp_summary_scheduled')} value={posts.filter((post) => post.status === 'Scheduled').length} tone="purple" />
      </div>

      <Panel>
        <div className="flex flex-col gap-2 border-b border-[#244668] p-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-[#2b527d] bg-[#081a31] px-2.5 py-1.5">
            <Search size={14} className="text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('bp_search')} aria-label={t('bp_search')} className="min-w-0 flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-slate-500" />
          </div>
          <div className="flex gap-1.5">
            {filters.map((status) => (
              <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded px-2 py-1.5 text-[10px] font-bold ${statusFilter === status ? 'bg-[#168df4] text-white' : 'border border-[#2b527d] text-slate-400'}`}>{status === 'All' ? t('bp_filter_all') : t(STATUS_KEYS[status])}</button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-[11px]">
            <thead className="bg-[#091a31] text-slate-300">
              <tr>
                <th className="px-3 py-2.5">{t('bp_col_post')}</th>
                <th className="px-2 py-2.5">{t('bp_col_category')}</th>
                <th className="px-2 py-2.5">{t('bp_col_author')}</th>
                <th className="px-2 py-2.5">{t('bp_col_ad_slots')}</th>
                <th className="px-2 py-2.5">{t('bp_col_views')}</th>
                <th className="px-2 py-2.5">{t('bp_col_status')}</th>
                <th className="px-3 py-2.5">{t('bp_col_actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id} className={`border-t border-[#1d3a5c] text-slate-200 ${post.deletedAt ? 'opacity-55' : ''}`}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <img src={post.imageUrl} alt="" className="h-9 w-14 rounded object-cover" />
                      <div>
                        <p className="font-semibold text-white">{post.titleEn}</p>
                        <p className="text-[9px] text-slate-500">{fill(t('bp_block_photo'), { count: post.blocks.filter((block) => block.type === 'image').length })}</p>
                        {post.deletedAt && <p className="text-[9px] text-red-300">{t('cw_deleted_marker')}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-slate-400">{categoryLabel(post.category)}</td>
                  <td className="px-2 py-2.5">{post.authorEn}</td>
                  <td className="px-2 py-2.5 text-slate-400">{post.blocks.filter((block) => block.type === 'ad').length}</td>
                  <td className="px-2 py-2.5">{post.views.toLocaleString()}</td>
                  <td className="px-2 py-2.5">
                    <span className={`rounded-full px-2 py-1 text-[9px] font-bold ${post.status === 'Published' ? 'bg-green-500/20 text-green-300' : post.status === 'Scheduled' ? 'bg-purple-500/20 text-purple-300' : 'bg-amber-500/20 text-amber-300'}`}>{t(STATUS_KEYS[post.status])}</span>
                    {post.status === 'Scheduled' && post.scheduledFor && (
                      <p className="mt-1 text-[9px] text-slate-500">{formatScheduleLabel(post.scheduledFor, language)}</p>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openEdit(post)} className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-cyan-300" aria-label={fill(t('bp_aria_edit'), { title: post.titleEn })}><Edit3 size={14} /></button>
                      {post.status !== 'Published' && !post.deletedAt && (
                        <button type="button" onClick={() => publish(post)} className="rounded p-1.5 text-green-300 hover:bg-white/10" aria-label={fill(t('bp_aria_publish'), { title: post.titleEn })}><Send size={14} /></button>
                      )}
                      {post.status === 'Published' && !post.deletedAt && (
                        <button type="button" onClick={() => unpublish(post)} className="rounded p-1.5 text-amber-300 hover:bg-white/10" aria-label={fill(t('bp_aria_unpublish'), { title: post.titleEn })}><EyeOff size={14} /></button>
                      )}
                      <button type="button" onClick={() => (post.deletedAt ? undelete(post) : remove(post))} className={`rounded p-1.5 hover:bg-white/10 ${post.deletedAt ? 'text-cyan-300' : 'text-red-300'}`} aria-label={fill(t(post.deletedAt ? 'bp_aria_undelete' : 'bp_aria_delete'), { title: post.titleEn })}><Trash2 size={14} /></button>
                      <button type="button" onClick={() => runAction(`${t('bp_aria_preview')} ${post.titleEn}`)} className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-cyan-300" aria-label={fill(t('bp_aria_preview'), { title: post.titleEn })}><Eye size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPosts.length === 0 && <p className="p-6 text-center text-xs text-slate-500">{t('bp_empty')}</p>}
        </div>
      </Panel>

      {showEditor && (
        <Editor
          form={form}
          editing={Boolean(editingId)}
          categories={[...Object.keys(CATEGORY_KEYS), ...customCategories]}
          categoryLabel={categoryLabel}
          onAddCategory={addCategory}
          onClose={() => setShowEditor(false)}
          onSubmit={submit}
          update={update}
          history={editingId ? revisionsFor(revisions, editingId) : []}
          auditTrail={editingId ? auditFor(audit, editingId) : []}
          onRestore={(snapshot, revisionId) => {
            setForm(snapshot);
            setRestoredFrom(revisionId);
          }}
          conflict={conflict}
          onReload={reloadAfterConflict}
          autosavedAt={autosavedAt}
        />
      )}
    </div>
  );
}

function Editor({ form, editing, categories, categoryLabel, onAddCategory, onClose, onSubmit, update, history, auditTrail, onRestore, conflict, onReload, autosavedAt }: {
  form: FormState;
  editing: boolean;
  categories: string[];
  categoryLabel: (value: string) => string;
  onAddCategory: (label: string) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  update: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  history: Revision<FormState>[];
  auditTrail: AuditEntry[];
  onRestore: (snapshot: FormState, revisionId: string) => void;
  conflict: boolean;
  onReload: () => void;
  /** When the draft row was last written automatically; null before the first. */
  autosavedAt: number | null;
}) {
  const { t, language } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [blockMessage, setBlockMessage] = useState('');

  const check = blogPublishCheck({
    status: form.status,
    titleEn: form.titleEn,
    titleMm: form.titleMm,
    excerptEn: form.excerptEn,
    excerptMm: form.excerptMm,
    category: form.category,
    coverUrl: form.imageUrl,
    blocks: form.blocks,
    scheduledDate: form.scheduledDate,
    scheduledTime: form.scheduledTime,
  });

  async function upload(file: File | undefined, mode: 'cover' | 'inline') {
    if (!file) return;
    setUploading(true);
    setUploadMessage(t('cw_compress'));
    const result = await uploadContentImage(file, 'blog-posts');
    setUploading(false);
    if (!result.ok) return setUploadMessage(t(MEDIA_KEYS[result.code]));
    // Plan §16B.6: only an object that reached R2 has a row to keep alive.
    if (result.source === 'r2') {
      registerMediaObject({ key: result.key, url: result.url, folder: 'blog-posts', bytes: result.bytes, contentType: 'image/webp' });
    }
    if (mode === 'cover') update('imageUrl', result.url);
    if (mode === 'inline') update('blocks', [...form.blocks, createImageBlock(result.url)]);
    setUploadMessage(fill(t('cw_upload_ok'), {
      size: Math.max(1, Math.round(result.bytes / 1024)),
      target: result.source === 'r2' ? fill(t('cw_upload_target_r2'), { folder: 'blog-posts' }) : t('cw_upload_target_preview'),
    }));
  }

  function replaceBlock(next: BlogBlock) {
    update('blocks', form.blocks.map((block) => (block.id === next.id ? next : block)));
  }

  function removeBlock(id: string) {
    update('blocks', normalizeAdSlots(form.blocks.filter((block) => block.id !== id)));
  }

  function addAdSlot() {
    const problem = adSlotProblem(form.blocks, form.blocks.length);
    if (problem) return setBlockMessage(problemMessage(t, problem));
    setBlockMessage('');
    update('blocks', [...form.blocks, createAdBlock()]);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-3">
      <div className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-t-xl border border-[#315985] bg-[#081a31] shadow-2xl sm:rounded-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-[#244668] bg-[#081a31] px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('bp_editor_kicker')}</p>
            <h2 className="mt-0.5 text-base font-extrabold text-white">{editing ? t('bp_editor_edit') : t('bp_editor_new')}</h2>
            {autosavedAt !== null && (
              <p className="mt-0.5 text-[9px] text-slate-400" role="status">
                {fill(t('bp_autosaved_at'), { time: new Date(autosavedAt).toLocaleTimeString(language === 'mm' ? 'my-MM' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) })}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label={t('cw_editor_close')}><X size={17} /></button>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3 p-4 md:grid-cols-2">
          <div className="space-y-2.5">
            <Field label={t('cw_field_title_en')} value={form.titleEn} onChange={(value) => update('titleEn', value)} />
            <Field label={t('cw_field_title_mm')} value={form.titleMm} onChange={(value) => update('titleMm', value)} />
            <TextField label={t('cw_field_excerpt_en')} value={form.excerptEn} onChange={(value) => update('excerptEn', value)} rows={2} />
            <TextField label={t('cw_field_excerpt_mm')} value={form.excerptMm} onChange={(value) => update('excerptMm', value)} rows={2} />

            <div className="rounded-md border border-[#2b527d] bg-[#0b203b] p-2.5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
                <span className="text-[10px] font-bold text-cyan-200">{t('bp_story_flow')}</span>
                <div className="flex gap-1.5">
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded bg-cyan-400/15 px-2 py-1 text-[9px] font-bold text-cyan-200">
                    <ImagePlus size={12} /> {t('bp_add_photo')}
                    <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={(event) => { void upload(event.target.files?.[0], 'inline'); event.currentTarget.value = ''; }} />
                  </label>
                  <button type="button" onClick={addAdSlot} className="inline-flex items-center gap-1 rounded bg-amber-400/15 px-2 py-1 text-[9px] font-bold text-amber-200">
                    <Megaphone size={12} /> {t('bp_add_ad_slot')}
                  </button>
                </div>
              </div>

              {blockMessage && <p role="status" className="mb-2 rounded bg-red-500/15 px-2 py-1 text-[9px] text-red-200">{blockMessage}</p>}

              <ol className="space-y-2">
                {form.blocks.map((block, index) => (
                  <li key={block.id} className="rounded border border-[#244668] p-2">
                    <div className="mb-1.5 flex items-center justify-between gap-1">
                      <span className="text-[9px] font-bold text-slate-500">
                        {block.type === 'text'
                          ? fill(t('bp_block_paragraph'), { count: index + 1 })
                          : block.type === 'image'
                            ? fill(t('bp_block_photo'), { count: index + 1 })
                            : fill(t('bp_block_ad'), { count: index + 1 })}
                      </span>
                      <div className="flex gap-0.5">
                        <button type="button" onClick={() => update('blocks', moveBlock(form.blocks, index, -1))} disabled={index === 0} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-cyan-200 disabled:opacity-30" aria-label={fill(t('bp_aria_move_up'), { count: index + 1 })}><ArrowUp size={12} /></button>
                        <button type="button" onClick={() => update('blocks', moveBlock(form.blocks, index, 1))} disabled={index === form.blocks.length - 1} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-cyan-200 disabled:opacity-30" aria-label={fill(t('bp_aria_move_down'), { count: index + 1 })}><ArrowDown size={12} /></button>
                        <button type="button" onClick={() => removeBlock(block.id)} className="rounded p-1 text-slate-500 hover:bg-white/10 hover:text-red-300" aria-label={fill(t('bp_aria_remove_block'), { count: index + 1 })}><Trash2 size={12} /></button>
                      </div>
                    </div>

                    {block.type === 'text' && (
                      <div className="grid gap-1.5">
                        <textarea value={block.textEn} onChange={(event) => replaceBlock({ ...block, textEn: event.target.value })} rows={2} placeholder={t('bp_ph_paragraph_en')} aria-label={t('bp_ph_paragraph_en')} className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1.5 text-[11px] text-white outline-none placeholder:text-slate-600" />
                        <textarea value={block.textMm} onChange={(event) => replaceBlock({ ...block, textMm: event.target.value })} rows={2} placeholder={t('bp_ph_paragraph_mm')} aria-label={t('bp_ph_paragraph_mm')} className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1.5 text-[11px] text-white outline-none placeholder:text-slate-600" />
                      </div>
                    )}

                    {block.type === 'image' && (
                      <div className="grid gap-1.5 sm:grid-cols-[96px_minmax(0,1fr)]">
                        <img src={block.imageUrl} alt="" className="h-20 w-full rounded object-cover sm:h-24" />
                        <div className="grid gap-1.5">
                          <input value={block.altEn} onChange={(event) => replaceBlock({ ...block, altEn: event.target.value })} placeholder={t('bp_ph_alt_en')} aria-label={t('bp_ph_alt_en')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none placeholder:text-slate-600" />
                          <input value={block.altMm} onChange={(event) => replaceBlock({ ...block, altMm: event.target.value })} placeholder={t('bp_ph_alt_mm')} aria-label={t('bp_ph_alt_mm')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none placeholder:text-slate-600" />
                          <div className="grid grid-cols-2 gap-1.5">
                            <input value={block.captionEn} onChange={(event) => replaceBlock({ ...block, captionEn: event.target.value })} placeholder={t('bp_ph_caption_en')} aria-label={t('bp_ph_caption_en')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none placeholder:text-slate-600" />
                            <input value={block.captionMm} onChange={(event) => replaceBlock({ ...block, captionMm: event.target.value })} placeholder={t('bp_ph_caption_mm')} aria-label={t('bp_ph_caption_mm')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none placeholder:text-slate-600" />
                          </div>
                          <input value={block.credit} onChange={(event) => replaceBlock({ ...block, credit: event.target.value })} placeholder={t('bp_ph_credit')} aria-label={t('bp_ph_credit')} className="rounded border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[10px] text-white outline-none placeholder:text-slate-600" />
                        </div>
                      </div>
                    )}

                    {block.type === 'ad' && (
                      <p className="rounded bg-amber-400/10 px-2 py-1.5 text-[10px] text-amber-200">
                        {t('bp_ad_slot_note')}
                      </p>
                    )}
                  </li>
                ))}
              </ol>

              <button type="button" onClick={() => update('blocks', [...form.blocks, createTextBlock()])} className="mt-2 inline-flex items-center gap-1 rounded border border-dashed border-cyan-300/40 px-2 py-1.5 text-[9px] font-bold text-cyan-200 hover:bg-cyan-400/10">
                <Plus size={11} /> {t('bp_add_paragraph')}
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex gap-2">
              <label className="min-w-0 flex-1">
                <span className="mb-1 block text-[9px] font-semibold text-slate-300">{t('bp_col_category')}</span>
                <select value={form.category} onChange={(event) => update('category', event.target.value)} className="h-8 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 text-[11px] text-white outline-none">
                  {categories.map((value) => <option key={value} value={value}>{categoryLabel(value)}</option>)}
                </select>
              </label>
              <button type="button" onClick={() => { const label = window.prompt(t('bp_new_category_prompt')); if (label) { setNewCategory(label); onAddCategory(label); } }} className="mt-5 h-8 shrink-0 rounded border border-cyan-300/40 px-2 text-[9px] font-bold text-cyan-200"><Plus size={11} className="inline" /> {t('bp_add')}</button>
            </div>
            {newCategory && <p className="text-[9px] text-green-300">{fill(t('bp_category_added'), { name: newCategory })}</p>}

            <div className="grid grid-cols-2 gap-2">
              <Field label={t('bp_field_author_en')} value={form.authorEn} onChange={(value) => update('authorEn', value)} />
              <Field label={t('bp_field_author_mm')} value={form.authorMm} onChange={(value) => update('authorMm', value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t('bp_field_location_en')} value={form.locationEn} onChange={(value) => update('locationEn', value)} />
              <Field label={t('bp_field_location_mm')} value={form.locationMm} onChange={(value) => update('locationMm', value)} />
            </div>
            <MediaField label={t('cw_field_cover')} multiple={false} disabled={uploading} onChange={(file) => { void upload(file, 'cover'); }} />
            <p className="-mt-1 text-[9px] text-slate-500">{t('bp_gallery_note')}</p>
            {uploadMessage && <p className="text-[9px] text-cyan-200">{uploadMessage}</p>}

            <TagField
              label={t('bp_seo_tags')}
              tags={form.seoTags}
              draft={form.seoTagDraft}
              placeholder={t('bp_ph_seo_tag')}
              addLabel={t('bp_seo_add')}
              removeLabel={t('bp_seo_remove')}
              onDraft={(value) => update('seoTagDraft', value)}
              onAdd={() => {
                const tag = tagToAdd(form.seoTags, form.seoTagDraft);
                if (tag) update('seoTags', [...form.seoTags, tag]);
                update('seoTagDraft', '');
              }}
              onRemove={(tag) => update('seoTags', removeTag(form.seoTags, tag))}
            />
            <p className="-mt-1 text-[9px] text-slate-500">{t('bp_seo_note')}</p>

            <div className="grid grid-cols-2 gap-2">
              <label>
                <span className="mb-1 block text-[9px] font-semibold text-slate-300">{t('cw_publish_date')}</span>
                <input type="date" value={form.scheduledDate} onChange={(event) => update('scheduledDate', event.target.value)} className="h-8 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 text-[11px] text-white outline-none" />
              </label>
              <label>
                <span className="mb-1 block text-[9px] font-semibold text-slate-300">{t('cw_publish_time')}</span>
                <input type="time" value={form.scheduledTime} onChange={(event) => update('scheduledTime', event.target.value)} className="h-8 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 text-[11px] text-white outline-none" />
              </label>
            </div>

            <label>
              <span className="mb-1 block text-[9px] font-semibold text-slate-300">{t('cw_status')}</span>
              <select value={form.status} onChange={(event) => update('status', event.target.value as BlogPostStatus)} className="h-8 w-full rounded border border-[#2b527d] bg-[#081a31] px-2 text-[11px] text-white outline-none">
                {(['Draft', 'Published', 'Scheduled'] as BlogPostStatus[]).map((status) => (
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
              <p className="font-bold">{check.ok ? t('cw_ready_save') : fill(t('cw_checks_left'), { count: check.problems.length })}</p>
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
              <CalendarDays size={13} />{form.status === 'Published' ? t('cw_publish') : form.status === 'Scheduled' ? t('cw_schedule') : t('cw_save_draft')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TagField({
  label,
  tags,
  draft,
  placeholder,
  addLabel,
  removeLabel,
  onDraft,
  onAdd,
  onRemove,
}: {
  label: string;
  tags: string[];
  draft: string;
  placeholder: string;
  addLabel: string;
  removeLabel: string;
  onDraft: (value: string) => void;
  onAdd: () => void;
  onRemove: (tag: string) => void;
}) {
  return (
    <div className="block">
      <span className="mb-1 block text-[9px] font-semibold text-slate-300">{label}</span>
      {tags.length > 0 && (
        <ul className="mb-1 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <li key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#123152] px-2 py-0.5 text-[10px] text-slate-200">
              {tag}
              <button
                type="button"
                onClick={() => onRemove(tag)}
                aria-label={`${removeLabel}: ${tag}`}
                className="text-slate-400 transition hover:text-white"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-1">
        <input
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter adds a tag instead of submitting the editor's form.
            if (event.key === 'Enter') {
              event.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          aria-label={label}
          className="h-8 min-w-0 flex-1 rounded border border-[#2b527d] bg-[#081a31] px-2.5 text-[11px] text-white outline-none placeholder:text-slate-600"
        />
        <button
          type="button"
          onClick={onAdd}
          className="h-8 shrink-0 rounded border border-[#2b527d] px-2 text-[10px] text-slate-200 transition hover:bg-[#123152]"
        >
          {addLabel}
        </button>
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

function TextField({ label, value, onChange, rows }: { label: string; value: string; onChange: (value: string) => void; rows: number }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-semibold text-slate-300">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2.5 py-1.5 text-[11px] text-white outline-none placeholder:text-slate-600" />
    </label>
  );
}

function MediaField({ label, multiple, disabled, onChange }: { label: string; multiple: boolean; disabled: boolean; onChange: (file: File) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[9px] font-semibold text-slate-300">{label}</span>
      <input type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} disabled={disabled} onChange={(event) => { Array.from(event.target.files || []).forEach(onChange); event.currentTarget.value = ''; }} className="w-full rounded border border-[#2b527d] bg-[#081a31] px-2 py-1.5 text-[10px] text-slate-300 file:mr-2 file:rounded file:border-0 file:bg-cyan-400 file:px-2 file:py-1 file:text-[9px] file:font-bold file:text-[#061426]" />
    </label>
  );
}
