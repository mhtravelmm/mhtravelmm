interface PopularDestinationsProps {
  language: 'en' | 'mm';
  darkMode?: boolean;
}

const destinations = [
  { id: 1, nameEn: 'Yangon', nameMm: 'ရန်ကုန်', descriptionEn: 'Colonial heritage & Shwedagon', descriptionMm: 'ကိုလိုနီဘုရားများနှင့် ရွှေတိဂုံ' },
  { id: 2, nameEn: 'Bagan', nameMm: 'ဘဂါင်', descriptionEn: 'Ancient temples & pagodas', descriptionMm: 'ရှေးဟောင်းဘုရားများ' },
  { id: 3, nameEn: 'Mandalay', nameMm: 'မန္တလေး', descriptionEn: 'Cultural capital of Myanmar', descriptionMm: 'မြန်မာ့ယဉ်ကျေးမှုမြို့တော်' },
  { id: 4, nameEn: 'Inle Lake', nameMm: 'အင်းလေးကန်', descriptionEn: 'Floating gardens & leg rowers', descriptionMm: 'ရေပန်းဥယျာဉ်များ' },
  { id: 5, nameEn: 'Ngapali Beach', nameMm: 'ငပလီကမ်းခြေ', descriptionEn: 'Pristine beach paradise', descriptionMm: 'သန့်ရှင်းသော ကမ်းခြေ' },
  { id: 6, nameEn: 'Golden Rock', nameMm: 'ကျောက်တလုံးရစ်', descriptionEn: 'Sacred pilgrimage site', descriptionMm: 'ဘုရားဖူးနေရာ' },
];

const translations = {
  en: {
    title: 'Popular Destinations',
    subtitle: 'Explore the most visited places in Myanmar',
    explore: 'Explore',
  },
  mm: {
    title: 'လူကြိုက်များသော ခရီးစခန်းများ',
    subtitle: 'မြန်မာနိုင်ငံရှိ လည်ပတ်သူများအများဆုံးနေရာများ',
    explore: 'ရှာဖွေပါ',
  },
};

export default function PopularDestinations({ language, darkMode = false }: PopularDestinationsProps) {
  const t = translations[language];

  return (
    <section id="destinations" className={`py-16 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'} transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-800'} mb-2`}>{t.title}</h2>
            <p className={darkMode ? 'text-slate-400' : 'text-slate-500'}>{t.subtitle}</p>
          </div>
          <a href="#" className="hidden sm:flex items-center gap-1 text-[#1E88E5] font-medium hover:underline">
            {t.explore}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((dest, index) => (
            <a
              key={dest.id}
              href="#"
              className="group relative overflow-hidden rounded-2xl aspect-[4/3] shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <img
                src={`https://picsum.photos/seed/myanmar-${dest.nameEn.toLowerCase()}-${index}/600/450`}
                alt={dest.nameEn}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h3 className="text-xl font-bold text-white mb-1">
                  {language === 'en' ? dest.nameEn : dest.nameMm}
                </h3>
                <p className="text-white/80 text-sm">
                  {language === 'en' ? dest.descriptionEn : dest.descriptionMm}
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
