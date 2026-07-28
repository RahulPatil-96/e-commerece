import express from 'express';
import { z } from 'zod';
import { query, isDbConnected, getMemoryStore } from '../db.js';
import { CATEGORIES } from '../seed.js';
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
    if (isDbConnected()) {
      const result = await query('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
      return res.json(result.rows.map(formatCategory));
    }

    // Memory store fallback
    const memory = getMemoryStore();
    if (memory.categories && memory.categories.length > 0) {
      return res.json(memory.categories.map(formatCategory));
    }
    return res.json(CATEGORIES.map(formatCategory));
  } catch (error) {
    logger.error('Fetch categories error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
});

// POST /api/categories — create a new category
router.post('/', async (req, res) => {
  try {
    const data = categorySchema.parse(req.body);
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    if (isDbConnected()) {
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
    }

    const memory = getMemoryStore();
    const existingIdx = memory.categories.findIndex((c) => c.slug === slug);
    if (existingIdx >= 0) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }

    const newCategory = {
      id: memory.categories.length + 1,
      name: data.name,
      slug,
      description: data.description || '',
      image_url: data.image_url || '',
      display_order: data.display_order || 0,
      created_at: new Date().toISOString(),
    };
    memory.categories.push(newCategory);
    return res.json(formatCategory(newCategory));
  } catch (error) {
    logger.error('Create category error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to create category' });
  }
});

// PUT /api/categories/:id — update a category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = categorySchema.partial().parse(req.body);
    const slug = data.name
      ? data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : undefined;

    if (isDbConnected()) {
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
          created_at = created_at
         WHERE id = $6 RETURNING *`,
        [data.name, slug, data.description, data.image_url, data.display_order, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Category not found' });
      }
      return res.json(formatCategory(result.rows[0]));
    }

    const memory = getMemoryStore();
    const idx = memory.categories.findIndex((c) => String(c.id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (slug) {
      const existingIdx = memory.categories.findIndex((c) => c.slug === slug && String(c.id) !== String(id));
      if (existingIdx >= 0) {
        return res.status(400).json({ message: 'A category with this name already exists' });
      }
    }

    memory.categories[idx] = {
      ...memory.categories[idx],
      ...data,
      slug: slug || memory.categories[idx].slug,
    };
    return res.json(formatCategory(memory.categories[idx]));
  } catch (error) {
    logger.error('Update category error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to update category' });
  }
});

// DELETE /api/categories/:id — delete a category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Category not found' });
      }
      return res.json({ success: true, message: 'Category deleted' });
    }

    const memory = getMemoryStore();
    const idx = memory.categories.findIndex((c) => String(c.id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ message: 'Category not found' });
    }
    memory.categories.splice(idx, 1);
    return res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    logger.error('Delete category error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to delete category' });
  }
});

export default router;
