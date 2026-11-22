import { describe, expect, it } from 'vitest';
import {
  actionForSave,
  appendAudit,
  auditFor,
  actionLabelKey,
  MAX_REVISIONS_PER_ITEM,
  recordRevision,
  revisionsFor,
  type AuditEntry,
  type Revision,
} from './contentWorkflow';

function revision(id: string, contentId: string): Revision<string> {
  return { id, contentId, savedAt: '2026-11-22T09:00:00.000Z', status: 'Draft', snapshot: id };
}

function audit(id: string, contentId: string): AuditEntry {
  return { id, contentId, action: 'saved', at: '2026-11-22T09:00:00.000Z', actor: 'Thazin Win' };
}

describe('actionForSave', () => {
  it('marks a first save as created', () => {
    expect(actionForSave('Draft', true)).toBe('created');
  });

  it('reads the status of a later save', () => {
    expect(actionForSave('Published', false)).toBe('published');
    expect(actionForSave('Scheduled', false)).toBe('scheduled');
    expect(actionForSave('Draft', false)).toBe('saved');
  });
});

describe('recordRevision', () => {
  it('keeps the newest revision first for each item', () => {
    const first = recordRevision([], revision('a1', 'a'));
    const second = recordRevision(first, revision('a2', 'a'));
    expect(revisionsFor(second, 'a').map((item) => item.id)).toEqual(['a2', 'a1']);
  });

  it('leaves other items untouched', () => {
    const stored = recordRevision([revision('b1', 'b')], revision('a1', 'a'));
    expect(revisionsFor(stored, 'b').map((item) => item.id)).toEqual(['b1']);
  });

  it('drops revisions beyond the per-item limit', () => {
    let stored: Revision<string>[] = [];
    for (let index = 0; index <= MAX_REVISIONS_PER_ITEM; index += 1) {
      stored = recordRevision(stored, revision(`a${index}`, 'a'));
    }
    expect(revisionsFor(stored, 'a')).toHaveLength(MAX_REVISIONS_PER_ITEM);
    expect(revisionsFor(stored, 'a')[0].id).toBe(`a${MAX_REVISIONS_PER_ITEM}`);
  });
});

describe('audit log', () => {
  it('puts the newest entry first', () => {
    const log = appendAudit(appendAudit([], audit('1', 'a')), audit('2', 'a'));
    expect(auditFor(log, 'a').map((entry) => entry.id)).toEqual(['2', '1']);
  });

  it('filters by content item', () => {
    const log = appendAudit(appendAudit([], audit('1', 'a')), audit('2', 'b'));
    expect(auditFor(log, 'b').map((entry) => entry.id)).toEqual(['2']);
  });
});

describe('actionLabelKey', () => {
  it('describes each action in plain words', () => {
    expect(actionLabelKey('created')).toBe('cw_action_created');
    expect(actionLabelKey('restored')).toBe('cw_action_restored');
    expect(actionLabelKey('saved')).toBe('cw_action_saved');
  });
});
