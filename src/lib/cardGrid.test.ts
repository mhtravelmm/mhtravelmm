import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CARD_MAX_WIDTH_PX, cardGridMaxWidth, cardGridStyle } from './cardGrid';

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) sourceFiles(path, out);
    else if (/\.tsx$/.test(entry)) out.push(path);
  }
  return out;
}

describe('card grid cap', () => {
  it('follows columns × max width + gaps', () => {
    expect(cardGridMaxWidth(5, 'md')).toBe(5 * 240 + 4 * 10);
    expect(cardGridMaxWidth(5, 'md', 3)).toBe(5 * 240 + 4 * 12);
    expect(cardGridMaxWidth(4, 'lg', 2)).toBe(4 * 300 + 3 * 8);
    expect(cardGridStyle(3, 'xl')).toEqual({ maxWidth: 3 * 340 + 2 * 10 });
  });

  it('keeps the numeric table in step with the card size classes', () => {
    // A size that gains a maxWidth class without the number would make the
    // grid cap disagree with the card it hosts.
    const source = readFileSync('src/components/ui/ListingCard.tsx', 'utf8');
    for (const [size, width] of Object.entries(CARD_MAX_WIDTH_PX)) {
      expect(source).toContain(`maxWidth: 'max-w-[${width}px]'`);
      expect(source).toContain(size);
    }
  });

  it('leaves no page hand-writing a five-column md cap', () => {
    // Three grids used to declare size="md" under a 190px cap, so the prop did
    // nothing. Every capped card grid now computes its width instead.
    const offenders: string[] = [];
    for (const file of sourceFiles('src/features')) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/grid max-w-\[(\d+)px\][^`"']*lg:grid-cols-5/g)) {
        offenders.push(`${file}: max-w-[${match[1]}px] with five columns`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
