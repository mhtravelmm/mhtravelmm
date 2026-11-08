import { Home, MapPin, Route, Ticket, UserRound } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { useLanguage, type TranslationKey } from '../../lib/i18n';

const ITEMS: { key: TranslationKey; href: string; Icon: typeof Home; account?: boolean }[] = [
  { key: 'nav_home', href: '/', Icon: Home },
  { key: 'nav_nearby', href: '/nearby', Icon: MapPin },
  { key: 'nav_ticketing', href: '/ticketing', Icon: Ticket },
  { key: 'nav_travel_plans', href: '/travel-plans', Icon: Route },
  { key: 'nav_account', href: '/account', Icon: UserRound, account: true },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { isAuthenticated, isSuperAdmin } = useAuth();
  const { t } = useLanguage();
  const accountHref = isAuthenticated ? (isSuperAdmin ? '/super-admin' : '/account') : '/login';

  return createPortal(
    <nav
      aria-label={t('nav_mobile')}
      className="fixed inset-x-0 bottom-0 z-[55] border-t border-border bg-bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(0,0,0,0.18)] backdrop-blur md:hidden"
    >
      <div className="grid min-h-[58px] grid-cols-5">
        {ITEMS.map(({ key, href, Icon, account }) => {
          const destination = account ? accountHref : href;
          const active = account
            ? ['/account', '/login', '/signup', '/super-admin'].some((path) => pathname === path || pathname.startsWith(`${path}/`))
            : (destination === '/' ? pathname === '/' : pathname === destination || pathname.startsWith(`${destination}/`));

          return (
            <Link
              key={key}
              to={destination}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-center transition-colors ${active ? 'text-brand-blue' : 'text-text-faint hover:text-text-primary'}`}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              <span className="whitespace-nowrap text-[8px] font-medium leading-none">{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>,
    document.body,
  );
}
