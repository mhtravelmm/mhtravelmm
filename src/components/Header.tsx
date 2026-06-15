import { useState, useEffect } from 'react';
import { Search, Menu, X, Globe, Moon, Sun, Heart, Bell, User, MapPin } from 'lucide-react';

interface HeaderProps {
  language: 'en' | 'mm';
  onLanguageChange: (lang: 'en' | 'mm') => void;
  darkMode: boolean;
  onDarkModeChange: (dark: boolean) => void;
}

const translations = {
  en: {
    cities: 'Cities',
    nearby: 'Nearby',
    travelGuide: 'Travel Guide',
    blogs: 'Blogs',
    travelPlans: 'Travel Plans',
    language: 'Language',
    darkMode: 'Dark/Light',
    favorites: 'Favorites',
    account: 'Account',
  },
  mm: {
    cities: 'မြို့များ',
    nearby: 'အနီးအနား',
    travelGuide: 'ခရီးသွားလမ်းညွှန်',
    blogs: 'ဘလော့ဂ်များ',
    travelPlans: 'ခရီးစဉ်များ',
    language: 'ဘာသာစကား',
    darkMode: 'အမှောင်/အလင်း',
    favorites: 'နှစ်သက်သော',
    account: 'အကောင့်',
  },
};

export default function Header({ language, onLanguageChange, darkMode, onDarkModeChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = translations[language];

  const navItems = [
    { key: 'cities', label: t.cities },
    { key: 'nearby', label: t.nearby },
    { key: 'travel-guide', label: t.travelGuide },
    { key: 'blogs', label: t.blogs },
    { key: 'travel-plans', label: t.travelPlans },
  ];

  const bgClass = darkMode ? 'bg-slate-900/95' : 'bg-white/95';
  const textClass = darkMode ? 'text-slate-300' : 'text-slate-600';
  const textHoverClass = darkMode ? 'hover:text-[#1E88E5]' : 'hover:text-[#1E88E5]';
  const bgHoverClass = darkMode ? 'hover:bg-slate-800' : 'hover:bg-blue-50';
  const logoTextClass = darkMode ? 'text-white' : 'text-slate-800';

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 h-16 ${bgClass} backdrop-blur-sm shadow-sm z-50 transition-colors`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          {/* DESKTOP HEADER (md and above) */}
          <div className="hidden md:flex items-center justify-between h-full">
            {/* Left: Logo */}
            <a href="#" className="flex items-center gap-2 shrink-0">
              <MapPin className="w-8 h-8 text-[#1E88E5]" />
              <span className={`text-xl font-bold ${logoTextClass}`}>
                MH <span className="text-[#1E88E5]">Travel</span>
              </span>
            </a>

            {/* Center: Nav Links */}
            <nav className="flex items-center gap-6">
              {navItems.map((item) => (
                <a
                  key={item.key}
                  href={`#${item.key}`}
                  className={`text-sm font-medium ${textClass} ${textHoverClass} transition-colors`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Right: Icons */}
            <div className="flex items-center gap-2">
              <button className={`p-2 ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass}`}>
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => onLanguageChange(language === 'en' ? 'mm' : 'en')}
                className={`p-2 ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass}`}
              >
                <Globe className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDarkModeChange(!darkMode)}
                className={`p-2 ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass}`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className={`p-2 ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass}`}>
                <Heart className="w-5 h-5" />
              </button>
              <button className={`p-2 ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass} relative`}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FFA726] rounded-full" />
              </button>
              <button className={`p-2 ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass}`}>
                <User className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* MOBILE/TABLET HEADER (below md) */}
          <div className="flex md:hidden items-center h-full">
            {/* Left: Hamburger + Logo (left-aligned together) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`p-2 ${textClass} ${textHoverClass} transition-colors`}
              >
                <Menu className="w-6 h-6" />
              </button>
              <a href="#" className="flex items-center gap-2">
                <MapPin className="w-7 h-7 text-[#1E88E5]" />
                <span className={`text-lg font-bold ${logoTextClass}`}>
                  MH <span className="text-[#1E88E5]">Travel</span>
                </span>
              </a>
            </div>

            {/* Right: Search, Notifications */}
            <div className="ml-auto flex items-center gap-1">
              <button className={`p-2 ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass}`}>
                <Search className="w-5 h-5" />
              </button>
              <button className={`p-2 ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass} relative`}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#FFA726] rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER OVERLAY - starts below header */}
      <div
        className={`fixed top-16 left-0 right-0 bottom-0 bg-black/50 z-[60] transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* MOBILE DRAWER - starts below header */}
      <div
        className={`fixed top-16 left-0 bottom-0 w-72 z-[70] transform transition-transform duration-300 ease-in-out md:hidden ${
          darkMode ? 'bg-slate-900' : 'bg-white'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer Content */}
        <div className="h-full overflow-y-auto p-4">
          {/* Nav Links */}
          <nav className="flex flex-col gap-1 mb-4">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={`#${item.key}`}
                className={`px-4 py-3 text-base font-medium ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Divider */}
          <div className={`h-px ${darkMode ? 'bg-slate-700' : 'bg-slate-200'} my-4`} />

          {/* Icons with Labels */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onLanguageChange(language === 'en' ? 'mm' : 'en')}
              className={`flex items-center gap-3 px-4 py-3 ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass}`}
            >
              <Globe className="w-5 h-5" />
              <span className="text-base font-medium">{t.language}</span>
            </button>
            <button
              onClick={() => onDarkModeChange(!darkMode)}
              className={`flex items-center gap-3 px-4 py-3 ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="text-base font-medium">{t.darkMode}</span>
            </button>
            <a
              href="#favorites"
              className={`flex items-center gap-3 px-4 py-3 ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Heart className="w-5 h-5" />
              <span className="text-base font-medium">{t.favorites}</span>
            </a>
            <a
              href="#account"
              className={`flex items-center gap-3 px-4 py-3 ${textClass} ${textHoverClass} transition-colors rounded-lg ${bgHoverClass}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <User className="w-5 h-5" />
              <span className="text-base font-medium">{t.account}</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
