import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  FileText,
  MapPin,
  Megaphone,
  Plus,
  Settings,
  Star,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import type { TranslationKey } from '../../lib/translations';
import {
  OVERVIEW_PERIODS,
  canSeeOverview,
  loadOverview,
  needsAttention,
  type AttentionKey,
  type OverviewData,
  type OverviewPeriod,
} from '../../lib/adminOverview';
import { adminReviews, listingReports, reviewQueue } from '../../lib/adminReviews';
import { adminBookings } from '../../lib/adminBookings';
import { supportThreads, threadSummary } from '../../lib/adminSupport';
import { readListings } from '../../lib/listingStore';
import { adStoreRows } from '../../lib/adminAdsBridge';
import { ownerApplicationsRows, ownerSubscriptionEndingSoon } from '../../lib/adminOwnersBridge';
import { translationReviewCount } from '../../lib/adminTranslationsBridge';
import { guideEarningsUnpriced } from '../../lib/adminGuideEarningsBridge';
import { failedJobCount, payoutBatchDue } from '../../lib/adminOpsBridge';
import type { WorkspaceSection } from '../../lib/adminWorkspace';
import { canOpenSection } from '../../lib/adminWorkspace';
import { useCurrency } from '../../lib/currency';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  Panel,
  PanelTitle,
  SectionHeader,
  SummaryCard,
} from './shared/SectionShell';
import { NotAllowedState } from './shared/DashboardPieces';

/**
 * Plan §3A.5, ticket O-61. The Overview answers three questions: how the
 * platform is doing, what needs me now, and where do I go next. Every figure
 * comes from `admin_get_overview` or from the browser rows while the flag is
 * off — §3A.2 rule 4 forbids a seeded number, so the seeded cards of the old
 * screen are gone and an empty database renders zeros and empty states.
 */

const ATTENTION_LABEL_KEYS: Record<AttentionKey, TranslationKey> = {
  owner_applications: 'ov_attention_owner_applications',
  rental_requests: 'ov_attention_rental_requests',
  ad_creatives: 'ov_attention_ad_creatives',
  reviews: 'ov_attention_reviews',
  listing_reports: 'ov_attention_listing_reports',
  support: 'ov_attention_support',
  jobs: 'ov_attention_jobs',
  subscriptions: 'ov_attention_subscriptions',
  payouts: 'ov_attention_payouts',
  guide_earnings: 'ov_attention_guide_earnings',
  translations: 'ov_attention_translations',
  listings: 'ov_attention_listings',
};

const PERIOD_KEYS: Record<OverviewPeriod, TranslationKey> = {
  7: 'sa_period_7',
  30: 'sa_period_30',
  90: 'sa_period_90',
  365: 'sa_period_year',
};

