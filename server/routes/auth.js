import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { z } from 'zod';
import { query } from '../db.js';
import { sendEmail } from '../utils/email.js';
import logger from '../utils/logger.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const OTP_EXPIRY_MINUTES = 15;
const RESET_EXPIRY_MINUTES = 30;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`;
const googleOAuthConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET);

// ----------------------------------------------------------------------------
// GOOGLE OAUTH 2.0 — Passport.js Strategy
// ----------------------------------------------------------------------------
if (googleOAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase() : null;
          if (!email) {
            return done(new Error('Google account does not have an email address.'));
          }

          const googleId = String(profile.id);
          const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || '';
          const lastName = profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '';
          const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

          // 1) Try to find existing user by google_id
          let userResult = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);
          let user = userResult.rows[0];

          if (!user) {
            // 2) Try to find by email (link Google to existing local account)
            const emailResult = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
            const existingUser = emailResult.rows[0];

            if (existingUser) {
              // Link the Google identity to the existing account
              userResult = await query(
                `UPDATE users SET google_id = $1, avatar_url = COALESCE($2, avatar_url),
                   first_name = COALESCE(NULLIF($3, ''), first_name),
                   last_name = COALESCE(NULLIF($4, ''), last_name),
                   auth_provider = 'google', is_verified = true, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5 RETURNING *`,
                [googleId, avatarUrl, firstName, lastName, existingUser.id]
              );
              user = userResult.rows[0];
            } else {
              // 3) Create a brand new account
              userResult = await query(
                `INSERT INTO users (email, password_hash, role, is_verified, google_id, first_name, last_name, avatar_url, auth_provider)
                 VALUES ($1, '', 'user', TRUE, $2, $3, $4, $5, 'google')
                 RETURNING *`,
                [email, googleId, firstName, lastName, avatarUrl]
              );
              user = userResult.rows[0];
            }
          }

          return done(null, user);
        } catch (err) {
          logger.error('Google OAuth profile handling error:', { error: err.message, stack: err.stack });
          return done(err, null);
        }
      }
    )
  );
}

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
  const confirmMessage = `Use the following code to verify your Arihant account: ${code}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`;
  await sendEmail({
    to: email,
    subject: 'Verify your Arihant account',
    text: confirmMessage,
    html: `<p>${confirmMessage}</p>`,
  });
}

async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
  const message = `Click the link below to reset your password. This link expires in ${RESET_EXPIRY_MINUTES} minutes.`;
  await sendEmail({
    to: email,
    subject: 'Reset your Arihant password',
    text: `${message}\n\n${resetUrl}`,
    html: `<p>${message}</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
}

async function sendPasswordChangeConfirmationEmail(email) {
  const message = `Your Arihant account password has been changed successfully. If you did not make this change, please contact support immediately.`;
  await sendEmail({
    to: email,
    subject: 'Password Changed - Arihant Account',
    text: message,
    html: `<p>${message}</p><p>If this was not you, please reset your password or contact support.</p>`,
  });
}

async function getUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
  return rows[0];
}

router.post('/register', async (req, res) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);
    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user with is_verified = FALSE (must verify via OTP)
    const userResult = await query(
      'INSERT INTO users (email, password_hash, role, is_verified) VALUES ($1, $2, $3, FALSE) RETURNING id, email, role',
      [normalizedEmail, passwordHash, 'user']
    );
    const newUser = userResult.rows[0];

