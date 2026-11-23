import { describe, expect, it } from 'vitest';
import type { AdminGuide } from './contentStore';
import { seedGuides } from './contentStore';
import { assignGuideSlug, assignGuideSlugs, guidePath } from './guideSlug';

const guide = (overrides: Partial<AdminGuide> = {}): AdminGuide => ({
  ...seedGuides()[0],
  id: 'admin-guide',
  slug: '',
  titleEn: 'Two Days in Hpa-An',
  ...overrides,
});

describe('a guide slug (Plan §10 §2)', () => {
  it('is the lowercase hyphenated English title', () => {
    expect(assignGuideSlug(guide(), []).slug).toBe('two-days-in-hpa-an');
  });

  it('is fixed after the first publish, so a shared link keeps working', () => {
    const published = guide({ slug: 'two-days-in-hpa-an' });
    expect(assignGuideSlug({ ...published, titleEn: 'A Different Title' }, []).slug)
      .toBe('two-days-in-hpa-an');
  });

  it('is numbered when another guide already holds it', () => {
    const taken = [guide({ id: 'other', slug: 'two-days-in-hpa-an' })];
    expect(assignGuideSlug(guide(), taken).slug).toBe('two-days-in-hpa-an-2');
  });

  it('is numbered against the other guides released in the same run', () => {
    const rows = assignGuideSlugs([
      guide({ id: 'a', slug: '' }),
      guide({ id: 'b', slug: '' }),
    ]);
    expect(rows.map((row) => row.slug)).toEqual(['two-days-in-hpa-an', 'two-days-in-hpa-an-2']);
  });

  it('leaves a guide that already has a slug alone', () => {
    const rows = assignGuideSlugs([guide({ id: 'a', slug: 'kept' }), guide({ id: 'b', slug: '' })]);
    expect(rows[0].slug).toBe('kept');
    expect(rows[1].slug).toBe('two-days-in-hpa-an');
  });
});

describe('a guide URL', () => {
  it('is the slug once the guide has one', () => {
    expect(guidePath({ id: 'guide-1', slug: 'two-days-in-hpa-an' })).toBe('/travel-guide/two-days-in-hpa-an');
  });

  it('falls back to the row id for a guide saved before slugs existed', () => {
    expect(guidePath({ id: 'guide-1', slug: '' })).toBe('/travel-guide/guide-1');
  });
});
