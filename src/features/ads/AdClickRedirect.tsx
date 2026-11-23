import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { readCreatives, recordAdEvent } from '../../lib/adStore';
import { resolveAdClick } from '../../lib/adClicks';

/**
 * Plan §16A.5: `/ad/click/<creative_id>` records the click and then redirects.
 * Recording here rather than in `AdSlot` means a copied or shared link still
 * counts once, and a creative that has since been deleted goes home rather
 * than to a dead end.
 */
export function AdClickRedirect() {
  const { creativeId = '' } = useParams<{ creativeId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const { url, creative } = resolveAdClick(creativeId, readCreatives());
    if (creative) {
      recordAdEvent({
        placementKey: params.get('p') ?? '',
        campaignId: creative.campaignId,
        creativeId: creative.id,
        kind: 'click',
        sessionHash: params.get('s') ?? `click-${creative.id}`,
      });
    }
    if (/^https:\/\//.test(url)) window.location.replace(url);
    else navigate(url, { replace: true });
  }, [creativeId, params, navigate]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-xs text-text-muted">{t('ad_click_redirecting')}</p>
    </div>
  );
}
