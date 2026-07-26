import { describe, expect, it } from 'vitest';
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
