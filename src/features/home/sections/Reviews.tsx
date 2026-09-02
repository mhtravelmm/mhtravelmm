import { Star } from 'lucide-react';
import { REVIEWS } from '../../../data/homeData';
import { useLanguage } from '../../../lib/i18n';
import { SectionHeader } from './SectionHeader';

export function Reviews() {
  const { t } = useLanguage();
  return (
    <section className="mb-5">
      <SectionHeader title={t('section_reviews')} viewAllHref="/reviews" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {REVIEWS.map((r) => (
          <div key={r.id} className="rounded-card bg-review-bg p-2.5">
            <p className="mb-1 text-xs font-medium text-review-text">{r.name}</p>
            <p className="mb-1.5 text-[10px] text-review-muted">{r.text}</p>
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
