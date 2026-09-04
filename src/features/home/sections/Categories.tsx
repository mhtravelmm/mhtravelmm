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

export function Categories() {
  const { t } = useLanguage();

  return (
    <section className="mb-5">
      <SectionHeader title={t('section_categories')} viewAllHref="/categories" />
      <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => {
          const Icon = ICONS[cat.icon] ?? MapPin;
          const labelKey = CATEGORY_LABEL_KEYS[cat.key];
          return (
            <Link
              key={cat.key}
              to={`/${cat.key}`}
              className="flex shrink-0 flex-col items-center gap-1 basis-[64px]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blueDark/20">
                <Icon size={16} className="text-brand-blue" />
              </div>
              <span className="whitespace-nowrap text-center text-[8px] text-text-muted">
                {labelKey ? t(labelKey) : cat.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
