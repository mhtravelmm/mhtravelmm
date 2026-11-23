import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  CircleDollarSign,
  Coins,
  FileText,
  Eye,
  Globe2,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  Megaphone,
  Menu,
  Moon,
  Plane,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';
import { useCurrency } from '../../lib/currency';
import { BlogPostsPanel } from './BlogPostsPanel';
import { TravelGuidesPanel } from './TravelGuidesPanel';
import { RentalAdminPanel } from './RentalAdminPanel';
import { RentalOrdersPanel } from './RentalOrdersPanel';
import { RentalReportsPanel } from './RentalReportsPanel';
import { GuideEarningsPanel } from './GuideEarningsPanel';
import { AuditLogPanel } from './AuditLogPanel';
import { JobsPanel } from './JobsPanel';
import {
  STAFF_NOTIFICATIONS_EVENT,
  STAFF_NOTIFICATIONS_KEY,
  readStaffNotifications,
  type StaffNotification,
} from '../../lib/rentalNotifications';
import { ADMIN_ROLES, CREATABLE_ADMIN_ROLES, DEFAULT_PERMISSION_GROUP, PERMISSION_GROUPS, type AdminRole } from '../../lib/adminRoles';
import { sectionsForRole } from '../../lib/adminWorkspace';
import { adminSummary, mergeAdminRows, type AdminRow } from '../../lib/adminAccounts';
import { recordAdminAudit, useAuditRecorder } from '../../lib/adminAudit';
import { planRoleChange, roleChangeSummary, type RoleChangeRefusal } from '../../lib/adminRoleChange';
import { EXCHANGE_RATES_EVENT, readExchangeRates } from '../../lib/exchangeRates';
import { pushAdminNotice } from '../../lib/adminNotices';

type AdminView = 'overview' | 'users' | 'admins' | 'owners' | 'bookings' | 'content' | 'blogs' | 'guides' | 'guideEarnings' | 'ads' | 'currency' | 'rentals' | 'rentalOrders' | 'rentalReports' | 'audit' | 'jobs';
type Accent = 'blue' | 'green' | 'purple' | 'amber' | 'cyan';
type AdminNotification = StaffNotification;

/** Accounts the platform ships with; created accounts are merged in front. */
const SEEDED_ADMINS: AdminRow[] = [
  { name: 'MH Travel Super Admin', email: 'superadmin@mhtravel.com', role: 'Super Admin', permissions: 'All permissions', status: 'Active' },
  { name: 'Thazin Win', email: 'thazin@mhtravel.com', role: 'Blog Post Admin', permissions: 'Content, Blogs', status: 'Active' },
  { name: 'Aung Ko', email: 'aung.ko@mhtravel.com', role: 'Admin', permissions: 'Users, Support', status: 'Active' },
];

const ADMIN_NOTIFICATIONS_KEY = STAFF_NOTIFICATIONS_KEY;
const readAdminNotifications = readStaffNotifications;

type NavItem = {
  id: AdminView;
  labelKey: TranslationKey;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { id: 'overview', labelKey: 'sa_nav_dashboard', icon: LayoutDashboard },
  { id: 'users', labelKey: 'sa_nav_users', icon: Users },
  { id: 'admins', labelKey: 'sa_nav_admins', icon: ShieldCheck },
  { id: 'owners', labelKey: 'sa_nav_owners', icon: Building2 },
  { id: 'bookings', labelKey: 'sa_nav_bookings', icon: CalendarDays },
  { id: 'content', labelKey: 'sa_nav_plans', icon: Map },
  { id: 'rentals', labelKey: 'sa_nav_rentals', icon: Building2 },
  { id: 'rentalOrders', labelKey: 'sa_nav_rental_orders', icon: CalendarDays },
  { id: 'rentalReports', labelKey: 'sa_nav_rental_reports', icon: TrendingUp },
  { id: 'bookings', labelKey: 'sa_nav_tickets', icon: Plane },
  { id: 'guides', labelKey: 'sa_nav_guides', icon: BookOpen },
  { id: 'guideEarnings', labelKey: 'sa_nav_guide_earnings', icon: Coins },
  { id: 'content', labelKey: 'sa_nav_cities', icon: MapPin },
  { id: 'blogs', labelKey: 'sa_nav_blogs', icon: FileText },
  { id: 'ads', labelKey: 'sa_nav_ads', icon: Megaphone },
  { id: 'content', labelKey: 'sa_nav_reviews', icon: Star },
  { id: 'bookings', labelKey: 'sa_nav_payments', icon: WalletCards },
  { id: 'overview', labelKey: 'sa_nav_reports', icon: TrendingUp },
  { id: 'currency', labelKey: 'sa_nav_currency', icon: CircleDollarSign },
  { id: 'audit', labelKey: 'sa_nav_audit', icon: ShieldCheck },
  { id: 'jobs', labelKey: 'sa_nav_jobs', icon: Clock },
];

const statCards: { labelKey: TranslationKey; value: string; change: string; icon: LucideIcon; accent: Accent; points: string }[] = [
  { labelKey: 'sa_stat_users', value: '48,750', change: '+12.5%', icon: Users, accent: 'blue', points: '0,38 18,28 32,34 48,19 63,25 79,10 96,16 112,2' },
  { labelKey: 'sa_stat_bookings', value: '32,680', change: '+18.7%', icon: CalendarDays, accent: 'green', points: '0,34 18,29 32,32 48,18 63,24 79,12 96,16 112,3' },
  { labelKey: 'sa_stat_plans', value: '12,540', change: '+20.1%', icon: WalletCards, accent: 'purple', points: '0,34 17,32 32,22 48,29 64,14 80,20 96,7 112,1' },
  { labelKey: 'sa_stat_revenue', value: '$243,750', change: '+25.3%', icon: CircleDollarSign, accent: 'amber', points: '0,37 17,30 32,34 48,21 64,26 80,14 96,17 112,2' },
  { labelKey: 'sa_stat_reviews', value: '98,720', change: '+10.8%', icon: Star, accent: 'cyan', points: '0,34 18,27 32,31 48,18 64,25 80,13 96,17 112,3' },
];

const bookings: { id: string; user: string; serviceKey: TranslationKey; date: string; statusKey: TranslationKey; tone: Accent }[] = [
  { id: '#BKG-1001', user: 'Thar Thar', serviceKey: 'sa_svc_yangon_bangkok', date: 'Nov 20, 2026', statusKey: 'sa_status_confirmed', tone: 'green' },
  { id: '#BKG-1002', user: 'May Myat', serviceKey: 'sa_svc_inya_hotel', date: 'Nov 19, 2026', statusKey: 'sa_status_pending', tone: 'blue' },
  { id: '#BKG-1003', user: 'Ko Min Htet', serviceKey: 'sa_svc_car_rental', date: 'Nov 18, 2026', statusKey: 'sa_status_completed', tone: 'purple' },
  { id: '#BKG-1004', user: 'Nay Lin', serviceKey: 'sa_svc_mandalay_tour', date: 'Nov 17, 2026', statusKey: 'sa_status_confirmed', tone: 'green' },
  { id: '#BKG-1005', user: 'Ei Ei Khaing', serviceKey: 'sa_svc_yangon_singapore', date: 'Nov 16, 2026', statusKey: 'sa_status_cancelled', tone: 'amber' },
];

const cities: { key: TranslationKey; views: string; change: string; image: string }[] = [
  { key: 'sa_city_yangon', views: '120.5K', change: '+22%', image: '/images/blog/shwedagon-evening.webp' },
  { key: 'sa_city_mandalay', views: '98.7K', change: '+18%', image: '/images/blog/ubein-evening.webp' },
  { key: 'sa_city_bagan', views: '85.4K', change: '+16%', image: '/images/blog/bagan-sunrise.webp' },
  { key: 'sa_city_inle', views: '72.1K', change: '+14%', image: '/images/blog/inle-stilt-houses.webp' },
  { key: 'sa_city_ngapali_beach', views: '60.8K', change: '+12%', image: '/images/blog/myanmar-wellness.webp' },
];

const recentUsers = [
  { name: 'Moe Thu', minutes: 2, initials: 'MT' },
  { name: 'Aung Ko', minutes: 5, initials: 'AK' },
  { name: 'Thazin Win', minutes: 8, initials: 'TW' },
  { name: 'Min Khant', minutes: 12, initials: 'MK' },
  { name: 'Su Mon', minutes: 15, initials: 'SM' },
];

const accentClasses: Record<Accent, { card: string; icon: string; line: string }> = {
  blue: { card: 'from-blue-700 to-blue-600', icon: 'bg-blue-300/25 text-blue-100', line: '#67d6ff' },
  green: { card: 'from-green-700 to-lime-600', icon: 'bg-lime-200/25 text-lime-100', line: '#a4ff2e' },
  purple: { card: 'from-violet-700 to-purple-600', icon: 'bg-fuchsia-200/25 text-fuchsia-100', line: '#d78cff' },
  amber: { card: 'from-orange-600 to-amber-500', icon: 'bg-yellow-100/25 text-yellow-50', line: '#ffe65c' },
  cyan: { card: 'from-cyan-700 to-teal-500', icon: 'bg-cyan-100/25 text-cyan-50', line: '#78f6ff' },
};

