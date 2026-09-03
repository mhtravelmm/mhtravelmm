import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './features/home/HomePage';

function Shell({
  children,
  footerVariant = 'minimal',
}: {
  children: React.ReactNode;
  footerVariant?: 'full' | 'minimal';
}) {
  return (
    <div className="min-h-screen bg-bg">
      {/* Sticky, full-bleed so it never scrolls away with page content */}
      <div className="sticky top-0 z-50 border-b border-border bg-bg/95 px-4 backdrop-blur md:px-8">
        <Header />
      </div>
      <div className="px-4 py-3 md:px-8">
        <main>{children}</main>
        <Footer variant={footerVariant} />
      </div>
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
