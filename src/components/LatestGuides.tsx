import { Clock, User } from 'lucide-react';

interface LatestGuidesProps {
  language: 'en' | 'mm';
  darkMode?: boolean;
}

const guides = [
  { id: 1, titleEn: 'Ultimate Guide to Bagan Temples', titleMm: 'ဘဂါင်ဘုရားများ လမ်းညွှန်ချက်', descEn: 'Everything you need to know about exploring thousands of ancient pagodas in Bagan.', descMm: 'ဘဂါင်ရှိ ဘုရားပေါင်းများစွာကို လည်ပတ်ရန် သိထားရမည့်အရာများ', author: 'Su Myat', date: 'Jun 10, 2024', readTime: '8 min read' },
  { id: 2, titleEn: 'Best Street Food in Yangon', titleMm: 'ရန်ကုန်၏ အကောင်းဆုံး လမ်းစားသောက်ဆိုင်များ', descEn: 'Discover authentic Myanmar flavors at these must-visit street food spots.', descMm: 'ဤလည်ပတ်ရန် မဖြစ်မနေနေရာများတွင် မြန်မာ့အရသာများကို ရှာဖွေပါ', author: 'Zaw Htet', date: 'Jun 8, 2024', readTime: '5 min read' },
  { id: 3, titleEn: 'Inle Lake: A Traveler\'s Paradise', titleMm: 'အင်းလေးကန် - ခရီးသွားများ၏ နတ်နိုင်ငံ', descEn: 'Explore the unique lifestyle and breathtaking scenery of Inle Lake communities.', descMm: 'အင်းလေးကန်ရှိ ဘဝပုံစံနှင့် လှပသောရှုခင်းများကို လှေကားပါ', author: 'May Thazin', date: 'Jun 5, 2024', readTime: '6 min read' },
];

const translations = {
  en: {
    title: 'Latest Travel Guides',
    subtitle: 'Expert tips and insights from local travelers',
    readMore: 'Read More',
    viewAll: 'View All Guides',
  },
  mm: {
    title: 'နောက်ဆုံး ခရီးသွားလမ်းညွှန်များ',
    subtitle: 'ဒေသခံခရီးသွားများထံမှ ကျွမ်းကျင်သူများ၏ အကြံပြုချက်များ',
    readMore: 'ပိုမိုဖတ်ရှုရန်',
    viewAll: 'လမ်းညွှန်အားလုံးကြည့်ရန်',
  },
};

export default function LatestGuides({ language, darkMode = false }: LatestGuidesProps) {
  const t = translations[language];

  return (
    <section id="guides" className={`py-16 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'} transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-2`}>{t.title}</h2>
            <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{t.subtitle}</p>
          </div>
          <a href="#" className="hidden sm:block text-[#1E88E5] font-medium hover:underline">
            {t.viewAll}
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guides.map((guide, index) => (
            <article
              key={guide.id}
              className={`group ${darkMode ? 'bg-slate-700' : 'bg-white'} rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${darkMode ? 'border-slate-600' : 'border border-slate-100'}`}
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/guide-${guide.id}-${index}/500/300`}
                  alt={guide.titleEn}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-[#1E88E5] text-white px-3 py-1 rounded-full text-xs font-medium">
                  Travel Guide
                </div>
              </div>
              <div className="p-5">
                <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-800'} mb-2 group-hover:text-[#1E88E5] transition-colors line-clamp-2`}>
                  {language === 'en' ? guide.titleEn : guide.titleMm}
                </h3>
                <p className={`${darkMode ? 'text-slate-300' : 'text-slate-500'} text-sm mb-4 line-clamp-2`}>
                  {language === 'en' ? guide.descEn : guide.descMm}
                </p>
                <div className={`flex items-center justify-between text-sm ${darkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{guide.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{guide.readTime}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