function percent(change: number): string {
  const value = Math.round(change * 1000) / 10;
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}%`;
}

export function OverviewPanel({ onOpenSection }: { onOpenSection: (section: WorkspaceSection) => void }) {
  const { t } = useLanguage();
  const { adminRole } = useAuth();
  const { formatPrice } = useCurrency();
  const [period, setPeriod] = useState<OverviewPeriod>(30);
  const [data, setData] = useState<OverviewData | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  const allowed = canSeeOverview(adminRole);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    setStatus('loading');
    void loadOverview(period).then((result) => {
      if (!active) return;
      if (!result.ok) {
        setStatus('error');
        return;
      }
      setData(result.data);
      setStatus('ready');
    });
    return () => {
      active = false;
    };
  }, [allowed, period, reloadToken]);

  /**
   * The counts behind Needs attention, read from the same stores their sections
   * read, so a count and the list behind its link cannot disagree (§3A.16
   * criterion 4).
   */
  const attention = useMemo(() => {
    if (!allowed) return [];
    // A retry re-reads the stores; the token is what makes this memo run again.
    void reloadToken;
    const canOpen = (section: string) => canOpenSection(adminRole, section as WorkspaceSection);
    return needsAttention(
      {
        ownerApplications: ownerApplicationsRows().filter((row) => row.status === 'new').length,
        rentalRequests: adminBookings.read().filter((row) => row.category === 'rental' && row.status === 'requested').length,
        adCreatives: adStoreRows().pendingCreatives,
        reviews: reviewQueue(adminReviews.read(), 'reported').length,
        listingReports: listingReports(adminReviews.read()).filter((row) => row.reports >= 3).length,
        support: threadSummary(supportThreads.read()).unassigned,
        failedJobs: failedJobCount(),
        subscriptionsEnding: ownerSubscriptionEndingSoon().length,
        payoutsDue: payoutBatchDue(),
        guideEarningsUnpriced: guideEarningsUnpriced(),
        translationsToReview: translationReviewCount(),
        listingsPending: readListings().filter((row) => row.status === 'pending').length,
      },
      canOpen,
    );
  }, [allowed, adminRole, reloadToken]);

  if (!allowed) return <NotAllowedState />;

  if (status === 'loading' && !data) return <LoadingState />;
  if (status === 'error' && !data) return <ErrorState onRetry={() => setReloadToken((token) => token + 1)} />;
  if (!data) return <EmptyState />;

  const money = (usd: number) => formatPrice(usd);

  const kpiCards = [
    { key: 'users' as const, labelKey: 'ov_kpi_users' as TranslationKey, icon: Users, tone: 'blue' as const, value: String(data.kpis.users.value), detail: data.kpis.users.total !== undefined ? `${t('ov_total')} ${data.kpis.users.total}` : undefined },
    { key: 'bookings' as const, labelKey: 'ov_kpi_bookings' as TranslationKey, icon: CalendarDays, tone: 'green' as const, value: String(data.kpis.bookings.value) },
    { key: 'plans' as const, labelKey: 'ov_kpi_plans' as TranslationKey, icon: WalletCards, tone: 'purple' as const, value: String(data.kpis.plan_requests.value) },
    { key: 'revenue' as const, labelKey: 'ov_kpi_revenue' as TranslationKey, icon: CircleDollarSign, tone: 'amber' as const, value: money(data.kpis.revenue.value), detail: `${t('ov_gross_through')} ${money(data.gross_through_usd)}` },
    { key: 'reviews' as const, labelKey: 'ov_kpi_reviews' as TranslationKey, icon: Star, tone: 'cyan' as const, value: String(data.kpis.reviews.value), detail: `${t('ov_avg_rating')} ${data.average_rating}` },
  ];

  const quickActions: { id: WorkspaceSection; key: TranslationKey; icon: typeof Plus }[] = [
    { id: 'cities', key: 'sa_action_add_city', icon: MapPin },
    { id: 'plans', key: 'sa_action_create_plan', icon: Plus },
    { id: 'blogs', key: 'sa_action_add_blog', icon: FileText },
    { id: 'ads', key: 'sa_action_manage_ads', icon: Megaphone },
    { id: 'owners', key: 'sa_action_create_owner', icon: Users },
    { id: 'admins', key: 'sa_action_create_admin', icon: UserPlus },
    { id: 'users', key: 'sa_action_manage_users', icon: Users },
    { id: 'reports', key: 'sa_action_view_reports', icon: TrendingUp },
    { id: 'settings', key: 'sa_action_system_settings', icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-[1200px] space-y-2">
      <SectionHeader kickerKey="ov_kicker" titleKey="sa_dashboard_title" introKey="sa_dashboard_intro">
        <label className="flex items-center gap-2 rounded-lg border border-white/25 bg-[#09203c]/85 px-3 py-2 text-xs font-semibold text-white">
          <CalendarDays size={15} />
          <select
            value={period}
            onChange={(event) => setPeriod(Number(event.target.value) as OverviewPeriod)}
            aria-label={t('sa_period_30')}
            className="bg-transparent text-white outline-none"
          >
            {OVERVIEW_PERIODS.map((value) => (
              <option key={value} value={value} className="text-black">
                {t(PERIOD_KEYS[value])}
              </option>
            ))}
          </select>
        </label>
      </SectionHeader>

      <div className="grid grid-cols-2 gap-2 xl:grid-cols-5">
        {kpiCards.map((card) => {
          const kpi = card.key === 'plans' ? data.kpis.plan_requests : data.kpis[card.key];
          return (
            <div key={card.key} className="relative">
              <SummaryCard icon={card.icon} label={t(card.labelKey)} value={card.value} detail={card.detail} tone={card.tone} />
              <p className="absolute bottom-2 right-2 text-[10px] font-bold text-lime-300" title={t('ov_vs_previous')}>
                {percent(kpi.change)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-2 xl:grid-cols-[1.55fr_0.9fr_0.82fr]">
        <AnalyticsPanel data={data} />
        <DistributionPanel data={data} />
        <Panel>
          <PanelTitle icon={Zap} title={t('ov_quick_actions')} />
          <div className="grid grid-cols-2 gap-1.5 p-2 sm:grid-cols-3 xl:grid-cols-2">
            {quickActions
              .filter((action) => canOpenSection(adminRole, action.id))
              .map(({ id, key, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onOpenSection(id)}
                  className="flex min-h-[44px] flex-col items-center justify-center gap-2 rounded-xl border border-[#244668] bg-[#102c51] p-1.5 text-center text-[10px] font-semibold text-slate-200 transition hover:border-cyan-300 hover:bg-[#174472]"
                >
                  <Icon size={22} className="text-[#1da7ff]" />
                  {t(key)}
                </button>
              ))}
          </div>
        </Panel>
      </div>

      <Panel>
        <PanelTitle icon={Activity} title={t('ov_needs_attention')} />
        {attention.length === 0 ? (
          <p className="px-3 py-4 text-xs text-slate-400">{t('ov_needs_attention_empty')}</p>
        ) : (
          <ul className="divide-y divide-[#1d3a5c]">
            {attention.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onOpenSection(item.section as WorkspaceSection)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] text-slate-200 hover:bg-white/5"
                >
                  <span>{t(ATTENTION_LABEL_KEYS[item.key])}</span>
                  <span className="flex items-center gap-2">
                    <strong className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200">{item.count}</strong>
                    <ChevronRight size={13} className="text-slate-400" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-2 xl:grid-cols-[1.35fr_0.92fr_0.92fr]">
        <RecentBookings data={data} onOpenSection={onOpenSection} />
        <PopularCities data={data} onOpenSection={onOpenSection} />
        <RecentUsers data={data} onOpenSection={onOpenSection} />
      </div>
    </div>
  );
}

function AnalyticsPanel({ data }: { data: OverviewData }) {
  const { t } = useLanguage();
  const hasData = data.series.some((point) => point.users + point.bookings + point.revenue > 0);
  const max = Math.max(1, ...data.series.map((point) => point.bookings));
  const points = data.series
    .map((point, index) => {
      const x = data.series.length <= 1 ? 0 : (index / (data.series.length - 1)) * 100;
      const y = 100 - (point.bookings / max) * 100;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <Panel>
      <PanelTitle icon={Activity} title={t('sa_platform_analytics')} />
      <div className="p-3">
        {!hasData ? (
          <p className="rounded-lg border border-[#244668] bg-[#081a31] px-3 py-8 text-center text-[11px] text-slate-400">{t('ov_no_data')}</p>
        ) : (
          <>
            <div className="mb-2 flex flex-wrap gap-3 text-[10px] text-slate-300">
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#2ca7ff]" />
                {t('ov_series_bookings')}
              </span>
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#64dc27]" />
                {t('ov_series_users')}
              </span>
              <span>
                <i className="mr-1 inline-block h-2 w-2 rounded-full bg-[#ffae19]" />
                {t('ov_series_revenue')}
              </span>
            </div>
            <div className="relative h-[110px] overflow-hidden rounded-lg border border-[#244668] bg-[#081a31]">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
                <polyline points={points} fill="none" stroke="#2ca7ff" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
              </svg>
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-400">
              <span>{data.series[0]?.day}</span>
              <span>{data.series[data.series.length - 1]?.day}</span>
            </div>
          </>
        )}
      </div>
    </Panel>
  );
}

function DistributionPanel({ data }: { data: OverviewData }) {
  const { t } = useLanguage();
  const total = data.distribution.reduce((sum, entry) => sum + entry.count, 0);
  return (
    <Panel>
      <PanelTitle icon={Zap} title={t('ov_distribution')} />
      <div className="p-3">
        {total === 0 ? (
          <p className="rounded-lg border border-[#244668] bg-[#081a31] px-3 py-8 text-center text-[11px] text-slate-400">{t('ov_no_data')}</p>
        ) : (
          <div className="space-y-1.5 text-[10px] text-slate-200">
            {data.distribution.map((entry) => (
              <div key={entry.category} className="flex items-center justify-between gap-2">
                <span className="min-w-[70px] capitalize">{entry.category}</span>
                <strong>{Math.round((entry.count / total) * 1000) / 10}%</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function RecentBookings({ data, onOpenSection }: { data: OverviewData; onOpenSection: (section: WorkspaceSection) => void }) {
  const { t } = useLanguage();
  return (
    <Panel>
      <PanelTitle icon={CalendarDays} title={t('ov_recent_bookings')} action={t('ov_view_all')} onAction={() => onOpenSection('bookings')} />
      {data.recent_bookings.length === 0 ? (
        <p className="px-3 py-6 text-center text-[11px] text-slate-400">{t('sa_empty_title')}</p>
      ) : (
        <ul className="divide-y divide-[#1d3a5c]">
          {data.recent_bookings.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[11px]">
              <span className="min-w-0">
                <span className="block truncate font-semibold text-white">{row.traveler_name}</span>
                <span className="block truncate text-[10px] text-slate-400">{row.listing_name}</span>
              </span>
              <span className="whitespace-nowrap text-[10px] text-slate-400">{row.start_date}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function PopularCities({ data, onOpenSection }: { data: OverviewData; onOpenSection: (section: WorkspaceSection) => void }) {
  const { t } = useLanguage();
  return (
    <Panel>
      <PanelTitle icon={MapPin} title={t('ov_popular_cities')} action={t('ov_view_all')} onAction={() => onOpenSection('cities')} />
      {data.popular_cities.length === 0 ? (
        <p className="px-3 py-6 text-center text-[11px] text-slate-400">{t('sa_empty_title')}</p>
      ) : (
        <ol className="divide-y divide-[#1d3a5c]">
          {data.popular_cities.map((city, index) => (
            <li key={city.city_id} className="flex items-center gap-2 px-3 py-2 text-[11px]">
              <span className="w-4 text-center font-bold text-slate-400">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate font-semibold text-white">{city.name_en}</span>
              <span className="whitespace-nowrap text-[10px] text-cyan-300">{city.views}</span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

function RecentUsers({ data, onOpenSection }: { data: OverviewData; onOpenSection: (section: WorkspaceSection) => void }) {
  const { t } = useLanguage();
  return (
    <Panel>
      <PanelTitle icon={Users} title={t('ov_recent_users')} action={t('ov_view_all')} onAction={() => onOpenSection('users')} />
      {data.recent_users.length === 0 ? (
        <p className="px-3 py-6 text-center text-[11px] text-slate-400">{t('sa_empty_title')}</p>
      ) : (
        <ul className="divide-y divide-[#1d3a5c]">
          {data.recent_users.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2 px-3 py-2 text-[11px]">
              <span className="min-w-0 truncate font-semibold text-white">{row.name}</span>
              <span className="whitespace-nowrap text-[10px] text-slate-400">{row.joined_at}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
