import { useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Globe2,
  HelpCircle,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Tag,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useFeedRows } from '../../lib/notificationFeed';
import { timeAgoLabel } from '../../lib/timeAgo';
import { localizedOrFallback } from '../../lib/translationCache';
import { blocksBooking, daysUntilEnd, graceDaysLeft, subscriptionForOwner } from '../../lib/ownerSubscriptions';
import { useSubscriptions } from '../../lib/ownerSubscriptionStore';
import { useCurrency } from '../../lib/currency';
import { fill } from '../../lib/fill';
import type { TranslationKey } from '../../lib/i18n';
import { useLanguage } from '../../lib/i18n';
import type { Language } from '../../types';

type OwnerView = 'dashboard' | 'shop' | 'bookings' | 'orders' | 'menu' | 'gallery' | 'reviews' | 'analytics' | 'payments' | 'promotions' | 'subscription' | 'settings' | 'support';

type OwnerNavItem = { id: OwnerView; labelKey: TranslationKey; icon: LucideIcon };
type Translate = (key: TranslationKey) => string;

const navItems: OwnerNavItem[] = [
  { id: 'dashboard', labelKey: 'owner_shop_nav_dashboard', icon: LayoutDashboard },
  { id: 'shop', labelKey: 'owner_shop_nav_shop', icon: Store },
  { id: 'bookings', labelKey: 'owner_shop_nav_bookings', icon: CalendarDays },
  { id: 'orders', labelKey: 'owner_shop_nav_orders', icon: ShoppingBag },
  { id: 'menu', labelKey: 'owner_shop_nav_menu', icon: BookOpen },
  { id: 'gallery', labelKey: 'owner_shop_nav_gallery', icon: Camera },
  { id: 'reviews', labelKey: 'owner_shop_nav_reviews', icon: Star },
  { id: 'analytics', labelKey: 'owner_shop_nav_analytics', icon: BarChart3 },
  { id: 'payments', labelKey: 'owner_shop_nav_payments', icon: CircleDollarSign },
  { id: 'promotions', labelKey: 'owner_shop_nav_promotions', icon: Tag },
  { id: 'subscription', labelKey: 'owner_shop_nav_subscription', icon: CircleDollarSign },
  { id: 'settings', labelKey: 'owner_shop_nav_settings', icon: Settings },
  { id: 'support', labelKey: 'owner_shop_nav_support', icon: HelpCircle },
];

const PERIODS: { value: string; labelKey: TranslationKey }[] = [
  { value: 'Last 7 Days', labelKey: 'owner_last_7_days' },
  { value: 'Last 30 Days', labelKey: 'owner_last_30_days' },
  { value: 'Last 90 Days', labelKey: 'owner_last_90_days' },
];

const menuItems = [
  { name: 'Mohinga', orders: 892, share: '38%', image: '/images/blog/myanmar-food.webp' },
  { name: 'Shan Noodle', orders: 654, share: '28%', image: '/images/blog/ubein-evening.webp' },
  { name: 'Fried Rice', orders: 520, share: '22%', image: '/images/blog/myanmar-food.webp' },
];

const bookings = [
  ['Thar Thar Win', 'Nov 07, 2026 · 7:30 PM', 2, 'Confirmed', 'green'],
  ['Ko Min Htet', 'Nov 07, 2026 · 8:00 PM', 4, 'Pending', 'blue'],
  ['Daw Aye Aye', 'Nov 07, 2026 · 8:30 PM', 3, 'Confirmed', 'green'],
  ['May Myat', 'Nov 08, 2026 · 6:00 PM', 2, 'Completed', 'purple'],
] as const;

const BOOKING_STATUS: Record<string, TranslationKey> = {
  Confirmed: 'owner_status_confirmed',
  Pending: 'owner_status_pending',
  Completed: 'owner_status_completed',
};

