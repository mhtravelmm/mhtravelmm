import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { NotificationItem } from '../../data/notifications';
import { useLanguage } from '../../lib/i18n';

interface NotificationsDropdownProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onOpenItem: (id: string) => void;
}

export function NotificationsDropdown({
  notifications,
  onClose,
  onMarkAllRead,
  onOpenItem,
}: NotificationsDropdownProps) {
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-lg border border-border bg-bg-card shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <p className="text-xs font-medium text-text-primary">{t('notifications_title')}</p>
        <button
          type="button"
          onClick={onMarkAllRead}
          className="text-[10px] text-brand-blue hover:underline"
        >
          {t('notifications_mark_all_read')}
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-[11px] text-text-faint">
            {t('notifications_empty')}
          </p>
        ) : (
          notifications.map((n) => (
            <Link
              key={n.id}
              to={n.href}
              onClick={() => onOpenItem(n.id)}
              className="flex items-start gap-2.5 border-b border-border/60 px-3 py-2.5 last:border-b-0 hover:bg-bg-cardAlt"
            >
              <div
                className="h-9 w-9 shrink-0 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${n.thumbnailFrom}, ${n.thumbnailTo})`,
                }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[11px] leading-snug line-clamp-2 ${
                    n.isRead ? 'text-text-muted' : 'text-text-primary'
                  }`}
                >
                  {n.title}
                </p>
                <p className="mt-0.5 text-[9px] text-text-faint">{n.timeAgo}</p>
              </div>
              {!n.isRead && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-blue" />}
            </Link>
          ))
        )}
      </div>

      <Link
        to="/account/notifications"
        onClick={onClose}
        className="block border-t border-border px-3 py-2 text-center text-[10px] text-brand-blue hover:underline"
      >
        {t('notifications_see_all')}
      </Link>
    </div>
  );
}
