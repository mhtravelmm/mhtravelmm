import { describe, expect, it } from 'vitest';
import {
  AUTOSAVE_INTERVAL_MS,
  EMPTY_AUTOSAVE,
  afterAutosave,
  formFingerprint,
  isWritableDraft,
  shouldAutosave,
} from './draftAutosave';

const T0 = 1_700_000_000_000;

describe('the autosave interval is the 30 seconds Plan §10 §4 states', () => {
  it('is 30 000 ms', () => {
    expect(AUTOSAVE_INTERVAL_MS).toBe(30_000);
  });
});

describe('a fingerprint tells one form from another', () => {
  it('is equal for identical forms', () => {
    expect(formFingerprint(['a', 'b', ['c']])).toBe(formFingerprint(['a', 'b', ['c']]));
  });

  it('differs when a field changes', () => {
    expect(formFingerprint(['a', 'b'])).not.toBe(formFingerprint(['a', 'c']));
  });

  it('treats undefined and null as the same empty value', () => {
    expect(formFingerprint([undefined])).toBe(formFingerprint([null]));
  });
});

describe('when a tick should write', () => {
  it('writes the first time', () => {
    expect(shouldAutosave(EMPTY_AUTOSAVE, 'form-1', T0)).toBe(true);
  });

  it('does not write when nothing changed', () => {
    const state = afterAutosave('form-1', T0);
    expect(shouldAutosave(state, 'form-1', T0 + AUTOSAVE_INTERVAL_MS * 2)).toBe(false);
  });

  it('does not write before the interval has elapsed', () => {
    const state = afterAutosave('form-1', T0);
    expect(shouldAutosave(state, 'form-2', T0 + 1000)).toBe(false);
    expect(shouldAutosave(state, 'form-2', T0 + AUTOSAVE_INTERVAL_MS - 1)).toBe(false);
  });

  it('writes once the interval has elapsed', () => {
    const state = afterAutosave('form-1', T0);
    expect(shouldAutosave(state, 'form-2', T0 + AUTOSAVE_INTERVAL_MS)).toBe(true);
  });

  it('writes a long-sleeping tab once, not repeatedly, on wake', () => {
    const state = afterAutosave('form-1', T0);
    const wake = T0 + AUTOSAVE_INTERVAL_MS * 100;
    expect(shouldAutosave(state, 'form-2', wake)).toBe(true);
    expect(shouldAutosave(afterAutosave('form-2', wake), 'form-2', wake)).toBe(false);
  });
});

describe('after a write', () => {
  it('remembers the form and the time', () => {
    expect(afterAutosave('form-1', T0)).toEqual({ written: 'form-1', lastRunAt: T0 });
  });
});

describe('an empty editor writes nothing', () => {
  const empty = formFingerprint(['', '', [], []]);

  it('refuses the untouched form', () => {
    expect(isWritableDraft(empty, empty)).toBe(false);
  });

  it('accepts a form with a field filled in', () => {
    expect(isWritableDraft(empty, formFingerprint(['A title', '', [], []]))).toBe(true);
  });
});
