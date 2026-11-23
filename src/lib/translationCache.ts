/**
 * Plan §16B.4: when a text exists in one language only, the reader asks for a
 * translation, caches it in `translation_cache`, and shows it with a small
 * "Auto-translated" marker until an Admin approves or edits it. Names,
 * addresses and prices are never translated, so the field kind decides whether
 * a text may be sent at all.
 *
 * The rules live here without a browser or a network so they can be tested; the
 * Worker call is `translationApi.ts` and the Admin queue is
 * `TranslationReviewPanel.tsx`.
 */
import type { Language } from '../types';

export type TranslationStatus = 'auto' | 'approved' | 'edited';

/** Fields that may be translated. A price, a name or an address never is. */
export type TranslatableField = 'title' | 'excerpt' | 'prose' | 'caption' | 'alt' | 'description' | 'name' | 'address' | 'price';

const TRANSLATABLE: TranslatableField[] = ['title', 'excerpt', 'prose', 'caption', 'alt', 'description'];

export interface TranslationRow {
  id: string;
  /** `sourceHash`, so the same text is stored once per language pair. */
  sourceHash: string;
  fromLang: Language;
  toLang: Language;
  sourceText: string;
  translatedText: string;
  status: TranslationStatus;
  reviewedBy: string;
  /** How many readers have seen the row; the queue shows the busiest first. */
  views: number;
  createdAt: string;
}

export interface LocalizedTextLike {
  en: string;
  mm: string;
}

const STORAGE_KEY = 'mh-travel-translation-cache';
const CHANGED_EVENT = 'mh-travel-translation-cache-changed';
const MAX_ROWS = 400;

export const TRANSLATION_CACHE_EVENT = CHANGED_EVENT;

/** Plan §16B.4: names, addresses and prices are never translated. */
export function isTranslatable(field: TranslatableField): boolean {
  return TRANSLATABLE.includes(field);
}

/**
 * A short, stable key for one text in one direction. Two readers asking for the
 * same paragraph share a row, and the server can compute the same hash.
 */
