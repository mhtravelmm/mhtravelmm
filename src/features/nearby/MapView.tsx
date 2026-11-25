import { useEffect, useRef, useState } from 'react';
import type { NearbyItem } from '../../lib/nearbyApi';

/**
 * Plan §16H.9: "The map library loads only when the Map view opens, so the list
 * view stays light." That is the whole reason this file exists rather than a
 * map at the top of the page: Leaflet is imported inside `useEffect`, so the
 * bundle that ships to a reader who never opens the map has none of it.
 *
 * The tile provider is chosen in launch readiness (Phase 6). Until then the
 * component draws the pins over a plain background and says so, rather than
 * pointing at a provider nobody has agreed to pay for.
 */

interface MapViewProps {
  items: NearbyItem[];
  center: { lat: number; lng: number };
  /** `null` while the library is still loading, `false` when it could not. */
  onReadyChange?: (ready: boolean | null) => void;
  selected: string | null;
  onSelect: (refId: string) => void;
  labels: { loading: string; unavailable: string; hint: string };
}

/** The tile URL the launch-readiness decision will replace. Empty means none. */
const TILE_URL = '';

export function MapView({ items, center, onReadyChange, selected, onSelect, labels }: MapViewProps) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<unknown>(null);
  const markers = useRef<Map<string, unknown>>(new Map());
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  useEffect(() => {
    let active = true;
    const pins = markers.current;
    setStatus('loading');
    onReadyChange?.(null);

    void (async () => {
      try {
        const leaflet = await import('leaflet');
        // Leaflet's own stylesheet is imported with the library, so the list
        // view does not pay for it either.
        await import('leaflet/dist/leaflet.css');
        if (!active || !container.current) return;

        const instance = leaflet.map(container.current, {
          center: [center.lat, center.lng],
          zoom: 12,
          zoomControl: true,
          attributionControl: Boolean(TILE_URL),
        });
        if (TILE_URL) {
          leaflet.tileLayer(TILE_URL, { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(instance);
        }
        map.current = instance;
        setStatus('ready');
        onReadyChange?.(true);
      } catch {
        if (!active) return;
        setStatus('unavailable');
        onReadyChange?.(false);
      }
    })();

    return () => {
      active = false;
      const instance = map.current as { remove?: () => void } | null;
      instance?.remove?.();
      map.current = null;
      pins.clear();
    };
    // The map is created once; later props are applied by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const instance = map.current as { setView?: (center: [number, number]) => void } | null;
    instance?.setView?.([center.lat, center.lng]);
  }, [center.lat, center.lng]);

  useEffect(() => {
    if (status !== 'ready') return;
    let cancelled = false;
    void (async () => {
      const leaflet = await import('leaflet');
      const instance = map.current as { removeLayer?: (layer: unknown) => void } | null;
      if (!instance || cancelled) return;

      // Only the pins that are gone are removed, so a re-render does not make
      // every marker blink.
      const live = new Set(items.map((item) => item.ref_id));
      for (const [refId, marker] of markers.current) {
        if (live.has(refId)) continue;
        instance.removeLayer?.(marker);
        markers.current.delete(refId);
      }

      for (const item of items) {
        const existing = markers.current.get(item.ref_id) as { setStyle?: (style: object) => void } | undefined;
        if (existing) {
          // The pin is already drawn; only the chosen one changes, so a
          // selection does not rebuild the map.
          existing.setStyle?.(pinStyle(selected === item.ref_id));
          continue;
        }
        const point = itemPoint(item);
        if (!point) continue;
        const marker = leaflet
          .circleMarker([point.lat, point.lng], pinStyle(selected === item.ref_id))
          .addTo(instance as never)
          .on('click', () => onSelect(item.ref_id));
        markers.current.set(item.ref_id, marker);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [items, onSelect, selected, status]);

  return (
    <div className="relative">
      <div ref={container} className="h-[320px] w-full overflow-hidden rounded-card border border-border bg-bg-cardAlt sm:h-[420px]" />
      {status !== 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center rounded-card bg-bg-cardAlt/90 px-4 text-center text-[11px] text-text-muted">
          {status === 'loading' ? labels.loading : labels.unavailable}
        </div>
      )}
      {status === 'ready' && <p className="mt-1.5 text-[10px] text-text-faint">{labels.hint}</p>}
    </div>
  );
}

/** The chosen pin is larger and blue, so the card and the map name one place. */
function pinStyle(chosen: boolean): { radius: number; color: string; weight: number; fillColor: string; fillOpacity: number } {
  return {
    radius: chosen ? 10 : 7,
    color: chosen ? '#168df4' : '#0f172a',
    weight: 2,
    fillColor: chosen ? '#168df4' : '#38bdf8',
    fillOpacity: chosen ? 0.95 : 0.85,
  };
}

/** A row with no pin is not drawn, rather than drawn at 0,0 in the Gulf of Guinea. */
function itemPoint(item: NearbyItem): { lat: number; lng: number } | null {
  if (item.latitude === null || item.longitude === null) return null;
  if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) return null;
  return { lat: item.latitude, lng: item.longitude };
}
