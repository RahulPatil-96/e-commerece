import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../db.js', () => ({
  query: vi.fn(),
}));

import { query } from '../../db.js';
import { seedDatabase } from '../../seed.js';

describe('database seed synchronization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(query).mockResolvedValue({ rows: [] });
  });

  it('updates seeded product details without resetting inventory or ratings', async () => {
    await seedDatabase();

    const productInsert = vi.mocked(query).mock.calls.find(([sql]) =>
      String(sql).includes('INSERT INTO products')
    );

    expect(productInsert).toBeDefined();
    const sql = String(productInsert[0]);
    expect(sql).toContain('ON CONFLICT (slug) DO UPDATE');
    expect(sql).not.toMatch(/stock\s*=\s*EXCLUDED\.stock/i);
    expect(sql).not.toMatch(/rating\s*=\s*EXCLUDED\.rating/i);
  });
});
