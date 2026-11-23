import { describe, expect, it } from 'vitest';
import { normalizeTags, removeTag, tagToAdd, tagsToText } from './tagList';

describe('seo tags are a list (Plan §10 §1)', () => {
  it('keeps an array as it is', () => {
    expect(normalizeTags(['Bagan travel', 'Myanmar temples'])).toEqual(['Bagan travel', 'Myanmar temples']);
  });

  it('reads the old comma-separated field so a stored row still loads', () => {
    expect(normalizeTags('Bagan travel, Myanmar temples ,Bagan sunrise')).toEqual([
      'Bagan travel',
      'Myanmar temples',
      'Bagan sunrise',
    ]);
  });

  it('drops blanks and the empty string the old field could hold', () => {
    expect(normalizeTags('a, ,b,')).toEqual(['a', 'b']);
    expect(normalizeTags('')).toEqual([]);
    expect(normalizeTags(undefined)).toEqual([]);
    expect(normalizeTags(null)).toEqual([]);
  });

  it('drops a duplicate that differs only in case, keeping the first spelling', () => {
    expect(normalizeTags(['Inle', 'inle', 'INLE'])).toEqual(['Inle']);
    expect(normalizeTags('Inle, inle')).toEqual(['Inle']);
  });

  it('ignores a non-string inside a stored array', () => {
    expect(normalizeTags(['ok', 3, null, {}])).toEqual(['ok']);
  });
});

describe('adding and removing a tag', () => {
  it('adds a trimmed tag', () => {
    expect(tagToAdd([], '  Inle Lake  ')).toBe('Inle Lake');
  });

  it('refuses a blank tag', () => {
    expect(tagToAdd(['a'], '   ')).toBeNull();
  });

  it('refuses a tag that is already there in another case', () => {
    expect(tagToAdd(['Inle Lake'], 'inle lake')).toBeNull();
  });

  it('removes the matching tag whatever its case', () => {
    expect(removeTag(['Inle Lake', 'Bagan'], 'inle lake')).toEqual(['Bagan']);
  });
});

describe('a tag list as text', () => {
  it('joins with a comma and a space', () => {
    expect(tagsToText(['a', 'b'])).toBe('a, b');
    expect(tagsToText([])).toBe('');
  });
});
