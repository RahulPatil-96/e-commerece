import express from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { pool } from '../db.js';
import { authenticateToken, requireAuth, requireAdmin } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

const router = express.Router();
router.use(authenticateToken);

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Free shipping threshold (must match the frontend Cart logic).
const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING = 49;

function formatOrder(row) {
  if (!row) return null;
  let items = row.items || [];
  if (typeof items === 'string') {
    try {
      items = JSON.parse(items);
    } catch {
      logger.warn('Order has malformed items JSON:', { order_id: row.id });
      items = [];
    }
  }
  return {
    ...row,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    discount: Number(row.discount || 0),
    items,
    created_date: row.created_at || new Date().toISOString(),
  };
}

/**
 * Verify a Razorpay payment signature.
 * expected = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
 */
export function verifyRazorpaySignature({ order_id, payment_id, signature }) {
  if (!RAZORPAY_KEY_SECRET) return false;
  if (!order_id || !payment_id || !signature) return false;
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');
  return expected === signature;
}

async function sendOrderConfirmationEmail(order) {
  const itemsHtml = order.items
    .map((item) => `<li>${item.qty} × ${item.name} @ ₹${item.price.toLocaleString('en-IN')}</li>`)
    .join('');
  const message = `Thank you for your order, ${order.customer_name}! Your order #${order.id} has been received. Total: ₹${order.total.toLocaleString('en-IN')}.`;
  try {
    await sendEmail({
      to: order.email,
      subject: `Your Arihant Order #${order.id}`,
      text: `${message}\n\nItems:\n${order.items.map((item) => `- ${item.qty} x ${item.name} @ ₹${item.price}`).join('\n')}`,
      html: `<p>${message}</p><p><strong>Order details</strong></p><ul>${itemsHtml}</ul><p>Total: ₹${order.total.toLocaleString('en-IN')}</p>`,
    });
  } catch (error) {
    logger.warn('Order confirmation email not sent:', { error: error.message || error });
  }
}

