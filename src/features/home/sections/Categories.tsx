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

export function Categories() {
  return (
    <section className="mb-5">
      <SectionHeader title="Categories" viewAllHref="/categories" />
      <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-8 md:grid-cols-11">
        {CATEGORIES.map((cat) => {
          const Icon = ICONS[cat.icon] ?? MapPin;
          return (
            <Link key={cat.key} to={`/${cat.key}`} className="flex flex-col items-center gap-1">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-blueDark/20">
                <Icon size={16} className="text-brand-blue" />
              </div>
              <span className="text-center text-[8px] text-text-muted">{cat.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
