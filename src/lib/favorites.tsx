import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { isSupabaseConfigured, supabase } from './supabase';
import { adoptLegacyKey, readScoped, writeScoped } from './userScope';

const STORAGE_BASE = 'favorites';
const LEGACY_KEY = 'mh-travel-favorite-overrides';
const FAVORITES_CHANGED_EVENT = 'mh-travel-favorites-changed';
const TABLE = 'favorites';

type FavoriteOverrides = Record<string, boolean>;

interface FavoritesContextValue {
  overrides: FavoriteOverrides;
  isFavorite: (id: string, defaultValue?: boolean) => boolean;
  toggleFavorite: (id: string, defaultValue?: boolean) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function toOverrides(ids: string[]): FavoriteOverrides {
  return ids.reduce<FavoriteOverrides>((acc, id) => { acc[id] = true; return acc; }, {});
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const owner = user?.id ?? null;
  const [overrides, setOverrides] = useState<FavoriteOverrides>(() => adoptLegacyKey(STORAGE_BASE, LEGACY_KEY, owner, {}));
  // Writes are fire-and-forget, so a slow request must not overwrite a newer
  // local toggle when it resolves.
  const writeToken = useRef(0);

  useEffect(() => {
    setOverrides(adoptLegacyKey(STORAGE_BASE, LEGACY_KEY, owner, {}));
    if (!isSupabaseConfigured || !supabase || !owner) return;

    const token = writeToken.current;
    let active = true;
    void (async () => {
      const { data, error } = await supabase.from(TABLE).select('listing_id').eq('user_id', owner);
      // A toggle made while the read was in flight is newer than this result.
      if (!active || error || token !== writeToken.current) return;
      const remote = toOverrides((data ?? []).map((row) => String((row as { listing_id: unknown }).listing_id)));
      setOverrides(remote);
      writeScoped(STORAGE_BASE, owner, remote);
    })();

    return () => { active = false; };
  }, [owner]);

  useEffect(() => {
    const sync = () => setOverrides(readScoped<FavoriteOverrides>(STORAGE_BASE, owner, {}));
    window.addEventListener(FAVORITES_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(FAVORITES_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [owner]);

  // A failed write rolls the optimistic row back, so the icon stops claiming a
  // state the account does not actually have.
  const rollback = useCallback((id: string, token: number) => {
    if (token !== writeToken.current) return;
    setOverrides((current) => {
      const rolled = { ...current, [id]: !current[id] };
      writeScoped(STORAGE_BASE, owner, rolled);
      return rolled;
    });
  }, [owner]);

  const persistRemote = useCallback(async (id: string, next: boolean, token: number) => {
    if (!isSupabaseConfigured || !supabase || !owner) return;
    if (next) {
      const { error } = await supabase.from(TABLE).insert({ user_id: owner, listing_id: id });
      // 23505 is the duplicate-key code: the row is already there, which is the
      // state the caller asked for, so it is not a failure.
      if (error && error.code !== '23505') rollback(id, token);
      return;
    }
    const { error } = await supabase.from(TABLE).delete().eq('user_id', owner).eq('listing_id', id);
    if (error) rollback(id, token);
  }, [owner, rollback]);

  const toggleFavorite = useCallback((id: string, defaultValue = false) => {
    writeToken.current += 1;
    const token = writeToken.current;
    setOverrides((current) => {
      const next = { ...current, [id]: !(current[id] ?? defaultValue) };
      writeScoped(STORAGE_BASE, owner, next);
      void persistRemote(id, next[id], token);
      return next;
    });
    window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
  }, [owner, persistRemote]);

  const value = useMemo<FavoritesContextValue>(() => ({
    overrides,
    isFavorite: (id, defaultValue = false) => overrides[id] ?? defaultValue,
    toggleFavorite,
  }), [overrides, toggleFavorite]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used inside FavoritesProvider');
  return context;
}
