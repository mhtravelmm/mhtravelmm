import { Trophy, Medal, Award, BadgeCheck, type LucideIcon } from 'lucide-react';
import { AWARDS } from '../../../data/homeData';
import { SectionHeader } from './SectionHeader';

const ICONS: Record<string, LucideIcon> = { Trophy, Medal, Award, BadgeCheck };

export function Awards() {
  return (
    <section className="mb-5">
      <SectionHeader title="Awards" viewAllHref="/awards" />
      <div className="grid grid-cols-4 gap-2">
        {AWARDS.map((a) => {
          const Icon = ICONS[a.icon] ?? Trophy;
          return (
            <div key={a.id} className="rounded-card bg-bg-card p-2.5 text-center">
              <Icon size={20} className="mx-auto text-status-warning" />
              <p className="mt-1 text-[9px] text-text-muted">{a.year}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
