import express from 'express';
import crypto from 'crypto';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

const IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY || '';
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || '';
const IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || '';

const isImageKitConfigured = Boolean(
  IMAGEKIT_PUBLIC_KEY && IMAGEKIT_PRIVATE_KEY && IMAGEKIT_URL_ENDPOINT
);

/**
 * Generates ImageKit client-side upload authentication parameters.
 * See: https://imagekit.io/docs/api-reference/upload-file/client-side-file-upload#how-to-implement-authenticationendpoint
 *
 * expire   – Unix timestamp (seconds) 30 min from now
 * token    – random UUID
 * signature – HMAC-SHA1(token + expire, privateKey)
 */
function generateImageKitAuthParams() {
  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 30 * 60; // 30 minutes
  const signature = crypto
    .createHmac('sha1', IMAGEKIT_PRIVATE_KEY)
    .update(token + expire)
    .digest('hex');
  return { token, expire, signature };
}

/**
 * GET /api/upload/imagekit-auth
 * Returns a short-lived authentication token so the browser can upload
 * directly to ImageKit without routing the binary through this server.
 * Admin-only: only the admin product panel uses this.
 */
router.get('/imagekit-auth', authenticateToken, requireAdmin, (req, res) => {
  if (!isImageKitConfigured) {
    return res.status(503).json({
      message:
        'ImageKit is not configured. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your environment.',
      configured: false,
    });
  }

  try {
    const authParams = generateImageKitAuthParams();
    return res.json({
      ...authParams,
      publicKey: IMAGEKIT_PUBLIC_KEY,
      urlEndpoint: IMAGEKIT_URL_ENDPOINT,
      configured: true,
    });
  } catch (error) {
    logger.error('ImageKit auth generation error:', { error: error.message });
    res.status(500).json({ message: 'Failed to generate upload token' });
  }
});

/**
 * GET /api/upload/config
 * Returns whether ImageKit is configured (non-sensitive).
 * Admin-only.
 */
router.get('/config', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    imagekit: {
      configured: isImageKitConfigured,
      urlEndpoint: isImageKitConfigured ? IMAGEKIT_URL_ENDPOINT : null,
      publicKey: isImageKitConfigured ? IMAGEKIT_PUBLIC_KEY : null,
    },
  });
});

export default router;
