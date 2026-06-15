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
  color: string;
}

const categories: Category[] = [
  { icon: Hotel, labelEn: 'Hotels', labelMm: 'ဟိုတယ်များ', color: 'bg-blue-100 text-[#1E88E5]' },
  { icon: UtensilsCrossed, labelEn: 'Restaurants', labelMm: 'စားသောက်ဆိုင်များ', color: 'bg-orange-100 text-[#FFA726]' },
  { icon: Camera, labelEn: 'Attractions', labelMm: 'လည်ပတ်စရာများ', color: 'bg-emerald-100 text-emerald-600' },
  { icon: BookOpen, labelEn: 'Guides & Blogs', labelMm: 'လမ်းညွှန်များနှင့် ဘလော့ဂ်များ', color: 'bg-purple-100 text-purple-600' },
  { icon: Map, labelEn: 'Tours', labelMm: 'တူရုးများ', color: 'bg-rose-100 text-rose-600' },
  { icon: CalendarDays, labelEn: 'Planner', labelMm: 'စီမံချက်', color: 'bg-amber-100 text-amber-600' },
];

const translations = {
  en: {
    title: 'Popular Categories',
    subtitle: 'Find exactly what you need for your trip',
  },
  mm: {
    title: 'လူကြိုက်များသော အမျိုးအစားများ',
    subtitle: 'သင့်ခရီးစဉ်အတွက် လိုအပ်သည်များကို ရှာပါ',
  },
};

export default function PopularCategories({ language, darkMode = false }: PopularCategoriesProps) {
  const t = translations[language];

  return (
    <section className={`py-16 ${darkMode ? 'bg-slate-800' : 'bg-white'} transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-2`}>{t.title}</h2>
          <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <a
                key={cat.labelEn}
                href="#"
                className={`group flex flex-col items-center p-6 ${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${darkMode ? 'border-slate-600' : 'border border-slate-100'}`}
              >
                <div className={`w-14 h-14 ${cat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-7 h-7" />
                </div>
                <span className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-slate-700'} text-center`}>
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
