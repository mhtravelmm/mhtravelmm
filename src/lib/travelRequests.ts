/**
 * Plan §6: a rental request, a ticket order, and a custom plan request all end
 * as a record the traveler can look up later, so each submission carries a
 * reference the confirmation screen and the Account dashboard can both show.
 *
 * The record is written to the account's scoped browser storage and, when
 * Supabase is configured, also to `public.bookings`. The local copy stays
 * authoritative: losing a request the traveler just made is worse than a
 * missed remote write, so a rejected insert is swallowed rather than rolled
 * back.
 */
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { isSupabaseConfigured, supabase } from './supabase';
import { readScoped, writeScoped } from './userScope';

export type TravelRequestKind = 'rental' | 'ticket' | 'custom_plan';

export type TravelRequest = {
  id: string;
  kind: TravelRequestKind;
  title: string;
  detail: string;
  /** USD base amount, or null when the request needs a quotation first. */
  amountUsd: number | null;
  createdAt: string;
};

export type TravelRequestInput = Omit<TravelRequest, 'id' | 'createdAt'>;

const STORAGE_BASE = 'requests';
const TABLE = 'bookings';
const CHANGED_EVENT = 'mh-travel-requests-changed';

const REFERENCE_PREFIX: Record<TravelRequestKind, string> = {
  rental: 'MHR',
  ticket: 'MHT',
  custom_plan: 'MHC',
};

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

/** `MHR-20261122-001`: readable over the phone and unique within an account. */
export function requestReference(kind: TravelRequestKind, at: Date, sequence: number): string {
  const stamp = `${at.getFullYear()}${pad(at.getMonth() + 1, 2)}${pad(at.getDate(), 2)}`;
  return `${REFERENCE_PREFIX[kind]}-${stamp}-${pad(Math.max(1, sequence), 3)}`;
}

/** Newest first, so the dashboard opens on the request just made. */
export function sortRequests(requests: TravelRequest[]): TravelRequest[] {
  return [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

export function requestsOfKind(requests: TravelRequest[], kinds: TravelRequestKind[]): TravelRequest[] {
  return sortRequests(requests.filter((request) => kinds.includes(request.kind)));
}

async function persistRemote(owner: string, request: TravelRequest) {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    await supabase.from(TABLE).insert({
      user_id: owner,
      reference: request.id,
      kind: request.kind,
      title: request.title,
      status: 'received',
      amount_usd: request.amountUsd,
    });
  } catch {
    // The local record already exists; a failed insert only means the back
    // office has not seen it yet.
  }
}

export function useTravelRequests() {
  const { user } = useAuth();
  const owner = user?.id ?? null;
  const [requests, setRequests] = useState<TravelRequest[]>(() => readScoped<TravelRequest[]>(STORAGE_BASE, owner, []));

  useEffect(() => {
    setRequests(readScoped<TravelRequest[]>(STORAGE_BASE, owner, []));
  }, [owner]);

  useEffect(() => {
    const sync = () => setRequests(readScoped<TravelRequest[]>(STORAGE_BASE, owner, []));
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [owner]);

  const addRequest = useCallback((input: TravelRequestInput): TravelRequest => {
    const current = readScoped<TravelRequest[]>(STORAGE_BASE, owner, []);
    const now = new Date();
    const request: TravelRequest = {
      ...input,
      id: requestReference(input.kind, now, current.length + 1),
      createdAt: now.toISOString(),
    };
    const next = [...current, request];
    writeScoped(STORAGE_BASE, owner, next);
    setRequests(next);
    window.dispatchEvent(new Event(CHANGED_EVENT));
    if (owner) void persistRemote(owner, request);
    return request;
  }, [owner]);

  return { requests: sortRequests(requests), addRequest };
}
