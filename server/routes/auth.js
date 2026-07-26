import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { query, isDbConnected, getMemoryStore } from '../db.js';
import { sendEmail } from '../utils/email.js';

import logger from '../utils/logger.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const OTP_EXPIRY_MINUTES = 15;
const RESET_EXPIRY_MINUTES = 30;

const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8) });
const verifyOtpSchema = z.object({ email: z.string().email(), otpCode: z.string().min(4).max(6) });
const resendOtpSchema = z.object({ email: z.string().email() });
const forgotPasswordSchema = z.object({ email: z.string().email() });
const resetPasswordSchema = z.object({ resetToken: z.string().min(20), newPassword: z.string().min(8) });

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function createVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createResetToken() {
  return crypto.randomBytes(24).toString('hex');
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
}

async function sendVerificationEmail(email, code) {
  const confirmMessage = `Use the following code to verify your Lekha account: ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
  await sendEmail({
    to: email,
    subject: 'Verify your Lekha account',
    text: confirmMessage,
    html: `<p>${confirmMessage}</p>`,
  });
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
  const message = `Click the link below to reset your password. This link expires in ${RESET_EXPIRY_MINUTES} minutes.`;
  await sendEmail({
    to: email,
    subject: 'Reset your Lekha password',
    text: `${message}\n\n${resetUrl}`,
    html: `<p>${message}</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

async function getUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (isDbConnected()) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    return rows[0];
  }

  const memory = getMemoryStore();
  return memory.users.find((user) => user.email === normalizedEmail);
}

router.post('/register', async (req, res) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);
    const passwordHash = await bcrypt.hash(password, 10);

    if (isDbConnected()) {
      const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const userResult = await query(
        'INSERT INTO users (email, password_hash, role, is_verified) VALUES ($1, $2, $3, FALSE) RETURNING id, email, role',
        [normalizedEmail, passwordHash, 'user']
      );
      const newUser = userResult.rows[0];
      const code = createVerificationCode();
      await query(
        `INSERT INTO email_verifications (user_id, email, code, expires_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '${OTP_EXPIRY_MINUTES} minutes')
         ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, used = false`,
        [newUser.id, normalizedEmail, code]
      );
      await sendVerificationEmail(normalizedEmail, code);
      return res.json({ success: true, message: 'Verification code sent to your email' });
    }

    const memory = getMemoryStore();
    if (memory.users.some((user) => user.email === normalizedEmail)) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const newUser = {
      id: memory.users.length + 1,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: 'user',
      is_verified: false,
      created_at: new Date().toISOString(),
    };
    memory.users.push(newUser);

    const code = createVerificationCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    memory.email_verifications = memory.email_verifications.filter((entry) => entry.email !== normalizedEmail);
    memory.email_verifications.push({
      id: memory.email_verifications.length + 1,
      user_id: newUser.id,
      email: normalizedEmail,
      code,
      expires_at: expiresAt,
      used: false,
      created_at: new Date().toISOString(),
    });
    await sendVerificationEmail(normalizedEmail, code);

    return res.json({ success: true, message: 'Verification code sent to your email' });
  } catch (error) {
    logger.error('Register error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);
    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.json({ access_token: token, user: { id: user.id, email: user.email, role: user.role || 'user' } });
  } catch (error) {
    logger.error('Login error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Login failed' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otpCode } = verifyOtpSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);

    let verification;
    if (isDbConnected()) {
      const result = await query(
        `SELECT * FROM email_verifications
         WHERE email = $1 AND code = $2 AND expires_at > CURRENT_TIMESTAMP AND used = false
         ORDER BY created_at DESC LIMIT 1`,
        [normalizedEmail, otpCode]
      );
      verification = result.rows[0];
    } else {
      const memory = getMemoryStore();
      verification = memory.email_verifications.find((item) => item.email === normalizedEmail && item.code === otpCode && !item.used && new Date(item.expires_at) > new Date());
    }

    if (!verification) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    if (isDbConnected()) {
      await query('UPDATE users SET is_verified = true WHERE id = $1', [verification.user_id]);
      await query('UPDATE email_verifications SET used = true WHERE id = $1', [verification.id]);
    } else {
      const memory = getMemoryStore();
      const user = memory.users.find((u) => u.id === verification.user_id);
      if (user) {
        user.is_verified = true;
      }
      verification.used = true;
    }

    const user = await getUserByEmail(normalizedEmail);
    const token = signToken(user);
    return res.json({ access_token: token, user: { id: user.id, email: user.email, role: user.role || 'user' } });
  } catch (error) {
    logger.error('Verify OTP error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Verification failed' });
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = resendOtpSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);
    const user = await getUserByEmail(normalizedEmail);
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, a code will be sent shortly.' });
    }

    const code = createVerificationCode();

    if (isDbConnected()) {
      await query(
        `INSERT INTO email_verifications (user_id, email, code, expires_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '${OTP_EXPIRY_MINUTES} minutes')
         ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, used = false`,
        [user.id, normalizedEmail, code]
      );
    } else {
      const memory = getMemoryStore();
      memory.email_verifications = memory.email_verifications.filter((entry) => entry.email !== normalizedEmail);
      memory.email_verifications.push({
        id: memory.email_verifications.length + 1,
        user_id: user.id,
        email: normalizedEmail,
        code,
        expires_at: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString(),
        used: false,
        created_at: new Date().toISOString(),
      });
    }

    await sendVerificationEmail(normalizedEmail, code);
    return res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    logger.error('Resend OTP error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to resend verification code' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);
    const user = await getUserByEmail(normalizedEmail);
    if (user) {
      const token = createResetToken();
      const expiresAt = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000).toISOString();

      if (isDbConnected()) {
        await query(
          `INSERT INTO password_resets (user_id, email, token, expires_at, used)
           VALUES ($1, $2, $3, $4, false)`,
          [user.id, normalizedEmail, token, expiresAt]
        );
      } else {
        const memory = getMemoryStore();
        memory.password_resets.push({
          id: memory.password_resets.length + 1,
          user_id: user.id,
          email: normalizedEmail,
          token,
          expires_at: expiresAt,
          used: false,
          created_at: new Date().toISOString(),
        });
      }

      await sendPasswordResetEmail(normalizedEmail, token);
    }

    return res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    logger.error('Forgot password error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to process password reset request' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = resetPasswordSchema.parse(req.body);
    let resetEntry;

    if (isDbConnected()) {
      const result = await query(
        `SELECT * FROM password_resets
         WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND used = false
         ORDER BY created_at DESC LIMIT 1`,
        [resetToken]
      );
      resetEntry = result.rows[0];
    } else {
      const memory = getMemoryStore();
      resetEntry = memory.password_resets.find((entry) => entry.token === resetToken && !entry.used && new Date(entry.expires_at) > new Date());
    }

    if (!resetEntry) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    if (isDbConnected()) {
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, resetEntry.user_id]);
      await query('UPDATE password_resets SET used = true WHERE id = $1', [resetEntry.id]);
    } else {
      const memory = getMemoryStore();
      const user = memory.users.find((userItem) => userItem.id === resetEntry.user_id);
      if (user) {
        user.password_hash = passwordHash;
      }
      resetEntry.used = true;
    }

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Reset password error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to reset password' });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ id: decoded.id, email: decoded.email, role: decoded.role });
  } catch (err) {
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
