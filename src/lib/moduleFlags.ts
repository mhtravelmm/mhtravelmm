/**
 * Plan §16G.5: a module uses the backend only when its flag is `on` and
 * Supabase is configured; otherwise it keeps its local behaviour. The admin
 * dashboard gets its own flag (`VITE_BACKEND_ADMIN`, ticket O-60) so the
 * sections can move to server data one at a time without touching the rest.
 */
export type ModuleFlag = 'rentals' | 'blog' | 'guides' | 'ads' | 'search' | 'admin';

const ENV_NAMES: Record<ModuleFlag, string> = {
  rentals: 'VITE_BACKEND_RENTALS',
  blog: 'VITE_BACKEND_BLOG',
  guides: 'VITE_BACKEND_GUIDES',
  ads: 'VITE_BACKEND_ADS',
  search: 'VITE_BACKEND_SEARCH',
  admin: 'VITE_BACKEND_ADMIN',
};

/** §16G.5 spells the values `on` and `off`; anything else means off. */
export function readFlag(value: string | undefined): boolean {
  if (value === undefined) return false;
  return value.trim().toLowerCase() === 'on';
}

export function flagIsOn(flag: ModuleFlag): boolean {
  return readFlag(import.meta.env[ENV_NAMES[flag]] as string | undefined);
}

export function envNameFor(flag: ModuleFlag): string {
  return ENV_NAMES[flag];
}

/**
 * §16G.5: the backend is only used when the flag is `on` **and** Supabase is
 * configured, so a half-configured deploy keeps the local preview instead of
 * failing every request.
 */
export function backendIsOn(flag: ModuleFlag): boolean {
  if (!flagIsOn(flag)) return false;
  return Boolean(import.meta.env.VITE_SUPABASE_URL) && Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);
}
