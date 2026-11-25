import { useEffect, useState } from 'react';
import { RefreshCw, Search, Plus } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useAuditRecorder } from '../../lib/adminAudit';
import { pushAdminNotice } from '../../lib/adminNotices';
import type { TranslationKey } from '../../lib/translations';
import { canOpenSection, type WorkspaceSection } from '../../lib/adminWorkspace';
import {
  BOOST_MAX,
  BOOST_MIN,
  aliasProblem,
  boostValid,
  searchAliases,
  searchBoosts,
  searchReport,
  statsFromLog,
  type AliasKind,
  type AliasProblem,
  type SearchAliasRow,
} from '../../lib/adminSearch';
import {
  readAliasRows,
  readSearchReport,
  rebuildIndex,
  saveAliasRow,
  saveBoostFor,
} from '../../lib/searchTuningApi';
import { newId, useCollection } from '../../lib/collection';
import { recentLogRows, searchLog } from '../../lib/searchLog';
import { CsvExportButton, NotAllowedState } from './shared/DashboardPieces';
import type { CsvColumn } from '../../lib/dashboardPieces';
import {
  EmptyState,
  Field,
  Panel,
  PanelTitle,
  SectionHeader,
  StatusPill,
  TableHead,
  TableRow,
  TableWrap,
  Td,
  Th,
} from './shared/SectionShell';
import {
  GHOST_BUTTON,
  INPUT_CLASS,
  PRIMARY_BUTTON,
  SELECT_CLASS,
  statusTone,
} from './shared/sectionStyles';


/**
 * Plan §16H.11 and §3A.12, ticket O-67. Three tabs: aliases, boost weights and
 * the report. Every write is audited with the old and new value (§3A.12), and a
 * boost outside −20…50 is refused rather than clamped, because a silently
 * clamped weight is a number nobody chose.
 */

const ALIAS_KIND_KEYS: Record<AliasKind, TranslationKey> = {
  listing: 'sec_col_listing',
  city: 'sec_col_city',
  category: 'sec_col_category',
  guide: 'gs_group_guides',
};

const ALIAS_PROBLEM_KEYS: Record<AliasProblem, TranslationKey> = {
  term_required: 'sr_alias_term',
  target_required: 'sr_alias_target',
  term_duplicate: 'ct_problem_slug_duplicate',
};

const ALIAS_CSV: CsvColumn<SearchAliasRow>[] = [
  { header: 'term', value: (row) => row.term },
  { header: 'target', value: (row) => row.target },
  { header: 'kind', value: (row) => row.kind },
  { header: 'active', value: (row) => (row.active ? 'yes' : 'no') },
  { header: 'updated_at', value: (row) => row.updated_at },
  { header: 'updated_by', value: (row) => row.updated_by },
];

