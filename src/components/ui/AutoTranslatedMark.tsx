import { Sparkles } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';

/**
 * Plan §16B.4: a text the reader is seeing in a language it was not written in
 * says so. Reviewed rows carry no mark, which is why the caller passes the
 * flag from `useLocalizedText` rather than deciding here.
 */
export function AutoTranslatedMark({ show, className = '' }: { show: boolean; className?: string }) {
  const { t } = useLanguage();
  if (!show) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-200 ${className}`}
    >
      <Sparkles size={9} />
      {t('auto_translated_mark')}
    </span>
  );
}
