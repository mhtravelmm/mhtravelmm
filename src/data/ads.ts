import type { AdCreative } from '../components/ui/AdSlot';

/**
 * Placeholder "Admin Ads" content, standing in for the real Admin Ads /
 * Google AdSense-AdMob pipeline (Section 4 of the spec) until that's
 * wired to Supabase + AdSense. Each ad banner here is a self-contained
 * inline SVG (no external image hosting needed yet) so it renders
 * immediately without extra setup.
 *
 * Priority order once the real pipeline exists: Admin Ads -> AdSense/
 * AdMob -> collapse (nothing). This mock only covers the "Admin Ads"
 * tier — collapsing behavior itself is already implemented in AdSlot.
 */
function bannerSvg(label: string, sub: string, from: string, to: string, backgroundImage?: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="220" viewBox="0 0 800 220">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
      </defs>
      ${backgroundImage ? `<image href="${backgroundImage}" width="800" height="220" preserveAspectRatio="xMidYMid slice"/><rect width="800" height="220" fill="#05070ccc"/>` : '<rect width="800" height="220" fill="url(#g)"/>'}
      <text x="40" y="110" font-family="Arial, sans-serif" font-size="34" fill="#ffffff" font-weight="600">${label}</text>
      <text x="40" y="150" font-family="Arial, sans-serif" font-size="17" fill="#f2e9dc">${sub}</text>
      <text x="40" y="196" font-family="Arial, sans-serif" font-size="12" fill="#ffffffaa">Sponsored</text>
    </svg>`.trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const AD_CREATIVES: Record<string, AdCreative> = {
  home_hero: {
    id: 'ad-hero-1',
    type: 'image',
    mediaUrl: bannerSvg('Explore Myanmar', 'Best destinations, best prices for your perfect trip.', '#c98a3e', '#7a4a1e', '/images/blog/shwedagon-evening.webp'),
    clickThroughUrl: '/travel-plans',
    advertiser: 'MH Travel',
  },
  home_after_travel_plans: {
    id: 'ad-tp-1',
    type: 'image',
    mediaUrl: bannerSvg('Sedona Hotel Yangon', 'Book direct and save — free cancellation available.', '#3e6a8a', '#1a2a3a'),
    clickThroughUrl: '/hotels',
    advertiser: 'Sedona Hotel Yangon',
  },
  home_after_hotels: {
    id: 'ad-hotels-1',
    type: 'image',
    mediaUrl: bannerSvg('Stay closer to what matters', 'Discover comfortable stays across Myanmar with MH Travel.', '#315d8f', '#17243d', '/images/blog/inle-stilt-houses.webp'),
    clickThroughUrl: '/hotels',
    advertiser: 'MH Travel Hotels',
  },
  home_after_blogs: {
    id: 'ad-blogs-1',
    type: 'image',
    mediaUrl: bannerSvg('MH Ride', 'Book a taxi or motorbike anywhere in Yangon.', '#8a4a3e', '#3a1a1a'),
    clickThroughUrl: '/rentals',
    advertiser: 'MH Ride',
  },
  home_after_reviews: {
    id: 'ad-reviews-1',
    type: 'image',
    mediaUrl: bannerSvg('Express Bus Tickets', 'Yangon to Mandalay from 15,000 MMK.', '#4a8a3e', '#1a3a1a'),
    clickThroughUrl: '/ticketing',
    advertiser: 'MH Ticketing',
  },
  home_after_partners: {
    id: 'ad-partners-1',
    type: 'image',
    mediaUrl: bannerSvg('Book Nook Yangon', 'New arrivals this week — English books & gifts.', '#6a4a8a', '#2a1a3a'),
    clickThroughUrl: '/book-shops',
    advertiser: 'Book Nook Yangon',
  },
  blog_post_top: {
    id: 'ad-blog-top-1',
    type: 'image',
    mediaUrl: bannerSvg('Plan your next Myanmar escape', 'Travel ideas, stays and local experiences from MH Travel.', '#315d8f', '#17243d', '/images/blog/bagan-sunrise.webp'),
    clickThroughUrl: '/travel-plans',
    advertiser: 'MH Travel',
  },
  blog_post_bottom: {
    id: 'ad-blog-bottom-1',
    type: 'image',
    mediaUrl: bannerSvg('Keep exploring', 'Find your next place to stay, eat and visit with MH Travel.', '#8a4a3e', '#3a1a1a', '/images/blog/shwedagon-evening.webp'),
    clickThroughUrl: '/nearby',
    advertiser: 'MH Travel Discoveries',
  },
  blog_inline: {
    id: 'ad-blog-inline-1',
    type: 'image',
    mediaUrl: bannerSvg('A better way to travel Myanmar', 'Build a plan around the places you want to see.', '#4a8a3e', '#1a3a1a'),
    clickThroughUrl: '/travel-plans',
    advertiser: 'MH Travel Plans',
  },
};

/**
 * Stand-in for a real ad-serving API call. Swap this for a Supabase
 * query (respecting the per-page ad on/off toggle) once that's built.
 */
export async function fetchMockAd(placement: string): Promise<AdCreative | null> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  return AD_CREATIVES[placement] ?? (placement.startsWith('blog_') ? AD_CREATIVES.blog_inline : null);
}
