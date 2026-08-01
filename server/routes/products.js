import express from 'express';
import { z } from 'zod';
import { query } from '../db.js';
import logger from '../utils/logger.js';

const router = express.Router();

function tryParseJson(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function prepareJson(val) {
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return JSON.stringify(parsed);
    } catch {
      // Not JSON string
    }
    return JSON.stringify(val ? [val] : []);
  }
  return '[]';
}

function formatProduct(row) {
  if (!row) return null;
  return {
    ...row,
    price: Number(row.price),
    wholesale_price: row.wholesale_price !== null && row.wholesale_price !== undefined ? Number(row.wholesale_price) : null,
    rating: row.rating ? Number(row.rating) : 4.5,
    customization_price: row.customization_price ? Number(row.customization_price) : 0,
    stock: Number(row.stock || 0),
    bulk_min_qty: Number(row.bulk_min_qty || 1),
    gallery: tryParseJson(row.gallery),
    tags: tryParseJson(row.tags),
  };
}

async function generateUniqueSlug(name, excludeId = null) {
  const baseSlug = (name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product';
  let candidateSlug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = excludeId
      ? await query('SELECT id FROM products WHERE slug = $1 AND id != $2', [candidateSlug, excludeId])
      : await query('SELECT id FROM products WHERE slug = $1', [candidateSlug]);

    if (existing.rows.length === 0) {
      return candidateSlug;
    }
    candidateSlug = `${baseSlug}-${counter++}`;
  }
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, audience, sort, search, limit: queryLimit, page: queryPage } = req.query;
    const limit = parseInt(queryLimit, 10) || 200;
    const page = parseInt(queryPage, 10) || 1;
    const offset = (page - 1) * limit;

    let countSql = 'SELECT COUNT(*) FROM products WHERE 1=1';
    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    const countParams = [];

    if (category && category !== 'All') {
      params.push(category);
      countParams.push(category);
      sql += ` AND LOWER(category) = LOWER($${params.length})`;
      countSql += ` AND LOWER(category) = LOWER($${countParams.length})`;
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
      sql += ` AND (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(tags::text, '')) @@ plainto_tsquery('english', $${params.length}) OR name ILIKE $${params.length} || '%')`;
      countSql += ` AND (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(tags::text, '')) @@ plainto_tsquery('english', $${countParams.length}) OR name ILIKE $${countParams.length} || '%')`;
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
  } catch (error) {
    logger.error('Fetch products error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);
    const sql = isNumeric
      ? 'SELECT * FROM products WHERE id = $1 OR slug = $2'
      : 'SELECT * FROM products WHERE slug = $1';
    const queryParams = isNumeric ? [parseInt(id, 10), id] : [id];
    const result = await query(sql, queryParams);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(formatProduct(result.rows[0]));
  } catch (error) {
    logger.error('Fetch product detail error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const p = req.body;
    const slug = await generateUniqueSlug(p.name || 'product');

    const sql = `
      INSERT INTO products (
        name, slug, description, long_description, price, wholesale_price, category, audience, image_url, gallery, stock, sku, tags, rating, featured, bulk_min_qty, dimensions, material, color, weight, care_instructions, personalizable, customization_price
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *`;
    const values = [
      p.name || '',
      slug,
      p.description || '',
      p.long_description || '',
      Number(p.price) || 0,
      p.wholesale_price !== undefined && p.wholesale_price !== null && p.wholesale_price !== '' ? Number(p.wholesale_price) : null,
      p.category || 'Notebooks',
      p.audience || 'both',
      p.image_url || '',
      prepareJson(p.gallery),
      Number(p.stock) || 100,
      p.sku || '',
      prepareJson(p.tags),
      Number(p.rating) || 4.5,
      Boolean(p.featured),
      Number(p.bulk_min_qty) || 1,
      p.dimensions || '',
      p.material || '',
      p.color || '',
      p.weight || '',
      p.care_instructions || '',
      Boolean(p.personalizable),
      Number(p.customization_price) || 0,
    ];
    const result = await query(sql, values);
    return res.json(formatProduct(result.rows[0]));
  } catch (error) {
    logger.error('Create product error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const p = req.body;
    const isNumeric = /^\d+$/.test(id);
    const numId = isNumeric ? parseInt(id, 10) : id;
    const slug = await generateUniqueSlug(p.name || 'product', isNumeric ? numId : null);

    const sql = `
      UPDATE products SET
        name = $1,
        slug = $2,
        description = $3,
        long_description = $4,
        price = $5,
        wholesale_price = $6,
        category = $7,
        audience = $8,
        image_url = $9,
        gallery = $10,
        stock = $11,
        sku = $12,
        tags = $13,
        featured = $14,
        bulk_min_qty = $15,
        dimensions = $16,
        material = $17,
        color = $18,
        weight = $19,
        care_instructions = $20,
        personalizable = $21,
        customization_price = $22,
        updated_at = CURRENT_TIMESTAMP
      WHERE ${isNumeric ? 'id = $23' : 'slug = $23'} RETURNING *`;

    const values = [
      p.name || '',
      slug,
      p.description || '',
      p.long_description || '',
      Number(p.price) || 0,
      p.wholesale_price !== undefined && p.wholesale_price !== null && p.wholesale_price !== '' ? Number(p.wholesale_price) : null,
      p.category || 'Notebooks',
      p.audience || 'both',
      p.image_url || '',
      prepareJson(p.gallery),
      Number(p.stock) || 0,
      p.sku || '',
      prepareJson(p.tags),
      Boolean(p.featured),
      Number(p.bulk_min_qty) || 1,
      p.dimensions || '',
      p.material || '',
      p.color || '',
      p.weight || '',
      p.care_instructions || '',
      Boolean(p.personalizable),
      Number(p.customization_price) || 0,
      numId,
    ];

    const result = await query(sql, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    return res.json(formatProduct(result.rows[0]));
  } catch (error) {
    logger.error('Update product error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: error.message || 'Failed to update product' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const isNumeric = /^\d+$/.test(id);
    const sql = isNumeric ? 'DELETE FROM products WHERE id = $1' : 'DELETE FROM products WHERE slug = $1';
    await query(sql, [isNumeric ? parseInt(id, 10) : id]);
    return res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    logger.error('Delete product error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

export default router;
