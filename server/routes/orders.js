import express from 'express';
import { query } from '../db.js';
import { pool } from '../db.js';
import { authenticateToken, requireAuth, requireAdmin } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

const router = express.Router();
router.use(authenticateToken);

function formatOrder(row) {
  if (!row) return null;
  return {
    ...row,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    created_date: row.created_at || new Date().toISOString(),
  };
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

// GET /api/orders
router.get('/', requireAuth, async (req, res) => {
  try {
    const sql = req.user.role === 'admin'
      ? 'SELECT * FROM orders ORDER BY created_at DESC'
      : 'SELECT * FROM orders WHERE user_id = $1 OR LOWER(email) = LOWER($2) ORDER BY created_at DESC';
    const params = req.user.role === 'admin' ? [] : [req.user.id, req.user.email || ''];
    const result = await query(sql, params);
    return res.json(result.rows.map(formatOrder));
  } catch (error) {
    logger.error('Fetch orders error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// POST /api/orders
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
      subtotal,
      shipping,
      total,
      order_type,
      status,
      payment_method,
      payment_status,
    } = req.body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    // Start transaction
    await client.query('BEGIN');

    try {
      // Check stock availability and deduct stock for each item
      for (const item of items) {
        // Lock row for update to prevent race conditions
        const stockResult = await client.query(
          'SELECT id, stock FROM products WHERE id = $1 FOR UPDATE',
          [item.product_id]
        );

        if (stockResult.rows.length === 0) {
          throw new Error(`Product ${item.product_id} not found`);
        }

        const product = stockResult.rows[0];
        if (product.stock < item.qty) {
          throw new Error(`Insufficient stock for product ${item.name}. Available: ${product.stock}, Requested: ${item.qty}`);
        }

        // Deduct stock
        await client.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [item.qty, item.product_id]
        );
      }

      // Insert order
      const orderResult = await client.query(
        `INSERT INTO orders (
          customer_name, email, phone, address, city, pincode, state, items,
          subtotal, shipping, total, order_type, status, user_id,
          payment_method, payment_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14,
          $15, $16
        ) RETURNING *`,
        [
          customer_name,
          email,
          phone || '',
          address || '',
          city || '',
          pincode || '',
          state || '',
          JSON.stringify(items || []),
          subtotal || 0,
          shipping || 0,
          total || 0,
          order_type || 'retail',
          status || 'pending',
          req.user.id,
          payment_method || 'cod',
          payment_status || 'pending',
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

// PUT /api/orders/:id — Update order status (admin only) or allow user to cancel
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;

    // Fetch the order
    const orderResult = await query('SELECT * FROM orders WHERE id = $1', [id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Authorization check:
    // - Only admins can update any order
    // - Regular users can only cancel their own orders
    if (req.user.role !== 'admin') {
      if (order.user_id !== req.user.id) {
        return res.status(403).json({ message: 'You can only update your own orders' });
      }

      // Users can only cancel pending orders
      if (status && status !== 'cancelled') {
        return res.status(403).json({ message: 'Users can only cancel orders' });
      }

      if (status === 'cancelled' && order.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending orders can be cancelled' });
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

    const result = await query(sql, params);
    return res.json(formatOrder(result.rows[0]));
  } catch (error) {
    logger.error('Update order error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to update order' });
  }
});

export default router;
