import { Clock, Users } from 'lucide-react';

interface PopularToursProps {
  language: 'en' | 'mm';
  darkMode?: boolean;
}

const tours = [
  { id: 1, name: 'Bagan Sunrise Balloon Ride', duration: '4 hours', groupSize: '1-8', price: 450, image: 'balloon' },
  { id: 2, name: 'Inle Lake Day Trip', duration: '8 hours', groupSize: '2-12', price: 120, image: 'boat' },
  { id: 3, name: 'Golden Rock Pilgrimage', duration: '6 hours', groupSize: '1-10', price: 85, image: 'golden' },
  { id: 4, name: 'Yangon Heritage Walking Tour', duration: '3 hours', groupSize: '1-15', price: 35, image: 'heritage' },
];

const translations = {
  en: {
    title: 'Popular Tours',
    subtitle: 'Curated experiences by local experts',
    perPerson: 'per person',
    duration: 'Duration',
    groupSize: 'Group Size',
    bookNow: 'Book Now',
    viewAll: 'View All Tours',
  },
  mm: {
    title: 'လူကြိုက်များသော တူရုးများ',
    subtitle: 'ဒေသခံကျွမ်းကျင်သူများမှ ရွေးချယ်ပေးထားသော အတွေ့အကြုံများ',
    perPerson: 'တစ်ယောက်လျှင်',
    duration: 'ကာလကြာမြင့်ချိန်',
    groupSize: 'အဖွဲ့အရွယ်အစား',
    bookNow: 'ယခု booking လုပ်ပါ',
    viewAll: 'တူရုးအားလုံးကြည့်ရန်',
  },
};

export default function PopularTours({ language, darkMode = false }: PopularToursProps) {
  const t = translations[language];

  return (
    <section id="tours" className={`py-16 ${darkMode ? 'bg-slate-800' : 'bg-white'} transition-colors`}>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tours.map((tour, index) => (
            <a
              key={tour.id}
              href="#"
              className={`group ${darkMode ? 'bg-slate-700' : 'bg-white'} rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${darkMode ? 'border-slate-600' : 'border border-slate-100'}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/tour-${tour.image}-${index}/400/300`}
                  alt={tour.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <span className="text-base font-bold text-[#1E88E5]">${tour.price}</span>
                  <span className="text-xs text-slate-500 block leading-none">{t.perPerson}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'} mb-3 group-hover:text-[#1E88E5] transition-colors`}>
                  {tour.name}
                </h3>
                <div className={`flex items-center gap-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{tour.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{tour.groupSize}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
