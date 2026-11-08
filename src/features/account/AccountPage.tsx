import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  ChevronRight,
  HelpCircle,
  CreditCard,
  Edit3,
  FileText,
  Heart,
  LogOut,
  MapPin,
  MessageCircle,
  Settings,
  ShieldCheck,
  Star,
  UserRound,
  WalletCards,
} from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { NOTIFICATIONS } from '../../data/notifications';
import { TRAVEL_PLANS, TRAVEL_GUIDES, BLOGS, POPULARS } from '../../data/homeData';
import { TOP_ATTRACTIONS, POPULAR_HOTELS, POPULAR_RESTAURANTS, POPULAR_BOOK_SHOPS, POPULAR_RENTALS, POPULAR_TRANSPORT, POPULAR_CAFES, POPULAR_MARKETS } from '../../data/cityPageData';
import { ListingCard } from '../../components/ui/ListingCard';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';

type DashboardView = 'overview' | 'bookings' | 'plans' | 'favorites' | 'reviews' | 'messages' | 'settings' | 'support';

const menu: { id: DashboardView; icon: typeof UserRound; key: 'account_overview' | 'account_bookings' | 'account_plans' | 'account_favorites' | 'account_reviews' | 'account_messages' | 'account_settings' | 'account_support' }[] = [
  { id: 'overview', icon: UserRound, key: 'account_overview' },
  { id: 'bookings', icon: CalendarDays, key: 'account_bookings' },
  { id: 'plans', icon: MapPin, key: 'account_plans' },
  { id: 'favorites', icon: Heart, key: 'account_favorites' },
  { id: 'reviews', icon: Star, key: 'account_reviews' },
  { id: 'messages', icon: MessageCircle, key: 'account_messages' },
  { id: 'settings', icon: Settings, key: 'account_settings' },
  { id: 'support', icon: HelpCircle, key: 'account_support' },
];

