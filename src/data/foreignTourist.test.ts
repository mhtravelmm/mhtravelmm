import { describe, expect, it } from 'vitest';
import {
  EMERGENCY_CONTACTS,
  ETIQUETTE_TIPS,
  MONEY_TIPS,
  SIM_PROVIDERS,
  SIM_STEPS,
  TOURIST_SECTION_IDS,
  localized,
  type Bilingual,
} from './foreignTourist';
import { isKnownHref } from '../routes';

function isFilled(value: Bilingual): boolean {
  return value.mm.trim().length > 0 && value.en.trim().length > 0;
}

describe('foreign tourist content', () => {
  it('writes every field in both languages', () => {
    const missing: string[] = [];
    const check = (id: string, ...values: Bilingual[]) => {
      values.forEach((value, index) => {
        if (!isFilled(value)) missing.push(`${id}#${index}`);
      });
    };
    EMERGENCY_CONTACTS.forEach((contact) => check(contact.id, contact.label, contact.detail));
    SIM_PROVIDERS.forEach((provider) => check(provider.id, provider.data));
    SIM_STEPS.forEach((step) => check(step.id, step.body));
    ETIQUETTE_TIPS.forEach((tip) => check(tip.id, tip.title, tip.body));
    MONEY_TIPS.forEach((tip) => check(tip.id, tip.title, tip.body));
    expect(missing).toEqual([]);
  });

  it('keeps the emergency numbers dialable', () => {
    EMERGENCY_CONTACTS.forEach((contact) => {
      // Only digits, spaces, and a leading + survive into a tel: link.
      expect(contact.phone).toMatch(/^\+?[\d ]+$/);
      expect(contact.phone.replace(/[^\d]/g, '').length).toBeGreaterThanOrEqual(3);
    });
  });

  it('includes the three national emergency lines', () => {
    const phones = EMERGENCY_CONTACTS.map((contact) => contact.phone);
    expect(phones).toEqual(expect.arrayContaining(['199', '192', '191']));
  });

  it('gives every section a unique anchor id', () => {
    const ids = TOURIST_SECTION_IDS;
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('picks the requested language and never falls back silently', () => {
    const value = { mm: 'မြန်မာ', en: 'English' };
    expect(localized(value, 'mm')).toBe('မြန်မာ');
    expect(localized(value, 'en')).toBe('English');
  });

  it('links the page from a declared route', () => {
    expect(isKnownHref('/foreign-tourist')).toBe(true);
  });
});
