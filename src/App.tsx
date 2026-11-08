import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
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
import { BookShopPage } from './features/bookShops/BookShopPage';
import { RentalsPage } from './features/rentals/RentalsPage';
import { TicketingPage } from './features/ticketing/TicketingPage';
import { AuthPage } from './features/auth/AuthPage';
import { AdminLoginPage } from './features/auth/AdminLoginPage';
import { SuperAdminPage } from './features/superAdmin/SuperAdminPage';
import { FavoritesPage } from './features/favorites/FavoritesPage';
import { AuthProvider, useAuth } from './lib/auth';

function Shell({ children, showFooter = false }: { children: React.ReactNode; showFooter?: boolean }) {
  return <div className="min-h-screen bg-bg"><div className="sticky top-0 z-50 border-b border-border bg-bg/95 px-4 backdrop-blur md:px-8"><Header /></div><div className="px-4 py-3 md:px-8"><main>{children}</main>{showFooter && <Footer />}</div></div>;
}

function PlaceholderPage({ title }: { title: string }) { return <Shell><p className="py-10 text-center text-sm text-text-muted">{title} — coming soon.</p></Shell>; }

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
    <Route path="/travel-guide" element={<PlaceholderPage title="Travel Guide" />} />
    <Route path="/blogs" element={<Shell><BlogsPage /></Shell>} />
    <Route path="/search" element={<PlaceholderPage title="Search" />} />
    <Route path="/account" element={<Shell><AccountPage /></Shell>} />
    <Route path="/login" element={<Shell><AuthPage /></Shell>} />
    <Route path="/signup" element={<Shell><AuthPage /></Shell>} />
    <Route path="/admin/login" element={<AdminLoginPage />} />
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