export function AccountPage() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<DashboardView>('overview');
  const favorites = useToggleFavorite([...TRAVEL_PLANS, ...TRAVEL_GUIDES, ...BLOGS, ...POPULARS, ...TOP_ATTRACTIONS, ...POPULAR_HOTELS, ...POPULAR_RESTAURANTS, ...POPULAR_BOOK_SHOPS, ...POPULAR_RENTALS, ...POPULAR_TRANSPORT, ...POPULAR_CAFES, ...POPULAR_MARKETS]);

  return (
    <div className="mx-auto max-w-7xl pb-8 pt-2 sm:pt-4">
      <section className="relative overflow-hidden rounded-card border border-border bg-bg-card p-4 sm:p-6">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-brand-blue/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-blueDark text-xl font-medium text-white">AA</div>
            <div><p className="text-[10px] uppercase tracking-[0.18em] text-brand-blue">{t('account_traveler_badge')}</p><h1 className="mt-1 text-xl font-medium text-text-primary">{user?.name ?? 'Aung Aung'}</h1><p className="mt-1 text-xs text-text-muted">{user?.email ?? 'aung.aung@example.com'} · Yangon, Myanmar</p></div>
          </div>
          <button type="button" onClick={() => setView('settings')} className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-bg px-3 py-2 text-xs text-text-secondary transition hover:border-brand-blue/50 hover:text-brand-blue"><Edit3 size={13} />{t('account_edit_profile')}</button>
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-4"><Stat icon={CalendarDays} value="2" label={t('account_stat_bookings')} /><Stat icon={MapPin} value="4" label={t('account_stat_plans')} /><Stat icon={Heart} value="8" label={t('account_stat_saved')} /><Stat icon={Star} value="3" label={t('account_stat_reviews')} /></div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[190px_1fr]">
        <aside className="rounded-card border border-border bg-bg-card p-2"><nav className="grid grid-cols-2 gap-1 lg:grid-cols-1">{menu.map(({ id, icon: Icon, key }) => <button key={id} type="button" onClick={() => setView(id)} className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs transition ${view === id ? 'bg-brand-blue text-white' : 'text-text-secondary hover:bg-bg-cardAlt hover:text-text-primary'}`}><Icon size={14} />{t(key)}</button>)}</nav><div className="mt-3 border-t border-border pt-3"><button type="button" onClick={() => { logout(); navigate('/login', { replace: true }); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-text-faint hover:text-brand-red"><LogOut size={14} />{t('account_logout')}</button></div></aside>

        <main className="min-w-0">{view === 'overview' && <Overview onOpen={setView} />}{view === 'bookings' && <Bookings />}{view === 'plans' && <Plans />}{view === 'favorites' && <Favorites listings={favorites.listings} toggle={favorites.toggle} />}{view === 'reviews' && <Reviews />}{view === 'messages' && <Messages />}{view === 'settings' && <SettingsView />}{view === 'support' && <Support />}</main>
      </div>
    </div>
  );
}

function Overview({ onOpen }: { onOpen: (view: DashboardView) => void }) {
  const { t } = useLanguage();
  return <div className="space-y-4"><div className="flex items-center justify-between"><div><h2 className="text-base font-medium text-text-primary">{t('account_welcome')}</h2><p className="mt-1 text-[11px] text-text-muted">{t('account_overview_intro')}</p></div><span className="rounded-full bg-status-successBg px-2 py-1 text-[10px] text-status-success">{t('account_verified')}</span></div><div className="grid gap-3 xl:grid-cols-2"><BookingPreview onOpen={() => onOpen('bookings')} /><PlanPreview onOpen={() => onOpen('plans')} /></div><div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]"><SavedPreview onOpen={() => onOpen('favorites')} /><NotificationPreview /></div></div>;
}

function BookingPreview({ onOpen }: { onOpen: () => void }) {
  const { t } = useLanguage();
  return <section className="rounded-card border border-border bg-bg-card p-3 sm:p-4"><PanelTitle icon={CalendarDays} title={t('account_upcoming_booking')} action={t('account_view_all')} onClick={onOpen} /><div className="mt-3 flex gap-3 rounded-md bg-bg-cardAlt p-2.5"><div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-brand-blueDark to-bg"><div className="flex h-full items-center justify-center text-brand-blue"><CalendarDays size={22} /></div></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-medium text-text-primary">The Rangoon House</h3><span className="rounded-full bg-status-successBg px-1.5 py-0.5 text-[9px] text-status-success">{t('account_confirmed')}</span></div><p className="mt-1 flex items-center gap-1 text-[10px] text-text-muted"><MapPin size={10} /> No. 45, Inya Road, Kamayut</p><p className="mt-1 flex items-center gap-1 text-[10px] text-brand-blue"><CalendarDays size={10} /> 18 Nov 2026 · 2 guests</p></div></div></section>;
}

function PlanPreview({ onOpen }: { onOpen: () => void }) {
  const { t } = useLanguage();
  return <section className="rounded-card border border-border bg-bg-card p-3 sm:p-4"><PanelTitle icon={MapPin} title={t('account_custom_plan')} action={t('account_view_all')} onClick={onOpen} /><div className="mt-3 rounded-md border border-brand-blue/20 bg-brand-blue/10 p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium text-text-primary">Yangon → Bagan → Inle Lake</p><span className="text-[10px] text-status-warning">{t('account_quotation_pending')}</span></div><p className="mt-1 text-[10px] leading-4 text-text-muted">{t('account_plan_review_message')}</p><div className="mt-3 flex items-center gap-1 text-[9px] text-brand-blue"><span className="h-1.5 w-1.5 rounded-full bg-brand-blue" /> {t('account_sent_to_mh')} <span className="h-px w-6 bg-brand-blue/40" /><span className="h-1.5 w-1.5 rounded-full bg-text-faint" /> {t('account_awaiting_quote')} <span className="h-px w-6 bg-border" /><span className="h-1.5 w-1.5 rounded-full bg-text-faint" /> {t('account_confirm')}</div></div></section>;
}

function SavedPreview({ onOpen }: { onOpen: () => void }) {
  const { t } = useLanguage();
  return <section className="rounded-card border border-border bg-bg-card p-3 sm:p-4"><PanelTitle icon={Heart} title={t('account_saved_preview')} action={t('account_view_all')} onClick={onOpen} /><div className="mt-3 grid grid-cols-2 gap-2"><MiniSaved title="Bagan at first light" image="/images/blog/bagan-sunrise.webp" /><MiniSaved title="The Rangoon House" image="/images/blog/shwedagon-evening.webp" /></div></section>;
}

function MiniSaved({ title, image }: { title: string; image: string }) { return <div className="flex items-center gap-2 rounded-md bg-bg-cardAlt p-2"><img src={image} alt="" className="h-10 w-10 rounded-md object-cover" /><div className="min-w-0"><p className="truncate text-[10px] text-text-primary">{title}</p><p className="mt-1 text-[9px] text-status-rating">★★★★★</p></div></div>; }

function NotificationPreview() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return <section className="rounded-card border border-border bg-bg-card p-3 sm:p-4"><PanelTitle icon={Bell} title={t('account_recent_activity')} action={t('account_view_all')} onClick={() => navigate('/account/notifications')} /><div className="mt-3 space-y-2">{NOTIFICATIONS.slice(0, 3).map((item) => <div key={item.id} className="flex gap-2 border-b border-border pb-2 last:border-0 last:pb-0"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.isRead ? 'bg-border' : 'bg-brand-red'}`} /><p className="line-clamp-2 text-[10px] leading-4 text-text-secondary">{item.title}<span className="ml-1 text-text-faint">· {item.timeAgo}</span></p></div>)}</div></section>;
}

