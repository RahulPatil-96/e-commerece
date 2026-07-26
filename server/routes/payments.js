import express from 'express';
import Razorpay from 'razorpay';
import logger from '../utils/logger.js';

const router = express.Router();

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
let razorpayClient = null;

if (razorpayKeyId && razorpayKeySecret) {
  razorpayClient = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
}

export function buildRazorpayOrderPayload({ amount, currency = 'inr', order_id, metadata = {} }) {
  return {
    amount: Math.round(amount * 100),
    currency,
    receipt: order_id || undefined,
    notes: {
      order_id: order_id || '',
      ...metadata,
    },
  };
}

// POST /api/payments/create-payment-intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    if (!razorpayClient) {
      return res.status(503).json({ message: 'Payment service is not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' });
    }

    const { amount, currency = 'inr', order_id, metadata = {} } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const orderPayload = buildRazorpayOrderPayload({ amount, currency, order_id, metadata });
    const order = await razorpayClient.orders.create(orderPayload);

    logger.info('Razorpay order created:', { id: order.id, amount, currency });

    return res.json({
      clientSecret: '',
      paymentIntentId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      orderId: order.id,
      keyId: razorpayKeyId,
    });
  } catch (error) {
    logger.error('Create Razorpay order error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message || 'Failed to create payment order' });
  }
});

// POST /api/payments/webhook
router.post('/webhook', express.json({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      logger.warn('Razorpay webhook secret not configured, skipping webhook verification');
      return res.json({ received: true });
    }

    const signature = req.get('x-razorpay-signature');
    const body = JSON.stringify(req.body);

    const crypto = await import('crypto');
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');

    if (expectedSignature !== signature) {
      logger.error('Webhook signature verification failed');
      return res.status(400).json({ message: 'Webhook signature verification failed' });
    }

    const event = req.body.event;
    if (event === 'payment.authorized') {
      logger.info('Payment authorized:', { id: req.body.payload?.payment?.entity?.id });
    } else if (event === 'payment.failed') {
      logger.warn('Payment failed:', { id: req.body.payload?.payment?.entity?.id });
    }

    return res.json({ received: true });
  } catch (error) {
    logger.error('Webhook handler error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Webhook handler error' });
  }
});

// GET /api/payments/config
router.get('/config', (req, res) => {
  res.json({
    publishableKey: razorpayKeyId || '',
    isConfigured: !!razorpayClient,
  });
});

export default router;

