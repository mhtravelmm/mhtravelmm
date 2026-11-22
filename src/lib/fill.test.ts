import { describe, expect, it } from 'vitest';
import { fill } from './fill';

describe('fill', () => {
  it('replaces every named placeholder', () => {
    expect(fill('{author}: ${payable} payable · {count} rows', { author: 'Su Mon', payable: '12.00', count: 3 }))
      .toBe('Su Mon: $12.00 payable · 3 rows');
  });

  it('leaves an unknown placeholder untouched', () => {
    expect(fill('Move block {count} up', {})).toBe('Move block {count} up');
  });

  it('returns text without placeholders unchanged', () => {
    expect(fill('Ready to publish.', { count: 1 })).toBe('Ready to publish.');
  });
});
