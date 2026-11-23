import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adBeaconBody, adBeaconEndpoint, recordAdEventWithBeacon } from './adBeacon';
import { readAdEvents } from './adStore';

type Sent = { url: string; blob: Blob };

function fakeWindow(beacon?: (url: string, blob: Blob) => boolean) {
  const map = new Map<string, string>();
  const sent: Sent[] = [];
  (globalThis as { window?: unknown }).window = {
    localStorage: {
      getItem: (key: string) => map.get(key) ?? null,
      setItem: (key: string, value: string) => { map.set(key, value); },
      removeItem: (key: string) => { map.delete(key); },
      clear: () => map.clear(),
      key: () => null,
      get length() { return map.size; },
    },
    dispatchEvent: () => true,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  };
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      userAgent: 'Mozilla/5.0 (Macintosh) Safari/605.1',
      sendBeacon: beacon
        ? (url: string, blob: Blob) => {
            sent.push({ url, blob });
            return beacon(url, blob);
          }
        : undefined,
    },
    configurable: true,
    writable: true,
  });
  return sent;
}

beforeEach(() => { fakeWindow(); });

const event = {
  placementKey: 'home_hero',
  campaignId: 'camp-1',
  creativeId: 'cr-1',
  kind: 'impression' as const,
  sessionHash: 'sess-1',
};

describe('adBeaconEndpoint', () => {
  it('is unset until the Worker URL is configured', () => {
    expect(adBeaconEndpoint()).toBeUndefined();
  });
});

describe('adBeaconBody', () => {
  it('carries only what the server needs, with no reader identity', () => {
    const body = JSON.parse(adBeaconBody(event)) as Record<string, unknown>;
    expect(body).toEqual({
      placementKey: 'home_hero',
      campaignId: 'camp-1',
      creativeId: 'cr-1',
      kind: 'impression',
      sessionHash: 'sess-1',
    });
  });
});

describe('recordAdEventWithBeacon', () => {
  it('stores the event and sends nothing when there is no endpoint', () => {
    const result = recordAdEventWithBeacon(event, undefined);
    expect(result).toEqual({ stored: true, sent: false });
    expect(readAdEvents()).toHaveLength(1);
  });

  it('sends a beacon when the endpoint is set, so a closed tab still reports', async () => {
    const sent = fakeWindow(() => true);
    const result = recordAdEventWithBeacon(event, 'https://worker.example/ad/event');
    expect(result).toEqual({ stored: true, sent: true });
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe('https://worker.example/ad/event');
    expect(JSON.parse(await sent[0].blob.text())).toMatchObject({ creativeId: 'cr-1', kind: 'impression' });
  });

  it('sends nothing when the store refuses the event as a repeat', () => {
    const sent = fakeWindow(() => true);
    recordAdEventWithBeacon(event, 'https://worker.example/ad/event');
    const second = recordAdEventWithBeacon(event, 'https://worker.example/ad/event');
    expect(second).toEqual({ stored: false, sent: false });
    expect(sent).toHaveLength(1);
  });

  it('ignores a bot, so a crawler does not inflate the count', () => {
    const sent = fakeWindow(() => true);
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Googlebot/2.1', sendBeacon: () => true },
      configurable: true,
      writable: true,
    });
    const result = recordAdEventWithBeacon(event, 'https://worker.example/ad/event');
    expect(result).toEqual({ stored: false, sent: false });
    expect(sent).toHaveLength(0);
  });

  it('falls back to fetch when the beacon is refused', async () => {
    fakeWindow(() => false);
    const fetchSpy = vi.fn(async () => new Response(null, { status: 204 }));
    Object.defineProperty(globalThis, 'fetch', { value: fetchSpy, configurable: true, writable: true });
    const result = recordAdEventWithBeacon(event, 'https://worker.example/ad/event');
    expect(result).toEqual({ stored: true, sent: true });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
