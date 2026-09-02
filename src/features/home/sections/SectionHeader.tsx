import { Link } from 'react-router-dom';
import { useLanguage } from '../../../lib/i18n';

export function SectionHeader({ title, viewAllHref }: { title: string; viewAllHref?: string }) {
  const { t } = useLanguage();
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h2 className="text-sm font-medium text-text-primary">{title}</h2>
      {viewAllHref && (
        <Link to={viewAllHref} className="text-xs text-brand-blue">
          {t('view_all')}
        </Link>
      )}
    </div>
  );
}
