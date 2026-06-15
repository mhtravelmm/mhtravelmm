import { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Hotel, Compass, X } from 'lucide-react';
import { searchItemsByQuery, SearchItem } from '../data/searchData';

interface HeroProps {
  language: 'en' | 'mm';
}

const translations = {
  en: {
    heading: 'Discover The Beauty of Myanmar',
    subheading: 'Explore ancient temples, pristine beaches, and rich cultural heritage',
    searchPlaceholder: 'Search destinations, hotels, restaurants...',
    searchButton: 'Search',
    explore: 'Explore',
    noResults: 'No results found',
    destination: 'Destination',
    hotel: 'Hotel',
    tour: 'Tour',
    city: 'City',
  },
  mm: {
    heading: 'မြန်မာနိုင်ငံ၏ အလှအပများကို ရှာဖွေပါ',
    subheading: 'ရှေးဟောင်းဘုရားများ၊ သန့်ရှင်းသော ကမ်းခြေများနှင့် ကြွယ်ဝသော ယဉ်ကျေးမှုအမွေအနှစ်များ',
    searchPlaceholder: 'ခရီးစခန်းများ၊ ဟိုတယ်များ၊ စားသောက်ဆိုင်များ ရှာဖွေပါ...',
    searchButton: 'ရှာဖွေပါ',
    explore: 'ရှာဖွေပါ',
    noResults: 'ရလဒ်မတွေ့ပါ',
    destination: 'ခရီးစခန်း',
    hotel: 'ဟိုတယ်',
    tour: 'တူရုး',
    city: 'မြို့',
  },
};

const cities = [
  { name: 'Yangon', nameMm: 'ရန်ကုန်' },
  { name: 'Mandalay', nameMm: 'မန္တလေး' },
  { name: 'Bagan', nameMm: 'ဘဂါင်' },
  { name: 'Inle Lake', nameMm: 'အင်းလေးကန်' },
  { name: 'Ngapali', nameMm: 'ငပလီ' },
];

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  destination: MapPin,
  hotel: Hotel,
  tour: Compass,
  city: MapPin,
};

export default function Hero({ language }: HeroProps) {
  const t = translations[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (query: string) => {
    setSearchQuery(query);
    setHighlightedIndex(-1);
    if (query.trim()) {
      const results = searchItemsByQuery(query, language);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const results = searchItemsByQuery(searchQuery, language);
      setSearchResults(results);
      setShowResults(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit(e);
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setHighlightedIndex(-1);
    }
  };

  const handleResultClick = (item: SearchItem) => {
    setShowResults(false);
    setSearchQuery('');
    setSearchResults([]);
    setHighlightedIndex(-1);
    const element = document.getElementById(item.type + 's');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getTypeIcon = (type: string) => {
    const Icon = typeIcons[type] || MapPin;
    return Icon;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'destination':
        return t.destination;
      case 'hotel':
        return t.hotel;
      case 'tour':
        return t.tour;
      case 'city':
        return t.city;
      default:
        return type;
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://picsum.photos/seed/myanmar-temples/1920/1080"
          alt="Myanmar landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
          {t.heading}
        </h1>
        <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          {t.subheading}
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8 relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <div className="bg-white rounded-xl shadow-2xl p-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-3 px-4">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={t.searchPlaceholder}
                    className="w-full py-3 text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
                    value={searchQuery}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => searchQuery.trim() && setShowResults(true)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="p-1 hover:bg-slate-100 rounded shrink-0"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="bg-[#1E88E5] hover:bg-[#1565C0] text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">{t.searchButton}</span>
                </button>
              </div>
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50">
              {searchResults.length > 0 ? (
                <ul className="max-h-80 overflow-y-auto">
                  {searchResults.map((item, index) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <li
                        key={item.id}
                        className={`border-b border-slate-100 last:border-b-0 ${
                          index === highlightedIndex ? 'bg-blue-50' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleResultClick(item)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                            <img
                              src={`https://picsum.photos/seed/${item.image}/100/100`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <TypeIcon className="w-4 h-4 text-[#1E88E5]" />
                              <span className="text-xs text-[#1E88E5] font-medium uppercase">
                                {getTypeLabel(item.type)}
                              </span>
                            </div>
                            <h3 className="font-semibold text-slate-800">
                              {language === 'en' ? item.name : item.nameMm}
                            </h3>
                            <p className="text-sm text-slate-500 truncate">
                              {language === 'en' ? item.subtitle : item.subtitleMm}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">{t.noResults}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Try searching for "Yangon", "Bagan", or "Hotel"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* City Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-white/60 text-sm">{t.explore}:</span>
          {cities.map((city) => (
            <button
              key={city.name}
              type="button"
              onClick={() => {
                setSearchQuery(language === 'en' ? city.name : city.nameMm);
                handleInputChange(language === 'en' ? city.name : city.nameMm);
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium transition-all border border-white/20 hover:border-white/40"
            >
              {language === 'en' ? city.name : city.nameMm}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center pt-2">
          <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
