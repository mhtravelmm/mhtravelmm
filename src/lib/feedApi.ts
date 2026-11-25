import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';
import type { AdminRole } from './adminRoles';
import type { FeedEventId, FeedRecipient, FeedRow } from './notificationFeed';

/**
 * Plan §16B.3 and ticket O-02. `notification_feed` is one table of shared rows;
 * the reader filters by recipient. The browser store
 * (`src/lib/notificationFeed.ts`) is the twin, and this module is the seam that
 * decides which one answers.
 *
 * The server read is deliberately narrow: it asks for the rows the signed-in
 * reader may see and nothing else. `can_read_feed_row()` is the policy that
 * decides, so the client cannot widen its own view by asking for a role it does
 * not hold.
 */

const TABLE = 'notification_feed';

export interface RemoteFeedRow {
  id: string;
  event: string;
  title: string;
  body: string;
  href: string;
  recipient_kind: string;
  recipient_value: string;
  created_at: string;
  expires_at: string;
}

/**
 * A server row → the shape `feedFor()` already filters. The table stores one
 * string per language column pair in the browser store; the server row holds a
 * single `title`/`body`, because a feed row is written by a function that knows
 * the reader's language, so both language slots carry it. That keeps a reader
 * from seeing a blank when the other language was never written.
 */
export function fromRemoteFeedRow(row: RemoteFeedRow): FeedRow {
  return {
    id: row.id,
    event: row.event as FeedEventId,
    title: { mm: row.title, en: row.title },
    message: { mm: row.body, en: row.body },
    href: row.href,
    recipients: [recipientOf(row.recipient_kind, row.recipient_value)],
    createdAt: row.created_at,
  };
}

function recipientOf(kind: string, value: string): FeedRecipient {
  switch (kind) {
    case 'role':
      return { kind: 'role', value: value as AdminRole };
    case 'user':
      return { kind: 'user', value };
    case 'author':
      return { kind: 'author', value };
    default:
      return { kind: 'everyone' };
  }
}

/**
 * The rows the signed-in reader may see, newest first. `null` means the server
 * could not answer — no Supabase, no session, or M-04 unapplied — and the caller
 * keeps its browser rows. An empty array is a real answer: the reader has no
 * feed, which is not the same thing.
 */
export async function readRemoteFeed(limit = 50): Promise<FeedRow[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) return null;
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, event, title, body, href, recipient_kind, recipient_value, created_at, expires_at')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error || !data) return null;
    return (data as RemoteFeedRow[]).map(fromRemoteFeedRow);
  } catch {
    return null;
  }
}

/**
 * A page that wants the server's rows when there are any. `undefined` while the
 * first read is in flight, so a caller can tell "not yet" from "nothing".
 */
export function useRemoteFeed(limit = 50): FeedRow[] | null {
  const [rows, setRows] = useState<FeedRow[] | null>(null);
  useEffect(() => {
    let active = true;
    void readRemoteFeed(limit).then((next) => {
      if (active) setRows(next);
    });
    return () => { active = false; };
  }, [limit]);
  return rows;
}
