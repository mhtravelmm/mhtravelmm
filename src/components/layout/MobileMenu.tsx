import { X, Building, MapPin, Car, Ticket, Route, BookOpen, PenSquare, Heart, Globe, DollarSign, Moon, Sun } from 'lucide-react';
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
];

const MYANMAR_PAYMENT = ['KBZPay', 'AYA Pay', 'CB Pay', 'OK$', 'UAB Pay', 'MPU', 'mytelpay'];

interface MobileMenuProps {
  onClose: () => void;
}

export function MobileMenu({ onClose }: MobileMenuProps) {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currency, toggleCurrency } = useCurrency();

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      <div className="relative flex h-full w-[280px] flex-col overflow-y-auto bg-bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <Link to="/" onClick={onClose} className="text-base font-medium text-brand-blue">
            MH Travel
          </Link>
          <button type="button" onClick={onClose} aria-label="Close menu">
            <X size={18} className="text-text-secondary" />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-3 py-3">
          {NAV_LINKS.map(({ key, href, Icon }) => (
            <Link
              key={href}
              to={href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs text-text-secondary hover:bg-bg hover:text-text-primary transition"
            >
              <Icon size={15} />
              {t(key)}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-0.5 border-t border-border px-3 py-3">
          <Link
            to="/favorites"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs text-text-secondary hover:bg-bg hover:text-text-primary transition"
          >
            <Heart size={15} />
            {t('nav_favorite')}
          </Link>
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-text-secondary hover:bg-bg hover:text-text-primary transition"
          >
            <Globe size={15} />
            EN / MM
            <span className="ml-auto text-text-faint">{language.toUpperCase()}</span>
          </button>
          <button
            type="button"
            onClick={toggleCurrency}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-text-secondary hover:bg-bg hover:text-text-primary transition"
          >
            <DollarSign size={15} />
            $ / Ks
            <span className="ml-auto text-text-faint">{currency}</span>
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-xs text-text-secondary hover:bg-bg hover:text-text-primary transition"
          >
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            Dark / Light
            <span className="ml-auto text-text-faint capitalize">{theme}</span>
          </button>
        </div>

        <div className="border-t border-border px-4 py-3">
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-brand-blue">
            {t('footer_legal')}
          </p>
          {LEGAL_LINKS.map((key) => (
            <p key={key} className="py-0.5 text-[10px] text-text-faint">
              {t(key)}
            </p>
          ))}
        </div>

        <div className="border-t border-border px-4 py-3">
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-brand-blue">
            {t('footer_help_support')}
          </p>
          {SUPPORT_LINKS.map((key) => (
            <p key={key} className="py-0.5 text-[10px] text-text-faint">
              {t(key)}
            </p>
          ))}
        </div>

        <div className="border-t border-border px-4 py-3">
          <p className="mb-1.5 text-[10px] uppercase tracking-wide text-brand-blue">
            {t('sidebar_payment_methods')}
          </p>
          <div className="mb-2.5 flex flex-wrap gap-1">
            {MYANMAR_PAYMENT.map((p) => (
              <span key={p} className="rounded bg-bg px-1.5 py-0.5 text-[8px] text-text-muted">
                {p}
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            <span className="flex-1 rounded bg-bg py-1.5 text-center text-[9px] text-text-secondary">
              {t('footer_app_store')}
            </span>
            <span className="flex-1 rounded bg-bg py-1.5 text-center text-[9px] text-text-secondary">
              {t('footer_google_play')}
            </span>
          </div>
        </div>

        <div className="border-t border-border px-4 py-3">
          <button
            type="button"
            className="w-full rounded-lg bg-bg py-2.5 text-xs text-text-secondary hover:text-text-primary transition"
          >
            {t('sidebar_login_registration')}
          </button>
        </div>

        <p className="mt-auto border-t border-border px-4 py-3 text-center text-[9px] text-text-faint">
          {t('footer_copyright')}
        </p>
      </div>
    </div>
  );
}
