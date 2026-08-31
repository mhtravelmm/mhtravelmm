import { useEffect, useState, type ReactNode } from 'react';

export type AdCreative = {
  id: string;
  type: 'image' | 'video';
  mediaUrl: string;
  clickThroughUrl: string;
  advertiser: string;
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

/**
 * Renders an ad at a natural break point in the layout. If no ad is
 * available (Admin Ads and AdSense/AdMob both empty, or the page-level
 * toggle for this placement is off), this collapses to nothing — no
 * empty box is ever shown.
 */
export function AdSlot({ placement, fetchAd, devPlaceholder }: AdSlotProps) {
  const [ad, setAd] = useState<AdCreative | null | 'loading'>('loading');

  useEffect(() => {
    let cancelled = false;
    if (!fetchAd) {
      setAd(null);
      return;
    }
    fetchAd(placement).then((result) => {
      if (!cancelled) setAd(result);
    });
    return () => {
      cancelled = true;
    };
  }, [placement, fetchAd]);

  if (ad === 'loading' || ad === null) {
    if (import.meta.env.DEV && devPlaceholder) {
      return (
        <div className="rounded-lg border border-ad-border bg-ad-bg px-3 py-2.5 text-center text-[10px] text-ad-text">
          {devPlaceholder}
        </div>
      );
    }
    return null;
  }

  return (
    <a
      href={ad.clickThroughUrl}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="block overflow-hidden rounded-lg"
      data-ad-placement={placement}
      data-advertiser={ad.advertiser}
    >
      {ad.type === 'image' ? (
        <img src={ad.mediaUrl} alt={`Ad by ${ad.advertiser}`} className="w-full" />
      ) : (
        <video src={ad.mediaUrl} autoPlay muted loop playsInline className="w-full" />
      )}
    </a>
  );
}
