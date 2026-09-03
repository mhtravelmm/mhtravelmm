import { useEffect, useRef, useState } from 'react';
import { Search, Globe, DollarSign, Moon, Sun, Bell, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { useTheme } from '../../lib/theme';
import { useCurrency } from '../../lib/currency';

export function NAV_ITEMS_HOOK() {
  const { t } = useLanguage();
  return [
    { label: t('nav_cities'), href: '/cities' },
    { label: t('nav_nearby'), href: '/nearby' },
    { label: t('nav_rentals'), href: '/rentals' },
    { label: t('nav_ticketing'), href: '/ticketing' },
    { label: t('nav_travel_plans'), href: '/travel-plans' },
    { label: t('nav_travel_guide'), href: '/travel-guide' },
    { label: t('nav_blogs'), href: '/blogs' },
  ] as const;
}

export function Header({ unreadNotifications = 0 }: { unreadNotifications?: number }) {
  const { language, toggleLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { currency, toggleCurrency } = useCurrency();
  const navItems = NAV_ITEMS_HOOK();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  function closeSearch() {
    setSearchOpen(false);
    setQuery('');
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    // Stays on the same page context, but hands off to the results view —
    // the input itself remains in the header (see confirmed unified search UX).
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  // Inline search takes over the header row without navigating away —
  // logo stays, nav links hide to make room, closes with Escape/X.
  if (searchOpen) {
    return (
      <header className="flex items-center gap-3 py-3">
        <Link to="/" className="hidden shrink-0 text-lg font-medium text-brand-blue sm:block">
          MH Travel
        </Link>
        <form onSubmit={submitSearch} className="flex flex-1 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-brand-blue bg-bg-card px-3 py-2">
            <Search size={15} className="shrink-0 text-brand-blue" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && closeSearch()}
              placeholder={t('search_placeholder')}
              className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-faint focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={closeSearch}
            aria-label="Close search"
            className="shrink-0 text-text-secondary hover:text-text-primary transition"
          >
            <X size={18} />
          </button>
        </form>
      </header>
    );
  }

  return (
    <header className="flex items-center justify-between py-3">
      <Link to="/" className="text-lg font-medium text-brand-blue">
        MH Travel
      </Link>

      <nav className="hidden gap-4 md:flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="text-xs text-text-secondary hover:text-text-primary transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search">
          <Search size={16} className="text-text-secondary hover:text-text-primary transition" />
        </button>
        <button
          type="button"
          onClick={toggleLanguage}
          aria-label="Toggle language"
          title={language.toUpperCase()}
        >
          <Globe size={16} className="text-text-secondary hover:text-text-primary transition" />
        </button>
        <button type="button" onClick={toggleCurrency} aria-label="Toggle currency" title={currency}>
          <DollarSign size={16} className="text-text-secondary hover:text-text-primary transition" />
        </button>
        <button type="button" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? (
            <Moon size={16} className="text-text-secondary hover:text-text-primary transition" />
          ) : (
            <Sun size={16} className="text-text-secondary hover:text-text-primary transition" />
          )}
        </button>
        <Link to="/account/notifications" className="relative" aria-label="Notifications">
          <Bell size={16} className="text-text-secondary hover:text-text-primary transition" />
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
