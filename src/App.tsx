import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer, PageCopyright } from './components/layout/Footer';
import { HomePage } from './features/home/HomePage';
import { CityPage } from './features/city/CityPage';
import { BlogsPage } from './features/blogs/BlogsPage';
import { TravelPlansPage } from './features/travelPlans/TravelPlansPage';
import { RestaurantPage } from './features/restaurants/RestaurantPage';
import { NearbyPage } from './features/nearby/NearbyPage';
import { AccountPage } from './features/account/AccountPage';
import { NotificationsPage } from './features/notifications/NotificationsPage';
import { BookShopPage } from './features/bookShops/BookShopPage';
import { RentalsPage } from './features/rentals/RentalsPage';
import { TicketingPage } from './features/ticketing/TicketingPage';
import { AuthPage } from './features/auth/AuthPage';
import { AdminLoginPage } from './features/auth/AdminLoginPage';
import { SuperAdminPage } from './features/superAdmin/SuperAdminPage';
import { FavoritesPage } from './features/favorites/FavoritesPage';
import { TravelGuidePage } from './features/travelGuide/TravelGuidePage';
import { SearchPage } from './features/search/SearchPage';
import { AuthProvider, useAuth } from './lib/auth';

function Shell({ children, showFooter = false, fullWidth = false }: { children: React.ReactNode; showFooter?: boolean; fullWidth?: boolean }) {
  const headerSpacing = fullWidth ? 'px-2 sm:px-3 md:px-4' : 'px-4 md:px-8';
  const pageSpacing = fullWidth
    ? 'px-1.5 py-2 pb-[calc(4.25rem_+_env(safe-area-inset-bottom))] sm:px-2 sm:py-3 md:px-3 md:pb-3'
    : 'px-4 py-3 pb-[calc(4.25rem_+_env(safe-area-inset-bottom))] md:px-8 md:pb-3';

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <div className={`sticky top-0 z-50 border-b border-border bg-bg/95 backdrop-blur ${headerSpacing}`}>
        <Header />
      </div>
      <div className={`${pageSpacing} flex flex-1 flex-col`}>
        <main className="flex-1">{children}</main>
        {showFooter ? <div className="hidden md:block"><Footer /></div> : <PageCopyright className="mt-auto hidden md:block" />}
      </div>
    </div>
  );
}

function StandalonePageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <main className="flex flex-1 flex-col">{children}</main>
      <PageCopyright className="mx-4 mb-2 mt-auto md:mx-8" />
    </div>
  );
}

function PlaceholderPage({ title }: { title: string }) { return <Shell><p className="py-10 text-center text-sm text-text-muted">{title} — coming soon.</p></Shell>; }

function LegacyBlogRedirect() {
  const { storyId } = useParams<{ storyId: string }>();
  return <Navigate to={`/blogs?story=${encodeURIComponent(storyId ?? '')}`} replace />;
}

function RequireSuperAdmin() {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!isSuperAdmin) return <Navigate to="/account" replace />;
  return <SuperAdminPage />;
}

function AppRoutes() {
  return <Routes>
    <Route path="/" element={<Shell showFooter><HomePage /></Shell>} />
    <Route path="/cities" element={<Shell><CityPage /></Shell>} />
    <Route path="/nearby" element={<Shell><NearbyPage /></Shell>} />
    <Route path="/rentals" element={<Shell><RentalsPage /></Shell>} />
    <Route path="/restaurants" element={<Shell><RestaurantPage /></Shell>} />
    <Route path="/restaurants/:id" element={<Shell><RestaurantPage /></Shell>} />
    <Route path="/book-shops" element={<Shell><BookShopPage /></Shell>} />
    <Route path="/book-shops/:id" element={<Shell><BookShopPage /></Shell>} />
    <Route path="/ticketing" element={<Shell><TicketingPage /></Shell>} />
    <Route path="/travel-plans" element={<Shell><TravelPlansPage /></Shell>} />
    <Route path="/travel-guide" element={<Shell fullWidth><TravelGuidePage /></Shell>} />
    <Route path="/travel-guide/:guideId" element={<Shell fullWidth><TravelGuidePage /></Shell>} />
    <Route path="/blogs" element={<Shell fullWidth><BlogsPage /></Shell>} />
    <Route path="/blogs/:storyId" element={<LegacyBlogRedirect />} />
    <Route path="/search" element={<Shell><SearchPage /></Shell>} />
    <Route path="/account" element={<Shell><AccountPage /></Shell>} />
    <Route path="/login" element={<Shell><AuthPage /></Shell>} />
    <Route path="/signup" element={<Shell><AuthPage /></Shell>} />
    <Route path="/admin/login" element={<StandalonePageLayout><AdminLoginPage /></StandalonePageLayout>} />
    <Route path="/super-admin" element={<RequireSuperAdmin />} />
    <Route path="/notifications" element={<Shell><NotificationsPage /></Shell>} />
    <Route path="/account/notifications" element={<Shell><NotificationsPage /></Shell>} />
    <Route path="/favorites" element={<Shell><FavoritesPage /></Shell>} />
    <Route path="*" element={<PlaceholderPage title="Not found" />} />
  </Routes>;
}

function App() {
  return <AuthProvider><BrowserRouter><AppRoutes /></BrowserRouter></AuthProvider>;
}

export default App;
