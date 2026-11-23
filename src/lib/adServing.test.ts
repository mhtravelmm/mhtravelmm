import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AD_PLACEMENTS } from './adPlacements';
import { AD_EVENT_RETENTION_DAYS } from './adStats';
import { canManageAds, canReadAdReports } from './contentAdminAccess';
import type { AdminRole } from './adminRoles';

/**
 * The SQL in `20261125000200_ads_serving.sql` is the server twin of the client
 * rules. These tests read the migration text so an edit on one side cannot
 * quietly leave the other behind — the same guard `mediaRules.test.ts` uses
 * for the folder limits.
 */

const sql = readFileSync(
  join(process.cwd(), 'supabase', 'migrations', '20261125000200_ads_serving.sql'),
  'utf8',
);

const ROLES: AdminRole[] = ['Super Admin', 'Ads Admin', 'Admin', 'Payment Admin', 'Blog Post Admin', 'Rental Admin'];

describe('ads serving migration', () => {
  it('seeds every placement key the client catalog lists', () => {
    for (const placement of AD_PLACEMENTS) {
      expect(sql).toContain(`('${placement.key}', '${placement.page}'`);
    }
  });

  it('keeps the placement seed idempotent so a toggle survives a rerun', () => {
    expect(sql).toContain('on conflict (key) do nothing');
  });

  it('serves only a Live campaign inside its window with an approved creative', () => {
    expect(sql).toContain("camp.status = 'Live'");
    expect(sql).toContain('now() >= camp.start_at');
    expect(sql).toContain('now() < camp.end_at');
    expect(sql).toContain("c.approval = 'approved'");
  });

  it('collapses an inactive placement before any candidate is read', () => {
    expect(sql).toContain('where p.key = p_placement_key and p.active');
  });

  it('orders by priority, then draws by weight', () => {
    expect(sql).toContain('order by candidates.priority desc, candidates.draw asc');
    expect(sql).toContain('/ greatest(camp.weight, 1)');
  });

  it('returns the fallback flag so the page can take step 2', () => {
    expect(sql).toContain('fallback_allowed');
  });

  it('keeps the ad tables closed to the public and opens only the two calls', () => {
    expect(sql).toContain('grant execute on function public.serve_ad(text, text) to anon, authenticated;');
    expect(sql).toContain('grant execute on function public.record_ad_click(text, text, text) to anon, authenticated;');
  });

  it('takes the language argument the Plan names and answers one alt text', () => {
    expect(sql).toContain('public.serve_ad(p_placement_key text, p_language text default');
    expect(sql).toContain("case when p_language = 'en' then candidates.alt_en else candidates.alt_mm end");
  });

  it('drops the one-argument signature so a stale caller cannot reach the old body', () => {
    expect(sql).toContain('drop function if exists public.serve_ad(text);');
    expect(sql).toContain('drop function if exists public.serve_ad(text, text);');
  });

  it('counts a click once per session per page view', () => {
    expect(sql).toContain('on conflict (session_hash, placement_key, creative_id, kind) do nothing');
  });

  it('rolls up on Myanmar Time days and keeps 90 days of raw events', () => {
    expect(sql).toContain("at time zone 'Asia/Yangon'");
    expect(sql).toContain('p_days integer default 90');
    expect(AD_EVENT_RETENTION_DAYS).toBe(90);
  });

  it('gives the write right to exactly the roles canManageAds allows', () => {
    const writers = ROLES.filter((role) => canManageAds(role));
    expect(writers).toEqual(['Super Admin', 'Ads Admin']);
    for (const role of writers) expect(sql).toContain(`'${role}'`);
  });

  it('gives the report read to exactly the roles canReadAdReports allows', () => {
    const readers = ROLES.filter((role) => canReadAdReports(role));
    expect(readers).toEqual(['Super Admin', 'Ads Admin', 'Payment Admin']);
    expect(sql).toContain("public.current_role_name() = 'Payment Admin'");
  });
});
