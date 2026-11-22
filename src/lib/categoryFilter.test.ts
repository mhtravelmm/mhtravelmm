import { describe, expect, it } from 'vitest';
import { categoryOptions, filterByCategory } from './categoryFilter';
import { mapSearchUrl, telHref } from './placeActions';

const dishes = [
  { name: 'Mohinga', category: 'Noodles' },
  { name: 'Shan Noodle', category: 'Noodles' },
  { name: 'Fried Fish', category: 'Seafood' },
];

describe('categoryOptions', () => {
  it('lists the all-option first, then each category once in data order', () => {
    expect(categoryOptions(dishes, 'All dishes')).toEqual(['All dishes', 'Noodles', 'Seafood']);
  });

  it('returns only the all-option for an empty list', () => {
    expect(categoryOptions([], 'All')).toEqual(['All']);
  });
});

describe('filterByCategory', () => {
  it('keeps everything when the all-option is selected', () => {
    expect(filterByCategory(dishes, 'All dishes', 'All dishes')).toHaveLength(3);
  });

  it('keeps only the matching category', () => {
    expect(filterByCategory(dishes, 'Noodles', 'All dishes').map((d) => d.name)).toEqual([
      'Mohinga',
      'Shan Noodle',
    ]);
  });

  it('returns nothing for a category with no records', () => {
    expect(filterByCategory(dishes, 'BBQ', 'All dishes')).toEqual([]);
  });
});

describe('place actions', () => {
  it('encodes the place name into a map search URL', () => {
    expect(mapSearchUrl('Sedona Hotel, Yangon')).toBe(
      'https://www.google.com/maps/search/?api=1&query=Sedona%20Hotel%2C%20Yangon',
    );
  });

  it('strips spacing and punctuation from a phone number for dialing', () => {
    expect(telHref('09 777 123 456')).toBe('tel:09777123456');
    expect(telHref('+95 (9) 777-123-456')).toBe('tel:+959777123456');
  });
});
