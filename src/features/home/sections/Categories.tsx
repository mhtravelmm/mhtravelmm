import {
  Book,
  Building,
  Ticket,
  Car,
  UtensilsCrossed,
  Landmark,
  User,
  Banknote,
  Siren,
  Smartphone,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CATEGORIES } from '../../../data/homeData';
import { SectionHeader } from './SectionHeader';
import { useLanguage, type TranslationKey } from '../../../lib/i18n';

const ICONS: Record<string, LucideIcon> = {
  Book,
  Building,
  Ticket,
  Car,
  UtensilsCrossed,
  Landmark,
  User,
  Banknote,
  FirstAid: Siren,
  SimCard: Smartphone,
  MapPin,
};

// Maps each category's data key to its translation key (see lib/i18n.tsx)
const CATEGORY_LABEL_KEYS: Record<string, TranslationKey> = {
  book_shop: 'cat_book_shop',
  hotels: 'cat_hotels',
  ticketing: 'cat_ticketing',
  rentals: 'cat_rentals',
  restaurants: 'cat_restaurants',
  attractions: 'cat_attractions',
  guides: 'cat_guides',
  exchange: 'cat_exchange',
  emergency: 'cat_emergency',
  sim_card: 'cat_sim_card',
  nearby: 'cat_nearby',
};

function CategoryItem({
  cat,
  t,
  ariaHidden,
}: {
  cat: (typeof CATEGORIES)[number];
  t: (key: TranslationKey) => string;
  ariaHidden?: boolean;
}) {
  const Icon = ICONS[cat.icon] ?? MapPin;
  const labelKey = CATEGORY_LABEL_KEYS[cat.key];
  return (
    <Link
      to={`/${cat.key}`}
      aria-hidden={ariaHidden}
      tabIndex={ariaHidden ? -1 : undefined}
      className="flex shrink-0 basis-[64px] flex-col items-center gap-1"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blueDark/20">
        <Icon size={16} className="text-brand-blue" />
      </div>
      <span className="whitespace-nowrap text-center text-[8px] text-text-muted">
        {labelKey ? t(labelKey) : cat.label}
      </span>
    </Link>
  );
}

/**
 * Categories scroll themselves continuously (marquee), looping back to the
 * start seamlessly — not a manual drag/swipe strip. This is done by
 * rendering the list twice back-to-back inside a track that animates by
 * exactly -50% of its own width, so the moment the first copy has fully
 * passed, the second (identical) copy is in exactly the same position —
 * no visible jump/reset.
 */
export function Categories() {
  const { t } = useLanguage();

  return (
    <section className="mb-5">
      <SectionHeader title={t('section_categories')} viewAllHref="/categories" />
      <div className="overflow-hidden">
        <div className="animate-marquee flex w-max gap-4">
          {CATEGORIES.map((cat) => (
            <CategoryItem key={`a-${cat.key}`} cat={cat} t={t} />
          ))}
          {CATEGORIES.map((cat) => (
            <CategoryItem key={`b-${cat.key}`} cat={cat} t={t} ariaHidden />
          ))}
        </div>
      </div>
    </section>
  );
}
