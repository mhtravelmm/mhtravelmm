import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NotificationItem } from '../data/notifications';
import { useAuth } from './auth';
import { isSupabaseConfigured, supabase } from './supabase';
import { readScoped, writeScoped } from './userScope';

const STORAGE_BASE = 'notification-read';
const TABLE = 'notifications';
const CHANGED_EVENT = 'mh-travel-notifications-changed';

type ReadMap = Record<string, boolean>;

export type NotificationFeed = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
};

function emitChange() {
  window.dispatchEvent(new Event(CHANGED_EVENT));
}

function storedReadMap(owner: string | null): ReadMap {
  return readScoped<ReadMap>(STORAGE_BASE, owner, {});
}

/**
 * The notification rows are shared feed content; only the read flag belongs to
 * the account. Storing it per user keeps one traveler's read list out of the
 * next account's badge.
 */
export function useNotificationFeed(seed: NotificationItem[]): NotificationFeed {
  const { user } = useAuth();
  const owner = user?.id ?? null;
  const [readMap, setReadMap] = useState<ReadMap>(() => storedReadMap(owner));

  useEffect(() => {
    setReadMap(storedReadMap(owner));
    if (!isSupabaseConfigured || !supabase || !owner) return;

    let active = true;
    void (async () => {
      const { data, error } = await supabase.from(TABLE).select('id, is_read').eq('user_id', owner);
      if (!active || error || !data || data.length === 0) return;
      const remote: ReadMap = {};
      for (const row of data) {
        const record = row as { id?: unknown; is_read?: unknown };
        if (record.id !== undefined && record.id !== null) remote[String(record.id)] = record.is_read === true;
      }
      setReadMap(remote);
      writeScoped(STORAGE_BASE, owner, remote);
    })();

    return () => { active = false; };
  }, [owner]);

  useEffect(() => {
    const sync = () => setReadMap(storedReadMap(owner));
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [owner]);

  // Only rows the account already has are updated; nothing here invents feed
  // rows, because the writers that create them do not exist yet.
  const persist = useCallback(async (ids: string[], isRead: boolean) => {
    if (!isSupabaseConfigured || !supabase || !owner || ids.length === 0) return;
    await supabase.from(TABLE).update({ is_read: isRead }).eq('user_id', owner).in('id', ids);
  }, [owner]);

  // Plan §16B.3: one event can reach the reader through two sources — the feed
  // row and the notice the order flow wrote — and both carry the same id. The
  // first source wins, so a status change shows once, not twice.
  const notifications = useMemo(() => {
    const seen = new Set<string>();
    const unique = seed.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
    return unique.map((item) => ({ ...item, isRead: readMap[item.id] ?? item.isRead }));
  }, [readMap, seed]);

  const markAllRead = useCallback(() => {
    const next: ReadMap = { ...readMap };
    for (const item of seed) next[item.id] = true;
    writeScoped(STORAGE_BASE, owner, next);
    setReadMap(next);
    void persist(seed.map((item) => item.id), true);
    emitChange();
  }, [owner, persist, readMap, seed]);

  const markRead = useCallback((id: string) => {
    const next = { ...readMap, [id]: true };
    writeScoped(STORAGE_BASE, owner, next);
    setReadMap(next);
    void persist([id], true);
    emitChange();
  }, [owner, persist, readMap]);

  return {
    notifications,
    unreadCount: notifications.filter((item) => !item.isRead).length,
    markAllRead,
    markRead,
  };
}
