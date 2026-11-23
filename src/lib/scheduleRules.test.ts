import { describe, expect, it } from 'vitest';
import {
  isDue,
  myanmarWallClockToUtc,
  publishDueItems,
  utcToMyanmarWallClock,
  type ScheduledItem,
} from './scheduleRules';

const at = (iso: string) => new Date(iso);

describe('Myanmar Time to UTC', () => {
  it('turns a Myanmar wall clock into the UTC instant six and a half hours earlier', () => {
    // 09:00 in Yangon is 02:30 UTC the same day.
    expect(myanmarWallClockToUtc('2026-11-25', '09:00')).toBe('2026-11-25T02:30:00.000Z');
  });

  it('crosses the date line backwards for an early morning schedule', () => {
    // 05:00 on the 25th in Yangon is still the 24th in UTC.
    expect(myanmarWallClockToUtc('2026-11-25', '05:00')).toBe('2026-11-24T22:30:00.000Z');
  });

  it('refuses a date or time it cannot read instead of guessing', () => {
    expect(myanmarWallClockToUtc('', '09:00')).toBeNull();
    expect(myanmarWallClockToUtc('2026-11-25', '')).toBeNull();
    expect(myanmarWallClockToUtc('25-11-2026', '09:00')).toBeNull();
    expect(myanmarWallClockToUtc('2026-11-25', '9:00')).toBeNull();
    expect(myanmarWallClockToUtc('2026-11-25', '24:00')).toBeNull();
    expect(myanmarWallClockToUtc('2026-11-25', '09:60')).toBeNull();
  });

  it('refuses a day that does not exist, which would silently roll into the next month', () => {
    expect(myanmarWallClockToUtc('2026-02-31', '09:00')).toBeNull();
    expect(myanmarWallClockToUtc('2026-11-25', '09:00')).not.toBeNull();
  });

  it('reads the wall clock back out of the stored instant, so the editor reopens where it was left', () => {
    const stored = myanmarWallClockToUtc('2026-11-25', '18:45');
    expect(utcToMyanmarWallClock(stored!)).toEqual({ date: '2026-11-25', time: '18:45' });
  });

  it('reports an unreadable instant as null rather than an empty editor value', () => {
    expect(utcToMyanmarWallClock('not a date')).toBeNull();
  });
});

describe('when an item is due', () => {
  it('is due at and after its instant, not before', () => {
    const scheduledFor = '2026-11-25T02:30:00.000Z';
    expect(isDue(scheduledFor, at('2026-11-25T02:29:59.000Z'))).toBe(false);
    expect(isDue(scheduledFor, at('2026-11-25T02:30:00.000Z'))).toBe(true);
    expect(isDue(scheduledFor, at('2026-11-26T00:00:00.000Z'))).toBe(true);
  });

  it('is never due without a schedule, so a half-typed schedule cannot publish', () => {
    expect(isDue(undefined, at('2026-11-25T02:30:00.000Z'))).toBe(false);
    expect(isDue(null, at('2026-11-25T02:30:00.000Z'))).toBe(false);
    expect(isDue('', at('2026-11-25T02:30:00.000Z'))).toBe(false);
    expect(isDue('later', at('2026-11-25T02:30:00.000Z'))).toBe(false);
  });
});

describe('publishing the items whose time has come', () => {
  type Item = ScheduledItem & { title: string };
  const markPublished = (item: Item): Item => ({ ...item, status: 'Published' });

  const items: Item[] = [
    { id: 'a', title: 'due', status: 'Scheduled', scheduledFor: '2026-11-25T02:30:00.000Z' },
    { id: 'b', title: 'later', status: 'Scheduled', scheduledFor: '2026-11-30T02:30:00.000Z' },
    { id: 'c', title: 'draft', status: 'Draft' },
    { id: 'd', title: 'live', status: 'Published', scheduledFor: '2026-11-01T02:30:00.000Z' },
  ];

  it('publishes only the scheduled item whose instant has passed', () => {
    const { published } = publishDueItems(items, at('2026-11-25T03:00:00.000Z'), markPublished);
    expect(published.map((item) => item.id)).toEqual(['a']);
    expect(published[0].status).toBe('Published');
  });

  it('leaves a draft and an already published item alone even when their dates have passed', () => {
    const { items: next } = publishDueItems(items, at('2026-12-01T00:00:00.000Z'), markPublished);
    expect(next.find((item) => item.id === 'c')?.status).toBe('Draft');
    expect(next.find((item) => item.id === 'd')?.status).toBe('Published');
    expect(next.find((item) => item.id === 'b')?.status).toBe('Published');
  });

  it('publishes nothing on a second run, so a repeated job cannot double publish', () => {
    const now = at('2026-11-25T03:00:00.000Z');
    const first = publishDueItems(items, now, markPublished);
    const second = publishDueItems(first.items, now, markPublished);
    expect(first.published).toHaveLength(1);
    expect(second.published).toHaveLength(0);
  });

  it('returns the same list when nothing is due, so a caller can skip the write', () => {
    const { published, items: next } = publishDueItems(items, at('2026-11-24T00:00:00.000Z'), markPublished);
    expect(published).toHaveLength(0);
    expect(next).toHaveLength(items.length);
  });
});
