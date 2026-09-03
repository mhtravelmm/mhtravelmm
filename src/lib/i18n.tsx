import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Language } from '../types';

/**
 * Translation dictionary. Keys are grouped by where they're used.
 * Every UI-chrome string (nav labels, section titles, category labels,
 * common actions) should have an entry here rather than being written
 * directly in a component — that's what keeps `t()` able to cover the
 * whole app as more pages are added.
 */
const translations = {
  // Header nav
  nav_cities: { mm: 'မြို့များ', en: 'Cities' },
  nav_nearby: { mm: 'အနီးအနား', en: 'Nearby' },
  nav_rentals: { mm: 'ငှားရမ်းရန်', en: 'Rentals' },
  nav_ticketing: { mm: 'လက်မှတ်', en: 'Ticketing' },
  nav_travel_plans: { mm: 'ခရီးစဉ်များ', en: 'Travel plans' },
  nav_travel_guide: { mm: 'ခရီးသွားလမ်းညွှန်', en: 'Travel guide' },
  nav_blogs: { mm: 'ဘလော့များ', en: 'Blogs' },

  // Common
  view_all: { mm: 'အားလုံးကြည့်ရန်', en: 'View all' },
  search_placeholder: { mm: 'ရှာဖွေရန်...', en: 'Search...' },
  notifications_title: { mm: 'အသိပေးချက်များ', en: 'Notifications' },
  notifications_mark_all_read: { mm: 'အားလုံး ဖတ်ပြီးအဖြစ် မှတ်မည်', en: 'Mark all as read' },
  notifications_empty: { mm: 'အသိပေးချက် မရှိသေးပါ', en: 'No notifications yet' },
  notifications_see_all: { mm: 'အားလုံး ကြည့်မည်', en: 'See all' },

  // Section titles
  section_categories: { mm: 'အမျိုးအစားများ', en: 'Categories' },
  section_travel_plans: { mm: 'ခရီးစဉ်များ', en: 'Travel plans' },
  section_travel_guide: { mm: 'ခရီးသွားလမ်းညွှန်', en: 'Travel guide' },
  section_blogs: { mm: 'ဘလော့များ', en: 'Blogs' },
  section_populars: { mm: 'လူကြိုက်များသော', en: 'Populars' },
  section_reviews: { mm: 'သုံးသပ်ချက်များ', en: 'Reviews' },
  section_awards: { mm: 'ဆုများ', en: 'Awards' },
  section_partners: { mm: 'မိတ်ဖက်များ', en: 'Partners' },

  // Categories
  cat_book_shop: { mm: 'စာအုပ်ဆိုင်', en: 'Book shop' },
  cat_hotels: { mm: 'ဟိုတယ်များ', en: 'Hotels' },
  cat_ticketing: { mm: 'လက်မှတ်', en: 'Ticketing' },
  cat_rentals: { mm: 'ငှားရမ်းရန်', en: 'Rentals' },
  cat_restaurants: { mm: 'စားသောက်ဆိုင်', en: 'Restaurants' },
  cat_attractions: { mm: 'ခရီးသွားဆွဲဆောင်ရာ', en: 'Attractions' },
  cat_guides: { mm: 'လမ်းညွှန်များ', en: 'Guides' },
  cat_exchange: { mm: 'ငွေလဲလှယ်ရန်', en: 'Exchange' },
  cat_emergency: { mm: 'အရေးပေါ်', en: 'Emergency' },
  cat_sim_card: { mm: 'ဆင်းမ်ကတ်', en: 'Sim card' },
  cat_nearby: { mm: 'အနီးအနား', en: 'Nearby' },
} as const;

export type TranslationKey = keyof typeof translations;

interface LanguageContextValue {
  language: Language;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'mh-travel-language';

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'mm';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'mm' || stored === 'en') return stored;
  return 'mm';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => setLanguage((l) => (l === 'mm' ? 'en' : 'mm'));

  const t = (key: TranslationKey): string => translations[key][language];

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
