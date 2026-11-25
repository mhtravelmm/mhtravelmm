import { useMemo, useState } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useAuditRecorder } from '../../lib/adminAudit';
import { pushAdminNotice } from '../../lib/adminNotices';
import type { TranslationKey } from '../../lib/translations';
import { canOpenSection, type WorkspaceSection } from '../../lib/adminWorkspace';
import {
  adminCities,
  citiesByPopularity,
  cityProblem,
  setCityActive,
  type AdminCityRow,
  type CityProblem,
} from '../../lib/adminCities';
import { useCollection, newId } from '../../lib/collection';
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
  DANGER_BUTTON,
  GHOST_BUTTON,
  INPUT_CLASS,
  PRIMARY_BUTTON,
  statusTone,
} from './shared/sectionStyles';


/**
 * Plan §3A.10, ticket O-64. Add and edit a city. "Popular" is derived from
 * views, never typed, so the table ranks by views and the form has no popular
 * field to fill.
 *
 * §3A.10: deactivating hides a city from search and pages but keeps its
 * listings, so the toggle changes `active` and nothing else.
 */

const PROBLEM_KEYS: Record<CityProblem, TranslationKey> = {
  name_en_required: 'ct_problem_name_en_required',
  name_mm_required: 'ct_problem_name_mm_required',
  slug_required: 'ct_problem_slug_required',
  slug_invalid: 'ct_problem_slug_invalid',
  slug_duplicate: 'ct_problem_slug_duplicate',
};

const CSV_COLUMNS: CsvColumn<AdminCityRow>[] = [
  { header: 'id', value: (row) => row.id },
  { header: 'name_en', value: (row) => row.name_en },
  { header: 'name_mm', value: (row) => row.name_mm },
  { header: 'slug', value: (row) => row.slug },
  { header: 'active', value: (row) => (row.active ? 'yes' : 'no') },
  { header: 'sort_order', value: (row) => row.sort_order },
  { header: 'views', value: (row) => row.views },
  { header: 'listing_count', value: (row) => row.listing_count },
  { header: 'latitude', value: (row) => row.latitude },
  { header: 'longitude', value: (row) => row.longitude },
];

type Draft = Pick<
  AdminCityRow,
  'id' | 'name_en' | 'name_mm' | 'slug' | 'cover_url' | 'description_en' | 'description_mm' | 'latitude' | 'longitude' | 'active' | 'sort_order'
>;

function emptyDraft(): Draft {
  return {
    id: newId('city'),
    name_en: '',
    name_mm: '',
    slug: '',
    cover_url: '',
    description_en: '',
    description_mm: '',
    latitude: null,
    longitude: null,
    active: true,
    sort_order: 99,
  };
}

function draftFor(row: AdminCityRow): Draft {
  return {
    id: row.id,
    name_en: row.name_en,
    name_mm: row.name_mm,
    slug: row.slug,
    cover_url: row.cover_url,
    description_en: row.description_en,
    description_mm: row.description_mm,
    latitude: row.latitude,
    longitude: row.longitude,
    active: row.active,
    sort_order: row.sort_order,
  };
}

