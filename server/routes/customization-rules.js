import express from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { DEFAULT_CUSTOMIZATION_RULES } from '../seed.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Validation schema for customization rules — aligned with the frontend payload
// ({ fonts, colors, maxLength, enabled }).
const customizationRulesSchema = z.object({
  fonts: z.array(z.object({
    label: z.string().optional(),
    value: z.string().optional(),
  })).optional(),
  colors: z.array(z.object({
    label: z.string().optional(),
    value: z.string().optional(),
  })).optional(),
  maxLength: z.number().int().positive().optional(),
  enabled: z.boolean().optional(),
}).strict('Received unexpected fields in customization rules');

// Public GET — anyone can read customization rules
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT config FROM customization_rules WHERE id = 1');
    if (result.rows.length > 0) {
      return res.json(result.rows[0].config);
    }
    return res.json(DEFAULT_CUSTOMIZATION_RULES);
  } catch (error) {
    logger.error('Fetch customization rules error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch customization rules' });
  }
});

// Admin-only PUT — update customization rules with validation
router.put('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Validate input with Zod
    const rules = customizationRulesSchema.parse(req.body);
    const config = JSON.stringify(rules);

    const existing = await query('SELECT id FROM customization_rules WHERE id = 1');
    if (existing.rows.length > 0) {
      await query('UPDATE customization_rules SET config = $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1', [config]);
    } else {
      await query('INSERT INTO customization_rules (id, config) VALUES (1, $1)', [config]);
    }
    return res.json(rules);
  } catch (error) {
    logger.error('Update customization rules error:', { error: error.message, stack: error.stack });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid customization rules', 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Failed to update customization rules' });
  }
});

export default router;