export function SuperAdminPage() {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, adminRole, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<AdminView>('overview');
  const [period, setPeriod] = useState('Last 30 Days');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [notifications, setNotifications] = useState<AdminNotification[]>(readAdminNotifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    function syncNotifications(event: StorageEvent) {
      if (event.key === ADMIN_NOTIFICATIONS_KEY) setNotifications(readAdminNotifications());
    }
    const syncLocal = () => setNotifications(readAdminNotifications());
    window.addEventListener('storage', syncNotifications);
    window.addEventListener(STAFF_NOTIFICATIONS_EVENT, syncLocal);
    return () => {
      window.removeEventListener('storage', syncNotifications);
      window.removeEventListener(STAFF_NOTIFICATIONS_EVENT, syncLocal);
    };
  }, []);

  function signOut() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  // Plan §3 and §16B.1: one workspace, scoped per role. Super Admin keeps every
  // section; each other role sees only its own permission row.
  // A session stored before `adminRole` was hydrated still has to work, so a
  // super admin without one falls back to the full workspace. Any other role
  // without a product role sees nothing rather than everything.
  const effectiveRole = adminRole ?? (isSuperAdmin ? 'Super Admin' : undefined);
  const allowedSections = sectionsForRole(effectiveRole);
  const visibleNav = navItems.filter((item) => allowedSections.includes(item.id));
  const activeView: AdminView = visibleNav.some((item) => item.id === view) ? view : (visibleNav[0]?.id ?? view);

  function selectNav(nextView: AdminView) {
    setView(nextView);
    setMobileMenuOpen(false);
  }

  function runAction(label: string) {
    setNotice(`${label} ${t('sa_ready_next')}`);
    window.setTimeout(() => setNotice(''), 2600);
  }

  function addOwnerApplicationNotification(shop: { owner: string; business: string; city: string; category: string }) {
    setNotifications((current) => [{
      id: `owner-application-${Date.now()}`,
      title: t('sa_owner_application_title'),
      message: `${shop.business} · ${shop.city} · ${shop.category} · submitted by ${shop.owner}`,
      createdAt: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
      read: false,
    }, ...current].slice(0, 30));
    setNotificationsOpen(true);
  }

  function markNotificationsRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }

  const displayName = user?.name || t('admin_super_admin');
  const roleBadge = effectiveRole ?? t('sa_super_administrator');
  const initials = displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#061426] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[190px] shrink-0 flex-col border-r border-[#214263] bg-[#08182d] lg:flex">
          <div className="flex h-[48px] items-center gap-2 border-b border-[#214263] px-3 text-lg font-bold tracking-tight text-[#28c4ff]">
            <Plane className="rotate-[-18deg]" size={34} strokeWidth={2.4} />
            <span>MH Travel</span>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-cyan-300 bg-gradient-to-br from-cyan-400 to-blue-700 text-sm font-bold text-white shadow-lg shadow-cyan-500/20">{initials}</div>
              <div className="min-w-0"><p className="truncate text-sm font-bold">{displayName}</p><p className="mt-1 truncate text-[11px] text-slate-400">{user?.email || 'admin@mhtravelmm.com'}</p></div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-yellow-300/70 bg-yellow-400/10 px-2 py-0.5 text-[9px] font-bold text-yellow-300"><ShieldCheck size={12} /> {roleBadge}</div>
          </div>
          <nav className="flex-1 space-y-0.5 px-2 pb-3">
            {visibleNav.map((item, index) => {
              const Icon = item.icon;
              const active = item.id === activeView && (activeView === 'overview' ? index === 0 : true);
              return <button key={`${item.labelKey}-${index}`} type="button" onClick={() => selectNav(item.id)} className={`group flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition ${active ? 'bg-gradient-to-r from-[#159eff] to-[#1478ed] font-semibold text-white shadow-lg shadow-blue-900/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Icon size={18} className={active ? 'text-white' : 'text-slate-200'} /><span>{t(item.labelKey)}</span>{item.labelKey === 'sa_nav_users' && <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[9px]">3</span>}</button>;
            })}
          </nav>
          <button type="button" onClick={signOut} className="flex items-center gap-3 border-t border-[#214263] px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"><LogOut size={19} /> {t('sa_logout')}</button>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="relative flex h-[48px] items-center justify-between gap-4 border-b border-[#214263] bg-[#071a32]/95 px-3 backdrop-blur sm:px-4 lg:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden" aria-label={t('sa_open_menu')}>{mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}</button>
              <div className="flex w-full max-w-[360px] items-center gap-3 rounded-full border border-[#2a5383] bg-[#0e2b53] px-3 py-1.5 text-slate-300 shadow-inner"><Search size={17} /><input aria-label={t('sa_search_dashboard')} placeholder={t('sa_search_placeholder')} className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-300/80" /></div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button type="button" onClick={toggleLanguage} className="hidden items-center gap-2 text-sm font-semibold text-white sm:flex"><Globe2 size={18} />{language === 'mm' ? 'မြန်မာ' : 'English'}<ChevronDown size={14} /></button>
              <button type="button" onClick={toggleTheme} className="hidden rounded-full p-1.5 text-slate-200 hover:bg-white/10 sm:block" aria-label={t('sa_toggle_theme')}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
              <button type="button" onClick={() => setNotificationsOpen((open) => !open)} className="relative rounded-full p-1.5 text-white hover:bg-white/10" aria-label={t('sa_notifications')}><Bell size={19} fill="currentColor" />{notifications.some((notification) => !notification.read) && <span className="absolute -right-0.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">{notifications.filter((notification) => !notification.read).length}</span>}</button>
              <div className="hidden items-center gap-2 sm:flex"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-700 text-[10px] font-bold text-white">{initials}</div><span className="text-sm font-semibold">{roleBadge}</span><ChevronDown size={14} className="text-slate-300" /></div>
            </div>
            {notificationsOpen && <div className="absolute right-3 top-12 z-40 w-[min(360px,calc(100vw-24px))] rounded-lg border border-[#2b527d] bg-[#0b203b] p-2 shadow-2xl sm:right-5"><div className="flex items-center justify-between border-b border-[#244668] px-2 pb-2"><div><p className="text-xs font-bold text-white">{t('sa_admin_notifications')}</p><p className="text-[10px] text-slate-400">{t('sa_admin_notifications_detail')}</p></div><button type="button" onClick={markNotificationsRead} className="text-[10px] font-semibold text-cyan-300 hover:text-white">{t('sa_mark_all_read')}</button></div><div className="max-h-72 overflow-y-auto pt-1">{notifications.length === 0 ? <p className="px-2 py-5 text-center text-xs text-slate-400">{t('sa_no_notifications')}</p> : notifications.map((notification) => <button key={notification.id} type="button" onClick={() => setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item))} className={`block w-full rounded-md px-2 py-2 text-left ${notification.read ? 'bg-transparent' : 'bg-cyan-400/10'}`}><div className="flex items-start gap-2"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.read ? 'bg-slate-600' : 'bg-cyan-300'}`} /><span className="min-w-0"><strong className="block text-[11px] text-white">{notification.title}</strong><span className="mt-0.5 block text-[10px] leading-4 text-slate-300">{notification.message}</span><span className="mt-1 block text-[9px] text-slate-500">{notification.createdAt}</span></span></div></button>)}</div></div>}
          </header>

          {mobileMenuOpen && <div className="border-b border-[#214263] bg-[#08182d] p-3 lg:hidden"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{visibleNav.map((item, index) => { const Icon = item.icon; return <button key={`${item.labelKey}-mobile-${index}`} type="button" onClick={() => selectNav(item.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs ${item.id === activeView ? 'bg-[#168df4] text-white' : 'bg-white/5 text-slate-300'}`}><Icon size={15} />{t(item.labelKey)}</button>; })}</div><button type="button" onClick={signOut} className="mt-2 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400"><LogOut size={15} /> {t('sa_logout')}</button></div>}

          <main className="p-1.5 sm:p-2 lg:p-3">
            {notice && <div role="status" className="fixed right-4 top-20 z-50 rounded-lg border border-cyan-300/30 bg-[#102e51] px-3 py-2 text-xs text-cyan-100 shadow-2xl">{notice}</div>}
            {activeView === 'overview' ? <Overview period={period} setPeriod={setPeriod} runAction={runAction} onOpenAdmins={() => setView('admins')} onOpenOwners={() => setView('owners')} onOpenBlogs={() => setView('blogs')} /> : activeView === 'admins' ? <AdminManagementPanel runAction={runAction} onOpenAudit={() => setView('audit')} /> : activeView === 'owners' ? <ShopOwnersPanel runAction={runAction} onOwnerApplication={addOwnerApplicationNotification} /> : activeView === 'blogs' ? <BlogPostsPanel runAction={runAction} /> : activeView === 'guides' ? <TravelGuidesPanel runAction={runAction} /> : activeView === 'guideEarnings' ? <GuideEarningsPanel /> : activeView === 'audit' ? <AuditLogPanel /> : activeView === 'jobs' ? <JobsPanel /> : activeView === 'ads' ? <AdsManagementPanel runAction={runAction} /> : activeView === 'currency' ? <CurrencySettingsPanel runAction={runAction} /> : activeView === 'rentals' ? <RentalAdminPanel runAction={runAction} /> : activeView === 'rentalOrders' ? <RentalOrdersPanel /> : activeView === 'rentalReports' ? <RentalReportsPanel /> : <AdminSection view={activeView} runAction={runAction} />}
          </main>
          <footer className="mt-auto flex flex-col gap-1 border-t border-[#214263] bg-[#071a32] px-3 py-2 text-center text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:text-left"><div><p className="text-base font-bold text-[#27c2ff]">MH Travel</p><p className="mt-1">{t('sa_footer_tagline')}</p></div><p>{t('sa_copyright')}</p><div className="flex justify-center gap-2 text-cyan-300 sm:justify-end"><span className="rounded-full border border-cyan-300/30 px-1.5 py-0.5 text-[10px]">f</span><span className="rounded-full border border-cyan-300/30 px-1.5 py-0.5 text-[10px]">▶</span></div></footer>
        </div>
      </div>
    </div>
  );
}

function Overview({ period, setPeriod, runAction, onOpenAdmins, onOpenOwners, onOpenBlogs }: { period: string; setPeriod: (value: string) => void; runAction: (label: string) => void; onOpenAdmins: () => void; onOpenOwners: () => void; onOpenBlogs: () => void }) {
  const { t } = useLanguage();
  return <div className="mx-auto max-w-[1400px] space-y-3">
    <section className="relative min-h-[68px] overflow-hidden rounded-lg border border-[#315985] bg-[#0d2f57] p-2 shadow-xl sm:p-3">
      <img src="/images/blog/shwedagon-evening.webp" alt={t('sa_overview_hero_alt')} className="absolute inset-0 h-full w-full object-cover opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b2c58] via-[#0b2b50]/70 to-[#07172d]/45" />
      <div className="relative flex h-full flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-[#49cfff]"><ShieldCheck size={19} /><span className="text-xs font-semibold uppercase tracking-[0.16em]">{t('sa_control_center')}</span></div><h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">{t('sa_dashboard_title')}</h1><p className="mt-1 text-sm text-blue-100">{t('sa_dashboard_intro')}</p></div><label className="flex w-fit items-center gap-2 rounded-lg border border-white/25 bg-[#09203c]/85 px-3 py-2 text-xs font-semibold"><CalendarDays size={16} /><select value={period} onChange={(event) => setPeriod(event.target.value)} className="bg-transparent text-white outline-none"><option value="Last 7 Days">{t('sa_period_7')}</option><option value="Last 30 Days">{t('sa_period_30')}</option><option value="Last 90 Days">{t('sa_period_90')}</option><option value="This Year">{t('sa_period_year')}</option></select><ChevronDown size={14} /></label></div>
    </section>
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-5">{statCards.map((card) => <MetricCard key={card.labelKey} {...card} />)}</div>
    <div className="grid gap-2 xl:grid-cols-[1.55fr_0.9fr_0.82fr]"><AnalyticsPanel /><DistributionPanel /><QuickActions runAction={runAction} onOpenAdmins={onOpenAdmins} onOpenOwners={onOpenOwners} onOpenBlogs={onOpenBlogs} /></div>
    <div className="grid gap-2 xl:grid-cols-[1.35fr_0.92fr_0.92fr]"><RecentBookings runAction={runAction} /><PopularCities /><RecentUsers /></div>
  </div>;
}

function MetricCard({ labelKey, value, change, icon: Icon, accent, points }: (typeof statCards)[number]) {
  const { t } = useLanguage();
  const colors = accentClasses[accent];
  return <article className={`relative min-h-[68px] overflow-hidden rounded-lg border border-white/20 bg-gradient-to-br ${colors.card} p-2 shadow-lg`}><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-white/90">{t(labelKey)}</p><p className="mt-2 text-xl font-extrabold tracking-tight">{value}</p><p className="mt-1 text-xs font-bold text-lime-200">↑ {change}</p></div><span className={`rounded-lg p-2 ${colors.icon}`}><Icon size={24} /></span></div><svg viewBox="0 0 112 42" preserveAspectRatio="none" className="absolute bottom-0 right-0 h-7 w-[58%] opacity-80"><polyline points={points} fill="none" stroke={colors.line} strokeWidth="2.3" /></svg></article>;
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl ${className}`}>{children}</section>; }
function PanelTitle({ icon: Icon, title, action, onAction }: { icon: LucideIcon; title: string; action?: string; onAction?: () => void }) { return <div className="flex items-center justify-between border-b border-[#244668] px-2 py-1.5"><h2 className="flex items-center gap-2 text-sm font-bold"><Icon size={17} className="text-[#26b8ff]" />{title}</h2>{action && <button type="button" onClick={onAction} className="text-xs font-semibold text-[#31c6ff] hover:text-white">{action} <ChevronRight size={13} className="inline" /></button>}</div>; }

function AnalyticsPanel() { const { t } = useLanguage(); return <Panel><PanelTitle icon={Activity} title={t('sa_platform_analytics')} action="30D" /><div className="p-3"><div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300"><div className="flex gap-3"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#2ca7ff]" />{t('sa_legend_bookings')}</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#64dc27]" />{t('sa_legend_users')}</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ffae19]" />{t('sa_legend_revenue')}</span></div><div className="flex gap-2 text-slate-400"><span>7D</span><span className="rounded-full bg-[#168df4] px-2 py-1 text-white">30D</span><span>90D</span><span>1Y</span></div></div><div className="relative h-[100px] overflow-hidden rounded-lg border border-[#244668] bg-[#081a31] p-2"><div className="absolute inset-0 flex flex-col justify-between p-3 text-[10px] text-slate-500"><span>40K</span><span>30K</span><span>20K</span><span>10K</span><span>0</span></div><svg viewBox="0 0 640 180" preserveAspectRatio="none" className="absolute inset-x-8 bottom-3 top-3 h-[calc(100%-24px)] w-[calc(100%-48px)]"><g stroke="#294867" strokeDasharray="3 4"><line x1="0" y1="12" x2="640" y2="12" /><line x1="0" y1="52" x2="640" y2="52" /><line x1="0" y1="92" x2="640" y2="92" /><line x1="0" y1="132" x2="640" y2="132" /><line x1="0" y1="172" x2="640" y2="172" /></g><path d="M0 103 C45 88 62 98 95 74 S144 105 183 82 S237 101 276 66 S325 92 363 78 S415 94 451 57 S505 83 540 35 S587 77 640 28 L640 180 L0 180 Z" fill="url(#blueFill)" /><path d="M0 123 C45 115 63 130 95 106 S145 129 183 112 S236 130 276 94 S325 120 363 106 S414 122 451 86 S505 113 540 66 S589 111 640 55" fill="none" stroke="#6de91f" strokeWidth="3" /><path d="M0 150 C45 136 65 151 95 131 S144 151 183 139 S235 153 276 125 S325 144 363 130 S416 146 451 119 S506 142 540 105 S587 142 640 90" fill="none" stroke="#ffb31c" strokeWidth="3" /><path d="M0 103 C45 88 62 98 95 74 S144 105 183 82 S237 101 276 66 S325 92 363 78 S415 94 451 57 S505 83 540 35 S587 77 640 28" fill="none" stroke="#2ca7ff" strokeWidth="3" /><defs><linearGradient id="blueFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#198fe8" stopOpacity=".38" /><stop offset="1" stopColor="#198fe8" stopOpacity="0" /></linearGradient></defs></svg><div className="absolute bottom-1 left-10 right-4 flex justify-between text-[10px] text-slate-400"><span>Oct 1</span><span>Oct 7</span><span>Oct 13</span><span>Oct 19</span><span>Oct 25</span><span>Oct 30</span></div></div></div></Panel>; }


function DistributionPanel() { const { t } = useLanguage(); return <Panel><PanelTitle icon={Zap} title={t('sa_service_distribution')} /><div className="flex items-center gap-3 p-3"><div className="relative h-24 w-24 shrink-0 rounded-full" style={{ background: 'conic-gradient(#168df4 0 32.5%, #4bdc13 32.5% 61.2%, #ff9912 61.2% 79.4%, #9d35e8 79.4% 91.8%, #39d8e8 91.8% 100%)' }}><div className="absolute inset-[18px] flex flex-col items-center justify-center rounded-full bg-[#0b203b] text-center"><span className="text-2xl font-extrabold">100%</span><span className="text-[10px] text-slate-300">{t('sa_total')}</span></div></div><div className="space-y-1.5 text-[10px] text-slate-200"><DistributionRow color="bg-[#168df4]" name={t('sa_dist_flights')} value="32.5%" /><DistributionRow color="bg-[#4bdc13]" name={t('sa_dist_hotels')} value="28.7%" /><DistributionRow color="bg-[#ff9912]" name={t('sa_dist_rentals')} value="18.2%" /><DistributionRow color="bg-[#9d35e8]" name={t('sa_dist_plans')} value="12.4%" /><DistributionRow color="bg-[#39d8e8]" name={t('sa_dist_others')} value="8.2%" /></div></div></Panel>; }
function DistributionRow({ color, name, value }: { color: string; name: string; value: string }) { return <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span className="min-w-[70px]">{name}</span><strong>{value}</strong></div>; }

function QuickActions({ runAction, onOpenAdmins, onOpenOwners, onOpenBlogs }: { runAction: (label: string) => void; onOpenAdmins: () => void; onOpenOwners: () => void; onOpenBlogs: () => void }) {
  const { t } = useLanguage();
  const actions: { id: string; key: TranslationKey; icon: LucideIcon }[] = [
    { id: 'city', key: 'sa_action_add_city', icon: MapPin },
    { id: 'plan', key: 'sa_action_create_plan', icon: Plus },
    { id: 'blog', key: 'sa_action_add_blog', icon: FileText },
    { id: 'ads', key: 'sa_action_manage_ads', icon: Megaphone },
    { id: 'owner', key: 'sa_action_create_owner', icon: Building2 },
    { id: 'admin', key: 'sa_action_create_admin', icon: UserPlus },
    { id: 'users', key: 'sa_action_manage_users', icon: Users },
    { id: 'reports', key: 'sa_action_view_reports', icon: TrendingUp },
    { id: 'settings', key: 'sa_action_system_settings', icon: Settings },
  ];
  return <Panel><PanelTitle icon={Zap} title={t('sa_quick_actions')} /><div className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-3 xl:grid-cols-2">{actions.map(({ id, key, icon: Icon }) => <button key={id} type="button" onClick={() => id === 'owner' ? onOpenOwners() : id === 'admin' ? onOpenAdmins() : id === 'blog' ? onOpenBlogs() : runAction(t(key))} className="flex min-h-[44px] flex-col items-center justify-center gap-2 rounded-xl border border-[#244668] bg-[#102c51] p-1.5 text-center text-[10px] font-semibold text-slate-200 transition hover:border-cyan-300 hover:bg-[#174472]"><Icon size={24} className="text-[#1da7ff]" />{t(key)}</button>)}</div></Panel>;
}

function RecentBookings({ runAction }: { runAction: (label: string) => void }) {
  const { t } = useLanguage();
  const toneClass = (tone: Accent) => tone === 'green' ? 'bg-green-500/25 text-green-300' : tone === 'purple' ? 'bg-purple-500/25 text-purple-300' : tone === 'amber' ? 'bg-orange-500/25 text-orange-300' : 'bg-blue-500/25 text-blue-300';
  return <Panel><PanelTitle icon={CalendarDays} title={t('sa_recent_bookings')} action={t('sa_view_all')} onAction={() => runAction(t('sa_recent_bookings'))} /><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-[11px]"><thead className="bg-[#091a31] text-slate-300"><tr><th className="px-2 py-1.5">#</th><th className="px-2 py-3">{t('sa_col_user')}</th><th className="px-2 py-3">{t('sa_col_service')}</th><th className="px-2 py-3">{t('sa_col_date')}</th><th className="px-2 py-3">{t('sa_col_status')}</th><th className="px-4 py-3">{t('sa_col_action')}</th></tr></thead><tbody>{bookings.map((booking) => <tr key={booking.id} className="border-t border-[#1d3a5c] text-slate-200"><td className="px-2 py-1.5 font-semibold text-slate-400">{booking.id}</td><td className="px-2 py-3">{booking.user}</td><td className="px-2 py-3">{t(booking.serviceKey)}</td><td className="px-2 py-3 whitespace-nowrap">{booking.date}</td><td className="px-2 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${toneClass(booking.tone)}`}>{t(booking.statusKey)}</span></td><td className="px-2 py-1.5"><button type="button" onClick={() => runAction(booking.id)} className="text-lg text-slate-200 hover:text-cyan-300">◉</button></td></tr>)}</tbody></table></div></Panel>;
}

function PopularCities() {
  const { t } = useLanguage();
  return <Panel><PanelTitle icon={MapPin} title={t('sa_popular_cities')} action={t('sa_view_all')} /><div className="space-y-2 p-3">{cities.map((city, index) => <div key={city.key} className="flex items-center gap-2 border-b border-[#1d3a5c] pb-2 last:border-0"><span className="w-4 text-center text-sm font-bold">{index + 1}</span><img src={city.image} alt="" className="h-9 w-12 rounded-md object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{t(city.key)}</p><p className="text-[10px] text-slate-400">{city.views} {t('sa_views')}</p></div><span className="text-xs font-bold text-cyan-300">↑ {city.change}</span></div>)}</div></Panel>;
}

function RecentUsers() {
  const { t, language } = useLanguage();
  const number = (value: number) => new Intl.NumberFormat(language === 'mm' ? 'my-MM' : 'en-US').format(value);
  return <Panel><PanelTitle icon={Users} title={t('sa_recent_users')} action={t('sa_view_all')} /><div className="space-y-2 p-3">{recentUsers.map((entry) => <div key={entry.name} className="flex items-center gap-3 border-b border-[#1d3a5c] pb-2 last:border-0"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-700 text-[10px] font-bold">{entry.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{entry.name}</p><p className="text-[10px] text-slate-400">{number(entry.minutes)} {t('sa_minutes_ago')}</p></div><span className="rounded-full bg-green-500/25 px-2 py-1 text-[9px] font-bold text-green-300">{t('sa_status_active')}</span></div>)}</div></Panel>;
}

function CurrencySettingsPanel({ runAction }: { runAction: (label: string) => void }) {
  const { t } = useLanguage();
  const { exchangeRate, setExchangeRate, currency, formatCurrencyAmount } = useCurrency();
  const { user } = useAuth();
  const audit = useAuditRecorder();
  const [draftRate, setDraftRate] = useState(String(exchangeRate));
  const [note, setNote] = useState('');
  // Plan §16B.5: rows are append-only, so the panel reads the history rather
  // than a single stored number.
  const [rows, setRows] = useState(readExchangeRates);
  useEffect(() => {
    const sync = () => setRows(readExchangeRates());
    window.addEventListener(EXCHANGE_RATES_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EXCHANGE_RATES_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  function saveRate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextRate = Number(draftRate);
    if (!Number.isFinite(nextRate) || nextRate <= 0) return;
    const before = Math.round(exchangeRate).toLocaleString('en-US');
    const after = Math.round(nextRate).toLocaleString('en-US');
    setExchangeRate(nextRate, { setBy: user?.name ?? 'Super Admin', note: note.trim() });
    audit({
      action: 'updated',
      objectType: 'currency_rate',
      objectId: 'USD/MMK',
      summary: `${before} → ${after} MMK per USD${note.trim() ? ` · ${note.trim()}` : ''}`,
      source: 'currency',
    });
    setRows(readExchangeRates());
    setNote('');
    runAction(`${t('sa_currency_saved')}: 1 USD = ${after} MMK`);
  }

  return <div className="mx-auto max-w-[1100px] space-y-3">
    <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('sa_currency_kicker')}</p><h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('sa_nav_currency')}</h1><p className="mt-1 text-sm text-slate-400">{t('sa_currency_intro')}</p></div>
    <div className="grid gap-2 lg:grid-cols-[1.1fr_0.9fr]">
      <Panel><PanelTitle icon={CircleDollarSign} title={t('sa_currency_rate_title')} /><form onSubmit={saveRate} className="space-y-3 p-3">
        <label className="block text-xs font-semibold text-slate-300">{t('sa_currency_rate_label')}<input value={draftRate} onChange={(event) => setDraftRate(event.target.value)} type="number" min="1" step="1" className="mt-1.5 w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" /></label>
        <label className="block text-xs font-semibold text-slate-300">{t('sa_currency_note_label')}<input value={note} onChange={(event) => setNote(event.target.value)} placeholder={t('sa_currency_note_placeholder')} className="mt-1.5 w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300 placeholder:text-slate-500" /></label>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-2 text-xs"><span className="text-slate-300">{t('sa_currency_current')}</span><strong className="text-cyan-200">1 USD = {Math.round(exchangeRate).toLocaleString('en-US')} MMK</strong></div>
        <button type="submit" className="rounded-lg bg-[#168df4] px-3 py-2 text-xs font-bold text-white hover:bg-[#2aa6ff]">{t('sa_currency_save')}</button>
      </form></Panel>
      <Panel><PanelTitle icon={Globe2} title={t('sa_currency_preview')} /><div className="space-y-2 p-3 text-xs"><p className="text-slate-400">{t('sa_currency_display')} <strong className="text-white">{currency}</strong>.</p>{[1, 10, 100].map((amount) => <div key={amount} className="flex items-center justify-between rounded-lg border border-[#244668] bg-[#102c51] px-3 py-2"><span>{amount} USD</span><strong className="text-cyan-200">{formatCurrencyAmount(amount, 'MMK')}</strong></div>)}<p className="pt-1 text-[10px] text-slate-500">{t('sa_currency_note')}</p></div></Panel>
    </div>
    <Panel><PanelTitle icon={Clock} title={t('sa_currency_history_title')} /><div className="border-b border-[#244668] px-3 py-2 text-[10px] text-slate-400">{t('sa_currency_history_note')}</div><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-[11px]"><thead className="bg-[#091a31] text-slate-300"><tr><th className="px-3 py-2">{t('sa_currency_col_rate')}</th><th className="px-2 py-2">{t('sa_currency_col_from')}</th><th className="px-2 py-2">{t('sa_currency_col_by')}</th><th className="px-3 py-2">{t('sa_currency_col_note')}</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-[#1d3a5c] text-slate-200"><td className="px-3 py-2 font-semibold text-cyan-200">{Math.round(row.mmkPerUsd).toLocaleString('en-US')}</td><td className="whitespace-nowrap px-2 py-2 text-slate-400">{row.effectiveFrom.slice(0, 16).replace('T', ' ')}</td><td className="px-2 py-2 text-slate-300">{row.setBy}</td><td className="px-3 py-2 text-slate-400">{row.note || '—'}</td></tr>)}</tbody></table></div>{rows.length === 0 && <p className="p-4 text-center text-xs text-slate-500">{t('sa_currency_history_empty')}</p>}</Panel>
  </div>;
}

type AdminForm = {
  name: string;
  email: string;
  phone: string;
  role: (typeof CREATABLE_ADMIN_ROLES)[number];
  permissions: string;
  password: string;
};

const EMPTY_ADMIN_FORM: AdminForm = {
  name: '',
  email: '',
  phone: '',
  role: CREATABLE_ADMIN_ROLES[0],
  permissions: DEFAULT_PERMISSION_GROUP[CREATABLE_ADMIN_ROLES[0]],
  password: '',
};

function AdminManagementPanel({ runAction, onOpenAudit }: { runAction: (label: string) => void; onOpenAudit: () => void }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { createAdminAccount, changeAdminRole, adminAccounts, user, adminRole } = useAuth();
  const audit = useAuditRecorder();
  const [showForm, setShowForm] = useState(false);
  // Plan §16B.1: the table lists the accounts that exist, so a created admin
  // stays listed after a reload instead of living in this component's state.
  const admins = useMemo(() => mergeAdminRows(SEEDED_ADMINS, adminAccounts), [adminAccounts]);
  const summary = useMemo(() => adminSummary(admins), [admins]);
  const [form, setForm] = useState<AdminForm>(EMPTY_ADMIN_FORM);
  const [formError, setFormError] = useState('');
  const [roleError, setRoleError] = useState('');

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function selectRole(role: AdminForm['role']) {
    setForm((current) => ({ ...current, role, permissions: DEFAULT_PERMISSION_GROUP[role] }));
  }

  const REFUSALS: Record<RoleChangeRefusal, TranslationKey> = {
    not_super_admin: 'sa_role_change_refused_forbidden',
    self: 'sa_role_change_refused_self',
    super_admin_locked: 'sa_role_change_refused_super',
    unchanged: 'sa_role_change_refused_unchanged',
    unknown_role: 'sa_role_change_refused_unknown',
  };

  function changeRole(target: AdminRow, nextRole: AdminRole) {
    const plan = planRoleChange({
      actorRole: adminRole,
      actorEmail: user?.email ?? '',
      targetEmail: target.email,
      targetRole: target.role,
      nextRole,
    });
    if (!plan.ok) {
      // Selecting the role a row already has is not an error worth a banner.
      setRoleError(plan.reason === 'unchanged' ? '' : t(REFUSALS[plan.reason]));
      return;
    }
    const result = changeAdminRole(target.email, nextRole);
    if (!result.ok) {
      setRoleError(t('sa_role_change_refused_missing'));
      return;
    }
    audit({
      action: 'role_change',
      objectType: 'admin_account',
      objectId: target.email,
      summary: `${target.name} · ${roleChangeSummary(plan.from, plan.to)}`,
      source: 'admin_workspace',
    });
    setRoleError('');
    runAction(t('sa_role_change_saved').replace('{name}', target.name).replace('{role}', plan.to));
  }

  async function createAdmin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await createAdminAccount({ name: form.name, email: form.email, role: form.role, password: form.password });
    if (!result.ok) {
      setFormError(result.message === 'auth_email_exists' ? t('sa_err_email_exists') : t('sa_err_invalid'));
      return;
    }
    recordAdminAudit({
      actor: user?.name ?? '',
      actorRole: adminRole ?? 'system',
      action: 'created',
      objectType: 'admin_account',
      objectId: form.email.trim().toLowerCase(),
      summary: `${form.name.trim()} · ${form.role} · ${form.permissions}`,
      source: 'admin_workspace',
    });
    // Plan §16D Phase 0 gate: creating an admin writes the audit row and raises
    // the notification in the same step.
    pushAdminNotice({
      title: t('sa_notice_admin_created_title'),
      message: t('sa_notice_admin_created_body')
        .replace('{name}', form.name.trim())
        .replace('{role}', form.role),
    });
    setForm(EMPTY_ADMIN_FORM);
    setFormError('');
    setShowForm(false);
    runAction(`${form.name} ${t('sa_admins_created')}`);
  }

  return <div className="mx-auto max-w-[1200px] space-y-3">
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('sa_admins_kicker')}</p><h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('sa_nav_admins')}</h1><p className="mt-1 text-sm text-slate-400">{t('sa_admins_intro')}</p></div><button type="button" onClick={() => setShowForm((open) => !open)} className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#168df4] px-3 py-2 text-[10px] font-bold hover:bg-[#2aa6ff]"><UserPlus size={16} /> {t('sa_action_create_admin')}</button></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><AdSummary icon={ShieldCheck} label={t('sa_admins_total')} value={String(summary.total)} detail={t('sa_admins_total_detail')} tone="cyan" /><AdSummary icon={Users} label={t('sa_admins_active')} value={String(summary.active)} detail={t('sa_admins_active_detail')} tone="green" /><AdSummary icon={UserPlus} label={t('sa_admins_pending')} value={String(summary.pending)} detail={t('sa_admins_pending_detail')} tone="purple" /><AdSummary icon={Settings} label={t('sa_admins_groups')} value={String(summary.groups)} detail={t('sa_admins_groups_detail')} tone="blue" /></div>
    {showForm && <Panel><PanelTitle icon={UserPlus} title={t('sa_admins_form_title')} /><form onSubmit={createAdmin} className="grid gap-1.5 p-2 sm:grid-cols-2 lg:grid-cols-3"><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_admins_name')}</span><input required value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder={t('sa_admins_name_placeholder')} className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_admins_email')}</span><input required type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="admin@mhtravel.com" className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_admins_phone')}</span><input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} placeholder="+95 9 ..." className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_admins_password')}</span><input required minLength={8} type="password" value={form.password} onChange={(event) => updateForm('password', event.target.value)} placeholder={t('sa_admins_password_hint')} className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_admins_role')}</span><select value={form.role} onChange={(event) => selectRole(event.target.value as AdminForm['role'])} className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300">{CREATABLE_ADMIN_ROLES.map((role) => <option key={role}>{role}</option>)}</select></label><label className="block sm:col-span-2"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_admins_permissions')}</span><select value={form.permissions} onChange={(event) => updateForm('permissions', event.target.value)} className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300">{PERMISSION_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>{formError && <p role="alert" className="sm:col-span-2 lg:col-span-3 rounded-lg border border-red-400/40 bg-red-500/10 px-2 py-1.5 text-[10px] text-red-200">{formError}</p>}<div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3"><button type="submit" className="rounded-lg bg-cyan-400 px-3 py-2 text-[10px] font-bold text-[#061426] hover:bg-cyan-300">{t('sa_admins_create')}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[#2b527d] px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10">{t('sa_cancel')}</button><span className="text-[10px] text-slate-500">{t('sa_admins_note')}</span></div></form></Panel>}
    <Panel><PanelTitle icon={ShieldCheck} title={t('sa_admins_table_title')} action={t('sa_admins_audit')} onAction={onOpenAudit} />{roleError && <p role="alert" className="border-b border-red-400/30 bg-red-500/10 px-3 py-2 text-[10px] text-red-200">{roleError}</p>}<div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-[11px]"><thead className="bg-[#091a31] text-slate-300"><tr><th className="px-4 py-3">{t('sa_col_admin')}</th><th className="px-2 py-3">{t('sa_col_email')}</th><th className="px-2 py-3">{t('sa_col_role')}</th><th className="px-2 py-3">{t('sa_col_permissions')}</th><th className="px-2 py-3">{t('sa_col_status')}</th><th className="px-4 py-3">{t('sa_col_action')}</th></tr></thead><tbody>{admins.map((admin) => <tr key={admin.email} className="border-t border-[#1d3a5c] text-slate-200"><td className="px-2 py-1.5 font-semibold">{admin.name}</td><td className="px-2 py-3 text-slate-400">{admin.email}</td><td className="px-2 py-3">{admin.role}</td><td className="px-2 py-3 text-slate-400">{admin.permissions}</td><td className="px-2 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${admin.status === 'Active' ? 'bg-green-500/25 text-green-300' : 'bg-amber-400/20 text-amber-300'}`}>{admin.status === 'Active' ? t('sa_status_active') : t('sa_status_pending_invite')}</span></td><td className="px-2 py-1.5"><div className="flex flex-wrap items-center gap-1"><select aria-label={`${t('sa_role_change_label')} — ${admin.name}`} value={admin.role} onChange={(event) => changeRole(admin, event.target.value as AdminRole)} disabled={admin.role === 'Super Admin' || !admin.stored} className="rounded-md border border-[#2f6192] bg-[#081a31] px-2 py-1.5 text-[10px] text-cyan-200 outline-none disabled:opacity-40">{ADMIN_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select><button type="button" onClick={() => runAction(`${t('sa_review')} ${admin.name}`)} className="rounded-md border border-[#2f6192] px-2.5 py-1.5 text-[10px] font-semibold text-cyan-300 hover:bg-white/10">{t('sa_review')}</button></div></td></tr>)}</tbody></table></div></Panel>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-cyan-400/20 bg-[#0d2f57] p-3 text-xs text-blue-100"><p><strong className="text-white">{t('sa_admins_staff_title')}</strong> {t('sa_admins_staff_note')}</p><button type="button" onClick={() => navigate('/super-admin')} className="font-bold text-cyan-300 hover:text-white">{t('sa_back_dashboard')} <ChevronRight size={14} className="inline" /></button></div>
  </div>;
}

function ShopOwnersPanel({ runAction, onOwnerApplication }: { runAction: (label: string) => void; onOwnerApplication: (shop: { owner: string; business: string; city: string; category: string }) => void }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { createShopOwner } = useAuth();
  const audit = useAuditRecorder();
  const [showForm, setShowForm] = useState(false);
  const [createdOwners, setCreatedOwners] = useState([
    { owner: 'The Rangoon House', shop: 'The Rangoon House', username: 'rangoon_house', city: 'Yangon', category: 'Restaurant', status: 'Active' },
    { owner: 'Mandalay Book Nook', shop: 'Mandalay Book Nook', username: 'mandalay_booknook', city: 'Mandalay', category: 'Book Shop', status: 'Pending' },
  ]);
  const [lastCredentials, setLastCredentials] = useState<{ shop: string; username: string; password: string } | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ owner: '', shop: '', email: '', phone: '', username: '', password: '', city: 'Yangon', category: 'Restaurant' });
  const [cityFilter, setCityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function generateCredentials() {
    const base = form.shop.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'shop_owner';
    const username = `${base}_${Math.floor(100 + Math.random() * 900)}`;
    const password = `MH@${Math.random().toString(36).slice(2, 8)}!`;
    setForm((current) => ({ ...current, username, password }));
  }

  async function createOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const result = await createShopOwner({ owner: form.owner, shop: form.shop, email: form.email, phone: form.phone, username: form.username, password: form.password, city: form.city, category: form.category });
    if (!result.ok) {
      setFormError(result.message === 'auth_username_exists' ? t('sa_err_username_exists') : result.message === 'auth_email_exists' ? t('sa_err_email_in_use') : t('sa_err_owner_unavailable'));
      return;
    }
    setCreatedOwners((current) => [{ owner: form.owner, shop: form.shop, username: form.username, city: form.city, category: form.category, status: 'Pending' }, ...current]);
    audit({
      action: 'created',
      objectType: 'shop_owner',
      objectId: form.username.trim().toLowerCase(),
      summary: `${form.shop} · ${form.city} · ${form.category}`,
      source: 'admin_workspace',
    });
    onOwnerApplication({ owner: form.owner, business: form.shop, city: form.city, category: form.category });
    setLastCredentials({ shop: form.shop, username: form.username, password: form.password });
    setForm({ owner: '', shop: '', email: '', phone: '', username: '', password: '', city: 'Yangon', category: 'Restaurant' });
    setShowForm(false);
    runAction(`${form.shop} ${t('sa_owners_created')}`);
  }

  const cityLabels: Record<string, TranslationKey> = { Yangon: 'sa_city_yangon', Mandalay: 'sa_city_mandalay', Bagan: 'sa_city_bagan', 'Inle Lake': 'sa_city_inle', Ngapali: 'sa_city_ngapali' };
  const categoryLabels: Record<string, TranslationKey> = { Restaurant: 'sa_cat_restaurant', Hotel: 'sa_cat_hotel', 'Book Shop': 'sa_cat_bookshop', Rental: 'sa_cat_rental', Cafe: 'sa_cat_cafe', Attraction: 'sa_cat_attraction' };

  const filteredOwners = createdOwners.filter((owner) => (
    (cityFilter === 'All' || owner.city === cityFilter)
    && (categoryFilter === 'All' || owner.category === categoryFilter)
    && (statusFilter === 'All' || owner.status === statusFilter)
  ));

  return <div className="mx-auto max-w-[1200px] space-y-3">
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('sa_owners_kicker')}</p><h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('sa_nav_owners')}</h1><p className="mt-1 text-sm text-slate-400">{t('sa_owners_intro')}</p></div><button type="button" onClick={() => setShowForm((open) => !open)} className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#168df4] px-3 py-2 text-[10px] font-bold hover:bg-[#2aa6ff]"><Plus size={16} /> {t('sa_action_create_owner')}</button></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><AdSummary icon={Users} label={t('sa_owners_total')} value="28" detail={t('sa_owners_total_detail')} tone="cyan" /><AdSummary icon={Building2} label={t('sa_owners_shops')} value="42" detail={t('sa_owners_shops_detail')} tone="blue" /><AdSummary icon={MapPin} label={t('sa_owners_cities')} value="9" detail={t('sa_owners_cities_detail')} tone="purple" /><AdSummary icon={ShieldCheck} label={t('sa_owners_verified')} value="24" detail={t('sa_owners_verified_detail')} tone="green" /></div>
    {lastCredentials && <div className="rounded-lg border border-amber-300/40 bg-amber-400/10 p-3 text-sm text-amber-100"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-amber-200">{t('sa_owners_cred_title')} {lastCredentials.shop}</p><p className="mt-1 text-xs text-amber-100/75">{t('sa_owners_cred_note')}</p></div><button type="button" onClick={() => setLastCredentials(null)} className="text-xs font-semibold text-amber-200 hover:text-white">{t('sa_dismiss')}</button></div><div className="mt-3 grid gap-2 sm:grid-cols-2"><div className="rounded-lg border border-amber-200/20 bg-[#2d2a1b]/60 px-3 py-2"><span className="block text-[10px] uppercase tracking-wider text-amber-100/60">{t('sa_owners_cred_username')}</span><code className="font-bold text-white">{lastCredentials.username}</code></div><div className="rounded-lg border border-amber-200/20 bg-[#2d2a1b]/60 px-3 py-2"><span className="block text-[10px] uppercase tracking-wider text-amber-100/60">{t('sa_owners_temp_password')}</span><code className="font-bold text-white">{lastCredentials.password}</code></div></div></div>}
    {showForm && <Panel><PanelTitle icon={Building2} title={t('sa_owners_form_title')} /><form onSubmit={createOwner} className="grid gap-1.5 p-2 sm:grid-cols-2 lg:grid-cols-3"><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_owners_name')}</span><input required value={form.owner} onChange={(event) => updateForm('owner', event.target.value)} placeholder={t('sa_owners_name_placeholder')} className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_owners_shop')}</span><input required value={form.shop} onChange={(event) => updateForm('shop', event.target.value)} placeholder={t('sa_owners_shop_placeholder')} className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_owners_email')}</span><input required type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="owner@example.com" className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_admins_phone')}</span><input required value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} placeholder="+95 9 ..." className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_owners_login')}</span><input required pattern="[a-z0-9_]{3,32}" title={t('sa_owners_username_hint')} value={form.username} onChange={(event) => updateForm('username', event.target.value.toLowerCase())} placeholder="shop_owner_001" className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_owners_temp_password')}</span><input required minLength={8} value={form.password} onChange={(event) => updateForm('password', event.target.value)} placeholder={t('sa_admins_password_hint')} autoComplete="new-password" className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300" /></label><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_owners_city')}</span><select value={form.city} onChange={(event) => updateForm('city', event.target.value)} className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300"><option value="Yangon">{t('sa_city_yangon')}</option><option value="Mandalay">{t('sa_city_mandalay')}</option><option value="Bagan">{t('sa_city_bagan')}</option><option value="Inle Lake">{t('sa_city_inle')}</option><option value="Ngapali">{t('sa_city_ngapali')}</option></select></label><label className="block"><span className="mb-1 block text-[10px] font-semibold text-slate-300">{t('sa_owners_category')}</span><select value={form.category} onChange={(event) => updateForm('category', event.target.value)} className="w-full rounded-lg border border-[#2b527d] bg-[#081a31] px-2 py-1 text-[11px] text-white outline-none focus:border-cyan-300"><option value="Restaurant">{t('sa_cat_restaurant')}</option><option value="Hotel">{t('sa_cat_hotel')}</option><option value="Book Shop">{t('sa_cat_bookshop')}</option><option value="Rental">{t('sa_cat_rental')}</option><option value="Cafe">{t('sa_cat_cafe')}</option><option value="Attraction">{t('sa_cat_attraction')}</option></select></label><div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-3">{formError && <p className="w-full rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs text-red-200">{formError}</p>}<button type="button" onClick={generateCredentials} className="rounded-lg border border-cyan-300/60 px-3 py-2 text-[10px] font-bold text-cyan-200 hover:bg-cyan-400/10">{t('sa_owners_generate')}</button><button type="submit" className="rounded-lg bg-cyan-400 px-3 py-2 text-[10px] font-bold text-[#061426] hover:bg-cyan-300">{t('sa_owners_create')}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[#2b527d] px-3 py-2 text-[10px] font-semibold text-slate-300 hover:bg-white/10">{t('sa_cancel')}</button><span className="text-[10px] text-slate-500">{t('sa_owners_note')}</span></div></form></Panel>}
    <Panel><PanelTitle icon={Users} title={t('sa_owners_table_title')} action={t('sa_owners_preview')} onAction={() => navigate('/shop-owner?preview=1')} /><div className="grid gap-2 border-b border-[#244668] bg-[#091a31] p-2 sm:grid-cols-3"><label className="text-[10px] font-semibold text-slate-300">{t('sa_filter_city')}<select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="mt-1 w-full rounded-md border border-[#2b527d] bg-[#102c51] px-2 py-1.5 text-[11px] text-white outline-none"><option value="All">{t('sa_all')}</option><option value="Yangon">{t('sa_city_yangon')}</option><option value="Mandalay">{t('sa_city_mandalay')}</option><option value="Bagan">{t('sa_city_bagan')}</option><option value="Inle Lake">{t('sa_city_inle')}</option><option value="Ngapali">{t('sa_city_ngapali')}</option></select></label><label className="text-[10px] font-semibold text-slate-300">{t('sa_filter_category')}<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="mt-1 w-full rounded-md border border-[#2b527d] bg-[#102c51] px-2 py-1.5 text-[11px] text-white outline-none"><option value="All">{t('sa_all')}</option><option value="Restaurant">{t('sa_cat_restaurant')}</option><option value="Hotel">{t('sa_cat_hotel')}</option><option value="Book Shop">{t('sa_cat_bookshop')}</option><option value="Rental">{t('sa_cat_rental')}</option><option value="Cafe">{t('sa_cat_cafe')}</option><option value="Attraction">{t('sa_cat_attraction')}</option></select></label><label className="text-[10px] font-semibold text-slate-300">{t('sa_filter_status')}<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-1 w-full rounded-md border border-[#2b527d] bg-[#102c51] px-2 py-1.5 text-[11px] text-white outline-none"><option value="All">{t('sa_all')}</option><option value="Pending">{t('sa_status_pending')}</option><option value="Active">{t('sa_status_active')}</option></select></label></div><div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#244668] px-3 py-2 text-[10px] text-slate-400"><span>{t('sa_owners_showing')} <strong className="text-cyan-300">{filteredOwners.length}</strong> / {createdOwners.length}</span>{statusFilter === 'Pending' && <span className="rounded-full bg-amber-400/15 px-2 py-1 font-semibold text-amber-300">{t('sa_owners_pending_only')}</span>}</div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-[11px]"><thead className="bg-[#091a31] text-slate-300"><tr><th className="px-4 py-3">{t('sa_col_owner')}</th><th className="px-2 py-3">{t('sa_col_business')}</th><th className="px-2 py-3">{t('sa_col_username')}</th><th className="px-2 py-3">{t('sa_col_city')}</th><th className="px-2 py-3">{t('sa_col_category')}</th><th className="px-2 py-3">{t('sa_col_status')}</th><th className="px-4 py-3">{t('sa_col_action')}</th></tr></thead><tbody>{filteredOwners.map((owner) => <tr key={`${owner.owner}-${owner.shop}`} className="border-t border-[#1d3a5c] text-slate-200"><td className="px-2 py-1.5 font-semibold">{owner.owner}</td><td className="px-2 py-3">{owner.shop}</td><td className="px-2 py-3 text-cyan-300">{owner.username}</td><td className="px-2 py-3 text-slate-400">{cityLabels[owner.city] ? t(cityLabels[owner.city]) : owner.city}</td><td className="px-2 py-3">{categoryLabels[owner.category] ? t(categoryLabels[owner.category]) : owner.category}</td><td className="px-2 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${owner.status === 'Active' ? 'bg-green-500/25 text-green-300' : 'bg-amber-400/20 text-amber-300'}`}>{owner.status === 'Active' ? t('sa_status_active') : t('sa_status_pending')}</span></td><td className="px-2 py-1.5"><button type="button" onClick={() => runAction(`${t('sa_review')} ${owner.shop}`)} className="rounded-md border border-[#2f6192] px-2.5 py-1.5 text-[10px] font-semibold text-cyan-300 hover:bg-white/10">{t('sa_review')}</button></td></tr>)}</tbody></table></div></Panel>
  </div>;
}

function AdsManagementPanel({ runAction }: { runAction: (label: string) => void }) {
  type PageAd = { id: number; page: string; slot: string; name: string; advertiser: string; active: boolean };
  const { t } = useLanguage();
  const pages = [
    { name: 'Home', path: '/', labelKey: 'sa_page_home', detailKey: 'sa_page_home_detail' },
    { name: 'Cities', path: '/cities', labelKey: 'sa_page_cities', detailKey: 'sa_page_cities_detail' },
    { name: 'City Detail', path: '/cities/:city', labelKey: 'sa_page_city_detail', detailKey: 'sa_page_city_detail_detail' },
    { name: 'Travel Plans', path: '/travel-plans', labelKey: 'sa_page_plans', detailKey: 'sa_page_plans_detail' },
    { name: 'Travel Plan Detail', path: '/travel-plans/:id', labelKey: 'sa_page_plan_detail', detailKey: 'sa_page_plan_detail_detail' },
    { name: 'Blogs', path: '/blogs', labelKey: 'sa_page_blogs', detailKey: 'sa_page_blogs_detail' },
    { name: 'Blog Detail', path: '/blogs/:slug', labelKey: 'sa_page_blog_detail', detailKey: 'sa_page_blog_detail_detail' },
    { name: 'Nearby', path: '/nearby', labelKey: 'sa_page_nearby', detailKey: 'sa_page_nearby_detail' },
    { name: 'User Dashboard', path: '/account', labelKey: 'sa_page_account', detailKey: 'sa_page_account_detail' },
  ] as const;
  const audit = useAuditRecorder();
  const [selectedPage, setSelectedPage] = useState('Home');
  const [ads, setAds] = useState<PageAd[]>([
    { id: 1, page: 'Home', slot: 'Hero banner', name: 'Explore Myanmar', advertiser: 'MH Travel', active: true },
    { id: 2, page: 'Home', slot: 'After travel plans', name: 'Sedona Hotel Yangon', advertiser: 'Sedona Hotel Yangon', active: true },
    { id: 3, page: 'Blogs', slot: 'Top story banner', name: 'Plan your next escape', advertiser: 'MH Travel', active: true },
    { id: 4, page: 'City Detail', slot: 'After restaurants', name: 'Yangon Food Week', advertiser: 'Yangon Food Week', active: false },
  ]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState({ id: 0, slot: 'Hero banner', name: '', advertiser: '', active: true });
  const slotLabels: Record<string, TranslationKey> = { 'Hero banner': 'sa_slot_hero', 'Top banner': 'sa_slot_top', 'After travel plans': 'sa_slot_after_plans', 'After blogs': 'sa_slot_after_blogs', 'After restaurants': 'sa_slot_after_restaurants', Sidebar: 'sa_slot_sidebar', 'Footer banner': 'sa_slot_footer' };
  const currentPage = pages.find((page) => page.name === selectedPage) ?? pages[0];
  const pageAds = ads.filter((ad) => ad.page === selectedPage);
  const activeAds = ads.filter((ad) => ad.active).length;

  function openEditor(ad?: PageAd) {
    setDraft(ad ? { id: ad.id, slot: ad.slot, name: ad.name, advertiser: ad.advertiser, active: ad.active } : { id: 0, slot: 'Hero banner', name: '', advertiser: '', active: true });
    setEditorOpen(true);
  }

  function saveAd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.name.trim() || !draft.advertiser.trim()) return;
    if (draft.id) {
      setAds((items) => items.map((ad) => ad.id === draft.id ? { ...ad, ...draft } : ad));
      audit({
        action: 'updated',
        objectType: 'ad',
        objectId: `${selectedPage}/${draft.slot}`,
        summary: `${draft.name} · ${draft.advertiser}`,
        source: 'admin_workspace',
      });
      runAction(`${draft.name} ${t('sa_ads_updated')} ${t(currentPage.labelKey)}`);
    } else {
      const next = { ...draft, id: Date.now(), page: selectedPage };
      setAds((items) => [...items, next]);
      audit({
        action: 'created',
        objectType: 'ad',
        objectId: `${selectedPage}/${draft.slot}`,
        summary: `${draft.name} · ${draft.advertiser}`,
        source: 'admin_workspace',
      });
      runAction(`${draft.name} ${t('sa_ads_added')} ${t(currentPage.labelKey)}`);
    }
    setEditorOpen(false);
  }

  function toggleAd(id: number) {
    setAds((items) => items.map((ad) => ad.id === id ? { ...ad, active: !ad.active } : ad));
    const ad = ads.find((item) => item.id === id);
    if (!ad) return;
    audit({
      action: ad.active ? 'updated' : 'published',
      objectType: 'ad',
      objectId: `${ad.page}/${ad.slot}`,
      summary: `${ad.name} · ${ad.active ? 'paused' : 'live'}`,
      source: 'admin_workspace',
    });
    runAction(`${ad.name} ${ad.active ? t('sa_status_paused') : t('sa_status_published')} · ${t(currentPage.labelKey)}`);
  }

  return <div className="mx-auto max-w-[1400px] space-y-3">
    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('sa_ads_kicker')}</p><h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('sa_nav_ads')}</h1><p className="mt-1 text-sm text-slate-400">{t('sa_ads_intro')}</p></div><button type="button" onClick={() => openEditor()} className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#168df4] px-3 py-2 text-[10px] font-bold hover:bg-[#2aa6ff]"><Plus size={16} /> {t('sa_ads_add')} {t(currentPage.labelKey)}</button></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><AdSummary icon={MapPin} label={t('sa_ads_pages')} value={String(pages.length)} detail={t('sa_ads_pages_detail')} tone="cyan" /><AdSummary icon={Megaphone} label={t('sa_ads_total')} value={String(ads.length)} detail={t('sa_ads_total_detail')} tone="blue" /><AdSummary icon={Eye} label={t('sa_ads_live')} value={String(activeAds)} detail={t('sa_ads_live_detail')} tone="green" /><AdSummary icon={TrendingUp} label={t('sa_ads_selected')} value={String(pageAds.length)} detail={`${t(currentPage.labelKey)} ${t('sa_ads_selected_detail')}`} tone="purple" /></div>
    <div className="grid gap-2 lg:grid-cols-[280px_1fr]">
      <Panel><PanelTitle icon={Map} title={t('sa_ads_website_pages')} /><div className="space-y-1 p-2">{pages.map((page) => { const count = ads.filter((ad) => ad.page === page.name).length; return <button key={page.name} type="button" onClick={() => { setSelectedPage(page.name); setEditorOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${selectedPage === page.name ? 'bg-[#168df4] text-white' : 'text-slate-300 hover:bg-white/5'}`}><span className="min-w-0"><strong className="block truncate text-xs">{t(page.labelKey)}</strong><span className={`block truncate text-[10px] ${selectedPage === page.name ? 'text-blue-100' : 'text-slate-500'}`}>{page.path}</span></span><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${selectedPage === page.name ? 'bg-white/20 text-white' : 'bg-[#102c51] text-cyan-300'}`}>{count}</span></button>; })}</div></Panel>
      <div className="space-y-2">
        <Panel><div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#244668] px-3 py-2"><div><p className="text-sm font-bold text-white">{t(currentPage.labelKey)}</p><p className="text-[10px] text-slate-400">{currentPage.path} · {t(currentPage.detailKey)}</p></div><button type="button" onClick={() => runAction(`${t('sa_ads_preview')} ${t(currentPage.labelKey)}`)} className="inline-flex items-center gap-1 rounded-md border border-[#2f6192] px-2.5 py-1.5 text-[10px] font-semibold text-cyan-300 hover:bg-white/10"><Eye size={14} /> {t('sa_ads_preview')}</button></div>{pageAds.length === 0 ? <div className="p-8 text-center"><Megaphone className="mx-auto text-slate-500" size={28} /><p className="mt-2 text-sm font-semibold text-slate-300">{t('sa_ads_empty')}</p><p className="mt-1 text-xs text-slate-500">{t('sa_ads_empty_detail')} {t(currentPage.labelKey)}.</p><button type="button" onClick={() => openEditor()} className="mt-3 rounded-lg bg-[#168df4] px-3 py-2 text-[10px] font-bold">{t('sa_ads_add_placement')}</button></div> : <div className="space-y-2 p-2">{pageAds.map((ad) => <div key={ad.id} className="flex flex-col gap-2 rounded-lg border border-[#244668] bg-[#091b32] p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-xs text-white">{ad.name}</strong><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${ad.active ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/20 text-slate-300'}`}>{ad.active ? t('sa_status_published') : t('sa_status_paused')}</span></div><p className="mt-1 text-[10px] text-slate-400">{t('sa_ads_advertiser')}: {ad.advertiser} · {t('sa_ads_placement')}: <span className="text-cyan-300">{slotLabels[ad.slot] ? t(slotLabels[ad.slot]) : ad.slot}</span></p></div><div className="flex shrink-0 items-center gap-1"><button type="button" onClick={() => openEditor(ad)} className="inline-flex items-center gap-1 rounded-md border border-[#2f6192] px-2 py-1.5 text-[10px] font-semibold text-cyan-300 hover:bg-white/10"><FileText size={13} /> {t('sa_edit')}</button><button type="button" onClick={() => toggleAd(ad.id)} className={`rounded-md px-2 py-1.5 text-[10px] font-bold ${ad.active ? 'border border-amber-300/30 text-amber-300 hover:bg-amber-300/10' : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'}`}>{ad.active ? t('sa_pause') : t('sa_publish')}</button></div></div>)}</div>}</Panel>
        {editorOpen && <Panel><PanelTitle icon={FileText} title={`${draft.id ? t('sa_ads_edit_title') : t('sa_ads_add_title')} ${t(currentPage.labelKey)}`} /><form onSubmit={saveAd} className="grid gap-2 p-3 sm:grid-cols-2"><label className="text-[10px] font-semibold text-slate-300">{t('sa_ads_name')}<input required value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder={t('sa_ads_name_placeholder')} className="mt-1 w-full rounded-md border border-[#2b527d] bg-[#081a31] px-2 py-1.5 text-[11px] text-white outline-none focus:border-cyan-300" /></label><label className="text-[10px] font-semibold text-slate-300">{t('sa_ads_advertiser')}<input required value={draft.advertiser} onChange={(event) => setDraft((current) => ({ ...current, advertiser: event.target.value }))} placeholder={t('sa_ads_advertiser_placeholder')} className="mt-1 w-full rounded-md border border-[#2b527d] bg-[#081a31] px-2 py-1.5 text-[11px] text-white outline-none focus:border-cyan-300" /></label><label className="text-[10px] font-semibold text-slate-300">{t('sa_ads_placement_label')}<select value={draft.slot} onChange={(event) => setDraft((current) => ({ ...current, slot: event.target.value }))} className="mt-1 w-full rounded-md border border-[#2b527d] bg-[#081a31] px-2 py-1.5 text-[11px] text-white outline-none"><option value="Hero banner">{t('sa_slot_hero')}</option><option value="Top banner">{t('sa_slot_top')}</option><option value="After travel plans">{t('sa_slot_after_plans')}</option><option value="After blogs">{t('sa_slot_after_blogs')}</option><option value="After restaurants">{t('sa_slot_after_restaurants')}</option><option value="Sidebar">{t('sa_slot_sidebar')}</option><option value="Footer banner">{t('sa_slot_footer')}</option></select></label><label className="flex items-center gap-2 self-end rounded-md border border-[#2b527d] bg-[#081a31] px-2 py-2 text-[10px] font-semibold text-slate-300"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))} /> {t('sa_ads_publish_on_save')}</label><div className="flex items-center gap-2 sm:col-span-2"><button type="submit" className="rounded-lg bg-cyan-400 px-3 py-2 text-[10px] font-bold text-[#061426]">{t('sa_ads_save')}</button><button type="button" onClick={() => setEditorOpen(false)} className="rounded-lg border border-[#2b527d] px-3 py-2 text-[10px] font-semibold text-slate-300">{t('sa_cancel')}</button></div></form></Panel>}
      </div>
    </div>
  </div>;
}

