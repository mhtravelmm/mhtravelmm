import { BLOG_INLINE_KEY, placementByKey, resolvePlacementKey, type AdPlacement } from './adPlacements';

/**
 * Plan §16A.6: the campaign status machine, and §16A.5 the serving rules. Both
 * live here rather than in the Adsboard, because the pages call the same
 * serving function and the one-minute job moves the same statuses — a rule
 * that existed twice would drift the first time one side was edited.
 */

export type CampaignStatus = 'Draft' | 'Pending' | 'Approved' | 'Live' | 'Paused' | 'Ended' | 'Rejected';

export type CreativeApproval = 'draft' | 'pending' | 'approved' | 'rejected';

export type AdCreativeRow = {
  id: string;
  campaignId: string;
  type: 'image' | 'video';
  mediaUrl: string;
  clickUrl: string;
  altMm: string;
  altEn: string;
  approval: CreativeApproval;
  rejectedReason: string;
  /** §16A.8: the size the Worker checked, kept so the report can show it. */
  bytes: number;
  /** §16A.8: the 15-second cap needs a measured length, not a guess. */
  durationSeconds?: number;
};

export type AdCampaign = {
  id: string;
  advertiser: string;
  name: string;
  status: CampaignStatus;
  /** UTC instants; the Adsboard enters Myanmar Time and converts. */
  startAt: string;
  endAt: string;
  priority: number;
  weight: number;
  /** §16A.12: a flat fee agreed by hand, invoiced outside the app. */
  agreedFeeMmk: number;
  invoiced: boolean;
  paid: boolean;
  /** The placement keys the campaign runs on. */
  placementKeys: string[];
  createdBy: string;
  approvedBy: string;
  approvedAt: string | null;
  /** The last status change, so the job can tell a Live campaign from a stale one. */
  updatedAt: string;
};

/** §16A.6: the only legal moves. Anything else is refused, not coerced. */
const ALLOWED_MOVES: Record<CampaignStatus, CampaignStatus[]> = {
  Draft: ['Pending'],
  Pending: ['Approved', 'Rejected'],
  Approved: ['Live'],
  Live: ['Paused', 'Ended'],
  Paused: ['Live'],
  Ended: [],
  Rejected: ['Draft'],
};

export function canMove(from: CampaignStatus, to: CampaignStatus): boolean {
  return ALLOWED_MOVES[from].includes(to);
}

/** Statuses that may serve an ad: only Live, inside its window (§16A.5 step 2). */
export function isServingStatus(status: CampaignStatus): boolean {
  return status === 'Live';
}

