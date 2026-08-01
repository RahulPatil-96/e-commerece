import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireAuth, requireAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

function formatCoupon(row) {
  if (!row) return null;
  return {
    ...row,
    discount_value: Number(row.discount_value),
    min_order_value: row.min_order_value ? Number(row.min_order_value) : null,
    max_uses: row.max_uses ? Number(row.max_uses) : null,
    current_uses: Number(row.current_uses),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

// GET /api/coupons/validate/:code — Validate and get coupon details
router.get('/validate/:code', authenticateToken, requireAuth, async (req, res) => {
  try {
    const { code } = req.params;
    const { order_subtotal, mode = 'retail' } = req.query;

    const result = await query(
      `SELECT * FROM coupons 
       WHERE LOWER(code) = LOWER($1) 
       AND is_active = true
       AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP)
       AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Coupon not found or expired' });
    }

    const coupon = result.rows[0];

    // Check max uses
    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    // Check applicable_to
    if (coupon.applicable_to !== 'all' && coupon.applicable_to !== mode) {
      return res.status(400).json({ message: `Coupon not applicable to ${mode} orders` });
    }

    // Check minimum order value
    if (coupon.min_order_value && Number(order_subtotal) < Number(coupon.min_order_value)) {
      return res.status(400).json({ 
        message: `Minimum order value of ₹${coupon.min_order_value} required` 
      });
    }

    return res.json(formatCoupon(coupon));
  } catch (error) {
    logger.error('Validate coupon error:', { error: error.message });
    res.status(500).json({ message: 'Failed to validate coupon' });
  }
});

// POST /api/coupons/apply — Apply coupon to order (increment usage)
router.post('/apply', authenticateToken, requireAuth, async (req, res) => {
  try {
    const { coupon_code } = req.body;

    if (!coupon_code) {
      return res.status(400).json({ message: 'coupon_code is required' });
    }

    const result = await query(
      `UPDATE coupons 
       SET current_uses = current_uses + 1
       WHERE LOWER(code) = LOWER($1)
       AND is_active = true
       AND (max_uses IS NULL OR current_uses < max_uses)
       AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP)
       AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)
       RETURNING *`,
      [coupon_code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Could not apply coupon' });
    }

    return res.json({
      message: 'Coupon applied successfully',
      coupon: formatCoupon(result.rows[0])
    });
  } catch (error) {
    logger.error('Apply coupon error:', { error: error.message });
    res.status(500).json({ message: 'Failed to apply coupon' });
  }
});

// ==================== ADMIN ROUTES ====================

// GET /api/coupons — List all coupons (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM coupons ORDER BY created_at DESC'
    );
    return res.json(result.rows.map(formatCoupon));
  } catch (error) {
    logger.error('Fetch coupons error:', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch coupons' });
  }
});

// POST /api/coupons — Create coupon (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_value,
      max_uses,
      valid_from,
      valid_until,
      applicable_to = 'all'
    } = req.body;

    // Validation
    if (!code || !discount_type || !discount_value) {
      return res.status(400).json({ message: 'code, discount_type, and discount_value are required' });
    }

    if (!['percentage', 'fixed'].includes(discount_type)) {
      return res.status(400).json({ message: 'discount_type must be "percentage" or "fixed"' });
    }

    if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
      return res.status(400).json({ message: 'Percentage discount must be between 0 and 100' });
    }

    const result = await query(
      `INSERT INTO coupons (code, description, discount_type, discount_value, min_order_value, max_uses, valid_from, valid_until, applicable_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [code.toUpperCase(), description || null, discount_type, discount_value, min_order_value || null, max_uses || null, valid_from || null, valid_until || null, applicable_to]
    );

    return res.status(201).json(formatCoupon(result.rows[0]));
  } catch (error) {
    if (error.message.includes('duplicate key')) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    logger.error('Create coupon error:', { error: error.message });
    res.status(500).json({ message: 'Failed to create coupon' });
  }
});

// PUT /api/coupons/:id — Update coupon (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_order_value,
      max_uses,
      valid_from,
      valid_until,
      is_active,
      applicable_to
    } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (code) {
      updates.push(`code = $${paramCount++}`);
      values.push(code.toUpperCase());
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (discount_type) {
      updates.push(`discount_type = $${paramCount++}`);
      values.push(discount_type);
    }
    if (discount_value !== undefined) {
      updates.push(`discount_value = $${paramCount++}`);
      values.push(discount_value);
    }
    if (min_order_value !== undefined) {
      updates.push(`min_order_value = $${paramCount++}`);
      values.push(min_order_value);
    }
    if (max_uses !== undefined) {
      updates.push(`max_uses = $${paramCount++}`);
      values.push(max_uses);
    }
    if (valid_from !== undefined) {
      updates.push(`valid_from = $${paramCount++}`);
      values.push(valid_from);
    }
    if (valid_until !== undefined) {
      updates.push(`valid_until = $${paramCount++}`);
      values.push(valid_until);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (applicable_to) {
      updates.push(`applicable_to = $${paramCount++}`);
      values.push(applicable_to);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(req.params.id);
    const result = await query(
      `UPDATE coupons SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    return res.json(formatCoupon(result.rows[0]));
  } catch (error) {
    logger.error('Update coupon error:', { error: error.message });
    res.status(500).json({ message: 'Failed to update coupon' });
  }
});

// DELETE /api/coupons/:id — Delete coupon (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await query('DELETE FROM coupons WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Coupon deleted' });
  } catch (error) {
    logger.error('Delete coupon error:', { error: error.message });
    res.status(500).json({ message: 'Failed to delete coupon' });
  }
});

export default router;
