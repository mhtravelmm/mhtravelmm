import type { BlogPost } from './blogsData';

export const ADDITIONAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-myanmar-table',
    slug: 'myanmar-table',
    category: 'food',
    favoriteCount: 621,
    imageUrl: '/images/blog/myanmar-food.webp',
    location: { en: 'Yangon', mm: 'ရန်ကုန်' },
    publishedAt: '2026-11-05',
    readMinutes: 4,
    rating: 4.8,
    distanceKm: 2.7,
    isFavorited: false,
    views: 9700,
    author: { en: 'MH Travel Editorial', mm: 'MH Travel အယ်ဒီတာအဖွဲ့' },
    title: {
      en: 'Must-try Myanmar foods: a local table to start with',
      mm: 'မြည်းစမ်းကြည့်သင့်တဲ့ မြန်မာအစားအစာများ — ဒေသခံစားပွဲတစ်ခုက စတင်ပါ',
    },
    excerpt: {
      en: 'Start with a bowl of mohinga, add tea-leaf salad to share, and let the small tea shops introduce you to the flavours locals love.',
      mm: 'မုန့်ဟင်းခါးတစ်ပွဲနဲ့ စပြီး မျှဝေစားဖို့ လက်ဖက်သုပ်ထည့်ပါ။ ဒေသခံတွေကြိုက်တဲ့ အရသာတွေကို လက်ဖက်ရည်ဆိုင်လေးတွေကတစ်ဆင့် ရှာဖွေလိုက်ပါ။',
    },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: 'A welcoming way into Myanmar food is a neighbourhood tea shop in the morning. Mohinga is a comforting bowl of rice noodles in fragrant fish broth, often served with fresh herbs and crunchy fritters. Ask what is freshly prepared and choose a portion that suits your appetite.',
          mm: 'မြန်မာအစားအစာကို စတင်မြည်းစမ်းဖို့ မနက်ခင်း ရပ်ကွက်လက်ဖက်ရည်ဆိုင်လေးတစ်ဆိုင်က ကောင်းမွန်တဲ့နေရာပါ။ မုန့်ဟင်းခါးမှာ မွှေးပျံ့တဲ့ ငါးဟင်းရည်ထဲက ဆန်ခေါက်ဆွဲ၊ ဟင်းရွက်လတ်လတ်ဆတ်ဆတ်နဲ့ အကြော်တို့ ပါတတ်ပါတယ်။ လတ်လတ်ဆတ်ဆတ် ပြင်ဆင်ထားတာကို မေးပြီး ကိုယ်စားနိုင်မယ့် ပမာဏကို ရွေးပါ။',
        },
      },
      {
        type: 'image',
        imageUrl: '/images/blog/myanmar-food.webp',
        alt: {
          en: 'A bowl of mohinga and tea-leaf salad on a Yangon tea-shop table',
          mm: 'ရန်ကုန်လက်ဖက်ရည်ဆိုင် စားပွဲပေါ်က မုန့်ဟင်းခါးနဲ့ လက်ဖက်သုပ်',
        },
        caption: {
          en: 'A simple tea-shop table can be a delicious introduction to local flavours.',
          mm: 'လက်ဖက်ရည်ဆိုင်လေးတစ်ဆိုင်ရဲ့ ရိုးရှင်းတဲ့စားပွဲက ဒေသခံအရသာတွေကို စတင်သိကျွမ်းစေပါတယ်။',
        },
      },
      {
        type: 'paragraph',
        text: {
          en: 'For a second dish, try lahpet thoke, the tangy tea-leaf salad often shared around the table. Menus and ingredients vary from place to place, so ask staff about the dish and any ingredients you need to avoid. A relaxed meal is as much about the conversation as the food.',
          mm: 'နောက်ထပ်တစ်မျိုးအနေနဲ့ စားပွဲဝိုင်းမှာ မျှဝေလေ့ရှိတဲ့ အရသာချဉ်ချဉ် လက်ဖက်သုပ်ကို မြည်းကြည့်ပါ။ ဆိုင်အလိုက် မီနူးနဲ့ ပါဝင်ပစ္စည်းတွေ ကွဲပြားနိုင်တာကြောင့် ကိုယ်မစားသင့်တဲ့အရာရှိရင် ဝန်ထမ်းကို မေးမြန်းပါ။ အေးအေးဆေးဆေး စားသောက်ခြင်းဆိုတာ အစားအစာအပြင် စကားဝိုင်းကိုပါ ခံစားခြင်းပါ။',
        },
      },
    ],
    seoTags: ['Myanmar food', 'Mohinga', 'Yangon tea shops'],
  },
  {
    id: 'blog-slow-travel-wellness',
    slug: 'slow-travel-wellness',
    category: 'health',
    favoriteCount: 595,
    imageUrl: '/images/blog/myanmar-wellness.webp',
    location: { en: 'Inle Lake', mm: 'အင်းလေးကန်' },
    publishedAt: '2026-10-14',
    readMinutes: 5,
    rating: 4.8,
    distanceKm: 4.1,
    isFavorited: false,
    views: 8900,
    author: { en: 'MH Travel Editorial', mm: 'MH Travel အယ်ဒီတာအဖွဲ့' },
    title: {
      en: 'A slower day in Myanmar: small rituals for restful travel',
      mm: 'မြန်မာနိုင်ငံမှာ အရှိန်လျှော့ပြီး ခရီးသွားမယ် — အနားယူစေမယ့် အလေ့အထလေးများ',
    },
    excerpt: {
      en: 'Leave a little room between plans. A quiet breakfast, a gentle walk and an early night can make a journey feel more restorative.',
      mm: 'အစီအစဉ်တွေကြား အချိန်နည်းနည်းချန်ထားပါ။ အေးဆေးတဲ့ မနက်စာ၊ ဖြည်းဖြည်းလမ်းလျှောက်ခြင်းနဲ့ စောစောအနားယူခြင်းက ခရီးစဉ်ကို ပိုပြီး အားပြန်ဖြစ်စေပါတယ်။',
    },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: 'Travel does not need to be a checklist. Choose one or two things that matter to you, leave space for a long meal or a quiet view, and take breaks when you need them. A flexible day often feels richer than one filled from morning to night.',
          mm: 'ခရီးသွားခြင်းဆိုတာ လုပ်စရာစာရင်းတစ်ခု ဖြစ်စရာမလိုပါဘူး။ ကိုယ်စိတ်ဝင်စားတဲ့အရာ တစ်ခု၊ နှစ်ခုကို ရွေးပြီး အေးအေးဆေးဆေး စားသောက်ဖို့ ဒါမှမဟုတ် မြင်ကွင်းတစ်ခုကို ကြည့်ဖို့ အချိန်ချန်ထားပါ။ လိုအပ်တဲ့အခါ အနားယူပါ။ လိုက်လျောညီထွေရှိတဲ့ တစ်နေ့တာက မနက်ကနေညအထိ ပြည့်ကျပ်နေတဲ့နေ့ထက် ပိုပြီး အမှတ်တရဖြစ်နိုင်ပါတယ်။',
        },
      },
      {
        type: 'image',
        imageUrl: '/images/blog/myanmar-wellness.webp',
        alt: {
          en: 'A traveler enjoying a quiet moment beside a Myanmar lake at sunrise',
          mm: 'နေထွက်ချိန် မြန်မာနိုင်ငံကန်တစ်ခုဘေးမှာ အေးချမ်းစွာ အနားယူနေသော ခရီးသွားတစ်ဦး',
        },
        caption: {
          en: 'A calm pause by the water can become part of the journey.',
          mm: 'ရေကမ်းနားက အေးချမ်းတဲ့ ခဏတာလေးကလည်း ခရီးစဉ်ရဲ့ အစိတ်အပိုင်းတစ်ခု ဖြစ်လာနိုင်ပါတယ်။',
        },
      },
      {
        type: 'paragraph',
        text: {
          en: 'Keep water nearby, protect yourself from the sun, and make room for enough sleep. If you already have health needs, carry the supplies and information you normally rely on and consult a qualified professional when needed. Your own comfortable pace is the right pace.',
          mm: 'ရေကို အနီးမှာထားပါ၊ နေရောင်ခြည်ကနေ ကိုယ့်ကိုယ်ကို ကာကွယ်ပြီး လုံလောက်စွာ အိပ်စက်ဖို့ အချိန်ပေးပါ။ ကျန်းမာရေးဆိုင်ရာ လိုအပ်ချက်ရှိပြီးသားဆိုရင် ပုံမှန်အသုံးပြုတဲ့ ပစ္စည်းနဲ့ အချက်အလက်တွေကို ယူဆောင်ကာ လိုအပ်တဲ့အခါ အရည်အချင်းပြည့်မီတဲ့ ကျန်းမာရေးပညာရှင်နဲ့ တိုင်ပင်ပါ။ ကိုယ်သက်သောင့်သက်သာရှိတဲ့ အရှိန်က ကိုယ့်အတွက် မှန်ကန်တဲ့အရှိန်ပါပဲ။',
        },
      },
    ],
    seoTags: ['slow travel Myanmar', 'travel wellbeing', 'Inle Lake rest'],
  },
  {
    id: 'blog-myanmar-travel-safety',
    slug: 'myanmar-travel-safety',
    category: 'safety',
    favoriteCount: 498,
    imageUrl: '/images/blog/myanmar-travel-safety.webp',
    location: { en: 'Myanmar', mm: 'မြန်မာနိုင်ငံ' },
    publishedAt: '2026-10-01',
    readMinutes: 5,
    rating: 4.7,
    distanceKm: 5.2,
    isFavorited: false,
    views: 7500,
    author: { en: 'MH Travel Editorial', mm: 'MH Travel အယ်ဒီတာအဖွဲ့' },
    title: {
      en: 'Travel safety tips for Myanmar: prepare, pause, and ask',
      mm: 'မြန်မာနိုင်ငံ ခရီးသွားလုံခြုံရေး — ကြိုတင်ပြင်ဆင်၊ ခဏရပ်ပြီး မေးမြန်းပါ',
    },
    excerpt: {
      en: 'A few thoughtful habits make planning easier: check current local guidance, keep essentials close, and ask before you go off route.',
      mm: 'သေချာတဲ့အလေ့အထလေးတွေက ခရီးစဉ်ပြင်ဆင်မှုကို ပိုလွယ်ကူစေပါတယ် — ဒေသဆိုင်ရာ လမ်းညွှန်ချက်တွေကို စစ်ဆေးပါ၊ လိုအပ်တဲ့ပစ္စည်းတွေကို အနီးမှာထားပြီး လမ်းကြောင်းပြောင်းမသွားမီ မေးမြန်းပါ။',
    },
    blocks: [
      {
        type: 'paragraph',
        text: {
          en: 'Before you travel, review current official travel guidance and confirm transport, opening times, and local arrangements with a trusted source. Share your rough itinerary with someone you trust, keep a charged phone and useful contact details nearby, and store important documents securely.',
          mm: 'ခရီးမသွားမီ လက်ရှိ တရားဝင်ခရီးသွားလမ်းညွှန်ချက်များကို ဖတ်ရှုပြီး ယုံကြည်စိတ်ချရတဲ့ ရင်းမြစ်တစ်ခုထံမှ သွားလာရေး၊ ဖွင့်ချိန်နဲ့ ဒေသဆိုင်ရာအစီအစဉ်တွေကို အတည်ပြုပါ။ ကိုယ့်ခရီးစဉ်အကြမ်းဖျဉ်းကို ယုံကြည်ရသူတစ်ဦးထံ မျှဝေထားပါ၊ ဖုန်းအားပြည့်အောင်ထားပြီး အသုံးဝင်တဲ့ ဆက်သွယ်ရန်အချက်အလက်တွေကို အနီးမှာထားပါ။ အရေးကြီးစာရွက်စာတမ်းတွေကို လုံခြုံစွာ သိမ်းဆည်းပါ။',
        },
      },
      {
        type: 'image',
        imageUrl: '/images/blog/myanmar-travel-safety.webp',
        alt: {
          en: 'A daypack, sun hat and water bottle beside a lake in Myanmar',
          mm: 'မြန်မာနိုင်ငံကန်တစ်ခုဘေးတွင် ခရီးသွားအိတ်၊ နေကာဦးထုပ်နှင့် ရေဘူး',
        },
        caption: {
          en: 'Keep the essentials you need for the day easy to reach.',
          mm: 'တစ်နေ့တာအတွက် လိုအပ်မယ့်ပစ္စည်းတွေကို အလွယ်တကူယူနိုင်တဲ့နေရာမှာ ထားပါ။',
        },
      },
      {
        type: 'paragraph',
        text: {
          en: 'On the road, use transport and accommodation that you have checked in advance, stay hydrated, and protect yourself from heat and rain. Ask before photographing people or entering private spaces. If plans change, pause and check with a trusted local contact rather than rushing into an unfamiliar route.',
          mm: 'လမ်းခရီးမှာ ကြိုတင်စစ်ဆေးထားတဲ့ သွားလာရေးနဲ့ တည်းခိုစရာတွေကို အသုံးပြုပါ၊ ရေဓာတ်ပြည့်ဝအောင်နေပြီး အပူနဲ့ မိုးကနေ ကာကွယ်ပါ။ လူတွေကို ဓာတ်ပုံရိုက်မယ် ဒါမှမဟုတ် ကိုယ်ပိုင်နေရာတွေထဲ ဝင်မယ်ဆိုရင် အရင်ခွင့်တောင်းပါ။ အစီအစဉ်ပြောင်းလဲသွားရင် အလျင်မလိုဘဲ ခဏရပ်ပြီး ယုံကြည်ရတဲ့ ဒေသခံအဆက်အသွယ်နဲ့ စစ်ဆေးပါ။',
        },
      },
    ],
    seoTags: ['Myanmar travel safety', 'travel planning', 'Myanmar visitor tips'],
  },
];
