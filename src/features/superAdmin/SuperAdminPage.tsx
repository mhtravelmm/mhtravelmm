import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Globe2,
  LayoutDashboard,
  LogOut,
  Map,
  MapPin,
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
  Users,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../lib/theme';

type AdminView = 'overview' | 'users' | 'bookings' | 'content' | 'settings';
type Accent = 'blue' | 'green' | 'purple' | 'amber' | 'cyan';

type NavItem = {
  id: AdminView;
  label: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'content', label: 'Travel Plans', icon: Map },
  { id: 'content', label: 'Rentals', icon: Building2 },
  { id: 'bookings', label: 'Tickets', icon: Plane },
  { id: 'content', label: 'Travel Guides', icon: BookOpen },
  { id: 'content', label: 'Cities', icon: MapPin },
  { id: 'content', label: 'Blogs', icon: FileText },
  { id: 'content', label: 'Reviews & Ratings', icon: Star },
  { id: 'bookings', label: 'Payments', icon: WalletCards },
  { id: 'overview', label: 'Reports & Analytics', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const statCards: { label: string; value: string; change: string; icon: LucideIcon; accent: Accent; points: string }[] = [
  { label: 'Total Users', value: '48,750', change: '+12.5%', icon: Users, accent: 'blue', points: '0,38 18,28 32,34 48,19 63,25 79,10 96,16 112,2' },
  { label: 'Total Bookings', value: '32,680', change: '+18.7%', icon: CalendarDays, accent: 'green', points: '0,34 18,29 32,32 48,18 63,24 79,12 96,16 112,3' },
  { label: 'Travel Plans Sold', value: '12,540', change: '+20.1%', icon: WalletCards, accent: 'purple', points: '0,34 17,32 32,22 48,29 64,14 80,20 96,7 112,1' },
  { label: 'Total Revenue', value: '$243,750', change: '+25.3%', icon: CircleDollarSign, accent: 'amber', points: '0,37 17,30 32,34 48,21 64,26 80,14 96,17 112,2' },
  { label: 'Total Reviews', value: '98,720', change: '+10.8%', icon: Star, accent: 'cyan', points: '0,34 18,27 32,31 48,18 64,25 80,13 96,17 112,3' },
];

const bookings = [
  ['#BKG-1001', 'Thar Thar', '✈ Yangon + Bangkok', 'Nov 20, 2026', 'Confirmed', 'green'],
  ['#BKG-1002', 'May Myat', '▰ Inya Lake Hotel', 'Nov 19, 2026', 'Pending', 'blue'],
  ['#BKG-1003', 'Ko Min Htet', '▣ Car Rental', 'Nov 18, 2026', 'Completed', 'purple'],
  ['#BKG-1004', 'Nay Lin', '▣ Mandalay Tour', 'Nov 17, 2026', 'Confirmed', 'green'],
  ['#BKG-1005', 'Ei Ei Khaing', '✈ Yangon + Singapore', 'Nov 16, 2026', 'Cancelled', 'amber'],
] as const;

const cities = [
  ['Yangon', '120.5K views', '+22%', '/images/blog/shwedagon-evening.webp'],
  ['Mandalay', '98.7K views', '+18%', '/images/blog/ubein-evening.webp'],
  ['Bagan', '85.4K views', '+16%', '/images/blog/bagan-sunrise.webp'],
  ['Inle Lake', '72.1K views', '+14%', '/images/blog/inle-stilt-houses.webp'],
  ['Ngapali Beach', '60.8K views', '+12%', '/images/blog/myanmar-wellness.webp'],
];

const recentUsers = [
  ['Moe Thu', '2 minutes ago', 'MT'],
  ['Aung Ko', '5 minutes ago', 'AK'],
  ['Thazin Win', '8 minutes ago', 'TW'],
  ['Min Khant', '12 minutes ago', 'MK'],
  ['Su Mon', '15 minutes ago', 'SM'],
];

const accentClasses: Record<Accent, { card: string; icon: string; line: string }> = {
  blue: { card: 'from-blue-700 to-blue-600', icon: 'bg-blue-300/25 text-blue-100', line: '#67d6ff' },
  green: { card: 'from-green-700 to-lime-600', icon: 'bg-lime-200/25 text-lime-100', line: '#a4ff2e' },
  purple: { card: 'from-violet-700 to-purple-600', icon: 'bg-fuchsia-200/25 text-fuchsia-100', line: '#d78cff' },
  amber: { card: 'from-orange-600 to-amber-500', icon: 'bg-yellow-100/25 text-yellow-50', line: '#ffe65c' },
  cyan: { card: 'from-cyan-700 to-teal-500', icon: 'bg-cyan-100/25 text-cyan-50', line: '#78f6ff' },
};

function formatAdminLabel(label: string, language: 'mm' | 'en') {
  if (language === 'en') return label;
  const labels: Record<string, string> = {
    Dashboard: 'Dashboard', Users: 'အသုံးပြုသူများ', Bookings: 'Booking များ', 'Travel Plans': 'ခရီးစဉ်အစီအစဉ်များ',
    Rentals: 'အငှားဝန်ဆောင်မှု', Tickets: 'လက်မှတ်များ', 'Travel Guides': 'Travel Guides', Cities: 'မြို့များ', Blogs: 'Blogs',
    'Reviews & Ratings': 'သုံးသပ်ချက်များ', Payments: 'ငွေပေးချေမှုများ', 'Reports & Analytics': 'အစီရင်ခံစာများ', Settings: 'Settings',
  };
  return labels[label] ?? label;
}

export function SuperAdminPage() {
  const { language, toggleLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<AdminView>('overview');
  const [period, setPeriod] = useState('Last 30 Days');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');

  function signOut() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  function selectNav(nextView: AdminView) {
    setView(nextView);
    setMobileMenuOpen(false);
  }

  function runAction(label: string) {
    setNotice(`${label} is ready for your next action.`);
    window.setTimeout(() => setNotice(''), 2600);
  }

  const displayName = user?.name || 'Super Admin';
  const initials = displayName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#061426] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-[238px] shrink-0 flex-col border-r border-[#214263] bg-[#08182d] lg:flex">
          <div className="flex h-[70px] items-center gap-2 border-b border-[#214263] px-6 text-2xl font-bold tracking-tight text-[#28c4ff]">
            <Plane className="rotate-[-18deg]" size={34} strokeWidth={2.4} />
            <span>MH Travel</span>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-cyan-300 bg-gradient-to-br from-cyan-400 to-blue-700 text-lg font-bold text-white shadow-lg shadow-cyan-500/20">{initials}</div>
              <div className="min-w-0"><p className="truncate text-sm font-bold">{displayName}</p><p className="mt-1 truncate text-[11px] text-slate-400">{user?.email || 'admin@mhtravelmm.com'}</p></div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-yellow-300/70 bg-yellow-400/10 px-3 py-1 text-[10px] font-bold text-yellow-300"><ShieldCheck size={12} /> Super Administrator</div>
          </div>
          <nav className="flex-1 space-y-1 px-2 pb-5">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = item.id === view && (view === 'overview' ? index === 0 : true);
              return <button key={`${item.label}-${index}`} type="button" onClick={() => selectNav(item.id)} className={`group flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition ${active ? 'bg-gradient-to-r from-[#159eff] to-[#1478ed] font-semibold text-white shadow-lg shadow-blue-900/30' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}><Icon size={18} className={active ? 'text-white' : 'text-slate-200'} /><span>{formatAdminLabel(item.label, language)}</span>{item.label === 'Users' && <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[9px]">3</span>}</button>;
            })}
          </nav>
          <button type="button" onClick={signOut} className="flex items-center gap-3 border-t border-[#214263] px-6 py-5 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"><LogOut size={19} /> Logout</button>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex h-[70px] items-center justify-between gap-4 border-b border-[#214263] bg-[#071a32]/95 px-4 backdrop-blur sm:px-6 lg:px-7">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 lg:hidden" aria-label="Open admin menu">{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
              <div className="flex w-full max-w-[415px] items-center gap-3 rounded-full border border-[#2a5383] bg-[#0e2b53] px-4 py-2.5 text-slate-300 shadow-inner"><Search size={20} /><input aria-label="Search dashboard" placeholder="Search anything..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-300/80" /></div>
            </div>
            <div className="flex shrink-0 items-center gap-3 sm:gap-5">
              <button type="button" onClick={toggleLanguage} className="hidden items-center gap-2 text-sm font-semibold text-white sm:flex"><Globe2 size={21} />{language === 'mm' ? 'မြန်မာ' : 'English'}<ChevronDown size={14} /></button>
              <button type="button" onClick={toggleTheme} className="hidden rounded-full p-1.5 text-slate-200 hover:bg-white/10 sm:block" aria-label="Toggle theme">{theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}</button>
              <button type="button" onClick={() => runAction('Notifications')} className="relative rounded-full p-1.5 text-white hover:bg-white/10" aria-label="Notifications"><Bell size={22} fill="currentColor" /><span className="absolute -right-0.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">12</span></button>
              <div className="hidden items-center gap-2 sm:flex"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-700 text-[10px] font-bold text-white">{initials}</div><span className="text-sm font-semibold">Super Admin</span><ChevronDown size={14} className="text-slate-300" /></div>
            </div>
          </header>

          {mobileMenuOpen && <div className="border-b border-[#214263] bg-[#08182d] p-3 lg:hidden"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{navItems.map((item, index) => { const Icon = item.icon; return <button key={`${item.label}-mobile-${index}`} type="button" onClick={() => selectNav(item.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs ${item.id === view ? 'bg-[#168df4] text-white' : 'bg-white/5 text-slate-300'}`}><Icon size={15} />{formatAdminLabel(item.label, language)}</button>; })}</div><button type="button" onClick={signOut} className="mt-2 flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400"><LogOut size={15} /> Logout</button></div>}

          <main className="p-3 sm:p-5 lg:p-6">
            {notice && <div role="status" className="fixed right-4 top-20 z-50 rounded-lg border border-cyan-300/30 bg-[#102e51] px-4 py-3 text-xs text-cyan-100 shadow-2xl">{notice}</div>}
            {view === 'overview' ? <Overview period={period} setPeriod={setPeriod} runAction={runAction} /> : <AdminSection view={view} runAction={runAction} />}
          </main>
          <footer className="mt-auto flex flex-col gap-3 border-t border-[#214263] bg-[#071a32] px-5 py-5 text-center text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:text-left"><div><p className="text-xl font-bold text-[#27c2ff]">MH Travel</p><p className="mt-1">Explore Myanmar, Travel Better</p></div><p>© 2026, MH Travel. All Rights Reserved.</p><div className="flex justify-center gap-2 text-cyan-300 sm:justify-end"><span className="rounded-full border border-cyan-300/30 p-2">f</span><span className="rounded-full border border-cyan-300/30 p-2">▶</span><span className="rounded-full border border-cyan-300/30 p-2">➤</span><span className="rounded-full border border-cyan-300/30 p-2">◎</span></div></footer>
        </div>
      </div>
    </div>
  );
}

