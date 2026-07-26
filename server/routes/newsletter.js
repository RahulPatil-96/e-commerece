import express from 'express';
import { z } from 'zod';
import { query, isDbConnected, getMemoryStore } from '../db.js';

import logger from '../utils/logger.js';

const router = express.Router();
const newsletterSchema = z.object({ email: z.string().email() });

router.post('/', async (req, res) => {
  try {
    const { email } = newsletterSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    if (isDbConnected()) {
      await query(
        'INSERT INTO newsletter_subscriptions (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
        [normalizedEmail]
      );
    } else {
      const memory = getMemoryStore();
      if (!memory.newsletter_subscriptions.find((item) => item.email === normalizedEmail)) {
        memory.newsletter_subscriptions.push({
          id: memory.newsletter_subscriptions.length + 1,
          email: normalizedEmail,
          created_at: new Date().toISOString(),
        });
      }
    }

    return res.json({ success: true, message: 'Subscribed to newsletter successfully.' });
  } catch (error) {
logger.error('Newsletter subscription error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to subscribe to newsletter' });
  }
});

export default router;
