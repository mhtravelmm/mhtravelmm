import { Instagram, Facebook, Youtube, Linkedin } from 'lucide-react';
import { useLanguage, type TranslationKey } from '../../lib/i18n';

const MYANMAR_PAYMENT = ['KBZPay', 'AYA Pay', 'CB Pay', 'OK$', 'UAB Pay', 'MPU', 'mytelpay'];
const INTL_PAYMENT = ['Visa', 'Mastercard', 'JCB', 'UnionPay', 'Amex', 'Discover', 'Apple Pay'];

// Brand names (payment providers, "MH Travel") are never translated.
// Everything else routes through t().
const FOOTER_COLUMNS: { headingKey: TranslationKey; linkKeys: TranslationKey[] }[] = [
  {
    headingKey: 'footer_legal',
    linkKeys: [
      'footer_privacy_policy',
      'footer_terms_of_use',
      'footer_terms_conditions',
      'footer_dmca',
      'footer_disclaimer',
      'footer_cookie_policy',
      'footer_sitemap',
    ],
  },
  {
    headingKey: 'footer_help_support',
    linkKeys: ['footer_faq', 'footer_contact_form', 'footer_feedback', 'footer_report_content', 'footer_support'],
  },
  {
    headingKey: 'footer_navigate',
    linkKeys: ['nav_cities', 'nav_nearby', 'nav_rentals', 'nav_ticketing', 'nav_travel_plans', 'nav_travel_guide'],
  },
];

// Contact details are real values (email/phone/etc), not translated strings.
const CONTENT_COLUMN_VALUES = ['info@mhtravelmm.com', 'Facebook page', 'Telegram', 'Viber', '+95 9 400 686 925'];

/**
 * `variant="full"` is only used on the Home Page. Every inner page
 * (City, Nearby, Hotel/Restaurant/Shop detail, Blog, etc.) uses
 * `variant="minimal"` — copyright line only. This mirrors the
 * approved mockups.
 */
export function Footer({ variant = 'minimal' }: { variant?: 'full' | 'minimal' }) {
  const { t } = useLanguage();

  if (variant === 'minimal') {
    return (
      <footer className="mt-4 border-t border-border pt-2.5 text-center">
        <p className="text-[9px] text-text-faint">{t('footer_copyright')}</p>
      </footer>
    );
  }

  return (
    <footer className="mt-4 border-t border-border pt-3.5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="col-span-2 md:col-span-1">
          <p className="mb-1.5 text-xs text-brand-blue">MH Travel</p>
          <p className="mb-2 text-[9px] text-text-faint">{t('footer_tagline')}</p>
          <div className="flex gap-1.5 text-text-muted">
            <Instagram size={12} />
            <Facebook size={12} />
            <Youtube size={12} />
            <Linkedin size={12} />
          </div>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.headingKey}>
            <p className="mb-1.5 text-[11px] text-brand-blue">{t(col.headingKey)}</p>
            {col.linkKeys.map((linkKey) => (
              <p key={linkKey} className="mb-0.5 text-[9px] text-text-faint">
                {t(linkKey)}
              </p>
            ))}
          </div>
        ))}

        <div>
          <p className="mb-1.5 text-[11px] text-brand-blue">{t('footer_content')}</p>
          {CONTENT_COLUMN_VALUES.map((value) => (
            <p key={value} className="mb-0.5 text-[9px] text-text-faint">
              {value}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-border pt-3 md:grid-cols-3">
        <div>
          <p className="mb-1.5 text-[10px] text-brand-blue">{t('footer_myanmar_payment')}</p>
          <div className="flex flex-wrap gap-1">
            {MYANMAR_PAYMENT.map((p) => (
              <span key={p} className="rounded bg-bg-card px-1.5 py-0.5 text-[8px] text-text-muted">
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="text-center">
          <p className="mb-1.5 text-[10px] text-brand-blue">{t('footer_download_app')}</p>
          <div className="flex justify-center gap-1.5">
            <span className="rounded bg-bg-card px-2 py-1 text-[8px] text-text-secondary">
              {t('footer_app_store')}
            </span>
            <span className="rounded bg-bg-card px-2 py-1 text-[8px] text-text-secondary">
              {t('footer_google_play')}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="mb-1.5 text-[10px] text-brand-blue">{t('footer_international_payment')}</p>
          <div className="flex flex-wrap justify-end gap-1">
            {INTL_PAYMENT.map((p) => (
              <span key={p} className="rounded bg-bg-card px-1.5 py-0.5 text-[8px] text-text-muted">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3.5 border-t border-border pt-2.5 text-center text-[9px] text-text-faint">
        {t('footer_copyright')}
      </p>
    </footer>
  );
}
