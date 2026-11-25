import { describe, expect, it } from 'vitest';
import { MAX_QUERY_LENGTH, normalizeSearchText, queryProblem } from './searchText';
import { convertIfZawgyi, looksLikeZawgyi } from './zawgyi';

/**
 * Plan §16H.5 and §16H.13, ticket O-50. The vectors the Plan names are here:
 * the same word in Zawgyi and Unicode, the same word with its marks in a
 * different order, `ပုဂံ` / `bagan` / `pagan`, a Myanmar number and its ASCII
 * form, and text carrying a zero-width space.
 *
 * The Zawgyi strings are written as escapes because they look identical to the
 * Unicode ones in an editor, which is exactly the bug this file guards against.
 */

const UNICODE = {
  yangon: 'ရန်ကုန်',
  hotel: 'ဟိုတယ်',
  mandalay: 'မန္တလေး',
  market: 'ဈေး',
  inle: 'အင်းလေး',
};

const ZAWGYI = {
  yangon: '\u101b\u1014\u1039\u1000\u102f\u1014\u1039',
  hotel: '\u101f\u102d\u102f\u1010\u101a\u1039',
  mandalay: '\u1019\u108f\u1072\u1031\u101c\u1038',
  market: '\u1031\u1008\u1038',
  inle: '\u1021\u1004\u1039\u1038\u1031\u101c\u1038',
};

describe('the Zawgyi detector (§16H.5 step 3)', () => {
  it('accepts the Zawgyi spellings and rejects the Unicode ones', () => {
    for (const [key, zawgyi] of Object.entries(ZAWGYI)) {
      expect(looksLikeZawgyi(zawgyi), key).toBe(true);
      expect(looksLikeZawgyi(UNICODE[key as keyof typeof UNICODE]), key).toBe(false);
    }
  });

  it('leaves Latin and an empty string alone', () => {
    expect(looksLikeZawgyi('bagan')).toBe(false);
    expect(looksLikeZawgyi('')).toBe(false);
    expect(convertIfZawgyi('bagan')).toBe('bagan');
    expect(convertIfZawgyi('')).toBe('');
  });

  it('converts a Zawgyi word to the Unicode spelling', () => {
    for (const [key, zawgyi] of Object.entries(ZAWGYI)) {
      expect(convertIfZawgyi(zawgyi), key).toBe(UNICODE[key as keyof typeof UNICODE]);
    }
  });

  it('never rewrites text it did not detect, even though the converter would', () => {
    // `zg2uni()` on its own turns `ရန်ကုန်` into `ရနျကုနျ`. The wrapper must not
    // let that happen, because a wrong conversion is worse than a missed one.
    for (const unicode of Object.values(UNICODE)) {
      expect(convertIfZawgyi(unicode)).toBe(unicode);
    }
  });
});

describe('normalizing a query (§16H.5)', () => {
  it('makes a Zawgyi query and a Unicode query the same string', () => {
    for (const [key, zawgyi] of Object.entries(ZAWGYI)) {
      const unicode = UNICODE[key as keyof typeof UNICODE];
      expect(normalizeSearchText(zawgyi), key).toBe(normalizeSearchText(unicode));
    }
  });

  it('makes a differently ordered spelling the same string', () => {
    // `က` + medial ra + vowel e, and the same three code points with the vowel
    // first: the Plan's "same word, different mark order" vector.
    const stored = '\u1000\u103c\u1031';
    const typed = '\u1000\u1031\u103c';
    expect(normalizeSearchText(stored)).toBe(normalizeSearchText(typed));
  });

  it('leaves text that is already in the standard order untouched', () => {
    for (const word of Object.values(UNICODE)) {
      expect(normalizeSearchText(word), word).toBe(word);
    }
  });

  it('lower-cases Latin and keeps Myanmar as typed', () => {
    expect(normalizeSearchText('BAGAN Hotel')).toBe('bagan hotel');
    expect(normalizeSearchText(UNICODE.hotel)).toBe(UNICODE.hotel);
  });

  it('removes a zero-width space so a pasted word still matches', () => {
    expect(normalizeSearchText('ba\u200Bgan')).toBe('bagan');
    expect(normalizeSearchText('ရန်\u200Dကုန်')).toBe(normalizeSearchText('ရန်ကုန်'));
    expect(normalizeSearchText('\uFEFFbagan')).toBe('bagan');
  });

  it('maps Myanmar digits to ASCII digits', () => {
    expect(normalizeSearchText('၁၂၃')).toBe('123');
    expect(normalizeSearchText('hotel ၂')).toBe('hotel 2');
  });

  it('turns the separator set into spaces and collapses them', () => {
    expect(normalizeSearchText('yangon, bagan')).toBe('yangon bagan');
    expect(normalizeSearchText('yangon၊bagan')).toBe('yangon bagan');
    expect(normalizeSearchText('yangon။bagan')).toBe('yangon bagan');
    expect(normalizeSearchText('yangon-bagan')).toBe('yangon bagan');
    expect(normalizeSearchText('yangon/bagan')).toBe('yangon bagan');
    expect(normalizeSearchText('yangon.bagan')).toBe('yangon bagan');
    expect(normalizeSearchText('  yangon    bagan  ')).toBe('yangon bagan');
  });

  it('handles an empty or whitespace-only query', () => {
    expect(normalizeSearchText('')).toBe('');
    expect(normalizeSearchText('   ')).toBe('');
    expect(normalizeSearchText(',၊။')).toBe('');
  });
});

describe('the 80-character limit (§16H.6)', () => {
  it('accepts a query of exactly the limit and refuses one over it', () => {
    expect(queryProblem('a'.repeat(MAX_QUERY_LENGTH))).toBeNull();
    expect(queryProblem('a'.repeat(MAX_QUERY_LENGTH + 1))).toBe('search_error_query_too_long');
  });

  it('counts code points, so a character outside the BMP is one, not two', () => {
    // A query of 80 emoji is 160 UTF-16 units. Counting units would refuse it
    // at 40 characters, which is not what the field shows the person typing.
    const emoji = '🙂'.repeat(MAX_QUERY_LENGTH);
    expect(emoji.length).toBe(160);
    expect(queryProblem(emoji)).toBeNull();
    expect(queryProblem(`${emoji}🙂`)).toBe('search_error_query_too_long');
  });

  it('counts a Myanmar syllable by its characters, not by its bytes', () => {
    const syllables = 'ရန်ကုန်'.repeat(11) + 'ရန်';
    expect([...syllables].length).toBe(MAX_QUERY_LENGTH);
    expect(queryProblem(syllables)).toBeNull();
    expect(queryProblem(`${syllables}က`)).toBe('search_error_query_too_long');
  });
});