export function canServe(campaign: AdCampaign, now: Date): boolean {
  if (!isServingStatus(campaign.status)) return false;
  const start = new Date(campaign.startAt).getTime();
  const end = new Date(campaign.endAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return false;
  const at = now.getTime();
  return at >= start && at < end;
}

/** §16A.6: `end_at` is a wall, so a Live campaign past it becomes Ended. */
export function hasEnded(campaign: AdCampaign, now: Date): boolean {
  const end = new Date(campaign.endAt).getTime();
  return !Number.isNaN(end) && now.getTime() >= end;
}

/**
 * §16A.5 step 2: a campaign is a candidate only when it is Live, inside its
 * window, assigned to this placement, and holds an approved creative of an
 * allowed type.
 */
export function campaignServesPlacement(
  campaign: AdCampaign,
  creative: AdCreativeRow | undefined,
  placementKey: string,
  placements: AdPlacement[],
  now: Date,
): boolean {
  if (!canServe(campaign, now)) return false;
  const placement = placementByKey(placementKey, placements);
  if (!placement || !placement.active) return false;
  const assigned = campaign.placementKeys.some((key) => resolvePlacementKey(key, placements) === placement.key);
  if (!assigned) return false;
  if (!creative || creative.approval !== 'approved') return false;
  return creative.type === 'image' || creative.type === 'video';
}

/**
 * §16A.5 steps 3 and 4: highest priority wins, and equals rotate by weight.
 * The rotation is deterministic on the placement and the minute, so the same
 * request twice in one minute is stable while a long-lived page still changes
 * creative, and a weighted campaign is picked in proportion to its weight.
 */
export function pickCampaign<T extends { campaign: AdCampaign }>(candidates: T[], placementKey: string, now: Date): T | undefined {
  if (candidates.length === 0) return undefined;
  const topPriority = Math.max(...candidates.map((row) => row.campaign.priority));
  const best = candidates.filter((row) => row.campaign.priority === topPriority);
  if (best.length === 1) return best[0];
  const totalWeight = best.reduce((sum, row) => sum + Math.max(1, row.campaign.weight), 0);
  const seed = hash(`${placementKey}:${Math.floor(now.getTime() / 60000)}`);
  let ticket = seed % totalWeight;
  for (const row of best) {
    ticket -= Math.max(1, row.campaign.weight);
    if (ticket < 0) return row;
  }
  return best[best.length - 1];
}

/** FNV-1a over the seed string: small, stable, and no dependency. */
function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

/**
 * §16A.8: `https` or an internal path only, so an ad cannot run javascript:.
 * The Settings block list is applied on top, so an advertiser banned once
 * cannot return through a new creative.
 */
export function isSafeClickUrl(url: string, blockedDomains: string[] = []): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return !blockedDomains.some((domain) => {
      const blocked = domain.trim().toLowerCase().replace(/^www\./, '');
      if (!blocked) return false;
      return host === blocked || host.endsWith(`.${blocked}`);
    });
  } catch {
    return false;
  }
}

/**
 * §16A.8 limits, so the form refuses what the upload Worker would refuse. Both
 * languages of alt text are required because they are the reader's only
 * description of the ad.
 */
export type CreativeLimits = { imageMaxKb: number; videoMaxKb: number; videoMaxSeconds: number };

export const DEFAULT_CREATIVE_LIMITS: CreativeLimits = {
  imageMaxKb: 300,
  videoMaxKb: 3 * 1024,
  videoMaxSeconds: 15,
};

export function creativeProblem(
  creative: Pick<AdCreativeRow, 'type' | 'mediaUrl' | 'clickUrl' | 'altMm' | 'altEn'> &
    Partial<Pick<AdCreativeRow, 'bytes' | 'durationSeconds'>>,
  blockedDomains: string[] = [],
  limits: CreativeLimits = DEFAULT_CREATIVE_LIMITS,
): string | null {
  if (!creative.mediaUrl.trim()) return 'ad_problem_media';
  if (!creative.altMm.trim() || !creative.altEn.trim()) return 'ad_problem_alt';
  if (!isSafeClickUrl(creative.clickUrl, blockedDomains)) return 'ad_problem_click_url';
  if (creative.type !== 'image' && creative.type !== 'video') return 'ad_problem_media';
  // A measured size is checked; an unknown one is not, because the browser
  // stand-in has no Worker to measure it and a wrong refusal blocks the form.
  const bytes = creative.bytes ?? 0;
  if (bytes > 0) {
    const limitKb = creative.type === 'image' ? limits.imageMaxKb : limits.videoMaxKb;
    if (bytes > limitKb * 1024) return creative.type === 'image' ? 'ad_problem_image_size' : 'ad_problem_video_size';
  }
  if (creative.type === 'video' && (creative.durationSeconds ?? 0) > limits.videoMaxSeconds) {
    return 'ad_problem_video_length';
  }
  return null;
}

