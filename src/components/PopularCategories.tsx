import { useState, useRef, useEffect, useCallback } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Convert vertical mouse wheel to horizontal scroll
  const handleWheel = useCallback((e: WheelEvent) => {
    const container = scrollRef.current;
    if (!container) return;
    e.preventDefault();
    container.scrollLeft += e.deltaY;
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = scrollRef.current;
    if (!container) return;
    setIsDragging(true);
    setStartX(e.pageX - container.offsetLeft);
    setScrollLeft(container.scrollLeft);
    container.style.cursor = 'grabbing';
  };

  const handleMouseUp = () => {
    const container = scrollRef.current;
    if (!container) return;
    setIsDragging(false);
    container.style.cursor = 'grab';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const container = scrollRef.current;
    if (!container) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 1.5;
    container.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      const container = scrollRef.current;
      if (container) container.style.cursor = 'grab';
    }
  };

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
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="categories-scroll"
          style={{
            display: 'flex',
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            gap: '16px',
            paddingLeft: '16px',
            paddingRight: '16px',
            paddingBottom: '8px',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <a
                key={cat.labelEn}
                href="#"
                style={{
                  display: 'inline-flex',
                  flexShrink: 0,
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Circular icon container */}
                <div
                  className={`${cat.bgColor} rounded-full flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`}
                  style={{ width: '56px', height: '56px' }}
                >
                  <Icon className={`w-6 h-6 ${cat.iconColor}`} />
                </div>
                {/* Label below circle */}
                <span
                  className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
                  style={{ whiteSpace: 'nowrap' }}
                >
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
