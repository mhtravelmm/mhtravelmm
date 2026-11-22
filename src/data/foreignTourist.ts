import type { Language } from '../types';

export type Bilingual = { mm: string; en: string };

export type TouristSectionId = 'emergency' | 'sim-card' | 'etiquette' | 'currency';

export type EmergencyContact = {
  id: string;
  label: Bilingual;
  phone: string;
  detail: Bilingual;
};

export type SimProvider = {
  id: string;
  name: string;
  data: Bilingual;
};

export type EtiquetteTip = { id: string; title: Bilingual; body: Bilingual };

export type MoneyTip = { id: string; title: Bilingual; body: Bilingual };

/** Post-arrival help only. Visa and other pre-arrival matters stay out. */
export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: 'police', label: { mm: 'ရဲ', en: 'Police' }, phone: '199', detail: { mm: 'အရေးပေါ် ရဲအကူအညီ (၂၄ နာရီ)', en: 'Emergency police assistance, 24 hours' } },
  { id: 'ambulance', label: { mm: 'လူနာတင်ယာဉ်', en: 'Ambulance' }, phone: '192', detail: { mm: 'ဆေးရုံ လူနာတင်ယာဉ် ခေါ်ရန်', en: 'Hospital ambulance dispatch' } },
  { id: 'fire', label: { mm: 'မီးသတ်', en: 'Fire brigade' }, phone: '191', detail: { mm: 'မီးဘေး၊ ရေဘေး အပါအဝင် သဘာဝဘေး အကူအညီ', en: 'Fire and natural-disaster response' } },
  { id: 'mh-travel', label: { mm: 'MH Travel အကူအညီ', en: 'MH Travel support' }, phone: '+95 9 400 686 925', detail: { mm: 'ခရီးစဉ်အတွင်း အရေးပေါ် ဆက်သွယ်ရန်', en: 'Reach us during your trip' } },
];

// Operator names only. Package prices change often, so the page tells the
// reader to confirm at the counter instead of quoting a stale figure.
export const SIM_PROVIDERS: SimProvider[] = [
  { id: 'mpt', name: 'MPT', data: { mm: 'လွှမ်းခြုံမှု အကောင်းဆုံး', en: 'Widest coverage' } },
  { id: 'atom', name: 'ATOM', data: { mm: 'မြို့ကြီးများတွင် ကောင်းသည်', en: 'Strong in major cities' } },
  { id: 'ooredoo', name: 'Ooredoo', data: { mm: 'ဒေတာ ပက်ကေ့ချ် ရွေးချယ်စရာ များသည်', en: 'Many data packages' } },
  { id: 'mytel', name: 'Mytel', data: { mm: 'ကျေးလက်ဒေသတွင် ကောင်းသည်', en: 'Good outside the cities' } },
];

export const SIM_STEPS: { id: string; body: Bilingual }[] = [
  { id: 'buy', body: { mm: 'ရန်ကုန်၊ မန္တလေး နှင့် နေပြည်တော် လေဆိပ်များတွင် ဆင်းမ်ကတ် ဝယ်နိုင်ပါသည်။', en: 'Buy a SIM at Yangon, Mandalay, and Naypyidaw airport arrival halls.' } },
  { id: 'register', body: { mm: 'ပတ်စ်ပို့ မိတ္တူ ပြပြီး နံပါတ်ကို မှတ်ပုံတင်ရန် လိုအပ်ပါသည်။', en: 'Show a copy of your passport; the number must be registered to your name.' } },
  { id: 'topup', body: { mm: 'KBZPay၊ AYA Pay သို့မဟုတ် ဆိုင်များတွင် ဖုန်းငွေဖြည့်နိုင်ပါသည်။', en: 'Top up with KBZPay, AYA Pay, or at any phone shop.' } },
  { id: 'offline', body: { mm: 'ဒေတာ မဝယ်လျှင် ဟိုတယ်နှင့် ကဖေးများ၏ Wi-Fi ကို အသုံးပြုနိုင်ပါသည်။', en: 'Skip data and use hotel and cafe Wi-Fi instead.' } },
];