function Bookings() { const { t } = useLanguage(); return <PagePanel title={t('account_bookings')} intro={t('account_bookings_intro')}><div className="space-y-2"><BookingRow title="The Rangoon House" date="18 Nov 2026" status={t('account_confirmed')} /><BookingRow title="Sedona Hotel Yangon" date="02 Dec 2026" status={t('account_completed')} /></div></PagePanel>; }
function BookingRow({ title, date, status }: { title: string; date: string; status: string }) { return <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-bg-cardAlt p-3"><div><p className="text-xs font-medium text-text-primary">{title}</p><p className="mt-1 text-[10px] text-text-muted">{date} · 2 guests</p></div><span className="rounded-full bg-status-successBg px-2 py-1 text-[9px] text-status-success">{status}</span></div>; }
function Plans() { const { t } = useLanguage(); return <PagePanel title={t('account_plans')} intro={t('account_plans_intro')}><div className="rounded-md border border-brand-blue/20 bg-brand-blue/10 p-3"><p className="text-sm font-medium text-text-primary">Yangon → Bagan → Inle Lake</p><p className="mt-1 text-[10px] text-text-muted">7 days · 2 travelers · Myanmar citizen · Hotel selection later</p><div className="mt-3 flex items-center gap-2 text-[10px] text-status-warning"><WalletCards size={13} />{t('account_quotation_pending')}</div></div></PagePanel>; }
function Favorites({ listings, toggle }: { listings: typeof TRAVEL_PLANS; toggle: (id: string) => void }) { const { t } = useLanguage(); const saved = listings.filter((listing) => listing.isFavorited); return <PagePanel title={t('account_favorites')} intro={t('account_favorites_intro')}>{saved.length > 0 ? <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">{saved.map((listing) => <ListingCard key={listing.id} listing={listing} onToggleFavorite={toggle} size="md" />)}</div> : <div className="rounded-md border border-dashed border-border p-8 text-center text-xs text-text-muted">{t('account_no_favorites')}</div>}</PagePanel>; }
function Reviews() { const { t } = useLanguage(); return <PagePanel title={t('account_reviews')} intro={t('account_reviews_intro')}><div className="space-y-2"><ReviewRow title="The Rangoon House" text="Amazing atmosphere, delicious food and great service!" /><ReviewRow title="Bagan at first light" text="A peaceful and memorable morning in Bagan." /></div></PagePanel>; }
function ReviewRow({ title, text }: { title: string; text: string }) { return <div className="rounded-md border border-border bg-bg-cardAlt p-3"><div className="flex items-center justify-between"><p className="text-xs font-medium text-text-primary">{title}</p><span className="text-status-rating">★★★★★</span></div><p className="mt-1 text-[10px] text-text-muted">{text}</p></div>; }
function Messages() { const { t } = useLanguage(); return <PagePanel title={t('account_messages')} intro={t('account_messages_intro')}><div className="rounded-md border border-border bg-bg-cardAlt p-3"><div className="flex gap-2"><MessageCircle size={15} className="text-brand-blue" /><div><p className="text-xs font-medium text-text-primary">MH Travel Support</p><p className="mt-1 text-[10px] leading-4 text-text-muted">{t('account_message_sample')}</p></div></div></div></PagePanel>; }
function SettingsView() { const { t } = useLanguage(); return <PagePanel title={t('account_settings')} intro={t('account_settings_intro')}><div className="space-y-2"><SettingRow icon={UserRound} title={t('account_profile_settings')} value="Aung Aung" /><SettingRow icon={ShieldCheck} title={t('account_privacy_settings')} value={t('account_private')} /><SettingRow icon={CreditCard} title={t('account_payment_settings')} value={t('account_payment_methods')} /></div></PagePanel>; }
function SettingRow({ icon: Icon, title, value }: { icon: typeof UserRound; title: string; value: string }) { return <button type="button" className="flex w-full items-center justify-between rounded-md border border-border bg-bg-cardAlt p-3 text-left hover:border-brand-blue/40"><span className="flex items-center gap-2 text-xs text-text-primary"><Icon size={14} className="text-brand-blue" />{title}</span><span className="flex items-center gap-1 text-[10px] text-text-muted">{value}<ChevronRight size={12} /></span></button>; }
function Support() { const { t } = useLanguage(); return <PagePanel title={t('account_support')} intro={t('account_support_intro')}><div className="grid gap-2 sm:grid-cols-2"><SettingRow icon={HelpCircle} title={t('account_help_center')} value={t('account_open')} /><SettingRow icon={FileText} title={t('account_terms')} value={t('account_open')} /><SettingRow icon={MessageCircle} title={t('account_contact_support')} value={t('account_open')} /></div></PagePanel>; }

function PagePanel({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) { return <section className="rounded-card border border-border bg-bg-card p-3 sm:p-4"><h2 className="text-base font-medium text-text-primary">{title}</h2><p className="mt-1 text-[11px] text-text-muted">{intro}</p><div className="mt-4">{children}</div></section>; }
function PanelTitle({ icon: Icon, title, action, onClick }: { icon: typeof UserRound; title: string; action?: string; onClick?: () => void }) { return <div className="flex items-center justify-between"><h2 className="inline-flex items-center gap-1.5 text-sm font-medium text-text-primary"><Icon size={15} className="text-brand-blue" />{title}</h2>{action && <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-[10px] text-brand-blue">{action}<ChevronRight size={11} /></button>}</div>; }
function Stat({ icon: Icon, value, label }: { icon: typeof CalendarDays; value: string; label: string }) { return <div className="flex items-center gap-2"><Icon size={15} className="text-brand-blue" /><div><p className="text-sm font-medium text-text-primary">{value}</p><p className="text-[9px] text-text-faint">{label}</p></div></div>; }
