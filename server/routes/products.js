import express from 'express';
import { z } from 'zod';
import { query, isDbConnected, getMemoryStore } from '../db.js';

import logger from '../utils/logger.js';

const router = express.Router();
const productsQuerySchema = z.object({
  category: z.string().optional(),
  audience: z.string().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  limit: z.preprocess((val) => Number(val), z.number().int().positive().max(200).optional()),
  page: z.preprocess((val) => Number(val), z.number().int().positive().optional()),
});

// Helper to normalize product output format
function formatProduct(row) {
  if (!row) return null;
  return {
    ...row,
    price: Number(row.price),
    wholesale_price: row.wholesale_price ? Number(row.wholesale_price) : null,
    rating: row.rating ? Number(row.rating) : 4.5,
    customization_price: row.customization_price ? Number(row.customization_price) : 0,
    gallery: typeof row.gallery === 'string' ? JSON.parse(row.gallery) : (row.gallery || []),
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || [])
  };
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, audience, sort, search, limit: queryLimit, page: queryPage } = req.query;
    const limit = parseInt(queryLimit, 10) || 12;
    const page = parseInt(queryPage, 10) || 1;
    const offset = (page - 1) * limit;

    if (isDbConnected()) {
      let countSql = 'SELECT COUNT(*) FROM products WHERE 1=1';
      let sql = 'SELECT * FROM products WHERE 1=1';
      const params = [];
      const countParams = [];

      if (category && category !== 'All') {
        params.push(category);
        countParams.push(category);
        sql += ` AND category = $${params.length}`;
        countSql += ` AND category = $${countParams.length}`;
      }

      if (audience) {
        params.push(audience);
        countParams.push(audience);
        sql += ` AND (audience = $${params.length} OR audience = 'both')`;
        countSql += ` AND (audience = $${countParams.length} OR audience = 'both')`;
      }

      if (search) {
        params.push(search);
        countParams.push(search);
        sql += ` AND (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(tags, ' '), '')) @@ plainto_tsquery('english', $${params.length}) OR name ILIKE $${params.length} || '%')`;
        countSql += ` AND (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(array_to_string(tags, ' '), '')) @@ plainto_tsquery('english', $${countParams.length}) OR name ILIKE $${countParams.length} || '%')`;
      }

      if (sort === 'price-low') {
        sql += ' ORDER BY price ASC';
      } else if (sort === 'price-high') {
        sql += ' ORDER BY price DESC';
      } else if (sort === 'rating') {
        sql += ' ORDER BY rating DESC';
      } else {
        sql += ' ORDER BY created_at DESC';
      }

      params.push(limit);
      sql += ` LIMIT $${params.length}`;
      params.push(offset);
      sql += ` OFFSET $${params.length}`;

      const [countResult, dataResult] = await Promise.all([
        query(countSql, countParams),
        query(sql, params),
      ]);

      const total = parseInt(countResult.rows[0].count, 10);
      const totalPages = Math.ceil(total / limit);

      return res.json({
        products: dataResult.rows.map(formatProduct),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    } else {
      const memory = getMemoryStore();
      let list = [...memory.products];

      if (category && category !== 'All') {
        list = list.filter(p => p.category === category);
      }

      if (audience) {
        list = list.filter(p => p.audience === audience || p.audience === 'both');
      }

      if (search) {
        const q = search.toLowerCase();
        list = list.filter(p =>
          p.name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.tags || []).some(t => t.toLowerCase().includes(q))
        );
      }

      if (sort === 'price-low') {
        list.sort((a, b) => a.price - b.price);
      } else if (sort === 'price-high') {
        list.sort((a, b) => b.price - a.price);
      } else if (sort === 'rating') {
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else {
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      }

      const total = list.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedList = list.slice(offset, offset + limit);

      return res.json({
        products: paginatedList.map(formatProduct),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    }
  } catch (error) {
logger.error('Fetch products error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const result = await query('SELECT * FROM products WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.json(formatProduct(result.rows[0]));
    } else {
      const memory = getMemoryStore();
      const product = memory.products.find(p => String(p.id) === String(id));
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.json(formatProduct(product));
    }
  } catch (error) {
logger.error('Fetch product detail error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const p = req.body;
    const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    if (isDbConnected()) {
      const sql = `
        INSERT INTO products (
          name, slug, description, long_description, price, wholesale_price, category, audience, image_url, gallery, stock, sku, tags, rating, featured, bulk_min_qty, dimensions, material, color, weight, care_instructions, personalizable, customization_price
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
        ) RETURNING *`;
      const values = [
        p.name, slug, p.description || '', p.long_description || '', p.price, p.wholesale_price || null,
        p.category || 'Notebooks', p.audience || 'both', p.image_url, JSON.stringify(p.gallery || []),
        p.stock || 100, p.sku || '', JSON.stringify(p.tags || []), p.rating || 4.5, p.featured || false,
        p.bulk_min_qty || 1, p.dimensions || '', p.material || '', p.color || '', p.weight || '',
        p.care_instructions || '', p.personalizable || false, p.customization_price || 0
      ];
      const result = await query(sql, values);
      return res.json(formatProduct(result.rows[0]));
    } else {
      const memory = getMemoryStore();
      const newProd = {
        id: memory.products.length + 1,
        ...p,
        slug,
        created_at: new Date().toISOString()
      };
      memory.products.unshift(newProd);
      return res.json(formatProduct(newProd));
    }
  } catch (error) {
logger.error('Create product error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;

    if (isDbConnected()) {
      const sql = `
        UPDATE products SET
          name = $1, description = $2, long_description = $3, price = $4, wholesale_price = $5,
          category = $6, audience = $7, image_url = $8, gallery = $9, stock = $10, sku = $11,
          tags = $12, featured = $13, bulk_min_qty = $14, dimensions = $15, material = $16,
          color = $17, weight = $18, care_instructions = $19, personalizable = $20,
          customization_price = $21, updated_at = CURRENT_TIMESTAMP
        WHERE id = $22 RETURNING *`;
      const values = [
        p.name, p.description, p.long_description, p.price, p.wholesale_price,
        p.category, p.audience, p.image_url, JSON.stringify(p.gallery || []), p.stock, p.sku,
        JSON.stringify(p.tags || []), p.featured, p.bulk_min_qty, p.dimensions, p.material,
        p.color, p.weight, p.care_instructions, p.personalizable, p.customization_price, id
      ];
      const result = await query(sql, values);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.json(formatProduct(result.rows[0]));
    } else {
      const memory = getMemoryStore();
      const idx = memory.products.findIndex(x => String(x.id) === String(id));
      if (idx === -1) {
        return res.status(404).json({ message: 'Product not found' });
      }
      memory.products[idx] = { ...memory.products[idx], ...p };
      return res.json(formatProduct(memory.products[idx]));
    }
  } catch (error) {
logger.error('Update product error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      await query('DELETE FROM products WHERE id = $1', [id]);
    } else {
      const memory = getMemoryStore();
      memory.products = memory.products.filter(p => String(p.id) !== String(id));
    }

    return res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
logger.error('Delete product error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router;