export const ETIQUETTE_TIPS: EtiquetteTip[] = [
  { id: 'shoes', title: { mm: 'ဘုရားနှင့် ဘုန်းကြီးကျောင်းတွင် ဖိနပ် ချွတ်ပါ', en: 'Remove shoes at pagodas and monasteries' }, body: { mm: 'ဘုရားဝင်းနှင့် ဘုန်းကြီးကျောင်း အတွင်းသို့ ဖိနပ်၊ ခြေအိတ် မပါဘဲ ဝင်ပါ။', en: 'Enter pagoda grounds and monastery buildings barefoot, without socks.' } },
  { id: 'dress', title: { mm: 'ရိုသေလေးစားသော ဝတ်စားဆင်ယင်မှု', en: 'Dress respectfully' }, body: { mm: 'ပခုံးနှင့် ဒူးကို ဖုံးအုပ်သော အဝတ်အစား ဝတ်ပါ။ ဘုရားများတွင် ပိုမို တင်းကျပ်ပါသည်။', en: 'Cover shoulders and knees. Pagodas expect the strictest dress.' } },
  { id: 'monks', title: { mm: 'ဘုန်းကြီးများနှင့် ဓာတ်ပုံရိုက်ခြင်း', en: 'Photographing monks' }, body: { mm: 'ဓာတ်ပုံ မရိုက်မီ ခွင့်ပြုချက် တောင်းပါ။ အမျိုးသမီးများသည် ဘုန်းကြီးကို မထိပါနှင့်။', en: 'Ask before taking a photo. Women should not touch a monk or hand items directly.' } },
  { id: 'hands', title: { mm: 'လက်နှင့် ခေါင်းကို ဂရုစိုက်ပါ', en: 'Mind hands and heads' }, body: { mm: 'အရာဝတ္ထုကို ညာလက်ဖြင့် ပေးပါ။ ကလေးများ၏ ခေါင်းကို မထိပါနှင့်။', en: 'Give and receive with your right hand. Do not touch an adult on the head.' } },
  { id: 'money', title: { mm: 'ငွေကို ညင်သာစွာ ကိုင်တွယ်ပါ', en: 'Handle money politely' }, body: { mm: 'ငွေကို လက်ဖြင့် တိုက်ရိုက် မပေးဘဲ စားပွဲပေါ် ချပေးခြင်းက ပိုသင့်တင့်ပါသည်။', en: 'Placing money on the counter reads as more polite than handing it over.' } },
  { id: 'respect', title: { mm: 'ဘုရားပုံတော်များကို လေးစားပါ', en: 'Respect Buddha images' }, body: { mm: 'ဘုရားပုံတော်ကို မှီပြီး ဓာတ်ပုံရိုက်ခြင်း၊ ကျောခိုင်းထိုင်ခြင်း မပြုပါနှင့်။', en: 'Do not pose with your back to a Buddha image or lean on one for a photo.' } },
];

export const MONEY_TIPS: MoneyTip[] = [
  { id: 'cash', title: { mm: 'ငွေသား အများစု လိုအပ်သည်', en: 'Carry cash' }, body: { mm: 'ဈေးနှင့် ဈေးသေးဆိုင်များတွင် ငွေသားသာ လက်ခံပါသည်။ ကျပ် ငွေသား အသင့် ထားပါ။', en: 'Markets and small shops take cash only. Keep kyat notes on hand.' } },
  { id: 'notes', title: { mm: 'ကျပ်ငွေစက္ကူ အခြေအနေ', en: 'Note condition' }, body: { mm: 'အပေါက်အပြဲ၊ ခြစ်ရာ ရှိသော ငွေစက္ကူများကို လက်ခံရန် ငြင်းနိုင်ပါသည်။', en: 'Torn or heavily marked notes may be refused.' } },
  { id: 'atm', title: { mm: 'ATM နှင့် ကတ်', en: 'ATMs and cards' }, body: { mm: 'ရန်ကုန်နှင့် မန္တလေးတွင် ATM များ ရှိပြီး ငွေထုတ်ခ ကောက်ခံပါသည်။ ဟိုတယ်နှင့် ခရီးသွား ဝန်ဆောင်မှုများတွင် ကတ် သုံးနိုင်ပါသည်။', en: 'Yangon and Mandalay have ATMs with a withdrawal fee. Hotels and travel services accept cards.' } },
  { id: 'tipping', title: { mm: 'ပိုက်ဆံ ထပ်ပေးခြင်း (Tipping)', en: 'Tipping' }, body: { mm: 'မဖြစ်မနေ မလိုပါ။ ကောင်းမွန်သော ဝန်ဆောင်မှုအတွက် ၁,၀၀၀–၃,၀၀၀ ကျပ် ခန့် ထပ်ပေးလေ့ ရှိပါသည်။', en: 'Not expected. For good service, 1,000–3,000 kyat is a common gesture.' } },
  { id: 'guides', title: { mm: 'လမ်းညွှန်နှင့် ယာဉ်မောင်း', en: 'Guides and drivers' }, body: { mm: 'တစ်နေကုန် လမ်းညွှန် သို့မဟုတ် ယာဉ်မောင်းအတွက် တစ်ရက် ၅,၀၀၀–၁၀,၀၀၀ ကျပ် ခန့် ထပ်ပေးလေ့ ရှိပါသည်။', en: 'A day guide or driver is commonly tipped 5,000–10,000 kyat per day.' } },
  { id: 'rate', title: { mm: 'ငွေလဲနှုန်း', en: 'Exchange rate' }, body: { mm: 'တရားဝင် ငွေလဲလှယ်သည့် နေရာနှင့် ဘဏ်များတွင် လဲလှယ်ပါ။ လမ်းပေါ် ငွေလဲသူများကို ရှောင်ပါ။', en: 'Exchange at banks and licensed counters. Avoid street money changers.' } },
];

/** Page order, and the anchor id each section renders. */
export const TOURIST_SECTION_IDS: TouristSectionId[] = ['emergency', 'sim-card', 'etiquette', 'currency'];

export function localized(value: Bilingual, language: Language): string {
  return language === 'mm' ? value.mm : value.en;
}
