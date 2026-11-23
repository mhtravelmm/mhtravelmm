/**
 * Plan §10 §1 lists `seoTags` as a list, not the single comma-separated text
 * field the editor had. The editor stores a real array and this module is the
 * one place a stored value becomes one, so a row saved before the change (a
 * string) still loads and a reader never sees a tag with stray whitespace.
 */

/**
 * A stored value as a clean tag list. Accepts the old comma-separated string
 * and the array, because a row in browser storage outlives the code that wrote
 * it. Duplicates are dropped case-insensitively, keeping the first spelling.
 */
export function normalizeTags(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value.filter((tag): tag is string => typeof tag === 'string')
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const seen = new Set<string>();
  const tags: string[] = [];
  for (const item of raw) {
    const tag = item.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

/** A tag the editor just typed, or null when it is blank or already present. */
export function tagToAdd(tags: string[], typed: string): string | null {
  const tag = typed.trim();
  if (!tag) return null;
  return tags.some((existing) => existing.toLowerCase() === tag.toLowerCase()) ? null : tag;
}

/** The list without `tag`, matched the way `tagToAdd` refuses a duplicate. */
export function removeTag(tags: string[], tag: string): string[] {
  return tags.filter((existing) => existing.toLowerCase() !== tag.toLowerCase());
}

/** What a screen reader and the tag input's placeholder describe. */
export function tagsToText(tags: string[]): string {
  return tags.join(', ');
}
