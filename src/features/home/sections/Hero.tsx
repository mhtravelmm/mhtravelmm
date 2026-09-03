import { AdSlot } from '../../../components/ui/AdSlot';
import { fetchMockAd } from '../../../data/ads';

/**
 * The hero banner is an ad slot (Admin Ads / Google AdSense-AdMob), not
 * static branding copy — confirmed design decision. It collapses to
 * nothing if no ad is available for this placement.
 */
export function Hero() {
  return (
    <div className="mb-5">
      <AdSlot placement="home_hero" fetchAd={fetchMockAd} />
    </div>
  );
}
