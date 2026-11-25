import { convertIfZawgyi } from './zawgyi';

/**
 * Plan §16H.5, ticket O-50. One definition of "the same text", used by the page
 * and mirrored by `normalize_search_text()` in SQL so the two never disagree.
 *
 * The seven steps below are the Plan's, in its order. Two of them matter more
 * than the rest on Myanmar text: Zawgyi detection (a Zawgyi query must find a
 * Unicode row) and combining-mark ordering (the same word typed with its marks
 * in a different order is the same word). Both are done here rather than in the
 * page so a test can hold them still.
 */

/**
 * Zero-width characters that survive a copy from a web page or a phone keyboard
 * and then make two identical strings compare unequal. Spelled as alternatives
 * because a character class holding a joiner trips `no-misleading-character-class`.
 */
const ZERO_WIDTH = /\u200B|\u200C|\u200D|\u2060|\uFEFF/g;

/** Myanmar digits ၀–၉ (U+1040–U+1049). Shan digits are left alone: U+1090–U+1097
 * are also Zawgyi letters, so mapping them would corrupt text the detector
 * declined to convert. */
const MYANMAR_DIGITS = /[\u1040-\u1049]/g;

/** `,` `၊` `။` `.` `-` `/` become spaces; everything else is kept. */
const SEPARATORS = /[,၊။.\-/]/g;

/**
 * Unicode Technical Note 11 fixes the order a syllable's marks are stored in:
 * the stacking virama, then the four medials, then the vowel signs, then the
 * register and tone marks. Two spellings that render identically but were typed
 * in a different order normalise to the same string, which is what makes a
 * Zawgyi-era habit harmless here.
 */
const MARK_ORDER = [
  '\u1039', // virama (stacks the next consonant)
  '\u103B', '\u103C', '\u103D', '\u103E', // medial ya, ra, wa, ha
  '\u1031', // vowel e (stored before the consonant it follows when spoken)
  '\u102D', '\u102E', '\u102F', '\u1030', '\u1032', // i, ii, u, uu, ai
  '\u102B', '\u102C', '\u1036', // tall aa, aa, anusvara
  '\u1037', '\u103A', '\u1038', // dot below, asat, visarga
];
const MARK_RANK = new Map(MARK_ORDER.map((mark, index) => [mark, index]));

/**
 * A cluster is one base character and the marks that follow it. Splitting before
 * every mark would give each mark its own cluster and sort nothing, so the split
 * is before a base character only.
 */
const CLUSTER_START = /(?=[\u1000-\u102A\u103F\u1040-\u1049\u104E\u1050-\u1055\u105A-\u105D\u1061-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\uAA60-\uAA7F])/;

function orderMarks(text: string): string {
  return text
    .split(CLUSTER_START)
    .map((cluster) => {
      if ([...cluster].length < 2) return cluster;
      const [base, ...marks] = [...cluster];
      const ranked = marks
        .map((mark, index) => ({ mark, index, rank: MARK_RANK.get(mark) }))
        .sort((a, b) => {
          if (a.rank === undefined && b.rank === undefined) return a.index - b.index;
          if (a.rank === undefined) return 1;
          if (b.rank === undefined) return -1;
          return a.rank - b.rank;
        })
        .map((entry) => entry.mark);
      return base + ranked.join('');
    })
    .join('');
}

/**
 * Plan §16H.5, all seven steps. The output is what is compared, stored and
 * logged — never the typed text, because §16H.11 says `search_log` keeps the
 * normalized query only.
 */
export function normalizeSearchText(input: string): string {
  if (!input) return '';
  let text = input.normalize('NFC');
  text = text.toLowerCase();
  text = convertIfZawgyi(text);
  text = text.replace(ZERO_WIDTH, '');
  text = orderMarks(text);
  text = text.replace(MYANMAR_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x1040));
  text = text.replace(SEPARATORS, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * §16H.6: a query is at most 80 characters. The limit is on the typed text,
 * before normalization, because that is what the person sees in the field.
 */
export const MAX_QUERY_LENGTH = 80;

export type QueryProblem = 'search_error_query_too_long' | null;

export function queryProblem(input: string): QueryProblem {
  return [...input].length > MAX_QUERY_LENGTH ? 'search_error_query_too_long' : null;
}
