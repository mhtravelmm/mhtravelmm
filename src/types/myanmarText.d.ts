/**
 * Type shims for two small, unmaintained Myanmar packages that carry the
 * published Zawgyi rules. Both are CommonJS with no types of their own, and
 * `src/lib/zawgyi.ts` is the only module that imports them, so the shim is one
 * file rather than a `@types` dependency.
 */

declare module 'rabbit-node' {
  /** Zawgyi → Unicode, 115 ordered rewrite rules. */
  export function zg2uni(input: string): string;
  /** Unicode → Zawgyi. Used by the tests to build their vectors, not by the app. */
  export function uni2zg(input: string): string;
}

declare module 'is-zawgyi' {
  /** True when the text carries a Zawgyi-only code point pattern. */
  export default function isZawgyi(text: string): boolean;
}
