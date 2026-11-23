import type { LocalizedTextLike } from '../lib/translationCache';

export interface NotificationItem {
  id: string;
  /** Plan §16B.4: the reader's language, else the one it was written in. */
  title: LocalizedTextLike;
  thumbnailFrom: string;
  thumbnailTo: string;
  /** When it happened, so the page groups by day and labels the age. */
  createdAt: string;
  isRead: boolean;
  href: string;
}

/** Dated from load time, so the seeded inbox reads as a live feed. */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: {
      mm: 'ဘလော့ဂ် အသစ် — ပုဂံမှာ ခရီးသွားတိုင်း မလွတ်သင့်တဲ့ လျှို့ဝှက်နေရာ ၁၀ ခု',
      en: 'New blog post: 10 Hidden Gems Every Traveler Should See in Bagan',
    },
    thumbnailFrom: '#8a6a3e',
    thumbnailTo: '#2a1c0f',
    createdAt: hoursAgo(2),
    isRead: false,
    href: '/blogs/bl1',
  },
  {
    id: 'n2',
    title: {
      mm: 'Sedona Hotel Yangon တွင် အခန်းအသစ်များ ထပ်တိုးပြီး ဓာတ်ပုံများ အသစ်လဲပြီး',
      en: 'Sedona Hotel Yangon added new rooms and updated their photos',
    },
    thumbnailFrom: '#3e6a8a',
    thumbnailTo: '#1a2a3a',
    createdAt: hoursAgo(5),
    isRead: false,
    href: '/hotels/tp1',
  },
  {
    id: 'n3',
    title: {
      mm: 'လမ်းညွှန် အသစ် — ရန်ကုန်ကို နေရာ ၅ ခုနဲ့ သိမယ်',
      en: 'New travel guide: Yangon in 5 places',
    },
    thumbnailFrom: '#4a8a3e',
    thumbnailTo: '#1a3a1a',
    createdAt: hoursAgo(26),
    isRead: true,
    href: '/travel-guide/tg1',
  },
  {
    id: 'n4',
    title: {
      mm: 'The Rangoon House တွင် သင့်ဘွတ်ကင်ကို အတည်ပြုပြီးပါပြီ',
      en: 'Your booking at The Rangoon House was confirmed',
    },
    thumbnailFrom: '#8a4a3e',
    thumbnailTo: '#3a1a1a',
    createdAt: hoursAgo(50),
    isRead: true,
    href: '/account',
  },
];
