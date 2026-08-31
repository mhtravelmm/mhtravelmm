import { Link } from 'react-router-dom';

export function SectionHeader({ title, viewAllHref }: { title: string; viewAllHref?: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h2 className="text-sm font-medium text-white">{title}</h2>
      {viewAllHref && (
        <Link to={viewAllHref} className="text-xs text-brand-blue">
          View all
        </Link>
      )}
    </div>
  );
}
