import { assignGuideSlugs, guidePath } from './guideSlug';
import { addEarningForGuide } from './guideEarningsStore';
import { recordAdminAudit } from './adminAudit';
import { pushFeedEvent } from './notificationFeed';
import { publishDueItems } from './scheduleRules';
import { fill } from './fill';
import { translate } from './translations';
import {
  readBlogPosts,
  readGuides,
  writeBlogPosts,
  writeGuides,
  type AdminGuide,
  type AdminPost,
} from './contentStore';

/**
 * Plan §16B.7 `publish_due_content` and Plan §10 §4 Schedule: a post or guide
 * whose `scheduledFor` has passed goes live here, with the actor `system`, and
 * the run is idempotent — the second pass finds nothing left in `Scheduled`.
 *
 * The job runs without a React tree, so it resolves both languages directly
 * rather than calling `t()` from a hook. The feed row and the audit row have
 * the same shape the editor writes when an Admin publishes by hand.
 */

/** Both languages, because a published post is a row every traveler reads. */
function feedText(key: string, fallback: string): { mm: string; en: string } {
  return { mm: translate(key, 'mm') ?? fallback, en: translate(key, 'en') ?? fallback };
}

function fillBoth(text: { mm: string; en: string }, values: Record<string, string>): { mm: string; en: string } {
  return { mm: fill(text.mm, values), en: fill(text.en, values) };
}

function today(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export type PublishRun = { blog: number; guide: number };

/** Publishes every due post, then every due guide, and reports how many of each. */
export function publishDueContent(now = new Date()): PublishRun {
  // A soft-deleted row is skipped rather than published: Delete is a decision,
  // and a schedule left on the row must not undo it. The row still goes back
  // into the store, so deleting a post never removes it from the table.
  const postResult = publishDueItems(
    readBlogPosts(),
    now,
    (post): AdminPost => ({
      ...post,
      status: 'Published',
      publishedAt: today(now),
      scheduledFor: null,
      version: post.version + 1,
      updatedAt: today(now),
    }),
    (post) => !post.deletedAt,
  );

  for (const post of postResult.published) {
    recordAdminAudit({
      actor: 'system',
      actorRole: 'system',
      action: 'published',
      objectType: 'blog',
      objectId: post.id,
      summary: post.titleEn,
      source: 'content',
    }, now);
    pushFeedEvent('blog_published', {
      title: feedText('bp_feed_published_title', 'New blog post published'),
      message: fillBoth(feedText('bp_feed_published_body', '{title} is ready to read.'), { title: post.titleEn }),
      href: `/blogs/${post.id}`,
      at: now,
    });
  }
  if (postResult.published.length > 0) writeBlogPosts(postResult.items);

  const storedGuides = readGuides();
  const guideResult = publishDueItems(
    storedGuides,
    now,
    (guide): AdminGuide => ({
      ...guide,
      status: 'Published',
      publishedAt: today(now),
      scheduledFor: null,
      version: guide.version + 1,
    }),
    (guide) => !guide.deletedAt,
  );
  // Plan §10 §2: the first publish fixes the slug. It is assigned across the
  // whole list so two guides released in one run cannot end up sharing one.
  const sluggedGuides = guideResult.published.length > 0 ? assignGuideSlugs(guideResult.items) : guideResult.items;
  const sluggedById = new Map(sluggedGuides.map((guide) => [guide.id, guide]));

  for (const published of guideResult.published) {
    const guide = sluggedById.get(published.id) ?? published;
    recordAdminAudit({
      actor: 'system',
      actorRole: 'system',
      action: 'published',
      objectType: 'guide',
      objectId: guide.id,
      summary: guide.titleEn,
      source: 'content',
    }, now);
    // A guide earns on first publish; the unique guide id stops a second row.
    addEarningForGuide({
      guideId: guide.id,
      guideTitle: guide.titleEn,
      author: guide.authorEn,
      publishedAt: today(now),
    });
    pushFeedEvent('guide_published', {
      title: feedText('tg_feed_published_title', 'New travel guide published'),
      message: fillBoth(feedText('tg_feed_published_body', '{title} is ready to read.'), { title: guide.titleEn }),
      href: guidePath(guide),
      at: now,
    });
  }
  if (guideResult.published.length > 0) writeGuides(sluggedGuides);

  return { blog: postResult.published.length, guide: guideResult.published.length };
}
