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
  notifications_page_intro: { mm: 'MH Travel မှ သင့်ခရီးစဉ်နဲ့ သက်ဆိုင်တဲ့ နောက်ဆုံးအသိပေးချက်များ။', en: 'The latest updates from MH Travel about your travel activity.' },
  notifications_back_account: { mm: 'အကောင့်', en: 'Account' },
  notifications_filter_all: { mm: 'အားလုံး', en: 'All' },
  notifications_filter_unread: { mm: 'မဖတ်ရသေးသော', en: 'Unread' },
  notifications_filter_read: { mm: 'ဖတ်ပြီးသော', en: 'Read' },
  notifications_unread_count: { mm: 'မဖတ်ရသေးပါ', en: 'unread' },
  notifications_today: { mm: 'ယနေ့', en: 'Today' },
  notifications_earlier: { mm: 'ယခင်အသိပေးချက်များ', en: 'Earlier' },
  notifications_empty_detail: { mm: 'အသစ်ထပ်ရောက်လာတဲ့အခါ ဒီနေရာမှာ ပြပေးပါမယ်။', en: 'New updates will appear here when they arrive.' },

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
  nearby_title: { mm: 'အနီးအနားရှိ နေရာများ', en: 'Nearby places' },
  nearby_intro: { mm: 'သင့်တည်နေရာနဲ့ အနီးဆုံးဆိုင်တွေကို ရှာဖွေပါ။ အမည်၊ အမျိုးအစား၊ Rating နဲ့ အကွာအဝေးအလိုက် စစ်ထုတ်နိုင်ပါတယ်။', en: 'Find places closest to your location. Search directly and filter by category, rating, and distance.' },
  nearby_use_location: { mm: 'တည်နေရာအသုံးပြုမည်', en: 'Use my location' },
  nearby_location_ready: { mm: 'တည်နေရာရပါပြီ', en: 'Location ready' },
  nearby_location_loading: { mm: 'တည်နေရာရှာနေသည်...', en: 'Finding your location...' },
  nearby_location_ready_detail: { mm: 'သင့်လက်ရှိတည်နေရာအပေါ်မူတည်ပြီး အကွာအဝေးတွက်ထားပါတယ်။', en: 'Distances are calculated from your current location.' },
  nearby_location_fallback: { mm: 'တည်နေရာခွင့်ပြုချက်မရသေးပါ။ Yangon အခြေခံအကွာအဝေးကို အသုံးပြုထားပါတယ်။', en: 'Location permission is unavailable, so Yangon fallback distances are shown.' },
  nearby_search_placeholder: { mm: 'Hotel, Restaurant, Cafe စသည်ဖြင့် ရှာရန်...', en: 'Search hotel, restaurant, cafe...' },
  nearby_all_categories: { mm: 'အမျိုးအစားအားလုံး', en: 'All categories' },
  nearby_all_ratings: { mm: 'Rating အားလုံး', en: 'All ratings' },
  nearby_rating_label: { mm: 'နှင့်အထက်', en: 'rating' },
  nearby_within_5: { mm: '၅ km အတွင်း', en: 'Within 5 km' },
  nearby_within_10: { mm: '၁၀ km အတွင်း', en: 'Within 10 km' },
  nearby_within_20: { mm: '၂၀ km အတွင်း', en: 'Within 20 km' },
  nearby_any_distance: { mm: 'အကွာအဝေးအားလုံး', en: 'Any distance' },
  nearby_nearest_title: { mm: 'အနီးဆုံးနေရာများ', en: 'Closest places' },
  nearby_recommended_title: { mm: 'Rating ကောင်းပြီး အနည်းငယ်ဝေးသောနေရာများ', en: 'Highly rated places nearby' },
  nearby_recommended_intro: { mm: 'အနီးဆုံးစာရင်းပြီးနောက် အမျိုးအစားအလိုက် Rating ကောင်းသောနေရာများကို ပြထားပါတယ်။', en: 'After the closest results, see well-rated places grouped by category.' },
  nearby_places: { mm: 'နေရာ', en: 'places' },
  nearby_no_results: { mm: 'သတ်မှတ်ချက်နဲ့ ကိုက်ညီတဲ့ အနီးအနားနေရာ မတွေ့ပါ။', en: 'No nearby places match your filters.' },
  nearby_no_recommendations: { mm: 'အကြံပြုရန် နေရာမတွေ့ပါ။ Filter ကို ပြန်လျှော့ကြည့်ပါ။', en: 'No recommendations match these filters. Try widening them.' },
  nearby_category_hotel: { mm: 'ဟိုတယ်များ', en: 'Hotels' },
  nearby_category_restaurant: { mm: 'စားသောက်ဆိုင်များ', en: 'Restaurants' },
  nearby_category_cafe: { mm: 'ကော်ဖီဆိုင်များ', en: 'Cafes' },
  nearby_category_book_shop: { mm: 'စာအုပ်ဆိုင်များ', en: 'Book shops' },
  nearby_category_attraction: { mm: 'လည်ပတ်စရာများ', en: 'Attractions' },
  nearby_category_market: { mm: 'စျေးများ', en: 'Markets' },
  nearby_category_rental: { mm: 'ငှားရမ်းခြင်း', en: 'Rentals' },
  // User account dashboard
  account_traveler_badge: { mm: 'MH Travel ခရီးသွားအကောင့်', en: 'MH Travel traveler account' },
  account_edit_profile: { mm: 'Profile ပြင်ရန်', en: 'Edit profile' },
  account_stat_bookings: { mm: 'Booking များ', en: 'Bookings' },
  account_stat_plans: { mm: 'ခရီးစဉ်များ', en: 'Travel plans' },
  account_stat_saved: { mm: 'သိမ်းထားသည်များ', en: 'Saved items' },
  account_stat_reviews: { mm: 'သုံးသပ်ချက်များ', en: 'Reviews' },
  account_overview: { mm: 'Dashboard', en: 'Dashboard' },
  account_bookings: { mm: 'My Bookings', en: 'My Bookings' },
  account_plans: { mm: 'My Travel Plans', en: 'My Travel Plans' },
  account_favorites: { mm: 'Favorites', en: 'Favorites' },
  account_reviews: { mm: 'My Reviews', en: 'My Reviews' },
  account_messages: { mm: 'Messages', en: 'Messages' },
  account_settings: { mm: 'Settings', en: 'Settings' },
  account_support: { mm: 'Support / Legal', en: 'Support / Legal' },
  account_logout: { mm: 'ထွက်မည်', en: 'Log out' },
  account_welcome: { mm: 'ပြန်လည်ကြိုဆိုပါတယ်၊ Aung Aung', en: 'Welcome back, Aung Aung' },
  account_overview_intro: { mm: 'သင့်ခရီးစဉ်များ၊ booking များနဲ့ သိမ်းထားသောအရာများကို ဒီနေရာကနေ စီမံနိုင်ပါတယ်။', en: 'Manage your trips, bookings, saved places, and travel activity from here.' },
  account_verified: { mm: 'အကောင့်အတည်ပြုပြီး', en: 'Verified account' },
  account_upcoming_booking: { mm: 'လာမည့် Booking', en: 'Upcoming booking' },
  account_custom_plan: { mm: 'Custom Plan', en: 'Custom plan' },
  account_saved_preview: { mm: 'သိမ်းထားသောနေရာများ', en: 'Saved places' },
  account_recent_activity: { mm: 'နောက်ဆုံးလုပ်ဆောင်ချက်များ', en: 'Recent activity' },
  account_view_all: { mm: 'အားလုံးကြည့်ရန်', en: 'View all' },
  account_confirmed: { mm: 'အတည်ပြုပြီး', en: 'Confirmed' },
  account_completed: { mm: 'ပြီးဆုံးပြီး', en: 'Completed' },
  account_quotation_pending: { mm: 'ကုန်ကျငွေတွက်ရန် စောင့်နေသည်', en: 'Quotation pending' },
  account_plan_review_message: { mm: 'MH Travel ဘက်က သင့် Custom Plan ကို စစ်ဆေးပြီး ကုန်ကျငွေတွက်ပေးပါမယ်။', en: 'MH Travel is reviewing your Custom Plan and will prepare the quotation.' },
  account_sent_to_mh: { mm: 'MH Travel ထံပို့ပြီး', en: 'Sent to MH Travel' },
  account_awaiting_quote: { mm: 'Quotation စောင့်နေသည်', en: 'Awaiting quote' },
  account_confirm: { mm: 'အတည်ပြုရန်', en: 'Confirm' },
  account_bookings_intro: { mm: 'သင့် booking များနဲ့ လက်ရှိအခြေအနေများကို ကြည့်ပါ။', en: 'View your bookings and their current status.' },
  account_plans_intro: { mm: 'သင်ဆွဲထားသော Custom Plans များကို စီမံပါ။', en: 'Manage the custom travel plans you have created.' },
  account_favorites_intro: { mm: 'နောက်မှပြန်ကြည့်ရန် သိမ်းထားသောနေရာများ။', en: 'Places and plans you saved for later.' },
  account_reviews_intro: { mm: 'သင်ရေးထားသော reviews များကို စီမံပါ။', en: 'Manage the reviews you have written.' },
  account_messages_intro: { mm: 'MH Travel နဲ့ ဆက်သွယ်ထားသော စာများ။', en: 'Messages and updates from MH Travel.' },
  account_message_sample: { mm: 'သင့် Custom Plan request ကို လက်ခံရရှိပါပြီ။ Quotation ပြင်ဆင်ပြီး သင့်ထံ ပြန်လည်ဆက်သွယ်ပေးပါမယ်။', en: 'We received your Custom Plan request. We will prepare the quotation and contact you shortly.' },
  account_settings_intro: { mm: 'သင့် profile၊ privacy နဲ့ payment settings များကို ပြင်ဆင်ပါ။', en: 'Update your profile, privacy, and payment preferences.' },
  account_profile_settings: { mm: 'Profile အချက်အလက်', en: 'Profile information' },
  account_privacy_settings: { mm: 'Privacy settings', en: 'Privacy settings' },
  account_payment_settings: { mm: 'Payment methods', en: 'Payment methods' },
  account_private: { mm: 'Private', en: 'Private' },
  account_payment_methods: { mm: 'မထည့်ရသေးပါ', en: 'Not added yet' },
  account_support_intro: { mm: 'အကူအညီ၊ စည်းကမ်းချက်နဲ့ MH Travel ကို ဆက်သွယ်ရန်။', en: 'Get help, read legal information, or contact MH Travel.' },
  account_help_center: { mm: 'Help Center', en: 'Help Center' },
  account_terms: { mm: 'Terms & Conditions', en: 'Terms & Conditions' },
  account_contact_support: { mm: 'Support ကို ဆက်သွယ်ရန်', en: 'Contact support' },
  account_open: { mm: 'ဖွင့်ရန်', en: 'Open' },
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
  blog_back_to_stories: { mm: 'ဇာတ်လမ်းများသို့ ပြန်သွားမည်', en: 'Back to stories' },
  blog_related_hotels: { mm: 'အနီးအနားရှိ လူကြိုက်များသော ဟိုတယ်များ', en: 'Popular hotels to consider' },
  blog_view_all_hotels: { mm: 'ဟိုတယ်အားလုံးကြည့်ရန်', en: 'View all hotels' },
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

  // Restaurants detail page
  restaurant_breadcrumb_restaurants: { mm: 'စားသောက်ဆိုင်များ', en: 'Restaurants' },
  restaurant_name: { mm: 'The Rangoon House', en: 'The Rangoon House' },
  restaurant_open_now: { mm: 'ဖွင့်ထားသည်', en: 'Open now' },
  restaurant_reviews: { mm: 'သုံးသပ်ချက်', en: 'reviews' },
  restaurant_description: { mm: 'ကမာရွတ်မြို့နယ်အတွင်း လှပသောဥယျာဉ်ပတ်ဝန်းကျင်နဲ့ မြန်မာအစားအစာများကို ခံစားနိုင်ပါသည်။', en: 'Authentic Burmese cuisine in a beautiful garden setting with rooftop views in the heart of Kamayut.' },
  restaurant_save: { mm: 'သိမ်းထားမည်', en: 'Save' },
  restaurant_saved: { mm: 'သိမ်းထားပြီး', en: 'Saved' },
  restaurant_directions: { mm: 'လမ်းညွှန်', en: 'Directions' },
  restaurant_call: { mm: 'ဖုန်းဆက်ရန်', en: 'Call now' },
  restaurant_address: { mm: 'လိပ်စာ', en: 'Address' },
  restaurant_open_hours: { mm: 'ဖွင့်ချိန်', en: 'Open hours' },
  restaurant_price_range: { mm: 'စျေးနှုန်းအဆင့်', en: 'Price range' },
  restaurant_cuisine: { mm: 'အစားအစာအမျိုးအစား', en: 'Cuisine' },
  restaurant_view_map: { mm: 'မြေပုံတွင်ကြည့်ရန်', en: 'View on map' },
  restaurant_open_everyday: { mm: 'နေ့တိုင်းဖွင့်သည်', en: 'Open everyday' },
  restaurant_mid_range: { mm: 'အလယ်အလတ်စျေးနှုန်း', en: 'Mid-range' },
  restaurant_local_restaurant: { mm: 'ဒေသခံစားသောက်ဆိုင်', en: 'Local restaurant' },
  restaurant_map: { mm: 'စားသောက်ဆိုင်တည်နေရာမြေပုံ', en: 'Restaurant location map' },
  restaurant_food_menu: { mm: 'အစားအစာမီနူး', en: 'Food menu' },
  restaurant_drinks_menu: { mm: 'အဖျော်ယမကာမီနူး', en: 'Drinks menu' },
  restaurant_photos: { mm: 'ဓာတ်ပုံများ', en: 'Photos' },
  restaurant_popular_dishes: { mm: 'လူကြိုက်များသောအစားအစာများ', en: 'Popular dishes' },
  restaurant_view_all_menu: { mm: 'မီနူးအားလုံးကြည့်ရန်', en: 'View all food menu' },
  restaurant_drinks_coming: { mm: 'အဖျော်ယမကာမီနူး မကြာမီလာမည်', en: 'Drinks menu coming soon' },
  restaurant_venue_photos: { mm: 'စားသောက်ဆိုင်ဓာတ်ပုံများ', en: 'Venue photos' },
  restaurant_view_all_photos: { mm: 'ဓာတ်ပုံအားလုံးကြည့်ရန်', en: 'View all photos' },
  restaurant_nearby_attractions: { mm: 'အနီးအနားလည်ပတ်စရာများ', en: 'Nearby attractions' },
  restaurant_view_all_attractions: { mm: 'အားလုံးကြည့်ရန်', en: 'View all attractions' },
  restaurant_cta_title: { mm: 'မြန်မာနိုင်ငံကို သင့်စိတ်ကြိုက်လည်ပတ်ပါ', en: 'Explore Myanmar your way' },
  restaurant_cta_body: { mm: 'ဟိုတယ်၊ ခရီးစဉ်နဲ့ လှုပ်ရှားမှုများကို MH Travel မှာ ရှာဖွေပါ။', en: 'Book hotels, tours and activities with MH Travel.' },
  restaurant_explore_button: { mm: 'စတင်ရှာဖွေမည်', en: 'Explore now' },

  // Book Shop detail page
  bookshop_breadcrumb: { mm: 'စာအုပ်ဆိုင်များ', en: 'Book shops' },
  bookshop_name: { mm: 'Book Nook Yangon', en: 'Book Nook Yangon' },
  bookshop_open_now: { mm: 'ဖွင့်ထားသည်', en: 'Open now' },
  bookshop_reviews: { mm: 'သုံးသပ်ချက်', en: 'reviews' },
  bookshop_description: { mm: 'စာအုပ်ကောင်းများ၊ ကော်ဖီနဲ့ စာဖတ်ရန်အေးချမ်းသောနေရာကို ရန်ကုန်မြို့အလယ်မှာ ရှာဖွေပါ။', en: 'A cozy English bookstore and coffee space in the heart of Yangon.' },
  bookshop_save: { mm: 'သိမ်းထားမည်', en: 'Save' },
  bookshop_saved: { mm: 'သိမ်းထားပြီး', en: 'Saved' },
  bookshop_directions: { mm: 'လမ်းညွှန်', en: 'Directions' },
  bookshop_call: { mm: 'ဖုန်းဆက်ရန်', en: 'Call' },
  bookshop_address: { mm: 'လိပ်စာ', en: 'Address' },
  bookshop_open_hours: { mm: 'ဖွင့်ချိန်', en: 'Open hours' },
  bookshop_phone: { mm: 'ဖုန်း', en: 'Phone' },
  bookshop_price_range: { mm: 'စျေးနှုန်းအဆင့်', en: 'Price range' },
  bookshop_services: { mm: 'ဝန်ဆောင်မှုများ', en: 'Services' },
  bookshop_view_map: { mm: 'မြေပုံတွင်ကြည့်ရန်', en: 'View on map' },
  bookshop_open_everyday: { mm: 'နေ့တိုင်းဖွင့်သည်', en: 'Open everyday' },
  bookshop_affordable: { mm: 'သင့်တင့်သောစျေးနှုန်း', en: 'Affordable' },
  bookshop_about_title: { mm: 'Book Nook Yangon အကြောင်း', en: 'About Book Nook Yangon' },
  bookshop_about_body: { mm: 'Book Nook သည် စာအုပ်ရွေးချယ်စရာများပြားပြီး စာဖတ်ရန်အေးချမ်းသောနေရာနဲ့ ကော်ဖီကောင်းများကို ပေးစွမ်းသော စာအုပ်ဆိုင်နှင့် community hub တစ်ခုဖြစ်ပါသည်။', en: 'Book Nook is an independent English bookstore and community hub offering a wide selection of books, a cozy reading space, and delicious coffee.' },
  bookshop_books: { mm: 'စာအုပ်များ', en: 'Books' },
  bookshop_stationery: { mm: 'စာရေးကိရိယာ', en: 'Stationery' },
  bookshop_gifts: { mm: 'လက်ဆောင်များ', en: 'Gifts & souvenirs' },
  bookshop_photos: { mm: 'ဓာတ်ပုံများ', en: 'Photos' },
  bookshop_popular_books: { mm: 'လူကြိုက်များသောစာအုပ်များ', en: 'Popular books' },
  bookshop_view_all_books: { mm: 'စာအုပ်အားလုံးကြည့်ရန်', en: 'View all books' },
  bookshop_stationery_coming: { mm: 'စာရေးကိရိယာများ မကြာမီလာမည်', en: 'Stationery collection coming soon' },
  bookshop_gifts_coming: { mm: 'လက်ဆောင်ပစ္စည်းများ မကြာမီလာမည်', en: 'Gifts and souvenirs coming soon' },
  bookshop_venue_photos: { mm: 'ဆိုင်ဓာတ်ပုံများ', en: 'Venue photos' },
  bookshop_view_all_photos: { mm: 'ဓာတ်ပုံအားလုံးကြည့်ရန်', en: 'View all photos' },
  bookshop_nearby_attractions: { mm: 'အနီးအနားလည်ပတ်စရာများ', en: 'Nearby attractions' },
  bookshop_view_all_attractions: { mm: 'အားလုံးကြည့်ရန်', en: 'View all attractions' },
  bookshop_cta_title: { mm: 'မြန်မာနိုင်ငံကို သင့်စိတ်ကြိုက်လည်ပတ်ပါ', en: 'Explore Myanmar your way' },
  bookshop_cta_body: { mm: 'ဟိုတယ်၊ ခရီးစဉ်နဲ့ လှုပ်ရှားမှုများကို MH Travel မှာ ရှာဖွေပါ။', en: 'Book hotels, tours and activities with MH Travel.' },
  bookshop_explore_button: { mm: 'စတင်ရှာဖွေမည်', en: 'Explore now' },

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