function Overview({ period, setPeriod, runAction }: { period: string; setPeriod: (value: string) => void; runAction: (label: string) => void }) {
  return <div className="mx-auto max-w-[1400px] space-y-4">
    <section className="relative min-h-[154px] overflow-hidden rounded-xl border border-[#315985] bg-[#0d2f57] p-5 shadow-xl sm:p-7">
      <img src="/images/blog/shwedagon-evening.webp" alt="Yangon skyline" className="absolute inset-0 h-full w-full object-cover opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b2c58] via-[#0b2b50]/70 to-[#07172d]/45" />
      <div className="relative flex h-full flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-[#49cfff]"><ShieldCheck size={22} /><span className="text-xs font-semibold uppercase tracking-[0.16em]">MH Travel Control Center</span></div><h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">Super Admin Dashboard</h1><p className="mt-1 text-sm text-blue-100">Manage your MH Travel platform with ease and efficiency</p></div><label className="flex w-fit items-center gap-2 rounded-lg border border-white/25 bg-[#09203c]/85 px-3 py-2 text-xs font-semibold"><CalendarDays size={16} /><select value={period} onChange={(event) => setPeriod(event.target.value)} className="bg-transparent text-white outline-none"><option>Last 7 Days</option><option>Last 30 Days</option><option>Last 90 Days</option><option>This Year</option></select><ChevronDown size={14} /></label></div>
    </section>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">{statCards.map((card) => <MetricCard key={card.label} {...card} />)}</div>
    <div className="grid gap-4 xl:grid-cols-[1.55fr_0.9fr_0.82fr]"><AnalyticsPanel /><DistributionPanel /><QuickActions runAction={runAction} /></div>
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.92fr_0.92fr]"><RecentBookings runAction={runAction} /><PopularCities /><RecentUsers /></div>
  </div>;
}

