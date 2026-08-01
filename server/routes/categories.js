import express from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import logger from '../utils/logger.js';

const router = express.Router();

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  display_order: z.preprocess((val) => Number(val), z.number().int().positive().optional()),
});

function formatCategory(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    image_url: row.image_url || '',
    display_order: row.display_order || 0,
    created_at: row.created_at,
  };
}

// GET /api/categories — list all categories
router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
    return res.json(result.rows.map(formatCategory));
  } catch (error) {
    logger.error('Fetch categories error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// POST /api/categories — create a new category (ADMIN ONLY)
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const data = categorySchema.parse(req.body);
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const existing = await query('SELECT id FROM categories WHERE slug = $1', [slug]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }

    const result = await query(
      `INSERT INTO categories (name, slug, description, image_url, display_order)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.name, slug, data.description || '', data.image_url || '', data.display_order || 0]
    );
    return res.json(formatCategory(result.rows[0]));
  } catch (error) {
    logger.error('Create category error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to create category' });
  }
});

// PUT /api/categories/:id — update a category (ADMIN ONLY)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const data = categorySchema.partial().parse(req.body);
    const slug = data.name
      ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : undefined;

    if (slug) {
      const existing = await query('SELECT id FROM categories WHERE slug = $1 AND id != $2', [slug, id]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'A category with this name already exists' });
      }
    }

    const result = await query(
      `UPDATE categories SET
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        image_url = COALESCE($4, image_url),
        display_order = COALESCE($5, display_order),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [data.name, slug, data.description, data.image_url, data.display_order, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.json(formatCategory(result.rows[0]));
  } catch (error) {
    logger.error('Update category error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to update category' });
  }
});

// DELETE /api/categories/:id — delete a category (ADMIN ONLY)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }
    return res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    logger.error('Delete category error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

export default router;
