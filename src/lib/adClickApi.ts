import { isSupabaseConfigured, supabase } from './supabase';

/**
 * Plan §16A.5: `/ad/click/<creative_id>` records the click and then redirects.
 * `record_ad_click()` in `20261125000200_ads_serving.sql` is the server half:
 * it writes the event and returns the target URL, so the redirect target comes
 * from the database rather than from a copy the browser holds.
 *
 * `undefined` means the RPC could not answer and the caller should resolve the
 * target locally; `null` means it answered and the creative no longer exists,
 * so the reader goes home.
 */
export type ClickRecorder = (
  creativeId: string,
  placementKey: string,
  sessionHash: string,
) => Promise<string | null | undefined>;

async function callRecordAdClick(
  creativeId: string,
  placementKey: string,
  sessionHash: string,
): Promise<string | null | undefined> {
  if (!isSupabaseConfigured || !supabase) return undefined;
  try {
    const { data, error } = await supabase.rpc('record_ad_click', {
      p_creative_id: creativeId,
      p_session_hash: sessionHash,
      p_placement_key: placementKey,
    });
    if (error) return undefined;
    return typeof data === 'string' && data.trim() !== '' ? data : null;
  } catch {
    return undefined;
  }
}

/**
 * Answers the URL to redirect to. The local store still records the click when
 * the RPC is unavailable, so a preview deployment keeps its reports.
 */
export async function recordAdClickRemotely(
  creativeId: string,
  placementKey: string,
  sessionHash: string,
  record: ClickRecorder = callRecordAdClick,
): Promise<string | null | undefined> {
  return record(creativeId, placementKey, sessionHash);
}
