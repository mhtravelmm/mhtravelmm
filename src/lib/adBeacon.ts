import { recordAdEvent } from './adStore';
import type { AdEventKind } from './adStats';

/**
 * Plan §16A.5: an impression is counted when the ad has been half visible for
 * a second, and a click is counted as the link opens. The store is the local
 * record; this module is the outbound copy, so a page that is closed before
 * the request finishes still reports the event.
 *
 * `navigator.sendBeacon` is the only transport that survives a tab close, so it
 * is tried first. It cannot carry an `Authorization` header, which is why the
 * payload is the placement, the creative and the session hash and nothing that
 * needs a signed-in reader. When there is no beacon — or the endpoint is not
 * configured — the event stays local and the return value says so.
 */

export type AdBeaconEvent = {
  placementKey: string;
  campaignId: string;
  creativeId: string;
  kind: AdEventKind;
  sessionHash: string;
};

export function adBeaconEndpoint(): string | undefined {
  const value = import.meta.env.VITE_AD_EVENT_ENDPOINT as string | undefined;
  return value && value.trim() !== '' ? value.trim() : undefined;
}

/** The request body is small enough for a beacon's 64 KB budget by design. */
export function adBeaconBody(event: AdBeaconEvent): string {
  return JSON.stringify({
    placementKey: event.placementKey,
    campaignId: event.campaignId,
    creativeId: event.creativeId,
    kind: event.kind,
    sessionHash: event.sessionHash,
  });
}

/**
 * Records the event locally and, when an endpoint is configured, sends the
 * beacon. Answers which half happened so the caller can tell "stored only"
 * from "sent", and never throws: an ad counter must not break a page.
 */
export function recordAdEventWithBeacon(
  event: AdBeaconEvent,
  endpoint: string | undefined = adBeaconEndpoint(),
): { stored: boolean; sent: boolean } {
  const stored = recordAdEvent(event);
  if (!stored || !endpoint) return { stored, sent: false };
  if (typeof navigator === 'undefined') return { stored, sent: false };

  const body = adBeaconBody(event);
  try {
    if (typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(endpoint, blob)) return { stored, sent: true };
    }
  } catch {
    // A refused beacon is not an error the reader should see.
  }

  try {
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined);
    return { stored, sent: true };
  } catch {
    return { stored, sent: false };
  }
}
