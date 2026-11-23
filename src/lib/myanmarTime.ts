/**
 * Plan §16B.5: Myanmar Time is UTC+6:30 all year, so the day boundary is fixed
 * and never needs a timezone database.
 */

const MYANMAR_OFFSET_MINUTES = 6 * 60 + 30;

/** The calendar day an instant falls on in Myanmar Time, as `YYYY-MM-DD`. */
export function myanmarDay(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() + MYANMAR_OFFSET_MINUTES * 60000);
  return shifted.toISOString().slice(0, 10);
}

/** Today's date in Myanmar Time, as `YYYY-MM-DD`. */
export function myanmarToday(now = new Date()): string {
  return myanmarDay(now.toISOString());
}

/** Calendar arithmetic on a `YYYY-MM-DD` string, immune to DST and timezone. */
export function addDaysToDay(day: string, amount: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

/**
 * The instant a Myanmar calendar day begins, as epoch milliseconds. The notice
 * rules are counted from the start of the rental day, so they need the same
 * boundary the server uses (`original_start_date` in `Asia/Yangon`).
 */
export function myanmarDayStartMs(day: string): number {
  return new Date(`${day}T00:00:00+06:30`).getTime();
}

/** Both endpoints count, so a same-day rental is one day. */
export function inclusiveDaysBetween(startDay: string, endDay: string): number {
  const start = new Date(`${startDay}T12:00:00Z`).getTime();
  const end = new Date(`${endDay}T12:00:00Z`).getTime();
  return Math.max(1, Math.round((end - start) / 86400000) + 1);
}

/** The Myanmar wall-clock time of an instant, as `HH:MM`. */
export function myanmarClock(iso: string): string {
  const shifted = new Date(new Date(iso).getTime() + MYANMAR_OFFSET_MINUTES * 60000);
  return shifted.toISOString().slice(11, 16);
}
