/**
 * Plan §10 §4: the editor collects Myanmar Time (UTC+6:30) and the row stores
 * UTC, so the instant a post goes live does not depend on where the editor or
 * the reader happens to be. `scheduled_for` is the only place a schedule lives;
 * `published_at` is set when the post actually goes live.
 */

const MYANMAR_OFFSET_MINUTES = 6 * 60 + 30;
const OFFSET_SUFFIX = '+06:30';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * The UTC instant a Myanmar wall-clock date and time name, as an ISO string.
 * A malformed or impossible pair returns null rather than a shifted guess, so a
 * half-typed schedule can never publish something at the wrong hour.
 */
export function myanmarWallClockToUtc(date: string, time: string): string | null {
  if (!DATE_PATTERN.test(date) || !TIME_PATTERN.test(time)) return null;
  const instant = new Date(`${date}T${time}:00${OFFSET_SUFFIX}`);
  if (Number.isNaN(instant.getTime())) return null;
  // 2026-02-31 passes the shape test but rolls into March, so the round trip
  // is what rejects a day that does not exist.
  const roundTrip = utcToMyanmarWallClock(instant.toISOString());
  if (!roundTrip || roundTrip.date !== date || roundTrip.time !== time) return null;
  return instant.toISOString();
}

/** The Myanmar wall clock an instant falls on, for filling the editor again. */
export function utcToMyanmarWallClock(iso: string): { date: string; time: string } | null {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  const shifted = new Date(parsed.getTime() + MYANMAR_OFFSET_MINUTES * 60000).toISOString();
  return { date: shifted.slice(0, 10), time: shifted.slice(11, 16) };
}

/**
 * True when a scheduled item's instant has arrived. An empty or unreadable
 * schedule is never due: publishing on a broken value would put a post live at
 * a time nobody chose.
 */
export function isDue(scheduledFor: string | null | undefined, now: Date): boolean {
  if (!scheduledFor) return false;
  const at = new Date(scheduledFor).getTime();
  if (Number.isNaN(at)) return false;
  return at <= now.getTime();
}

/**
 * The schedule as the Admin table shows it: Myanmar Time, because that is the
 * clock the editor typed and the one the team works to. `Asia/Yangon` is the
 * IANA name for UTC+6:30, so the label needs no manual offset arithmetic.
 */
export function formatScheduleLabel(iso: string, language: 'mm' | 'en'): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat(language === 'mm' ? 'my-MM' : 'en-GB', {
    timeZone: 'Asia/Yangon',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed);
}

/** The least an item needs to be considered by the publishing job. */
export type ScheduledItem = { id: string; status: string; scheduledFor?: string | null };

/**
 * The items whose time has come, and the rest. `markPublished` decides what
 * "published" means for that content type, so this stays one rule for Blog and
 * Travel Guide. Running it twice publishes nothing the second time, because the
 * first run has already taken the items out of `Scheduled`.
 */
export function publishDueItems<T extends ScheduledItem>(
  items: T[],
  now: Date,
  markPublished: (item: T) => T,
  isEligible: (item: T) => boolean = () => true,
): { items: T[]; published: T[] } {
  const published: T[] = [];
  const next = items.map((item) => {
    if (item.status !== 'Scheduled' || !isEligible(item) || !isDue(item.scheduledFor, now)) return item;
    const done = markPublished(item);
    published.push(done);
    return done;
  });
  return { items: next, published };
}
