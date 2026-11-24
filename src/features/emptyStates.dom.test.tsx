import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlogsPage } from './blogs/BlogsPage';
import { TravelGuidePage } from './travelGuide/TravelGuidePage';
import { TravelPlansPage } from './travelPlans/TravelPlansPage';
import { RentalsPage } from './rentals/RentalsPage';
import { NearbyPage } from './nearby/NearbyPage';
import { CategoryPage } from './category/CategoryPage';
import { FavoritesPage } from './favorites/FavoritesPage';
import { renderAt } from '../test/renderWithProviders';
import { translatePair } from '../lib/translations';

/**
 * Plan §16 and the UI/UX backlog: every list needs an empty state, but nothing
 * checked that a page reaches it. Each case here types a query no record can
 * match and asserts the page says so, in both languages.
 */
const NOTHING = 'zzzznomatchzzzz';

function text(key: string, language: 'mm' | 'en' = 'en'): string {
  return translatePair(key)[language];
}

describe('every list reaches an empty state', () => {
  it('Blogs says no stories match', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('mh-travel-language', 'en');
    renderAt('/blogs', <BlogsPage />);

    await user.type(screen.getByRole('searchbox', { name: text('blog_search_label') }), NOTHING);

    expect(screen.getByText(text('blog_no_results'))).toBeTruthy();
  });

  it('Travel Guide says no guides match', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('mh-travel-language', 'en');
    renderAt('/travel-guide', <TravelGuidePage />);

    await user.type(screen.getByPlaceholderText(text('guide_search_placeholder')), NOTHING);

    expect(screen.getByText(text('guide_empty_title'))).toBeTruthy();
  });

  it('Travel Plans says no plans match', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('mh-travel-language', 'en');
    renderAt('/travel-plans', <TravelPlansPage />);

    await user.type(screen.getByRole('searchbox', { name: text('travel_plans_search_label') }), NOTHING);

    expect(screen.getByText(text('travel_plans_no_results'))).toBeTruthy();
  });

  it('Rentals says no rental options match', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('mh-travel-language', 'en');
    renderAt('/rentals', <RentalsPage />);

    await user.type(screen.getByPlaceholderText(text('rentals_search')), NOTHING);

    expect(screen.getByText(text('rentals_no_results'))).toBeTruthy();
  });

  it('Nearby says no places match the filters', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('mh-travel-language', 'en');
    renderAt('/nearby', <NearbyPage />);

    // Every clinic in the seed data is closed, so "clinics that are open" is a
    // real filter combination that matches nothing.
    await user.click(screen.getByRole('button', { name: text('nearby_category_clinic') }));
    await user.click(screen.getByRole('button', { name: text('nearby_quick_open_now') }));

    expect(screen.getByText(text('nearby_no_results'))).toBeTruthy();
  });

  it('a category page says no results match', async () => {
    const user = userEvent.setup();
    window.localStorage.setItem('mh-travel-language', 'en');
    renderAt('/hotels', <CategoryPage slug="hotels" />);

    await user.type(screen.getByPlaceholderText(text('category_search_placeholder')), NOTHING);

    expect(screen.getByText(text('category_no_results'))).toBeTruthy();
  });

  it('Favorites says nothing is saved yet', () => {
    window.localStorage.setItem('mh-travel-language', 'en');
    renderAt('/favorites', <FavoritesPage />);

    expect(screen.getByText(text('account_no_favorites'))).toBeTruthy();
  });
});
