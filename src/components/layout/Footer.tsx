import { Instagram, Facebook, Youtube, Linkedin } from 'lucide-react';

const MYANMAR_PAYMENT = ['KBZPay', 'AYA Pay', 'CB Pay', 'OK$', 'UAB Pay', 'MPU', 'mytelpay'];
const INTL_PAYMENT = ['Visa', 'Mastercard', 'JCB', 'UnionPay', 'Amex', 'Discover', 'Apple Pay'];

const FOOTER_COLUMNS = [
  {
    heading: 'Legal',
    links: [
      'Privacy policy',
      'Terms of use',
      'Terms and conditions',
      'DMCA policy',
      'Disclaimer',
      'Cookie policy',
      'Sitemap',
    ],
  },
  {
    heading: 'Help and support',
    links: ['FAQ', 'Contact form', 'Feedback', 'Report content', 'Support'],
  },
  {
    heading: 'Navigate',
    links: ['Cities', 'Nearby', 'Rentals', 'Ticketing', 'Travel plans', 'Travel guide'],
  },
  {
    heading: 'Content',
    links: ['info@mhtravelmm.com', 'Facebook page', 'Telegram', 'Viber', '+95 9 400 686 925'],
  },
];

/**
 * `variant="full"` is only used on the Home Page. Every inner page
 * (City, Nearby, Hotel/Restaurant/Shop detail, Blog, etc.) uses
 * `variant="minimal"` — copyright line only. This mirrors the
 * approved mockups.
 */
export function Footer({ variant = 'minimal' }: { variant?: 'full' | 'minimal' }) {
  if (variant === 'minimal') {
    return (
      <footer className="mt-4 border-t border-border pt-2.5 text-center">
        <p className="text-[9px] text-text-faint">© 2026 MH Travel. All rights reserved.</p>
      </footer>
    );
  }

  return (
    <footer className="mt-4 border-t border-border pt-3.5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="col-span-2 md:col-span-1">
          <p className="mb-1.5 text-xs text-brand-blue">MH Travel</p>
          <p className="mb-2 text-[9px] text-text-faint">
            Your trusted companion to explore the beauty of Myanmar. Available 24/7.
          </p>
          <div className="flex gap-1.5 text-text-muted">
            <Instagram size={12} />
            <Facebook size={12} />
            <Youtube size={12} />
            <Linkedin size={12} />
          </div>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div key={col.heading}>
            <p className="mb-1.5 text-[11px] text-brand-blue">{col.heading}</p>
            {col.links.map((link) => (
              <p key={link} className="mb-0.5 text-[9px] text-text-faint">
                {link}
              </p>
            ))}
          </div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2.5 border-t border-border pt-3 md:grid-cols-3">
        <div>
          <p className="mb-1.5 text-[10px] text-brand-blue">Myanmar payment</p>
          <div className="flex flex-wrap gap-1">
            {MYANMAR_PAYMENT.map((p) => (
              <span key={p} className="rounded bg-bg-card px-1.5 py-0.5 text-[8px] text-text-muted">
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="text-center">
          <p className="mb-1.5 text-[10px] text-brand-blue">Download our app</p>
          <div className="flex justify-center gap-1.5">
            <span className="rounded bg-bg-card px-2 py-1 text-[8px] text-text-secondary">App store</span>
            <span className="rounded bg-bg-card px-2 py-1 text-[8px] text-text-secondary">Google play</span>
          </div>
        </div>
        <div className="text-right">
          <p className="mb-1.5 text-[10px] text-brand-blue">International payment</p>
          <div className="flex flex-wrap justify-end gap-1">
            {INTL_PAYMENT.map((p) => (
              <span key={p} className="rounded bg-bg-card px-1.5 py-0.5 text-[8px] text-text-muted">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-3.5 border-t border-border pt-2.5 text-center text-[9px] text-text-faint">
        © 2026 MH Travel. All rights reserved.
      </p>
    </footer>
  );
}
