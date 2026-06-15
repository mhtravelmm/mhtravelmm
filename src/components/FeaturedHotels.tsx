import { Star, MapPin } from 'lucide-react';

interface FeaturedHotelsProps {
  language: 'en' | 'mm';
  darkMode?: boolean;
}

const hotels = [
  { id: 1, name: 'The Strand Yangon', location: 'Yangon', rating: 5, price: 350, reviewCount: 428 },
  { id: 2, name: 'Bagan Lodge Resort', location: 'Bagan', rating: 4, price: 180, reviewCount: 312 },
  { id: 3, name: 'Inle Palace Resort', location: 'Inle Lake', rating: 5, price: 280, reviewCount: 256 },
  { id: 4, name: 'Sandoway Resort', location: 'Ngapali Beach', rating: 5, price: 320, reviewCount: 189 },
];

const translations = {
  en: {
    title: 'Featured Hotels',
    subtitle: 'Top-rated accommodations for your stay',
    perNight: '/night',
    rating: 'rating',
    viewAll: 'View All Hotels',
  },
  mm: {
    title: 'ထူးခြားသော ဟိုတယ်များ',
    subtitle: 'သင့်နေထိုင်ရန်အတွက် အဆင့်မြင့်နေရာများ',
    perNight: '/ည',
    rating: 'အဆင့်သတ်မှတ်ချက်',
    viewAll: 'ဟိုတယ်အားလုံးကြည့်ရန်',
  },
};

export default function FeaturedHotels({ language, darkMode = false }: FeaturedHotelsProps) {
  const t = translations[language];

  return (
    <section id="hotels" className={`py-16 ${darkMode ? 'bg-slate-800' : 'bg-white'} transition-colors`}>
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
          {hotels.map((hotel, index) => (
            <a
              key={hotel.id}
              href="#"
              className={`group ${darkMode ? 'bg-slate-700' : 'bg-white'} rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 ${darkMode ? 'border-slate-600' : 'border border-slate-100'}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={`https://picsum.photos/seed/hotel-${hotel.id}-${index}/400/300`}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg">
                  <span className="text-sm font-semibold text-[#FFA726]">
                    ${hotel.price}{t.perNight}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-800'} mb-1 group-hover:text-[#1E88E5] transition-colors`}>
                  {hotel.name}
                </h3>
                <div className={`flex items-center gap-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'} text-sm mb-2`}>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{hotel.location}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < hotel.rating ? 'text-[#FFA726] fill-current' : 'text-slate-200'}`}
                      />
                    ))}
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>({hotel.reviewCount})</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
