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
  first_name: z.string().max(100).optional(),
  last_name: z.string().max(100).optional(),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits').or(z.literal('')).optional(),
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
    avatar_url: row.avatar_url || null,
    auth_provider: row.auth_provider || 'local',
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
// SAVED ADDRESSES ENDPOINTS (authenticated users)
// ============================================================================

const addressSchema = z.object({
  label: z.string().max(100).optional(),
  full_name: z.string().min(1, 'Full name is required'),
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  is_default: z.boolean().optional(),
});

function formatAddress(row) {
  if (!row) return null;
  return {
    id: row.id,
    label: row.label || 'Home',
    full_name: row.full_name || '',
    phone: row.phone || '',
    address: row.address || '',
    city: row.city || '',
    state: row.state || '',
    pincode: row.pincode || '',
    is_default: Boolean(row.is_default),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// GET /api/users/me/addresses — List current user's saved addresses
router.get('/me/addresses', requireAuth, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC',
      [req.user.id]
    );
    return res.json(result.rows.map(formatAddress));
  } catch (error) {
    logger.error('Fetch addresses error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch addresses' });
  }
});

// POST /api/users/me/addresses — Create a new saved address
router.post('/me/addresses', requireAuth, async (req, res) => {
  try {
    const data = addressSchema.parse(req.body);
    const {
      label = 'Home',
      full_name,
      phone,
      address,
      city,
      state,
      pincode,
      is_default = false,
    } = data;

    // If this is set as default, clear other defaults for this user
    if (is_default) {
      await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    } else {
      // If user has no addresses yet, make the first one default
      const countResult = await query('SELECT COUNT(*)::int AS count FROM addresses WHERE user_id = $1', [req.user.id]);
      const count = countResult.rows[0]?.count || 0;
      if (count === 0) {
        // this will become the default
        // handled below
      }
    }

    const result = await query(
      `INSERT INTO addresses (user_id, label, full_name, phone, address, city, state, pincode, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, label, full_name, phone, address, city, state, pincode, is_default]
    );

    const newAddress = result.rows[0];
    // If this is the first address, make it default
    if (!is_default) {
      const countResult = await query('SELECT COUNT(*)::int AS count FROM addresses WHERE user_id = $1', [req.user.id]);
      const count = countResult.rows[0]?.count || 0;
      if (count === 1) {
        await query('UPDATE addresses SET is_default = true WHERE id = $1', [newAddress.id]);
        newAddress.is_default = true;
      }
    }

    return res.status(201).json(formatAddress(newAddress));
  } catch (error) {
    logger.error('Create address error:', { error: error.message, stack: error.stack });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid address', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to save address' });
  }
});

// PUT /api/users/me/addresses/:id — Update a saved address
router.put('/me/addresses/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = addressSchema.partial().parse(req.body);

    // Verify ownership
    const existing = await query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    let sql = 'UPDATE addresses SET updated_at = CURRENT_TIMESTAMP';
    const params = [];
    const fields = ['label', 'full_name', 'phone', 'address', 'city', 'state', 'pincode', 'is_default'];
    for (const field of fields) {
      if (data[field] !== undefined) {
        params.push(data[field]);
        sql += `, ${field} = $${params.length}`;
      }
    }
    params.push(id);
    sql += ` WHERE id = $${params.length} RETURNING *`;

    // If setting as default, unset others
    if (data.is_default) {
      await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    }

    const result = await query(sql, params);
    return res.json(formatAddress(result.rows[0]));
  } catch (error) {
    logger.error('Update address error:', { error: error.message, stack: error.stack });
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid address', errors: error.errors });
    }
    res.status(500).json({ message: 'Failed to update address' });
  }
});

// PUT /api/users/me/addresses/:id/default — Set an address as default
router.put('/me/addresses/:id/default', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.id]);
    await query('UPDATE addresses SET is_default = true WHERE id = $1', [id]);

    const result = await query('SELECT * FROM addresses WHERE id = $1', [id]);
    return res.json(formatAddress(result.rows[0]));
  } catch (error) {
    logger.error('Set default address error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to set default address' });
  }
});

// DELETE /api/users/me/addresses/:id — Delete a saved address
router.delete('/me/addresses/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    const wasDefault = existing.rows[0].is_default;
    await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    // If we deleted the default, promote the most recent remaining address
    if (wasDefault) {
      const remaining = await query(
        'SELECT id FROM addresses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [req.user.id]
      );
      if (remaining.rows.length > 0) {
        await query('UPDATE addresses SET is_default = true WHERE id = $1', [remaining.rows[0].id]);
      }
    }

    return res.json({ success: true, message: 'Address deleted' });
  } catch (error) {
    logger.error('Delete address error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to delete address' });
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

// ============================================================================
// ADMIN SINGLE-USER ENDPOINTS (admin only)
// NOTE: These must be registered AFTER the /me and /wishlist routes above so
// they don't shadow the personal account endpoints (e.g. GET /users/me).
// ============================================================================

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

// PUT /api/users/:id/verify — verify a user / bypass email verification (admin only)
router.put('/:id/verify', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE users SET is_verified = TRUE WHERE id = $1 RETURNING id, email, role, is_verified, created_at',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    logger.error('Verify user error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to verify user' });
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

export default router;
