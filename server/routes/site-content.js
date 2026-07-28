import express from 'express';
import { query, isDbConnected } from '../db.js';
import {
  HOME_COLLECTIONS,
  HOME_MARQUEE_ITEMS,
  HOME_STATS,
  HOME_TESTIMONIALS,
  SEASONAL_CAMPAIGNS,
  SHOP_ALL_CATEGORIES,
  SHOP_MATERIAL_OPTIONS,
  SHOP_COLOR_SWATCHES,
  GIFT_OCCASIONS,
  GIFT_PACKAGING,
  B2B_BENEFITS,
  B2B_TIERS,
  FEATURED_COLLECTIONS_CONFIG,
} from '../seed.js';

import logger from '../utils/logger.js';

const router = express.Router();

// Static fallback data map (same keys as site_content table)
const STATIC_CONTENT = {
  home_collections: HOME_COLLECTIONS,
  home_marquee_items: HOME_MARQUEE_ITEMS,
  home_stats: HOME_STATS,
  home_testimonials: HOME_TESTIMONIALS,
  seasonal_campaigns: SEASONAL_CAMPAIGNS,
  shop_categories: SHOP_ALL_CATEGORIES,
  shop_material_options: SHOP_MATERIAL_OPTIONS,
  shop_color_swatches: SHOP_COLOR_SWATCHES,
  gift_occasions: GIFT_OCCASIONS,
  gift_packaging: GIFT_PACKAGING,
  b2b_benefits: B2B_BENEFITS,
  b2b_tiers: B2B_TIERS,
  featured_collections_config: FEATURED_COLLECTIONS_CONFIG,
};

/**
 * GET /api/site-content
 * Returns all site content (UI config data) as a key-value map.
 * When DB is not connected, returns the static fallback data.
 */
router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      const result = await query('SELECT key, value FROM site_content');
      const content = {};
      for (const row of result.rows) {
        content[row.key] = row.value;
      }
      return res.json(content);
    }

    // Fallback: return static data from seed.js
    return res.json(STATIC_CONTENT);
  } catch (error) {
    logger.error('Fetch site content error:', { error: error.message, stack: error.stack });
    // Fallback on error
    return res.json(STATIC_CONTENT);
  }
});

/**
 * GET /api/site-content/:key
 * Returns a specific site content entry by key.
 */
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;

    if (isDbConnected()) {
      const result = await query('SELECT value FROM site_content WHERE key = $1', [key]);
      if (result.rows.length > 0) {
        return res.json(result.rows[0].value);
      }
      return res.status(404).json({ message: `Site content key '${key}' not found` });
    }

    // Fallback
    if (key in STATIC_CONTENT) {
      return res.json(STATIC_CONTENT[key]);
    }
    return res.status(404).json({ message: `Site content key '${key}' not found` });
  } catch (error) {
    logger.error('Fetch site content by key error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch site content' });
  }
});

/**
 * PUT /api/site-content/:key
 * Updates a specific site content entry by key.
 */
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const value = req.body;

    if (isDbConnected()) {
      const result = await query(
        `INSERT INTO site_content (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [key, JSON.stringify(value)]
      );
      return res.json(result.rows[0]);
    }

    // Memory store fallback: update STATIC_CONTENT equivalent
    return res.json({ key, value });
  } catch (error) {
    logger.error('Update site content by key error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to update site content' });
  }
});

export default router;

