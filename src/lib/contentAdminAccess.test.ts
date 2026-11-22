import { describe, expect, it } from 'vitest';
import { canManageAds, canManageBlogs, canManageGuides, isContentRole } from './contentAdminAccess';

describe('content admin access', () => {
  it('lets a Blog Post Admin open the Blog editor only', () => {
    expect(canManageBlogs('Blog Post Admin')).toBe(true);
    expect(canManageGuides('Blog Post Admin')).toBe(false);
    expect(canManageAds('Blog Post Admin')).toBe(false);
  });

  it('lets a Travel Guide Content Admin open the Guide editor only', () => {
    expect(canManageGuides('Travel Guide Content Admin')).toBe(true);
    expect(canManageBlogs('Travel Guide Content Admin')).toBe(false);
    expect(canManageAds('Travel Guide Content Admin')).toBe(false);
  });

  it('keeps ads with Super Admin and Ads Admin', () => {
    expect(canManageAds('Super Admin')).toBe(true);
    expect(canManageAds('Ads Admin')).toBe(true);
    expect(canManageAds('Admin')).toBe(false);
  });

  it('lets Super Admin open both editors', () => {
    expect(canManageBlogs('Super Admin')).toBe(true);
    expect(canManageGuides('Super Admin')).toBe(true);
  });

  it('treats only the two content roles as content roles', () => {
    expect(isContentRole('Blog Post Admin')).toBe(true);
    expect(isContentRole('Travel Guide Content Admin')).toBe(true);
    expect(isContentRole('Rental Admin')).toBe(false);
    expect(isContentRole(undefined)).toBe(false);
  });
});