/** A campaign cannot be submitted without at least one placement and one creative. */
export function campaignProblem(
  campaign: Pick<AdCampaign, 'name' | 'advertiser' | 'startAt' | 'endAt' | 'placementKeys'>,
  creatives: AdCreativeRow[],
  placements: AdPlacement[],
  options: { blockedDomains?: string[]; limits?: CreativeLimits } = {},
): string | null {
  if (!campaign.name.trim() || !campaign.advertiser.trim()) return 'ad_problem_name';
  const start = new Date(campaign.startAt).getTime();
  const end = new Date(campaign.endAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 'ad_problem_window';
  const keys = campaign.placementKeys.filter((key) => resolvePlacementKey(key, placements));
  if (keys.length === 0) return 'ad_problem_placement';
  if (creatives.length === 0) return 'ad_problem_creative';
  const { blockedDomains = [], limits = DEFAULT_CREATIVE_LIMITS } = options;
  if (!creatives.some((creative) => !creativeProblem(creative, blockedDomains, limits))) return 'ad_problem_creative';
  return null;
}

/** The ad a page renders, in the shape `AdSlot` already expects. */
export type ServedAd = {
  id: string;
  campaignId: string;
  placementKey: string;
  type: 'image' | 'video';
  mediaUrl: string;
  clickThroughUrl: string;
  advertiser: string;
  altMm: string;
  altEn: string;
};

/**
 * §16A.5 `serve_ad(placement_key, language)`: the placement is off, nothing is
 * Live, or no approved creative matches — all three answer `null`, which is
 * what makes the slot collapse instead of showing an empty box.
 */
export function serveAd(
  placementKey: string,
  campaigns: AdCampaign[],
  creatives: AdCreativeRow[],
  placements: AdPlacement[],
  now: Date,
): ServedAd | null {
  const placement = placementByKey(placementKey, placements);
  if (!placement || !placement.active) return null;

  const candidates: { campaign: AdCampaign; creative: AdCreativeRow }[] = [];
  for (const campaign of campaigns) {
    const creative = creatives.find(
      (row) => row.campaignId === campaign.id && campaignServesPlacement(campaign, row, placement.key, placements, now),
    );
    if (creative) candidates.push({ campaign, creative });
  }

  const chosen = pickCampaign(candidates, placement.key, now);
  if (!chosen) return null;

  return {
    id: chosen.creative.id,
    campaignId: chosen.campaign.id,
    placementKey: placement.key,
    type: chosen.creative.type,
    mediaUrl: chosen.creative.mediaUrl,
    clickThroughUrl: chosen.creative.clickUrl,
    advertiser: chosen.campaign.advertiser,
    altMm: chosen.creative.altMm,
    altEn: chosen.creative.altEn,
  };
}

/** §16A.7 Campaigns: the four filters the Adsboard offers, all optional. */
export type CampaignFilter = {
  status?: CampaignStatus | '';
  advertiser?: string;
  placement?: string;
  day?: string;
};

/**
 * A campaign matches a day when its window overlaps that day, so a filter on
 * today keeps a campaign that started last week and has not ended yet.
 */
export function filterCampaigns(campaigns: AdCampaign[], filter: CampaignFilter): AdCampaign[] {
  const { status, advertiser, placement, day } = filter;
  return campaigns.filter((campaign) => {
    if (status && campaign.status !== status) return false;
    if (advertiser && campaign.advertiser !== advertiser) return false;
    if (placement && !campaign.placementKeys.includes(placement)) return false;
    if (day) {
      const from = new Date(`${day}T00:00:00`).getTime();
      if (Number.isNaN(from)) return true;
      const to = from + 24 * 60 * 60 * 1000;
      if (new Date(campaign.endAt).getTime() <= from) return false;
      if (new Date(campaign.startAt).getTime() >= to) return false;
    }
    return true;
  });
}

/**
 * §16A.5: a campaign's own placements, in the order the catalog lists them,
 * with `blog_*` keys folded onto the inline slot so the report does not count
 * one story slot per post.
 */
export function normalizedPlacementKeys(keys: string[], placements: AdPlacement[]): string[] {
  const resolved = keys
    .map((key) => resolvePlacementKey(key, placements))
    .filter((key): key is string => Boolean(key));
  return Array.from(new Set(resolved));
}

export { BLOG_INLINE_KEY };
