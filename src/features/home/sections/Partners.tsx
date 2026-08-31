import { PARTNERS } from '../../../data/homeData';
import { SectionHeader } from './SectionHeader';

export function Partners() {
  return (
    <section className="mb-5">
      <SectionHeader title="Partners" viewAllHref="/partners" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PARTNERS.map((p) => (
          <div key={p} className="flex h-8 items-center justify-center rounded-full bg-bg-card">
            <span className="text-[9px] text-text-muted">{p}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
