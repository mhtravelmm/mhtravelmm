import { describe, expect, it } from 'vitest';
import {
  TEMPLATE_EVENT_CAP,
  TEMPLATE_EVENT_RETENTION_DAYS,
  appendTemplateEvent,
  purgeTemplateEvents,
  rollUpTemplateStats,
  templateApplyRate,
  templateEventKey,
  templateViewShare,
  type TemplateEvent,
} from './templateStats';

function event(overrides: Partial<TemplateEvent> = {}): TemplateEvent {
  return {
    id: 'te-1',
    templateId: 'hotel_editorial',
    shopId: 'rangoon_house',
    kind: 'view',
    at: '2026-11-24T03:00:00.000Z',
    sessionHash: 'sess-1',
    ...overrides,
  };
}

describe('the §4 template counting rules', () => {
  it('counts one view per template per page view', () => {
    const once = appendTemplateEvent([], event());
    const again = appendTemplateEvent(once, event({ id: 'te-2' }));
    expect(once).toHaveLength(1);
    expect(again).toHaveLength(1);
  });

  it('counts a new page view again, so a reload is a second view', () => {
    const rows = appendTemplateEvent(appendTemplateEvent([], event()), event({ id: 'te-2', sessionHash: 'sess-2' }));
    expect(rows).toHaveLength(2);
  });

  it('counts a view and an apply of the same template separately', () => {
    const rows = appendTemplateEvent(appendTemplateEvent([], event()), event({ id: 'te-2', kind: 'apply' }));
    expect(rows.map((row) => row.kind).sort()).toEqual(['apply', 'view']);
  });

  it('keys by session, template and kind, so a language switch is not a second view', () => {
    expect(templateEventKey(event())).toBe('sess-1:hotel_editorial:view');
    const rows = appendTemplateEvent(appendTemplateEvent([], event()), event({ id: 'te-2', language: 'mm' }));
    expect(rows).toHaveLength(1);
  });

  it('keeps the newest rows only, so the stand-in cannot grow without bound', () => {
    let rows: TemplateEvent[] = [];
    for (let index = 0; index < TEMPLATE_EVENT_CAP + 25; index += 1) {
      rows = appendTemplateEvent(rows, event({ id: `te-${index}`, sessionHash: `sess-${index}` }));
    }
    expect(rows).toHaveLength(TEMPLATE_EVENT_CAP);
    expect(rows[0].sessionHash).toBe(`sess-${TEMPLATE_EVENT_CAP + 24}`);
  });
});

describe('the §4 per-template roll-up', () => {
  it('totals views and applies per template', () => {
    const rows = rollUpTemplateStats([
      event({ id: 'a', sessionHash: 's1' }),
      event({ id: 'b', sessionHash: 's2' }),
      event({ id: 'c', sessionHash: 's3', kind: 'apply' }),
      event({ id: 'd', sessionHash: 's4', templateId: 'hotel_compact' }),
    ]);
    const editorial = rows.find((row) => row.templateId === 'hotel_editorial');
    expect(editorial).toMatchObject({ views: 2, applies: 1, applyRate: 50 });
    expect(rows.find((row) => row.templateId === 'hotel_compact')).toMatchObject({ views: 1, applies: 0 });
  });

  it('orders by views, then by id so the table never reshuffles on a tie', () => {
    const rows = rollUpTemplateStats([
      event({ id: 'a', sessionHash: 's1', templateId: 'hotel_compact' }),
      event({ id: 'b', sessionHash: 's2', templateId: 'hotel_editorial' }),
      event({ id: 'c', sessionHash: 's3', templateId: 'hotel_editorial' }),
    ]);
    expect(rows.map((row) => row.templateId)).toEqual(['hotel_editorial', 'hotel_compact']);
  });

  it('records the last time a template was seen', () => {
    const rows = rollUpTemplateStats([
      event({ id: 'a', sessionHash: 's1', at: '2026-11-20T00:00:00.000Z' }),
      event({ id: 'b', sessionHash: 's2', at: '2026-11-24T00:00:00.000Z' }),
    ]);
    expect(rows[0].lastAt).toBe('2026-11-24T00:00:00.000Z');
  });

  it('answers zero rather than a division by zero when nothing was viewed', () => {
    expect(templateApplyRate(0, 3)).toBe(0);
    expect(templateApplyRate(3, 1)).toBe(33.3);
  });

  it('gives each template its share of all views', () => {
    const rows = rollUpTemplateStats([
      event({ id: 'a', sessionHash: 's1' }),
      event({ id: 'b', sessionHash: 's2' }),
      event({ id: 'c', sessionHash: 's3', templateId: 'hotel_compact' }),
    ]);
    expect(templateViewShare(rows[0], rows)).toBe(66.7);
    expect(templateViewShare(rows[1], rows)).toBe(33.3);
    expect(templateViewShare(rows[0], [])).toBe(0);
  });

  it('answers an empty roll-up for no events', () => {
    expect(rollUpTemplateStats([])).toEqual([]);
  });
});

describe('the §4 event purge', () => {
  it(`keeps ${TEMPLATE_EVENT_RETENTION_DAYS} days and drops what is older`, () => {
    const now = new Date('2026-11-24T00:00:00.000Z');
    const { kept, purged } = purgeTemplateEvents(
      [
        event({ id: 'old', at: '2026-05-01T00:00:00.000Z' }),
        event({ id: 'new', at: '2026-11-20T00:00:00.000Z' }),
      ],
      now,
    );
    expect(purged).toBe(1);
    expect(kept.map((row) => row.id)).toEqual(['new']);
  });
});
