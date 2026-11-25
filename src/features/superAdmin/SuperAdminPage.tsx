import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
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
  Globe2,
  Languages,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
  MessageCircle,
  Megaphone,
  Menu,
  Moon,
  Plane,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  TrendingUp,
  Users,
  WalletCards,
  LayoutTemplate,
  X,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { OwnerPayoutsPanel } from './OwnerPayoutsPanel';
import { ShopTemplatesPanel } from './ShopTemplatesPanel';
import { AuditLogPanel } from './AuditLogPanel';
import { JobsPanel } from './JobsPanel';
import { AdsManagementPanel } from './AdsManagementPanel';
import { TranslationReviewPanel } from './TranslationReviewPanel';
import { OverviewPanel } from './OverviewPanel';
import { UsersPanel } from './UsersPanel';
import { BookingsPanel } from './BookingsPanel';
import { PaymentsPanel } from './PaymentsPanel';
import { CitiesPanel } from './CitiesPanel';
import { PlansPanel } from './PlansPanel';
import { ReviewsPanel } from './ReviewsPanel';
import { SupportPanel } from './SupportPanel';
import { SettingsPanel, AnnouncementsPanel } from './SettingsPanel';
import { ReportsPanel } from './ReportsPanel';
import { SearchTuningPanel } from './SearchTuningPanel';
import { AdminManagementPanel as AdminManagementPanelNext } from './AdminManagementPanel';
import { OwnersPanel } from './OwnersPanel';
import { GlobalSearchBox } from './shared/GlobalSearchBox';
import {
  STAFF_NOTIFICATIONS_EVENT,
  STAFF_NOTIFICATIONS_KEY,
  readStaffNotifications,
  type StaffNotification,
} from '../../lib/rentalNotifications';
import { NAV_SECTIONS, landingSection, resolveSection, sectionsForRole, type WorkspaceSection } from '../../lib/adminWorkspace';
import { ListingsPanel } from './ListingsPanel';
import { useAuditRecorder } from '../../lib/adminAudit';
import { EXCHANGE_RATES_EVENT, readExchangeRates } from '../../lib/exchangeRates';
import { useFeedRows } from '../../lib/notificationFeed';
import { useCollection } from '../../lib/collection';
import { supportThreads, unreadSupportCount } from '../../lib/adminSupport';
import { localizedOrFallback } from '../../lib/translationCache';

/** Plan §3A.4: one id per sidebar entry, so no two entries share a panel. */
type AdminView = WorkspaceSection;
type AdminNotification = StaffNotification;

const ADMIN_NOTIFICATIONS_KEY = STAFF_NOTIFICATIONS_KEY;
const readAdminNotifications = readStaffNotifications;

type NavItem = {
  id: AdminView;
  labelKey: TranslationKey;
  icon: LucideIcon;
};

/**
 * Plan §3A.4: sections are grouped, and each one has its own id. `tickets` is
 * left out until Phase 4 gives it a panel (ticket O-63), so the entry does not
 * open an empty screen.
 */