function MetricCard({ label, value, change, icon: Icon, accent, points }: (typeof statCards)[number]) {
  const colors = accentClasses[accent];
  return <article className={`relative min-h-[125px] overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br ${colors.card} p-4 shadow-lg`}><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-semibold text-white/90">{label}</p><p className="mt-2 text-2xl font-extrabold tracking-tight">{value}</p><p className="mt-1 text-xs font-bold text-lime-200">↑ {change}</p></div><span className={`rounded-xl p-2.5 ${colors.icon}`}><Icon size={28} /></span></div><svg viewBox="0 0 112 42" preserveAspectRatio="none" className="absolute bottom-0 right-0 h-12 w-[58%] opacity-80"><polyline points={points} fill="none" stroke={colors.line} strokeWidth="2.3" /></svg></article>;
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`rounded-xl border border-[#294d76] bg-[#0b203b] shadow-xl ${className}`}>{children}</section>; }
function PanelTitle({ icon: Icon, title, action, onAction }: { icon: LucideIcon; title: string; action?: string; onAction?: () => void }) { return <div className="flex items-center justify-between border-b border-[#244668] px-4 py-3"><h2 className="flex items-center gap-2 text-base font-bold"><Icon size={20} className="text-[#26b8ff]" />{title}</h2>{action && <button type="button" onClick={onAction} className="text-xs font-semibold text-[#31c6ff] hover:text-white">{action} <ChevronRight size={13} className="inline" /></button>}</div>; }

