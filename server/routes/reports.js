import express from 'express';
import { query } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();
router.use(authenticateToken);

// GET /api/reports/overview — dashboard metrics (admin only)
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    const [revenueResult, ordersResult, usersResult, productsResult, pendingResult, lowStockResult, recentResult, topResult] =
      await Promise.all([
        query(`SELECT COALESCE(SUM(total), 0)::NUMERIC(12,2) AS total_revenue FROM orders WHERE payment_status = 'paid'`),
        query(`SELECT COUNT(*)::int AS total_orders FROM orders`),
        query(`SELECT COUNT(*)::int AS total_users FROM users`),
        query(`SELECT COUNT(*)::int AS total_products FROM products`),
        query(`SELECT COUNT(*)::int AS pending_orders FROM orders WHERE status = 'pending'`),
        query(`SELECT COUNT(*)::int AS low_stock_count FROM products WHERE stock <= 10`),
        query(`SELECT * FROM orders ORDER BY created_at DESC LIMIT 5`),
        query(`
          SELECT oi->>'name' AS name,
                 COUNT(*)::int AS units_sold,
                 SUM((oi->>'qty')::int * (oi->>'price')::numeric)::NUMERIC(12,2) AS revenue
          FROM orders o
          CROSS JOIN LATERAL jsonb_array_elements(o.items::jsonb) AS oi
          WHERE o.payment_status = 'paid'
          GROUP BY oi->>'name'
          ORDER BY units_sold DESC
          LIMIT 8
        `),
      ]);

    return res.json({
      totalRevenue: Number(revenueResult.rows[0]?.total_revenue) || 0,
      totalOrders: Number(ordersResult.rows[0]?.total_orders) || 0,
      totalUsers: Number(usersResult.rows[0]?.total_users) || 0,
      totalProducts: Number(productsResult.rows[0]?.total_products) || 0,
      pendingOrders: Number(pendingResult.rows[0]?.pending_orders) || 0,
      lowStockProducts: Number(lowStockResult.rows[0]?.low_stock_count) || 0,
      recentOrders: recentResult.rows.map((row) => ({
        id: row.id,
        customer_name: row.customer_name,
        total: Number(row.total),
        status: row.status,
        created_at: row.created_at,
      })),
      topProducts: topResult.rows,
    });
  } catch (error) {
    logger.error('Fetch reports overview error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch reports overview' });
  }
});

// GET /api/reports/product-sales — top products from materialized view (admin only)
router.get('/product-sales', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    // Materialized view mv_product_sales_summary created in schema.sql
    const result = await query(
      `SELECT * FROM mv_product_sales_summary ORDER BY total_revenue DESC LIMIT $1`,
      [limit]
    );
    return res.json(result.rows);
  } catch (error) {
    logger.error('Fetch product sales report error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch product sales report' });
  }
});

// GET /api/reports/daily-orders — daily order summary from materialized view (admin only)
router.get('/daily-orders', requireAdmin, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    // Materialized view mv_daily_orders_summary created in schema.sql
    const result = await query(
      `SELECT * FROM mv_daily_orders_summary
       WHERE order_date >= CURRENT_DATE - ($1 || ' days')::interval
       ORDER BY order_date ASC`,
      [days]
    );
    return res.json(result.rows);
  } catch (error) {
    logger.error('Fetch daily orders report error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch daily orders report' });
  }
});

export default router;

