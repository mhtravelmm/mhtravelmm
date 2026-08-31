import { Star } from 'lucide-react';
import { REVIEWS } from '../../../data/homeData';
import { SectionHeader } from './SectionHeader';

export function Reviews() {
  return (
    <section className="mb-5">
      <SectionHeader title="Reviews" viewAllHref="/reviews" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {REVIEWS.map((r) => (
          <div key={r.id} className="rounded-card bg-[#e9e6df] p-2.5">
            <p className="mb-1 text-xs font-medium text-[#1a1a1a]">{r.name}</p>
            <p className="mb-1.5 text-[10px] text-[#4a4a48]">{r.text}</p>
            <div className="flex gap-0.5 text-status-warning">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={10} fill={i < r.rating ? 'currentColor' : 'none'} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
