import { Hotel, UtensilsCrossed, Camera, BookOpen, Map, CalendarDays } from 'lucide-react';
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
  { icon: Camera, labelEn: 'Attractions', labelMm: 'လည်ပတ်စရာများ', bgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { icon: BookOpen, labelEn: 'Guides', labelMm: 'လမ်းညွှန်များ', bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
  { icon: Map, labelEn: 'Tours', labelMm: 'တူရုးများ', bgColor: 'bg-rose-100', iconColor: 'text-rose-600' },
  { icon: CalendarDays, labelEn: 'Planner', labelMm: 'စီမံချက်', bgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
];

const translations = {
  en: {
    title: 'Categories',
  },
  mm: {
    title: 'အမျိုးအစားများ',
  },
};

export default function PopularCategories({ language, darkMode = false }: PopularCategoriesProps) {
  const t = translations[language];

  return (
    <section className={`py-8 ${darkMode ? 'bg-slate-800' : 'bg-white'} transition-colors`}>
      <div className="max-w-7xl mx-auto">
        {/* Left-aligned title */}
        <h2 className={`text-lg font-semibold px-4 mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
          {t.title}
        </h2>

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