const NAV_GROUPS: { groupKey: TranslationKey; items: NavItem[] }[] = [
  {
    groupKey: 'sa_group_overview',
    items: [
      { id: 'overview', labelKey: 'sa_nav_dashboard', icon: LayoutDashboard },
      { id: 'reports', labelKey: 'sa_nav_reports', icon: TrendingUp },
    ],
  },
  {
    groupKey: 'sa_group_people',
    items: [
      { id: 'users', labelKey: 'sa_nav_users', icon: Users },
      { id: 'admins', labelKey: 'sa_nav_admins', icon: ShieldCheck },
      { id: 'owners', labelKey: 'sa_nav_owners', icon: Building2 },
    ],
  },
  {
    groupKey: 'sa_group_rentals',
    items: [
      { id: 'rentals', labelKey: 'sa_nav_rentals', icon: Building2 },
      { id: 'rentalOrders', labelKey: 'sa_nav_rental_orders', icon: CalendarDays },
      { id: 'rentalReports', labelKey: 'sa_nav_rental_reports', icon: TrendingUp },
    ],
  },
  {
    groupKey: 'sa_group_commerce',
    items: [
      { id: 'bookings', labelKey: 'sa_nav_bookings', icon: CalendarDays },
      { id: 'payments', labelKey: 'sa_nav_payments', icon: WalletCards },
      { id: 'payouts', labelKey: 'sa_nav_payouts', icon: WalletCards },
      { id: 'currency', labelKey: 'sa_nav_currency', icon: CircleDollarSign },
    ],
  },
  {
    groupKey: 'sa_group_content',
    items: [
      { id: 'cities', labelKey: 'sa_nav_cities', icon: MapPin },
      { id: 'plans', labelKey: 'sa_nav_plans', icon: Map },
      { id: 'listings', labelKey: 'sa_nav_listings', icon: Building2 },
      { id: 'reviews', labelKey: 'sa_nav_reviews', icon: Star },
      { id: 'blogs', labelKey: 'sa_nav_blogs', icon: FileText },
      { id: 'guides', labelKey: 'sa_nav_guides', icon: BookOpen },
      { id: 'guideEarnings', labelKey: 'sa_nav_guide_earnings', icon: Coins },
      { id: 'translations', labelKey: 'sa_nav_translations', icon: Languages },
    ],
  },
  {
    groupKey: 'sa_group_growth',
    items: [
      { id: 'ads', labelKey: 'sa_nav_ads', icon: Megaphone },
      { id: 'templates', labelKey: 'sa_nav_templates', icon: LayoutTemplate },
      { id: 'search', labelKey: 'sa_nav_search', icon: Search },
      { id: 'announcements', labelKey: 'sa_nav_announcements', icon: Bell },
    ],
  },
  {
    groupKey: 'sa_group_operations',
    items: [
      { id: 'support', labelKey: 'sa_nav_support', icon: MessageCircle },
      { id: 'jobs', labelKey: 'sa_nav_jobs', icon: Clock },
      { id: 'audit', labelKey: 'sa_nav_audit', icon: ShieldCheck },
      { id: 'settings', labelKey: 'sa_nav_settings', icon: Settings },
    ],
  },
];

