import express from 'express';
import { query, pool } from '../db.js';
import { authenticateToken, requireAuth, requireAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

function formatReview(row) {
  if (!row) return null;
  return {
    ...row,
    rating: Number(row.rating),
    helpful_count: Number(row.helpful_count),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
}

// GET /api/reviews?product_id=X&sort=recent|helpful
router.get('/', async (req, res) => {
  try {
    const { product_id, sort = 'recent' } = req.query;

    if (!product_id) {
      return res.status(400).json({ message: 'product_id is required' });
    }

    const orderBy = sort === 'helpful' ? 'helpful_count DESC, created_at DESC' : 'created_at DESC';

    const result = await query(
      `SELECT r.*, u.first_name, u.last_name, u.email 
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.product_id = $1
       ORDER BY ${orderBy}`,
      [product_id]
    );

    return res.json(result.rows.map(formatReview));
  } catch (error) {
    logger.error('Fetch reviews error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
});

// GET /api/reviews/:id — Get single review
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }
    return res.json(formatReview(result.rows[0]));
  } catch (error) {
    logger.error('Fetch review error:', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch review' });
  }
});

// POST /api/reviews — Create review (authenticated users only)
router.post('/', authenticateToken, requireAuth, async (req, res) => {
  try {
    const { product_id, rating, title, review_text, verified_purchase } = req.body;

    // Validation
    if (!product_id || !rating) {
      return res.status(400).json({ message: 'product_id and rating are required' });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    // Check if user already reviewed this product
    const existing = await query(
      'SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2',
      [req.user.id, product_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const result = await query(
      `INSERT INTO reviews (user_id, product_id, rating, title, review_text, verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, product_id, rating, title || null, review_text || null, verified_purchase || false]
    );

    return res.status(201).json(formatReview(result.rows[0]));
  } catch (error) {
    logger.error('Create review error:', { error: error.message });
    res.status(500).json({ message: 'Failed to create review' });
  }
});

// PUT /api/reviews/:id — Update review (only owner or admin)
router.put('/:id', authenticateToken, requireAuth, async (req, res) => {
  try {
    const { rating, title, review_text } = req.body;

    // Get existing review
    const existing = await query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const review = existing.rows[0];
    // Only owner or admin can update
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const result = await query(
      `UPDATE reviews
       SET rating = COALESCE($1, rating),
           title = COALESCE($2, title),
           review_text = COALESCE($3, review_text)
       WHERE id = $4
       RETURNING *`,
      [rating || null, title || null, review_text || null, req.params.id]
    );

    return res.json(formatReview(result.rows[0]));
  } catch (error) {
    logger.error('Update review error:', { error: error.message });
    res.status(500).json({ message: 'Failed to update review' });
  }
});

// DELETE /api/reviews/:id — Delete review (only owner or admin)
router.delete('/:id', authenticateToken, requireAuth, async (req, res) => {
  try {
    const existing = await query('SELECT * FROM reviews WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const review = existing.rows[0];
    if (review.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    return res.json({ message: 'Review deleted' });
  } catch (error) {
    logger.error('Delete review error:', { error: error.message });
    res.status(500).json({ message: 'Failed to delete review' });
  }
});

// PUT /api/reviews/:id/helpful — Mark review as helpful.
// Requires authentication and dedupes per user so a single user cannot
// inflate the count infinitely.
router.put('/:id/helpful', authenticateToken, requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Ensure the review exists & lock it.
    const reviewResult = await client.query('SELECT id FROM reviews WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (reviewResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Review not found' });
    }

    // Insert a vote (dedup via PRIMARY KEY / unique constraint).
    try {
      await client.query(
        'INSERT INTO review_votes (review_id, user_id, helpful) VALUES ($1, $2, true)',
        [req.params.id, req.user.id]
      );
    } catch (voteError) {
      // Duplicate vote from the same user → prohibit.
      if (voteError.code === '23505') {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'You have already marked this review as helpful' });
      }
      throw voteError;
    }

    // Increment helpful_count only when a new vote was inserted.
    const result = await client.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    await client.query('COMMIT');
    return res.json(formatReview(result.rows[0]));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    logger.error('Mark helpful error:', { error: error.message });
    res.status(500).json({ message: 'Failed to update helpful count' });
  } finally {
    client.release();
  }
});

// GET /api/reviews/product/:product_id/stats — Get review statistics for a product
router.get('/product/:product_id/stats', async (req, res) => {
  try {
    const result = await query(
      `SELECT 
        COUNT(*) as total_reviews,
        AVG(rating)::NUMERIC(3,2) as avg_rating,
        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
       FROM reviews
       WHERE product_id = $1`,
      [req.params.product_id]
    );

    const stats = result.rows[0] || {};
    return res.json({
      totalReviews: Number(stats.total_reviews) || 0,
      avgRating: Number(stats.avg_rating) || 0,
      distribution: {
        '5': Number(stats.five_star) || 0,
        '4': Number(stats.four_star) || 0,
        '3': Number(stats.three_star) || 0,
        '2': Number(stats.two_star) || 0,
        '1': Number(stats.one_star) || 0,
      }
    });
  } catch (error) {
    logger.error('Get review stats error:', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch review stats' });
  }
});

export default router;
