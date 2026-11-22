import { describe, expect, it } from 'vitest';
import {
  createStop,
  guidePublishCheck,
  minutesOfDay,
  moveStop,
  sortStopsByTime,
  type GuideDraft,
} from './guideItinerary';

const LISTINGS = new Set(['pre1', 'pre2', 'n1']);

function stop(time: string, listingId = 'pre1', titleEn = 'Shwedagon', titleMm = 'ရွှေတိဂုံ') {
  return { ...createStop(), time, listingId, titleEn, titleMm, descriptionEn: 'Morning visit.', descriptionMm: 'မနက်ခင်း လည်ပတ်မှု။' };
}

const base: GuideDraft = {
  titleEn: 'One day in Yangon', titleMm: 'ရန်ကုန် တစ်ရက်',
  excerptEn: 'A calm walk through the center.', excerptMm: 'မြို့လယ်ကို အေးအေးလျှောက်ခရီး။',
  category: 'myanmar', coverUrl: '/images/blog/shwedagon-evening.webp',
  author: 'MH Travel Guides', stops: [stop('08:00'), stop('11:30', 'n1')],
  status: 'Published', scheduledDate: '', scheduledTime: '',
};

describe('minutesOfDay', () => {
  it('reads a 24-hour time', () => {
    expect(minutesOfDay('08:00')).toBe(480);
    expect(minutesOfDay('23:59')).toBe(1439);
  });

  it('rejects a time it cannot read', () => {
    expect(minutesOfDay('8am')).toBeNull();
    expect(minutesOfDay('24:00')).toBeNull();
    expect(minutesOfDay('10:75')).toBeNull();
  });
});

describe('sortStopsByTime', () => {
  it('orders stops by clock time', () => {
    const sorted = sortStopsByTime([stop('16:30'), stop('08:00'), stop('11:30')]);
    expect(sorted.map((item) => item.time)).toEqual(['08:00', '11:30', '16:30']);
  });

  it('does not mutate the input', () => {
    const stops = [stop('16:30'), stop('08:00')];
    sortStopsByTime(stops);
    expect(stops[0].time).toBe('16:30');
  });
});

describe('moveStop', () => {
  it('swaps a stop with its neighbour', () => {
    const stops = [stop('08:00'), stop('11:30', 'n1')];
    expect(moveStop(stops, 1, -1).map((item) => item.time)).toEqual(['11:30', '08:00']);
  });

  it('leaves the list alone at the edges', () => {
    const stops = [stop('08:00'), stop('11:30', 'n1')];
    expect(moveStop(stops, 0, -1)).toBe(stops);
    expect(moveStop(stops, 1, 1)).toBe(stops);
  });
});

describe('guidePublishCheck', () => {
  it('passes a complete guide', () => {
    expect(guidePublishCheck(base, LISTINGS)).toEqual({ ok: true, problems: [] });
  });

  it('requires a stop', () => {
    const result = guidePublishCheck({ ...base, stops: [] }, LISTINGS);
    expect(result.problems).toContainEqual({ code: 'stop_required' });
  });

  it('rejects a stop whose listing does not exist', () => {
    const result = guidePublishCheck({ ...base, stops: [stop('08:00', 'gone')] }, LISTINGS);
    expect(result.problems).toContainEqual({ code: 'stop_listing', count: 1 });
  });

  it('rejects stops that run out of order', () => {
    const result = guidePublishCheck({ ...base, stops: [stop('16:30'), stop('08:00', 'n1')] }, LISTINGS);
    expect(result.problems).toContainEqual({ code: 'stop_time_order' });
  });

  it('rejects an unreadable time', () => {
    const result = guidePublishCheck({ ...base, stops: [stop('morning')] }, LISTINGS);
    expect(result.problems).toContainEqual({ code: 'stop_time_format' });
  });

  it('requires both languages on every stop', () => {
    const result = guidePublishCheck({ ...base, stops: [{ ...stop('08:00'), descriptionMm: '' }] }, LISTINGS);
    expect(result.problems).toContainEqual({ code: 'stop_languages', count: 1 });
  });

  it('requires a date and time when scheduling', () => {
    const result = guidePublishCheck({ ...base, status: 'Scheduled' }, LISTINGS);
    expect(result.problems).toContainEqual({ code: 'schedule' });
  });

  it('requires a cover and an author', () => {
    const result = guidePublishCheck({ ...base, coverUrl: '', author: ' ' }, LISTINGS);
    expect(result.problems).toContainEqual({ code: 'cover' });
    expect(result.problems).toContainEqual({ code: 'author' });
  });
});
