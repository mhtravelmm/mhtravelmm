import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { readCreatives } from '../../lib/adStore';
import { recordAdEventWithBeacon } from '../../lib/adBeacon';
import { recordAdClickRemotely } from '../../lib/adClickApi';
import { resolveAdClick } from '../../lib/adClicks';

/**
 * Plan §16A.5: `/ad/click/<creative_id>` records the click and then redirects.
 * Recording here rather than in `AdSlot` means a copied or shared link still
 * counts once, and a creative that has since been deleted goes home rather
 * than to a dead end.
 *
 * The click is written twice on purpose: once to the local store and the
 * beacon, once to `record_ad_click()`. The RPC is the record of truth once the
 * migration is applied, and its answer is the redirect target, so a URL edited
 * in the Adsboard takes effect without a redeploy.
 */
export function AdClickRedirect() {
  const { creativeId = '' } = useParams<{ creativeId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;
    const placementKey = params.get('p') ?? '';
    const sessionHash = params.get('s') ?? `click-${creativeId}`;

    void (async () => {
      const { url, creative } = resolveAdClick(creativeId, readCreatives());
      if (creative) {
        recordAdEventWithBeacon({
          placementKey,
          campaignId: creative.campaignId,
          creativeId: creative.id,
          kind: 'click',
          sessionHash,
        });
      }
      const remoteUrl = await recordAdClickRemotely(creativeId, placementKey, sessionHash);
      if (cancelled) return;
      const target = remoteUrl ?? url;
      if (/^https:\/\//.test(target)) window.location.replace(target);
      else navigate(target, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [creativeId, params, navigate]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-xs text-text-muted">{t('ad_click_redirecting')}</p>
    </div>
  );
}
