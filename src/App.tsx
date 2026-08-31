import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './features/home/HomePage';
import type { Currency, Language, Theme } from './types';

function Shell({
  children,
  footerVariant = 'minimal',
}: {
  children: React.ReactNode;
  footerVariant?: 'full' | 'minimal';
}) {
  const [language, setLanguage] = useState<Language>('mm');
  const [currency, setCurrency] = useState<Currency>('MMK');
  const [theme, setTheme] = useState<Theme>('dark');

  return (
    <div className="min-h-screen bg-bg px-4 py-3 md:px-8">
      <Header
        language={language}
        onLanguageToggle={() => setLanguage((l) => (l === 'mm' ? 'en' : 'mm'))}
        currency={currency}
        onCurrencyToggle={() => setCurrency((c) => (c === 'MMK' ? 'USD' : 'MMK'))}
        theme={theme}
        onThemeToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      />
      <main>{children}</main>
      <Footer variant={footerVariant} />
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <Shell>
      <p className="py-10 text-center text-sm text-text-muted">{title} — coming soon.</p>
    </Shell>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Shell footerVariant="full">
              <HomePage />
            </Shell>
          }
        />
        <Route path="/cities" element={<PlaceholderPage title="Cities" />} />
        <Route path="/nearby" element={<PlaceholderPage title="Nearby" />} />
        <Route path="/rentals" element={<PlaceholderPage title="Rentals" />} />
        <Route path="/ticketing" element={<PlaceholderPage title="Ticketing" />} />
        <Route path="/travel-plans" element={<PlaceholderPage title="Travel Plans" />} />
        <Route path="/travel-guide" element={<PlaceholderPage title="Travel Guide" />} />
        <Route path="/blogs" element={<PlaceholderPage title="Blogs" />} />
        <Route path="/search" element={<PlaceholderPage title="Search" />} />
        <Route path="/account" element={<PlaceholderPage title="Account" />} />
        <Route path="*" element={<PlaceholderPage title="Not found" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
