import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';

/**
 * A detail route whose `:id` names no record. Every page that resolves a
 * record from the URL renders this instead of falling back to the first row,
 * so an unknown id can never show a real listing under a URL that names a
 * different one.
 */
export function RecordNotFound() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-sm text-text-muted">{t('record_not_found')}</p>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-blue px-4 py-2 text-xs font-semibold text-white"
      >
        <ArrowLeft size={14} /> {t('record_go_back')}
      </button>
    </div>
  );
}
