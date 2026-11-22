import { Link } from 'react-router-dom';
import {
  Ambulance,
  Flame,
  Globe2,
  MapPin,
  Phone,
  Plane,
  ShieldCheck,
  Signal,
  Smartphone,
  Sparkles,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  EMERGENCY_CONTACTS,
  ETIQUETTE_TIPS,
  MONEY_TIPS,
  SIM_PROVIDERS,
  SIM_STEPS,
  TOURIST_SECTION_IDS,
  localized,
  type TouristSectionId,
} from '../../data/foreignTourist';
import { useCurrency } from '../../lib/currency';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { telHref } from '../../lib/placeActions';

const SECTION_ICONS: Record<TouristSectionId, LucideIcon> = {
  emergency: ShieldCheck,
  'sim-card': Signal,
  etiquette: Sparkles,
  currency: Wallet,
};

const JUMP_KEYS: Record<TouristSectionId, TranslationKey> = {
  emergency: 'tourist_jump_emergency',
  'sim-card': 'tourist_jump_sim',
  etiquette: 'tourist_jump_etiquette',
  currency: 'tourist_jump_currency',
};

const CONTACT_ICONS: Record<string, LucideIcon> = {
  police: ShieldCheck,
  ambulance: Ambulance,
  fire: Flame,
};

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-card border border-border bg-bg-card p-4 sm:p-5">{children}</section>;
}

function SectionHeading({ id, icon: Icon, title }: { id: TouristSectionId; icon: LucideIcon; title: string }) {
  return (
    <h2 id={id} className="mb-3 flex scroll-mt-24 items-center gap-2 text-base font-semibold text-text-primary sm:text-lg">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue"><Icon size={16} /></span>
      {title}
    </h2>
  );
}

export function ForeignTouristPage() {
  const { language, t } = useLanguage();
  const { exchangeRate } = useCurrency();

  return (
    <div className="mx-auto max-w-5xl pb-10 pt-3 sm:pt-5">
      <section className="mh-page-hero relative mb-4 overflow-hidden rounded-card border border-border bg-bg-card">
        <img src="/images/blog/myanmar-travel-safety.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071a37]/95 via-[#071a37]/80 to-[#071a37]/25" />
        <div className="relative z-10 flex h-full items-center px-4 py-4 sm:px-8">
          <div className="max-w-2xl">
            <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-cyan-200">
              <Globe2 size={11} />{t('tourist_hero_badge')}
            </span>
            <h1 className="text-2xl font-semibold leading-tight text-white sm:text-4xl">{t('tourist_hero_title')}</h1>
            <p className="mt-1 text-sm font-medium text-white sm:text-lg">{t('tourist_hero_subtitle')}</p>
            <p className="mt-1 text-[10px] text-slate-200 sm:text-xs">{t('tourist_hero_support')}</p>
          </div>
        </div>
      </section>

      <nav aria-label={t('tourist_title')} className="mb-4 flex flex-wrap gap-2">
        {TOURIST_SECTION_IDS.map((id) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-border bg-bg-card px-3 py-1.5 text-[11px] text-text-secondary transition hover:border-brand-blue/60 hover:text-link">
            {t(JUMP_KEYS[id])}
          </a>
        ))}
      </nav>

      <div className="space-y-4">
        <Panel>
          <SectionHeading id="emergency" icon={SECTION_ICONS.emergency} title={t('tourist_section_emergency')} />
          <ul className="grid gap-2 sm:grid-cols-2">
            {EMERGENCY_CONTACTS.map((contact) => {
              const Icon = CONTACT_ICONS[contact.id] ?? Phone;
              return (
                <li key={contact.id} className="flex items-start gap-3 rounded-lg border border-border bg-bg p-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-brand-red"><Icon size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-text-primary">{localized(contact.label, language)}</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-text-muted">{localized(contact.detail, language)}</p>
                    <a href={telHref(contact.phone)} className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-link hover:underline">
                      <Phone size={11} />{contact.phone}
                      <span className="sr-only"> — {t('tourist_call')}</span>
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel>
          <SectionHeading id="sim-card" icon={SECTION_ICONS['sim-card']} title={t('tourist_section_sim')} />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-xs font-semibold text-text-secondary">{t('tourist_sim_steps')}</h3>
              <ol className="space-y-2">
                {SIM_STEPS.map((step, index) => (
                  <li key={step.id} className="flex gap-2.5 text-[11px] leading-5 text-text-secondary">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-[10px] font-bold text-brand-blue">{index + 1}</span>
                    {localized(step.body, language)}
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold text-text-secondary">{t('tourist_sim_operators')}</h3>
              <ul className="space-y-1.5">
                {SIM_PROVIDERS.map((provider) => (
                  <li key={provider.id} className="flex items-center gap-2.5 rounded-lg border border-border bg-bg px-3 py-2">
                    <Smartphone size={14} className="shrink-0 text-brand-blue" />
                    <span className="text-xs font-semibold text-text-primary">{provider.name}</span>
                    <span className="ml-auto text-right text-[10px] leading-4 text-text-muted">{localized(provider.data, language)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[10px] leading-4 text-text-faint">{t('tourist_sim_price_note')}</p>
            </div>
          </div>
        </Panel>

        <Panel>
          <SectionHeading id="etiquette" icon={SECTION_ICONS.etiquette} title={t('tourist_section_etiquette')} />
          <p className="mb-3 text-[11px] leading-5 text-text-muted">{t('tourist_etiquette_intro')}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {ETIQUETTE_TIPS.map((tip) => (
              <li key={tip.id} className="rounded-lg border border-border bg-bg p-3">
                <p className="text-xs font-semibold text-text-primary">{localized(tip.title, language)}</p>
                <p className="mt-1 text-[10px] leading-4 text-text-muted">{localized(tip.body, language)}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <SectionHeading id="currency" icon={SECTION_ICONS.currency} title={t('tourist_section_currency')} />
          <p className="mb-3 text-[11px] leading-5 text-text-muted">
            {t('tourist_money_intro')}{' '}
            {/* The rate is always quoted in kyat, even when the site currency is USD. */}
            <span className="text-text-faint">{t('tourist_rate_note')}: 1 USD ≈ {exchangeRate.toLocaleString('en-US')} Ks</span>
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {MONEY_TIPS.map((tip) => (
              <li key={tip.id} className="rounded-lg border border-border bg-bg p-3">
                <p className="text-xs font-semibold text-text-primary">{localized(tip.title, language)}</p>
                <p className="mt-1 text-[10px] leading-4 text-text-muted">{localized(tip.body, language)}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col justify-between rounded-card border border-border bg-bg-card p-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold text-text-primary"><Plane size={14} className="text-brand-blue" />{t('tourist_plan_cta')}</p>
              <p className="mt-1 text-[11px] leading-5 text-text-muted">{t('tourist_plan_cta_detail')}</p>
            </div>
            <Link to="/travel-plans" className="mt-3 inline-flex items-center justify-center rounded-md bg-brand-blueDark px-3 py-2 text-[11px] font-semibold text-white hover:opacity-90">{t('tourist_plan_cta_button')}</Link>
          </div>
          <div className="flex flex-col justify-between rounded-card border border-border bg-bg-card p-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold text-text-primary"><MapPin size={14} className="text-brand-blue" />{t('tourist_nearby_cta')}</p>
            </div>
            <Link to="/nearby" className="mt-3 inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-[11px] font-semibold text-link hover:bg-bg">{t('tourist_nearby_button')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