function AdSummary({ icon: Icon, label, value, detail, tone }: { icon: LucideIcon; label: string; value: string; detail: string; tone: 'cyan' | 'blue' | 'purple' | 'green' }) { const tones = { cyan: 'text-cyan-300 bg-cyan-400/10', blue: 'text-blue-300 bg-blue-400/10', purple: 'text-purple-300 bg-purple-400/10', green: 'text-green-300 bg-green-400/10' }; return <div className="rounded-xl border border-[#294d76] bg-[#0b203b] p-3 shadow-xl"><span className={`inline-flex rounded-lg p-2.5 ${tones[tone]}`}><Icon size={17} /></span><p className="mt-3 text-xl font-extrabold">{value}</p><p className="mt-1 text-xs font-semibold text-slate-200">{label}</p><p className="mt-1 text-[10px] text-slate-400">{detail}</p></div>; }
type PlaceholderView = Extract<AdminView, 'users' | 'bookings' | 'content'>;

function AdminSection({ view, runAction }: { view: PlaceholderView; runAction: (label: string) => void }) {
  const { t } = useLanguage();
  const meta: Record<PlaceholderView, { titleKey: TranslationKey; introKey: TranslationKey; icon: LucideIcon }> = {
    users: { titleKey: 'sa_nav_users', introKey: 'admin_users_intro', icon: Users },
    bookings: { titleKey: 'sa_nav_bookings', introKey: 'admin_bookings_intro', icon: CalendarDays },
    content: { titleKey: 'sa_content_title', introKey: 'admin_content_intro', icon: BookOpen },
  };
  const copy = meta[view];
  const Icon = copy.icon;
  const rows: { titleKey: TranslationKey; detailKey: TranslationKey; statusKey: TranslationKey }[] = view === 'users'
    ? [
      { titleKey: 'sa_role_traveler', detailKey: 'sa_col_email', statusKey: 'sa_status_active' },
      { titleKey: 'sa_role_owner_admin', detailKey: 'sa_col_business', statusKey: 'sa_status_active' },
      { titleKey: 'sa_role_blog_admin', detailKey: 'sa_col_permissions', statusKey: 'sa_status_active' },
    ]
    : view === 'bookings'
      ? [
        { titleKey: 'sa_recent_bookings', detailKey: 'sa_branch_booking_label', statusKey: 'sa_status_confirmed' },
        { titleKey: 'sa_plans_sold_label', detailKey: 'sa_col_service', statusKey: 'sa_status_pending' },
        { titleKey: 'sa_dist_hotels', detailKey: 'sa_col_date', statusKey: 'sa_status_completed' },
      ]
      : [
        { titleKey: 'admin_role_permissions', detailKey: 'admin_role_permissions_detail', statusKey: 'sa_status_protected' },
        { titleKey: 'admin_security', detailKey: 'admin_security_detail', statusKey: 'sa_status_enabled' },
        { titleKey: 'admin_audit_logs', detailKey: 'admin_audit_logs_detail', statusKey: 'sa_status_enabled' },
      ];
  return <div className="mx-auto max-w-[1100px]"><Panel><PanelTitle icon={Icon} title={t(copy.titleKey)} /><div className="p-5"><p className="mb-5 text-sm text-slate-400">{t(copy.introKey)}</p><div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-[#2b527d] bg-[#102c51] p-3"><p className="text-xl font-extrabold">{view === 'users' ? '48,750' : view === 'bookings' ? '32,680' : '13'}</p><p className="mt-1 text-xs text-slate-400">{view === 'users' ? t('sa_total_records') : view === 'bookings' ? t('sa_total_bookings') : t('sa_active_controls')}</p></div><div className="rounded-lg border border-[#2b527d] bg-[#102c51] p-3"><p className="text-xl font-extrabold text-green-300">+18.7%</p><p className="mt-1 text-xs text-slate-400">{t('sa_growth_month')}</p></div><button type="button" onClick={() => runAction(t('sa_add_new'))} className="flex items-center justify-center gap-2 rounded-lg bg-[#168df4] p-3 text-xs font-bold hover:bg-[#2aa6ff]"><Plus size={18} /> {t('sa_add_new')}</button></div><div className="divide-y divide-[#1d3a5c] rounded-lg border border-[#244668] bg-[#091b32]">{rows.map((row) => <div key={row.titleKey} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{t(row.titleKey)}</p><p className="mt-1 text-xs text-slate-400">{t(row.detailKey)}</p></div><button type="button" onClick={() => runAction(`${t('sa_review')} ${t(row.titleKey)}`)} className="flex items-center gap-1 self-start rounded-md border border-[#2f6192] px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-white/10 sm:self-auto">{t(row.statusKey)}<ChevronRight size={14} /></button></div>)}</div></div></Panel></div>;
}
