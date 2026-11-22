/** Returns the categories present in `items`, with `allLabel` first. */
export function categoryOptions<T extends { category: string }>(items: T[], allLabel: string): string[] {
  return [allLabel, ...Array.from(new Set(items.map((item) => item.category)))];
}

/** Filters by category, treating `allLabel` as "no filter". */
export function filterByCategory<T extends { category: string }>(
  items: T[],
  selected: string,
  allLabel: string,
): T[] {
  return selected === allLabel ? items : items.filter((item) => item.category === selected);
}
