import { describe, expect, it } from 'vitest';
import {
  addDaysToDay,
  inclusiveDaysBetween,
  myanmarDay,
  myanmarDayStartMs,
  myanmarToday,
} from './myanmarTime';

describe('myanmarDay', () => {
  it('moves an instant past the UTC+6:30 boundary', () => {
    expect(myanmarDay('2026-11-20T17:29:00.000Z')).toBe('2026-11-20');
    expect(myanmarDay('2026-11-20T17:30:00.000Z')).toBe('2026-11-21');
  });

  it('reads a UTC midnight as the same Myanmar morning', () => {
    expect(myanmarDay('2026-11-20T00:00:00.000Z')).toBe('2026-11-20');
  });
});

describe('myanmarToday', () => {
  it('is the Myanmar day of the given instant', () => {
    expect(myanmarToday(new Date('2026-11-20T18:00:00.000Z'))).toBe('2026-11-21');
    expect(myanmarToday(new Date('2026-11-20T16:00:00.000Z'))).toBe('2026-11-20');
  });
});

describe('myanmarDayStartMs', () => {
  it('is midnight in Yangon, not midnight UTC', () => {
    expect(myanmarDayStartMs('2026-11-22')).toBe(Date.parse('2026-11-21T17:30:00.000Z'));
  });
});

describe('addDaysToDay', () => {
  it('crosses a month end', () => {
    expect(addDaysToDay('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDaysToDay('2026-12-01', -1)).toBe('2026-11-30');
  });

  it('crosses a year end', () => {
    expect(addDaysToDay('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('is stable across a leap day', () => {
    expect(addDaysToDay('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDaysToDay('2028-02-29', 1)).toBe('2028-03-01');
  });
});

describe('inclusiveDaysBetween', () => {
  it('counts both endpoints, so a same-day rental is one day', () => {
    expect(inclusiveDaysBetween('2026-12-01', '2026-12-01')).toBe(1);
    expect(inclusiveDaysBetween('2026-12-01', '2026-12-02')).toBe(2);
  });

  it('never reports less than one day', () => {
    expect(inclusiveDaysBetween('2026-12-02', '2026-12-01')).toBe(1);
  });
});
