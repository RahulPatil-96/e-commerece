import { describe, expect, it, vi } from 'vitest';

// Mock DB and auth so payments.js can be imported without DATABASE_URL
vi.mock('../../db.js', () => ({
  query: vi.fn(),
  pool: { on: vi.fn() },
}));

vi.mock('../middleware/auth.js', () => ({
  authenticateToken: vi.fn((_req, _res, next) => next()),
  requireAuth: vi.fn((_req, _res, next) => next()),
}));

vi.mock('../../utils/logger.js', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { buildRazorpayOrderPayload } from '../payments.js';

describe('buildRazorpayOrderPayload', () => {
  it('converts the amount to paise and preserves metadata in notes', () => {
    const payload = buildRazorpayOrderPayload({
      amount: 250.5,
      currency: 'inr',
      order_id: 'order_123',
      metadata: { plan: 'premium' },
    });

    expect(payload).toEqual({
      amount: 25050,
      currency: 'inr',
      receipt: 'order_123',
      notes: {
        order_id: 'order_123',
        plan: 'premium',
      },
    });
  });
});
