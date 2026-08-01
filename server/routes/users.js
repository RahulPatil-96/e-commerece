import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../db.js';
import { authenticateToken, requireAuth, requireAdmin } from '../middleware/auth.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

const router = express.Router();
router.use(authenticateToken);

const roleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

const createUserSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'admin']).optional(),
});

const userUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').optional(),
});

const passwordChangeSchema = z.object({
  current_password: z.string().min(8),
  new_password: z.string().min(8),
});

// Helper function to format user
function formatUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    first_name: row.first_name || '',
    last_name: row.last_name || '',
    phone: row.phone || '',
    role: row.role,
    is_verified: row.is_verified,
    created_at: row.created_at,
  };
}

// GET /api/users — list all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, email, role, is_verified, created_at FROM users ORDER BY created_at DESC'
    );
    return res.json(result.rows);
  } catch (error) {
    logger.error('Fetch users error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// POST /api/users — create a new user (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { email, password, role } = createUserSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();
    const userRole = role || 'user';
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'A user with this email already exists' });
    }

    const result = await query(
      'INSERT INTO users (email, password_hash, role, is_verified) VALUES ($1, $2, $3, TRUE) RETURNING id, email, role, is_verified, created_at',
      [normalizedEmail, passwordHash, userRole]
    );
    return res.json(result.rows[0]);
  } catch (error) {
    logger.error('Create user error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to create user' });
  }
});

// GET /api/users/:id — get single user (admin only)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, email, role, is_verified, created_at FROM users WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    logger.error('Fetch user error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// PUT /api/users/:id/role — update user role (admin only)
router.put('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = roleSchema.parse(req.body);

    const result = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role, is_verified, created_at',
      [role, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    logger.error('Update user role error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to update user role' });
  }
});

// DELETE /api/users/:id — delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// ============================================================================
// PERSONAL ACCOUNT ENDPOINTS (authenticated users)
// ============================================================================

// GET /api/users/me — Get current user profile
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(formatUser(result.rows[0]));
  } catch (error) {
    logger.error('Fetch user error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// PUT /api/users/me — Update current user profile
router.put('/me', requireAuth, async (req, res) => {
  try {
    const updates = userUpdateSchema.parse(req.body);

    let sql = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params = [];

    if (updates.first_name !== undefined) {
      params.push(updates.first_name);
      sql += `, first_name = $${params.length}`;
    }
    if (updates.last_name !== undefined) {
      params.push(updates.last_name);
      sql += `, last_name = $${params.length}`;
    }
    if (updates.phone !== undefined) {
      params.push(updates.phone);
      sql += `, phone = $${params.length}`;
    }

    params.push(req.user.id);
    sql += ` WHERE id = $${params.length} RETURNING *`;

    const result = await query(sql, params);
    return res.json(formatUser(result.rows[0]));
  } catch (error) {
    logger.error('Update user error:', { error: error.message, stack: error.stack });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// POST /api/users/me/change-password — Change password
router.post('/me/change-password', requireAuth, async (req, res) => {
  try {
    const { current_password, new_password } = passwordChangeSchema.parse(req.body);

    // Fetch current password hash
    const userResult = await query('SELECT password_hash, email FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, userResult.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const newHash = await bcrypt.hash(new_password, 10);

    // Update password
    await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [newHash, req.user.id]);

    // Send confirmation email
    try {
      await sendEmail({
        to: userResult.rows[0].email,
        subject: 'Password Changed - Arihant Account',
        text: 'Your password has been changed successfully. If this was not you, please contact support immediately.',
        html: '<p>Your password has been changed successfully.</p><p>If this was not you, please <a href="https://support.arihant.com">contact support</a> immediately.</p>',
      });
    } catch (emailError) {
      logger.warn('Password change confirmation email not sent:', { error: emailError.message });
    }

    return res.json({ message: 'Password changed successfully. Confirmation email sent.' });
  } catch (error) {
    logger.error('Change password error:', { error: error.message, stack: error.stack });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// POST /api/users/me/delete-account — Delete user account
router.post('/me/delete-account', requireAuth, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }

    // Verify password
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    // Delete user
    await query('DELETE FROM users WHERE id = $1', [req.user.id]);
    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    logger.error('Delete account error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to delete account' });
  }
});

// ============================================================================
// WISHLIST ENDPOINTS
// ============================================================================

// GET /api/users/wishlist — Get user's wishlist
router.get('/wishlist', requireAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT p.* FROM products p
       INNER JOIN wishlist w ON p.id = w.product_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (error) {
    logger.error('Fetch wishlist error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch wishlist' });
  }
});

// POST /api/users/wishlist/:product_id — Add to wishlist
router.post('/wishlist/:product_id', requireAuth, async (req, res) => {
  try {
    const { product_id } = req.params;

    // Check if product exists
    const productResult = await query('SELECT id FROM products WHERE id = $1', [product_id]);
    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Add to wishlist
    await query(
      `INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [req.user.id, product_id]
    );

    return res.status(201).json({ message: 'Added to wishlist' });
  } catch (error) {
    logger.error('Add to wishlist error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to add to wishlist' });
  }
});

// DELETE /api/users/wishlist/:product_id — Remove from wishlist
router.delete('/wishlist/:product_id', requireAuth, async (req, res) => {
  try {
    const { product_id } = req.params;

    await query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [req.user.id, product_id]);
    return res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    logger.error('Remove from wishlist error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to remove from wishlist' });
  }
});

// CHECK /api/users/wishlist/:product_id — Check if product in wishlist
router.get('/wishlist/check/:product_id', requireAuth, async (req, res) => {
  try {
    const { product_id } = req.params;
    const result = await query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [req.user.id, product_id]
    );
    return res.json({ in_wishlist: result.rows.length > 0 });
  } catch (error) {
    logger.error('Check wishlist error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to check wishlist' });
  }
});

export default router;
