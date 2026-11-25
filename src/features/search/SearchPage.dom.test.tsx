import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchPage } from './SearchPage';
import { renderAt } from '../../test/renderWithProviders';
import { translatePair } from '../../lib/translations';
import { RECENT_SEARCHES_KEY } from '../../lib/searchIndex';

/**
 * Plan §16H.10, ticket O-50. These drive the page the way a reader does, so the
 * URL state, the interpreted chips, the recent searches and the suggestion list
 * are checked as rendered rather than as a function's return value.
 */

const en = (key: Parameters<typeof translatePair>[0]) => translatePair(key).en;

function renderSearch(path = '/search') {
  window.localStorage.setItem('mh-travel-language', 'en');
  return renderAt(path, <SearchPage />);
}

describe('the search page keeps its state in the URL (§16H.10)', () => {
  it('shows the results a shared link names', async () => {
    renderSearch('/search?q=bagan');
    await waitFor(() => expect(screen.getAllByRole('link').length).toBeGreaterThan(0));
    expect(screen.getByDisplayValue('bagan')).toBeTruthy();
  });

  it('shows the city and the kind as removable chips (§16H.13 criterion 5)', async () => {
    renderSearch('/search?q=hotels%20yangon');
    const chipRow = await screen.findByLabelText(en('search_interpreted'));
    expect(within(chipRow).getByText(en('search_hotels'))).toBeTruthy();
    expect(within(chipRow).getByText(en('search_yangon'))).toBeTruthy();
  });

  it('reproduces the same results on a reload of the same URL (§16H.13 criterion 12)', async () => {
    const first = renderSearch('/search?q=bagan&sort=rating');
    await waitFor(() => expect(screen.getAllByRole('link').length).toBeGreaterThan(0));
    const before = screen.getAllByRole('link').map((node) => node.getAttribute('href'));
    first.unmount();

    renderSearch('/search?q=bagan&sort=rating');
    await waitFor(() => expect(screen.getAllByRole('link').length).toBeGreaterThan(0));
    expect(screen.getAllByRole('link').map((node) => node.getAttribute('href'))).toEqual(before);
  });
});

describe('the query is understood before it is matched (§16H.6)', () => {
  it('returns the Bagan results for the Latin spelling (§16H.13 criterion 1)', async () => {
    renderSearch('/search?q=bagan');
    await waitFor(() => expect(screen.getAllByRole('link').length).toBeGreaterThan(0));
    const hrefs = screen.getAllByRole('link').map((node) => node.getAttribute('href'));
    expect(hrefs.some((href) => href?.includes('bagan'))).toBe(true);
  });

  it('offers the city cards for a category-only query, not a long list', async () => {
    renderSearch('/search?q=hotels');
    const cards = await screen.findAllByRole('button', { name: /·/ });
    expect(cards.length).toBeGreaterThan(0);
  });

  it('drills into the city the reader picks from a category card (§16H.6)', async () => {
    // The query still says `hotels`, so the drill-down used to come back as a
    // category-only page: the reader clicked Yangon and the cards did not move.
    const user = userEvent.setup();
    renderSearch('/search?q=hotels');

    const cards = await screen.findAllByRole('button', { name: /·/ });
    const yangon = cards.find((card) => card.getAttribute('aria-label')?.startsWith(en('search_yangon')));
    expect(yangon).toBeTruthy();
    await user.click(yangon!);

    const chipRow = await screen.findByLabelText(en('search_interpreted'));
    expect(within(chipRow).getByText(en('search_yangon'))).toBeTruthy();
    await waitFor(() => expect(screen.getAllByRole('link').length).toBeGreaterThan(0));
    expect(screen.queryAllByRole('button', { name: /·/ })).toHaveLength(0);
  });
});

describe('a refusal is a sentence, not an empty page (§16H.6, §16H.7)', () => {
  it('says why a query over 80 characters was refused', async () => {
    renderSearch(`/search?q=${'a'.repeat(81)}`);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe(en('search_error_query_too_long'));
  });
});

describe('the recent searches stay on the device (§16H.10)', () => {
  it('shows what was searched, and clears it on request', async () => {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(['bagan', 'yangon']));
    const user = userEvent.setup();
    renderSearch('/search');

    const section = await screen.findByLabelText(en('search_recent'));
    expect(within(section).getByText('bagan')).toBeTruthy();

    await user.click(within(section).getByText(en('search_recent_clear')));
    await waitFor(() => expect(screen.queryByLabelText(en('search_recent'))).toBeNull());
  });

  it('records a search that was typed and committed', async () => {
    const user = userEvent.setup();
    renderSearch('/search');

    await user.type(screen.getByRole('combobox'), 'bagan');
    await waitFor(() => expect(window.localStorage.getItem(RECENT_SEARCHES_KEY)).toContain('bagan'));
  });
});

describe('suggestions follow the keyboard (§16H.10)', () => {
  it('opens after two characters and closes on Escape', async () => {
    const user = userEvent.setup();
    renderSearch('/search');

    await user.type(screen.getByRole('combobox'), 'ba');
    const list = await screen.findByRole('listbox');
    expect(within(list).getAllByRole('option').length).toBeGreaterThan(0);

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  });
});

describe('the location panel never blocks the page (§16H.9)', () => {
  it('says it is using the Yangon centre when GPS gave nothing', async () => {
    renderSearch('/search?q=bagan');
    const panel = screen.getByLabelText(en('search_location_label'));
    expect(within(panel).getByText(en('search_location_fallback'))).toBeTruthy();
  });

  it('switches to a city the reader picks', async () => {
    const user = userEvent.setup();
    renderSearch('/search?q=bagan');

    const panel = screen.getByLabelText(en('search_location_label'));
    const mandalay = within(panel).getByRole('button', { name: en('search_mandalay') });
    await user.click(mandalay);

    await waitFor(() => expect(mandalay.getAttribute('aria-pressed')).toBe('true'));
    expect(within(panel).getByText(en('search_location_manual'))).toBeTruthy();
  });
});
