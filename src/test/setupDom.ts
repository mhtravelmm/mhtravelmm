import { afterEach, beforeEach } from 'vitest';

/**
 * jsdom gaps the pages touch. `matchMedia` is read by the reduced-motion
 * checks, and `IntersectionObserver` by `AdSlot` — both exist in a browser and
 * in neither jsdom, so a page that renders one would otherwise throw here and
 * pass there.
 *
 * This file loads for every test, including the node ones, so it does nothing
 * when there is no document.
 */
const hasDom = typeof document !== 'undefined';

beforeEach(async () => {
  if (!hasDom) return;
  window.localStorage.clear();
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
  const scope = window as unknown as Record<string, unknown>;
  if (!('IntersectionObserver' in scope)) {
    class NoopObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
      root = null;
      rootMargin = '';
      thresholds = [];
    }
    scope.IntersectionObserver = NoopObserver;
  }
});

afterEach(async () => {
  if (!hasDom) return;
  const { cleanup } = await import('@testing-library/react');
  cleanup();
});
