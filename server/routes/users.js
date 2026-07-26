import express from 'express';
import { z } from 'zod';
import { query, isDbConnected, getMemoryStore } from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();
router.use(authenticateToken);

const roleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

// GET /api/users — list all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    if (isDbConnected()) {
      const result = await query(
        'SELECT id, email, role, is_verified, created_at FROM users ORDER BY created_at DESC'
      );
      return res.json(result.rows);
    }

    const memory = getMemoryStore();
    const users = memory.users.map(({ password_hash, ...u }) => u);
    return res.json(users);
  } catch (error) {
    logger.error('Fetch users error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /api/users/:id — get single user (admin only)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const result = await query(
        'SELECT id, email, role, is_verified, created_at FROM users WHERE id = $1',
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(result.rows[0]);
    }

    const memory = getMemoryStore();
    const user = memory.users.find((u) => String(u.id) === String(id));
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password_hash, ...safeUser } = user;
    return res.json(safeUser);
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

    if (isDbConnected()) {
      const result = await query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role, is_verified, created_at',
        [role, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json(result.rows[0]);
    }

    const memory = getMemoryStore();
    const idx = memory.users.findIndex((u) => String(u.id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    memory.users[idx].role = role;
    const { password_hash, ...safeUser } = memory.users[idx];
    return res.json(safeUser);
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

    if (isDbConnected()) {
      const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.json({ success: true, message: 'User deleted successfully' });
    }

    const memory = getMemoryStore();
    const idx = memory.users.findIndex((u) => String(u.id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    memory.users.splice(idx, 1);
    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', { error: error.message, stack: error.stack });
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

export default router;

