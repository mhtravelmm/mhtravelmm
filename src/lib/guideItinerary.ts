import type { GuideCategory } from '../data/travelGuideData';
import type { PublishProblem } from './publishProblems';

/** A stop's listing must already exist in MH Travel, so a guide cannot point elsewhere. */
export type GuideStopDraft = {
  id: string;
  time: string;
  listingId: string;
  titleEn: string;
  titleMm: string;
  descriptionEn: string;
  descriptionMm: string;
  /** Optional stop photo, uploaded through the shared WebP/R2 pipeline. */
  imageUrl: string;
};

export type GuideDraft = {
  titleEn: string;
  titleMm: string;
  excerptEn: string;
  excerptMm: string;
  category: GuideCategory;
  coverUrl: string;
  /** Plan §10 §2: bilingual, as the reader shows it. */
  authorEn: string;
  authorMm: string;
  stops: GuideStopDraft[];
  status: 'Draft' | 'Published' | 'Scheduled';
  scheduledDate: string;
  scheduledTime: string;
};

export function createStop(): GuideStopDraft {
  return { id: `stop-${Date.now()}-${Math.random()}`, time: '', listingId: '', titleEn: '', titleMm: '', descriptionEn: '', descriptionMm: '', imageUrl: '' };
}

/** `09:30` becomes minutes after midnight, so stop times can be compared. */
export function minutesOfDay(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Sorts stops by time, keeping the original order for equal or unreadable times. */
export function sortStopsByTime(stops: GuideStopDraft[]): GuideStopDraft[] {
  return [...stops].sort((a, b) => (minutesOfDay(a.time) ?? 0) - (minutesOfDay(b.time) ?? 0));
}

export function moveStop(stops: GuideStopDraft[], index: number, offset: -1 | 1): GuideStopDraft[] {
  const target = index + offset;
  if (index < 0 || index >= stops.length || target < 0 || target >= stops.length) return stops;
  const next = [...stops];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export type GuideCheck = { ok: boolean; problems: PublishProblem[] };

/**
 * Plan §10 item 4: what a guide needs before it may publish. `listingIds` is the
 * set of listings that exist, so a stop pointing at a removed listing blocks.
 */
export function guidePublishCheck(draft: GuideDraft, listingIds: ReadonlySet<string>): GuideCheck {
  const problems: PublishProblem[] = [];
  if (!draft.titleEn.trim() || !draft.titleMm.trim()) problems.push({ code: 'title_languages' });
  if (!draft.excerptEn.trim() || !draft.excerptMm.trim()) problems.push({ code: 'excerpt_languages' });
  if (!draft.coverUrl.trim()) problems.push({ code: 'cover' });
  if (!draft.authorEn.trim() || !draft.authorMm.trim()) problems.push({ code: 'author_languages' });
  if (draft.stops.length === 0) problems.push({ code: 'stop_required' });

  const unknown = draft.stops.filter((stop) => !listingIds.has(stop.listingId)).length;
  if (unknown > 0) problems.push({ code: 'stop_listing', count: unknown });

  const missingCopy = draft.stops.filter((stop) => !stop.titleEn.trim() || !stop.titleMm.trim() || !stop.descriptionEn.trim() || !stop.descriptionMm.trim()).length;
  if (missingCopy > 0) problems.push({ code: 'stop_languages', count: missingCopy });

  const times = draft.stops.map((stop) => minutesOfDay(stop.time));
  if (times.some((time) => time === null)) problems.push({ code: 'stop_time_format' });
  else if (times.some((time, index) => index > 0 && (time as number) < (times[index - 1] as number))) {
    problems.push({ code: 'stop_time_order' });
  }

  if (draft.status === 'Scheduled' && (!draft.scheduledDate || !draft.scheduledTime)) {
    problems.push({ code: 'schedule' });
  }
  return { ok: problems.length === 0, problems };
}
