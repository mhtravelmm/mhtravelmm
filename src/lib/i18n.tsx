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

  footer_tagline: {
    mm: 'မြန်မာနိုင်ငံရဲ့ အလှတရားကို ရှာဖွေဖို့ သင့်ယုံကြည်ရတဲ့ ခရီးဖော်။ ၂၄/၇ အသင့်ရှိပါတယ်။',
    en: 'Your trusted companion to explore the beauty of Myanmar. Available 24/7.',
  },
  footer_legal: { mm: 'ဥပဒေရေးရာ', en: 'Legal' },
  footer_privacy_policy: { mm: 'ကိုယ်ရေးအချက်အလက် မူဝါဒ', en: 'Privacy policy' },
  footer_terms_of_use: { mm: 'အသုံးပြုမှု စည်းမျဉ်း', en: 'Terms of use' },
  footer_terms_conditions: { mm: 'စည်းကမ်းချက်များ', en: 'Terms and conditions' },
  footer_dmca: { mm: 'DMCA မူဝါဒ', en: 'DMCA policy' },
  footer_disclaimer: { mm: 'တာဝန်မယူကြောင်း ကြေညာချက်', en: 'Disclaimer' },
  footer_cookie_policy: { mm: 'ကွတ်ကီး မူဝါဒ', en: 'Cookie policy' },
  footer_sitemap: { mm: 'ဆိုက်မြေပုံ', en: 'Sitemap' },
  footer_help_support: { mm: 'အကူအညီနှင့် ပံ့ပိုးမှု', en: 'Help and support' },
  footer_faq: { mm: 'အမေးများသော မေးခွန်းများ', en: 'FAQ' },
  footer_contact_form: { mm: 'ဆက်သွယ်ရန် ပုံစံ', en: 'Contact form' },
  footer_feedback: { mm: 'အကြံပြုချက်', en: 'Feedback' },
  footer_report_content: { mm: 'အကြောင်းအရာ တိုင်ကြားရန်', en: 'Report content' },
  footer_support: { mm: 'ပံ့ပိုးမှု', en: 'Support' },
  footer_navigate: { mm: 'လမ်းညွှန်', en: 'Navigate' },
  footer_content: { mm: 'အကြောင်းအရာ', en: 'Content' },
  footer_myanmar_payment: { mm: 'မြန်မာငွေပေးချေမှု', en: 'Myanmar payment' },
  footer_download_app: { mm: 'အက်ပ် ဒေါင်းလုဒ်ရယူပါ', en: 'Download our app' },
  footer_app_store: { mm: 'App Store', en: 'App store' },
  footer_google_play: { mm: 'Google Play', en: 'Google play' },
  footer_international_payment: { mm: 'နိုင်ငံတကာ ငွေပေးချေမှု', en: 'International payment' },
  footer_copyright: {
    mm: '© ၂၀၂၆ MH Travel. မူပိုင်ခွင့် အားလုံး ရယူထားသည်။',
    en: '© 2026 MH Travel. All rights reserved.',
  },
  section_cities: { mm: 'မြို့များ', en: 'Cities' },
  see_more_cities: { mm: 'မြို့ ထပ်ကြည့်ရန်', en: 'See more cities' },
  section_top_attractions: { mm: 'ထင်ရှားသော နေရာများ', en: 'Top attractions' },
  section_popular_hotels: { mm: 'လူကြိုက်များသော ဟိုတယ်များ', en: 'Popular hotels' },
  section_restaurants: { mm: 'စားသောက်ဆိုင်များ', en: 'Restaurants' },
  section_book_shops: { mm: 'စာအုပ်ဆိုင်များ', en: 'Book shops' },
  section_rentals: { mm: 'ငှားရမ်းခြင်း', en: 'Rentals' },
  section_transport_operators: { mm: 'ခရီးသွားဝန်ဆောင်မှုများ', en: 'Transport operators' },
  section_cafes: { mm: 'ကော်ဖီဆိုင်များ', en: 'Cafes' },
  section_markets: { mm: 'စျေးများ', en: 'Markets' },
  section_popular_searches: { mm: 'လူကြိုက်များသော ရှာဖွေမှုများ', en: 'Popular searches' },

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
