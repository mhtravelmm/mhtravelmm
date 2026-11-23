/**
 * Plan §10 §4 and §10 §2: a post's and a guide's URL is the lowercase,
 * hyphenated English title, fixed after the first publish. The rule lives here
 * rather than in `contentReader.ts` so the guide code can use it without
 * importing the reader, which imports the store, which imports the guide.
 */

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return slug || 'story';
}

/** A taken slug gains a number, so two items with one title still both have a URL. */
export function uniqueSlug(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}