export function sourceHash(text: string, fromLang: Language, toLang: Language): string {
  const input = `${fromLang}>${toLang}:${text.trim()}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * The language the text still lacks, or `null` when it has both or neither. A
 * text with both needs nothing; a text with neither has nothing to translate.
 */
export function missingLanguage(text: LocalizedTextLike): Language | null {
  const hasEn = text.en.trim() !== '';
  const hasMm = text.mm.trim() !== '';
  if (hasMm && !hasEn) return 'en';
  if (hasEn && !hasMm) return 'mm';
  return null;
}

/** The language a text is written in, when exactly one is filled. */
export function writtenLanguage(text: LocalizedTextLike): Language | null {
  const missing = missingLanguage(text);
  if (!missing) return null;
  return missing === 'en' ? 'mm' : 'en';
}

function isRow(value: unknown): value is TranslationRow {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<TranslationRow>;
  return typeof row.id === 'string'
    && typeof row.sourceHash === 'string'
    && typeof row.sourceText === 'string'
    && typeof row.translatedText === 'string'
    && (row.status === 'auto' || row.status === 'approved' || row.status === 'edited');
}

export function readTranslationCache(): TranslationRow[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(isRow) : [];
  } catch {
    return [];
  }
}

export function writeTranslationCache(rows: TranslationRow[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, MAX_ROWS)));
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

/** The row for one text, preferring a reviewed copy over an automatic one. */
export function findTranslation(rows: TranslationRow[], text: string, fromLang: Language, toLang: Language): TranslationRow | null {
  const hash = sourceHash(text, fromLang, toLang);
  const matches = rows.filter((row) => row.sourceHash === hash && row.fromLang === fromLang && row.toLang === toLang);
  if (matches.length === 0) return null;
  return matches.find((row) => row.status !== 'auto') ?? matches[0];
}

/** Stores an automatic translation, once per hash; a reviewed row is never overwritten. */
export function rememberTranslation(
  input: { sourceText: string; translatedText: string; fromLang: Language; toLang: Language },
  at = new Date(),
): TranslationRow | null {
  const sourceText = input.sourceText.trim();
  const translatedText = input.translatedText.trim();
  if (!sourceText || !translatedText || input.fromLang === input.toLang) return null;
  const rows = readTranslationCache();
  const existing = findTranslation(rows, sourceText, input.fromLang, input.toLang);
  if (existing) return existing;
  const row: TranslationRow = {
    id: `tr-${sourceHash(sourceText, input.fromLang, input.toLang)}`,
    sourceHash: sourceHash(sourceText, input.fromLang, input.toLang),
    fromLang: input.fromLang,
    toLang: input.toLang,
    sourceText,
    translatedText,
    status: 'auto',
    reviewedBy: '',
    views: 0,
    createdAt: at.toISOString(),
  };
  writeTranslationCache([row, ...rows]);
  return row;
}

/**
 * Plan §16B.4: approving makes the text permanent; editing changes it as well.
 * Both clear the "Auto-translated" marker, which is why the marker reads the
 * status rather than a flag of its own.
 */
export function reviewTranslation(
  rows: TranslationRow[],
  id: string,
  reviewer: string,
  editedText?: string,
): TranslationRow[] {
  const trimmed = editedText?.trim();
  return rows.map((row) => {
    if (row.id !== id) return row;
    if (trimmed && trimmed !== row.translatedText) {
      return { ...row, translatedText: trimmed, status: 'edited' as const, reviewedBy: reviewer };
    }
    return { ...row, status: 'approved' as const, reviewedBy: reviewer };
  });
}

/** Plan §16B.4: the queue is the automatic rows, busiest first. */
export function reviewQueue(rows: TranslationRow[]): TranslationRow[] {
  return rows
    .filter((row) => row.status === 'auto')
    .sort((a, b) => b.views - a.views || b.createdAt.localeCompare(a.createdAt));
}

/** One reader saw the row, which is what ranks it in the queue. */
export function recordTranslationView(rows: TranslationRow[], id: string): TranslationRow[] {
  return rows.map((row) => (row.id === id ? { ...row, views: row.views + 1 } : row));
}

export interface ResolvedText {
  value: string;
  /** True only for an unreviewed automatic translation, which shows the marker. */
  autoTranslated: boolean;
  /** The language still needed, when nothing has been translated yet. */
  needs?: Language;
}

/**
 * What a reader shows for one field: the text in their language, else the
 * cached translation, else the other language with `needs` set so the caller
 * can ask the Worker.
 */
export function resolveLocalized(text: LocalizedTextLike, language: Language, rows: TranslationRow[]): ResolvedText {
  const own = text[language].trim();
  if (own !== '') return { value: text[language], autoTranslated: false };
  const source = writtenLanguage(text);
  if (!source) return { value: '', autoTranslated: false };
  const sourceText = text[source];
  const cached = findTranslation(rows, sourceText, source, language);
  if (cached) return { value: cached.translatedText, autoTranslated: cached.status === 'auto' };
  return { value: sourceText, autoTranslated: false, needs: language };
}

/**
 * Plan §16B.4: a name, an address and a price are never translated, but they
 * still must not come out blank. This reads the reader's language and falls
 * back to the one that was written, with no Worker request and no marker.
 */
export function localizedOrFallback(text: LocalizedTextLike | undefined, language: Language): string {
  if (!text) return '';
  const own = text[language]?.trim() ?? '';
  if (own !== '') return text[language];
  return text[language === 'en' ? 'mm' : 'en'] ?? '';
}

/** The rows still waiting for a decision, for the Admin badge. */
export function pendingReviewCount(rows: TranslationRow[]): number {
  return rows.filter((row) => row.status === 'auto').length;
}
