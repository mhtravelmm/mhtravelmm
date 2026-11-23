import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Language } from '../types';
import { translate, type TranslationKey } from './translations';

export type { TranslationKey };

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'mh-travel-language';

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'mm';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'mm' || stored === 'en') return stored;
  return 'mm';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language === 'mm' ? 'my' : 'en';
  }, [language]);

  const toggleLanguage = () => setLanguage((l) => (l === 'mm' ? 'en' : 'mm'));

  const t = (key: TranslationKey): string => translate(key, language) ?? key;

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