// Create and send verification OTP
    const code = createVerificationCode();
    await query(
      `INSERT INTO email_verifications (user_id, email, code, expires_at, used)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '${OTP_EXPIRY_MINUTES} minutes', false)`,
      [newUser.id, normalizedEmail, code]
    );

    // Email sending must not fail the registration if SMTP is down.
    try {
      await sendVerificationEmail(normalizedEmail, code);
    } catch (emailError) {
      logger.warn('Verification email not sent during registration:', { error: emailError.message });
    }

    return res.status(201).json({
      message: 'Registration successful. Please verify your email with the OTP sent to your inbox.',
      user: { id: newUser.id, email: newUser.email, role: newUser.role, is_verified: false }
    });
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

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({ 
        message: 'Email not verified. Please check your inbox for the verification code.',
        needsVerification: true,
        email: user.email 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    return res.json({ access_token: token, user: { id: user.id, email: user.email, role: user.role || 'user', is_verified: true } });
  } catch (error) {
    logger.error('Login error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Login failed' });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otpCode } = verifyOtpSchema.parse(req.body);
    const normalizedEmail = normalizeEmail(email);

    const result = await query(
      `SELECT * FROM email_verifications
       WHERE email = $1 AND code = $2 AND expires_at > CURRENT_TIMESTAMP AND used = false
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail, otpCode]
    );
    const verification = result.rows[0];

    if (!verification) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    await query('UPDATE users SET is_verified = true WHERE id = $1', [verification.user_id]);
    await query('UPDATE email_verifications SET used = true WHERE id = $1', [verification.id]);

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

    await query(
      `INSERT INTO email_verifications (user_id, email, code, expires_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP + INTERVAL '${OTP_EXPIRY_MINUTES} minutes')
       ON CONFLICT (email) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at, used = false`,
      [user.id, normalizedEmail, code]
    );

try {
      await sendVerificationEmail(normalizedEmail, code);
    } catch (emailError) {
      logger.warn('Verification email not sent on resend:', { error: emailError.message });
    }
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

await query(
        `INSERT INTO password_resets (user_id, email, token, expires_at, used)
         VALUES ($1, $2, $3, $4, false)`,
        [user.id, normalizedEmail, token, expiresAt]
      );

      try {
        await sendPasswordResetEmail(normalizedEmail, token);
      } catch (emailError) {
        logger.warn('Password reset email not sent:', { error: emailError.message });
      }
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

    const result = await query(
      `SELECT * FROM password_resets
       WHERE token = $1 AND expires_at > CURRENT_TIMESTAMP AND used = false
       ORDER BY created_at DESC LIMIT 1`,
      [resetToken]
    );
    const resetEntry = result.rows[0];

    if (!resetEntry) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, resetEntry.user_id]);
    await query('UPDATE password_resets SET used = true WHERE id = $1', [resetEntry.id]);

    // Send confirmation email
    await sendPasswordChangeConfirmationEmail(resetEntry.email);

    return res.json({ success: true, message: 'Password reset successfully. Confirmation email sent.' });
  } catch (error) {
    logger.error('Reset password error:', { error: error.message, stack: error.stack });
    res.status(400).json({ message: error.message || 'Failed to reset password' });
  }
});

// ----------------------------------------------------------------------------
// GOOGLE OAUTH ROUTES
// ----------------------------------------------------------------------------

// GET /api/auth/oauth-config — tells the frontend whether Google OAuth is ready
router.get('/oauth-config', (req, res) => {
  res.json({
    google: {
      isConfigured: googleOAuthConfigured,
      authUrl: googleOAuthConfigured ? '/api/auth/google' : null,
    },
  });
});

// GET /api/auth/google — start the Google OAuth consent flow
router.get(
  '/google',
  (req, res, next) => {
    if (!googleOAuthConfigured) {
      return res.status(503).json({
        message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      });
    }
    next();
  },
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// GET /api/auth/google/callback — Google redirects here after consent
router.get(
  '/google/callback',
  (req, res, next) => {
    if (!googleOAuthConfigured) {
      return res.status(503).json({
        message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
      });
    }
    next();
  },
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?oauth_error=1` }),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.redirect(`${FRONTEND_URL}/login?oauth_error=1`);
      }

      // Always re-fetch the freshest user from DB
      const freshResult = await query('SELECT * FROM users WHERE id = $1', [user.id]);
      const freshUser = freshResult.rows[0];
      if (!freshUser) {
        return res.redirect(`${FRONTEND_URL}/login?oauth_error=1`);
      }

      const token = signToken(freshUser);

// Redirect back to the frontend callback page which stores the token.
      // Use a URL fragment (#access_token=) rather than a query string so the
      // JWT is not exposed in server logs / browser history / referrer headers.
      return res.redirect(
        `${FRONTEND_URL}/oauth-callback#access_token=${encodeURIComponent(token)}&user=${encodeURIComponent(
          JSON.stringify({
            id: freshUser.id,
            email: freshUser.email,
            role: freshUser.role || 'user',
            is_verified: freshUser.is_verified,
            first_name: freshUser.first_name,
            last_name: freshUser.last_name,
            avatar_url: freshUser.avatar_url,
          })
        )}`
      );
    } catch (error) {
      logger.error('Google OAuth callback error:', { error: error.message, stack: error.stack });
      return res.redirect(`${FRONTEND_URL}/login?oauth_error=1`);
    }
  }
);

router.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await query(
      'SELECT id, email, role, is_verified, first_name, last_name, phone, avatar_url, auth_provider, created_at FROM users WHERE id = $1',
      [decoded.id]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(401).json({ message: 'Token expired or invalid' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
export { googleOAuthConfigured };
