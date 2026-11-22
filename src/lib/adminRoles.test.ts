import { describe, expect, it } from 'vitest';
import { ADMIN_ROLES, DEFAULT_PERMISSION_GROUP, PERMISSION_GROUPS } from './adminRoles';

describe('admin roles', () => {
  it('matches the eight product roles in Plan §3', () => {
    expect([...ADMIN_ROLES]).toEqual([
      'Super Admin',
      'Ads Admin',
      'Admin',
      'Rental Admin',
      'Payment Admin',
      'Travel Guide Content Admin',
      'Blog Post Admin',
      'Owner Admin',
    ]);
  });

  it('gives every role a permission group the form can offer', () => {
    for (const role of ADMIN_ROLES) {
      expect(PERMISSION_GROUPS).toContain(DEFAULT_PERMISSION_GROUP[role]);
    }
  });

  it('keeps ad management exclusive to Super Admin and Ads Admin', () => {
    const adRoles = ADMIN_ROLES.filter((role) => DEFAULT_PERMISSION_GROUP[role] === 'Ads Management');
    expect(adRoles).toEqual(['Ads Admin']);
  });

  it('splits content by type, one role per content kind', () => {
    expect(DEFAULT_PERMISSION_GROUP['Blog Post Admin']).toBe('Content, Blogs');
    expect(DEFAULT_PERMISSION_GROUP['Travel Guide Content Admin']).toBe('Content, Travel Guide');
  });
});
