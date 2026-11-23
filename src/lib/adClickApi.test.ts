import { describe, expect, it, vi } from 'vitest';
import { recordAdClickRemotely } from './adClickApi';

describe('recordAdClickRemotely', () => {
  it('asks the RPC with the three values the migration names', async () => {
    const record = vi.fn(async () => 'https://example.com/offer');
    const url = await recordAdClickRemotely('cr-1', 'home_hero', 'sess-1', record);
    expect(record).toHaveBeenCalledWith('cr-1', 'home_hero', 'sess-1');
    expect(url).toBe('https://example.com/offer');
  });

  it('answers null for a creative the server no longer has', async () => {
    expect(await recordAdClickRemotely('cr-gone', 'home_hero', 's', async () => null)).toBeNull();
  });

  it('answers undefined when the RPC could not answer, so the caller falls back', async () => {
    expect(await recordAdClickRemotely('cr-1', 'home_hero', 's', async () => undefined)).toBeUndefined();
  });
});
