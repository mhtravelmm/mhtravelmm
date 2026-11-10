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

type OwnerView = 'dashboard' | 'shop' | 'bookings' | 'orders' | 'menu' | 'gallery' | 'reviews' | 'analytics' | 'payments' | 'promotions' | 'settings' | 'support';

type OwnerNavItem = { id: OwnerView; label: string; icon: LucideIcon };

const navItems: OwnerNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'shop', label: 'My Shop', icon: Store },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'menu', label: 'Menu Management', icon: BookOpen },
  { id: 'gallery', label: 'Photos & Gallery', icon: Camera },
  { id: 'reviews', label: 'Reviews & Ratings', icon: Star },
  { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
  { id: 'payments', label: 'Payments', icon: CircleDollarSign },
  { id: 'promotions', label: 'Promotions', icon: Tag },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'support', label: 'Help & Support', icon: HelpCircle },
];

const menuItems = [
  { name: 'Mohinga', orders: '892 orders', share: '38%', image: '/images/blog/myanmar-food.webp' },
  { name: 'Shan Noodle', orders: '654 orders', share: '28%', image: '/images/blog/ubein-evening.webp' },
  { name: 'Fried Rice', orders: '520 orders', share: '22%', image: '/images/blog/myanmar-food.webp' },
];

const bookings = [
  ['Thar Thar Win', 'Nov 07, 2026 · 7:30 PM', '2', 'Confirmed', 'green'],
  ['Ko Min Htet', 'Nov 07, 2026 · 8:00 PM', '4', 'Pending', 'blue'],
  ['Daw Aye Aye', 'Nov 07, 2026 · 8:30 PM', '3', 'Confirmed', 'green'],
  ['May Myat', 'Nov 08, 2026 · 6:00 PM', '2', 'Completed', 'purple'],
] as const;

function OwnerPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#dce5f0] bg-white shadow-[0_10px_30px_rgba(36,83,145,0.08)] ${className}`}>{children}</section>;
}

function PanelHeading({ icon: Icon, title, action, onAction }: { icon: LucideIcon; title: string; action?: string; onAction?: () => void }) {
  return <div className="flex items-center justify-between border-b border-[#e7edf4] px-4 py-3.5"><h2 className="flex items-center gap-2 text-base font-bold text-[#0b2147]"><Icon size={20} className="text-[#147bea]" />{title}</h2>{action && <button type="button" onClick={onAction} className="text-xs font-bold text-[#147bea] hover:text-[#0b4da6]">{action} <ChevronRight size={13} className="inline" /></button>}</div>;
}

