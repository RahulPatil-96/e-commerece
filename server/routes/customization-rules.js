import express from 'express';
import { z } from 'zod';
import { query, isDbConnected, getMemoryStore } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { DEFAULT_CUSTOMIZATION_RULES } from '../seed.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Public GET — anyone can read customization rules
router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      const result = await query('SELECT config FROM customization_rules WHERE id = 1');
      if (result.rows.length > 0) {
        return res.json(result.rows[0].config);
      }
      // Return defaults if not seeded
      return res.json(DEFAULT_CUSTOMIZATION_RULES);
    }

    const memory = getMemoryStore();
    return res.json(memory.customizationRules || DEFAULT_CUSTOMIZATION_RULES);
  } catch (error) {
    logger.error('Fetch customization rules error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch customization rules' });
  }
});

// Admin-only PUT — update customization rules
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rules = req.body;
    const config = JSON.stringify(rules);

    if (isDbConnected()) {
      // Check if row exists
      const existing = await query('SELECT id FROM customization_rules WHERE id = 1');
      if (existing.rows.length > 0) {
        await query('UPDATE customization_rules SET config = $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1', [config]);
      } else {
        await query('INSERT INTO customization_rules (id, config) VALUES (1, $1)', [config]);
      }
      return res.json(rules);
    }

    const memory = getMemoryStore();
    memory.customizationRules = rules;
    return res.json(rules);
  } catch (error) {
    logger.error('Update customization rules error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to update customization rules' });
  }
});

export default router;

