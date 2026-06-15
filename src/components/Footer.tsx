import { MapPin, Facebook, Instagram, Youtube, Twitter } from 'lucide-react';

interface FooterProps {
  language: 'en' | 'mm';
  darkMode?: boolean;
}

const translations = {
  en: {
    about: 'Your trusted companion for exploring Myanmar\'s rich heritage, stunning landscapes, and vibrant culture.',
    destinations: 'Destinations',
    travelLinks: 'Travel Links',
    support: 'Support',
    followUs: 'Follow Us',
    copyright: '© 2024 MH Travel. All rights reserved.',
  },
  mm: {
    about: 'မြန်မာနိုင်ငံ၏ ကြွယ်ဝသော အမွေအနှစ်များ၊ လှပသော သဘာဝအလှအပများနှင့် စည်ကားသော ယဉ်ကျေးမှုကို ရှာဖွေရန် သင့်ယုံကြည်ရသော မိတ်ဆပ်',
    destinations: 'ခရီးစခန်းများ',
    travelLinks: 'ခရီးသွားလမ်းကြောင်းများ',
    support: 'အကူအညီ',
    followUs: 'ကျွန်ုပ်တို့ကို လိုက်ပါ',
    copyright: '© 2024 MH Travel မူပိုင်ခွင့်အားလုံးရယူထားသည်။',
  },
};

const destinationLinks = [
  { en: 'Yangon', mm: 'ရန်ကုန်' },
  { en: 'Mandalay', mm: 'မန္တလေး' },
  { en: 'Bagan', mm: 'ဘဂါင်' },
  { en: 'Inle Lake', mm: 'အင်းလေးကန်' },
  { en: 'Ngapali Beach', mm: 'ငပလီကမ်းခြေ' },
];

const travelLinks = [
  { en: 'Hotels', mm: 'ဟိုတယ်များ' },
  { en: 'Restaurants', mm: 'စားသောက်ဆိုင်များ' },
  { en: 'Attractions', mm: 'လည်ပတ်စရာများ' },
  { en: 'Tours', mm: 'တူရုးများ' },
  { en: 'Travel Guides', mm: 'ခရီးသွားလမ်းညွှန်များ' },
];

const supportLinks = [
  { en: 'Help Center', mm: 'အကူအညီစင်တာ' },
  { en: 'Contact Us', mm: 'ဆက်သွယ်ရန်' },
  { en: 'Privacy Policy', mm: 'လုံခြုံရေးမူဝါဒ' },
  { en: 'Terms of Service', mm: 'ဝန်ဆောင်မှု အသုံးပြုမှုစည်းကမ်း' },
];

export default function Footer({ language, darkMode = false }: FooterProps) {
  const t = translations[language];
  const bgMain = darkMode ? 'bg-slate-950' : 'bg-slate-900';
  const bgSocial = darkMode ? 'bg-slate-800 hover:bg-[#1E88E5]' : 'bg-slate-800 hover:bg-[#1E88E5]';
  const borderColor = darkMode ? 'border-slate-700' : 'border-slate-800';

  return (
    <footer className={`${bgMain} text-white pt-16 pb-8 transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <MapPin className="w-8 h-8 text-[#1E88E5]" />
              <span className="text-xl font-bold">
                MH <span className="text-[#FFA726]">Travel</span>
              </span>
            </a>
            <p className={`${darkMode ? 'text-slate-500' : 'text-slate-400'} text-sm leading-relaxed mb-4`}>
              {t.about}
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className={`w-10 h-10 ${bgSocial} rounded-lg flex items-center justify-center transition-colors`}>
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className={`w-10 h-10 ${bgSocial} rounded-lg flex items-center justify-center transition-colors`}>
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className={`w-10 h-10 ${bgSocial} rounded-lg flex items-center justify-center transition-colors`}>
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className={`w-10 h-10 ${bgSocial} rounded-lg flex items-center justify-center transition-colors`}>
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Destinations */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t.destinations}</h3>
            <ul className="space-y-2">
              {destinationLinks.map((link) => (
                <li key={link.en}>
                  <a href="#" className={`${darkMode ? 'text-slate-500' : 'text-slate-400'} hover:text-white transition-colors text-sm`}>
                    {language === 'en' ? link.en : link.mm}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Travel Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t.travelLinks}</h3>
            <ul className="space-y-2">
              {travelLinks.map((link) => (
                <li key={link.en}>
                  <a href="#" className={`${darkMode ? 'text-slate-500' : 'text-slate-400'} hover:text-white transition-colors text-sm`}>
                    {language === 'en' ? link.en : link.mm}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-lg mb-4">{t.support}</h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.en}>
                  <a href="#" className={`${darkMode ? 'text-slate-500' : 'text-slate-400'} hover:text-white transition-colors text-sm`}>
                    {language === 'en' ? link.en : link.mm}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className={`border-t ${borderColor} pt-8`}>
          <p className={`text-center ${darkMode ? 'text-slate-600' : 'text-slate-500'} text-sm`}>
            {t.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
