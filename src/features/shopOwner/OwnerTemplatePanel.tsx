import { useMemo, useState } from 'react';
import { CheckCircle2, Eye, LayoutTemplate, Palette, ShieldAlert } from 'lucide-react';
import type { TranslationKey } from '../../lib/i18n';
import { fill } from '../../lib/fill';
import { formatMmk } from '../../lib/moneyFormat';
import {
  TEMPLATE_PRICE_MMK_MONTH,
  canPreviewTemplate,
  entitlementForShop,
  entitlementStatus,
  freeTemplateFor,
  retirementDaysLeft,
  type ShopTemplate,
  type TemplateCategory,
} from '../../lib/shopTemplates';
import {
  applyShopTemplate,
  cancelShopTemplate,
  recordTemplateApply,
  resolveTemplateForShop,
  shopCategory,
  templateSessionHash,
  useEntitlements,
  usePageSettings,
  useTemplates,
} from '../../lib/shopTemplateStore';

type Translate = (key: TranslationKey) => string;

/**
 * Plan §4, the owner's template selector. It shows Free or Paid, the 2,000 MMK
 * price, the active template, a preview, apply or switch, and the subscription
 * status — and it is deliberately separate from the business-data screens,
 * because a template changes appearance only.
 */
export function OwnerTemplatePanel({ shopId, t }: { shopId: string; t: Translate }) {
  const templates = useTemplates();
  const settings = usePageSettings();
  const entitlements = useEntitlements();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const category: TemplateCategory = shopCategory(shopId) ?? 'hotel';
  const row = settings.find((candidate) => candidate.shopId === shopId);
  const ent = entitlementForShop(entitlements, shopId);
  const state = entitlementStatus(ent);
  const resolved = resolveTemplateForShop(shopId);

  const choices = useMemo(
    () => templates.filter((template) => template.category === category && template.status !== 'draft'),
    [templates, category],
  );
  const active = templates.find((template) => template.id === row?.activeTemplateId);
  const served = templates.find((template) => template.id === resolved.templateId);
  const free = freeTemplateFor(templates, category);
  const previewing = previewId ? templates.find((template) => template.id === previewId) : undefined;
  const mayPreview = canPreviewTemplate(shopId, shopId);
  const shopHref = `/shops/${shopId}`;

  function apply(template: ShopTemplate) {
    const result = applyShopTemplate(shopId, template.id);
    if (!result.ok) {
      setNotice(result.reason === 'needs_payment' ? t('owner_tpl_needs_payment') : t('owner_tpl_not_active'));
      return;
    }
    // §4 analytics: only a switch that moved the shop is an apply, so a
    // refused or repeated choice does not inflate the catalog report.
    if (result.switchedFrom !== template.id) {
      recordTemplateApply({ templateId: template.id, shopId, sessionHash: templateSessionHash() });
    }
    setPreviewId(null);
    setNotice(fill(t('owner_tpl_applied'), { name: templateName(template, t) }));
  }

  function backToFree() {
    cancelShopTemplate(shopId);
    setPreviewId(null);
    setNotice(t('owner_tpl_cancelled'));
  }

  function templateName(template: ShopTemplate, translate: Translate): string {
    return template.nameEn === translate('st_free') ? template.nameEn : `${template.nameEn} · ${template.nameMm}`;
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-3">
      <section className="rounded-xl border border-[#dce5f0] bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#e7edf4] px-3 py-2">
          <LayoutTemplate size={17} className="text-[#147bea]" />
          <h2 className="text-sm font-bold text-[#0b2147]">{t('owner_tpl_title')}</h2>
        </div>
        <div className="space-y-3 p-3">
          <p className="text-xs text-slate-600">{t('owner_tpl_intro')}</p>

          {notice && (
            <p className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-[11px] font-semibold text-green-700">{notice}</p>
          )}

          {resolved.reason === 'entitlement_lapsed' && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
              {t('owner_tpl_fallback')}
            </p>
          )}
          {resolved.noticeEndsOn && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700">
              {fill(t('owner_tpl_notice'), { day: resolved.noticeEndsOn })}
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-[#dce5f0] bg-[#f4f8fc] p-3">
              <p className="text-[10px] font-bold text-slate-600">{t('owner_tpl_current')}</p>
              <p className="mt-1 text-sm font-extrabold text-[#0b2147]">{served ? served.nameEn : '—'}</p>
              <p className="mt-0.5 text-[10px] text-slate-600">{served ? served.nameMm : ''}</p>
            </div>
            <div className="rounded-lg border border-[#dce5f0] bg-[#f4f8fc] p-3">
              <p className="text-[10px] font-bold text-slate-600">{t('owner_tpl_status')}</p>
              <p className={`mt-1 text-sm font-extrabold ${state === 'active' ? 'text-green-700' : state === 'grace' ? 'text-amber-700' : 'text-red-700'}`}>
                {entitlementText(state, t)}
              </p>
              {ent && <p className="mt-0.5 text-[10px] text-slate-600">{ent.periodEnd.slice(0, 10)}</p>}
            </div>
            <div className="rounded-lg border border-[#dce5f0] bg-[#f4f8fc] p-3">
              <p className="text-[10px] font-bold text-slate-600">{t('owner_tpl_period_end')}</p>
              <p className="mt-1 text-sm font-extrabold text-[#0b2147]">{ent?.periodEnd.slice(0, 10) ?? '—'}</p>
              <p className="mt-0.5 text-[10px] text-slate-600">{formatMmk(TEMPLATE_PRICE_MMK_MONTH)}</p>
            </div>
          </div>

          {active && active.status === 'retired' && (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
              <ShieldAlert size={13} /> {fill(t('owner_tpl_notice'), { day: String(retirementDaysLeft(active)) })}
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {choices.map((template) => {
              const isActive = template.id === row?.activeTemplateId;
              return (
                <div key={template.id} className={`rounded-lg border p-3 ${isActive ? 'border-[#147bea] bg-[#eaf5ff]' : 'border-[#dce5f0] bg-white'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[#0b2147]">{template.nameEn}</p>
                      <p className="text-[10px] text-slate-600">{template.nameMm}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${template.isFree ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {template.isFree ? t('owner_tpl_free_badge') : fill(t('owner_tpl_paid_badge'), { price: formatMmk(template.priceMmkMonth) })}
                    </span>
                  </div>

                  {previewing?.id === template.id && (
                    <div className="mt-2 rounded-lg border border-[#75b8f0] bg-white p-2">
                      <p className="text-[10px] font-bold text-[#147bea]">{t('owner_tpl_preview_only')}</p>
                      <div className="mt-1 space-y-1">
                        <div className="h-6 rounded bg-[#eaf5ff]" />
                        <div className="grid grid-cols-3 gap-1">
                          <div className="h-8 rounded bg-[#f4f8fc]" />
                          <div className="h-8 rounded bg-[#f4f8fc]" />
                          <div className="h-8 rounded bg-[#f4f8fc]" />
                        </div>
                        <p className="text-[9px] text-slate-600">{template.traits.layout} · {template.traits.navigation} · {template.traits.hero}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <a
                      href={`${shopHref}?preview=${template.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#dce5f0] bg-white px-2 py-1 text-[10px] font-bold text-[#18375e] hover:border-[#75b8f0]"
                    >
                      <Eye size={11} /> {t('owner_tpl_preview')}
                    </a>
                    <button
                      type="button"
                      onClick={() => setPreviewId(previewing?.id === template.id ? null : template.id)}
                      disabled={!mayPreview}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#dce5f0] bg-white px-2 py-1 text-[10px] font-bold text-[#18375e] hover:border-[#75b8f0] disabled:opacity-40"
                    >
                      <LayoutTemplate size={11} /> {t('owner_tpl_compare')}
                    </button>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-brand-blueDark px-2 py-1 text-[10px] font-bold text-white">
                        <CheckCircle2 size={11} /> {t('owner_tpl_active_badge')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => apply(template)}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-blueDark px-2 py-1 text-[10px] font-bold text-white hover:bg-[#1e4bb8]"
                      >
                        <Palette size={11} /> {active ? t('owner_tpl_switch') : t('owner_tpl_apply')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {free && row?.activeTemplateId !== free.id && (
            <button
              type="button"
              onClick={backToFree}
              className="rounded-lg border border-[#dce5f0] bg-white px-3 py-1.5 text-[11px] font-bold text-[#18375e] hover:border-[#75b8f0]"
            >
              {t('owner_tpl_cancel')}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function entitlementText(state: string, t: Translate): string {
  if (state === 'active') return t('st_entitlement_active');
  if (state === 'grace') return t('st_entitlement_grace');
  if (state === 'cancelled') return t('st_entitlement_cancelled');
  return t('st_entitlement_expired');
}
