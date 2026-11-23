import type { AdCreativeRow } from './adCampaigns';

/**
 * Plan §16A.5: a click goes through `/ad/click/<creative_id>`, which records it
 * and redirects. The lookup is pure so the redirect page and its test agree on
 * what happens to a creative that was deleted or never existed: nothing to
 * record, and the reader goes home instead of a dead end.
 */
export type ClickResolution = {
  /** Where the browser goes next. */
  url: string;
  /** The row that was found, or null when the id is unknown. */
  creative: AdCreativeRow | null;
};

export function resolveAdClick(creativeId: string, creatives: AdCreativeRow[], home = '/'): ClickResolution {
  const creative = creatives.find((row) => row.id === creativeId) ?? null;
  if (!creative || !creative.clickUrl.trim()) return { url: home, creative: null };
  return { url: creative.clickUrl, creative };
}

/** The link `AdSlot` renders, so the click is counted before the reader leaves. */
export function clickThroughHref(creativeId: string, placementKey: string, sessionHash: string): string {
  const params = new URLSearchParams({ p: placementKey, s: sessionHash });
  return `/ad/click/${encodeURIComponent(creativeId)}?${params.toString()}`;
}
