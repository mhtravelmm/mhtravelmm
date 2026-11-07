import { useMemo, useState } from 'react';
import { ArrowLeft, Bell, CheckCheck, CircleDot, Inbox, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NOTIFICATIONS, type NotificationItem } from '../../data/notifications';
import { useLanguage } from '../../lib/i18n';

type Filter = 'all' | 'unread' | 'read';

export function NotificationsPage() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(() => notifications.filter((item) => filter === 'all' || (filter === 'unread' ? !item.isRead : item.isRead)), [filter, notifications]);
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const today = visible.filter((item) => item.timeAgo.includes('hour'));
  const earlier = visible.filter((item) => !item.timeAgo.includes('hour'));

  function markAllRead() {
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
  }

  function markRead(id: string) {
    setNotifications((items) => items.map((item) => item.id === id ? { ...item, isRead: true } : item));
  }

  return (
    <div className="mx-auto max-w-4xl pb-8 pt-2 sm:pt-5">
      <div className="mb-4 flex items-center gap-2 text-[10px] text-text-faint"><Link to="/account" className="inline-flex items-center gap-1 hover:text-brand-blue"><ArrowLeft size={12} />{t('notifications_back_account')}</Link><span>/</span><span className="text-text-secondary">{t('notifications_title')}</span></div>
      <section className="overflow-hidden rounded-card border border-border bg-bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue"><Bell size={20} /></div><div><h1 className="text-lg font-medium text-text-primary">{t('notifications_title')}</h1><p className="mt-1 text-[11px] text-text-muted">{t('notifications_page_intro')}</p></div></div><button type="button" onClick={markAllRead} disabled={unreadCount === 0} className="inline-flex items-center gap-1.5 self-start rounded-md border border-border px-3 py-2 text-[10px] text-brand-blue disabled:cursor-not-allowed disabled:text-text-faint"><CheckCheck size={13} />{t('notifications_mark_all_read')}</button></div>
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 sm:px-5"><div className="flex gap-1">{(['all', 'unread', 'read'] as Filter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-[10px] ${filter === item ? 'bg-brand-blue text-white' : 'text-text-secondary hover:bg-bg-cardAlt'}`}>{t(`notifications_filter_${item}` as 'notifications_filter_all' | 'notifications_filter_unread' | 'notifications_filter_read')}</button>)}</div><span className="text-[10px] text-text-faint">{unreadCount} {t('notifications_unread_count')}</span></div>

        <div className="p-3 sm:p-5">{visible.length === 0 ? <EmptyNotifications /> : <div className="space-y-5">{today.length > 0 && <NotificationGroup title={t('notifications_today')} items={today} onRead={markRead} />}{earlier.length > 0 && <NotificationGroup title={t('notifications_earlier')} items={earlier} onRead={markRead} />}</div>}</div>
      </section>
    </div>
  );
}

function NotificationGroup({ title, items, onRead }: { title: string; items: NotificationItem[]; onRead: (id: string) => void }) {
  return <section><h2 className="mb-2 flex items-center gap-2 text-xs font-medium text-text-secondary"><span className="h-1.5 w-1.5 rounded-full bg-brand-blue" />{title}</h2><div className="divide-y divide-border rounded-md border border-border">{items.map((item) => <Link key={item.id} to={item.href} onClick={() => onRead(item.id)} className={`flex items-start gap-3 p-3 transition hover:bg-bg-cardAlt sm:p-4 ${item.isRead ? '' : 'bg-brand-blue/5'}`}><div className="h-11 w-11 shrink-0 rounded-full" style={{ background: `linear-gradient(135deg, ${item.thumbnailFrom}, ${item.thumbnailTo})` }} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className={`text-xs leading-5 ${item.isRead ? 'text-text-muted' : 'font-medium text-text-primary'}`}>{item.title}</p>{!item.isRead && <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue/10 px-1.5 py-0.5 text-[9px] text-brand-blue"><CircleDot size={8} />New</span>}</div><p className="mt-1 text-[10px] text-text-faint">{item.timeAgo}</p></div><ShieldCheck size={14} className="mt-1 shrink-0 text-text-faint" /></Link>)}</div></section>;
}

function EmptyNotifications() { const { t } = useLanguage(); return <div className="flex min-h-56 flex-col items-center justify-center text-center text-text-muted"><Inbox size={28} className="mb-2 text-text-faint" /><p className="text-xs">{t('notifications_empty')}</p><p className="mt-1 text-[10px] text-text-faint">{t('notifications_empty_detail')}</p></div>; }
