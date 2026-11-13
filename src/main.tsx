import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SiteInteractionGuard } from './components/common/SiteInteractionGuard';
import { ThemeProvider } from './lib/theme';
import { LanguageProvider } from './lib/i18n';
import { CurrencyProvider } from './lib/currency';
import { FavoritesProvider } from './lib/favorites';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <CurrencyProvider>
          <FavoritesProvider>
            <SiteInteractionGuard />
            <App />
          </FavoritesProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>
);