const navItems: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export function SuperAdminPage() {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout, adminRole, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<AdminView>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [staffNotifications, setStaffNotifications] = useState<AdminNotification[]>(readAdminNotifications);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(staffNotifications));
  }, [staffNotifications]);

  useEffect(() => {
    function syncNotifications(event: StorageEvent) {
      if (event.key === ADMIN_NOTIFICATIONS_KEY) setStaffNotifications(readAdminNotifications());
    }
    const syncLocal = () => setStaffNotifications(readAdminNotifications());
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

  // Plan §3A.4 and §16B.1: one workspace, scoped per role. Super Admin keeps
  // every section; each other role sees only its own permission row.
  // A session stored before `adminRole` was hydrated still has to work, so a
  // super admin without one falls back to the full workspace. Any other role
  // without a product role sees nothing rather than everything.
  const effectiveRole = adminRole ?? (isSuperAdmin ? 'Super Admin' : undefined);
  const allowedSections = sectionsForRole(effectiveRole);
  const isVisible = (id: AdminView) => allowedSections.includes(id) && NAV_SECTIONS.includes(id);
  const visibleNav = navItems.filter((item) => isVisible(item.id));
  const visibleGroups = NAV_GROUPS
    .map((group) => ({ groupKey: group.groupKey, items: group.items.filter((item) => isVisible(item.id)) }))
    .filter((group) => group.items.length > 0);

  // §3A.3: the section lives in the URL, so a reload or a shared link returns
  // to it, and an id the role may not open falls back to its landing section.
  const requestedSection = searchParams.get('section');
  const resolved = resolveSection(effectiveRole, requestedSection);
  const activeView: AdminView = resolved ?? (visibleNav[0]?.id ?? view);

  useEffect(() => {
    const landing = landingSection(effectiveRole);
    if (!landing) return;
    const target = resolveSection(effectiveRole, requestedSection);
    if (target && target !== requestedSection) {
      setSearchParams({ section: target }, { replace: true });
    }
  }, [effectiveRole, requestedSection, setSearchParams]);

  // Plan §16B.3: the bell reads the shared feed too, narrowed to this role and
  // account, so an ad approval never shows up for the Rental Admin.
  const viewer = { role: effectiveRole, userId: user?.id ?? null, name: user?.name };
  const { rows: feedRows, markAllRead: markFeedRead } = useFeedRows(viewer);

  // §3A.3 and §3A.13: the support unread count sits on the sidebar item, from
  // the same function the inbox uses, so the badge and the inbox cannot differ.
  const supportRows = useCollection(supportThreads).rows;
  const supportUnread = unreadSupportCount(supportRows);
  const notifications: AdminNotification[] = [...feedRows.map((row) => ({
    id: row.id,
    title: localizedOrFallback(row.title, language),
    message: localizedOrFallback(row.message, language),
    createdAt: new Date(row.createdAt).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
    read: row.read,
  })), ...staffNotifications];

  function selectNav(nextView: AdminView) {
    setView(nextView);
    setSearchParams({ section: nextView });
    setMobileMenuOpen(false);
  }

  function runAction(label: string) {
    setNotice(`${label} ${t('sa_ready_next')}`);
    window.setTimeout(() => setNotice(''), 2600);
  }


  function markNotificationsRead() {
    setStaffNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    markFeedRead();
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
          <nav aria-label={t('sa_nav_aria')} className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
            {visibleGroups.map((group) => (
              <div key={group.groupKey}>
                <p className="px-4 pb-1 pt-2 text-[9px] font-bold uppercase tracking-wide text-slate-500">{t(group.groupKey)}</p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.id === activeView;
                  const badge = item.id === 'support' ? supportUnread : 0;
                  return <button key={item.id} type="button" onClick={() => selectNav(item.id)} aria-current={active ? 'page' : undefined} className={`group flex w-full items-center gap-3 rounded-lg px-4 py-2 text-left text-[13px] transition ${active ? 'bg-gradient-to-r from-[#159eff] to-[#1478ed] font-semibold text-white shadow-lg shadow-blue-900/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Icon size={17} className={active ? 'text-white' : 'text-slate-200'} /><span className="truncate">{t(item.labelKey)}</span>{badge > 0 && <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white">{badge}</span>}</button>;
                })}
              </div>
            ))}
          </nav>
          <button type="button" onClick={signOut} className="flex items-center gap-3 border-t border-[#214263] px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"><LogOut size={19} /> {t('sa_logout')}</button>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="relative flex h-[48px] items-center justify-between gap-4 border-b border-[#214263] bg-[#071a32]/95 px-3 backdrop-blur sm:px-4 lg:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden" aria-label={t('sa_open_menu')}>{mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}</button>
              <GlobalSearchBox />
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <button type="button" onClick={toggleLanguage} className="hidden items-center gap-2 text-sm font-semibold text-white sm:flex"><Globe2 size={18} />{language === 'mm' ? 'မြန်မာ' : 'English'}<ChevronDown size={14} /></button>
              <button type="button" onClick={toggleTheme} className="hidden rounded-full p-1.5 text-slate-200 hover:bg-white/10 sm:block" aria-label={t('sa_toggle_theme')}>{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
              <button type="button" onClick={() => setNotificationsOpen((open) => !open)} className="relative rounded-full p-1.5 text-white hover:bg-white/10" aria-label={t('sa_notifications')}><Bell size={19} fill="currentColor" />{notifications.some((notification) => !notification.read) && <span className="absolute -right-0.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">{notifications.filter((notification) => !notification.read).length}</span>}</button>
              <div className="hidden items-center gap-2 sm:flex"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-700 text-[10px] font-bold text-white">{initials}</div><span className="text-sm font-semibold">{roleBadge}</span><ChevronDown size={14} className="text-slate-300" /></div>
            </div>
            {notificationsOpen && <div className="absolute right-3 top-12 z-40 w-[min(360px,calc(100vw-24px))] rounded-lg border border-[#2b527d] bg-[#0b203b] p-2 shadow-2xl sm:right-5"><div className="flex items-center justify-between border-b border-[#244668] px-2 pb-2"><div><p className="text-xs font-bold text-white">{t('sa_admin_notifications')}</p><p className="text-[10px] text-slate-400">{t('sa_admin_notifications_detail')}</p></div><button type="button" onClick={markNotificationsRead} className="text-[10px] font-semibold text-cyan-300 hover:text-white">{t('sa_mark_all_read')}</button></div><div className="max-h-72 overflow-y-auto pt-1">{notifications.length === 0 ? <p className="px-2 py-5 text-center text-xs text-slate-400">{t('sa_no_notifications')}</p> : notifications.map((notification) => <button key={notification.id} type="button" onClick={() => setStaffNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item))} className={`block w-full rounded-md px-2 py-2 text-left ${notification.read ? 'bg-transparent' : 'bg-cyan-400/10'}`}><div className="flex items-start gap-2"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notification.read ? 'bg-slate-600' : 'bg-cyan-300'}`} /><span className="min-w-0"><strong className="block text-[11px] text-white">{notification.title}</strong><span className="mt-0.5 block text-[10px] leading-4 text-slate-300">{notification.message}</span><span className="mt-1 block text-[9px] text-slate-500">{notification.createdAt}</span></span></div></button>)}</div></div>}
          </header>

          {mobileMenuOpen && <div className="max-h-[70vh] overflow-y-auto border-b border-[#214263] bg-[#08182d] p-3 lg:hidden">{visibleGroups.map((group) => <div key={group.groupKey} className="mb-2"><p className="px-1 pb-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">{t(group.groupKey)}</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{group.items.map((item) => { const Icon = item.icon; const badge = item.id === 'support' ? supportUnread : 0; return <button key={item.id} type="button" onClick={() => selectNav(item.id)} aria-current={item.id === activeView ? 'page' : undefined} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs ${item.id === activeView ? 'bg-[#168df4] text-white' : 'bg-white/5 text-slate-300'}`}><Icon size={15} /><span className="truncate">{t(item.labelKey)}</span>{badge > 0 && <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[9px] font-bold text-white">{badge}</span>}</button>; })}</div></div>)}<button type="button" onClick={signOut} className="mt-2 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400"><LogOut size={15} /> {t('sa_logout')}</button></div>}

          <main className="p-1.5 sm:p-2 lg:p-3">
            {notice && <div role="status" className="fixed right-4 top-20 z-50 rounded-lg border border-cyan-300/30 bg-[#102e51] px-3 py-2 text-xs text-cyan-100 shadow-2xl">{notice}</div>}
            {activeView === 'overview' ? <OverviewPanel onOpenSection={(section) => selectNav(section)} /> : activeView === 'admins' ? <AdminManagementPanelNext onOpenAudit={() => selectNav('audit')} /> : activeView === 'owners' ? <OwnersPanel /> : activeView === 'users' ? <UsersPanel /> : activeView === 'bookings' ? <BookingsPanel /> : activeView === 'payments' ? <PaymentsPanel /> : activeView === 'cities' ? <CitiesPanel /> : activeView === 'plans' ? <PlansPanel /> : activeView === 'reviews' ? <ReviewsPanel /> : activeView === 'support' ? <SupportPanel /> : activeView === 'settings' ? <SettingsPanel /> : activeView === 'announcements' ? <AnnouncementsPanel /> : activeView === 'reports' ? <ReportsPanel /> : activeView === 'search' ? <SearchTuningPanel /> : activeView === 'blogs' ? <BlogPostsPanel runAction={runAction} /> : activeView === 'guides' ? <TravelGuidesPanel runAction={runAction} /> : activeView === 'guideEarnings' ? <GuideEarningsPanel /> : activeView === 'payouts' ? <OwnerPayoutsPanel /> : activeView === 'templates' ? <ShopTemplatesPanel /> : activeView === 'audit' ? <AuditLogPanel /> : activeView === 'jobs' ? <JobsPanel /> : activeView === 'translations' ? <TranslationReviewPanel /> : activeView === 'ads' ? <AdsManagementPanel /> : activeView === 'currency' ? <CurrencySettingsPanel runAction={runAction} /> : activeView === 'rentals' ? <RentalAdminPanel runAction={runAction} /> : activeView === 'rentalOrders' ? <RentalOrdersPanel /> : activeView === 'rentalReports' ? <RentalReportsPanel /> : activeView === 'listings' ? <ListingsPanel /> : <AdminSection view={activeView} />}
          </main>
          <footer className="mt-auto flex flex-col gap-1 border-t border-[#214263] bg-[#071a32] px-3 py-2 text-center text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:text-left"><div><p className="text-base font-bold text-[#27c2ff]">MH Travel</p><p className="mt-1">{t('sa_footer_tagline')}</p></div><p>{t('sa_copyright')}</p><div className="flex justify-center gap-2 text-cyan-300 sm:justify-end"><span className="rounded-full border border-cyan-300/30 px-1.5 py-0.5 text-[10px]">f</span><span className="rounded-full border border-cyan-300/30 px-1.5 py-0.5 text-[10px]">▶</span></div></footer>
        </div>
      </div>
    </div>
  );
}



function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl ${className}`}>{children}</section>; }
function PanelTitle({ icon: Icon, title, action, onAction }: { icon: LucideIcon; title: string; action?: string; onAction?: () => void }) { return <div className="flex items-center justify-between border-b border-[#244668] px-2 py-1.5"><h2 className="flex items-center gap-2 text-sm font-bold"><Icon size={17} className="text-[#26b8ff]" />{title}</h2>{action && <button type="button" onClick={onAction} className="text-xs font-semibold text-[#31c6ff] hover:text-white">{action} <ChevronRight size={13} className="inline" /></button>}</div>; }








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

/**
 * `tickets` is the one section §3A.4 lists without a screen of its own: it is in
 * `HIDDEN_SECTIONS`, so the sidebar never offers it, and a hand-typed URL lands
 * on the honest empty state rather than a blank panel (§3A.2 rule 4).
 */
function AdminSection({ view }: { view: AdminView }) {
  const { t } = useLanguage();
  const Icon = view === 'tickets' ? FileText : LayoutDashboard;
  return (
    <div className="mx-auto max-w-[1100px]">
      <Panel>
        <PanelTitle icon={Icon} title={t(view === 'tickets' ? 'sa_nav_tickets' : 'sa_nav_dashboard')} />
        <div className="p-5">
          <p className="mb-4 text-sm text-slate-400">{t(view === 'tickets' ? 'admin_tickets_intro' : 'sa_dashboard_intro')}</p>
          <div className="rounded-lg border border-dashed border-[#2b527d] bg-[#091b32] px-4 py-10 text-center">
            <Icon size={30} className="mx-auto text-slate-500" />
            <p className="mt-3 text-sm font-semibold text-slate-200">{t('sa_empty_title')}</p>
            <p className="mx-auto mt-1 max-w-[520px] text-xs leading-5 text-slate-400">{t('sa_empty_detail')}</p>
          </div>
        </div>
      </Panel>
    </div>
  );
}
