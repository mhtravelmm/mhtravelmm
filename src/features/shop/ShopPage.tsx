import { Suspense, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Eye, LayoutTemplate } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useLanguage } from '../../lib/i18n';
import { recordAdminAudit } from '../../lib/adminAudit';
import { canPreviewTemplate, freeTemplateFor } from '../../lib/shopTemplates';
import {
  resolveTemplateForShop,
  shopCategory,
  shopIdForOwner,
  useTemplates,
} from '../../lib/shopTemplateStore';
import { shopPageData } from '../../templates/shopPageData';
import { templateModule } from '../../templates/registry';

/**
 * Plan §4: the public Shop Page. The route never changes when a template is
 * added — it resolves the template id, then asks the registry for the module.
 * A preview (`?preview=<template-id>`) renders another template on the same real
 * data, but only for the shop's own owner.
 */
export function ShopPage() {
  const { shopId = '' } = useParams<{ shopId: string }>();
  const [params] = useSearchParams();
  const { language, t } = useLanguage();
  const { user, isSuperAdmin } = useAuth();
  const templates = useTemplates();

  const data = shopPageData(shopId);
  const category = shopCategory(shopId);
  // Re-resolved on every render: `useTemplates()` is the change signal, and the
  // resolver reads the settings row that the template list does not carry.
  const resolved = resolveTemplateForShop(shopId);

  const previewId = params.get('preview');
  const ownerShopId = shopIdForOwner(user?.name ?? '');
  const previewTemplate = previewId ? templates.find((template) => template.id === previewId) : undefined;
  const mayPreview = Boolean(previewTemplate) && (canPreviewTemplate(ownerShopId, shopId) || isSuperAdmin);

  const free = category ? freeTemplateFor(templates, category) : undefined;
  const servedId = resolved.templateId || free?.id || '';
  const servedTemplate = templates.find((template) => template.id === servedId);
  const shownId = mayPreview && previewTemplate ? previewTemplate.id : servedId;
  const shownTemplate = mayPreview && previewTemplate ? previewTemplate : servedTemplate;
  const Template = templateModule(shownId);

  useEffect(() => {
    if (!mayPreview || !previewTemplate) return;
    recordAdminAudit({
      actor: user?.name ?? '',
      actorRole: isSuperAdmin ? 'Super Admin' : 'Owner Admin',
      action: 'preview',
      objectType: 'shop_template',
      objectId: previewTemplate.id,
      summary: shopId,
      source: 'templates',
    });
  }, [mayPreview, previewTemplate, shopId, user?.name, isSuperAdmin]);

  if (!data || !Template) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-text-muted">{t('shop_page_not_found')}</p>
        <Link to="/categories" className="mt-4 inline-block rounded-lg bg-brand-blueDark px-4 py-2 text-xs font-bold text-white">
          {t('shop_page_browse')}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-bg-card text-text-primary">
      {mayPreview && previewTemplate && (
        <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 bg-brand-navy px-4 py-2 text-white">
          <p className="flex items-center gap-1.5 text-[11px] font-bold">
            <Eye size={12} /> {t('owner_tpl_preview_only')}
          </p>
          <p className="flex items-center gap-1.5 text-[11px]">
            <LayoutTemplate size={12} /> {language === 'mm' ? previewTemplate.nameMm : previewTemplate.nameEn}
          </p>
          <Link to={`/shops/${shopId}`} className="rounded bg-bg-card/15 px-2 py-1 text-[10px] font-bold">
            {t('shop_page_exit_preview')}
          </Link>
        </div>
      )}

      {resolved.reason === 'entitlement_lapsed' && (
        <p className="bg-amber-50 px-4 py-2 text-center text-[11px] font-semibold text-amber-700">
          {t('owner_tpl_fallback')}
        </p>
      )}

      <Suspense fallback={<p className="px-4 py-16 text-center text-sm text-text-muted">{t('shop_page_loading')}</p>}>
        <Template data={data} language={language} t={t} />
      </Suspense>

      {shownTemplate && (
        <p className="border-t border-border px-4 py-3 text-center text-[10px] text-text-muted">
          {t('shop_page_template_credit')} · {shownTemplate.nameEn}
        </p>
      )}
    </div>
  );
}
