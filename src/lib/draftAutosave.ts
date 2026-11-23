/**
 * Plan §10 §4 "Draft save": autosave writes the draft row every 30 seconds —
 * no revision and no audit row; an explicit Save adds both. The rule is here
 * rather than in the panel so the interval, the "is there anything to write"
 * test and the fingerprint comparison can be tested without a clock.
 */

export const AUTOSAVE_INTERVAL_MS = 30 * 1000;

/**
 * What the last write stored, so a tick with no edit does not write again.
 * A draft that has never been written has no fingerprint.
 */
export type AutosaveState = {
  /** Fingerprint of the form as last stored, or null before the first write. */
  written: string | null;
  /** The tick this autosave last wrote at, in epoch milliseconds. */
  lastRunAt: number | null;
};

export const EMPTY_AUTOSAVE: AutosaveState = { written: null, lastRunAt: null };

/**
 * A stable fingerprint of the editable form. Key order is fixed by the caller
 * (it passes an ordered array), so two identical forms always agree and a real
 * edit always differs. Undefined and null both mean "empty".
 */
export function formFingerprint(values: readonly unknown[]): string {
  return JSON.stringify(values.map((value) => (value === undefined ? null : value)));
}

/**
 * Whether this tick should write. False when the form matches what was last
 * stored (nothing changed), and false when the interval has not elapsed since
 * the previous run — a 5-second timer therefore still writes at most every 30
 * seconds, and a tab that was asleep writes once on wake rather than a burst.
 */
export function shouldAutosave(state: AutosaveState, fingerprint: string, now: number): boolean {
  if (state.written === fingerprint) return false;
  if (state.lastRunAt !== null && now - state.lastRunAt < AUTOSAVE_INTERVAL_MS) return false;
  return true;
}

/** The state after a successful write. */
export function afterAutosave(fingerprint: string, now: number): AutosaveState {
  return { written: fingerprint, lastRunAt: now };
}

/**
 * A draft row only exists once something has been typed into it. An empty
 * editor must not create a nameless row that the table then shows.
 */
export function isWritableDraft(fingerprintOfEmpty: string, fingerprint: string): boolean {
  return fingerprint !== fingerprintOfEmpty;
}