function AnalyticsPanel() { return <Panel><PanelTitle icon={Activity} title="Platform Analytics" action="30D" /><div className="p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300"><div className="flex gap-4"><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#2ca7ff]" />Bookings</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#64dc27]" />Users</span><span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ffae19]" />Revenue</span></div><div className="flex gap-3 text-slate-400"><span>7D</span><span className="rounded-full bg-[#168df4] px-2 py-1 text-white">30D</span><span>90D</span><span>1Y</span></div></div><div className="relative h-[190px] overflow-hidden rounded-lg border border-[#244668] bg-[#081a31] p-2"><div className="absolute inset-0 flex flex-col justify-between p-3 text-[10px] text-slate-500"><span>40K</span><span>30K</span><span>20K</span><span>10K</span><span>0</span></div><svg viewBox="0 0 640 180" preserveAspectRatio="none" className="absolute inset-x-8 bottom-3 top-3 h-[calc(100%-24px)] w-[calc(100%-48px)]"><g stroke="#294867" strokeDasharray="3 4"><line x1="0" y1="12" x2="640" y2="12" /><line x1="0" y1="52" x2="640" y2="52" /><line x1="0" y1="92" x2="640" y2="92" /><line x1="0" y1="132" x2="640" y2="132" /><line x1="0" y1="172" x2="640" y2="172" /></g><path d="M0 103 C45 88 62 98 95 74 S144 105 183 82 S237 101 276 66 S325 92 363 78 S415 94 451 57 S505 83 540 35 S587 77 640 28 L640 180 L0 180 Z" fill="url(#blueFill)" /><path d="M0 123 C45 115 63 130 95 106 S145 129 183 112 S236 130 276 94 S325 120 363 106 S414 122 451 86 S505 113 540 66 S589 111 640 55" fill="none" stroke="#6de91f" strokeWidth="3" /><path d="M0 150 C45 136 65 151 95 131 S144 151 183 139 S235 153 276 125 S325 144 363 130 S416 146 451 119 S506 142 540 105 S587 142 640 90" fill="none" stroke="#ffb31c" strokeWidth="3" /><path d="M0 103 C45 88 62 98 95 74 S144 105 183 82 S237 101 276 66 S325 92 363 78 S415 94 451 57 S505 83 540 35 S587 77 640 28" fill="none" stroke="#2ca7ff" strokeWidth="3" /><defs><linearGradient id="blueFill" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#198fe8" stopOpacity=".38" /><stop offset="1" stopColor="#198fe8" stopOpacity="0" /></linearGradient></defs></svg><div className="absolute bottom-1 left-10 right-4 flex justify-between text-[10px] text-slate-400"><span>Oct 1</span><span>Oct 7</span><span>Oct 13</span><span>Oct 19</span><span>Oct 25</span><span>Oct 30</span></div></div></div></Panel>; }


function DistributionPanel() { return <Panel><PanelTitle icon={Zap} title="Service Distribution" /><div className="flex items-center gap-4 p-5"><div className="relative h-36 w-36 shrink-0 rounded-full" style={{ background: 'conic-gradient(#168df4 0 32.5%, #4bdc13 32.5% 61.2%, #ff9912 61.2% 79.4%, #9d35e8 79.4% 91.8%, #39d8e8 91.8% 100%)' }}><div className="absolute inset-[27px] flex flex-col items-center justify-center rounded-full bg-[#0b203b] text-center"><span className="text-2xl font-extrabold">100%</span><span className="text-[10px] text-slate-300">Total</span></div></div><div className="space-y-2 text-[11px] text-slate-200"><DistributionRow color="bg-[#168df4]" name="Flights" value="32.5%" /><DistributionRow color="bg-[#4bdc13]" name="Hotels" value="28.7%" /><DistributionRow color="bg-[#ff9912]" name="Rentals" value="18.2%" /><DistributionRow color="bg-[#9d35e8]" name="Travel Plans" value="12.4%" /><DistributionRow color="bg-[#39d8e8]" name="Others" value="8.2%" /></div></div></Panel>; }
function DistributionRow({ color, name, value }: { color: string; name: string; value: string }) { return <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span className="min-w-[70px]">{name}</span><strong>{value}</strong></div>; }

function QuickActions({ runAction }: { runAction: (label: string) => void }) { const actions = [['Add City', MapPin], ['Create Plan', Plus], ['Add Blog', FileText], ['Manage Users', Users], ['View Reports', TrendingUp], ['System Settings', Settings] ] as const; return <Panel><PanelTitle icon={Zap} title="Quick Actions" /><div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 xl:grid-cols-2">{actions.map(([label, Icon]) => <button key={label} type="button" onClick={() => runAction(label)} className="flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-xl border border-[#244668] bg-[#102c51] p-2 text-center text-[11px] font-semibold text-slate-200 transition hover:border-cyan-300 hover:bg-[#174472]"><Icon size={24} className="text-[#1da7ff]" />{label}</button>)}</div></Panel>; }

function RecentBookings({ runAction }: { runAction: (label: string) => void }) { return <Panel><PanelTitle icon={CalendarDays} title="Recent Bookings" action="View All" onAction={() => runAction('All bookings')} /><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-[11px]"><thead className="bg-[#091a31] text-slate-300"><tr><th className="px-4 py-3">#</th><th className="px-2 py-3">User</th><th className="px-2 py-3">Service</th><th className="px-2 py-3">Date</th><th className="px-2 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{bookings.map(([id, user, service, date, status, tone]) => <tr key={id} className="border-t border-[#1d3a5c] text-slate-200"><td className="px-4 py-3 font-semibold text-slate-400">{id}</td><td className="px-2 py-3">{user}</td><td className="px-2 py-3">{service}</td><td className="px-2 py-3 whitespace-nowrap">{date}</td><td className="px-2 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-bold ${tone === 'green' ? 'bg-green-500/25 text-green-300' : tone === 'purple' ? 'bg-purple-500/25 text-purple-300' : tone === 'amber' ? 'bg-orange-500/25 text-orange-300' : 'bg-blue-500/25 text-blue-300'}`}>{status}</span></td><td className="px-4 py-3"><button type="button" onClick={() => runAction(`View ${id}`)} className="text-lg text-slate-200 hover:text-cyan-300">◉</button></td></tr>)}</tbody></table></div></Panel>; }

function PopularCities() { return <Panel><PanelTitle icon={MapPin} title="Popular Cities" action="View All" /><div className="space-y-2 p-3">{cities.map(([name, views, change, image], index) => <div key={name} className="flex items-center gap-2 border-b border-[#1d3a5c] pb-2 last:border-0"><span className="w-4 text-center text-sm font-bold">{index + 1}</span><img src={image} alt="" className="h-9 w-12 rounded-md object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{name}</p><p className="text-[10px] text-slate-400">{views}</p></div><span className="text-xs font-bold text-cyan-300">↑ {change}</span></div>)}</div></Panel>; }

function RecentUsers() { return <Panel><PanelTitle icon={Users} title="Recent Users" action="View All" /><div className="space-y-2 p-3">{recentUsers.map(([name, time, initials]) => <div key={name} className="flex items-center gap-3 border-b border-[#1d3a5c] pb-2 last:border-0"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-blue-700 text-[10px] font-bold">{initials}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{name}</p><p className="text-[10px] text-slate-400">{time}</p></div><span className="rounded-full bg-green-500/25 px-2 py-1 text-[9px] font-bold text-green-300">Active</span></div>)}</div></Panel>; }

function AdminSection({ view, runAction }: { view: Exclude<AdminView, 'overview'>; runAction: (label: string) => void }) { const meta: Record<Exclude<AdminView, 'overview'>, { title: string; intro: string; icon: LucideIcon }> = { users: { title: 'Users', intro: 'Manage traveler accounts and admin access.', icon: Users }, bookings: { title: 'Bookings', intro: 'Review bookings, quotations, payments, and ticket orders.', icon: CalendarDays }, content: { title: 'Travel content and plans', intro: 'Manage travel plans, guides, cities, blogs, rentals, and reviews.', icon: BookOpen }, settings: { title: 'System settings', intro: 'Manage permissions, security, and platform preferences.', icon: Settings } }; const copy = meta[view]; const Icon = copy.icon; const rows = view === 'users' ? [['Aung Aung', 'aung.aung@example.com', 'Traveler'], ['The Rangoon House', 'owner@rangoonhouse.com', 'Owner Admin'], ['MH Travel Content', 'content@mhtravel.com', 'Blog Admin']] : view === 'bookings' ? [['MH-2026-01842', 'The Rangoon House · 18 Nov 2026', 'Confirmed'], ['MH-2026-01843', 'Custom Plan · Yangon / Bagan / Inle', 'Pending'], ['MH-2026-01844', 'Sedona Hotel Yangon · 02 Dec 2026', 'Paid']] : [['Role and permissions', 'Manage access for admin accounts.', 'Protected'], ['Security settings', 'Monitor session and login security.', 'Enabled'], ['Audit logs', 'Admin actions are recorded for review.', 'Enabled']]; return <div className="mx-auto max-w-[1100px]"><Panel><PanelTitle icon={Icon} title={copy.title} /><div className="p-5"><p className="mb-5 text-sm text-slate-400">{copy.intro}</p><div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="rounded-lg border border-[#2b527d] bg-[#102c51] p-4"><p className="text-2xl font-extrabold">{view === 'users' ? '48,750' : view === 'bookings' ? '32,680' : '13'}</p><p className="mt-1 text-xs text-slate-400">{view === 'users' ? 'Total records' : view === 'bookings' ? 'Total bookings' : 'Active controls'}</p></div><div className="rounded-lg border border-[#2b527d] bg-[#102c51] p-4"><p className="text-2xl font-extrabold text-green-300">+18.7%</p><p className="mt-1 text-xs text-slate-400">Growth this month</p></div><button type="button" onClick={() => runAction(`Create ${copy.title}`)} className="flex items-center justify-center gap-2 rounded-lg bg-[#168df4] p-4 text-sm font-bold hover:bg-[#2aa6ff]"><Plus size={18} /> Add new</button></div><div className="divide-y divide-[#1d3a5c] rounded-lg border border-[#244668] bg-[#091b32]">{rows.map(([title, detail, status]) => <div key={title} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div><button type="button" onClick={() => runAction(`Review ${title}`)} className="flex items-center gap-1 self-start rounded-md border border-[#2f6192] px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-white/10 sm:self-auto">{status}<ChevronRight size={14} /></button></div>)}</div></div></Panel></div>; }
