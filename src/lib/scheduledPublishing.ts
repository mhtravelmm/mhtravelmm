import { addEarningForGuide } from './guideEarningsStore';
import { recordAdminAudit } from './adminAudit';
import { pushFeedEvent } from './notificationFeed';
import { publishDueItems } from './scheduleRules';
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
 * The job runs without a React tree, so it resolves its own English copy rather
 * than calling `t()` from a hook. The feed row and the audit row have the same
 * shape the editor writes when an Admin publishes by hand.
 */

function feedText(key: string, fallback: string): string {
  return translate(key, 'en') ?? fallback;
}

function today(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export type PublishRun = { blog: number; guide: number };

/** Publishes every due post, then every due guide, and reports how many of each. */
export function publishDueContent(now = new Date()): PublishRun {
  const postResult = publishDueItems(readBlogPosts(), now, (post): AdminPost => ({
    ...post,
    status: 'Published',
    publishedAt: today(now),
    scheduledFor: null,
    updatedAt: today(now),
  }));

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
      message: feedText('bp_feed_published_body', '{title} is ready to read.').replace('{title}', post.titleEn),
      href: `/blogs/${post.id}`,
      at: now,
    });
  }
  if (postResult.published.length > 0) writeBlogPosts(postResult.items);

  const guideResult = publishDueItems(readGuides(), now, (guide): AdminGuide => ({
    ...guide,
    status: 'Published',
    publishedAt: today(now),
    scheduledFor: null,
  }));

  for (const guide of guideResult.published) {
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
      author: guide.author,
      publishedAt: today(now),
    });
    pushFeedEvent('guide_published', {
      title: feedText('tg_feed_published_title', 'New travel guide published'),
      message: feedText('tg_feed_published_body', '{title} is ready to read.').replace('{title}', guide.titleEn),
      href: `/travel-guide/${guide.id}`,
      at: now,
    });
  }
  if (guideResult.published.length > 0) writeGuides(guideResult.items);

  return { blog: postResult.published.length, guide: guideResult.published.length };
}
