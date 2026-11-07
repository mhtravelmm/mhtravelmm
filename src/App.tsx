import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './features/home/HomePage';
import { CityPage } from './features/city/CityPage';
import { BlogsPage } from './features/blogs/BlogsPage';
import { TravelPlansPage } from './features/travelPlans/TravelPlansPage';
import { RestaurantPage } from './features/restaurants/RestaurantPage';
import { NearbyPage } from './features/nearby/NearbyPage';
import { AccountPage } from './features/account/AccountPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';

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
        <Route
          path="/cities"
          element={
            <Shell>
              <CityPage />
            </Shell>
          }
        />
        <Route path="/nearby" element={<Shell><NearbyPage /></Shell>} />
        <Route path="/rentals" element={<PlaceholderPage title="Rentals" />} />
        <Route path="/restaurants" element={<Shell><RestaurantPage /></Shell>} />
        <Route path="/restaurants/:id" element={<Shell><RestaurantPage /></Shell>} />
        <Route path="/ticketing" element={<PlaceholderPage title="Ticketing" />} />
        <Route path="/travel-plans" element={<Shell><TravelPlansPage /></Shell>} />
        <Route path="/travel-guide" element={<PlaceholderPage title="Travel Guide" />} />
        <Route path="/blogs" element={<Shell><BlogsPage /></Shell>} />
        <Route path="/search" element={<PlaceholderPage title="Search" />} />
        <Route path="/account" element={<Shell><AccountPage /></Shell>} />
        <Route path="/notifications" element={<Shell><NotificationsPage /></Shell>} />
        <Route path="/account/notifications" element={<Shell><NotificationsPage /></Shell>} />
        <Route path="/favorites" element={<PlaceholderPage title="Favorites" />} />
        <Route path="*" element={<PlaceholderPage title="Not found" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
