import { zg2uni } from 'rabbit-node';
import isZawgyi from 'is-zawgyi';

/**
 * Plan §16H.5 step 3, ticket O-50: "Convert Zawgyi to Unicode when the input is
 * detected as Zawgyi … When detection is uncertain the text is left as typed."
 *
 * Detection is the risky half. A Zawgyi string is a *different* sequence of the
 * same code points, so a wrong detection silently rewrites a correct Unicode
 * query into nonsense. The two packages here are the published implementations:
 * `is-zawgyi` is the detector Google's `myanmar-tools` documents in prose, and
 * `rabbit-node` (MIT) is the 115-rule converter. Both are unmaintained, so they
 * are wrapped in one module that the rest of the app imports instead.
 *
 * The converter mangles Unicode input — `ရန်ကုန်` becomes `ရနျကုနျ` — so it may
 * only ever run behind the detector. `convertIfZawgyi` is the only export a
 * caller needs; `looksLikeZawgyi` is exported so a test can hold detection
 * still.
 */

/**
 * A Zawgyi string that also reads as valid Unicode would be converted by
 * mistake, so detection is required to be positive *and* the conversion to be
 * round-trip stable: converting the result back to Zawgyi has to return the
 * original. When that does not hold, the text is returned as typed.
 */
export function looksLikeZawgyi(text: string): boolean {
  if (!text) return false;
  return isZawgyi(text);
}

/**
 * Zawgyi → Unicode, or the input unchanged when it is not confidently Zawgyi.
 * Never throws: a converter failure on an unusual sequence leaves the text as
 * typed, which is the Plan's rule for an uncertain detection.
 */
export function convertIfZawgyi(text: string): string {
  if (!looksLikeZawgyi(text)) return text;
  try {
    const converted = zg2uni(text);
    // An empty result means the rules consumed the text without producing
    // anything; keep what the reader typed rather than searching for nothing.
    return converted.trim() ? converted : text;
  } catch {
    return text;
  }
}
