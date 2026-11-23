import type { AdminGuide } from './contentStore';
import { slugify, uniqueSlug } from './slug';

/**
 * Plan §10 §2: a guide's URL slug is its lowercase hyphenated English title,
 * unique, and fixed after the first publish — so a shared link keeps working
 * when the title is later edited. A guide that has never been published has no
 * slug and is addressed by its row id.
 */
export function assignGuideSlug(guide: AdminGuide, all: AdminGuide[]): AdminGuide {
  if (guide.slug) return guide;
  const taken = new Set(all.map((row) => row.slug).filter(Boolean));
  return { ...guide, slug: uniqueSlug(slugify(guide.titleEn), taken) };
}

/** The same rule for a whole list, so two guides published in one run cannot share a slug. */
export function assignGuideSlugs(guides: AdminGuide[]): AdminGuide[] {
  const taken = new Set(guides.map((guide) => guide.slug).filter(Boolean));
  return guides.map((guide) => {
    if (guide.slug) return guide;
    const slug = uniqueSlug(slugify(guide.titleEn), taken);
    taken.add(slug);
    return { ...guide, slug };
  });
}

/** The URL a guide is read at. A guide saved before slugs keeps its row id. */
export function guidePath(guide: Pick<AdminGuide, 'id' | 'slug'>): string {
  return `/travel-guide/${guide.slug || guide.id}`;
}
