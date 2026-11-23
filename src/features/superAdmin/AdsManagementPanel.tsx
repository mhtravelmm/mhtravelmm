import { useMemo, useState, type FormEvent } from 'react';
import {
  AlertTriangle,
  Ban,
  Building2,
  Check,
  ChevronRight,
  CircleDollarSign,
  ImagePlus,
  Layers,
  Megaphone,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { fill } from '../../lib/fill';
import { useAuditRecorder } from '../../lib/adminAudit';
import { pushFeedNotice } from '../../lib/adminNotices';
import {
  AD_PAGES,
  pageLabelKey,
  placementByKey,
  placementsForPage,
  type AdPlacement,
} from '../../lib/adPlacements';
import { useAuth } from '../../lib/auth';
import { canManageAds, canReadAdReports } from '../../lib/contentAdminAccess';
import {
  campaignProblem,
  canMove,
  creativeProblem,
  filterCampaigns,
  isSafeClickUrl,
  type AdCampaign,
  type AdCreativeRow,
  type CampaignFilter,
  type CampaignStatus,
  type CreativeApproval,
} from '../../lib/adCampaigns';
import {
  DEFAULT_AD_SETTINGS,
  setPlacementActive,
  setPlacementFallback,
  serveAdNow,
  useAdCampaigns,
  useAdCreatives,
  useAdPlacements,
  useAdEvents,
  useAdSettings,
  useAdStats,
  useAdvertisers,
  type AdSettings,
  type Advertiser,
} from '../../lib/adStore';
import {
  clickThroughRate,
  fillRate,
  filledPlacementKeys,
  totals,
  type AdStatsRow,
} from '../../lib/adStats';
import { formatScheduleLabel, myanmarWallClockToUtc, utcToMyanmarWallClock } from '../../lib/scheduleRules';
import { myanmarToday } from '../../lib/myanmarTime';

/**
 * Plan §16A.7: the Adsboard is seven sections — Overview, Pages and
 * placements, Campaigns, Creatives and approvals, Advertisers, Reports and
 * Settings. It is the only place a campaign is built, submitted, approved,
 * paused or reported on, so the pages never carry ad state of their own.
 */

type Tab = 'overview' | 'placements' | 'campaigns' | 'creatives' | 'advertisers' | 'reports' | 'settings';

const INPUT = 'w-full rounded-md border border-[#2b527d] bg-[#081a31] px-2 py-1.5 text-[11px] text-white outline-none focus:border-cyan-300';

const TABS: { id: Tab; labelKey: TranslationKey; icon: typeof Megaphone }[] = [
  { id: 'overview', labelKey: 'ad_tab_overview', icon: TrendingUp },
  { id: 'placements', labelKey: 'ad_tab_placements', icon: Layers },
  { id: 'campaigns', labelKey: 'ad_tab_campaigns', icon: Megaphone },
  { id: 'creatives', labelKey: 'ad_tab_creatives', icon: ImagePlus },
  { id: 'advertisers', labelKey: 'ad_tab_advertisers', icon: Building2 },
  { id: 'reports', labelKey: 'ad_tab_reports', icon: CircleDollarSign },
  { id: 'settings', labelKey: 'ad_tab_settings', icon: Settings },
];

const STATUS_KEYS: Record<CampaignStatus, TranslationKey> = {
  Draft: 'ad_status_draft',
  Pending: 'ad_status_pending',
  Approved: 'ad_status_approved',
  Live: 'ad_status_live',
  Paused: 'ad_status_paused',
  Ended: 'ad_status_ended',
  Rejected: 'ad_status_rejected',
};

const APPROVAL_KEYS: Record<CreativeApproval, TranslationKey> = {
  draft: 'ad_approval_draft',
  pending: 'ad_approval_pending',
  approved: 'ad_approval_approved',
  rejected: 'ad_approval_rejected',
};

const STATUS_TONES: Record<CampaignStatus, string> = {
  Draft: 'bg-slate-500/20 text-slate-300',
  Pending: 'bg-amber-500/20 text-amber-200',
  Approved: 'bg-sky-500/20 text-sky-200',
  Live: 'bg-green-500/20 text-green-300',
  Paused: 'bg-orange-500/20 text-orange-200',
  Ended: 'bg-slate-600/30 text-slate-400',
  Rejected: 'bg-red-500/20 text-red-200',
};

type CampaignDraft = {
  id: string;
  name: string;
  advertiser: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  priority: string;
  weight: string;
  agreedFeeMmk: string;
  invoiced: boolean;
  paid: boolean;
  placementKeys: string[];
};

function emptyDraft(): CampaignDraft {
  const today = myanmarToday();
  return {
    id: '',
    name: '',
    advertiser: '',
    startDate: today,
    startTime: '09:00',
    endDate: today,
    endTime: '18:00',
    priority: '10',
    weight: '1',
    agreedFeeMmk: '0',
    invoiced: false,
    paid: false,
    placementKeys: [],
  };
}

function draftFromCampaign(campaign: AdCampaign): CampaignDraft {
  const start = utcToMyanmarWallClock(campaign.startAt);
  const end = utcToMyanmarWallClock(campaign.endAt);
  return {
    id: campaign.id,
    name: campaign.name,
    advertiser: campaign.advertiser,
    startDate: start?.date ?? myanmarToday(),
    startTime: start?.time ?? '09:00',
    endDate: end?.date ?? myanmarToday(),
    endTime: end?.time ?? '18:00',
    priority: String(campaign.priority),
    weight: String(campaign.weight),
    agreedFeeMmk: String(campaign.agreedFeeMmk),
    invoiced: campaign.invoiced,
    paid: campaign.paid,
    placementKeys: [...campaign.placementKeys],
  };
}

type CreativeDraft = {
  id: string;
  campaignId: string;
  type: 'image' | 'video';
  mediaUrl: string;
  clickUrl: string;
  altMm: string;
  altEn: string;
};

function emptyCreative(campaignId: string): CreativeDraft {
  return { id: '', campaignId, type: 'image', mediaUrl: '', clickUrl: '', altMm: '', altEn: '' };
}

export function AdsManagementPanel() {
  const { t, language } = useLanguage();
  const { adminRole } = useAuth();
  const audit = useAuditRecorder();
  // §16A.9: Payment Admin reads the reports; only Super Admin and Ads Admin
  // get the write sections, so a read-only viewer sees one tab.
  const canWrite = canManageAds(adminRole);
  const canRead = canReadAdReports(adminRole);
  const tabs = canWrite ? TABS : TABS.filter((item) => item.id === 'reports');
  const [placements, savePlacements] = useAdPlacements();
  const [campaigns, saveCampaigns] = useAdCampaigns();
  const [creatives, saveCreatives] = useAdCreatives();
  const [settings, saveSettings] = useAdSettings();
  const [advertisers, saveAdvertisers] = useAdvertisers();

  const [tab, setTab] = useState<Tab>(canWrite ? 'overview' : 'reports');
  const [selectedPage, setSelectedPage] = useState<string>(AD_PAGES[0]);
  const [campaignDraft, setCampaignDraft] = useState<CampaignDraft | null>(null);
  const [creativeDraft, setCreativeDraft] = useState<CreativeDraft | null>(null);
  const [problem, setProblem] = useState<TranslationKey | null>(null);
  const [notice, setNotice] = useState('');
  const [rejectingId, setRejectingId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rangeDays, setRangeDays] = useState<'7' | '30' | 'all'>('7');
  const [advertiserId, setAdvertiserId] = useState('');
  // §16A.7 Campaigns: filter by status, advertiser, placement and date.
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilter>({ status: '', advertiser: '', placement: '', day: '' });

  // The stats and event rows are store-backed, so the report follows the
  // roll-up job instead of re-reading on every tab switch.
  const [stats] = useAdStats();
  const [events] = useAdEvents();

  const now = useMemo(() => new Date(), []);
  const liveCampaigns = campaigns.filter((campaign) => campaign.status === 'Live');
  const pendingCreatives = creatives.filter((creative) => creative.approval === 'pending');
  const endingSoon = campaigns.filter((campaign) => {
    if (campaign.status !== 'Live' && campaign.status !== 'Approved') return false;
    const end = new Date(campaign.endAt).getTime();
    return end > now.getTime() && end <= now.getTime() + 7 * 24 * 60 * 60 * 1000;
  });

  const rangeStats = useMemo(() => {
    if (rangeDays === 'all') return stats;
    const cutoff = new Date(now.getTime() - Number(rangeDays) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return stats.filter((row) => row.day >= cutoff);
  }, [stats, rangeDays, now]);

  const visibleCampaigns = filterCampaigns(campaigns, campaignFilter);

  const filledToday = filledPlacementKeys(stats, myanmarToday());

  const periodTotals = totals(rangeStats);
  const livePlacements = placements.filter((placement) => placement.active && serveAdNow(placement.key, now)).length;

  function record(action: 'created' | 'updated' | 'published' | 'approved' | 'deleted', objectId: string, summary: string, objectType: 'ad_campaign' | 'ad_creative' = 'ad_campaign') {
    audit({ action, objectType, objectId, summary, source: 'ads' });
  }

  function togglePlacement(placement: AdPlacement) {
    savePlacements((current) => setPlacementActive(current, placement.key, !placement.active));
    record('updated', placement.key, `${t(pageLabelKey(placement.page))} · ${t(placement.labelKey)} · ${placement.active ? t('ad_placement_off') : t('ad_placement_on')}`);
  }

  function toggleFallback(placement: AdPlacement) {
    savePlacements((current) => setPlacementFallback(current, placement.key, !placement.fallbackAllowed));
    record('updated', placement.key, `${t(placement.labelKey)} · ${!placement.fallbackAllowed ? 'fallback on' : 'fallback off'}`);
  }

  function openCampaign(campaign?: AdCampaign) {
    setCampaignDraft(campaign ? draftFromCampaign(campaign) : emptyDraft());
    setCreativeDraft(null);
    setProblem(null);
    setNotice('');
  }

  function saveCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!campaignDraft) return;
    const startAt = myanmarWallClockToUtc(campaignDraft.startDate, campaignDraft.startTime);
    const endAt = myanmarWallClockToUtc(campaignDraft.endDate, campaignDraft.endTime);
    if (!startAt || !endAt) {
      setProblem('ad_problem_window');
      return;
    }
    const existing = campaigns.find((campaign) => campaign.id === campaignDraft.id);
    const next: AdCampaign = {
      id: campaignDraft.id || `camp-${Date.now()}`,
      name: campaignDraft.name.trim(),
      advertiser: campaignDraft.advertiser.trim(),
      status: existing?.status ?? 'Draft',
      startAt,
      endAt,
      priority: Math.max(0, Number(campaignDraft.priority) || 0),
      weight: Math.max(1, Number(campaignDraft.weight) || 1),
      agreedFeeMmk: Math.max(0, Number(campaignDraft.agreedFeeMmk) || 0),
      invoiced: campaignDraft.invoiced,
      paid: campaignDraft.paid,
      placementKeys: campaignDraft.placementKeys,
      createdBy: existing?.createdBy ?? '',
      approvedBy: existing?.approvedBy ?? '',
      approvedAt: existing?.approvedAt ?? null,
      updatedAt: new Date().toISOString(),
    };
    const ownCreatives = creatives.filter((creative) => creative.campaignId === next.id);
    const issue = campaignProblem(next, ownCreatives, placements, {
      blockedDomains: settings.blockedDomains,
      limits: settings,
    });
    if (issue) {
      setProblem(issue as TranslationKey);
      return;
    }
    saveCampaigns((current) => (existing ? current.map((row) => (row.id === next.id ? next : row)) : [next, ...current]));
    record(existing ? 'updated' : 'created', next.id, `${next.name} · ${next.advertiser}`);
    setCampaignDraft(null);
    setProblem(null);
    setNotice(t('ad_save_done'));
  }

  function moveCampaign(campaign: AdCampaign, to: CampaignStatus) {
    if (!canMove(campaign.status, to)) return;
    const at = new Date().toISOString();
    const next: AdCampaign = {
      ...campaign,
      status: to,
      updatedAt: at,
      approvedBy: to === 'Approved' ? 'Super Admin' : campaign.approvedBy,
      approvedAt: to === 'Approved' ? at : campaign.approvedAt,
    };
    saveCampaigns((current) => current.map((row) => (row.id === next.id ? next : row)));
    record(to === 'Approved' ? 'approved' : to === 'Live' ? 'published' : 'updated', next.id, `${next.name} · ${t(STATUS_KEYS[to])}`);
    if (to === 'Pending') {
      pushFeedNotice('ad_pending_approval', {
        title: t('ad_feed_pending_title'),
        message: `${campaign.name} · ${campaign.advertiser}`,
        href: '/super-admin',
      });
    }
  }

  function deleteCampaign(campaign: AdCampaign) {
    if (!window.confirm(t('ad_confirm_delete'))) return;
    saveCampaigns((current) => current.filter((row) => row.id !== campaign.id));
    saveCreatives((current) => current.filter((row) => row.campaignId !== campaign.id));
    record('deleted', campaign.id, `${campaign.name} · ${campaign.advertiser}`);
  }

  function saveCreative(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!creativeDraft) return;
    const issue = creativeProblem(creativeDraft, settings.blockedDomains, settings);
    if (issue) {
      setProblem(issue as TranslationKey);
      return;
    }
    const existing = creatives.find((row) => row.id === creativeDraft.id);
    const row: AdCreativeRow = {
      id: creativeDraft.id || `cr-${Date.now()}`,
      campaignId: creativeDraft.campaignId,
      type: creativeDraft.type,
      mediaUrl: creativeDraft.mediaUrl.trim(),
      clickUrl: creativeDraft.clickUrl.trim(),
      altMm: creativeDraft.altMm.trim(),
      altEn: creativeDraft.altEn.trim(),
      approval: existing?.approval ?? 'pending',
      rejectedReason: existing?.rejectedReason ?? '',
      bytes: existing?.bytes ?? 0,
    };
    saveCreatives((current) => (existing ? current.map((item) => (item.id === row.id ? row : item)) : [row, ...current]));
    record('updated', row.id, `${row.type} · ${row.clickUrl}`, 'ad_creative');
    setCreativeDraft(null);
    setProblem(null);
    setNotice(t('ad_save_done'));
  }

  function reviewCreative(creative: AdCreativeRow, approval: CreativeApproval, reason = '') {
    const row: AdCreativeRow = { ...creative, approval, rejectedReason: approval === 'rejected' ? reason : '' };
    saveCreatives((current) => current.map((item) => (item.id === row.id ? row : item)));
    record(approval === 'approved' ? 'approved' : 'updated', row.id, `${row.type} · ${t(APPROVAL_KEYS[approval])}`, 'ad_creative');
    setRejectingId('');
    setRejectReason('');
  }

  /**
   * §16A.7 Advertisers: a campaign names its advertiser by string, so saving a
   * renamed advertiser also renames the campaigns that carry the old name —
   * otherwise the Adsboard would show two spellings of one company.
   */
  function saveAdvertiser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const existing = advertisers.find((row) => row.id === advertiserId);
    if (!existing) return;
    const name = existing.name.trim();
    if (!name) {
      setProblem('ad_problem_name');
      return;
    }
    saveAdvertisers((current) => current.map((row) => (row.id === existing.id ? { ...existing, name } : row)));
    const previous = campaigns.find((campaign) => campaign.advertiser === existing.name);
    if (previous && previous.advertiser !== name) {
      saveCampaigns((current) => current.map((campaign) => (campaign.advertiser === existing.name ? { ...campaign, advertiser: name } : campaign)));
    }
    record('updated', existing.id, `${name} · ${existing.contactEmail || 'no email'}`);
    setProblem(null);
    setNotice(t('ad_save_done'));
  }

  function saveSettingsForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    record('updated', 'ad_settings', `${settings.adsenseClient || 'no client'} · ${settings.imageMaxKb} KB`);
    setNotice(t('ad_save_done'));
  }

  function exportCsv() {
    const header = ['day', 'placement', 'campaign', 'impressions', 'clicks'];
    const rows = rangeStats.map((row) => [row.day, row.placementKey, row.campaignId, String(row.impressions), String(row.clicks)]);
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ad-report-${myanmarToday()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-3">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">{t('sa_ads_kicker')}</p>
          <h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('sa_nav_ads')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">{t('sa_ads_intro')}</p>
        </div>
        {canWrite && (
          <button type="button" onClick={() => { setTab('campaigns'); openCampaign(); }} className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#168df4] px-3 py-2 text-[10px] font-bold hover:bg-[#2aa6ff]">
            <Plus size={16} /> {t('ad_campaign_add')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-[#294d76] bg-[#0b203b] p-1">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-bold transition ${tab === item.id ? 'bg-[#168df4] text-white' : 'text-slate-300 hover:bg-white/5'}`}>
              <Icon size={13} /> {t(item.labelKey)}
            </button>
          );
        })}
      </div>

      {notice && <p role="status" className="rounded-lg border border-green-400/30 bg-green-500/10 px-3 py-2 text-[11px] font-semibold text-green-200">{notice}</p>}

      {!canRead && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[10px] font-semibold text-red-200">{t('rental_error_forbidden')}</p>}
      {canRead && !canWrite && <p className="rounded-lg border border-[#2b527d] bg-[#0b203b] px-3 py-2 text-[10px] font-semibold text-slate-300">{t('ad_reports_read_only')}</p>}

      {canWrite && tab === 'overview' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label={t('ad_stat_active_campaigns')} value={String(liveCampaigns.length)} tone="text-green-300" />
            <Stat label={t('ad_stat_live_placements')} value={String(livePlacements)} tone="text-cyan-300" />
            <Stat label={t('ad_stat_impressions')} value={String(periodTotals.impressions)} />
            <Stat label={t('ad_stat_clicks')} value={String(periodTotals.clicks)} />
            <Stat label={t('ad_stat_ctr')} value={`${periodTotals.ctr}%`} />
            <Stat label={t('ad_stat_pending_creatives')} value={String(pendingCreatives.length)} tone={pendingCreatives.length ? 'text-amber-300' : 'text-slate-300'} />
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            <Panel title={t('ad_stat_ending_soon')} icon={AlertTriangle}>
              {endingSoon.length === 0 ? (
                <p className="p-3 text-[11px] text-slate-500">{t('ad_report_empty')}</p>
              ) : (
                <ul className="divide-y divide-[#1d3a5c]">
                  {endingSoon.map((campaign) => (
                    <li key={campaign.id} className="flex items-center justify-between gap-2 px-3 py-2">
                      <span className="min-w-0">
                        <strong className="block truncate text-xs text-white">{campaign.name}</strong>
                        <span className="block truncate text-[10px] text-slate-400">{campaign.advertiser}</span>
                      </span>
                      <span className="shrink-0 text-[10px] font-semibold text-amber-300">{formatScheduleLabel(campaign.endAt, language)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title={t('ad_stat_pending_creatives')} icon={ImagePlus}>
              {pendingCreatives.length === 0 ? (
                <p className="p-3 text-[11px] text-slate-500">{t('ad_creative_queue_empty')}</p>
              ) : (
                <ul className="divide-y divide-[#1d3a5c]">
                  {pendingCreatives.map((creative) => {
                    const campaign = campaigns.find((row) => row.id === creative.campaignId);
                    return (
                      <li key={creative.id} className="flex items-center justify-between gap-2 px-3 py-2">
                        <span className="min-w-0">
                          <strong className="block truncate text-xs text-white">{campaign?.name ?? creative.campaignId}</strong>
                          <span className="block truncate text-[10px] text-slate-400">{creative.type} · {creative.clickUrl}</span>
                        </span>
                        <button type="button" onClick={() => setTab('creatives')} className="shrink-0 text-[10px] font-bold text-cyan-300 hover:text-white">
                          {t('ad_creative_approve')} <ChevronRight size={12} className="inline" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}

      {canWrite && tab === 'placements' && (
        <div className="grid gap-2 lg:grid-cols-[240px_1fr]">
          <Panel title={t('sa_ads_website_pages')} icon={Layers}>
            <div className="space-y-1 p-2">
              {AD_PAGES.map((page) => {
                const count = placementsForPage(page, placements).length;
                return (
                  <button key={page} type="button" onClick={() => setSelectedPage(page)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition ${selectedPage === page ? 'bg-[#168df4] text-white' : 'text-slate-300 hover:bg-white/5'}`}>
                    <span className="truncate text-xs font-semibold">{t(pageLabelKey(page))}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${selectedPage === page ? 'bg-white/20 text-white' : 'bg-[#102c51] text-cyan-300'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </Panel>
          <Panel
            title={`${t('ad_tab_placements')} · ${t(pageLabelKey(selectedPage))} · ${t('ad_stat_fill_rate')} ${fillRate(
              placementsForPage(selectedPage, placements).filter((placement) => filledToday.includes(placement.key)).length,
              placementsForPage(selectedPage, placements).filter((placement) => placement.active).length,
            )}% (24h)`}
            icon={Megaphone}
          >
            <div className="space-y-2 p-2">
              {placementsForPage(selectedPage, placements).map((placement) => {
                const served = serveAdNow(placement.key, now);
                // A fallback only fills the slot when an AdSense client is set,
                // so an unconfigured account is reported as empty rather than
                // claiming a fill that will never happen.
                const fallbackReady = placement.fallbackAllowed && Boolean(settings.adsenseClient.trim());
                const health = !placement.active ? 'off' : served ? 'admin' : fallbackReady ? 'fallback' : 'empty';
                return (
                  <div key={placement.key} className="rounded-lg border border-[#244668] bg-[#091b32] p-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <strong className="block text-xs text-white">{t(placement.labelKey)}</strong>
                        <span className="block truncate font-mono text-[10px] text-slate-500">{placement.key} · {t(placement.format === 'wide_banner' ? 'ad_format_wide' : 'ad_format_compact')}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${health === 'admin' ? 'bg-green-500/20 text-green-300' : health === 'fallback' ? 'bg-sky-500/20 text-sky-200' : 'bg-slate-500/20 text-slate-300'}`}>
                          {health === 'admin' ? t('ad_health_admin') : health === 'fallback' ? t('ad_health_fallback') : t('ad_health_empty')}
                        </span>
                        <button type="button" onClick={() => togglePlacement(placement)} aria-pressed={placement.active} className={`rounded-md px-2 py-1 text-[9px] font-bold ${placement.active ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/25 text-slate-300'}`}>
                          {placement.active ? t('ad_placement_on') : t('ad_placement_off')}
                        </button>
                        <button type="button" onClick={() => toggleFallback(placement)} aria-pressed={placement.fallbackAllowed} className={`rounded-md px-2 py-1 text-[9px] font-bold ${placement.fallbackAllowed ? 'bg-sky-500/20 text-sky-200' : 'bg-slate-500/25 text-slate-400'}`}>
                          {t('ad_placement_fallback')}
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 rounded-md border border-[#1d3a5c] bg-[#061426] p-1.5">
                      {served ? (
                        <>
                          {served.type === 'image'
                            ? <img src={served.mediaUrl} alt={language === 'mm' ? served.altMm : served.altEn} className="h-12 w-24 shrink-0 rounded object-cover" />
                            : <video src={served.mediaUrl} muted className="h-12 w-24 shrink-0 rounded object-cover" />}
                          <span className="min-w-0">
                            <strong className="block truncate text-[10px] text-white">{served.advertiser}</strong>
                            <span className="block truncate text-[9px] text-slate-400">{language === 'mm' ? served.altMm : served.altEn}</span>
                          </span>
                        </>
                      ) : (
                        <span className="px-1 text-[10px] text-slate-500">{t('ad_placement_none')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      )}

      {canWrite && tab === 'campaigns' && (
        <div className="space-y-2">
          <div className="grid gap-1 rounded-lg border border-[#294d76] bg-[#0b203b] p-2 sm:grid-cols-2 lg:grid-cols-5">
            <select
              value={campaignFilter.status}
              onChange={(event) => setCampaignFilter((current) => ({ ...current, status: event.target.value as CampaignStatus | '' }))}
              aria-label={t('ad_filter_status')}
              className={INPUT}
            >
              <option value="">{t('ad_filter_status')}</option>
              {(Object.keys(STATUS_KEYS) as CampaignStatus[]).map((status) => (
                <option key={status} value={status}>{t(STATUS_KEYS[status])}</option>
              ))}
            </select>
            <select
              value={campaignFilter.advertiser}
              onChange={(event) => setCampaignFilter((current) => ({ ...current, advertiser: event.target.value }))}
              aria-label={t('ad_campaign_advertiser')}
              className={INPUT}
            >
              <option value="">{t('ad_campaign_advertiser')}</option>
              {Array.from(new Set(campaigns.map((campaign) => campaign.advertiser))).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <select
              value={campaignFilter.placement}
              onChange={(event) => setCampaignFilter((current) => ({ ...current, placement: event.target.value }))}
              aria-label={t('ad_campaign_placements')}
              className={INPUT}
            >
              <option value="">{t('ad_campaign_placements')}</option>
              {placements.map((placement) => (
                <option key={placement.key} value={placement.key}>{t(placement.labelKey)}</option>
              ))}
            </select>
            <input
              type="date"
              value={campaignFilter.day}
              onChange={(event) => setCampaignFilter((current) => ({ ...current, day: event.target.value }))}
              aria-label={t('ad_filter_day')}
              className={INPUT}
            />
            <button
              type="button"
              onClick={() => setCampaignFilter({ status: '', advertiser: '', placement: '', day: '' })}
              className="rounded-md border border-[#2f6192] px-2 py-1.5 text-[10px] font-bold text-cyan-300 hover:bg-white/10"
            >
              {t('ad_filter_clear')}
            </button>
          </div>

          {campaigns.length === 0 ? (
            <Panel title={t('ad_tab_campaigns')} icon={Megaphone}>
              <div className="p-6 text-center">
                <Megaphone className="mx-auto text-slate-500" size={26} />
                <p className="mt-2 text-sm font-semibold text-slate-300">{t('ad_campaign_empty')}</p>
                <p className="mt-1 text-[11px] text-slate-500">{t('ad_campaign_empty_detail')}</p>
              </div>
            </Panel>
          ) : (
            <Panel title={`${t('ad_tab_campaigns')} · ${visibleCampaigns.length}/${campaigns.length}`} icon={Megaphone}>
              {visibleCampaigns.length === 0 ? (
                <p className="p-3 text-[11px] text-slate-500">{t('ad_filter_empty')}</p>
              ) : (
              <div className="divide-y divide-[#1d3a5c]">
                {visibleCampaigns.map((campaign) => {
                  const own = creatives.filter((creative) => creative.campaignId === campaign.id);
                  return (
                    <div key={campaign.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-xs text-white">{campaign.name}</strong>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${STATUS_TONES[campaign.status]}`}>{t(STATUS_KEYS[campaign.status])}</span>
                          <span className="rounded-full bg-[#102c51] px-2 py-0.5 text-[9px] font-bold text-cyan-300">{own.length} {t('ad_creative_list')}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {campaign.advertiser} · {fill(t('ad_campaign_window'), { start: formatScheduleLabel(campaign.startAt, language), end: formatScheduleLabel(campaign.endAt, language) })}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {campaign.placementKeys.map((key) => { const placement = placementByKey(key, placements); return placement ? t(placement.labelKey) : key; }).join(' · ')}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1">
                        <button type="button" onClick={() => openCampaign(campaign)} className="rounded-md border border-[#2f6192] px-2 py-1 text-[9px] font-bold text-cyan-300 hover:bg-white/10">{t('sa_edit')}</button>
                        {campaign.status === 'Draft' && <ActionButton onClick={() => moveCampaign(campaign, 'Pending')} label={t('ad_campaign_submit')} tone="sky" />}
                        {campaign.status === 'Pending' && <ActionButton onClick={() => moveCampaign(campaign, 'Approved')} label={t('ad_creative_approve')} tone="green" />}
                        {campaign.status === 'Approved' && <ActionButton onClick={() => moveCampaign(campaign, 'Live')} label={t('ad_campaign_resume')} tone="green" />}
                        {campaign.status === 'Live' && <ActionButton onClick={() => moveCampaign(campaign, 'Paused')} label={t('ad_campaign_pause')} tone="amber" />}
                        {campaign.status === 'Paused' && <ActionButton onClick={() => moveCampaign(campaign, 'Live')} label={t('ad_campaign_resume')} tone="green" />}
                        <button type="button" onClick={() => deleteCampaign(campaign)} aria-label={t('ad_campaign_delete')} className="rounded-md border border-red-400/30 px-2 py-1 text-[9px] font-bold text-red-300 hover:bg-red-500/10"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </Panel>
          )}

          {campaignDraft && (
            <Panel title={campaignDraft.id ? t('ad_campaign_edit') : t('ad_campaign_add')} icon={Megaphone}>
              <form onSubmit={saveCampaign} className="grid gap-2 p-3 sm:grid-cols-2">
                <Field label={t('ad_campaign_name')}>
                  <input required value={campaignDraft.name} onChange={(event) => setCampaignDraft((current) => current && { ...current, name: event.target.value })} className={INPUT} />
                </Field>
                <Field label={t('ad_campaign_advertiser')}>
                  <input required value={campaignDraft.advertiser} onChange={(event) => setCampaignDraft((current) => current && { ...current, advertiser: event.target.value })} className={INPUT} />
                </Field>
                <Field label={t('ad_campaign_start')}>
                  <div className="flex gap-1">
                    <input type="date" required value={campaignDraft.startDate} onChange={(event) => setCampaignDraft((current) => current && { ...current, startDate: event.target.value })} className={INPUT} />
                    <input type="time" required value={campaignDraft.startTime} onChange={(event) => setCampaignDraft((current) => current && { ...current, startTime: event.target.value })} className={`${INPUT} w-24`} />
                  </div>
                </Field>
                <Field label={t('ad_campaign_end')}>
                  <div className="flex gap-1">
                    <input type="date" required value={campaignDraft.endDate} onChange={(event) => setCampaignDraft((current) => current && { ...current, endDate: event.target.value })} className={INPUT} />
                    <input type="time" required value={campaignDraft.endTime} onChange={(event) => setCampaignDraft((current) => current && { ...current, endTime: event.target.value })} className={`${INPUT} w-24`} />
                  </div>
                </Field>
                <Field label={t('ad_campaign_priority')}>
                  <input type="number" min={0} value={campaignDraft.priority} onChange={(event) => setCampaignDraft((current) => current && { ...current, priority: event.target.value })} className={INPUT} />
                </Field>
                <Field label={t('ad_campaign_weight')}>
                  <input type="number" min={1} value={campaignDraft.weight} onChange={(event) => setCampaignDraft((current) => current && { ...current, weight: event.target.value })} className={INPUT} />
                </Field>
                <Field label={t('ad_campaign_fee')}>
                  <input type="number" min={0} value={campaignDraft.agreedFeeMmk} onChange={(event) => setCampaignDraft((current) => current && { ...current, agreedFeeMmk: event.target.value })} className={INPUT} />
                </Field>
                <div className="flex items-end gap-3 text-[10px] font-semibold text-slate-300">
                  <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={campaignDraft.invoiced} onChange={(event) => setCampaignDraft((current) => current && { ...current, invoiced: event.target.checked })} /> {t('ad_campaign_invoiced')}</label>
                  <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={campaignDraft.paid} onChange={(event) => setCampaignDraft((current) => current && { ...current, paid: event.target.checked })} /> {t('ad_campaign_paid')}</label>
                </div>
                <div className="sm:col-span-2">
                  <p className="mb-1 text-[10px] font-semibold text-slate-300">{t('ad_campaign_placements')}</p>
                  <div className="grid gap-1 rounded-md border border-[#2b527d] bg-[#081a31] p-2 sm:grid-cols-2 lg:grid-cols-3">
                    {placements.map((placement) => (
                      <label key={placement.key} className="inline-flex items-center gap-1.5 text-[10px] text-slate-300">
                        <input
                          type="checkbox"
                          checked={campaignDraft.placementKeys.includes(placement.key)}
                          onChange={(event) => setCampaignDraft((current) => {
                            if (!current) return current;
                            const keys = event.target.checked
                              ? [...current.placementKeys, placement.key]
                              : current.placementKeys.filter((key) => key !== placement.key);
                            return { ...current, placementKeys: keys };
                          })}
                        />
                        {t(placement.labelKey)}
                      </label>
                    ))}
                  </div>
                </div>
                {problem && <p role="alert" className="sm:col-span-2 rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1.5 text-[10px] font-semibold text-red-200">{t(problem)}</p>}
                <div className="flex items-center gap-2 sm:col-span-2">
                  <button type="submit" className="rounded-lg bg-cyan-400 px-3 py-2 text-[10px] font-bold text-[#061426]">{t('ad_campaign_save')}</button>
                  <button type="button" onClick={() => { setCampaignDraft(null); setProblem(null); }} className="rounded-lg border border-[#2b527d] px-3 py-2 text-[10px] font-semibold text-slate-300">{t('sa_cancel')}</button>
                </div>
              </form>

              {campaignDraft.id && (
                <div className="border-t border-[#244668] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-300">{t('ad_creative_list')}</p>
                    <button type="button" onClick={() => setCreativeDraft(emptyCreative(campaignDraft.id))} className="inline-flex items-center gap-1 rounded-md border border-[#2f6192] px-2 py-1 text-[9px] font-bold text-cyan-300 hover:bg-white/10"><Plus size={11} /> {t('ad_creative_add')}</button>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {creatives.filter((creative) => creative.campaignId === campaignDraft.id).map((creative) => (
                      <li key={creative.id} className="flex items-center justify-between gap-2 rounded-md border border-[#1d3a5c] bg-[#061426] px-2 py-1.5">
                        <span className="min-w-0">
                          <strong className="block truncate text-[10px] text-white">{creative.type} · {creative.clickUrl}</strong>
                          <span className="block truncate text-[9px] text-slate-500">{creative.altEn}</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${creative.approval === 'approved' ? 'bg-green-500/20 text-green-300' : creative.approval === 'pending' ? 'bg-amber-500/20 text-amber-200' : creative.approval === 'rejected' ? 'bg-red-500/20 text-red-200' : 'bg-slate-500/20 text-slate-300'}`}>{t(APPROVAL_KEYS[creative.approval])}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>
          )}

          {creativeDraft && (
            <Panel title={t('ad_creative_add')} icon={ImagePlus}>
              <form onSubmit={saveCreative} className="grid gap-2 p-3 sm:grid-cols-2">
                <Field label={t('ad_creative_type')}>
                  <select value={creativeDraft.type} onChange={(event) => setCreativeDraft((current) => current && { ...current, type: event.target.value === 'video' ? 'video' : 'image' })} className={INPUT}>
                    <option value="image">{t('ad_creative_image')}</option>
                    <option value="video">{t('ad_creative_video')}</option>
                  </select>
                </Field>
                <Field label={t('ad_creative_media')}>
                  <input required value={creativeDraft.mediaUrl} onChange={(event) => setCreativeDraft((current) => current && { ...current, mediaUrl: event.target.value })} placeholder="/images/blog/bagan-sunrise.webp" className={INPUT} />
                </Field>
                <Field label={t('ad_creative_click')}>
                  <input required value={creativeDraft.clickUrl} onChange={(event) => setCreativeDraft((current) => current && { ...current, clickUrl: event.target.value })} placeholder="/travel-plans" className={INPUT} />
                </Field>
                <Field label={t('ad_creative_alt_mm')}>
                  <input required value={creativeDraft.altMm} onChange={(event) => setCreativeDraft((current) => current && { ...current, altMm: event.target.value })} className={INPUT} />
                </Field>
                <Field label={t('ad_creative_alt_en')}>
                  <input required value={creativeDraft.altEn} onChange={(event) => setCreativeDraft((current) => current && { ...current, altEn: event.target.value })} className={INPUT} />
                </Field>
                <div className="flex items-end text-[10px] font-semibold">
                  {isSafeClickUrl(creativeDraft.clickUrl, settings.blockedDomains)
                    ? <span className="inline-flex items-center gap-1 text-green-300"><Check size={12} /> {t('ad_creative_click_ok')}</span>
                    : <span className="inline-flex items-center gap-1 text-amber-300"><Ban size={12} /> {t('ad_creative_click_hint')}</span>}
                </div>
                {problem && <p role="alert" className="sm:col-span-2 rounded-md border border-red-400/30 bg-red-500/10 px-2 py-1.5 text-[10px] font-semibold text-red-200">{t(problem)}</p>}
                <div className="flex items-center gap-2 sm:col-span-2">
                  <button type="submit" className="rounded-lg bg-cyan-400 px-3 py-2 text-[10px] font-bold text-[#061426]">{t('ad_campaign_save')}</button>
                  <button type="button" onClick={() => { setCreativeDraft(null); setProblem(null); }} className="rounded-lg border border-[#2b527d] px-3 py-2 text-[10px] font-semibold text-slate-300">{t('sa_cancel')}</button>
                </div>
              </form>
            </Panel>
          )}
        </div>
      )}

      {canWrite && tab === 'creatives' && (
        <Panel title={t('ad_tab_creatives')} icon={ImagePlus}>
          {pendingCreatives.length === 0 ? (
            <div className="p-6 text-center">
              <ImagePlus className="mx-auto text-slate-500" size={26} />
              <p className="mt-2 text-sm font-semibold text-slate-300">{t('ad_creative_queue_empty')}</p>
              <p className="mt-1 text-[11px] text-slate-500">{t('ad_creative_queue_detail')}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1d3a5c]">
              {pendingCreatives.map((creative) => {
                const campaign = campaigns.find((row) => row.id === creative.campaignId);
                return (
                  <div key={creative.id} className="flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      {creative.type === 'image'
                        ? <img src={creative.mediaUrl} alt={creative.altEn} className="h-12 w-24 shrink-0 rounded object-cover" />
                        : <video src={creative.mediaUrl} muted className="h-12 w-24 shrink-0 rounded object-cover" />}
                      <span className="min-w-0">
                        <strong className="block truncate text-xs text-white">{campaign?.name ?? creative.campaignId}</strong>
                        <span className="block truncate text-[10px] text-slate-400">{creative.altEn}</span>
                        <span className="block truncate font-mono text-[9px] text-slate-500">{creative.clickUrl}</span>
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => reviewCreative(creative, 'approved')} className="inline-flex items-center gap-1 rounded-md bg-green-500/20 px-2 py-1.5 text-[9px] font-bold text-green-300 hover:bg-green-500/30"><Check size={12} /> {t('ad_creative_approve')}</button>
                      <button type="button" onClick={() => { setRejectingId(creative.id); setRejectReason(''); }} className="inline-flex items-center gap-1 rounded-md border border-red-400/30 px-2 py-1.5 text-[9px] font-bold text-red-300 hover:bg-red-500/10"><X size={12} /> {t('ad_creative_reject')}</button>
                    </div>
                    {rejectingId === creative.id && (
                      <div className="flex w-full items-center gap-1 sm:w-auto">
                        <input value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder={t('ad_creative_reject_reason')} className={INPUT} />
                        <button type="button" onClick={() => reviewCreative(creative, 'rejected', rejectReason.trim() || t('ad_creative_reject_reason'))} className="rounded-md bg-red-500/25 px-2 py-1.5 text-[9px] font-bold text-red-200">{t('ad_creative_reject')}</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {canWrite && tab === 'advertisers' && (
        <div className="space-y-2">
          <Panel title={t('ad_tab_advertisers')} icon={Building2}>
            {advertisers.length === 0 ? (
              <p className="p-3 text-[11px] text-slate-500">{t('ad_advertiser_empty')}</p>
            ) : (
              <div className="divide-y divide-[#1d3a5c]">
                {advertisers.map((advertiser) => {
                  const history = campaigns.filter((campaign) => campaign.advertiser === advertiser.name);
                  const live = history.filter((campaign) => campaign.status === 'Live').length;
                  return (
                    <button
                      key={advertiser.id}
                      type="button"
                      onClick={() => { setAdvertiserId(advertiser.id); setProblem(null); setNotice(''); }}
                      className={`flex w-full flex-col gap-1 px-3 py-2 text-left sm:flex-row sm:items-center sm:justify-between ${advertiserId === advertiser.id ? 'bg-white/5' : 'hover:bg-white/5'}`}
                    >
                      <div className="min-w-0">
                        <strong className="text-xs text-white">{advertiser.name}</strong>
                        <p className="mt-0.5 truncate text-[10px] text-slate-400">
                          {advertiser.contactName || t('ad_advertiser_no_contact')}
                          {advertiser.contactPhone ? ` · ${advertiser.contactPhone}` : ''}
                          {advertiser.contactEmail ? ` · ${advertiser.contactEmail}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-[9px] font-bold">
                        <span className="rounded-full bg-[#102c51] px-2 py-0.5 text-cyan-300">{history.length} {t('ad_tab_campaigns')}</span>
                        <span className={`rounded-full px-2 py-0.5 ${live ? 'bg-green-500/20 text-green-300' : 'bg-slate-600/30 text-slate-400'}`}>{live} {t('ad_status_live')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          {(() => {
            const selected = advertisers.find((row) => row.id === advertiserId);
            if (!selected) return null;
            const history = campaigns.filter((campaign) => campaign.advertiser === selected.name);
            const update = (patch: Partial<Advertiser>) => saveAdvertisers((current) => current.map((row) => (row.id === selected.id ? { ...row, ...patch } : row)));
            return (
              <Panel title={`${t('ad_advertiser_edit')} · ${selected.name}`} icon={Building2}>
                <form onSubmit={saveAdvertiser} className="grid gap-2 p-3 sm:grid-cols-2">
                  <Field label={t('ad_advertiser_name')}>
                    <input required value={selected.name} onChange={(event) => update({ name: event.target.value })} className={INPUT} />
                  </Field>
                  <Field label={t('ad_advertiser_contact')}>
                    <input value={selected.contactName} onChange={(event) => update({ contactName: event.target.value })} className={INPUT} />
                  </Field>
                  <Field label={t('ad_advertiser_phone')}>
                    <input value={selected.contactPhone} onChange={(event) => update({ contactPhone: event.target.value })} className={INPUT} />
                  </Field>
                  <Field label={t('ad_advertiser_email')}>
                    <input type="email" value={selected.contactEmail} onChange={(event) => update({ contactEmail: event.target.value })} className={INPUT} />
                  </Field>
                  <Field label={t('ad_advertiser_billing')}>
                    <input value={selected.billingRef} onChange={(event) => update({ billingRef: event.target.value })} className={INPUT} />
                  </Field>
                  <Field label={t('ad_advertiser_notes')}>
                    <input value={selected.notes} onChange={(event) => update({ notes: event.target.value })} className={INPUT} />
                  </Field>
                  <div className="sm:col-span-2">
                    <button type="submit" className="rounded-lg bg-cyan-400 px-3 py-2 text-[10px] font-bold text-[#061426]">{t('ad_campaign_save')}</button>
                  </div>
                </form>
                <div className="border-t border-[#1d3a5c] px-3 py-2">
                  <p className="mb-1 text-[10px] font-semibold text-slate-300">{t('ad_advertiser_history')}</p>
                  {history.length === 0 ? (
                    <p className="text-[10px] text-slate-500">{t('ad_campaign_empty')}</p>
                  ) : (
                    <ul className="space-y-1">
                      {history.map((campaign) => (
                        <li key={campaign.id} className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                          <span className="text-white">{campaign.name}</span>
                          <span className="flex items-center gap-1">
                            <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${STATUS_TONES[campaign.status]}`}>{t(STATUS_KEYS[campaign.status])}</span>
                            <span>{campaign.agreedFeeMmk.toLocaleString()} {language === 'mm' ? 'ကျပ်' : 'MMK'}</span>
                            <span>{campaign.invoiced ? t('ad_campaign_invoiced') : '—'}</span>
                            <span>{campaign.paid ? t('ad_campaign_paid') : '—'}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Panel>
            );
          })()}
        </div>
      )}

      {canRead && tab === 'reports' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1 rounded-lg border border-[#294d76] bg-[#0b203b] p-1">
              {(['7', '30', 'all'] as const).map((value) => (
                <button key={value} type="button" onClick={() => setRangeDays(value)} className={`rounded-md px-2.5 py-1 text-[10px] font-bold ${rangeDays === value ? 'bg-[#168df4] text-white' : 'text-slate-300 hover:bg-white/5'}`}>
                  {value === '7' ? t('ad_report_range_7') : value === '30' ? t('ad_report_range_30') : t('ad_report_range_all')}
                </button>
              ))}
            </div>
            <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1 rounded-md border border-[#2f6192] px-2.5 py-1.5 text-[10px] font-bold text-cyan-300 hover:bg-white/10"><RefreshCw size={12} /> {t('ad_report_export')}</button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label={t('ad_stat_impressions')} value={String(periodTotals.impressions)} />
            <Stat label={t('ad_stat_clicks')} value={String(periodTotals.clicks)} />
            <Stat label={t('ad_stat_ctr')} value={`${periodTotals.ctr}%`} />
            <Stat label={t('ad_stat_fill_rate')} value={`${fillRate(livePlacements, placements.filter((placement) => placement.active).length)}%`} />
          </div>
          {rangeStats.length === 0 ? (
            <Panel title={t('ad_report_by_day')} icon={TrendingUp}>
              <p className="p-3 text-[11px] text-slate-500">{t('ad_report_empty')}</p>
            </Panel>
          ) : (
            <div className="grid gap-2 lg:grid-cols-2">
              <ReportTable title={t('ad_report_by_day')} rows={byDay(rangeStats)} columns={[t('ad_report_by_day')]} />
              <ReportTable title={t('ad_report_by_placement')} rows={byPlacement(rangeStats, placements, t)} columns={[t('ad_report_by_placement')]} />
              <ReportTable title={t('ad_report_by_campaign')} rows={byCampaign(rangeStats, campaigns)} columns={[t('ad_report_by_campaign')]} />
            </div>
          )}
          <p className="text-[10px] text-slate-500">{t('ad_stat_impressions')} · {events.length} raw · 90 {language === 'mm' ? 'ရက်' : 'days'}</p>
        </div>
      )}

      {canWrite && tab === 'settings' && (
        <Panel title={t('ad_tab_settings')} icon={Settings}>
          <form onSubmit={saveSettingsForm} className="grid gap-2 p-3 sm:grid-cols-2">
            <Field label={t('ad_settings_adsense')}>
              <input value={settings.adsenseClient} onChange={(event) => saveSettings((current) => ({ ...current, adsenseClient: event.target.value }))} placeholder="ca-pub-…" className={INPUT} />
            </Field>
            <Field label={t('ad_settings_adsense_slot')}>
              <input value={settings.adsenseSlotHome} onChange={(event) => saveSettings((current) => ({ ...current, adsenseSlotHome: event.target.value }))} className={INPUT} />
            </Field>
            <p className="sm:col-span-2 text-[10px] text-slate-500">{t('ad_settings_adsense_note')}</p>
            <Field label={t('ad_settings_image_max')}>
              <input type="number" min={1} value={settings.imageMaxKb} onChange={(event) => saveSettings((current) => ({ ...current, imageMaxKb: Number(event.target.value) || DEFAULT_AD_SETTINGS.imageMaxKb }))} className={INPUT} />
            </Field>
            <Field label={t('ad_settings_video_max')}>
              <input type="number" min={1} value={settings.videoMaxKb} onChange={(event) => saveSettings((current) => ({ ...current, videoMaxKb: Number(event.target.value) || DEFAULT_AD_SETTINGS.videoMaxKb }))} className={INPUT} />
            </Field>
            <Field label={t('ad_settings_video_seconds')}>
              <input type="number" min={1} value={settings.videoMaxSeconds} onChange={(event) => saveSettings((current) => ({ ...current, videoMaxSeconds: Number(event.target.value) || DEFAULT_AD_SETTINGS.videoMaxSeconds }))} className={INPUT} />
            </Field>
            <Field label={`${t('ad_settings_blocked')} · ${t('ad_settings_blocked_note')}`}>
              <textarea
                rows={3}
                value={settings.blockedDomains.join('\n')}
                onChange={(event) => saveSettings((current): AdSettings => ({ ...current, blockedDomains: event.target.value.split('\n').map((line) => line.trim()).filter(Boolean) }))}
                className={`${INPUT} resize-none`}
              />
            </Field>
            <div className="sm:col-span-2">
              <button type="submit" className="rounded-lg bg-cyan-400 px-3 py-2 text-[10px] font-bold text-[#061426]">{t('ad_settings_save')}</button>
            </div>
          </form>
        </Panel>
      )}
    </div>
  );
}

function byDay(rows: AdStatsRow[]): { label: string; impressions: number; clicks: number; ctr: number }[] {
  const map = new Map<string, { impressions: number; clicks: number }>();
  for (const row of rows) {
    const current = map.get(row.day) ?? { impressions: 0, clicks: 0 };
    current.impressions += row.impressions;
    current.clicks += row.clicks;
    map.set(row.day, current);
  }
  return Array.from(map.entries())
    .map(([label, value]) => ({ label, ...value, ctr: clickThroughRate(value.impressions, value.clicks) }))
    .sort((a, b) => b.label.localeCompare(a.label));
}

function byPlacement(rows: AdStatsRow[], placements: AdPlacement[], t: (key: TranslationKey) => string): { label: string; impressions: number; clicks: number; ctr: number }[] {
  const map = new Map<string, { impressions: number; clicks: number }>();
  for (const row of rows) {
    const current = map.get(row.placementKey) ?? { impressions: 0, clicks: 0 };
    current.impressions += row.impressions;
    current.clicks += row.clicks;
    map.set(row.placementKey, current);
  }
  return Array.from(map.entries())
    .map(([key, value]) => {
      const placement = placementByKey(key, placements);
      return { label: placement ? t(placement.labelKey) : key, ...value, ctr: clickThroughRate(value.impressions, value.clicks) };
    })
    .sort((a, b) => b.impressions - a.impressions);
}

function byCampaign(rows: AdStatsRow[], campaigns: AdCampaign[]): { label: string; impressions: number; clicks: number; ctr: number }[] {
  const map = new Map<string, { impressions: number; clicks: number }>();
  for (const row of rows) {
    const current = map.get(row.campaignId) ?? { impressions: 0, clicks: 0 };
    current.impressions += row.impressions;
    current.clicks += row.clicks;
    map.set(row.campaignId, current);
  }
  return Array.from(map.entries())
    .map(([id, value]) => ({
      label: campaigns.find((campaign) => campaign.id === id)?.name ?? id,
      ...value,
      ctr: clickThroughRate(value.impressions, value.clicks),
    }))
    .sort((a, b) => b.impressions - a.impressions);
}

function ReportTable({ title, rows, columns }: { title: string; rows: { label: string; impressions: number; clicks: number; ctr: number }[]; columns: string[] }) {
  return (
    <Panel title={title} icon={TrendingUp}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[10px]">
          <thead className="bg-[#091a31] text-slate-400">
            <tr>
              <th className="px-2 py-1.5">{columns[0]}</th>
              <th className="px-2 py-1.5">Imp.</th>
              <th className="px-2 py-1.5">Clicks</th>
              <th className="px-2 py-1.5">CTR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-[#1d3a5c] text-slate-200">
                <td className="px-2 py-1.5">{row.label}</td>
                <td className="px-2 py-1.5">{row.impressions}</td>
                <td className="px-2 py-1.5">{row.clicks}</td>
                <td className="px-2 py-1.5">{row.ctr}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Megaphone; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
      <div className="flex items-center gap-2 border-b border-[#244668] px-2.5 py-1.5">
        <h2 className="flex items-center gap-2 text-xs font-bold"><Icon size={15} className="text-[#26b8ff]" />{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-semibold text-slate-300">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Stat({ label, value, tone = 'text-white' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-[#294d76] bg-[#0b203b] p-2.5">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-extrabold ${tone}`}>{value}</p>
    </div>
  );
}

function ActionButton({ onClick, label, tone }: { onClick: () => void; label: string; tone: 'green' | 'amber' | 'sky' }) {
  const tones = {
    green: 'bg-green-500/20 text-green-300 hover:bg-green-500/30',
    amber: 'bg-amber-500/20 text-amber-200 hover:bg-amber-500/30',
    sky: 'bg-sky-500/20 text-sky-200 hover:bg-sky-500/30',
  };
  const Icon = tone === 'green' ? Play : tone === 'amber' ? Pause : ChevronRight;
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-bold ${tones[tone]}`}>
      <Icon size={11} /> {label}
    </button>
  );
}