export function SearchTuningPanel() {
  const { t } = useLanguage();
  const { adminRole, user } = useAuth();
  const audit = useAuditRecorder();
  const aliases = useCollection(searchAliases);
  const boosts = useCollection(searchBoosts);
  const log = useCollection(searchLog);

  const [tab, setTab] = useState<'aliases' | 'boosts' | 'report'>('aliases');
  const [draft, setDraft] = useState<{ id: string; term: string; target: string; kind: AliasKind } | null>(null);
  const [error, setError] = useState<TranslationKey | null>(null);
  const [rebuilt, setRebuilt] = useState<number | null>(null);
  const [report, setReport] = useState(() => searchReport(statsFromLog(recentLogRows(log.rows))));

  const allowed = canOpenSection(adminRole, 'search' as WorkspaceSection);
  const problem = draft ? aliasProblem(draft, aliases.rows) : null;

  // §16H.11: the report is the server's when `get_search_report` answers, and
  // the browser log's otherwise. No events means no rows, never a sample
  // (§3A.2 rule 4) — an empty log still shows an empty table.
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    const today = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    void readSearchReport(from, today, () => {
      const preview = searchReport(statsFromLog(recentLogRows(log.rows)));
      return { rows: preview.top, ctr: preview.ctr };
    }).then((outcome) => {
      if (!active) return;
      if (!outcome.ok) {
        setError(outcome.code);
        return;
      }
      setReport({ top: outcome.rows, zero: report.zero, ctr: outcome.ctr });
    });
    return () => { active = false; };
    // `report.zero` is deliberately not a dependency: re-reading on every log
    // write would refetch the report for each keystroke in the search box.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, log.rows.length]);

  // The alias table is the server's when M-50 is applied and the flag is on.
  useEffect(() => {
    if (!allowed) return;
    let active = true;
    void readAliasRows().then((rows) => {
      if (active && rows) aliases.save(rows);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed]);

  if (!allowed) return <NotAllowedState />;

  async function saveAlias() {
    if (!draft || problem) return;
    const exists = aliases.rows.some((row) => row.id === draft.id);
    const next: SearchAliasRow = {
      id: draft.id,
      term: draft.term.trim().toLowerCase(),
      target: draft.target.trim(),
      kind: draft.kind,
      active: aliases.rows.find((row) => row.id === draft.id)?.active ?? true,
      updated_at: new Date().toISOString(),
      updated_by: user?.name ?? 'Super Admin',
    };
    const outcome = await saveAliasRow(next, user?.id ?? null);
    if (!outcome.ok) {
      setError(outcome.code);
      return;
    }
    setError(null);
    const saved = outcome.row;
    aliases.save(exists ? aliases.rows.map((row) => (row.id === saved.id ? saved : row)) : [...aliases.rows, saved]);
    audit({ action: exists ? 'updated' : 'created', objectType: 'search_alias', objectId: saved.id, summary: `${saved.term} → ${saved.target}`, source: 'search' });
    pushAdminNotice({ title: t('sr_notice_alias_title'), message: t('sr_notice_alias_body').replace('{term}', saved.term).replace('{target}', saved.target) });
    setDraft(null);
  }

  async function toggleAlias(row: SearchAliasRow) {
    const next = { ...row, active: !row.active, updated_at: new Date().toISOString(), updated_by: user?.name ?? 'Super Admin' };
    const outcome = await saveAliasRow(next, user?.id ?? null);
    if (!outcome.ok) {
      setError(outcome.code);
      return;
    }
    setError(null);
    aliases.save(aliases.rows.map((entry) => (entry.id === row.id ? outcome.row : entry)));
    audit({ action: 'updated', objectType: 'search_alias', objectId: row.id, summary: `${row.term} · active ${row.active} → ${next.active}`, source: 'search' });
  }

  async function saveBoost(id: string, weight: number) {
    if (!boostValid(weight)) return;
    const row = boosts.rows.find((entry) => entry.id === id);
    if (!row) return;
    const next = { ...row, weight, updated_at: new Date().toISOString(), updated_by: user?.name ?? 'Super Admin' };
    const outcome = await saveBoostFor(null, null, weight);
    if (!outcome.ok) {
      setError(outcome.code);
      return;
    }
    setError(null);
    boosts.save(boosts.rows.map((entry) => (entry.id === id ? next : entry)));
    audit({ action: 'updated', objectType: 'search_boost', objectId: id, summary: `${row.key} · ${row.weight} → ${weight}`, source: 'search' });
    pushAdminNotice({ title: t('sr_notice_boost_title'), message: t('sr_notice_boost_body').replace('{name}', row.label).replace('{value}', String(weight)) });
  }

  async function rebuild() {
    const outcome = await rebuildIndex();
    if (!outcome.ok) {
      setError(outcome.code);
      return;
    }
    setError(null);
    setRebuilt(outcome.rows);
    audit({ action: 'updated', objectType: 'search_index', objectId: 'all', summary: `rebuilt ${outcome.rows} rows`, source: 'search' });
  }

  return (
    <div className="mx-auto max-w-[1050px] space-y-3">
      <SectionHeader kickerKey="sr_kicker" titleKey="sr_title" introKey="sr_intro">
        {tab === 'aliases' && (
          <button
            type="button"
            onClick={() => setDraft({ id: newId('al'), term: '', target: '', kind: 'listing' })}
            className={PRIMARY_BUTTON}
          >
            <Plus size={14} /> {t('sr_alias_add')}
          </button>
        )}
        <button type="button" onClick={rebuild} className={GHOST_BUTTON}>
          <RefreshCw size={14} /> {t('sr_rebuild')}
        </button>
        <CsvExportButton section="search-aliases" columns={ALIAS_CSV} rows={aliases.rows} />
      </SectionHeader>

      {error && (
        <p role="alert" className="rounded border border-red-400/30 bg-red-400/10 px-3 py-2 text-[11px] text-red-200">
          {t(error)}
        </p>
      )}
      {rebuilt !== null && (
        <p role="status" className="rounded border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-[11px] text-emerald-200">
          {t('sr_rebuild_done').replace('{rows}', String(rebuilt))}
        </p>
      )}

      <div className="flex gap-1">
        {(['aliases', 'boosts', 'report'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-md px-3 py-1.5 text-[11px] font-bold ${tab === value ? 'bg-[#168df4] text-white' : 'border border-[#2b527d] text-slate-300'}`}
          >
            {value === 'aliases' ? t('sr_tab_aliases') : value === 'boosts' ? t('sr_tab_boosts') : t('sr_tab_report')}
          </button>
        ))}
      </div>

      {draft && tab === 'aliases' && (
        <Panel>
          <PanelTitle icon={Search} title={t('sr_alias_add')} />
          <div className="grid gap-2 p-2 sm:grid-cols-3">
            <Field label={t('sr_alias_term')}>
              <input value={draft.term} onChange={(event) => setDraft({ ...draft, term: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('sr_alias_target')}>
              <input value={draft.target} onChange={(event) => setDraft({ ...draft, target: event.target.value })} className={INPUT_CLASS} />
            </Field>
            <Field label={t('sr_alias_kind')}>
              <select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as AliasKind })} className={SELECT_CLASS}>
                {(['listing', 'city', 'category', 'guide'] as AliasKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {t(ALIAS_KIND_KEYS[kind])}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-[#244668] px-3 py-2">
            {problem && (
              <p role="alert" className="w-full rounded border border-red-400/30 bg-red-400/10 px-2 py-1.5 text-[11px] text-red-200">
                {t(ALIAS_PROBLEM_KEYS[problem])}
              </p>
            )}
            <button type="button" onClick={saveAlias} disabled={Boolean(problem)} className={PRIMARY_BUTTON}>
              {t('sec_save')}
            </button>
            <button type="button" onClick={() => setDraft(null)} className={GHOST_BUTTON}>
              {t('sa_cancel')}
            </button>
          </div>
        </Panel>
      )}

      {tab === 'aliases' ? (
        <Panel>
          <PanelTitle icon={Search} title={t('sr_tab_aliases')} />
          {aliases.rows.length === 0 ? (
            <div className="p-3">
              <EmptyState />
            </div>
          ) : (
            <TableWrap minWidth={760}>
              <TableHead>
                <tr>
                  <Th>{t('sr_alias_term')}</Th>
                  <Th>{t('sr_alias_target')}</Th>
                  <Th>{t('sr_alias_kind')}</Th>
                  <Th>{t('sec_col_updated')}</Th>
                  <Th>{t('sec_col_actions')}</Th>
                </tr>
              </TableHead>
              <tbody>
                {aliases.rows.map((row) => (
                  <TableRow key={row.id}>
                    <Td className="font-semibold text-white">{row.term}</Td>
                    <Td>{row.target}</Td>
                    <Td>{t(ALIAS_KIND_KEYS[row.kind])}</Td>
                    <Td className="text-[10px] text-slate-400">
                      {row.updated_at.slice(0, 10)} · {row.updated_by}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        <button type="button" onClick={() => setDraft({ id: row.id, term: row.term, target: row.target, kind: row.kind })} className={GHOST_BUTTON}>
                          {t('st_edit')}
                        </button>
                        <button type="button" onClick={() => toggleAlias(row)} className={GHOST_BUTTON}>
                          <StatusPill tone={statusTone(row.active ? 'active' : 'hidden')}>{row.active ? t('sr_alias_on') : t('sec_status_hidden')}</StatusPill>
                        </button>
                      </div>
                    </Td>
                  </TableRow>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      ) : tab === 'boosts' ? (
        <Panel>
          <PanelTitle icon={Search} title={t('sr_tab_boosts')} />
          <TableWrap minWidth={680}>
            <TableHead>
              <tr>
                <Th>{t('sec_col_key')}</Th>
                <Th>{t('sr_boost_value')}</Th>
                <Th>{t('sec_col_updated')}</Th>
                <Th>{t('sec_col_actions')}</Th>
              </tr>
            </TableHead>
            <tbody>
              {boosts.rows.map((row) => (
                <BoostRow key={row.id} row={row} onSave={saveBoost} />
              ))}
            </tbody>
          </TableWrap>
          <p className="px-3 pb-2 pt-1 text-[10px] text-slate-500">{t('sr_boost_problem')}</p>
        </Panel>
      ) : (
        <Panel>
          <PanelTitle icon={Search} title={t('sr_tab_report')} />
          {report.top.length === 0 ? (
            <div className="p-3">
              <EmptyState titleKey="rp_no_rows" detailKey="sec_empty_hint" />
            </div>
          ) : (
            <TableWrap minWidth={640}>
              <TableHead>
                <tr>
                  <Th>{t('sr_col_query')}</Th>
                  <Th>{t('sr_col_results')}</Th>
                  <Th>{t('sr_col_clicks')}</Th>
                </tr>
              </TableHead>
              <tbody>
                {report.top.map((row) => (
                  <TableRow key={row.query}>
                    <Td className="font-semibold text-white">{row.query}</Td>
                    <Td>{row.results}</Td>
                    <Td>{row.clicks}</Td>
                  </TableRow>
                ))}
              </tbody>
            </TableWrap>
          )}
          {report.zero.length > 0 && (
            <div className="border-t border-[#244668] px-3 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{t('sr_report_zero')}</p>
              <ul className="mt-1 space-y-0.5">
                {report.zero.map((row) => (
                  <li key={row.query} className="font-mono text-[11px] text-slate-300">{row.query}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="px-3 pb-2 text-[10px] text-slate-500">
            {t('sr_report_ctr')}: {report.ctr}%
          </p>
        </Panel>
      )}
    </div>
  );
}

function BoostRow({ row, onSave }: { row: { id: string; key: string; label: string; weight: number; updated_at: string; updated_by: string }; onSave: (id: string, weight: number) => void }) {
  const { t } = useLanguage();
  const [value, setValue] = useState(row.weight);
  const valid = boostValid(value);
  return (
    <TableRow>
      <Td>
        <span className="font-semibold text-white">{row.label}</span>
        <span className="block font-mono text-[10px] text-slate-500">{row.key}</span>
      </Td>
      <Td>
        <input
          type="number"
          min={BOOST_MIN}
          max={BOOST_MAX}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          aria-label={row.label}
          className={`${INPUT_CLASS} w-24`}
        />
        {!valid && <p className="mt-1 text-[10px] text-red-300">{t('sr_boost_problem')}</p>}
      </Td>
      <Td className="text-[10px] text-slate-400">
        {row.updated_at.slice(0, 10)} · {row.updated_by}
      </Td>
      <Td>
        <button type="button" onClick={() => onSave(row.id, value)} disabled={!valid} className={GHOST_BUTTON}>
          {t('sec_save')}
        </button>
      </Td>
    </TableRow>
  );
}
