import { recordAdminAudit } from './adminAudit';
import { pushFeedEvent } from './notificationFeed';
import { readSubscriptions, writeSubscriptions } from './ownerSubscriptionStore';
import {
  applyExpiry,
  dueReminders,
  markReminded,
  type SubscriptionStatus,
} from './ownerSubscriptions';
import { fillPair } from './translations';

/**
 * Plan §16B.7 and §16B.3: `subscription_expiry` moves Active to grace to
 * expired, and `renewal_reminders` sends the 7, 3 and 1-day notices. Both read
 * the store and write only what changed, so a second pass in the same hour is
 * silent and neither job can duplicate a reminder.
 */

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'Active',
  grace: 'Grace',
  expired: 'Expired',
};

export type SubscriptionExpiryRun = { moved: number };

/**
 * One pass of the hourly job. A move writes an audit row per subscription,
 * because §16B.2 asks for one per state change and the actor here is `system`.
 */
export function runSubscriptionExpiry(now = new Date()): SubscriptionExpiryRun {
  const before = readSubscriptions(now);
  const { rows, moved } = applyExpiry(before, now);
  if (moved === 0) return { moved: 0 };

  writeSubscriptions(rows);

  for (const row of rows) {
    const previous = before.find((candidate) => candidate.id === row.id);
    if (!previous || previous.status === row.status) continue;
    recordAdminAudit({
      actor: 'system',
      actorRole: 'system',
      action: 'updated',
      objectType: 'shop_owner',
      objectId: row.shopId,
      summary: `${row.shopName} · ${STATUS_LABEL[previous.status]} → ${STATUS_LABEL[row.status]}`,
      source: 'subscriptions',
    }, now);
  }

  return { moved };
}

/**
 * §16B.3 sends the reminder to the owner, not to the staff bell, so this writes
 * the feed row directly with the owner as its recipient. The row is stored in
 * both languages (§16B.4) because the owner may switch language before reading.
 */
export function runRenewalReminders(now = new Date()): number {
  const rows = readSubscriptions(now);
  const due = dueReminders(rows, now);
  if (due.length === 0) return 0;

  let next = rows;
  for (const { subscription, daysLeft } of due) {
    const title = fillPair('owner_sub_ending_title', { days: daysLeft });
    pushFeedEvent('subscription_ending', {
      id: `sub-reminder-${subscription.id}-${daysLeft}`,
      title,
      message: fillPair('owner_sub_ending_body', {
        shop: subscription.shopName,
        amount: subscription.amountMmk.toLocaleString('en-US'),
      }),
      recipients: [{ kind: 'author', value: subscription.ownerName }],
      href: '/shop-owner',
      at: now,
    });
    next = next.map((row) => (row.id === subscription.id ? markReminded(row, daysLeft, now) : row));
  }

  writeSubscriptions(next);
  return due.length;
}