// GET /api/orders?sort=&limit=&page=
router.get('/', requireAuth, async (req, res) => {
  try {
    const { sort, limit: queryLimit, page: queryPage } = req.query;
    const limit = parseInt(queryLimit, 10) || 200;
    const page = parseInt(queryPage, 10) || 1;
    const offset = (page - 1) * limit;

    // Support sort like "-created_date" (desc) or "created_date" (asc).
    let orderBy = 'created_at DESC';
    if (sort) {
      const s = String(sort);
      const desc = s.startsWith('-');
      const field = desc ? s.slice(1) : s;
      const allowed = ['created_date', 'created_at', 'total', 'status'];
      if (allowed.includes(field)) {
        const col = field === 'created_date' ? 'created_at' : field;
        orderBy = `${col} ${desc ? 'DESC' : 'ASC'}`;
      }
    }

    const whereSql = req.user.role === 'admin'
      ? ''
      : ' WHERE user_id = $1 OR LOWER(email) = LOWER($2)';
    const whereParams = req.user.role === 'admin' ? [] : [req.user.id, req.user.email || ''];

    const countSql = `SELECT COUNT(*)::int AS count FROM orders${whereSql}`;
    const countParams = [...whereParams];
    const countResult = await query(countSql, countParams);
    const total = countResult.rows[0]?.count || 0;

    const sql = `SELECT * FROM orders${whereSql} ORDER BY ${orderBy} LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}`;
    const params = [...whereParams, limit, offset];
    const result = await query(sql, params);

    const totalPages = Math.ceil(total / limit);
    return res.json({
      orders: result.rows.map(formatOrder),
      pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    });
  } catch (error) {
    logger.error('Fetch orders error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// POST /api/orders — create an order. Totals are recomputed server-side from
// the DB product prices so a client cannot tamper with prices or discounts.
router.post('/', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      customer_name,
      email,
      phone,
      address,
      city,
      pincode,
      state,
      items,
      order_type,
      payment_method,
      payment_status,
      coupon_code,
      payment_id,
      order_id,
      razorpay_signature,
    } = req.body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    const isWholesale = String(order_type || 'retail').toLowerCase() === 'wholesale';

    // Reject forged "paid" online orders unless the Razorpay signature verifies.
    if (payment_status === 'paid') {
      const verified = verifyRazorpaySignature({ order_id, payment_id, signature: razorpay_signature });
      if (!verified) {
        return res.status(400).json({ message: 'Payment verification failed' });
      }
    }

    // Start transaction
    await client.query('BEGIN');

    try {
      // 1) Recompute totals from DB product prices.
      let subtotal = 0;
      const enrichedItems = [];
      for (const item of items) {
        const productResult = await client.query(
          'SELECT id, name, price, wholesale_price, customization_price, stock FROM products WHERE id = $1 FOR UPDATE',
          [item.product_id]
        );
        if (productResult.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }
        const product = productResult.rows[0];
        const qty = Math.max(1, parseInt(item.qty, 10) || 1);
        if (product.stock < qty) {
          throw new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${qty}`);
        }

        const basePrice = isWholesale
          ? (product.wholesale_price != null ? Number(product.wholesale_price) : Number(product.price))
          : Number(product.price);
        const customizationPrice = item.customization ? Number(product.customization_price || 0) : 0;
        const unitPrice = basePrice + customizationPrice;
        subtotal += unitPrice * qty;

        enrichedItems.push({
          id: product.id,
          name: item.name || product.name,
          qty,
          price: unitPrice,
          product_id: product.id,
          customization: item.customization || null,
        });

        // Deduct stock
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [qty, product.id]
        );
      }

      // 2) Compute discount from the coupon (server-side, against DB).
      let discount = 0;
      if (coupon_code) {
        const couponResult = await client.query(
          `SELECT * FROM coupons
           WHERE LOWER(code) = LOWER($1) AND is_active = true
             AND (valid_from IS NULL OR valid_from <= CURRENT_TIMESTAMP)
             AND (valid_until IS NULL OR valid_until >= CURRENT_TIMESTAMP)
             AND (max_uses IS NULL OR current_uses < max_uses)
           FOR UPDATE`,
          [coupon_code]
        );
        const coupon = couponResult.rows[0];
        if (!coupon) {
          throw new Error('Coupon is invalid or expired');
        }
        if (coupon.applicable_to !== 'all' && coupon.applicable_to !== order_type) {
          throw new Error(`Coupon not applicable to ${order_type} orders`);
        }
        if (coupon.min_order_value && subtotal < Number(coupon.min_order_value)) {
          throw new Error(`Minimum order value of ₹${coupon.min_order_value} required`);
        }
        discount = coupon.discount_type === 'percentage'
          ? Math.floor((subtotal * Number(coupon.discount_value)) / 100)
          : Math.min(Number(coupon.discount_value), subtotal);

        // Increment usage only at order creation.
        await client.query(
          'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = $1',
          [coupon.id]
        );
      }

      // 3) Compute shipping (must match the frontend Cart logic).
      const shipping = subtotal > FREE_SHIPPING_THRESHOLD || subtotal === 0 ? 0 : STANDARD_SHIPPING;
      const total = Math.max(0, subtotal - discount + shipping);

      // 4) Insert order.
      const orderResult = await client.query(
        `INSERT INTO orders (
          customer_name, email, phone, address, city, pincode, state, items,
          subtotal, shipping, total, discount, order_type, status, user_id,
          payment_method, payment_status, coupon_code, payment_id, razorpay_order_id, razorpay_signature
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21
        ) RETURNING *`,
        [
          customer_name,
          email,
          phone || '',
          address || '',
          city || '',
          pincode || '',
          state || '',
          JSON.stringify(enrichedItems),
          subtotal,
          shipping,
          total,
          discount,
          order_type || 'retail',
          payment_status === 'paid' ? 'processing' : 'pending',
          req.user.id,
          payment_method || 'cod',
          payment_status || 'pending',
          coupon_code || null,
          payment_id || null,
          order_id || null,
          razorpay_signature || null,
        ]
      );

      // Commit transaction
      await client.query('COMMIT');

      const newOrder = formatOrder(orderResult.rows[0]);
      sendOrderConfirmationEmail(newOrder);
      return res.status(201).json(newOrder);
    } catch (error) {
      // Rollback on any error
      await client.query('ROLLBACK');
      logger.error('Order creation error (transaction rolled back):', { error: error.message });
      return res.status(400).json({ message: error.message || 'Failed to place order' });
    }
  } catch (error) {
    logger.error('Create order error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to place order' });
  } finally {
    client.release();
  }
});

// PUT /api/orders/:id — Update order status (admin only) or allow user to cancel.
// When an order transitions to 'cancelled', the deducted stock is restored.
router.put('/:id', requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;

    // Fetch the order
    const orderResult = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (orderResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Authorization check:
    // - Only admins can update any order
    // - Regular users can only cancel their own orders
    if (req.user.role !== 'admin') {
      if (order.user_id !== req.user.id) {
        client.release();
        return res.status(403).json({ message: 'You can only update your own orders' });
      }

      // Users can only cancel pending orders
      if (status && status !== 'cancelled') {
        client.release();
        return res.status(403).json({ message: 'Users can only cancel orders' });
      }

      if (status === 'cancelled' && order.status !== 'pending') {
        client.release();
        return res.status(400).json({ message: 'Only pending orders can be cancelled' });
      }
    }

    await client.query('BEGIN');

    try {
      // Restore stock if the order is transitioning to 'cancelled' and wasn't already cancelled.
      if (status === 'cancelled' && order.status !== 'cancelled') {
        let items = order.items;
        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch {
            items = [];
          }
        }
        for (const item of items || []) {
          if (item && item.product_id) {
            await client.query(
              'UPDATE products SET stock = stock + $1 WHERE id = $2',
              [Math.max(1, parseInt(item.qty, 10) || 1), item.product_id]
            );
          }
        }
      }

      // Admin can update any field; users can only set status to 'cancelled'
      let sql = 'UPDATE orders SET updated_at = CURRENT_TIMESTAMP';
      const params = [];

      if (status !== undefined) {
        params.push(status);
        sql += `, status = $${params.length}`;
      }
      if (req.user.role === 'admin' && tracking_number !== undefined) {
        params.push(tracking_number);
        sql += `, tracking_number = $${params.length}`;
      }

      params.push(id);
      sql += ` WHERE id = $${params.length} RETURNING *`;

      const result = await client.query(sql, params);
      await client.query('COMMIT');
      return res.json(formatOrder(result.rows[0]));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    logger.error('Update order error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to update order' });
  } finally {
    client.release();
  }
});

export default router;