export function ShopOwnerPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<OwnerView>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [period, setPeriod] = useState('Last 30 Days');
  const [notice, setNotice] = useState('');

  function notify(label: string) {
    setNotice(`${label} is ready for your next action.`);
    window.setTimeout(() => setNotice(''), 2400);
  }

  function selectView(next: OwnerView) {
    setView(next);
    setMobileOpen(false);
  }

  function signOut() {
    navigate('/login');
  }

  return <div className="min-h-screen overflow-x-hidden bg-[#f4f8fc] text-[#0b2147]">
    <div className="flex min-h-screen">
      <aside className="hidden w-[202px] shrink-0 flex-col bg-gradient-to-b from-[#062653] to-[#071a3e] text-white lg:flex">
        <div className="flex h-[72px] items-center gap-2 border-b border-white/10 px-5 text-2xl font-extrabold tracking-tight text-[#27bfff]"><span className="text-3xl">✈</span> MH Travel</div>
        <div className="border-b border-white/10 px-4 py-4 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-cyan-300 bg-gradient-to-br from-orange-200 via-amber-500 to-green-700 text-3xl shadow-lg">🍽️</div><p className="mt-2 text-sm font-bold leading-5">Royal Myanmar<br />Restaurant</p><span className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-[10px] font-bold"><CheckCircle2 size={11} /> Verified Business</span></div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => selectView(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition ${view === item.id ? 'bg-gradient-to-r from-[#198df2] to-[#1472df] text-white shadow-lg shadow-blue-950/30' : 'text-blue-100/85 hover:bg-white/10 hover:text-white'}`}><Icon size={17} />{item.label}</button>; })}</nav>
        <button type="button" onClick={signOut} className="mx-3 mb-4 flex items-center justify-center gap-2 rounded-lg border border-blue-300/30 bg-blue-500/20 px-3 py-3 text-xs font-bold text-white hover:bg-red-500/20 hover:text-red-200"><LogOut size={17} /> Logout</button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-[72px] items-center justify-between gap-3 border-b border-[#dce5f0] bg-[#062653] px-4 text-white sm:px-6"><div className="flex items-center gap-3"><button type="button" onClick={() => setMobileOpen((open) => !open)} className="rounded-lg p-2 hover:bg-white/10 lg:hidden" aria-label="Open owner menu">{mobileOpen ? <X size={22} /> : <Menu size={22} />}</button><span className="text-xl font-extrabold text-[#27bfff] lg:hidden">✈ MH Travel</span></div><div className="ml-auto flex items-center gap-3 sm:gap-5"><button type="button" onClick={() => notify('Notifications')} className="relative rounded-full p-2 hover:bg-white/10" aria-label="Notifications"><Bell size={22} /><span className="absolute -right-0.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">3</span></button><div className="flex items-center gap-2 border-l border-white/15 pl-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-green-700 text-xl">🍽️</div><div className="hidden text-left sm:block"><p className="text-sm font-bold">Royal Myanmar Restaurant</p><p className="text-[11px] text-blue-100">Shop Owner <ChevronDown size={12} className="inline" /></p></div></div></div></header>
        {mobileOpen && <div className="border-b border-[#cfdceb] bg-white p-3 lg:hidden"><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" onClick={() => selectView(item.id)} className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold ${view === item.id ? 'bg-[#147bea] text-white' : 'bg-[#eff5fb] text-[#18375e]'}`}><Icon size={15} />{item.label}</button>; })}</div></div>}

        <main className="p-3 sm:p-5 lg:p-6">{notice && <div role="status" className="fixed right-4 top-20 z-50 rounded-lg border border-cyan-300/30 bg-[#0b3a71] px-4 py-3 text-xs text-white shadow-2xl">{notice}</div>}{view === 'dashboard' ? <OwnerOverview period={period} setPeriod={setPeriod} notify={notify} onOpen={selectView} /> : <OwnerSection view={view} notify={notify} />}</main>
        <footer className="border-t border-[#dce5f0] bg-white px-5 py-4 text-center text-xs text-slate-500 sm:flex sm:items-center sm:justify-between sm:text-left"><p><strong className="text-lg text-[#119eea]">MH Travel</strong><br />Grow your business with more travelers.</p><p>© 2026 MH Travel. All rights reserved.</p><p className="text-[#147bea]">Help Center · Contact Support</p></footer>
      </div>
    </div>
  </div>;
}

function OwnerOverview({ period, setPeriod, notify, onOpen }: { period: string; setPeriod: (value: string) => void; notify: (label: string) => void; onOpen: (view: OwnerView) => void }) {
  return <div className="mx-auto max-w-[1400px] space-y-4">
    <section className="relative min-h-[225px] overflow-hidden rounded-2xl border border-[#b9d5ee] bg-[#0b3871] shadow-lg"><img src="/images/blog/myanmar-food.webp" alt="Royal Myanmar Restaurant" className="absolute inset-0 h-full w-full object-cover opacity-70" /><div className="absolute inset-0 bg-gradient-to-r from-[#052856]/95 via-[#073570]/70 to-[#052856]/20" /><div className="relative flex h-full min-h-[225px] flex-col justify-center gap-5 p-6 sm:p-8"><div className="max-w-xl"><p className="text-sm font-semibold text-cyan-200">ROYAL MYANMAR RESTAURANT · SHOP OWNER</p><h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">Welcome Back!</h1><h2 className="mt-1 text-2xl font-extrabold text-[#24c6ff] sm:text-3xl">Grow Your Business with MH Travel</h2><p className="mt-2 text-sm text-blue-50">More Travelers. More Customers. More Business.</p><button type="button" onClick={() => onOpen('shop')} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#148bf3] px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-950/30 hover:bg-[#2aa6ff]">View Your Shop <ChevronRight size={16} /></button></div><div className="absolute right-5 top-5 hidden rounded-xl border border-green-200/30 bg-[#071d39]/85 px-5 py-4 text-center backdrop-blur-sm md:block"><CheckCircle2 className="mx-auto text-lime-300" size={38} /><p className="mt-1 text-sm font-extrabold text-lime-300">Your Shop is<br />Verified</p><p className="mt-2 text-[10px] text-blue-100">Thank you for being<br />part of MH Travel!</p></div></div></section>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><OwnerStat icon={CalendarDays} label="Total Bookings" value="128" change="↑ 12%" tone="blue" onClick={() => onOpen('bookings')} /><OwnerStat icon={ShoppingBag} label="Total Orders" value="2,340" change="↑ 18%" tone="green" onClick={() => onOpen('orders')} /><OwnerStat icon={Star} label="Total Reviews" value="4.7" change="★★★★★  (320)" tone="purple" onClick={() => onOpen('reviews')} /><OwnerStat icon={BarChart3} label="Total Revenue" value="5,280,000 Ks" change="↑ 20%" tone="amber" onClick={() => onOpen('payments')} /></div>
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]"><BookingChart period={period} setPeriod={setPeriod} /><PopularMenu onViewAll={() => onOpen('menu')} /></div>
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]"><RecentBookings onViewAll={() => onOpen('bookings')} /><OwnerQuickActions onOpen={onOpen} notify={notify} /></div>
  </div>;
}

