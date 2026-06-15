import {
  Hotel,
  UtensilsCrossed,
  Coffee,
  Camera,
  ShoppingCart,
  BookOpen,
  Building2,
  Landmark,
  HeartPulse,
  Pill,
  Sparkles,
  Fuel,
  Plane,
  Store,
  ChevronRight,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface PopularCategoriesProps {
  language: 'en' | 'mm';
  darkMode?: boolean;
}

interface Category {
  icon: LucideIcon;
  labelEn: string;
  labelMm: string;
  bgColor: string;
  iconColor: string;
}

const categories: Category[] = [
  { icon: Hotel, labelEn: 'Hotels', labelMm: 'ဟိုတယ်များ', bgColor: 'bg-blue-100', iconColor: 'text-[#1E88E5]' },
  { icon: UtensilsCrossed, labelEn: 'Restaurants', labelMm: 'စားသောက်ဆိုင်များ', bgColor: 'bg-orange-100', iconColor: 'text-[#FFA726]' },
  { icon: Coffee, labelEn: 'Cafes', labelMm: 'ကဖေးများ', bgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
  { icon: Camera, labelEn: 'Attractions', labelMm: 'လည်ပတ်စရာများ', bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { icon: ShoppingCart, labelEn: 'Shopping', labelMm: 'ဈေးဝယ်ရန်', bgColor: 'bg-pink-100', iconColor: 'text-pink-600' },
  { icon: BookOpen, labelEn: 'Book Shops', labelMm: 'စာအုပ်ဆိုင်များ', bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { icon: Building2, labelEn: 'Banks', labelMm: 'ဘဏ်များ', bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  { icon: Landmark, labelEn: 'ATMs', labelMm: 'ငွေသားထုတ်စက်များ', bgColor: 'bg-teal-100', iconColor: 'text-teal-600' },
  { icon: HeartPulse, labelEn: 'Hospitals', labelMm: 'ဆေးရုံများ', bgColor: 'bg-red-100', iconColor: 'text-red-500' },
  { icon: Pill, labelEn: 'Pharmacies', labelMm: 'ဆေးဆိုင်များ', bgColor: 'bg-lime-100', iconColor: 'text-lime-600' },
  { icon: Sparkles, labelEn: 'Spas', labelMm: 'စပါးများ', bgColor: 'bg-violet-100', iconColor: 'text-violet-600' },
  { icon: Fuel, labelEn: 'Gas Stations', labelMm: 'လောင်စာဆီဆိုင်များ', bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  { icon: Plane, labelEn: 'Travel Agency', labelMm: 'ခရီးသွားကော်ပိုရိတ်', bgColor: 'bg-sky-100', iconColor: 'text-sky-600' },
  { icon: Store, labelEn: 'Markets', labelMm: 'ဈေးများ', bgColor: 'bg-rose-100', iconColor: 'text-rose-600' },
];

const translations = {
  en: {
    title: 'Categories',
    viewAll: 'View All',
  },
  mm: {
    title: 'အမျိုးအစားများ',
    viewAll: 'အားလုံးကြည့်ရန်',
  },
};

export default function PopularCategories({ language, darkMode = false }: PopularCategoriesProps) {
  const t = translations[language];

  return (
    <section className={`py-8 ${darkMode ? 'bg-slate-800' : 'bg-white'} transition-colors`}>
      <div className="max-w-7xl mx-auto">
        {/* Header row with title and View All */}
        <div className="flex items-center justify-between px-4 mb-4">
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            {t.title}
          </h2>
          <a
            href="#categories"
            className="flex items-center gap-1 text-sm font-medium text-[#1E88E5] hover:text-[#1565C0] transition-colors"
          >
            {t.viewAll}
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Horizontal scroll container */}
        <div className="flex overflow-x-auto gap-4 px-4 pb-2 scrollbar-hide">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <a
                key={cat.labelEn}
                href="#"
                className="flex flex-col items-center shrink-0 group"
              >
                {/* Circular icon container */}
                <div className={`w-14 h-14 ${cat.bgColor} rounded-full flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-6 h-6 ${cat.iconColor}`} />
                </div>
                {/* Label below circle */}
                <span className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'} whitespace-nowrap`}>
                  {language === 'en' ? cat.labelEn : cat.labelMm}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
