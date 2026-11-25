import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ConfirmDialog,
  CsvExportButton,
  NotAllowedState,
  VersionConflictNotice,
} from './superAdmin/shared/DashboardPieces';
import { renderAt } from '../test/renderWithProviders';
import { translatePair } from '../lib/translations';

/**
 * Plan §3A.2 rule 7 and §3A.14, ticket O-71, rendered through the real provider
 * stack. `dashboardPieces.test.ts` proves the rules; this file proves the
 * components apply them: the dialog refuses a save without a reason, the heavy
 * action needs the name, the export writes the rows it was given, and the
 * conflict notice offers only Reload.
 */

function text(key: string, language: 'mm' | 'en' = 'en'): string {
  return translatePair(key)[language];
}

beforeEach(() => {
  window.localStorage.setItem('mh-travel-language', 'en');
});

describe('ConfirmDialog', () => {
  it('refuses an empty reason and says why', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderAt('/', <ConfirmDialog open action="suspend_user" objectName="Daw Hla Hla" onCancel={() => {}} onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: text('confirm_submit') }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe(text('confirm_problem_reason_missing'));
  });

  it('refuses a one-word reason', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderAt('/', <ConfirmDialog open action="suspend_user" objectName="Daw Hla Hla" onCancel={() => {}} onConfirm={onConfirm} />);

    await user.type(screen.getByRole('textbox'), 'spam');
    await user.click(screen.getByRole('button', { name: text('confirm_submit') }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe(text('confirm_problem_reason_too_short'));
  });

  it('sends the trimmed reason once it is valid', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderAt('/', <ConfirmDialog open action="suspend_user" objectName="Daw Hla Hla" onCancel={() => {}} onConfirm={onConfirm} />);

    await user.type(screen.getByRole('textbox'), '  Spam in reviews  ');
    await user.click(screen.getByRole('button', { name: text('confirm_submit') }));
    expect(onConfirm).toHaveBeenCalledWith('Spam in reviews');
  });

  it('asks a heavy action to type the name and refuses a near match', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderAt('/', <ConfirmDialog open action="remove_admin" objectName="U Aung Myint" onCancel={() => {}} onConfirm={onConfirm} />);

    const boxes = screen.getAllByRole('textbox');
    expect(boxes).toHaveLength(2);
    await user.type(boxes[0], 'Left the company');
    await user.type(boxes[1], 'U Aung');
    await user.click(screen.getByRole('button', { name: text('confirm_submit') }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe(text('confirm_problem_name_mismatch'));

    await user.clear(boxes[1]);
    await user.type(boxes[1], 'u aung myint');
    await user.click(screen.getByRole('button', { name: text('confirm_submit') }));
    expect(onConfirm).toHaveBeenCalledWith('Left the company');
  });

  it('does not ask a light action for a name', () => {
    renderAt('/', <ConfirmDialog open action="cancel_order" objectName="REQ-1" onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('renders nothing while closed', () => {
    renderAt('/', <ConfirmDialog open={false} action="delete" objectName="x" onCancel={() => {}} onConfirm={() => {}} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('CsvExportButton', () => {
  it('writes the rows it is given, with the byte-order mark and the section name', async () => {
    const user = userEvent.setup();
    const blobs: Blob[] = [];
    const names: string[] = [];
    const createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob);
      return 'blob:test';
    });
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download);
    });
    const onExported = vi.fn();

    renderAt(
      '/',
      <CsvExportButton
        section="users"
        columns={[
          { header: 'name', value: (row: { name: string; city?: string }) => row.name },
          { header: 'city', value: (row: { name: string; city?: string }) => row.city },
        ]}
        rows={[{ name: 'ဆီဆုံ' }, { name: 'Lotte, Yangon' }]}
        onExported={onExported}
      />,
    );

    await user.click(screen.getByRole('button', { name: text('common_export_csv') }));
    expect(blobs).toHaveLength(1);
    expect(names[0]).toMatch(/^mh-travel-users-\d{4}-\d{2}-\d{2}\.csv$/);
    // `blob.text()` decodes UTF-8 and drops the BOM, so the bytes are checked.
    const bytes = new Uint8Array(await blobs[0].arrayBuffer());
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const body = await blobs[0].text();
    expect(body).toContain('ဆီဆုံ');
    expect(body).toContain('"Lotte, Yangon"');
    expect(onExported).toHaveBeenCalledWith(2, names[0]);
    click.mockRestore();
  });
});

describe('NotAllowedState', () => {
  it('explains the refusal in both languages', () => {
    renderAt('/', <NotAllowedState />);
    expect(screen.getByText(text('common_not_allowed_title'))).toBeTruthy();
    expect(screen.getByText(text('common_not_allowed_detail'))).toBeTruthy();
  });
});

describe('VersionConflictNotice', () => {
  it('offers Reload and nothing else, so a stale save is not retried', async () => {
    const user = userEvent.setup();
    const onReload = vi.fn();
    renderAt('/', <VersionConflictNotice onReload={onReload} />);
    expect(screen.getByRole('alert').textContent).toContain(text('common_error_version_conflict'));
    expect(screen.getAllByRole('button')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: text('common_reload') }));
    expect(onReload).toHaveBeenCalled();
  });
});
