import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { Route, Routes } from 'react-router-dom';
import { PlaceDetailPage } from './PlaceDetailPage';
import { RestaurantPage } from '../restaurants/RestaurantPage';
import { BookShopPage } from '../bookShops/BookShopPage';
import { renderAt } from '../../test/renderWithProviders';
import { translatePair } from '../../lib/translations';

/**
 * The not-found state was only ever guarded by a unit test on the resolver, so
 * a page could still render a record under a URL naming a different one. These
 * tests render the real pages and read the DOM.
 */
function renderDetailRoute(path: string, element: ReactElement) {
  return renderAt(
    path,
    <Routes>
      <Route path="/:id" element={element} />
    </Routes>,
  );
}

const { mm: NOT_FOUND_MM, en: NOT_FOUND_EN } = translatePair('record_not_found');

describe('detail page not-found state', () => {
  it('renders the not-found text for a place id no catalog holds', () => {
    renderDetailRoute('/pp1', <PlaceDetailPage kind="hotels" />);

    expect(screen.getByText(NOT_FOUND_MM)).toBeTruthy();
  });

  it('renders the record when the hotel id exists', () => {
    renderDetailRoute('/ph1', <PlaceDetailPage kind="hotels" />);

    expect(screen.queryByText(NOT_FOUND_MM)).toBeNull();
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);
  });

  it('renders not-found in English when the reader chose English', () => {
    window.localStorage.setItem('mh-travel-language', 'en');
    renderDetailRoute('/pp1', <PlaceDetailPage kind="hotels" />);

    expect(screen.getByText(NOT_FOUND_EN)).toBeTruthy();
  });

  it('renders not-found for an unknown restaurant instead of the first record', () => {
    renderDetailRoute('/nope', <RestaurantPage />);

    expect(screen.getByText(NOT_FOUND_MM)).toBeTruthy();
  });

  it('renders not-found for an unknown book shop instead of the first record', () => {
    renderDetailRoute('/nope', <BookShopPage />);

    expect(screen.getByText(NOT_FOUND_MM)).toBeTruthy();
  });
});
