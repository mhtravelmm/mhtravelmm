import { describe, expect, it } from 'vitest';
import { closesAt, isOpenAt, minutesOfDay, myanmarMinutes } from './openingHours';

/**
 * Plan §16H.9 and §16H.13 criterion 7. Each case here is also a row of
 * `private.is_open_now()` in the migration, so a change on one side that the
 * other does not follow fails this file first.
 */

/** An instant whose Myanmar clock reading is the given `HH:MM`. */
function atMmt(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const utc = Date.UTC(2026, 11, 2, hours, minutes) - (6 * 60 + 30) * 60_000;
  return new Date(utc);
}

describe('the Myanmar clock (§16H.9)', () => {
  it('reads 12:00 UTC as 18:30 in Myanmar', () => {
    expect(myanmarMinutes(new Date('2026-12-02T12:00:00Z'))).toBe(18 * 60 + 30);
  });

  it('wraps past midnight without going negative', () => {
    expect(myanmarMinutes(new Date('2026-12-02T17:30:00Z'))).toBe(0);
    expect(myanmarMinutes(new Date('2026-12-02T18:00:00Z'))).toBe(30);
  });
});

describe('reading a stored time', () => {
  it('accepts HH:MM and HH:MM:SS', () => {
    expect(minutesOfDay('09:30')).toBe(570);
    expect(minutesOfDay('23:59:00')).toBe(1439);
    expect(minutesOfDay('00:00')).toBe(0);
  });

  it('rejects what is not a time', () => {
    for (const value of [null, undefined, '', '9', '24:00', '09:75', 'soon']) {
      expect(minutesOfDay(value as string | null), String(value)).toBeNull();
    }
  });
});

describe('Open Now in Myanmar Time (§16H.13 criterion 7)', () => {
  it('treats an unknown schedule as unknown, never open', () => {
    expect(isOpenAt(null, null, atMmt('12:00'))).toBe(false);
    expect(isOpenAt('09:00', null, atMmt('12:00'))).toBe(false);
    expect(isOpenAt(null, '17:00', atMmt('12:00'))).toBe(false);
    expect(isOpenAt('soon', 'later', atMmt('12:00'))).toBe(false);
  });

  it('reads equal times as a 24-hour listing, open at any hour', () => {
    for (const clock of ['00:00', '03:15', '12:00', '23:59']) {
      expect(isOpenAt('00:00', '00:00', atMmt(clock)), clock).toBe(true);
    }
  });

  it('includes the opening minute and excludes the closing minute', () => {
    expect(isOpenAt('09:00', '17:00', atMmt('09:00'))).toBe(true);
    expect(isOpenAt('09:00', '17:00', atMmt('16:59'))).toBe(true);
    expect(isOpenAt('09:00', '17:00', atMmt('17:00'))).toBe(false);
    expect(isOpenAt('09:00', '17:00', atMmt('08:59'))).toBe(false);
  });

  it('handles an overnight close either side of midnight', () => {
    expect(isOpenAt('22:00', '02:00', atMmt('23:30'))).toBe(true);
    expect(isOpenAt('22:00', '02:00', atMmt('00:30'))).toBe(true);
    expect(isOpenAt('22:00', '02:00', atMmt('01:59'))).toBe(true);
    expect(isOpenAt('22:00', '02:00', atMmt('02:00'))).toBe(false);
    expect(isOpenAt('22:00', '02:00', atMmt('12:00'))).toBe(false);
  });

  it('judges a listing by the Myanmar clock, not the reader\'s', () => {
    // 12:00 UTC is 18:30 in Yangon, so a 09:00–17:00 listing has closed even
    // though the reader's own clock says it is midday.
    expect(isOpenAt('09:00', '17:00', new Date('2026-12-02T12:00:00Z'))).toBe(false);
    expect(isOpenAt('09:00', '19:00', new Date('2026-12-02T12:00:00Z'))).toBe(true);
  });
});

describe('the closing time a card shows', () => {
  it('trims seconds and passes an unknown through as null', () => {
    expect(closesAt('23:30:00')).toBe('23:30');
    expect(closesAt(null)).toBeNull();
  });
});
