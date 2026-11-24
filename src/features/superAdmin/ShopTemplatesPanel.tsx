import { useMemo, useState } from 'react';
import { BadgeCheck, Layers, PlayCircle, RotateCcw, ShieldOff } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useAuth } from '../../lib/auth';
import { fill } from '../../lib/fill';
import { formatMmk } from '../../lib/moneyFormat';
import { recordAdminAudit } from '../../lib/adminAudit';
import { canSetCommission } from '../../lib/adminWorkspace';
import { entitlementForShop, entitlementStatus, resolveShopTemplate, templateProblems } from '../../lib/shopTemplates';
import {
  payForTemplate,
  setTemplateStatus,
  useEntitlements,
  usePageSettings,
  useTemplateInvoices,
  useTemplates,
} from '../../lib/shopTemplateStore';

/**
 * Plan §4: Platform Admin controls the catalog — availability, versioning,
 * pricing, retirement and rollback. §16B.1 gives "Payments, payouts, exchange
 * rates" to Super Admin and Payment Admin, so both may record a payment; only
 * Super Admin owns the catalog, which is the same check the audit log uses.
 */
export function ShopTemplatesPanel() {
  const { t, language } = useLanguage();
  const { user, adminRole } = useAuth();
  const templates = useTemplates();
  const settings = usePageSettings();
  const entitlements = useEntitlements();
  const invoices = useTemplateInvoices();
  const [notice, setNotice] = useState('');

  const mayEditCatalog = adminRole === 'Super Admin';
  const mayRecordPayment = canSetCommission(adminRole);

  const problems = useMemo(() => templateProblems(templates), [templates]);
  const shops = useMemo(
    () => [...new Set(settings.map((row) => row.shopId))].sort(),
    [settings],
  );
  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of settings) counts.set(row.activeTemplateId, (counts.get(row.activeTemplateId) ?? 0) + 1);
    return counts;
  }, [settings]);

  function changeStatus(templateId: string, status: 'active' | 'retired' | 'draft') {
    if (!mayEditCatalog) return;
    setTemplateStatus(templateId, status);
    recordAdminAudit({
      actor: user?.name ?? '',
      actorRole: adminRole ?? 'system',
      action: status === 'retired' ? 'deleted' : 'updated',
      objectType: 'shop_template',
      objectId: templateId,
      summary:
        status === 'retired'
          ? t('st_audit_retired')
          : status === 'draft'
            ? t('st_audit_rolled_back')
            : t('st_audit_activated'),
      source: 'templates',
    });
    setNotice(
      status === 'retired' ? t('st_audit_retired') : status === 'draft' ? t('st_audit_rolled_back') : t('st_audit_activated'),
    );
  }

  function recordPayment(shopId: string, templateId: string) {
    if (!mayRecordPayment) return;
    const invoice = payForTemplate(shopId, templateId, user?.name ?? '');
    if (!invoice) return;
    recordAdminAudit({
      actor: user?.name ?? '',
      actorRole: adminRole ?? 'system',
      action: 'payment',
      objectType: 'template_entitlement',
      objectId: `${shopId}:${templateId}`,
      summary: `${invoice.amountMmk} MMK`,
      source: 'templates',
    });
    setNotice(
      fill(t('st_pay_done'), {
        shop: shopId,
        amount: formatMmk(invoice.amountMmk),
      }),
    );
  }

  return (
    <div className="mx-auto max-w-[1150px] space-y-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">{t('st_kicker')}</p>
        <h1 className="mt-1 text-lg font-extrabold sm:text-3xl">{t('st_title')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">{t('st_intro')}</p>
      </div>

      {notice && <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">{notice}</p>}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t('st_stat_live')} value={String(templates.filter((row) => row.status === 'active').length)} icon={BadgeCheck} />
        <Stat label={t('st_stat_draft')} value={String(templates.filter((row) => row.status === 'draft').length)} icon={Layers} />
        <Stat label={t('st_stat_retired')} value={String(templates.filter((row) => row.status === 'retired').length)} icon={ShieldOff} />
        <Stat label={t('st_stat_free')} value={String(templates.filter((row) => row.isFree).length)} icon={Layers} />
      </div>

      <Section title={t('st_section_catalog')}>
        <table className="w-full min-w-[620px] text-left text-[10px]">
          <thead className="text-slate-300">
            <tr>
              {[t('st_col_name'), t('st_col_category'), t('st_col_version'), t('st_col_price'), t('st_col_status'), t('st_col_shops'), ''].map(
                (cell, index) => (
                  <th key={`${cell}-${index}`} className="px-2 py-1.5 font-semibold">
                    {cell}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id} className="border-t border-[#1d3a5c]">
                <td className="px-2 py-1.5 text-slate-100">
                  {language === 'mm' ? template.nameMm : template.nameEn}
                  <span className="ml-1 text-slate-500">{template.id}</span>
                </td>
                <td className="px-2 py-1.5 text-slate-300">{template.category}</td>
                <td className="px-2 py-1.5 text-slate-300">v{template.version}</td>
                <td className="px-2 py-1.5 text-slate-300">
                  {template.isFree ? t('st_free') : formatMmk(template.priceMmkMonth)}
                </td>
                <td className="px-2 py-1.5">
                  <span className={statusTone(template.status)}>{statusLabel(template.status, t)}</span>
                </td>
                <td className="px-2 py-1.5 text-slate-300">{usage.get(template.id) ?? 0}</td>
                <td className="px-2 py-1.5">
                  <div className="flex flex-wrap justify-end gap-1">
                    {template.status !== 'active' && (
                      <button
                        type="button"
                        disabled={!mayEditCatalog}
                        onClick={() => changeStatus(template.id, 'active')}
                        className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-500 disabled:opacity-30"
                      >
                        <PlayCircle size={10} /> {t('st_activate')}
                      </button>
                    )}
                    {template.status === 'active' && (
                      <>
                        <button
                          type="button"
                          disabled={!mayEditCatalog}
                          onClick={() => changeStatus(template.id, 'draft')}
                          className="inline-flex items-center gap-1 rounded bg-slate-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-slate-500 disabled:opacity-30"
                        >
                          <RotateCcw size={10} /> {t('st_rollback')}
                        </button>
                        <button
                          type="button"
                          disabled={!mayEditCatalog}
                          onClick={() => changeStatus(template.id, 'retired')}
                          className="inline-flex items-center gap-1 rounded bg-amber-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-amber-500 disabled:opacity-30"
                        >
                          <ShieldOff size={10} /> {t('st_retire')}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[10px] text-slate-500">{t('st_retire_hint')}</p>
      </Section>

      <Section title={t('st_section_checks')}>
        {problems.length === 0 ? (
          <p className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-[10px] text-emerald-200">
            {t('st_checks_ok')}
          </p>
        ) : (
          <ul className="space-y-1 text-[10px] text-amber-200">
            {problems.map((problem) => (
              <li key={problem} className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-1">
                {problem}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title={t('st_section_shops')}>
        {shops.length === 0 ? (
          <Empty text={t('st_empty')} />
        ) : (
          <table className="w-full min-w-[620px] text-left text-[10px]">
            <thead className="text-slate-300">
              <tr>
                {[t('po_col_shop'), t('st_col_owner'), t('st_col_active'), t('st_col_resolved'), t('st_col_entitlement'), t('st_col_period_end'), t('st_section_pay')].map(
                  (cell, index) => (
                    <th key={`${cell}-${index}`} className="px-2 py-1.5 font-semibold">
                      {cell}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {shops.map((shopId) => {
                const row = settings.find((candidate) => candidate.shopId === shopId);
                const ent = entitlementForShop(entitlements, shopId);
                const active = templates.find((template) => template.id === row?.activeTemplateId);
                const resolved = resolveShopTemplate({
                  templates,
                  settings: row ?? { shopId, ownerName: '', activeTemplateId: '', appliedAt: '' },
                  entitlement: ent,
                  category: active?.category,
                });
                const served = templates.find((template) => template.id === resolved.templateId);
                const state = entitlementStatus(ent);
                return (
                  <tr key={shopId} className="border-t border-[#1d3a5c]">
                    <td className="px-2 py-1.5 text-slate-100">{shopId}</td>
                    <td className="px-2 py-1.5 text-slate-300">{row?.ownerName || '—'}</td>
                    <td className="px-2 py-1.5 text-slate-300">
                      {active ? (language === 'mm' ? active.nameMm : active.nameEn) : '—'}
                    </td>
                    <td className="px-2 py-1.5 text-slate-300">
                      {served ? (language === 'mm' ? served.nameMm : served.nameEn) : '—'}
                      <span className="ml-1 text-slate-500">{reasonLabel(resolved.reason, t)}</span>
                      {resolved.noticeEndsOn && (
                        <span className="ml-1 text-amber-300">
                          {fill(t('st_notice_ends'), { day: resolved.noticeEndsOn })}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1.5">
                      <span className={entTone(state)}>{entitlementLabel(state, t)}</span>
                    </td>
                    <td className="px-2 py-1.5 text-slate-300">{ent?.periodEnd.slice(0, 10) ?? '—'}</td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        disabled={!mayRecordPayment || !active || active.isFree}
                        onClick={() => active && recordPayment(shopId, active.id)}
                        className="rounded bg-[#147bea] px-2 py-1 text-[10px] font-bold text-white hover:bg-[#0b63c4] disabled:opacity-30"
                      >
                        {t('st_pay_button')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      <Section title={t('st_section_invoices')}>
        {invoices.length === 0 ? (
          <Empty text={t('st_empty')} />
        ) : (
          <table className="w-full min-w-[520px] text-left text-[10px]">
            <thead className="text-slate-300">
              <tr>
                {[t('st_col_invoice'), t('po_col_shop'), t('st_col_amount'), t('st_col_paid_at'), t('st_col_recorded_by')].map((cell, index) => (
                  <th key={`${cell}-${index}`} className="px-2 py-1.5 font-semibold">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...invoices]
                .sort((a, b) => (b.paidAt ?? '').localeCompare(a.paidAt ?? ''))
                .map((invoice) => (
                  <tr key={invoice.id} className="border-t border-[#1d3a5c]">
                    <td className="px-2 py-1.5 text-slate-100">{invoice.id}</td>
                    <td className="px-2 py-1.5 text-slate-300">{invoice.shopId}</td>
                    <td className="px-2 py-1.5 text-slate-300">{formatMmk(invoice.amountMmk)}</td>
                    <td className="px-2 py-1.5 text-slate-300">{invoice.paidAt?.slice(0, 10) ?? '—'}</td>
                    <td className="px-2 py-1.5 text-slate-300">{invoice.recordedBy || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function statusTone(status: string): string {
  if (status === 'active') return 'rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300';
  if (status === 'retired') return 'rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300';
  return 'rounded bg-slate-500/20 px-1.5 py-0.5 text-slate-300';
}

function entTone(status: string): string {
  if (status === 'active') return 'rounded bg-emerald-500/20 px-1.5 py-0.5 text-emerald-300';
  if (status === 'grace') return 'rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-300';
  if (status === 'cancelled') return 'rounded bg-slate-500/20 px-1.5 py-0.5 text-slate-300';
  return 'rounded bg-red-500/20 px-1.5 py-0.5 text-red-300';
}

function statusLabel(status: string, t: (key: 'st_status_active' | 'st_status_draft' | 'st_status_retired') => string): string {
  if (status === 'active') return t('st_status_active');
  if (status === 'retired') return t('st_status_retired');
  return t('st_status_draft');
}

function entitlementLabel(
  status: string,
  t: (key: 'st_entitlement_active' | 'st_entitlement_grace' | 'st_entitlement_expired' | 'st_entitlement_cancelled') => string,
): string {
  if (status === 'active') return t('st_entitlement_active');
  if (status === 'grace') return t('st_entitlement_grace');
  if (status === 'cancelled') return t('st_entitlement_cancelled');
  return t('st_entitlement_expired');
}

function reasonLabel(
  reason: string,
  t: (key: 'st_reason_served' | 'st_reason_free_default' | 'st_reason_entitlement_lapsed' | 'st_reason_retired_moved' | 'st_reason_rolled_back') => string,
): string {
  if (reason === 'served') return t('st_reason_served');
  if (reason === 'entitlement_lapsed') return t('st_reason_entitlement_lapsed');
  if (reason === 'retired_moved') return t('st_reason_retired_moved');
  if (reason === 'rolled_back') return t('st_reason_rolled_back');
  return t('st_reason_free_default');
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof BadgeCheck }) {
  return (
    <div className="rounded-lg border border-[#294d76] bg-[#0b203b] p-3 shadow-xl">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        <Icon size={11} /> {label}
      </p>
      <p className="mt-1 text-lg font-extrabold text-white">{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#294d76] bg-[#0b203b] shadow-xl">
      <div className="border-b border-[#244668] px-3 py-2">
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      <div className="overflow-x-auto p-3">{children}</div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded border border-dashed border-[#2b527d] px-3 py-6 text-center text-[10px] text-slate-500">{text}</p>;
}
