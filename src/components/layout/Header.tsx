import { Search, Globe, DollarSign, Moon, Sun, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Currency, Language, Theme } from '../../types';

const NAV_ITEMS = [
  { label: 'Cities', href: '/cities' },
  { label: 'Nearby', href: '/nearby' },
  { label: 'Rentals', href: '/rentals' },
  { label: 'Ticketing', href: '/ticketing' },
  { label: 'Travel plans', href: '/travel-plans' },
  { label: 'Travel guide', href: '/travel-guide' },
  { label: 'Blogs', href: '/blogs' },
] as const;

interface HeaderProps {
  language: Language;
  onLanguageToggle: () => void;
  currency: Currency;
  onCurrencyToggle: () => void;
  theme: Theme;
  onThemeToggle: () => void;
  unreadNotifications?: number;
}

export function Header({
  language,
  onLanguageToggle,
  currency,
  onCurrencyToggle,
  theme,
  onThemeToggle,
  unreadNotifications = 0,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between py-3">
      <Link to="/" className="text-lg font-medium text-brand-blue">
        MH Travel
      </Link>

      <nav className="hidden gap-4 md:flex">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="text-xs text-text-secondary hover:text-white transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Link to="/search" aria-label="Search">
          <Search size={16} className="text-text-secondary hover:text-white transition" />
        </Link>
        <button type="button" onClick={onLanguageToggle} aria-label="Toggle language" title={language.toUpperCase()}>
          <Globe size={16} className="text-text-secondary hover:text-white transition" />
        </button>
        <button type="button" onClick={onCurrencyToggle} aria-label="Toggle currency" title={currency}>
          <DollarSign size={16} className="text-text-secondary hover:text-white transition" />
        </button>
        <button type="button" onClick={onThemeToggle} aria-label="Toggle theme">
          {theme === 'dark' ? (
            <Moon size={16} className="text-text-secondary hover:text-white transition" />
          ) : (
            <Sun size={16} className="text-text-secondary hover:text-white transition" />
          )}
        </button>
        <Link to="/account/notifications" className="relative" aria-label="Notifications">
          <Bell size={16} className="text-text-secondary hover:text-white transition" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-red text-[8px] text-white">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </Link>
        <Link to="/account" aria-label="Account">
          <div className="h-[22px] w-[22px] rounded-full bg-brand-blueDark" />
        </Link>
      </div>
    </header>
  );
}

export { NAV_ITEMS };
