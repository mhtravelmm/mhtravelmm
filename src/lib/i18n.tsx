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

  nav_favorite: { mm: 'အကြိုက်ဆုံးများ', en: 'Favorite' },
  sidebar_payment_methods: { mm: 'ငွေပေးချေမှု နည်းလမ်းများ', en: 'Payment methods' },
  sidebar_login_registration: { mm: 'အကောင့်ဝင်ရန် / မှတ်ပုံတင်ရန်', en: 'Login / Registration' },
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

  // Blogs page
  blog_eyebrow: { mm: 'MH TRAVEL မှ ခရီးသွားမှတ်စုများ', en: 'THE MH TRAVEL JOURNAL' },
  blog_title: { mm: 'မြန်မာနိုင်ငံကို ဇာတ်လမ်းများမှတစ်ဆင့် ရှာဖွေပါ', en: 'Stories that take you somewhere' },
  blog_intro: {
    mm: 'အေးချမ်းတဲ့ မနက်ခင်းတွေ၊ လူစည်ကားတဲ့ လမ်းတွေ၊ သွားရောက်လည်ပတ်ဖို့ အကြောင်းပြချက်ကောင်းတွေ — ဒေသခံရှုထောင့်ကနေ ရေးသားထားတဲ့ ခရီးသွားဇာတ်လမ်းများ။',
    en: 'Quiet mornings, lively streets, and good reasons to take the long way. Travel stories from a local point of view.',
  },
  blog_featured_story: { mm: 'အထူးရွေးချယ်ထားသော ဇာတ်လမ်း', en: 'FEATURED STORY' },
  blog_read_story: { mm: 'ဇာတ်လမ်းအပြည့် ဖတ်ရန်', en: 'Read the story' },
  blog_latest_title: { mm: 'နောက်ဆုံးထွက် ဇာတ်လမ်းများ', en: 'Latest stories' },
  blog_latest_intro: { mm: 'ကိုယ်သွားမယ့်ခရီးအတွက် စိတ်ကူးတစ်ခု ရှာလိုက်ပါ။', en: 'Find a little inspiration for the road ahead.' },
  blog_search_placeholder: { mm: 'ဇာတ်လမ်းများကို ရှာဖွေရန်...', en: 'Search stories...' },
  blog_search_label: { mm: 'ဘလော့ဇာတ်လမ်းများကို ရှာဖွေရန်', en: 'Search blog stories' },
  blog_sort_label: { mm: 'ဇာတ်လမ်းများကို စီရန်', en: 'Sort stories' },
  blog_sort_latest: { mm: 'နောက်ဆုံးထွက်', en: 'Newest' },
  blog_sort_popular: { mm: 'လူကြိုက်များ', en: 'Most viewed' },
  blog_story_count: { mm: 'ဇာတ်လမ်း {count} ပုဒ်', en: '{count} stories' },
  blog_no_results: { mm: 'ကိုက်ညီတဲ့ ဇာတ်လမ်း မတွေ့ပါ။', en: 'No stories match that search.' },
  blog_clear_search: { mm: 'ရှာဖွေမှု ရှင်းရန်', en: 'Clear search' },
  blog_author_prefix: { mm: 'ရေးသားသူ', en: 'By' },
  blog_read_time: { mm: '{minutes} မိနစ်ဖတ်ရန်', en: '{minutes} min read' },
  blog_away: { mm: 'ကွာဝေး', en: 'away' },
  blog_rating: { mm: 'အဆင့်သတ်မှတ်ချက်', en: 'Rating' },
  blog_share: { mm: 'မျှဝေရန်', en: 'Share story' },
  blog_save: { mm: 'အကြိုက်ဆုံးထဲ ထည့်ရန်', en: 'Save story' },
  blog_saved: { mm: 'အကြိုက်ဆုံးထဲ ထည့်ပြီးပါပြီ', en: 'Remove from favorites' },
  blog_unsaved: { mm: 'အကြိုက်ဆုံးမှ ဖယ်ရှားပြီးပါပြီ', en: 'Save to favorites' },
  blog_link_copied: { mm: 'လင့်ခ်ကို ကူးယူပြီးပါပြီ', en: 'Story link copied' },
  blog_share_unavailable: { mm: 'မျှဝေမရပါ။ လင့်ခ်ကို ပြန်ကြိုးစားပါ။', en: 'Sharing is unavailable right now.' },
  blog_close: { mm: 'ပိတ်ရန်', en: 'Close' },
  blog_reader_label: { mm: 'ဇာတ်လမ်းဖတ်ရှုရန်', en: 'Story reader' },
  blog_story_image: { mm: 'ခရီးသွားဇာတ်လမ်း ဓာတ်ပုံ', en: 'Travel story photograph' },

  // Travel Plans page
  travel_plans_search_label: { mm: 'ခရီးစဉ်များကို ရှာရန်', en: 'Search travel plans' },
  travel_plans_search_placeholder: { mm: 'မြို့အမည် သို့မဟုတ် ခရီးစဉ် ရှာရန်...', en: 'Search by city or route...' },
  travel_plans_duration_label: { mm: 'ခရီးစဉ်ကြာချိန်', en: 'Trip duration' },
  travel_plans_all_durations: { mm: 'အားလုံး', en: 'All durations' },
  travel_plans_short: { mm: '၃ ရက်အထိ', en: 'Up to 3 days' },
  travel_plans_long: { mm: '၅ ရက်နှင့်အထက်', en: '5 days or more' },
  travel_plans_sort_label: { mm: 'စီရန်', en: 'Sort plans' },
  travel_plans_most_viewed: { mm: 'လူကြည့်အများဆုံး', en: 'Most viewed' },
  travel_plans_top_rated: { mm: 'အဆင့်အမြင့်ဆုံး', en: 'Top rated' },
  travel_plans_lowest_price: { mm: 'စျေးနှုန်းအနိမ့်ဆုံး', en: 'Lowest price' },
  travel_plans_results: { mm: 'တွေ့ရှိသော ခရီးစဉ်များ', en: 'Available plans' },
  travel_plans_no_results: { mm: 'ကိုက်ညီတဲ့ ခရီးစဉ် မတွေ့ပါ။', en: 'No travel plans match your search.' },
  travel_plans_custom_title: { mm: 'ကိုယ်ပိုင်ခရီးစဉ် ဆွဲရန်', en: 'Create your own plan' },
  travel_plans_custom_intro: { mm: 'စတင်မည့်နေရာ၊ သွားမည့်နေရာများ၊ လူဦးရေနဲ့ ခရီးသွားလိုတဲ့ပုံစံကို အသေးစိတ်ထည့်ပြီး ကိုယ်ပိုင်ခရီးစဉ်ကို ဆွဲပါ။', en: 'Build a detailed itinerary with your start point, destinations, travelers, and travel preferences.' },
  travel_plans_custom_start: { mm: 'စတင်မည့်နေရာ', en: 'Starting point' },
  travel_plans_custom_start_placeholder: { mm: 'ဥပမာ - ရန်ကုန်...', en: 'e.g. Yangon...' },
  travel_plans_custom_destination: { mm: 'သွားမည့်နေရာ', en: 'Destination' },
  travel_plans_custom_destination_placeholder: { mm: 'ဥပမာ - ပုဂံ၊ အင်းလေး၊ မန္တလေး...', en: 'e.g. Bagan, Inle Lake, Mandalay...' },
  travel_plans_custom_nationality: { mm: 'နိုင်ငံသားအမျိုးအစား', en: 'Traveler type' },
  travel_plans_custom_nationality_citizen: { mm: 'မြန်မာနိုင်ငံသား', en: 'Myanmar citizen' },
  travel_plans_custom_nationality_foreigner: { mm: 'နိုင်ငံခြားသား', en: 'Foreigner' },
  travel_plans_custom_hotel: { mm: 'တည်းမည့်ဟိုတယ်', en: 'Hotel to stay' },
  travel_plans_custom_hotel_later: { mm: 'မရွေးသေးပါ — နောက်မှရွေးမည်', en: 'Not selected — choose later' },
  travel_plans_custom_places: { mm: 'လည်ပတ်လိုသောနေရာများ — MH Travel data ထဲမှ ရွေးပါ', en: 'Places to visit — choose from MH Travel data' },
  travel_plans_custom_days: { mm: 'ရက်', en: 'Days' },
  travel_plans_custom_travelers: { mm: 'ခရီးသည်', en: 'Travelers' },
  travel_plans_custom_travelers_suffix: { mm: 'ယောက်', en: 'travelers' },
  travel_plans_custom_budget: { mm: 'ဘတ်ဂျက်', en: 'Budget' },
  travel_plans_custom_budget_low: { mm: 'သက်သာသော', en: 'Budget-friendly' },
  travel_plans_custom_budget_mid: { mm: 'အလယ်အလတ်', en: 'Mid-range' },
  travel_plans_custom_budget_high: { mm: 'အဆင့်မြင့်', en: 'Premium' },
  travel_plans_custom_transport: { mm: 'သွားလာရေး', en: 'Transport' },
  travel_plans_custom_transport_car: { mm: 'ကား / ယာဉ်သီးသန့်', en: 'Private car' },
  travel_plans_custom_transport_bus: { mm: 'ဘတ်စ် / အများသုံး', en: 'Bus / public' },
  travel_plans_custom_transport_mixed: { mm: 'ရောနှောအသုံးပြုမည်', en: 'Mixed transport' },
  travel_plans_custom_stay: { mm: 'တည်းခိုရန်', en: 'Stay' },
  travel_plans_custom_stay_hotel: { mm: 'ဟိုတယ်', en: 'Hotel' },
  travel_plans_custom_stay_guesthouse: { mm: 'Guesthouse', en: 'Guesthouse' },
  travel_plans_custom_stay_flexible: { mm: 'အကြံပြုချက်အတိုင်း', en: 'Recommend for me' },
  travel_plans_custom_notes: { mm: 'မှတ်ချက်', en: 'Notes' },
  travel_plans_custom_notes_placeholder: { mm: 'ထည့်လိုသောနေရာများ၊ အစားအသောက်၊ လှုပ်ရှားမှုများ...', en: 'Places, food, activities, or special requests...' },
  travel_plans_custom_button: { mm: 'MH Travel ထံ ပို့မည်', en: 'Send to MH Travel' },
  travel_plans_custom_sent_button: { mm: 'တောင်းဆိုပြီးပါပြီ', en: 'Request sent' },
  travel_plans_custom_saved: { mm: 'သင့်စိတ်ကြိုက်ခရီးစဉ်:', en: 'Your custom plan:' },
  travel_plans_custom_day_suffix: { mm: 'ရက်', en: 'days' },
  travel_plans_custom_step_request: { mm: 'သင့်ခရီးစဉ်အသေးစိတ်ကို MH Travel ထံ ပို့မည်', en: 'Send your plan details to MH Travel' },
  travel_plans_custom_step_quote: { mm: 'MH Travel က ကုန်ကျငွေတွက်ပြီး အစီအစဉ်ပြန်ပေးမည်', en: 'MH Travel calculates the cost and prepares the plan' },
  travel_plans_custom_step_confirm: { mm: 'သွားမည့်အခါ MH Travel နဲ့ ဆက်သွယ်ပြီး နေရာများကို ညှိနှိုင်းမည်', en: 'Contact MH Travel to confirm and negotiate destinations' },
  travel_plans_custom_request_received: { mm: 'သင့် Custom Plan request ကို MH Travel ထံ ပို့ပြီးပါပြီ။', en: 'Your Custom Plan request has been sent to MH Travel.' },
  travel_plans_custom_request_next: { mm: 'MH Travel ဘက်က သင့်အချက်အလက်တွေကို စစ်ဆေးပြီး ကုန်ကျငွေတွက်ပေးပါမယ်။ သွားမည့်နေရာနဲ့ ဝန်ဆောင်မှုတွေကိုလည်း သင့်နဲ့ ပြန်လည်ညှိနှိုင်းဆက်သွယ်ပေးပါမယ်။', en: 'MH Travel will review your details, calculate the cost, and contact you to confirm services and negotiate the places you want to visit.' },

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
