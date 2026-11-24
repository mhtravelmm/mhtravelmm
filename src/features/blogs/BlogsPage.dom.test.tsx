import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlogsPage } from './BlogsPage';
import { renderAt } from '../../test/renderWithProviders';
import { translatePair } from '../../lib/translations';
import { BLOG_POSTS } from '../../data/blogsData';
import { ADDITIONAL_BLOG_POSTS } from '../../data/additionalBlogPosts';

/**
 * The filter row was only ever checked by hand. These tests drive it the way a
 * reader does, so a filter that stops narrowing the list fails here instead of
 * in review.
 */
const SEEDED = [...BLOG_POSTS, ...ADDITIONAL_BLOG_POSTS];

function renderBlogs() {
  window.localStorage.setItem('mh-travel-language', 'en');
  return renderAt('/blogs', <BlogsPage />);
}

// A card exposes the same story twice (cover and CTA), so count distinct labels.
function storyCount(): number {
  const labels = screen
    .getAllByRole('button', { name: new RegExp(translatePair('blog_read_story').en) })
    .map((node) => node.getAttribute('aria-label'));
  return new Set(labels).size;
}

describe('Blogs category filter', () => {
  it('shows stories on the unfiltered page', () => {
    renderBlogs();

    expect(storyCount()).toBeGreaterThan(0);
  });

  it('marks All as pressed and narrows the list to one category when a chip is chosen', async () => {
    const user = userEvent.setup();
    renderBlogs();

    const allChip = screen.getByRole('button', { name: translatePair('blog_category_all').en });
    expect(allChip.getAttribute('aria-pressed')).toBe('true');

    const foodChip = screen.getByRole('button', { name: translatePair('blog_category_food').en });
    await user.click(foodChip);

    expect(foodChip.getAttribute('aria-pressed')).toBe('true');
    expect(allChip.getAttribute('aria-pressed')).toBe('false');

    const foodPosts = SEEDED.filter((post) => post.category === 'food');
    expect(foodPosts.length).toBeGreaterThan(0);
    // The first page holds the whole batch; a category with fewer posts than
    // the page size must show exactly its own stories.
    expect(storyCount()).toBe(foodPosts.length);
  });

  it('restores every story when All is chosen again', async () => {
    const user = userEvent.setup();
    renderBlogs();

    await user.click(screen.getByRole('button', { name: translatePair('blog_category_health').en }));
    const filtered = storyCount();

    await user.click(screen.getByRole('button', { name: translatePair('blog_category_all').en }));

    expect(storyCount()).toBeGreaterThan(filtered);
  });
});
