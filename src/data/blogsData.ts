import type { CardListing } from '../types';

export type LocalizedText = { en: string; mm: string };

export type BlogBlock =
  | { type: 'paragraph'; text: LocalizedText }
  | { type: 'image'; imageUrl: string; alt: LocalizedText; caption?: LocalizedText }
  | { type: 'ad' };

export interface BlogPost extends Omit<CardListing, 'title'> {
  slug: string;
  imageUrl: string;
  location: LocalizedText;
  publishedAt: string;
  readMinutes: number;
  author: LocalizedText;
  title: LocalizedText;
  excerpt: LocalizedText;
  blocks: BlogBlock[];
  /** Internal search-engine metadata only; never display this field in the app. */
  seoTags: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-bagan-first-light',
    slug: 'bagan-first-light',
    imageUrl: '/images/blog/bagan-sunrise.webp',
    location: { en: 'Bagan', mm: 'ပုဂံ' },
    publishedAt: '2026-11-02',
    readMinutes: 6,
    rating: 4.9,
    distanceKm: 3.2,
    isFavorited: false,
    views: 2840,
    author: { en: 'MH Travel Editorial', mm: 'MH Travel အယ်ဒီတာအဖွဲ့' },
    title: {
      en: 'Bagan at first light: a slower way to meet the temples',
      mm: 'မနက်အလင်းဦးက ပုဂံ — ဘုရားများကို အေးအေးဆေးဆေး လေ့လာမယ်',
    },
    excerpt: {
      en: 'When dawn reaches the plains, Bagan asks you to slow down. Start early, leave space between stops, and let the old city reveal itself one quiet moment at a time.',
      mm: 'အရုဏ်ဦးအလင်း ပုဂံမြေပြင်ပေါ် ကျလာတဲ့အခါ အလျင်မလိုဘဲ လည်ပတ်ဖို့ ဖိတ်ခေါ်နေသလိုပါပဲ။ စောစောထွက်ပြီး နေရာတစ်ခုနဲ့တစ်ခုကြား အနားယူချိန်ထားကာ မြို့ဟောင်းရဲ့ တိတ်ဆိတ်တဲ့အလှကို ခံစားကြည့်ပါ။',
    },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: 'Before the day grows warm, the plain is soft with mist and the brick stupas catch the light one by one. The quiet is part of the experience: pause, look around, and let the scale of the landscape settle in.',
          mm: 'နေ့အပူမတက်ခင် ပုဂံမြေပြင်မှာ မြူနုနုလေးတွေ လွင့်နေပြီး အုတ်စေတီတွေက အလင်းကို တစ်ဆူပြီးတစ်ဆူ ဖမ်းယူနေကြပါတယ်။ တိတ်ဆိတ်မှုကလည်း ခရီးအတွေ့အကြုံရဲ့ အစိတ်အပိုင်းပါပဲ။ ခဏရပ်ပြီး ပတ်ဝန်းကျင်ကို ကြည့်ကာ မြေပြင်ရဲ့ ကျယ်ပြန့်မှုကို ခံစားပါ။',
        },
      },
      {
        type: 'image',
        imageUrl: '/images/blog/bagan-sunrise.webp',
        alt: {
          en: 'Hot-air balloons above the temples of Bagan at sunrise',
          mm: 'နေထွက်ချိန် ပုဂံဘုရားများအပေါ်က မိုးပျံပူဖောင်းများ',
        },
        caption: {
          en: 'A golden morning over the Bagan plain.',
          mm: 'ပုဂံမြေပြင်ပေါ်က ရွှေရောင်နံနက်ခင်း။',
        },
      },
      {
        type: 'paragraph',
        text: {
          en: 'Choose a few places you are genuinely curious about instead of trying to see everything. Dress respectfully for temple grounds, carry water, and check local guidance before entering any structure. A small pause for breakfast can become one of the day’s best memories.',
          mm: 'အရာအားလုံးကို လိုက်ကြည့်ဖို့ထက် ကိုယ်တကယ်စိတ်ဝင်စားတဲ့ နေရာအနည်းငယ်ကို ရွေးပါ။ ဘုရားပရဝုဏ်သို့ ဝင်ရာမှာ သင့်လျော်စွာ ဝတ်ဆင်ပြီး ရေယူဆောင်ပါ။ အဆောက်အအုံအတွင်း ဝင်ရောက်မီ ဒေသခံလမ်းညွှန်ချက်ကို စစ်ဆေးပါ။ မနက်စာအတွက် ခဏနားတာတောင် တစ်နေ့တာရဲ့ အမှတ်တရကောင်းတစ်ခု ဖြစ်လာနိုင်ပါတယ်။',
        },
      },
      { type: 'ad' },
      {
        type: 'paragraph',
        text: {
          en: 'The best Bagan itinerary is not the longest one. Give the light time to change, speak with local people when the moment feels right, and leave the plain with a little more calm than you arrived with.',
          mm: 'အကောင်းဆုံး ပုဂံခရီးစဉ်ဆိုတာ အရှည်ဆုံးခရီးစဉ် မဟုတ်ပါဘူး။ အလင်းရောင်ပြောင်းလဲမှုကို စောင့်ကြည့်ပါ၊ အခွင့်အရေးသင့်တဲ့အခါ ဒေသခံတွေနဲ့ စကားပြောပါ၊ ပြီးတော့ ရောက်လာစဉ်ထက် ပိုအေးချမ်းတဲ့စိတ်နဲ့ ပြန်ပါ။',
        },
      },
    ],
    seoTags: ['Bagan travel', 'Myanmar temples', 'Bagan sunrise'],
  },
  {
    id: 'blog-yangon-after-five',
    slug: 'yangon-after-five',
    imageUrl: '/images/blog/shwedagon-evening.webp',
    location: { en: 'Yangon', mm: 'ရန်ကုန်' },
    publishedAt: '2026-10-28',
    readMinutes: 5,
    rating: 4.8,
    distanceKm: 1.6,
    isFavorited: false,
    views: 1960,
    author: { en: 'MH Travel Editorial', mm: 'MH Travel အယ်ဒီတာအဖွဲ့' },
    title: {
      en: 'Yangon after five: golden light, tea and an unhurried walk',
      mm: 'ညနေငါးနာရီနောက်ပိုင်း ရန်ကုန် — ရွှေရောင်အလင်း၊ လက်ဖက်ရည်နဲ့ အေးအေးလူလူ လမ်းလျှောက်ခြင်း',
    },
    excerpt: {
      en: 'Let the evening lead. Watch the pagoda glow as the city cools, then take a gentle walk and find a table for tea.',
      mm: 'ညနေခင်းကို ကိုယ့်ကို ဦးဆောင်ခွင့်ပေးလိုက်ပါ။ မြို့အပူကျလာချိန်မှာ စေတီတော်ရဲ့ ရွှေရောင်တောက်ပမှုကို ကြည့်ပြီး လမ်းလျှောက်ကာ လက်ဖက်ရည်တစ်ခွက် သောက်ဖို့ နေရာရှာပါ။',
    },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: 'Yangon changes pace near sunset. The day’s heat softens, street stalls begin to glow, and the Shwedagon rises above the rooftops like a quiet compass. Pick one neighbourhood rather than crossing the whole city, and keep your evening open.',
          mm: 'နေဝင်ချိန်နီးလာတာနဲ့ ရန်ကုန်ရဲ့ အရှိန်က ပြောင်းလဲလာပါတယ်။ နေ့ခင်းအပူ လျော့ကျလာပြီး လမ်းဘေးဆိုင်လေးတွေ မီးလင်းလာကာ ရွှေတိဂုံစေတီတော်က ခေါင်မိုးတွေကြားမှာ တိတ်ဆိတ်တဲ့ လမ်းညွှန်တစ်ခုလို ပေါ်လာပါတယ်။ မြို့တစ်မြို့လုံး ဖြတ်သန်းမယ့်အစား ရပ်ကွက်တစ်ခုကို ရွေးပြီး ညနေခင်းကို လွတ်လွတ်လပ်လပ်ထားပါ။',
        },
      },
      {
        type: 'image',
        imageUrl: '/images/blog/shwedagon-evening.webp',
        alt: {
          en: 'The golden Shwedagon Pagoda at sunset in Yangon',
          mm: 'ရန်ကုန် နေဝင်ချိန်တွင် ရွှေရောင်တောက်ပနေသော ရွှေတိဂုံစေတီတော်',
        },
        caption: {
          en: 'The city’s evening light gathers around Shwedagon.',
          mm: 'ရွှေတိဂုံတစ်ဝိုက်မှာ မြို့ရဲ့ ညနေအလင်းရောင် စုဝေးနေသည်။',
        },
      },
      {
        type: 'paragraph',
        text: {
          en: 'Bring a light layer for the walk and check the pagoda’s current visitor guidance before you go. Afterwards, settle into a tea shop, order something simple, and give yourself time to notice the small rhythms of the city.',
          mm: 'လမ်းလျှောက်ဖို့ အပေါ်ထပ်အင်္ကျီပါးပါးတစ်ထည် ယူသွားပြီး မသွားမီ စေတီတော်ရဲ့ လက်ရှိလာရောက်လည်ပတ်သူဆိုင်ရာ လမ်းညွှန်ချက်ကို စစ်ဆေးပါ။ ပြီးရင် လက်ဖက်ရည်ဆိုင်တစ်ဆိုင်မှာ ထိုင်ကာ ရိုးရိုးရှင်းရှင်းတစ်ခုခု မှာပြီး မြို့ရဲ့ နေ့စဉ်လှုပ်ရှားမှုအသေးအမွှားတွေကို အချိန်ပေးကြည့်ပါ။',
        },
      },
    ],
    seoTags: ['Yangon evening', 'Shwedagon Pagoda', 'Yangon walk'],
  },
  {
    id: 'blog-inle-slow-water',
    slug: 'inle-slow-water',
    imageUrl: '/images/blog/inle-stilt-houses.webp',
    location: { en: 'Inle Lake', mm: 'အင်းလေးကန်' },
    publishedAt: '2026-10-22',
    readMinutes: 7,
    rating: 4.9,
    distanceKm: 6.4,
    isFavorited: false,
    views: 1740,
    author: { en: 'MH Travel Editorial', mm: 'MH Travel အယ်ဒီတာအဖွဲ့' },
    title: {
      en: 'Inle Lake by boat: make room for the quiet moments',
      mm: 'လှေနဲ့ အင်းလေးကန် — တိတ်ဆိတ်တဲ့အချိန်လေးတွေကို နေရာပေးပါ',
    },
    excerpt: {
      en: 'A morning on the water is more than a route between villages. Keep your camera ready, your voice low, and your schedule flexible.',
      mm: 'ရေပေါ်က မနက်ခင်းဆိုတာ ရွာတစ်ရွာနဲ့တစ်ရွာကြား သွားလာရုံတင် မဟုတ်ပါဘူး။ ကင်မရာအသင့်ပြင်ထားပြီး အသံကို တိုးကာ အချိန်ဇယားကို လိုက်လျောညီထွေထားပါ။',
    },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: 'The first stretch across Inle Lake can feel almost still. Wooden homes stand above the water, gardens float beside narrow channels, and the hills hold the far edge of the view. Ask your boat operator what the day’s route includes before setting out.',
          mm: 'အင်းလေးကန်ကို စတင်ဖြတ်သန်းတဲ့အချိန်မှာ ရေပြင်ဟာ ငြိမ်သက်လွန်းတယ်လို့ ခံစားရနိုင်ပါတယ်။ သစ်သားအိမ်တွေက ရေပေါ်မှာ တည်ရှိပြီး ရေပေါ်ဥယျာဉ်တွေက လမ်းကြောင်းကျဉ်းလေးတွေနားမှာ ရှိနေကာ တောင်တန်းတွေက မြင်ကွင်းရဲ့ အဝေးဆုံးအနားကို ပုံဖော်ပေးပါတယ်။ မထွက်ခွာမီ ဒီနေ့သွားမယ့် လမ်းကြောင်းကို လှေမောင်းသူနဲ့ မေးမြန်းထားပါ။',
        },
      },
      {
        type: 'image',
        imageUrl: '/images/blog/inle-stilt-houses.webp',
        alt: {
          en: 'Traditional wooden houses standing above the water at Inle Lake',
          mm: 'အင်းလေးကန် ရေပေါ်တွင် တိုင်ထိုးတည်ဆောက်ထားသော သစ်သားအိမ်များ',
        },
        caption: {
          en: 'Everyday life follows the water’s gentle pace.',
          mm: 'နေ့စဉ်ဘဝက ရေရဲ့ ညင်သာတဲ့ အရှိန်နဲ့ လိုက်ပါနေသည်။',
        },
      },
      {
        type: 'paragraph',
        text: {
          en: 'Keep a warm layer close, especially early in the day, and protect your camera from spray. When visiting a workshop or village, ask before photographing people and follow local requests. A quieter pace makes it easier to notice how much of life here is shaped by the lake.',
          mm: 'အထူးသဖြင့် မနက်စောစောမှာ အနွေးထည်တစ်ထည် အနီးမှာထားပြီး ကင်မရာကို ရေစင်ခြင်းကနေ ကာကွယ်ပါ။ အလုပ်ရုံ ဒါမှမဟုတ် ရွာကို သွားလည်တဲ့အခါ လူတွေကို ဓာတ်ပုံမရိုက်မီ ခွင့်တောင်းကာ ဒေသခံတို့ရဲ့ တောင်းဆိုချက်ကို လိုက်နာပါ။ အရှိန်လျှော့လိုက်ရင် ဒီနေရာက ဘဝအများစုကို ကန်ရေက ဘယ်လောက်ပုံဖော်ပေးနေတယ်ဆိုတာ ပိုသတိထားမိလာပါတယ်။',
        },
      },
      { type: 'ad' },
    ],
    seoTags: ['Inle Lake travel', 'Myanmar lake villages', 'Inle boat trip'],
  },
  {
    id: 'blog-ubein-evening',
    slug: 'ubein-evening',
    imageUrl: '/images/blog/ubein-evening.webp',
    location: { en: 'Amarapura', mm: 'အမရပူရ' },
    publishedAt: '2026-10-15',
    readMinutes: 5,
    rating: 4.7,
    distanceKm: 8.1,
    isFavorited: false,
    views: 1320,
    author: { en: 'MH Travel Editorial', mm: 'MH Travel အယ်ဒီတာအဖွဲ့' },
    title: {
      en: 'U Bein Bridge at sunset: take the long way across',
      mm: 'နေဝင်ချိန်က ဦးပိန်တံတား — တံတားကို ဖြည်းဖြည်းလျှောက်ဖြတ်ပါ',
    },
    excerpt: {
      en: 'The teak bridge is best experienced without rushing. Arrive with time to spare, walk a little, and watch the light settle over the water.',
      mm: 'ကျွန်းသားတံတားကို အလျင်မလိုဘဲ ခံစားကြည့်တာ အကောင်းဆုံးပါ။ အချိန်စောစောရောက်အောင်လာပြီး ခဏလမ်းလျှောက်ကာ ရေပေါ်က အလင်းရောင် ပြောင်းလဲသွားတာကို ကြည့်ပါ။',
    },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: 'U Bein Bridge draws people toward the lake as the day cools. Instead of finding one perfect viewpoint, walk a section of the teak walkway and notice how the reflections, silhouettes, and voices change as the sun drops.',
          mm: 'နေ့အပူလျော့ကျလာတဲ့အခါ ဦးပိန်တံတားက လူတွေကို ကန်ဘက်ဆီ ဆွဲဆောင်ပါတယ်။ ပြီးပြည့်စုံတဲ့ ဓာတ်ပုံရိုက်ကွက်တစ်ခုကို ရှာနေမယ့်အစား ကျွန်းသားလမ်းကြောင်းတစ်ပိုင်းကို လျှောက်ကြည့်ပြီး နေဝင်လာတာနဲ့ ရောင်ပြန်တွေ၊ ပုံရိပ်တွေ၊ အသံတွေ ပြောင်းလဲပုံကို သတိထားကြည့်ပါ။',
        },
      },
      {
        type: 'image',
        imageUrl: '/images/blog/ubein-evening.webp',
        alt: {
          en: 'People crossing U Bein Bridge as the sun sets over the water',
          mm: 'ရေပြင်ပေါ် နေဝင်ချိန်တွင် ဦးပိန်တံတားကို ဖြတ်လျှောက်နေသူများ',
        },
        caption: {
          en: 'Evening light turns the bridge into a line of silhouettes.',
          mm: 'ညနေအလင်းရောင်ကြောင့် တံတားပေါ်က လူပုံရိပ်တွေ တန်းစီပေါ်လာသည်။',
        },
      },
      {
        type: 'paragraph',
        text: {
          en: 'Be mindful of residents and other visitors on the walkway, and ask before taking close portraits. Leave enough time to return before it gets dark, then pause for a drink nearby and let the last colour fade from the sky.',
          mm: 'တံတားပေါ်က ဒေသခံတွေနဲ့ အခြားလည်ပတ်သူတွေကို ဂရုစိုက်ပါ။ အနီးကပ်ပုံတူရိုက်မယ်ဆိုရင် ခွင့်တောင်းပါ။ မမှောင်ခင် ပြန်လာနိုင်ဖို့ အချိန်လုံလုံလောက်လောက်ထားပြီး အနီးအနားမှာ သောက်စရာတစ်ခုခုသောက်ရင်း ကောင်းကင်ပေါ်က နောက်ဆုံးအရောင်လေး ပျောက်ကွယ်သွားတာကို ကြည့်ပါ။',
        },
      },
    ],
    seoTags: ['U Bein Bridge', 'Amarapura travel', 'Mandalay sunset'],
  },
];
