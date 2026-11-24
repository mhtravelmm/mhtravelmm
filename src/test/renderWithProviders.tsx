import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../lib/auth';
import { CurrencyProvider } from '../lib/currency';
import { FavoritesProvider } from '../lib/favorites';
import { LanguageProvider } from '../lib/i18n';

/**
 * The provider stack every page expects. A page test renders through this so it
 * exercises the same `t()`, currency and favourite seams the browser does —
 * mocking them would let a page pass here and break in the app.
 */
function Providers({ children, path }: { children: ReactNode; path: string }) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <AuthProvider>
          <CurrencyProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
          </CurrencyProvider>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );
}

export function renderAt(path: string, ui: ReactElement): RenderResult {
  return render(<Providers path={path}>{ui}</Providers>);
}

/** The app defaults to Burmese; a test that asserts on English text asks for it. */
export function useEnglish() {
  window.localStorage.setItem('mh-travel-language', 'en');
}

export function useBurmese() {
  window.localStorage.setItem('mh-travel-language', 'mm');
}
