import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Building, MapPin, Car, Ticket, Route, BookOpen, PenSquare, Heart, Globe, DollarSign, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage, type TranslationKey } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';
import { useCurrency } from '../../lib/currency';

const NAV_LINKS: { key: TranslationKey; href: string; Icon: typeof Building }[] = [
  { key: 'nav_cities', href: '/cities', Icon: Building },
  { key: 'nav_nearby', href: '/nearby', Icon: MapPin },
  { key: 'nav_rentals', href: '/rentals', Icon: Car },
  { key: 'nav_ticketing', href: '/ticketing', Icon: Ticket },
  { key: 'nav_travel_plans', href: '/travel-plans', Icon: Route },
  { key: 'nav_travel_guide', href: '/travel-guide', Icon: BookOpen },
  { key: 'nav_blogs', href: '/blogs', Icon: PenSquare },
];

const LEGAL_LINKS: TranslationKey[] = [
  'footer_privacy_policy',
  'footer_terms_of_use',
  'footer_terms_conditions',
  'footer_dmca',
  'footer_disclaimer',
  'footer_cookie_policy',
  'footer_sitemap',
];

const SUPPORT_LINKS: TranslationKey[] = [
  'footer_faq',
  'footer_contact_form',
  'footer_feedback',
  'footer_report_content',
  'footer_support',
];

const CONTENT_DETAILS = [
  'info@mhtravelmm.com',
  'Facebook page',
  'Telegram',
  'Viber',
  '+95 9 400 686 925',
];
const MYANMAR_PAYMENT = ['KBZPay', 'AYA Pay', 'CB Pay', 'OK$', 'UAB Pay', 'MPU', 'mytelpay'];
const INTERNATIONAL_PAYMENT = ['Visa', 'Mastercard', 'JCB', 'UnionPay', 'Amex', 'Discover', 'Apple Pay'];

interface MobileMenuProps {
  /** Distance from the top of the viewport to the bottom of the header bar */
  top: number;
  onClose: () => void;
}

function SidebarSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="border-t border-border px-4 py-3">
      <h2 className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-brand-blue">{heading}</h2>
      {children}
    </section>
  );
}

export function MobileMenu({ top, onClose }: MobileMenuProps) {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currency, toggleCurrency } = useCurrency();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-x-0 bottom-[calc(3.625rem_+_env(safe-area-inset-bottom))] z-[60] md:hidden" style={{ top }}>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />

      <div className="relative flex h-full w-[82%] max-w-[320px] flex-col overflow-y-auto border-r border-border bg-bg-card">
        <SidebarSection heading={t('footer_navigate')}>
          <nav className="flex flex-col gap-0.5" aria-label={t('footer_navigate')}>
            {NAV_LINKS.map(({ key, href, Icon }) => (
              <Link
                key={href}
                to={href}
                onClick={onClose}
                className="flex items-center gap-2 rounded-md py-1.5 text-[10px] text-text-faint transition hover:text-text-primary"
              >
                <Icon size={12} />
                {t(key)}
              </Link>
            ))}
          </nav>
        </SidebarSection>

        <div className="flex flex-col gap-0.5 px-3 py-3">
          <Link
            to="/favorites"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs text-text-secondary transition hover:bg-bg hover:text-text-primary"
          >
            <Heart size={15} />
            {t('nav_favorite')}
          </Link>
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-text-secondary transition hover:bg-bg hover:text-text-primary"
          >
            <Globe size={15} />
            EN / MM
            <span className="ml-auto text-text-faint">{language.toUpperCase()}</span>
          </button>
          <button
            type="button"
            onClick={toggleCurrency}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-text-secondary transition hover:bg-bg hover:text-text-primary"
          >
            <DollarSign size={15} />
            $ / Ks
            <span className="ml-auto text-text-faint">{currency}</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-text-secondary transition hover:bg-bg hover:text-text-primary"
          >
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            Dark / Light
            <span className="ml-auto capitalize text-text-faint">{theme}</span>
          </button>
        </div>

        <SidebarSection heading={t('footer_help_support')}>
          <div className="space-y-1">
            {SUPPORT_LINKS.map((key) => (
              <p key={key} className="text-[10px] leading-4 text-text-faint">{t(key)}</p>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection heading={t('footer_content')}>
          <div className="space-y-1">
            {CONTENT_DETAILS.map((detail) => (
              <p key={detail} className="text-[10px] leading-4 text-text-faint">{detail}</p>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection heading={t('footer_myanmar_payment')}>
          <div className="flex flex-wrap gap-1">
            {MYANMAR_PAYMENT.map((payment) => (
              <span key={payment} className="rounded bg-bg px-1.5 py-1 text-[8px] text-text-muted">
                {payment}
              </span>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection heading={t('footer_download_app')}>
          <div className="flex gap-1.5">
            <span className="flex-1 rounded bg-bg px-2 py-1.5 text-center text-[9px] text-text-secondary">
              {t('footer_app_store')}
            </span>
            <span className="flex-1 rounded bg-bg px-2 py-1.5 text-center text-[9px] text-text-secondary">
              {t('footer_google_play')}
            </span>
          </div>
        </SidebarSection>

        <SidebarSection heading={t('footer_international_payment')}>
          <div className="flex flex-wrap gap-1">
            {INTERNATIONAL_PAYMENT.map((payment) => (
              <span key={payment} className="rounded bg-bg px-1.5 py-1 text-[8px] text-text-muted">
                {payment}
              </span>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection heading={t('footer_legal')}>
          <div className="space-y-1">
            {LEGAL_LINKS.map((key) => (
              <p key={key} className="text-[10px] leading-4 text-text-faint">{t(key)}</p>
            ))}
          </div>
        </SidebarSection>

        <p className="mt-auto border-t border-border px-4 py-3 text-center text-[9px] text-text-faint">
          {t('footer_copyright')}
        </p>
      </div>
    </div>,
    document.body,
  );
}
