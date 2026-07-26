import express from 'express';
import { query, isDbConnected, getMemoryStore } from '../db.js';
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
    created_date: row.created_at || row.created_date || new Date().toISOString(),
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
      subject: `Your Lekha Order #${order.id}`,
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
    if (isDbConnected()) {
      const sql = req.user.role === 'admin'
        ? 'SELECT * FROM orders ORDER BY created_at DESC'
        : 'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC';
      const params = req.user.role === 'admin' ? [] : [req.user.id];
      const result = await query(sql, params);
      return res.json(result.rows.map(formatOrder));
    }

    const memory = getMemoryStore();
    const orders = req.user.role === 'admin'
      ? memory.orders
      : memory.orders.filter((order) => order.user_id === req.user.id);
    return res.json(orders.map(formatOrder));
  } catch (error) {
logger.error('Fetch orders error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// POST /api/orders
router.post('/', requireAuth, async (req, res) => {
  try {
    const {
      customer_name,
      email,
      phone,
      address,
      city,
      pincode,
      items,
      subtotal,
      shipping,
      total,
      order_type,
      status,
      payment_method,
      payment_status,
    } = req.body;

    if (isDbConnected()) {
      const sql = `
        INSERT INTO orders (
          customer_name, email, phone, address, city, pincode, items,
          subtotal, shipping, total, order_type, status, user_id,
          payment_method, payment_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15
        ) RETURNING *`;
      const values = [
        customer_name,
        email,
        phone || '',
        address || '',
        city || '',
        pincode || '',
        JSON.stringify(items || []),
        subtotal || 0,
        shipping || 0,
        total || 0,
        order_type || 'retail',
        status || 'pending',
        req.user.id,
        payment_method || 'cod',
        payment_status || 'pending',
      ];
      const result = await query(sql, values);
      const newOrder = formatOrder(result.rows[0]);
      sendOrderConfirmationEmail(newOrder);
      return res.json(newOrder);
    }

    const memory = getMemoryStore();
    const newOrder = {
      id: memory.orders.length + 1,
      customer_name,
      email,
      phone,
      address,
      city,
      pincode,
      items,
      subtotal,
      shipping,
      total,
      order_type: order_type || 'retail',
      status: status || 'pending',
      tracking_number: '',
      user_id: req.user.id,
      payment_method: payment_method || 'cod',
      payment_status: payment_status || 'pending',
      created_at: new Date().toISOString(),
    };
    memory.orders.unshift(newOrder);
    sendOrderConfirmationEmail(newOrder);
    return res.json(formatOrder(newOrder));
  } catch (error) {
logger.error('Create order error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to place order' });
  }
});

// PUT /api/orders/:id
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;

    if (isDbConnected()) {
      let sql = 'UPDATE orders SET updated_at = CURRENT_TIMESTAMP';
      const params = [];

      if (status !== undefined) {
        params.push(status);
        sql += `, status = $${params.length}`;
      }
      if (tracking_number !== undefined) {
        params.push(tracking_number);
        sql += `, tracking_number = $${params.length}`;
      }

      params.push(id);
      sql += ` WHERE id = $${params.length} RETURNING *`;

      const result = await query(sql, params);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      return res.json(formatOrder(result.rows[0]));
    }

    const memory = getMemoryStore();
    const idx = memory.orders.findIndex((x) => String(x.id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (status !== undefined) memory.orders[idx].status = status;
    if (tracking_number !== undefined) memory.orders[idx].tracking_number = tracking_number;
    return res.json(formatOrder(memory.orders[idx]));
  } catch (error) {
logger.error('Update order error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to update order' });
  }
});

export default router;
