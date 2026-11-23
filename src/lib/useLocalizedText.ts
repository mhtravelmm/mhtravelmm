/**
 * Plan §16B.4 reader seam: every page that shows a bilingual field asks for it
 * through this hook, so a missing language is filled the same way everywhere —
 * the cached translation, the other language, or a Worker request — and the
 * "Auto-translated" marker is decided in one place.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Language } from '../types';
import {
  TRANSLATION_CACHE_EVENT,
  findTranslation,
  readTranslationCache,
  recordTranslationView,
  resolveLocalized,
  writeTranslationCache,
  type LocalizedTextLike,
  type ResolvedText,
  type TranslationRow,
} from './translationCache';
import { translateText } from './translationApi';

export interface LocalizedView extends ResolvedText {
  /** True while the Worker call for this field is in flight. */
  loading: boolean;
}

const IDLE: ResolvedText = { value: '', autoTranslated: false };

export function useTranslationCache(): { rows: TranslationRow[]; setRows: (rows: TranslationRow[]) => void } {
  const [rows, setRows] = useState<TranslationRow[]>(readTranslationCache);

  useEffect(() => {
    const sync = () => setRows(readTranslationCache());
    window.addEventListener(TRANSLATION_CACHE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(TRANSLATION_CACHE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const update = useCallback((next: TranslationRow[]) => {
    writeTranslationCache(next);
    setRows(next);
  }, []);

  return { rows, setRows: update };
}

/**
 * One field for one reader. The cached answer is used immediately; only a text
 * with nothing stored goes to the Worker, and only once per mount.
 */
export function useLocalizedText(text: LocalizedTextLike | undefined, language: Language): LocalizedView {
  const { rows, setRows } = useTranslationCache();
  const [loading, setLoading] = useState(false);

  const resolved = text ? resolveLocalized(text, language, rows) : IDLE;
  const needs = resolved.needs;
  const sourceText = needs && text ? text[needs === 'en' ? 'mm' : 'en'] : '';

  useEffect(() => {
    if (!needs || !sourceText) return;
    let cancelled = false;
    setLoading(true);
    const fromLang: Language = needs === 'en' ? 'mm' : 'en';
    void translateText(sourceText, fromLang, needs).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.ok) return;
      const next = readTranslationCache();
      const stored = findTranslation(next, sourceText, fromLang, needs);
      if (stored) setRows(recordTranslationView(next, stored.id));
    });
    return () => { cancelled = true; };
  }, [needs, sourceText, setRows]);

  return { ...resolved, loading };
}
