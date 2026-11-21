import { describe, expect, it, vi } from 'vitest';

vi.mock('../../db.js', () => ({ query: vi.fn() }));
vi.mock('../../middleware/auth.js', () => ({
  authenticateToken: (_req, _res, next) => next(),
  requireAdmin: (_req, _res, next) => next(),
}));
vi.mock('../../utils/logger.js', () => ({ default: { error: vi.fn() } }));

import { categorySchema } from '../categories.js';

describe('categorySchema display_order', () => {
  it('allows display_order to be omitted or blank', () => {
    expect(categorySchema.parse({ name: 'Notebooks' }).display_order).toBeUndefined();
    expect(categorySchema.parse({ name: 'Notebooks', display_order: '' }).display_order).toBeUndefined();
  });

  it('accepts zero and numeric strings', () => {
    expect(categorySchema.parse({ name: 'Notebooks', display_order: 0 }).display_order).toBe(0);
    expect(categorySchema.parse({ name: 'Notebooks', display_order: '3' }).display_order).toBe(3);
  });

  it('rejects invalid and negative display orders', () => {
    expect(() => categorySchema.parse({ name: 'Notebooks', display_order: 'invalid' })).toThrow();
    expect(() => categorySchema.parse({ name: 'Notebooks', display_order: -1 })).toThrow();
  });
});
