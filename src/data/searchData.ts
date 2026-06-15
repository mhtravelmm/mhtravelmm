export interface SearchItem {
  id: string;
  name: string;
  nameMm: string;
  type: 'destination' | 'hotel' | 'tour' | 'city';
  subtitle: string;
  subtitleMm: string;
  image: string;
}

export const searchItems: SearchItem[] = [
  // Destinations
  { id: 'dest-1', name: 'Yangon', nameMm: 'ရန်ကုန်', type: 'destination', subtitle: 'Colonial heritage & Shwedagon', subtitleMm: 'ကိုလိုနီဘုရားများနှင့် ရွှေတိဂုံ', image: 'myanmar-yangon' },
  { id: 'dest-2', name: 'Bagan', nameMm: 'ဘဂါင်', type: 'destination', subtitle: 'Ancient temples & pagodas', subtitleMm: 'ရှေးဟောင်းဘုရားများ', image: 'myanmar-bagan' },
  { id: 'dest-3', name: 'Mandalay', nameMm: 'မန္တလေး', type: 'destination', subtitle: 'Cultural capital of Myanmar', subtitleMm: 'မြန်မာ့ယဉ်ကျေးမှုမြို့တော်', image: 'myanmar-mandalay' },
  { id: 'dest-4', name: 'Inle Lake', nameMm: 'အင်းလေးကန်', type: 'destination', subtitle: 'Floating gardens & leg rowers', subtitleMm: 'ရေပန်းဥယျာဉ်များ', image: 'myanmar-inle-lake' },
  { id: 'dest-5', name: 'Ngapali Beach', nameMm: 'ငပလီကမ်းခြေ', type: 'destination', subtitle: 'Pristine beach paradise', subtitleMm: 'သန့်ရှင်းသော ကမ်းခြေ', image: 'myanmar-ngapali' },
  { id: 'dest-6', name: 'Golden Rock', nameMm: 'ကျောက်တလုံးရစ်', type: 'destination', subtitle: 'Sacred pilgrimage site', subtitleMm: 'ဘုရားဖူးနေရာ', image: 'myanmar-golden-rock' },

  // Hotels
  { id: 'hotel-1', name: 'The Strand Yangon', nameMm: 'The Strand Yangon', type: 'hotel', subtitle: 'Luxury heritage hotel in Yangon', subtitleMm: 'ရန်ကုန်ရှိ အဆင့်မြင့် ဟိုတယ်', image: 'hotel-strand' },
  { id: 'hotel-2', name: 'Bagan Lodge Resort', nameMm: 'Bagan Lodge Resort', type: 'hotel', subtitle: 'Boutique resort near temples', subtitleMm: 'ဘုရားများအနီး ဟိုတယ်', image: 'hotel-bagan-lodge' },
  { id: 'hotel-3', name: 'Inle Palace Resort', nameMm: 'Inle Palace Resort', type: 'hotel', subtitle: 'Overwater villas on Inle Lake', subtitleMm: 'အင်းလေးကန်ရှိ ရေပေါ်ဗီလာ', image: 'hotel-inle-palace' },
  { id: 'hotel-4', name: 'Sandoway Resort', nameMm: 'Sandoway Resort', type: 'hotel', subtitle: 'Beachfront resort in Ngapali', subtitleMm: 'ငပလီကမ်းခြေရှိ ဟိုတယ်', image: 'hotel-sandoway' },

  // Tours
  { id: 'tour-1', name: 'Bagan Sunrise Balloon Ride', nameMm: 'ဘဂါင်နေထွက် ရေပူငှက်စီးခရီး', type: 'tour', subtitle: '4 hours balloon experience', subtitleMm: 'နာရီ ၄ နာရီ ရေပူငှက်စီးခရီး', image: 'tour-balloon' },
  { id: 'tour-2', name: 'Inle Lake Day Trip', nameMm: 'အင်းလေးကန် နေ့တာခရီးစဉ်', type: 'tour', subtitle: 'Full day boat tour', subtitleMm: 'နေ့တာလှေစီးခရီး', image: 'tour-boat' },
  { id: 'tour-3', name: 'Golden Rock Pilgrimage', nameMm: 'ကျောက်တလုံးရစ် ဘုရားဖူးခရီး', type: 'tour', subtitle: 'Spiritual journey to Kyaiktiyo', subtitleMm: 'ကျိုက်ထီးရိုးသို့ ဘုရားဖူးခရီး', image: 'tour-golden' },
  { id: 'tour-4', name: 'Yangon Heritage Walking Tour', nameMm: 'ရန်ကုန် ယဉ်ကျေးမှုလမ်းလျှောက်ခရီး', type: 'tour', subtitle: 'Colonial architecture tour', subtitleMm: 'ကိုလိုနီဗိသုကာ လမ်းလျှောက်ခရီး', image: 'tour-heritage' },
];

export function searchItemsByQuery(query: string, language: 'en' | 'mm'): SearchItem[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  return searchItems.filter((item) => {
    const name = language === 'en' ? item.name.toLowerCase() : item.nameMm;
    const subtitle = language === 'en' ? item.subtitle.toLowerCase() : item.subtitleMm;
    return name.includes(lowerQuery) || subtitle.includes(lowerQuery) || item.name.toLowerCase().includes(lowerQuery);
  });
}
