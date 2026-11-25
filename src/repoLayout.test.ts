import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Plan §16I: each kind of file has one home. This test is ticket O-05 — it
 * fails when a stray folder, a second Plan file, SQL outside `SQL/` or a
 * document outside `Doc/` appears, so the rule survives without anyone
 * remembering it.
 */
const ROOT = process.cwd();

const DOC_FILES = [
  'BLOG-IMAGE-SOURCES.md',
  'COMPLETED-WORK.md',
  'HISTORY.md',
  'PLAN-VS-CODE.md',
  'README.md',
  'REMAINING-WORK.md',
  'STATUS.md',
  'TICKETS.md',
];

const ROOT_FILES = [
  '.gitignore',
  'AGENTS.md',
  'README.md',
  'eslint.config.js',
  'index.html',
  'package-lock.json',
  'package.json',
  'postcss.config.js',
  'tailwind.config.js',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'wrangler.jsonc',
];

/** §16I names the folders that must never exist, whatever they hold. */
const FORBIDDEN_DIRS = ['supabase', 'docs', 'workers', 'migrations'];

const MIGRATION_NAME = /^\d{14}_[a-z0-9_]+\.sql$/;

function entries(path: string): string[] {
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.name !== 'node_modules' && entry.name !== '.git')
    .map((entry) => `${entry.isDirectory() ? 'd' : 'f'}${entry.name}`);
}

function names(path: string): string[] {
  return entries(path).map((entry) => entry.slice(1));
}

function files(path: string): string[] {
  return entries(path)
    .filter((entry) => entry.startsWith('f'))
    .map((entry) => entry.slice(1));
}

function dirs(path: string): string[] {
  return entries(path)
    .filter((entry) => entry.startsWith('d'))
    .map((entry) => entry.slice(1));
}

describe('repository layout (§16I)', () => {
  it('holds exactly one Plan file, named PROJECT-PLAN.md', () => {
    expect(names(join(ROOT, 'Plan'))).toEqual(['PROJECT-PLAN.md']);
  });

  it('holds exactly the documents §16I lists, and no other', () => {
    expect(names(join(ROOT, 'Doc')).sort()).toEqual(DOC_FILES);
  });

  it('keeps every SQL file in SQL/, correctly named and in increasing order', () => {
    const migrations = files(join(ROOT, 'SQL'));
    expect(migrations.length).toBeGreaterThan(0);
    for (const file of migrations) expect(file, file).toMatch(MIGRATION_NAME);
    expect(migrations).toEqual([...migrations].sort());
    expect(new Set(migrations).size, 'a duplicated timestamp').toBe(migrations.length);
    expect(dirs(join(ROOT, 'SQL')), 'SQL/ holds no subfolder').toEqual([]);
  });

  // §16I: the folder holds only `.gitkeep` until M-06 adds `index.ts`.
  it('keeps the Worker folder to one file', () => {
    const worker = names(join(ROOT, 'Worker'));
    expect(worker.length, worker.join(', ')).toBe(1);
    expect(['index.ts', '.gitkeep']).toContain(worker[0]);
  });

  it('keeps the repository root to tool and config files', () => {
    const stray = names(ROOT)
      .filter((name) => !ROOT_FILES.includes(name))
      .filter((name) => !['Plan', 'Doc', 'SQL', 'Worker', 'public', 'scripts', 'src', 'dist'].includes(name));
    expect(stray).toEqual([]);
  });

  it('has none of the forbidden folders', () => {
    const present = FORBIDDEN_DIRS.filter((name) => dirs(ROOT).includes(name));
    expect(present).toEqual([]);
  });

  it('holds no SQL outside SQL/ and no document outside Doc/', () => {
    const walk = (path: string): string[] =>
      names(path).flatMap((name) => {
        const full = join(path, name);
        return statSync(full).isDirectory() ? walk(full) : [full.slice(ROOT.length + 1)];
      });
    const outside = walk(ROOT).filter(
      (file) =>
        !file.startsWith('SQL/') &&
        !file.startsWith('Doc/') &&
        !file.startsWith('Plan/') &&
        !file.startsWith('dist/') &&
        // §16I allows exactly these two documents at the root.
        file !== 'AGENTS.md' &&
        file !== 'README.md',
    );
    const offenders = outside.filter((file) => file.endsWith('.sql') || file.endsWith('.md'));
    expect(offenders).toEqual([]);
  });
});
