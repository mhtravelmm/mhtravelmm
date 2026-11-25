/**
 * Plan §16H.9, ticket O-51. Open Now is the one rule on the Nearby page that a
 * reader can catch being wrong, so it lives here rather than in the page: a
 * listing is open when the clock in Myanmar reads inside its hours, and the four
 * cases that matter are all in one place.
 *
 * `private.is_open_now()` in `SQL/20261202000100_search.sql` is the twin of this
 * file, and both are held to the same vectors.
 */

/** Myanmar Time is UTC+6:30 all year: the country has not observed DST since 1945. */
export const MMT_OFFSET_MINUTES = 6 * 60 + 30;

/** `HH:MM` or `HH:MM:SS`; anything else is not a time we can judge. */
const TIME_PATTERN = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

/** Minutes since midnight, or null for a value we cannot read. */
export function minutesOfDay(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** The Myanmar clock reading of an instant, as minutes since midnight. */
export function myanmarMinutes(at: Date = new Date()): number {
  const shifted = new Date(at.getTime() + MMT_OFFSET_MINUTES * 60_000);
  return shifted.getUTCHours() * 60 + shifted.getUTCMinutes();
}

/**
 * §16H.9's rule, in its four cases:
 *
 *  - an unknown schedule is **unknown**, never open — a missing time must not
 *    read as "come on in";
 *  - equal open and close times mean a 24-hour listing, always open;
 *  - `09:00`–`17:00` is open from nine up to (not including) five;
 *  - `22:00`–`02:00` is an overnight close, open either side of midnight.
 */
export function isOpenAt(open: string | null | undefined, close: string | null | undefined, at: Date = new Date()): boolean {
  const start = minutesOfDay(open);
  const end = minutesOfDay(close);
  if (start === null || end === null) return false;
  const now = myanmarMinutes(at);
  if (start === end) return true;
  if (start < end) return now >= start && now < end;
  return now >= start || now < end;
}

/** The closing time to show next to "Open now", or null when it is unknown. */
export function closesAt(close: string | null | undefined): string | null {
  return minutesOfDay(close) === null ? null : close!.slice(0, 5);
}
