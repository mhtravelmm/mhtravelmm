/**
 * Plan §4: Platform Admin controls the catalog, so it has to know which
 * templates are actually used — "views and applies per template" was the part
 * of §4 that the rendered page did not record.
 *
 * A view is one public Shop Page render of a template. An apply is one owner
 * switch onto it. A preview is deliberately neither: an owner trying a design
 * on their own data is not a shopper looking at the shop, and counting it would
 * make a template look popular the moment its author reviewed it.
 */

export type TemplateEventKind = 'view' | 'apply';

export interface TemplateEvent {
  id: string;
  templateId: string;
  shopId: string;
  kind: TemplateEventKind;
  /** UTC instant. */
  at: string;
  /** One per page view, so a re-render or a language switch does not count twice. */
  sessionHash: string;
  language?: 'mm' | 'en';
}

/**
 * The browser store keeps the newest rows only, and drops anything older than
 * the retention window on write, so the stand-in cannot grow without bound the
 * way a table would. The table keeps the same rows with a `pg_cron` purge.
 */
export const TEMPLATE_EVENT_CAP = 5000;
export const TEMPLATE_EVENT_RETENTION_DAYS = 180;

export interface TemplateStatsRow {
  templateId: string;
  views: number;
  applies: number;
  /** Applies ÷ views as a percentage with one decimal, the way §16A.7 reports CTR. */
  applyRate: number;
  lastAt: string;
}

/** The dedupe key: one view per template per page view, whatever the language. */
export function templateEventKey(event: Pick<TemplateEvent, 'sessionHash' | 'templateId' | 'kind'>): string {
  return `${event.sessionHash}:${event.templateId}:${event.kind}`;
}

/** Appends an event unless this page view already recorded that exact one. */
export function appendTemplateEvent(events: TemplateEvent[], event: TemplateEvent): TemplateEvent[] {
  const key = templateEventKey(event);
  if (events.some((row) => templateEventKey(row) === key)) return events;
  return [event, ...events].slice(0, TEMPLATE_EVENT_CAP);
}

export function templateApplyRate(views: number, applies: number): number {
  if (views <= 0) return 0;
  return Math.round((applies / views) * 1000) / 10;
}

/** Per-template totals, most viewed first, ties broken by id so the order is stable. */
export function rollUpTemplateStats(events: TemplateEvent[]): TemplateStatsRow[] {
  const totals = new Map<string, TemplateStatsRow>();
  for (const event of events) {
    const row = totals.get(event.templateId) ?? { templateId: event.templateId, views: 0, applies: 0, applyRate: 0, lastAt: '' };
    if (event.kind === 'view') row.views += 1;
    else row.applies += 1;
    if (event.at > row.lastAt) row.lastAt = event.at;
    totals.set(event.templateId, row);
  }
  return Array.from(totals.values())
    .map((row) => ({ ...row, applyRate: templateApplyRate(row.views, row.applies) }))
    .sort((a, b) => (a.views === b.views ? a.templateId.localeCompare(b.templateId) : b.views - a.views));
}

/** The share of all views a template holds, for the catalog table's last column. */
export function templateViewShare(row: TemplateStatsRow, rows: TemplateStatsRow[]): number {
  const total = rows.reduce((sum, candidate) => sum + candidate.views, 0);
  if (total <= 0) return 0;
  return Math.round((row.views / total) * 1000) / 10;
}

/** The purge keeps the retention window and nothing older. */
export function purgeTemplateEvents(
  events: TemplateEvent[],
  now: Date,
  days = TEMPLATE_EVENT_RETENTION_DAYS,
): { kept: TemplateEvent[]; purged: number } {
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  const kept = events.filter((event) => new Date(event.at).getTime() >= cutoff);
  return { kept, purged: events.length - kept.length };
}
