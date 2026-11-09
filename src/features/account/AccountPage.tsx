import { useState } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarDays,
  Car,
  ChevronRight,
  HelpCircle,
  Compass,
  CreditCard,
  Edit3,
  FileText,
  Heart,
  Hotel,
  LogOut,
  Map,
  MapPin,
  MessageCircle,
  Plane,
  Plus,
  Settings,
  ShieldCheck,
  Star,
  UserRound,
  WalletCards,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { NOTIFICATIONS } from '../../data/notifications';
import { TRAVEL_PLANS, BLOGS, POPULARS } from '../../data/homeData';
import { TRAVEL_GUIDE_STORIES } from '../../data/travelGuideData';
import { TOP_ATTRACTIONS, POPULAR_HOTELS, POPULAR_RESTAURANTS, POPULAR_BOOK_SHOPS, RENTAL_PAGE_LISTINGS, POPULAR_TRANSPORT, POPULAR_CAFES, POPULAR_MARKETS } from '../../data/cityPageData';
import { NEARBY_LISTINGS } from '../../data/nearbyData';
import { ListingCard } from '../../components/ui/ListingCard';
import { useToggleFavorite } from '../../hooks/useToggleFavorite';

type DashboardView = 'overview' | 'bookings' | 'plans' | 'guides' | 'favorites' | 'reviews' | 'wallet' | 'messages' | 'settings' | 'support';

type DashboardMenuItem = {
  id: DashboardView;
  icon: LucideIcon;
  key: TranslationKey;
};

const menu: DashboardMenuItem[] = [
  { id: 'overview', icon: Compass, key: 'account_overview' },
  { id: 'bookings', icon: CalendarDays, key: 'account_bookings' },
  { id: 'plans', icon: MapPin, key: 'account_plans' },
  { id: 'guides', icon: Map, key: 'account_guides' },
  { id: 'favorites', icon: Heart, key: 'account_favorites' },
  { id: 'reviews', icon: Star, key: 'account_reviews' },
  { id: 'wallet', icon: WalletCards, key: 'account_wallet' },
  { id: 'settings', icon: Settings, key: 'account_settings' },
  { id: 'messages', icon: MessageCircle, key: 'account_messages' },
  { id: 'support', icon: HelpCircle, key: 'account_support' },
];

const allListings = [
  ...TRAVEL_PLANS,
  ...TRAVEL_GUIDE_STORIES,
  ...BLOGS,
  ...POPULARS,
  ...TOP_ATTRACTIONS,
  ...POPULAR_HOTELS,
  ...POPULAR_RESTAURANTS,
  ...POPULAR_BOOK_SHOPS,
  ...RENTAL_PAGE_LISTINGS,
  ...POPULAR_TRANSPORT,
  ...POPULAR_CAFES,
  ...POPULAR_MARKETS,
  ...NEARBY_LISTINGS,
];

