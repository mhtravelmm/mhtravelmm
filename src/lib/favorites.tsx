import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'mh-travel-favorite-overrides';
type FavoriteOverrides = Record<string, boolean>;

interface FavoritesContextValue {
  overrides: FavoriteOverrides;
  isFavorite: (id: string, defaultValue?: boolean) => boolean;
  toggleFavorite: (id: string, defaultValue?: boolean) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readOverrides(): FavoriteOverrides {
  if (typeof window === 'undefined') return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as FavoriteOverrides) : {};
  } catch {
    return {};
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<FavoriteOverrides>(readOverrides);

  function toggleFavorite(id: string, defaultValue = false) {
    setOverrides((current) => {
      const next = { ...current, [id]: !(current[id] ?? defaultValue) };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const value = useMemo<FavoritesContextValue>(() => ({
    overrides,
    isFavorite: (id, defaultValue = false) => overrides[id] ?? defaultValue,
    toggleFavorite,
  }), [overrides]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used inside FavoritesProvider');
  return context;
}
