import { describe, expect, it } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { NearbyPage } from './NearbyPage';
import { renderAt } from '../../test/renderWithProviders';
import { translatePair } from '../../lib/translations';
import { FALLBACK_LOCATION } from '../../lib/location';
import { NEARBY_KINDS, previewNearby } from '../../lib/nearbyApi';

/**
 * Plan §16H.9 and §16H.1, ticket O-51. The Nearby page holds no matching rule
 * of its own — `runNearby()` answers — so what these tests check is the page:
 * the category row, the quick filters, the List/Map toggle and the URL state
 * that makes a filtered page shareable. The rules themselves are in
 * `src/lib/nearbyApi.test.ts`.
 */

function text(key: string, language: 'mm' | 'en' = 'en'): string {
  return translatePair(key)[language];
}

/**
 * The URL is state here (§16H.9: "a result can be shared"), and `renderAt` uses
 * a memory router, so the query is read back through the router rather than
 * through `window.location`.
 */
function UrlProbe() {
  const location = useLocation();
  return <output data-testid="url">{location.search}</output>;
}

function render(path = '/nearby') {
  window.localStorage.setItem('mh-travel-language', 'en');
  return renderAt(path, <><NearbyPage /><UrlProbe /></>);
}

const url = () => screen.getByTestId('url').textContent ?? '';

const nearest = () => document.getElementById('nearby-places') as HTMLElement;

describe('the Nearby page (§16H.9)', () => {
  it('offers every category the reference lists, each with a name in both languages', () => {
    render();
    for (const key of [
      'nearby_category_hotel',
      'nearby_category_guesthouse',
      'nearby_category_restaurant',
      'nearby_category_cafe',
      'nearby_category_bar',
      'nearby_category_exchange',
      'nearby_category_hospital',
      'nearby_category_clinic',
      'nearby_category_book_shop',
      'nearby_category_gym',
      'nearby_category_attraction',
      'nearby_category_market',
      'nearby_category_rental',
    ]) {
      expect(screen.getAllByRole('button', { name: text(key) }).length, key).toBeGreaterThan(0);
      expect(translatePair(key).mm, key).not.toBe(translatePair(key).en);
    }
  });

  it('shows the nearest places with the count and the place the distances come from', () => {
    render();
    expect(within(nearest()).getByText(text('nearby_nearest_title'))).toBeTruthy();
    // No GPS in this environment, so the Yangon fallback is named rather than
    // left implicit — the reader is told which point "near" means.
    expect(screen.getByText(new RegExp(text('nearby_location_fallback')))).toBeTruthy();
  });

  it('narrows the list to one category and puts it in the URL', async () => {
    const user = userEvent.setup();
    render();

    const before = nearest().textContent ?? '';
    await user.click(screen.getAllByRole('button', { name: text('nearby_category_cafe') })[0]);

    await waitFor(() => expect(url()).toContain('kind=cafes'));
    await waitFor(() => expect(nearest().textContent).not.toBe(before));
    expect(screen.getAllByRole('button', { name: text('nearby_category_cafe') })[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('opens on the category a shared URL names', async () => {
    render('/nearby?kind=markets');

    const chip = screen.getAllByRole('button', { name: text('nearby_category_market') })[0];
    expect(chip.getAttribute('aria-pressed')).toBe('true');
    await waitFor(() => expect(nearest().textContent).toContain(text('nearby_result_count').replace('{count}', '5')));
  });

  it('switches to the map and records the view in the URL', async () => {
    const user = userEvent.setup();
    render();

    await user.click(screen.getByRole('button', { name: text('nearby_map_view') }));
    await waitFor(() => expect(url()).toContain('view=map'));
    // The map library is imported inside the effect, so the container is the
    // first thing that appears; the pins come after it resolves.
    expect(document.querySelector('.leaflet-container') ?? screen.getByText(text('nearby_map_loading'))).toBeTruthy();
  });

  it('narrows by a distance band and says how many places are left', async () => {
    const user = userEvent.setup();
    render();

    // The expected number comes from the same function the page calls, so the
    // count line cannot drift from the list it describes.
    const inside = previewNearby({
      lat: FALLBACK_LOCATION.point.lat,
      lng: FALLBACK_LOCATION.point.lng,
      radiusKm: 1,
      kinds: NEARBY_KINDS,
      limit: 50,
    }).items.filter((item) => item.distance_km <= 1).length;

    await user.click(screen.getByRole('button', { name: text('nearby_quick_within1') }));
    await waitFor(() => expect(url()).toContain('quick=within_1'));
    // The count sits in one line with the location, so it is matched inside the
    // section rather than as a whole text node.
    expect(nearest().textContent).toContain(text('nearby_result_count').replace('{count}', String(inside)));
  });

  it('clears a quick filter and returns to every place', async () => {
    const user = userEvent.setup();
    render();

    await user.click(screen.getByRole('button', { name: text('nearby_quick_top_rated') }));
    await waitFor(() => expect(url()).toContain('quick=top_rated'));

    await user.click(screen.getByRole('button', { name: text('nearby_clear_filter') }));
    await waitFor(() => expect(url()).not.toContain('quick='));
  });

  it('badges each visible card with the open state the function reported', async () => {
    render();
    await waitFor(() => expect(nearest().textContent).not.toContain(text('nearby_no_results')));

    // §16H.9 puts `open_now` and `closes_at` on every item, so the badge reads
    // the answer rather than running a second clock on the client. The page
    // draws the six nearest, so the expectation is built from those six.
    const visible = previewNearby({
      lat: FALLBACK_LOCATION.point.lat,
      lng: FALLBACK_LOCATION.point.lng,
      radiusKm: 10,
      kinds: NEARBY_KINDS,
      limit: 50,
    })
      .items.sort((a, b) => a.distance_km - b.distance_km || (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 6);

    const section = nearest().textContent ?? '';
    for (const item of visible) {
      if (item.open_now && item.closes_at) {
        expect(section).toContain(text('nearby_open_until').replace('{time}', item.closes_at));
      } else if (item.open_now) {
        expect(section).toContain(text('nearby_open_now_label'));
      } else if (item.closes_at) {
        expect(section).toContain(text('nearby_closed_label'));
      }
      // An unknown schedule carries no badge, so a card never claims a state
      // the function did not report.
    }
  });

  it('says no place matches when the filters leave nothing', async () => {
    const user = userEvent.setup();
    render();

    await user.click(screen.getAllByRole('button', { name: text('nearby_category_clinic') })[0]);
    await user.click(screen.getByRole('button', { name: text('nearby_quick_open_now') }));

    expect(screen.getByText(text('nearby_no_results'))).toBeTruthy();
  });
});
