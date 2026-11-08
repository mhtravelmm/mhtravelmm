import { Building, Car, Home, MapPin, MoreHorizontal, Route } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage, type TranslationKey } from '../../lib/i18n';

const ITEMS: { key: TranslationKey; href: string; Icon: typeof Home }[] = [
  { key: 'nav_home', href: '/', Icon: Home },
  { key: 'nav_nearby', href: '/nearby', Icon: MapPin },
  { key: 'nav_cities', href: '/cities', Icon: Building },
  { key: 'nav_rentals', href: '/rentals', Icon: Car },
  { key: 'nav_travel_plans', href: '/travel-plans', Icon: Route },
];

interface MobileBottomNavProps {
  menuOpen: boolean;
  onMoreClick: () => void;
}

export function MobileBottomNav({ menuOpen, onMoreClick }: MobileBottomNavProps) {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const isCoreDestination = ITEMS.some(({ href }) => (
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
  ));
  const moreActive = menuOpen || !isCoreDestination;

  return createPortal(
    <nav
      aria-label={t('nav_mobile')}
      className="fixed inset-x-0 bottom-0 z-[55] border-t border-border bg-bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(0,0,0,0.18)] backdrop-blur md:hidden"
    >
      <div className="grid min-h-[58px] grid-cols-6">
        {ITEMS.map(({ key, href, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              to={href}
              aria-current={active ? 'page' : undefined}
              className={`flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-center transition-colors ${active ? 'text-brand-blue' : 'text-text-faint hover:text-text-primary'}`}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              <span className="whitespace-nowrap text-[8px] font-medium leading-none">{t(key)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMoreClick}
          aria-label={t('nav_more')}
          aria-expanded={menuOpen}
          className={`flex min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-center transition-colors ${moreActive ? 'text-brand-blue' : 'text-text-faint hover:text-text-primary'}`}
        >
          <MoreHorizontal size={18} strokeWidth={moreActive ? 2.2 : 1.8} />
          <span className="whitespace-nowrap text-[8px] font-medium leading-none">{t('nav_more')}</span>
        </button>
      </div>
    </nav>,
    document.body,
  );
}
