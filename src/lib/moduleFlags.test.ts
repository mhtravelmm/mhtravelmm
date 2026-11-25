import { afterEach, describe, expect, it } from 'vitest';
import { backendIsOn, envNameFor, flagIsOn, readFlag } from './moduleFlags';

/**
 * Plan §16G.5: `on` means on, `off` means off, and an unset or misspelled value
 * must not switch a module to the backend by accident. `backendIsOn` also needs
 * Supabase configured, which is what these tests stub through `import.meta.env`.
 */
const ENV = import.meta.env as Record<string, string | undefined>;
const SAVED = { ...ENV };

function setEnv(values: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete ENV[key];
    else ENV[key] = value;
  }
}

afterEach(() => {
  for (const key of Object.keys(ENV)) if (!(key in SAVED)) delete ENV[key];
  Object.assign(ENV, SAVED);
});

describe('module flags (§16G.5)', () => {
  it('reads only the documented value as on', () => {
    expect(readFlag('on')).toBe(true);
    expect(readFlag(' ON ')).toBe(true);
    for (const value of ['off', 'true', '1', 'yes', '', 'enabled', undefined]) {
      expect(readFlag(value), String(value)).toBe(false);
    }
  });

  it('maps each module to the environment name the Plan lists', () => {
    expect(envNameFor('admin')).toBe('VITE_BACKEND_ADMIN');
    expect(envNameFor('rentals')).toBe('VITE_BACKEND_RENTALS');
    expect(envNameFor('blog')).toBe('VITE_BACKEND_BLOG');
    expect(envNameFor('guides')).toBe('VITE_BACKEND_GUIDES');
    expect(envNameFor('ads')).toBe('VITE_BACKEND_ADS');
    expect(envNameFor('search')).toBe('VITE_BACKEND_SEARCH');
  });

  it('leaves the admin dashboard on its local behaviour by default', () => {
    setEnv({ VITE_BACKEND_ADMIN: undefined });
    expect(flagIsOn('admin')).toBe(false);
    expect(backendIsOn('admin')).toBe(false);
  });

  it('still refuses the backend when the flag is on but Supabase is not configured', () => {
    setEnv({ VITE_BACKEND_ADMIN: 'on', VITE_SUPABASE_URL: undefined, VITE_SUPABASE_ANON_KEY: undefined });
    expect(flagIsOn('admin')).toBe(true);
    expect(backendIsOn('admin')).toBe(false);
  });

  it('turns the module on only when both the flag and Supabase are set', () => {
    setEnv({
      VITE_BACKEND_ADMIN: 'on',
      VITE_SUPABASE_URL: 'https://example.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'anon-key',
    });
    expect(backendIsOn('admin')).toBe(true);
    // A neighbouring module is untouched by the admin flag.
    setEnv({ VITE_BACKEND_BLOG: 'off' });
    expect(backendIsOn('blog')).toBe(false);
  });

  it('reads the flag from the environment at call time, not at import time', () => {
    setEnv({ VITE_BACKEND_SEARCH: 'off' });
    expect(flagIsOn('search')).toBe(false);
    setEnv({ VITE_BACKEND_SEARCH: 'on' });
    expect(flagIsOn('search')).toBe(true);
  });
});
