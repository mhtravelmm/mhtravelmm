export interface NotificationItem {
  id: string;
  title: string;
  thumbnailFrom: string;
  thumbnailTo: string;
  timeAgo: string;
  isRead: boolean;
  href: string;
}

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'New blog post: 10 Hidden Gems Every Traveler Should See in Bagan',
    thumbnailFrom: '#8a6a3e',
    thumbnailTo: '#2a1c0f',
    timeAgo: '2 hours ago',
    isRead: false,
    href: '/blogs/bl1',
  },
  {
    id: 'n2',
    title: 'Sedona Hotel Yangon added new rooms and updated their photos',
    thumbnailFrom: '#3e6a8a',
    thumbnailTo: '#1a2a3a',
    timeAgo: '5 hours ago',
    isRead: false,
    href: '/hotels/tp1',
  },
  {
    id: 'n3',
    title: 'New travel guide: Yangon in 5 places',
    thumbnailFrom: '#4a8a3e',
    thumbnailTo: '#1a3a1a',
    timeAgo: '1 day ago',
    isRead: true,
    href: '/travel-guide/tg1',
  },
  {
    id: 'n4',
    title: 'Your booking at The Rangoon House was confirmed',
    thumbnailFrom: '#8a4a3e',
    thumbnailTo: '#3a1a1a',
    timeAgo: '2 days ago',
    isRead: true,
    href: '/account',
  },
];
