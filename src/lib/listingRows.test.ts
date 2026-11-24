import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SHOP_PHOTO_QUOTA } from './mediaRules';
import {
  BOOKING_FLOW_MODES,
  LISTING_CATEGORIES,
  LISTING_STATUSES,
  PRICE_DISPLAY_MODES,
  SEED_LISTING_ROWS,
  findListingRow,
  toCardListing,
} from './listingRows';

/**
 * `20261130000100_listings.sql` carries the table and the seed;
 * `src/lib/listingRows.ts` is the browser twin. These tests read the SQL so an
 * edit on one side cannot leave the other behind — the guard
 * `adServing.test.ts` and `mediaRules.test.ts` already use.
 */

const sql = readFileSync(
  join(process.cwd(), 'supabase', 'migrations', '20261130000100_listings.sql'),
  'utf8',
);

describe('listings migration', () => {
  it('accepts every category the client lists, and no other', () => {
    const check = sql.slice(sql.indexOf('category in ('), sql.indexOf('city_id text not null'));
    for (const category of LISTING_CATEGORIES) expect(check).toContain(`'${category}'`);
    const quoted = [...check.matchAll(/'([a-z_]+)'/g)].map((match) => match[1]);
    expect(new Set(quoted)).toEqual(new Set(LISTING_CATEGORIES));
  });

  it('accepts every status and price mode the client lists', () => {
    for (const status of LISTING_STATUSES) expect(sql).toContain(`'${status}'`);
    for (const mode of PRICE_DISPLAY_MODES) expect(sql).toContain(`'${mode}'`);
    for (const mode of BOOKING_FLOW_MODES) expect(sql).toContain(`'${mode}'`);
  });

  it('seeds every row the client twin carries, with the same id and name', () => {
    for (const row of SEED_LISTING_ROWS) {
      const escapedName = row.name_en.replace(/'/g, "''");
      expect(sql).toContain(`('${row.id}', '${row.category}', '${row.city_id}'`);
      expect(sql).toContain(`'${escapedName}'`);
    }
  });

  it('seeds no row the client twin does not have', () => {
    const seeded = [...sql.matchAll(/^ {2}\('([a-z0-9-]+)', '([a-z_]+)', '([a-z-]+)'/gm)];
    expect(seeded).toHaveLength(SEED_LISTING_ROWS.length);
    for (const [, id] of seeded) expect(findListingRow(id), id).toBeDefined();
  });

  it('keeps the seed idempotent so an admin edit survives a rerun', () => {
    expect(sql).toContain('on conflict (id) do nothing');
  });

  it('skips a seed row whose city is missing rather than failing the migration', () => {
    expect(sql).toContain('where exists (select 1 from public.rental_cities c where c.id = seed.city_id)');
  });

  it('gives an owner their own row but not the right to approve it', () => {
    // The update policy's check must force an owner write back to Pending.
    expect(sql).toContain("or (owner_id = auth.uid() and status = 'pending')");
    expect(sql).toContain('public.is_listing_staff()');
  });

  it('hides a row that is not active from the public', () => {
    expect(sql).toContain("status = 'active'");
    expect(sql).toContain('or owner_id = auth.uid()');
  });
});

describe('listing photos migration', () => {
  const photos = readFileSync(
    join(process.cwd(), 'supabase', 'migrations', '20261130000200_listing_photos.sql'),
    'utf8',
  );

  it('bounds a listing at the same default quota the browser rules use', () => {
    expect(photos).toContain('listing_photo_quota_reached');
    expect(sql).toContain('photo_quota integer not null default 20');
    expect(DEFAULT_SHOP_PHOTO_QUOTA).toBe(20);
  });

  it('gives one photo one slot so the gallery order is unambiguous', () => {
    expect(photos).toContain('unique (listing_id, position)');
  });

  it('shows a photo only when its listing is visible', () => {
    expect(photos).toContain("l.status = 'active'");
  });

  it('deletes a listing\'s photos with the listing', () => {
    expect(photos).toContain('references public.listings (id) on delete cascade');
  });
});

describe('listing rows', () => {
  it('keeps ids stable so existing links and the guide index resolve', () => {
    expect(findListingRow('ph3')?.name_en).toBe('Lotte hotel Yangon');
    expect(findListingRow('pre1')?.category).toBe('rental');
    expect(findListingRow('ta1')?.category).toBe('attraction');
  });

  it('names a hotel its booking flow and a public price', () => {
    const hotel = findListingRow('ph1');
    expect(hotel?.booking_flow_mode).toBe('full_manual');
    expect(hotel?.price_display).toBe('public');
    expect(hotel?.price_from_usd).toBe(120);
  });

  it('leaves the MM name empty rather than copying English into it', () => {
    for (const row of SEED_LISTING_ROWS) expect(row.name_mm).toBeNull();
  });

  it('round-trips a row back to the card the pages already render', () => {
    const card = toCardListing(findListingRow('ph3')!);
    expect(card.title).toBe('Lotte hotel Yangon');
    expect(card.href).toBe('/hotels/lotte');
    expect(card.priceUsd).toBe(95);
  });

  it('holds one row per id', () => {
    const ids = SEED_LISTING_ROWS.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
