import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { allPaths } from './routes';

interface ManifestEntry {
  path: string;
  title: string;
}

const manifest = JSON.parse(
  readFileSync(new URL('../public/manus-routes.json', import.meta.url), 'utf8'),
) as { routes: ManifestEntry[] };

describe('route manifest', () => {
  it('lists every declared route', () => {
    const declared = allPaths().sort();
    const listed = manifest.routes.map((route) => route.path).sort();
    expect(listed).toEqual(declared);
  });

  it('gives every route a title', () => {
    const untitled = manifest.routes.filter((route) => !route.title.trim()).map((route) => route.path);
    expect(untitled).toEqual([]);
  });

  it('lists each route once', () => {
    const paths = manifest.routes.map((route) => route.path);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
