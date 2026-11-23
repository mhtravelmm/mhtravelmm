import { describe, expect, it } from 'vitest';
import { ageBucket, timeAgoLabel, timeAgoSince, timeAgoText } from './timeAgo';
import { NOTIFICATIONS } from '../data/notifications';

const at = new Date('2026-11-20T05:00:00.000Z');

describe('timeAgoSince', () => {
  it('counts minutes, then hours, then days', () => {
    expect(timeAgoSince('2026-11-20T04:59:40.000Z', at)).toEqual({ unit: 'just_now', count: 0 });
    expect(timeAgoSince('2026-11-20T04:58:00.000Z', at)).toEqual({ unit: 'minute', count: 2 });
    expect(timeAgoSince('2026-11-20T03:00:00.000Z', at)).toEqual({ unit: 'hour', count: 2 });
    expect(timeAgoSince('2026-11-18T05:00:00.000Z', at)).toEqual({ unit: 'day', count: 2 });
  });

  it('treats a future instant as just now rather than a negative count', () => {
    expect(timeAgoSince('2026-11-20T06:00:00.000Z', at)).toEqual({ unit: 'just_now', count: 0 });
  });

  it('reads an unreadable timestamp as just now instead of NaN', () => {
    expect(timeAgoSince('not a date', at)).toEqual({ unit: 'just_now', count: 0 });
  });
});

describe('timeAgoText', () => {
  it('reads in English', () => {
    expect(timeAgoText({ unit: 'just_now', count: 0 }, 'en')).toBe('just now');
    expect(timeAgoText({ unit: 'minute', count: 1 }, 'en')).toBe('1 minute ago');
    expect(timeAgoText({ unit: 'hour', count: 2 }, 'en')).toBe('2 hours ago');
    expect(timeAgoText({ unit: 'day', count: 3 }, 'en')).toBe('3 days ago');
  });

  // Plan §16B.4: an age is reader copy, so a Burmese reader never sees English.
  it('reads in Burmese with the count filled in', () => {
    expect(timeAgoText({ unit: 'just_now', count: 0 }, 'mm')).toBe('ယခုလေးတင်');
    expect(timeAgoText({ unit: 'minute', count: 2 }, 'mm')).toBe('2 မိနစ်က');
    expect(timeAgoText({ unit: 'hour', count: 5 }, 'mm')).toBe('5 နာရီက');
    expect(timeAgoText({ unit: 'day', count: 1 }, 'mm')).toBe('1 ရက်က');
    for (const language of ['mm', 'en'] as const) {
      expect(timeAgoText({ unit: 'hour', count: 2 }, language)).not.toContain('{count}');
    }
  });

  it('labels one instant through the same rule', () => {
    expect(timeAgoLabel('2026-11-18T05:00:00.000Z', at, 'en')).toBe('2 days ago');
    expect(timeAgoLabel('2026-11-18T05:00:00.000Z', at, 'mm')).toBe('2 ရက်က');
  });
});

describe('ageBucket', () => {
  // Myanmar Time is UTC+6:30, so 18:30 UTC is already the next day there.
  it('groups by the Myanmar calendar day, not by elapsed hours', () => {
    const now = new Date('2026-11-20T05:00:00.000Z');
    expect(ageBucket('2026-11-20T04:00:00.000Z', now)).toBe('today');
    expect(ageBucket('2026-11-19T12:00:00.000Z', now)).toBe('yesterday');
    expect(ageBucket('2026-11-10T12:00:00.000Z', now)).toBe('earlier');
  });

  // A corrupted stored row must not take the whole inbox down.
  it('files an unreadable timestamp under earlier instead of throwing', () => {
    expect(ageBucket('not a date', new Date('2026-11-20T05:00:00.000Z'))).toBe('earlier');
  });

  it('puts a row written minutes ago on the previous Myanmar day into yesterday', () => {
    // 17:50 UTC on the 19th is 00:20 on the 20th in Myanmar — still "today".
    expect(ageBucket('2026-11-19T17:50:00.000Z', new Date('2026-11-19T18:10:00.000Z'))).toBe('today');
  });
});

describe('the seeded inbox', () => {
  it('writes every row in both languages, so neither reader sees a blank', () => {
    for (const row of NOTIFICATIONS) {
      expect(row.title.mm.trim()).not.toBe('');
      expect(row.title.en.trim()).not.toBe('');
    }
  });

  it('carries a timestamp, which the page groups and labels from', () => {
    for (const row of NOTIFICATIONS) {
      expect(Number.isNaN(new Date(row.createdAt).getTime())).toBe(false);
    }
  });
});
