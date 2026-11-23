/**
 * Plan §16B.4: the translation provider is called from a Cloudflare Worker, so
 * the key never reaches the browser. Without `VITE_TRANSLATION_ENDPOINT` the
 * reader falls back to showing the other language rather than inventing text.
 */
import type { Language } from '../types';
import { findTranslation, rememberTranslation, type TranslationRow } from './translationCache';

const MAX_CHARS = 4000;

export type TranslationErrorCode = 'not_configured' | 'too_long' | 'rate_limited' | 'provider_failed' | 'bad_response';

export interface TranslationResult {
  ok: boolean;
  text?: string;
  code?: TranslationErrorCode;
}

export function translationEndpoint(): string | undefined {
  const value = import.meta.env.VITE_TRANSLATION_ENDPOINT as string | undefined;
  return value && value.trim() !== '' ? value.trim() : undefined;
}

/**
 * Asks the Worker for one text. The Worker owns the provider key, the language
 * pair check and the rate limit; this function only sends the text and returns
 * what came back, storing it so the next reader does not ask again.
 */
export async function translateText(
  text: string,
  fromLang: Language,
  toLang: Language,
  at = new Date(),
): Promise<TranslationResult> {
  const source = text.trim();
  if (!source) return { ok: true, text: '' };
  if (source.length > MAX_CHARS) return { ok: false, code: 'too_long' };
  if (fromLang === toLang) return { ok: true, text };

  const endpoint = translationEndpoint();
  if (!endpoint) return { ok: false, code: 'not_configured' };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: source, from: fromLang, to: toLang }),
    });
    if (response.status === 429) return { ok: false, code: 'rate_limited' };
    if (!response.ok) return { ok: false, code: 'provider_failed' };
    const payload = await response.json().catch(() => ({})) as { text?: unknown };
    if (typeof payload.text !== 'string' || payload.text.trim() === '') return { ok: false, code: 'bad_response' };
    rememberTranslation({ sourceText: source, translatedText: payload.text, fromLang, toLang }, at);
    return { ok: true, text: payload.text };
  } catch {
    return { ok: false, code: 'provider_failed' };
  }
}

/** Reads a cached row, or asks the Worker when nothing is stored yet. */
export async function translateOrCached(
  text: string,
  fromLang: Language,
  toLang: Language,
  cached: TranslationRow[],
  at = new Date(),
): Promise<TranslationResult> {
  const hit = findTranslation(cached, text, fromLang, toLang);
  if (hit) return { ok: true, text: hit.translatedText };
  return translateText(text, fromLang, toLang, at);
}
