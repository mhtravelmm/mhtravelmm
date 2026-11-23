import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useLanguage } from '../../lib/i18n';
import { placementByKey } from '../../lib/adPlacements';
import { readAdSettings, readPlacements, recordAdEvent, serveAdNow } from '../../lib/adStore';
import {
  IMPRESSION_VISIBLE_MS,
  IMPRESSION_VISIBLE_RATIO,
  newSessionHash,
} from '../../lib/adStats';

export type AdCreative = {
  id: string;
  type: 'image' | 'video';
  mediaUrl: string;
  clickThroughUrl: string;
  advertiser: string;
  /** §16A.8: alt text in both languages replaces the generic label. */
  altMm?: string;
  altEn?: string;
  campaignId?: string;
  placementKey?: string;
};

interface AdSlotProps {
  /** Identifies this slot for the per-page ad on/off toggle and analytics */
  placement: string;
  /**
   * Fetches the ad to show for this placement, in priority order:
   * Admin Ads -> Google AdSense/AdMob. Returns null when nothing is
   * available, in which case this component renders nothing and the
   * layout reflows — never an empty placeholder box.
   */
  fetchAd?: (placement: string) => Promise<AdCreative | null>;
  /** Escape hatch for a design-time placeholder in Storybook/dev only */
  devPlaceholder?: ReactNode;
}

/** Plan §16A.5: the default serving call reads the same rows the Adsboard writes. */
async function serveFromStore(placement: string): Promise<AdCreative | null> {
  const ad = serveAdNow(placement);
  if (!ad) return null;
  return {
    id: ad.id,
    type: ad.type,
    mediaUrl: ad.mediaUrl,
    clickThroughUrl: ad.clickThroughUrl,
    advertiser: ad.advertiser,
    altMm: ad.altMm,
    altEn: ad.altEn,
    campaignId: ad.campaignId,
    placementKey: ad.placementKey,
  };
}

/**
 * §16A.1: the middle step. A placement that allows fallback and has an AdSense
 * client configured asks AdSense; with no client the step is skipped, which is
 * why the fallback stays off until the founder supplies the ids (§16A.12).
 */
function AdSenseSlot({ placement }: { placement: string }) {
  const { language } = useLanguage();
  const settings = readAdSettings();
  const pushed = useRef(false);

  useEffect(() => {
    if (!settings.adsenseClient || pushed.current) return;
    const existing = document.querySelector<HTMLScriptElement>('script[data-mh-adsense]');
    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.dataset.mhAdsense = 'true';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(settings.adsenseClient)}`;
      document.head.appendChild(script);
    }
    try {
      const ads = ((window as unknown as { adsbygoogle?: unknown[] }).adsbygoogle ??= []);
      ads.push({});
      pushed.current = true;
    } catch {
      // A blocked script leaves the slot empty, which is the collapse step.
    }
  }, [settings.adsenseClient]);

  return (
    <div className="overflow-hidden rounded-lg" data-ad-placement={placement} data-ad-source="adsense">
      <ins
        className="adsbygoogle block"
        style={{ display: 'block' }}
        data-ad-client={settings.adsenseClient}
        data-ad-slot={settings.adsenseSlotHome}
        data-full-width-responsive="true"
      />
      <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-text-faint">
        {language === 'mm' ? 'ကြော်ငြာ' : 'Sponsored'}
      </span>
    </div>
  );
}

/**
 * Renders an ad at a natural break point in the layout. If no ad is available
 * (Admin Ads and AdSense/AdMob both empty, or the placement is switched off),
 * this collapses to nothing — no empty box is ever shown.
 *
 * §16A.5: an impression is counted once the ad is at least half visible for a
 * second, once per creative per session per page view; a click is counted as
 * the link opens. Both refusals (bot, repeat) happen inside the store.
 */
export function AdSlot({ placement, fetchAd = serveFromStore, devPlaceholder }: AdSlotProps) {
  const { language } = useLanguage();
  const [ad, setAd] = useState<AdCreative | null | 'loading'>('loading');
  const linkRef = useRef<HTMLAnchorElement | null>(null);
  const sessionRef = useRef('');
  if (!sessionRef.current) sessionRef.current = newSessionHash();

  useEffect(() => {
    let cancelled = false;
    setAd('loading');
    fetchAd(placement).then((result) => {
      if (!cancelled) setAd(result);
    });
    return () => {
      cancelled = true;
    };
  }, [placement, fetchAd]);

  const served = ad === 'loading' ? null : ad;

  useEffect(() => {
    const node = linkRef.current;
    if (!served || !node || typeof IntersectionObserver === 'undefined') return;
    let timer: number | undefined;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const visibleEnough = entry.intersectionRatio >= IMPRESSION_VISIBLE_RATIO;
      if (visibleEnough && timer === undefined) {
        timer = window.setTimeout(() => {
          recordAdEvent({
            placementKey: served.placementKey ?? placement,
            campaignId: served.campaignId ?? '',
            creativeId: served.id,
            kind: 'impression',
            sessionHash: sessionRef.current,
          });
        }, IMPRESSION_VISIBLE_MS);
      } else if (!visibleEnough && timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    }, { threshold: [0, IMPRESSION_VISIBLE_RATIO, 1] });
    observer.observe(node);
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [served, placement]);

  if (served === null) {
    // §16A.1 step 2: Admin Ads, then AdSense, then collapse.
    const placementRow = placementByKey(placement, readPlacements());
    const settings = readAdSettings();
    if (placementRow?.active && placementRow.fallbackAllowed && settings.adsenseClient.trim()) {
      return <AdSenseSlot placement={placement} />;
    }
    if (import.meta.env.DEV && devPlaceholder) {
      return (
        <div className="rounded-lg border border-ad-border bg-ad-bg px-3 py-2.5 text-center text-[10px] text-ad-text">
          {devPlaceholder}
        </div>
      );
    }
    return null;
  }

  const altText = (language === 'mm' ? served.altMm : served.altEn) || served.advertiser;

  return (
    <a
      ref={linkRef}
      href={served.clickThroughUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      aria-label={`Sponsored: ${served.advertiser}`}
      onClick={() => {
        recordAdEvent({
          placementKey: served.placementKey ?? placement,
          campaignId: served.campaignId ?? '',
          creativeId: served.id,
          kind: 'click',
          sessionHash: sessionRef.current,
        });
      }}
      className="block overflow-hidden rounded-lg"
      data-ad-placement={placement}
      data-advertiser={served.advertiser}
    >
      {served.type === 'image' ? (
        <img src={served.mediaUrl} alt={altText} className="w-full" />
      ) : (
        <video src={served.mediaUrl} autoPlay muted loop playsInline aria-label={altText} className="w-full" />
      )}
      <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-text-faint">
        {language === 'mm' ? 'ကြော်ငြာ' : 'Sponsored'}
      </span>
    </a>
  );
}