export function AccountPage() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<DashboardView>('overview');
  const favorites = useToggleFavorite(allListings);
  const displayName = user?.name?.trim() || 'Min Htet';
  const displayEmail = user?.email || 'minhtet@gmail.com';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  function signOut() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="account-dashboard mx-auto w-full max-w-[1500px] rounded-2xl bg-account-bg p-3 text-text-primary shadow-2xl shadow-black/10 sm:rounded-3xl sm:p-4 lg:p-5">
      <div className="grid gap-4 lg:grid-cols-[228px_minmax(0,1fr)] lg:gap-5">
        <aside className="account-sidebar self-start rounded-2xl border border-account-border bg-account-surface p-3 sm:p-4 lg:sticky lg:top-20">
          <div className="flex items-center gap-3 lg:flex-col lg:gap-2 lg:py-2 lg:text-center">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-account-accent/80 bg-gradient-to-br from-sky-400 to-blue-700 text-base font-bold text-white shadow-lg shadow-sky-900/30 sm:h-16 sm:w-16">
              {initials || 'MH'}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-account-surface bg-account-accent text-white">
                <BadgeCheck size={12} fill="currentColor" strokeWidth={2.5} />
              </span>
            </div>
            <div className="min-w-0 lg:w-full">
              <div className="flex items-center gap-1.5 lg:justify-center">
                <h1 className="truncate text-sm font-semibold text-text-primary sm:text-base">{displayName}</h1>
                <BadgeCheck size={15} className="shrink-0 text-account-accent" fill="currentColor" />
              </div>
              <p className="mt-0.5 truncate text-[11px] text-text-muted">{displayEmail}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium text-amber-300">
                <Star size={11} fill="currentColor" />{t('account_member_label')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setView('settings')}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-account-border px-2.5 py-2 text-[11px] text-text-secondary transition hover:border-account-accent/60 hover:text-account-accent lg:hidden"
            >
              <Edit3 size={13} />{t('account_edit_profile')}
            </button>
          </div>

          <nav aria-label={t('account_navigation')} className="scrollbar-hide mt-4 flex gap-1.5 overflow-x-auto border-t border-account-border pt-3 lg:flex-col lg:overflow-visible lg:border-0 lg:pt-1">
            {menu.map(({ id, icon: Icon, key }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                aria-current={view === id ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium transition sm:text-[13px] lg:w-full ${view === id ? 'bg-account-accent text-white shadow-lg shadow-sky-950/25' : 'text-text-secondary hover:bg-account-elevated hover:text-text-primary'}`}
              >
                <Icon size={16} className="shrink-0" />
                <span>{t(key)}</span>
                {view === id && <ChevronRight size={14} className="ml-auto hidden lg:block" />}
              </button>
            ))}
            <button
              type="button"
              onClick={signOut}
              className="inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 sm:text-[13px] lg:mt-2 lg:w-full lg:border-t lg:border-account-border lg:pt-4"
            >
              <LogOut size={16} />{t('account_logout')}
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setView('settings')}
            className="mt-4 hidden w-full items-center justify-center gap-1.5 rounded-xl border border-account-border px-3 py-2.5 text-xs text-text-secondary transition hover:border-account-accent/60 hover:text-account-accent lg:flex"
          >
            <Edit3 size={13} />{t('account_edit_profile')}
          </button>
        </aside>

        <main className="min-w-0">
          {view === 'overview' && (
            <Overview
              name={displayName}
              favoriteCount={favorites.listings.filter((listing) => listing.isFavorited).length}
              onOpen={setView}
              onNavigate={navigate}
            />
          )}
          {view === 'bookings' && <Bookings />}
          {view === 'plans' && <Plans />}
          {view === 'guides' && <Guides listings={favorites.listings} toggle={favorites.toggle} />}
          {view === 'favorites' && <Favorites listings={favorites.listings} toggle={favorites.toggle} />}
          {view === 'reviews' && <Reviews />}
          {view === 'wallet' && <WalletView onOpenSettings={() => setView('settings')} />}
          {view === 'messages' && <Messages />}
          {view === 'settings' && <SettingsView name={displayName} email={displayEmail} />}
          {view === 'support' && <Support />}
        </main>
      </div>
    </div>
  );
}

function Overview({
  name,
  favoriteCount,
  onOpen,
  onNavigate,
}: {
  name: string;
  favoriteCount: number;
  onOpen: (view: DashboardView) => void;
  onNavigate: NavigateFunction;
}) {
  const { t } = useLanguage();
  const firstName = name.split(/\s+/)[0] || name;

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="mh-page-hero account-welcome-banner relative isolate flex items-end overflow-hidden rounded-2xl border border-account-border p-5 sm:p-7 lg:items-center lg:p-8">
        <img
          src="/images/blog/shwedagon-evening.webp"
          alt={t('account_banner_alt')}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#06172c]/95 via-[#06172c]/75 to-[#06172c]/20" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#06172c]/55 via-transparent to-transparent" />
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-200 backdrop-blur-sm">
            <Compass size={12} />MH TRAVEL · MYANMAR
          </span>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
            {t('account_welcome').replace('{name}', firstName)}
          </h2>
          <p className="mt-2 max-w-xl text-xs leading-5 text-slate-100/90 sm:text-sm sm:leading-6">{t('account_overview_intro')}</p>
          <button
            type="button"
            onClick={() => onNavigate('/travel-plans')}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-account-accent px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-sky-950/25 transition hover:-translate-y-0.5 hover:bg-sky-500 sm:text-sm"
          >
            {t('account_plan_trip_cta')}<ArrowRight size={15} />
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard icon={CalendarDays} value="3" label={t('account_stat_bookings')} tone="blue" onClick={() => onOpen('bookings')} />
        <StatCard icon={MapPin} value="2" label={t('account_stat_plans')} tone="cyan" onClick={() => onOpen('plans')} />
        <StatCard icon={Heart} value={String(favoriteCount)} label={t('account_stat_saved')} tone="rose" onClick={() => onOpen('favorites')} />
        <StatCard icon={Star} value="5" label={t('account_stat_reviews')} tone="gold" onClick={() => onOpen('reviews')} />
      </div>

      <div className="grid gap-4 2xl:grid-cols-[1.2fr_0.8fr]">
        <UpcomingTrip onViewAll={() => onOpen('bookings')} onManage={() => onOpen('bookings')} />
        <QuickActions onNavigate={onNavigate} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <ActivityFeed />
        <DiscoveryCard onExplore={() => onNavigate('/cities')} />
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  tone,
  onClick,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  tone: 'blue' | 'cyan' | 'rose' | 'gold';
  onClick: () => void;
}) {
  const tones = {
    blue: 'bg-blue-500/10 text-blue-300',
    cyan: 'bg-account-accent/10 text-account-accent',
    rose: 'bg-rose-500/10 text-rose-300',
    gold: 'bg-amber-400/10 text-amber-300',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-w-0 items-center gap-3 rounded-2xl border border-account-border bg-account-surface p-3 text-left transition hover:-translate-y-0.5 hover:border-account-accent/60 hover:bg-account-elevated sm:p-4"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${tones[tone]}`}>
        <Icon size={22} strokeWidth={2.2} />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-bold leading-none text-text-primary sm:text-2xl">{value}</span>
        <span className="mt-1 block truncate text-[10px] text-text-muted sm:text-xs">{label}</span>
      </span>
      <ChevronRight size={14} className="ml-auto hidden shrink-0 text-text-faint transition group-hover:translate-x-0.5 group-hover:text-account-accent sm:block" />
    </button>
  );
}

function UpcomingTrip({ onViewAll, onManage }: { onViewAll: () => void; onManage: () => void }) {
  const { t } = useLanguage();
  return (
    <section className="min-w-0 rounded-2xl border border-account-border bg-account-surface p-3.5 sm:p-4">
      <PanelTitle icon={Plane} title={t('account_upcoming_trip')} action={t('account_view_all')} onClick={onViewAll} />
      <div className="mt-3 grid gap-3 rounded-xl border border-account-border/70 bg-account-elevated p-2.5 sm:grid-cols-[148px_minmax(0,1fr)] sm:p-3">
        <div className="relative h-32 overflow-hidden rounded-lg sm:h-full sm:min-h-[145px]">
          <img src="/images/blog/shwedagon-evening.webp" alt={t('account_banner_alt')} className="h-full w-full object-cover" />
          <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-1 text-[9px] font-semibold text-white shadow">{t('account_confirmed')}</span>
        </div>
        <div className="flex min-w-0 flex-col justify-center py-1 sm:py-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-text-primary sm:text-base">{t('account_trip_title')}</h3>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-text-muted sm:text-xs"><MapPin size={12} className="text-account-accent" />{t('account_trip_location')}</p>
            </div>
            <span className="rounded-full border border-account-accent/20 bg-account-accent/10 px-2 py-1 text-[9px] font-medium text-sky-200">{t('account_confirmed')}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-text-secondary sm:text-xs">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-account-accent" />{t('account_trip_dates')}</span>
            <span className="inline-flex items-center gap-1.5"><UserRound size={13} className="text-account-accent" />{t('account_travelers_two')}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={onManage} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-account-accent px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-sky-500 sm:text-xs">{t('account_view_details')}<ArrowRight size={13} /></button>
            <button type="button" onClick={onManage} className="rounded-lg border border-account-accent/50 px-3 py-2 text-[10px] font-medium text-text-primary transition hover:bg-account-accent/10 sm:text-xs">{t('account_manage_booking')}</button>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickActions({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { t } = useLanguage();
  const actions: { icon: LucideIcon; key: TranslationKey; path: string; tone: string }[] = [
    { icon: Plane, key: 'account_book_flight', path: '/ticketing', tone: 'text-sky-300' },
    { icon: Hotel, key: 'account_book_hotel', path: '/cities', tone: 'text-cyan-300' },
    { icon: Car, key: 'account_rent_vehicle', path: '/rentals', tone: 'text-blue-300' },
    { icon: MapPin, key: 'account_explore_cities', path: '/cities', tone: 'text-sky-300' },
  ];
  return (
    <section className="rounded-2xl border border-account-border bg-account-surface p-3.5 sm:p-4">
      <PanelTitle icon={ArrowRight} title={t('account_quick_actions')} />
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {actions.map(({ icon: Icon, key, path, tone }) => (
          <button key={key} type="button" onClick={() => onNavigate(path)} className="group flex min-h-[82px] flex-col items-center justify-center gap-2 rounded-xl border border-account-border bg-account-elevated p-2 text-center transition hover:border-account-accent/60 hover:bg-account-accent/10 sm:min-h-[94px]">
            <Icon size={25} className={`${tone} transition group-hover:-translate-y-0.5`} />
            <span className="text-[10px] font-medium text-text-secondary sm:text-xs">{t(key)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ActivityFeed() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const activity = NOTIFICATIONS.slice(0, 3);
  return (
    <section className="rounded-2xl border border-account-border bg-account-surface p-3.5 sm:p-4">
      <PanelTitle icon={Bell} title={t('account_recent_activity')} action={t('account_view_all')} onClick={() => navigate('/account/notifications')} />
      <div className="mt-3 divide-y divide-account-border/80">
        {activity.map((item) => {
          const Icon = item.href.includes('booking') ? CalendarDays : item.href.includes('hotels') ? Hotel : BookOpen;
          return (
            <div key={item.id} className="flex items-start gap-3 py-3 first:pt-1 last:pb-0">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/5 text-white" style={{ background: `linear-gradient(145deg, ${item.thumbnailFrom}, ${item.thumbnailTo})` }}>
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] leading-5 text-text-secondary sm:text-xs">{item.title}</span>
                <span className="mt-0.5 block text-[10px] text-text-faint">{item.timeAgo}</span>
              </span>
              {!item.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-account-accent" />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DiscoveryCard({ onExplore }: { onExplore: () => void }) {
  const { t } = useLanguage();
  return (
    <section className="relative isolate flex min-h-[235px] flex-col justify-end overflow-hidden rounded-2xl border border-account-border p-5 sm:min-h-[265px] sm:p-6">
      <img src="/images/blog/inle-stilt-houses.webp" alt={t('account_discovery_alt')} className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#031326]/95 via-[#031326]/45 to-[#031326]/5" />
      <div className="max-w-md">
        <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-sky-200">{t('account_discover_eyebrow')}</span>
        <h2 className="mt-1.5 text-xl font-bold leading-tight text-white sm:text-2xl">{t('account_discover_heading')}</h2>
        <p className="mt-1.5 text-xs leading-5 text-slate-100/90">{t('account_discover_intro')}</p>
        <button type="button" onClick={onExplore} className="mt-3 inline-flex items-center gap-2 rounded-full bg-account-accent px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-sky-500">{t('account_discover_button')}<ArrowRight size={14} /></button>
      </div>
    </section>
  );
}

function Bookings() {
  const { t } = useLanguage();
  return <PagePanel title={t('account_bookings')} intro={t('account_bookings_intro')}>
    <div className="space-y-3">
      <BookingRow title={t('account_trip_title')} date={t('account_trip_dates')} status={t('account_confirmed')} image="/images/blog/shwedagon-evening.webp" />
      <BookingRow title="The Rangoon House" date="18 Nov 2026 · 2 guests" status={t('account_completed')} image="/images/blog/ubein-evening.webp" />
    </div>
  </PagePanel>;
}

function BookingRow({ title, date, status, image }: { title: string; date: string; status: string; image: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-account-border bg-account-elevated p-3 sm:flex-row sm:items-center">
      <img src={image} alt="" className="h-28 w-full rounded-lg object-cover sm:h-16 sm:w-24" />
      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-text-primary">{title}</p><p className="mt-1 flex items-center gap-1.5 text-[11px] text-text-muted"><CalendarDays size={13} />{date}</p></div>
      <span className="self-start rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-medium text-emerald-300 sm:self-auto">{status}</span>
    </div>
  );
}

function Plans() {
  const { t } = useLanguage();
  return <PagePanel title={t('account_plans')} intro={t('account_plans_intro')}>
    <div className="rounded-xl border border-account-accent/20 bg-account-accent/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-text-primary">Yangon → Bagan → Inle Lake</p><span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium text-amber-300">{t('account_quotation_pending')}</span></div>
      <p className="mt-2 text-xs leading-5 text-text-muted">{t('account_plan_review_message')}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-text-secondary"><span className="rounded-full bg-account-elevated px-2.5 py-1">7 days</span><span className="rounded-full bg-account-elevated px-2.5 py-1">2 travelers</span><span className="rounded-full bg-account-elevated px-2.5 py-1">Myanmar</span></div>
    </div>
  </PagePanel>;
}

function Guides({ listings, toggle }: { listings: typeof allListings; toggle: (id: string) => void }) {
  const { t } = useLanguage();
  const guideIds = new Set(TRAVEL_GUIDE_STORIES.map((guide) => guide.id));
  const guides = listings.filter((listing) => guideIds.has(listing.id));
  return <PagePanel title={t('account_guides')} intro={t('account_guides_intro')}>
    {guides.length > 0 ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{guides.map((listing) => <ListingCard key={listing.id} listing={listing} onToggleFavorite={toggle} size="md" />)}</div> : <EmptyState text={t('account_guides_empty')} />}
  </PagePanel>;
}

function Favorites({ listings, toggle }: { listings: typeof allListings; toggle: (id: string) => void }) {
  const { t } = useLanguage();
  const saved = listings.filter((listing) => listing.isFavorited);
  return <PagePanel title={t('account_favorites')} intro={t('account_favorites_intro')}>
    {saved.length > 0 ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{saved.map((listing) => <ListingCard key={listing.id} listing={listing} onToggleFavorite={toggle} size="md" />)}</div> : <EmptyState text={t('account_no_favorites')} />}
  </PagePanel>;
}

function Reviews() {
  const { t } = useLanguage();
  return <PagePanel title={t('account_reviews')} intro={t('account_reviews_intro')}>
    <div className="space-y-3"><ReviewRow title={t('account_review_one_title')} text={t('account_review_one_body')} /><ReviewRow title={t('account_review_two_title')} text={t('account_review_two_body')} /></div>
  </PagePanel>;
}

function ReviewRow({ title, text }: { title: string; text: string }) {
  return <article className="rounded-xl border border-account-border bg-account-elevated p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-text-primary">{title}</p><span className="flex items-center gap-0.5 text-amber-300" aria-label="5 stars">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={13} fill="currentColor" />)}</span></div><p className="mt-2 text-xs leading-5 text-text-muted">{text}</p></article>;
}

function WalletView({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { t } = useLanguage();
  return <PagePanel title={t('account_wallet')} intro={t('account_wallet_intro')}>
    <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
      <div className="rounded-xl border border-account-accent/20 bg-gradient-to-br from-sky-600/25 to-blue-900/20 p-4 sm:p-5"><div className="flex items-center justify-between"><span className="text-xs text-text-muted">{t('account_wallet_balance')}</span><WalletCards size={19} className="text-account-accent" /></div><p className="mt-3 text-2xl font-bold text-text-primary">$ 125.00</p><p className="mt-1 text-[10px] text-text-faint">{t('account_wallet_currency')}</p></div>
      <button type="button" onClick={onOpenSettings} className="flex min-h-28 items-center justify-between rounded-xl border border-dashed border-account-border bg-account-elevated p-4 text-left transition hover:border-account-accent/60"><span><span className="flex items-center gap-2 text-sm font-medium text-text-primary"><CreditCard size={16} className="text-account-accent" />{t('account_wallet_payment_methods')}</span><span className="mt-1 block text-[11px] text-text-muted">{t('account_payment_methods')}</span></span><Plus size={18} className="text-account-accent" /></button>
    </div>
  </PagePanel>;
}

function Messages() {
  const { t } = useLanguage();
  return <PagePanel title={t('account_messages')} intro={t('account_messages_intro')}>
    <div className="flex gap-3 rounded-xl border border-account-border bg-account-elevated p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-account-accent/10 text-account-accent"><MessageCircle size={18} /></span><div><p className="text-sm font-semibold text-text-primary">MH Travel Support</p><p className="mt-1 text-xs leading-5 text-text-muted">{t('account_message_sample')}</p></div></div>
  </PagePanel>;
}

function SettingsView({ name, email }: { name: string; email: string }) {
  const { t } = useLanguage();
  return <PagePanel title={t('account_settings')} intro={t('account_settings_intro')}>
    <div className="space-y-2.5"><SettingRow icon={UserRound} title={t('account_profile_settings')} value={name} /><SettingRow icon={ShieldCheck} title={t('account_privacy_settings')} value={t('account_private')} /><SettingRow icon={CreditCard} title={t('account_payment_settings')} value={t('account_payment_methods')} /><SettingRow icon={FileText} title={t('account_email_address')} value={email} /></div>
  </PagePanel>;
}

function SettingRow({ icon: Icon, title, value }: { icon: LucideIcon; title: string; value: string }) {
  return <button type="button" className="flex w-full items-center justify-between gap-3 rounded-xl border border-account-border bg-account-elevated p-3.5 text-left transition hover:border-account-accent/40"><span className="flex items-center gap-2.5 text-xs font-medium text-text-primary"><Icon size={15} className="shrink-0 text-account-accent" />{title}</span><span className="flex items-center gap-1 text-right text-[10px] text-text-muted">{value}<ChevronRight size={13} className="shrink-0" /></span></button>;
}

function Support() {
  const { t } = useLanguage();
  return <PagePanel title={t('account_support')} intro={t('account_support_intro')}>
    <div className="grid gap-2.5 sm:grid-cols-2"><SettingRow icon={HelpCircle} title={t('account_help_center')} value={t('account_open')} /><SettingRow icon={FileText} title={t('account_terms')} value={t('account_open')} /><SettingRow icon={MessageCircle} title={t('account_contact_support')} value={t('account_open')} /></div>
  </PagePanel>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-account-border bg-account-elevated/50 p-10 text-center text-xs text-text-muted">{text}</div>;
}

function PagePanel({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-account-border bg-account-surface p-4 sm:p-5 lg:p-6"><h2 className="text-lg font-semibold text-text-primary sm:text-xl">{title}</h2><p className="mt-1 text-xs leading-5 text-text-muted">{intro}</p><div className="mt-5">{children}</div></section>;
}

function PanelTitle({ icon: Icon, title, action, onClick }: { icon: LucideIcon; title: string; action?: string; onClick?: () => void }) {
  return <div className="flex items-center justify-between gap-3"><h2 className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-text-primary sm:text-base"><Icon size={16} className="shrink-0 text-account-accent" />{title}</h2>{action && <button type="button" onClick={onClick} className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-account-accent transition hover:text-sky-300 sm:text-xs">{action}<ChevronRight size={13} /></button>}</div>;
}
