import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { translate } from './translations';

const MIGRATIONS = join(process.cwd(), 'supabase', 'migrations');

/** Every `rental_error_*` the SQL functions raise, read from the migrations themselves. */
function serverRentalErrorCodes(): string[] {
  const codes = new Set<string>();
  for (const file of readdirSync(MIGRATIONS)) {
    if (!file.endsWith('.sql')) continue;
    const sql = readFileSync(join(MIGRATIONS, file), 'utf8');
    for (const match of sql.matchAll(/raise exception '(rental_error_[a-z_]+)'/g)) codes.add(match[1]);
  }
  return [...codes].sort();
}

/** Plan §8.12 acceptance 10: every rental error, including the server's, reads in MM and EN. */
describe('rental error messages', () => {
  const codes = serverRentalErrorCodes();

  it('finds the codes the migrations raise', () => {
    expect(codes.length).toBeGreaterThan(20);
  });

  it.each(codes)('%s has a Myanmar and an English text', (code) => {
    const mm = translate(code, 'mm');
    const en = translate(code, 'en');
    expect(mm, `missing mm text for ${code}`).toBeTruthy();
    expect(en, `missing en text for ${code}`).toBeTruthy();
    expect(mm).not.toBe(en);
  });

  it('reads a code this build does not know as missing instead of throwing', () => {
    expect(translate('rental_error_from_a_newer_server', 'en')).toBeUndefined();
  });
});