const SECTION_NOTES: TranslationKey[] = ['owner_note_verified', 'owner_note_keep_updated', 'owner_note_reply_reviews'];

function formatCount(value: number, language: Language): string {
  return new Intl.NumberFormat(language === 'mm' ? 'my-MM' : 'en-US').format(value);
}

function OwnerPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-[#dce5f0] bg-white shadow-[0_10px_30px_rgba(36,83,145,0.08)] ${className}`}>{children}</section>;
}

function PanelHeading({ icon: Icon, title, action, onAction }: { icon: LucideIcon; title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-[#e7edf4] px-3 py-2">
      <h2 className="flex items-center gap-2 text-sm font-bold text-[#0b2147]"><Icon size={20} className="text-[#147bea]" />{title}</h2>
      {action && <button type="button" onClick={onAction} className="text-xs font-bold text-[#147bea] hover:text-[#0b4da6]">{action} <ChevronRight size={13} className="inline" /></button>}
    </div>
  );
}

export function ShopOwnerPage() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [view, setView] = useState<OwnerView>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [period, setPeriod] = useState('Last 30 Days');
  const [notice, setNotice] = useState('');
  const [bellOpen, setBellOpen] = useState(false);
  // Plan §16B.3: the owner reads the same feed rows the platform writes, so a
  // renewal reminder lands here instead of a hard-coded badge.
  const feed = useFeedRows({ userId: user?.id ?? null, name: user?.name });

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  }

  function selectView(next: OwnerView) {
    setView(next);
    setMobileOpen(false);
  }

  function signOut() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f4f8fc] text-[#0b2147]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[165px] shrink-0 flex-col bg-gradient-to-b from-[#062653] to-[#071a3e] text-white lg:flex">
          <div className="flex h-[48px] items-center gap-2 border-b border-white/10 px-3 text-lg font-extrabold tracking-tight text-[#27bfff]"><span className="text-3xl">✈</span> MH Travel</div>
          <div className="border-b border-white/10 px-3 py-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-300 bg-gradient-to-br from-orange-200 via-amber-500 to-green-700 text-2xl shadow-lg">🍽️</div>
            <p className="mt-2 text-sm font-bold leading-5">Royal Myanmar<br />Restaurant</p>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-[10px] font-bold"><CheckCircle2 size={11} /> {t('owner_verified_business')}</span>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} type="button" onClick={() => selectView(item.id)} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-semibold transition ${view === item.id ? 'bg-gradient-to-r from-[#198df2] to-[#1472df] text-white shadow-lg shadow-blue-950/30' : 'text-blue-100/85 hover:bg-white/10 hover:text-white'}`}>
                  <Icon size={17} />{t(item.labelKey)}
                </button>
              );
            })}
          </nav>
          <button type="button" onClick={signOut} className="mx-2 mb-2 flex items-center justify-center gap-2 rounded-lg border border-blue-300/30 bg-blue-500/20 px-2 py-2 text-xs font-bold text-white hover:bg-red-500/20 hover:text-red-200"><LogOut size={17} /> {t('owner_logout')}</button>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex h-[48px] items-center justify-between gap-3 border-b border-[#dce5f0] bg-[#062653] px-3 text-white sm:px-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setMobileOpen((open) => !open)} className="rounded-lg p-2 hover:bg-white/10 lg:hidden" aria-label={t('owner_open_menu')}>{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button>
              <span className="text-xl font-extrabold text-[#27bfff] lg:hidden">✈ MH Travel</span>
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button type="button" onClick={toggleLanguage} aria-label={t('owner_switch_language')} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-white/20">
                <Globe2 size={14} />
                {language === 'mm' ? 'မြန်မာ' : 'English'}
              </button>
              <div className="relative">
                <button type="button" onClick={() => setBellOpen((open) => !open)} className="relative rounded-full p-1.5 hover:bg-white/10" aria-label={t('owner_notifications')} aria-expanded={bellOpen}><Bell size={22} />{feed.unread > 0 && <span className="absolute -right-0.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">{feed.unread}</span>}</button>
                {bellOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-[280px] rounded-lg border border-[#cfdceb] bg-white text-[#0b2147] shadow-xl">
                    <div className="flex items-center justify-between border-b border-[#e7edf4] px-3 py-2">
                      <p className="text-xs font-bold">{t('owner_notifications')}</p>
                      <button type="button" onClick={() => { feed.markAllRead(); setBellOpen(false); }} className="text-[10px] font-semibold text-[#147bea] hover:underline">{t('notifications_mark_all_read')}</button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {feed.rows.length === 0 ? (
                        <p className="px-3 py-5 text-center text-[11px] text-slate-400">{t('notifications_empty')}</p>
                      ) : (
                        feed.rows.map((row) => (
                          <button key={row.id} type="button" onClick={() => { setBellOpen(false); navigate(row.href); }} className={`block w-full border-b border-[#f0f4f9] px-3 py-2 text-left last:border-0 hover:bg-[#f4f8fc] ${row.read ? '' : 'bg-[#eaf5ff]'}`}>
                            <p className="text-[11px] font-bold leading-4">{localizedOrFallback(row.title, language)}</p>
                            <p className="mt-0.5 text-[10px] text-slate-500">{localizedOrFallback(row.message, language)}</p>
                            <p className="mt-1 text-[9px] text-slate-400">{timeAgoLabel(row.createdAt, new Date(), language)}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 border-l border-white/15 pl-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-green-700 text-xl">🍽️</div>
                <div className="hidden text-left sm:block"><p className="text-sm font-bold">Royal Myanmar Restaurant</p><p className="text-[11px] text-blue-100">{t('owner_role_shop')} <ChevronDown size={12} className="inline" /></p></div>
              </div>
            </div>
          </header>
          {mobileOpen && (
            <div className="border-b border-[#cfdceb] bg-white p-3 lg:hidden">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} type="button" onClick={() => selectView(item.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold ${view === item.id ? 'bg-[#147bea] text-white' : 'bg-[#eff5fb] text-[#18375e]'}`}><Icon size={15} />{t(item.labelKey)}</button>
                  );
                })}
              </div>
            </div>
          )}

          <main className="p-1.5 sm:p-2 lg:p-3">
            {notice && <div role="status" className="fixed right-4 top-20 z-50 rounded-lg border border-cyan-300/30 bg-[#0b3a71] px-4 py-3 text-xs text-white shadow-2xl">{notice}</div>}
            {view === 'dashboard'
              ? <OwnerOverview period={period} setPeriod={setPeriod} notify={notify} onOpen={selectView} t={t} language={language} />
              : <OwnerSection view={view} notify={notify} t={t} />}
          </main>
          <footer className="border-t border-[#dce5f0] bg-white px-3 py-2 text-center text-xs text-slate-500 sm:flex sm:items-center sm:justify-between sm:text-left">
            <p><strong className="text-base text-[#119eea]">MH Travel</strong><br />{t('owner_footer_shop')}</p>
            <p>{t('owner_copyright')}</p>
            <p className="text-[#147bea]">{t('owner_help_center')} · {t('owner_contact_support')}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

function OwnerOverview({ period, setPeriod, notify, onOpen, t, language }: { period: string; setPeriod: (value: string) => void; notify: (message: string) => void; onOpen: (view: OwnerView) => void; t: Translate; language: Language }) {
  return (
    <div className="mx-auto max-w-[1400px] space-y-3">
      <section className="relative min-h-[105px] overflow-hidden rounded-2xl border border-[#b9d5ee] bg-[#0b3871] shadow-lg">
        <img src="/images/blog/myanmar-food.webp" alt="Royal Myanmar Restaurant" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#052856]/95 via-[#073570]/70 to-[#052856]/20" />
        <div className="relative flex h-full min-h-[105px] flex-col justify-center gap-3 p-2 sm:p-3">
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-cyan-200">ROYAL MYANMAR RESTAURANT · {t('owner_role_shop').toUpperCase()}</p>
            <h1 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">{t('owner_welcome_back')}</h1>
            <h2 className="mt-1 text-lg font-extrabold text-[#24c6ff] sm:text-xl">{t('owner_grow_business')}</h2>
            <p className="mt-2 text-sm text-blue-50">{t('owner_more_travelers')}</p>
            <button type="button" onClick={() => onOpen('shop')} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#148bf3] px-3 py-2 text-[10px] font-bold text-white shadow-lg shadow-blue-950/30 hover:bg-[#2aa6ff]">{t('owner_view_shop')} <ChevronRight size={16} /></button>
          </div>
          <div className="absolute right-3 top-3 hidden rounded-xl border border-green-200/30 bg-[#071d39]/85 px-3 py-2 text-center backdrop-blur-sm md:block">
            <CheckCircle2 className="mx-auto text-lime-300" size={38} />
            <p className="mt-1 text-sm font-extrabold text-lime-300">{t('owner_shop_verified')}</p>
            <p className="mt-2 max-w-[150px] text-[10px] text-blue-100">{t('owner_thanks_partner')}</p>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-4">
        <OwnerStat icon={CalendarDays} label={t('owner_total_bookings')} value={formatCount(128, language)} change="↑ 12%" tone="blue" onClick={() => onOpen('bookings')} />
        <OwnerStat icon={ShoppingBag} label={t('owner_total_orders')} value={formatCount(2340, language)} change="↑ 18%" tone="green" onClick={() => onOpen('orders')} />
        <OwnerStat icon={Star} label={t('owner_total_reviews')} value="4.7" change={`★★★★★ (${formatCount(320, language)})`} tone="purple" onClick={() => onOpen('reviews')} />
        <OwnerStat icon={BarChart3} label={t('owner_total_revenue')} value={`${formatCount(5280000, language)} Ks`} change="↑ 20%" tone="amber" onClick={() => onOpen('payments')} />
      </div>
      <div className="grid gap-2 xl:grid-cols-[1.15fr_0.85fr]">
        <BookingChart period={period} setPeriod={setPeriod} t={t} />
        <PopularMenu onViewAll={() => onOpen('menu')} t={t} language={language} />
      </div>
      <div className="grid gap-2 xl:grid-cols-[1.15fr_0.85fr]">
        <RecentBookings onViewAll={() => onOpen('bookings')} t={t} language={language} />
        <OwnerQuickActions onOpen={onOpen} notify={notify} t={t} />
      </div>
    </div>
  );
}

function OwnerStat({ icon: Icon, label, value, change, tone, onClick }: { icon: LucideIcon; label: string; value: string; change: string; tone: 'blue' | 'green' | 'purple' | 'amber'; onClick: () => void }) {
  const colors = { blue: 'bg-blue-500/10 text-blue-600', green: 'bg-green-500/10 text-green-600', purple: 'bg-purple-500/10 text-purple-600', amber: 'bg-amber-500/10 text-amber-600' };
  return (
    <button type="button" onClick={onClick} className="group relative overflow-hidden rounded-lg border border-[#dce5f0] bg-white p-4 text-left shadow-[0_10px_30px_rgba(36,83,145,0.06)] transition hover:-translate-y-0.5 hover:border-[#7bb8ee]">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${colors[tone]}`}><Icon size={20} /></span>
      <p className="mt-2 text-[10px] font-bold text-[#18375e]">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-[#0b2147] sm:text-2xl">{value}</p>
      <p className={`mt-1 text-xs font-bold ${tone === 'amber' ? 'text-amber-600' : 'text-green-600'}`}>{change}</p>
      <svg viewBox="0 0 120 32" preserveAspectRatio="none" className="absolute bottom-0 right-0 h-8 w-[58%] opacity-35"><polyline points="0,26 16,22 32,25 47,16 64,22 80,14 96,18 120,4" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
    </button>
  );
}

function BookingChart({ period, setPeriod, t }: { period: string; setPeriod: (value: string) => void; t: Translate }) {
  return (
    <OwnerPanel>
      <div className="flex items-center justify-between border-b border-[#e7edf4] px-3 py-2">
        <h2 className="flex items-center gap-2 text-sm font-bold"><BarChart3 size={20} className="text-[#147bea]" />{t('owner_booking_stats')}</h2>
        <label className="flex items-center gap-1 rounded-lg border border-[#dce5f0] px-2 py-1.5 text-[10px] font-semibold">
          <span className="sr-only">{t('owner_booking_stats')}</span>
          <select value={period} onChange={(event) => setPeriod(event.target.value)} className="bg-transparent text-[#18375e] outline-none">
            {PERIODS.map((option) => <option key={option.value} value={option.value}>{t(option.labelKey)}</option>)}
          </select>
          <ChevronDown size={13} />
        </label>
      </div>
      <div className="relative h-[120px] p-3">
        <svg viewBox="0 0 640 220" preserveAspectRatio="none" className="h-full w-full">
          <g stroke="#e1eaf4" strokeDasharray="3 4"><line x1="28" y1="20" x2="620" y2="20" /><line x1="28" y1="75" x2="620" y2="75" /><line x1="28" y1="130" x2="620" y2="130" /><line x1="28" y1="185" x2="620" y2="185" /></g>
          <path d="M28 154 C62 140 72 160 100 128 S143 166 174 138 S220 158 251 113 S299 151 329 91 S368 122 401 101 S440 139 470 72 S510 120 542 68 S581 100 620 42 L620 185 L28 185 Z" fill="#168df4" fillOpacity=".12" />
          <path d="M28 154 C62 140 72 160 100 128 S143 166 174 138 S220 158 251 113 S299 151 329 91 S368 122 401 101 S440 139 470 72 S510 120 542 68 S581 100 620 42" fill="none" stroke="#147bea" strokeWidth="4" />
          <g fill="#147bea"><circle cx="28" cy="154" r="5" /><circle cx="100" cy="128" r="5" /><circle cx="174" cy="138" r="5" /><circle cx="251" cy="113" r="5" /><circle cx="329" cy="91" r="5" /><circle cx="401" cy="101" r="5" /><circle cx="470" cy="72" r="5" /><circle cx="542" cy="68" r="5" /><circle cx="620" cy="42" r="6" /></g>
          <rect x="584" y="8" width="45" height="28" rx="10" fill="#147bea" /><text x="606" y="27" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">128</text>
        </svg>
        <div className="absolute bottom-1 left-8 right-6 flex justify-between text-[10px] text-slate-400"><span>Oct 1</span><span>Oct 7</span><span>Oct 14</span><span>Oct 21</span><span>Oct 31</span></div>
      </div>
    </OwnerPanel>
  );
}

function PopularMenu({ onViewAll, t, language }: { onViewAll: () => void; t: Translate; language: Language }) {
  return (
    <OwnerPanel>
      <PanelHeading icon={BookOpen} title={t('owner_popular_menu')} action={t('owner_view_all')} onAction={onViewAll} />
      <div className="space-y-2 p-3">
        {menuItems.map((item) => (
          <div key={item.name} className="flex items-center gap-3 border-b border-[#e7edf4] pb-2 last:border-0">
            <img src={item.image} alt="" className="h-12 w-16 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#18375e]">{item.name}</p>
              <p className="text-[10px] text-slate-400">{formatCount(item.orders, language)} {t('owner_orders_count')}</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e8eef5]"><span className="block h-full rounded-full bg-gradient-to-r from-[#148bf3] to-[#75c6ff]" style={{ width: item.share }} /></div>
            </div>
            <strong className="text-xs text-[#18375e]">{item.share}</strong>
          </div>
        ))}
      </div>
    </OwnerPanel>
  );
}

function RecentBookings({ onViewAll, t, language }: { onViewAll: () => void; t: Translate; language: Language }) {
  return (
    <OwnerPanel>
      <PanelHeading icon={CalendarDays} title={t('owner_recent_bookings')} action={t('owner_view_all')} onAction={onViewAll} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[11px]">
          <thead className="bg-[#f6f9fc] text-[#18375e]">
            <tr><th className="px-2 py-1.5">{t('owner_customer')}</th><th className="px-2 py-3">{t('owner_datetime')}</th><th className="px-2 py-3">{t('owner_guests')}</th><th className="px-4 py-3">{t('owner_status')}</th></tr>
          </thead>
          <tbody>
            {bookings.map(([customer, date, guests, status, tone]) => (
              <tr key={customer} className="border-t border-[#e7edf4]">
                <td className="px-2 py-1.5 font-semibold">{customer}</td>
                <td className="px-2 py-3 text-slate-500">{date}</td>
                <td className="px-2 py-3 text-center">{formatCount(guests, language)}</td>
                <td className="px-2 py-1.5"><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${tone === 'green' ? 'bg-green-100 text-green-700' : tone === 'purple' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{t(BOOKING_STATUS[status])}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </OwnerPanel>
  );
}

function OwnerQuickActions({ onOpen, notify, t }: { onOpen: (view: OwnerView) => void; notify: (message: string) => void; t: Translate }) {
  const actions: [TranslationKey, LucideIcon, OwnerView | null][] = [
    ['owner_manage_menu', BookOpen, 'menu'],
    ['owner_upload_photos', ImagePlus, 'gallery'],
    ['owner_create_promo', Tag, 'promotions'],
    ['owner_view_reports', BarChart3, 'analytics'],
  ];
  return (
    <OwnerPanel>
      <PanelHeading icon={Zap} title={t('owner_quick_actions')} />
      <div className="grid grid-cols-2 gap-2 p-3">
        {actions.map(([labelKey, Icon, target]) => (
          <button key={labelKey} type="button" onClick={() => (target ? onOpen(target) : notify(t(labelKey)))} className="flex min-h-[44px] flex-col items-center justify-center gap-2 rounded-lg border border-[#dce5f0] bg-[#f4f8fc] text-center text-[11px] font-bold text-[#18375e] transition hover:border-[#75b8f0] hover:bg-[#eaf5ff]"><Icon size={25} className="text-[#147bea]" />{t(labelKey)}</button>
        ))}
      </div>
    </OwnerPanel>
  );
}

function OwnerSection({ view, notify, t }: { view: Exclude<OwnerView, 'dashboard'>; notify: (message: string) => void; t: Translate }) {
  const item = navItems.find((nav) => nav.id === view) ?? navItems[1];
  const Icon = item.icon;
  const label = t(item.labelKey);
  if (view === 'settings') return <OwnerCurrencySettings notify={notify} t={t} />;
  if (view === 'subscription') return <OwnerSubscriptionPanel t={t} />;
  return (
    <div className="mx-auto max-w-[1100px]">
      <OwnerPanel>
        <PanelHeading icon={Icon} title={label} action={t('owner_add_new')} onAction={() => notify(`${t('owner_add_new')} · ${label}`)} />
        <div className="p-3">
          <div className="mt-1 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-[#dce5f0] bg-[#f4f8fc] p-4"><p className="text-2xl font-extrabold text-[#0b2147]">128</p><p className="mt-1 text-xs text-slate-500">{t('owner_this_month')}</p></div>
            <div className="rounded-lg border border-[#dce5f0] bg-[#f4f8fc] p-4"><p className="text-2xl font-extrabold text-green-600">+18%</p><p className="mt-1 text-xs text-slate-500">{t('owner_vs_last_month')}</p></div>
            <button type="button" onClick={() => notify(`${t('owner_create_new')} · ${label}`)} className="flex items-center justify-center gap-2 rounded-xl bg-[#147bea] p-4 text-sm font-bold text-white hover:bg-[#0b63c4]"><Plus size={18} /> {t('owner_create_new')}</button>
          </div>
          <div className="mt-3 divide-y divide-[#e7edf4] rounded-xl border border-[#dce5f0]">
            {SECTION_NOTES.map((noteKey) => (
              <div key={noteKey} className="flex items-center gap-2 p-3 text-sm text-[#18375e]"><CheckCircle2 size={17} className="shrink-0 text-green-500" />{t(noteKey)}</div>
            ))}
          </div>
        </div>
      </OwnerPanel>
    </div>
  );
}

function OwnerCurrencySettings({ notify, t }: { notify: (message: string) => void; t: Translate }) {
  const { shopBaseCurrency, setShopBaseCurrency, exchangeRate, formatCurrencyAmount } = useCurrency();
  return (
    <div className="mx-auto max-w-[1100px]">
      <OwnerPanel>
        <PanelHeading icon={CircleDollarSign} title={t('owner_currency_title')} />
        <div className="space-y-3 p-3">
          <div>
            <p className="text-sm font-bold text-[#0b2147]">{t('owner_currency_choose')}</p>
            <p className="mt-1 text-xs text-slate-500">{t('owner_currency_note')}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {(['MMK', 'USD'] as const).map((option) => (
              <button key={option} type="button" onClick={() => { setShopBaseCurrency(option); notify(`${t('owner_currency_title')}: ${option}`); }} className={`rounded-lg border p-3 text-left transition ${shopBaseCurrency === option ? 'border-[#147bea] bg-[#eaf5ff] ring-2 ring-[#147bea]/20' : 'border-[#dce5f0] bg-[#f8fbff] hover:border-[#75b8f0]'}`}>
                <span className="flex items-center justify-between"><strong className="text-sm text-[#0b2147]">{option === 'MMK' ? 'Myanmar Kyat (MMK)' : 'US Dollar (USD)'}</strong><span className={`h-3 w-3 rounded-full border-2 ${shopBaseCurrency === option ? 'border-[#147bea] bg-[#147bea]' : 'border-slate-300'}`} /></span>
                <span className="mt-1 block text-[10px] text-slate-500">{option === 'MMK' ? t('owner_main_price') : t('owner_converted_price')}</span>
              </button>
            ))}
          </div>
          <div className="rounded-lg border border-[#dce5f0] bg-[#f4f8fc] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-[#18375e]">1 USD = {Math.round(exchangeRate).toLocaleString('en-US')} MMK</span>
              <span className="font-bold text-green-600">{shopBaseCurrency}</span>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-white px-3 py-2 text-xs"><span className="text-slate-500">{t('owner_main_price')}</span><strong className="ml-2 text-[#0b2147]">{formatCurrencyAmount(12, shopBaseCurrency)}</strong></div>
              <div className="rounded-md bg-white px-3 py-2 text-xs"><span className="text-slate-500">{t('owner_converted_price')}</span><strong className="ml-2 text-[#147bea]">{formatCurrencyAmount(12, shopBaseCurrency === 'MMK' ? 'USD' : 'MMK')}</strong></div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">{t('owner_preview_setting_note')}</p>
        </div>
      </OwnerPanel>
    </div>
  );
}

/**
 * Plan §9: the owner sees the monthly fee, the period and what happens next,
 * and an expired subscription blocks booking while the listing stays visible.
 * The rows come from `ownerSubscriptionStore`, the browser stand-in for
 * `shop_subscriptions`.
 */
function OwnerSubscriptionPanel({ t }: { t: Translate }) {
  const { user, isSuperAdmin } = useAuth();
  const subscriptions = useSubscriptions();
  // §9 bills an owner for their own shop, so another shop's fee is never shown.
  // Super Admin opens this panel through `?preview=1` with no shop of their own,
  // so the preview reads the first owner row instead.
  const row =
    subscriptionForOwner(subscriptions, user?.name) ??
    (isSuperAdmin ? subscriptions.find((candidate) => candidate.kind === 'owner') : undefined);
  if (!row) {
    return (
      <div className="mx-auto max-w-[1100px]">
        <OwnerPanel>
          <PanelHeading icon={CircleDollarSign} title={t('owner_sub_title')} />
          <p className="p-3 text-sm text-slate-500">{t('owner_sub_no_row')}</p>
        </OwnerPanel>
      </div>
    );
  }

  const daysLeft = daysUntilEnd(row);
  const statusKey: TranslationKey =
    row.status === 'active'
      ? 'owner_sub_status_active'
      : row.status === 'grace'
        ? 'owner_sub_status_grace'
        : 'owner_sub_status_expired';
  const tone =
    row.status === 'active'
      ? 'border-green-300 bg-green-50 text-green-700'
      : row.status === 'grace'
        ? 'border-amber-300 bg-amber-50 text-amber-700'
        : 'border-red-300 bg-red-50 text-red-700';

  return (
    <div className="mx-auto max-w-[1100px]">
      <OwnerPanel>
        <PanelHeading icon={CircleDollarSign} title={t('owner_sub_title')} />
        <div className="space-y-3 p-3">
          <p className="text-xs text-slate-500">{t('owner_sub_intro')}</p>
          <div className={`rounded-lg border p-3 ${tone}`}>
            <p className="text-[10px] font-bold uppercase tracking-wide">{t('owner_sub_current')}</p>
            <p className="mt-1 text-lg font-extrabold">{t(statusKey)}</p>
            {row.status === 'active' && daysLeft !== null && (
              <p className="mt-1 text-xs font-semibold">{fill(t('owner_sub_days_left'), { days: daysLeft })}</p>
            )}
            {row.status === 'grace' && (
              <p className="mt-1 text-xs font-semibold">{fill(t('owner_sub_grace_note'), { days: graceDaysLeft(row) })}</p>
            )}
            {row.status === 'expired' && (
              <p className="mt-1 text-xs font-semibold">{t('owner_sub_expired_note')}</p>
            )}
          </div>
          <dl className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-[#dce5f0] bg-[#f4f8fc] p-3">
              <dt className="text-[10px] font-bold text-slate-500">{t('owner_sub_amount')}</dt>
              <dd className="mt-1 text-sm font-extrabold text-[#0b2147]">{row.amountMmk.toLocaleString('en-US')} MMK</dd>
            </div>
            <div className="rounded-lg border border-[#dce5f0] bg-[#f4f8fc] p-3">
              <dt className="text-[10px] font-bold text-slate-500">{t('owner_sub_period')}</dt>
              <dd className="mt-1 text-sm font-extrabold text-[#0b2147]">{row.periodStart.slice(0, 10)} → {row.periodEnd.slice(0, 10)}</dd>
            </div>
            <div className="rounded-lg border border-[#dce5f0] bg-[#f4f8fc] p-3">
              <dt className="text-[10px] font-bold text-slate-500">{t('owner_sub_ends_on')}</dt>
              <dd className="mt-1 text-sm font-extrabold text-[#0b2147]">{row.periodEnd.slice(0, 10)}</dd>
            </div>
          </dl>
          {blocksBooking(row) && (
            <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-700">
              {t('owner_sub_blocked_title')} — {t('owner_sub_expired_note')}
            </p>
          )}
          <p className="text-[10px] text-slate-400">{t('owner_sub_renew_note')}</p>
        </div>
      </OwnerPanel>
    </div>
  );
}