export function CitiesPanel() {
  const { t } = useLanguage();
  const { adminRole } = useAuth();
  const audit = useAuditRecorder();
  const { rows, save } = useCollection(adminCities);
  const [draft, setDraft] = useState<Draft | null>(null);

  const allowed = canOpenSection(adminRole, 'cities' as WorkspaceSection);
  const ordered = useMemo(() => citiesByPopularity(rows), [rows]);
  const problem = draft ? cityProblem(draft, rows) : null;

  if (!allowed) return <NotAllowedState />;

  function saveDraft() {
    if (!draft || problem) return;
    const existing = rows.find((row) => row.id === draft.id);
    const next: AdminCityRow = {
      ...(existing ?? { views: 0, listing_count: 0 }),
      ...draft,
      slug: draft.slug.trim(),
      name_en: draft.name_en.trim(),
      name_mm: draft.name_mm.trim(),
    };
    const exists = rows.some((row) => row.id === draft.id);
    save(exists ? rows.map((row) => (row.id === draft.id ? next : row)) : [...rows, next]);
    audit({
      action: exists ? 'updated' : 'created',
      objectType: 'city',
      objectId: next.id,
      summary: `${next.name_en} · ${next.slug} · ${next.active ? 'active' : 'inactive'}`,
      source: 'admin_workspace',
    });
    pushAdminNotice({
      title: t('ct_notice_saved_title'),
      message: t('ct_notice_saved_body').replace('{name}', next.name_en),
    });
    setDraft(null);
  }

  function toggle(row: AdminCityRow) {
    const next = setCityActive(row, !row.active);
    save(rows.map((entry) => (entry.id === row.id ? next : entry)));
    audit({
      action: 'updated',
      objectType: 'city',
      objectId: row.id,
      summary: `${row.name_en} · active ${row.active} → ${next.active}`,
      source: 'admin_workspace',
    });
    pushAdminNotice({
      title: t('ct_notice_active_title'),
      message: t('ct_notice_active_body')
        .replace('{name}', row.name_en)
        .replace('{status}', next.active ? t('sec_status_active') : t('sec_status_hidden')),
    });
  }

  return (
    <div className="mx-auto max-w-[1150px] space-y-3">
      <SectionHeader kickerKey="ct_kicker" titleKey="ct_title" introKey="ct_intro">
        <button type="button" onClick={() => setDraft(emptyDraft())} className={PRIMARY_BUTTON}>
          <Plus size={14} /> {t('ct_action_new')}
        </button>
        <CsvExportButton section="cities" columns={CSV_COLUMNS} rows={ordered} />
      </SectionHeader>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <SummaryCard icon={MapPin} label={t('pl_summary_total')} value={String(rows.length)} tone="cyan" />
        <SummaryCard icon={MapPin} label={t('sec_status_active')} value={String(rows.filter((row) => row.active).length)} tone="green" />
        <SummaryCard icon={MapPin} label={t('sec_status_hidden')} value={String(rows.filter((row) => !row.active).length)} tone="amber" />
      </div>

      {draft && (
        <Panel>
          <PanelTitle icon={MapPin} title={t('ct_form_title')} />
          <div className="grid gap-2 p-2 sm:grid-cols-2 lg:grid-cols-3">
            <Field label={t('ct_name_en')}>
              <input value={draft.name_en} onChange={(event) => setDraft({ ...draft, name_en: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('ct_name_mm')}>
              <input value={draft.name_mm} onChange={(event) => setDraft({ ...draft, name_mm: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('sec_col_slug')}>
              <input
                value={draft.slug}
                onChange={(event) => setDraft({ ...draft, slug: event.target.value.toLowerCase() })}
                placeholder="yangon"
                className={INPUT_CLASS}
              />
            </Field>
            <Field label={t('ct_cover')}>
              <input value={draft.cover_url} onChange={(event) => setDraft({ ...draft, cover_url: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('ct_latitude')}>
              <input
                value={draft.latitude ?? ''}
                onChange={(event) => setDraft({ ...draft, latitude: event.target.value === '' ? null : Number(event.target.value) })}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label={t('ct_longitude')}>
              <input
                value={draft.longitude ?? ''}
                onChange={(event) => setDraft({ ...draft, longitude: event.target.value === '' ? null : Number(event.target.value) })}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label={t('ct_description_en')}>
              <textarea rows={2} value={draft.description_en} onChange={(event) => setDraft({ ...draft, description_en: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('ct_description_mm')}>
              <textarea rows={2} value={draft.description_mm} onChange={(event) => setDraft({ ...draft, description_mm: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('ct_sort_order')}>
              <input
                type="number"
                value={draft.sort_order}
                onChange={(event) => setDraft({ ...draft, sort_order: Number(event.target.value) })}
                className={INPUT_CLASS}
              />
            </Field>
            <label className="flex items-center gap-2 text-[11px] text-slate-200">
              <input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />
              {t('sec_col_active')}
            </label>
            <p className="text-[10px] leading-4 text-slate-500 sm:col-span-2">{t('ct_active_hint')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-[#244668] px-3 py-2">
            {problem && (
              <p role="alert" className="w-full rounded border border-red-400/30 bg-red-400/10 px-2 py-1.5 text-[11px] text-red-200">
                {t(PROBLEM_KEYS[problem])}
              </p>
            )}
            <button type="button" onClick={saveDraft} disabled={Boolean(problem)} className={PRIMARY_BUTTON}>
              {t('sec_save')}
            </button>
            <button type="button" onClick={() => setDraft(null)} className={GHOST_BUTTON}>
              {t('sa_cancel')}
            </button>
          </div>
        </Panel>
      )}

      <Panel>
        <PanelTitle icon={MapPin} title={t('ct_title')} />
        {ordered.length === 0 ? (
          <div className="p-3">
            <EmptyState />
          </div>
        ) : (
          <TableWrap minWidth={900}>
            <TableHead>
              <tr>
                <Th>{t('sec_col_name')}</Th>
                <Th>{t('sec_col_slug')}</Th>
                <Th>{t('sec_col_views')}</Th>
                <Th>{t('sec_col_listing')}</Th>
                <Th>{t('sec_col_active')}</Th>
                <Th>{t('sec_col_actions')}</Th>
              </tr>
            </TableHead>
            <tbody>
              {ordered.map((row) => (
                <TableRow key={row.id}>
                  <Td className="font-semibold text-white">
                    {row.name_en}
                    <span className="block text-[10px] text-slate-400">{row.name_mm}</span>
                  </Td>
                  <Td className="text-cyan-300">{row.slug}</Td>
                  <Td>{row.views}</Td>
                  <Td>{row.listing_count}</Td>
                  <Td>
                    <StatusPill tone={statusTone(row.active ? 'active' : 'hidden')}>
                      {row.active ? t('sec_status_active') : t('sec_status_hidden')}
                    </StatusPill>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      <button type="button" onClick={() => setDraft(draftFor(row))} className={GHOST_BUTTON}>
                        {t('st_edit')}
                      </button>
                      <button type="button" onClick={() => toggle(row)} className={row.active ? DANGER_BUTTON : GHOST_BUTTON}>
                        {row.active ? t('sec_status_hidden') : t('sec_status_active')}
                      </button>
                    </div>
                  </Td>
                </TableRow>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}