function OwnerStat({ icon: Icon, label, value, change, tone, onClick }: { icon: LucideIcon; label: string; value: string; change: string; tone: 'blue' | 'green' | 'purple' | 'amber'; onClick: () => void }) { const colors = { blue: 'bg-blue-500/10 text-blue-600', green: 'bg-green-500/10 text-green-600', purple: 'bg-purple-500/10 text-purple-600', amber: 'bg-amber-500/10 text-amber-600' }; return <button type="button" onClick={onClick} className="group relative overflow-hidden rounded-2xl border border-[#dce5f0] bg-white p-4 text-left shadow-[0_10px_30px_rgba(36,83,145,0.06)] transition hover:-translate-y-0.5 hover:border-[#7bb8ee]"><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${colors[tone]}`}><Icon size={24} /></span><p className="mt-3 text-xs font-bold text-[#18375e]">{label}</p><p className="mt-1 text-2xl font-extrabold text-[#0b2147] sm:text-3xl">{value}</p><p className={`mt-1 text-xs font-bold ${tone === 'amber' ? 'text-amber-600' : 'text-green-600'}`}>{change}</p><svg viewBox="0 0 120 32" preserveAspectRatio="none" className="absolute bottom-0 right-0 h-10 w-[58%] opacity-35"><polyline points="0,26 16,22 32,25 47,16 64,22 80,14 96,18 120,4" fill="none" stroke="currentColor" strokeWidth="2" /></svg></button>; }

function BookingChart({ period, setPeriod }: { period: string; setPeriod: (value: string) => void }) { return <OwnerPanel><div className="flex items-center justify-between border-b border-[#e7edf4] px-4 py-3.5"><h2 className="flex items-center gap-2 text-base font-bold"><BarChart3 size={20} className="text-[#147bea]" />Booking Statistics</h2><label className="flex items-center gap-1 rounded-lg border border-[#dce5f0] px-2 py-1.5 text-[10px] font-semibold"><select value={period} onChange={(event) => setPeriod(event.target.value)} className="bg-transparent text-[#18375e] outline-none"><option>Last 7 Days</option><option>Last 30 Days</option><option>Last 90 Days</option></select><ChevronDown size={13} /></label></div><div className="relative h-[245px] p-4"><svg viewBox="0 0 640 220" preserveAspectRatio="none" className="h-full w-full"><g stroke="#e1eaf4" strokeDasharray="3 4"><line x1="28" y1="20" x2="620" y2="20" /><line x1="28" y1="75" x2="620" y2="75" /><line x1="28" y1="130" x2="620" y2="130" /><line x1="28" y1="185" x2="620" y2="185" /></g><path d="M28 154 C62 140 72 160 100 128 S143 166 174 138 S220 158 251 113 S299 151 329 91 S368 122 401 101 S440 139 470 72 S510 120 542 68 S581 100 620 42 L620 185 L28 185 Z" fill="#168df4" fillOpacity=".12" /><path d="M28 154 C62 140 72 160 100 128 S143 166 174 138 S220 158 251 113 S299 151 329 91 S368 122 401 101 S440 139 470 72 S510 120 542 68 S581 100 620 42" fill="none" stroke="#147bea" strokeWidth="4" /><g fill="#147bea"><circle cx="28" cy="154" r="5" /><circle cx="100" cy="128" r="5" /><circle cx="174" cy="138" r="5" /><circle cx="251" cy="113" r="5" /><circle cx="329" cy="91" r="5" /><circle cx="401" cy="101" r="5" /><circle cx="470" cy="72" r="5" /><circle cx="542" cy="68" r="5" /><circle cx="620" cy="42" r="6" /></g><rect x="584" y="8" width="45" height="28" rx="10" fill="#147bea" /><text x="606" y="27" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">128</text></svg><div className="absolute bottom-1 left-8 right-6 flex justify-between text-[10px] text-slate-400"><span>Oct 1</span><span>Oct 7</span><span>Oct 14</span><span>Oct 21</span><span>Oct 31</span></div></div></OwnerPanel>; }

function PopularMenu({ onViewAll }: { onViewAll: () => void }) { return <OwnerPanel><PanelHeading icon={BookOpen} title="Popular Menu Items" action="View All" onAction={onViewAll} /><div className="space-y-2 p-3">{menuItems.map((item) => <div key={item.name} className="flex items-center gap-3 border-b border-[#e7edf4] pb-2 last:border-0"><img src={item.image} alt="" className="h-12 w-16 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#18375e]">{item.name}</p><p className="text-[10px] text-slate-400">{item.orders}</p><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e8eef5]"><span className="block h-full rounded-full bg-gradient-to-r from-[#148bf3] to-[#75c6ff]" style={{ width: item.share }} /></div></div><strong className="text-xs text-[#18375e]">{item.share}</strong></div>)}</div></OwnerPanel>; }

function RecentBookings({ onViewAll }: { onViewAll: () => void }) { return <OwnerPanel><PanelHeading icon={CalendarDays} title="Recent Bookings" action="View All" onAction={onViewAll} /><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-[11px]"><thead className="bg-[#f6f9fc] text-[#18375e]"><tr><th className="px-4 py-3">Customer</th><th className="px-2 py-3">Date & Time</th><th className="px-2 py-3">Guests</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{bookings.map(([customer, date, guests, status, tone]) => <tr key={customer} className="border-t border-[#e7edf4]"><td className="px-4 py-3 font-semibold">{customer}</td><td className="px-2 py-3 text-slate-500">{date}</td><td className="px-2 py-3 text-center">{guests}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${tone === 'green' ? 'bg-green-100 text-green-700' : tone === 'purple' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{status}</span></td></tr>)}</tbody></table></div></OwnerPanel>; }

function OwnerQuickActions({ onOpen, notify }: { onOpen: (view: OwnerView) => void; notify: (label: string) => void }) { const actions: [string, LucideIcon, OwnerView | null][] = [['Manage Menu', BookOpen, 'menu'], ['Upload Photos', ImagePlus, 'gallery'], ['Create Promo', Tag, 'promotions'], ['View Reports', BarChart3, 'analytics']]; return <OwnerPanel><PanelHeading icon={Zap} title="Quick Actions" /><div className="grid grid-cols-2 gap-3 p-4">{actions.map(([label, Icon, target]) => <button key={label} type="button" onClick={() => target ? onOpen(target) : notify(label)} className="flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-xl border border-[#dce5f0] bg-[#f4f8fc] text-center text-[11px] font-bold text-[#18375e] transition hover:border-[#75b8f0] hover:bg-[#eaf5ff]"><Icon size={25} className="text-[#147bea]" />{label}</button>)}</div></OwnerPanel>; }

function OwnerSection({ view, notify }: { view: Exclude<OwnerView, 'dashboard'>; notify: (label: string) => void }) { const item = navItems.find((nav) => nav.id === view) ?? navItems[1]; const Icon = item.icon; return <div className="mx-auto max-w-[1100px]"><OwnerPanel><PanelHeading icon={Icon} title={item.label} action="Add new" onAction={() => notify(`Add new ${item.label}`)} /><div className="p-5"><p className="text-sm text-slate-500">Manage your {item.label.toLowerCase()} from this owner workspace.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-[#dce5f0] bg-[#f4f8fc] p-4"><p className="text-2xl font-extrabold text-[#0b2147]">128</p><p className="mt-1 text-xs text-slate-500">This month</p></div><div className="rounded-xl border border-[#dce5f0] bg-[#f4f8fc] p-4"><p className="text-2xl font-extrabold text-green-600">+18%</p><p className="mt-1 text-xs text-slate-500">Compared with last month</p></div><button type="button" onClick={() => notify(`Create ${item.label}`)} className="flex items-center justify-center gap-2 rounded-xl bg-[#147bea] p-4 text-sm font-bold text-white hover:bg-[#0b63c4]"><Plus size={18} /> Create new</button></div><div className="mt-5 divide-y divide-[#e7edf4] rounded-xl border border-[#dce5f0]">{['Your workspace is verified and visible to travelers.', 'Keep your menus, photos, and opening hours up to date.', 'Respond to new customer reviews within 24 hours.'].map((message) => <div key={message} className="flex items-center gap-3 p-4 text-sm text-[#18375e]"><CheckCircle2 size={17} className="text-green-500" />{message}</div>)}</div></div></OwnerPanel></div>; }
