import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';
import { initDb } from './db.js';
import { seedDatabase } from './seed.js';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import inquiriesRouter from './routes/inquiries.js';
import newsletterRouter from './routes/newsletter.js';
import paymentsRouter from './routes/payments.js';
import usersRouter from './routes/users.js';
import customizationRulesRouter from './routes/customization-rules.js';
import categoriesRouter from './routes/categories.js';
import siteContentRouter from './routes/site-content.js';
import reviewsRouter from './routes/reviews.js';
import couponsRouter from './routes/coupons.js';
import reportsRouter from './routes/reports.js';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for production reverse proxies (Render, Vercel, Railway, Heroku, Cloudflare)
app.set('trust proxy', 1);

// CORS configuration - restrict to specific origins
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:5000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) or wildcard * or matching origin
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
}));

// Capture raw body for webhook signature verification BEFORE parsing JSON
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') {
    let rawBody = '';
    req.on('data', chunk => {
      rawBody += chunk.toString('utf8');
    });
    req.on('end', () => {
      req.rawBody = rawBody;
      next();
    });
  } else {
    next();
  }
});

app.use(express.json());

// Initialize Passport for Google OAuth
app.use(passport.initialize());

// Request logger with Winston
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent') || 'unknown',
    });
  });
  next();
});

// Cache control middleware for API responses
app.use('/api', (req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');

  // Cache product and category endpoints
  if (req.method === 'GET' && (req.path.startsWith('/products') || req.path.startsWith('/categories'))) {
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.set('ETag', `"${Date.now()}"`);
  } else if (req.method === 'GET') {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

const isLocalhostRequest = (req) => {
  const ip = req.ip || req.socket?.remoteAddress || '';
  const host = req.hostname || req.headers.host || '';
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === '::ffff:127.0.0.1' ||
    ip.includes('127.0.0.1') ||
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1')
  );
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalhostRequest,
  message: { message: 'Too many auth requests, please try again later.' },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isLocalhostRequest,
  message: { message: 'Too many requests, please try again later.' },
});

app.use('/api/auth', authLimiter);
app.use('/api/inquiries', generalLimiter);
app.use('/api/newsletter', generalLimiter);
app.use('/api/payments', generalLimiter);
app.use('/api/products', generalLimiter);
app.use('/api/categories', generalLimiter);
app.use('/api/customization-rules', generalLimiter);
app.use('/api/site-content', generalLimiter);
app.use('/api/users', generalLimiter);
app.use('/api/orders', generalLimiter);
app.use('/api/reviews', generalLimiter);
app.use('/api/coupons', generalLimiter);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/customization-rules', customizationRulesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/site-content', siteContentRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/reports', reportsRouter);

// Swagger / OpenAPI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Arihant Stationery API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend assets in production when available
const staticPath = path.join(__dirname, '..', 'dist');

app.use(express.static(staticPath));

// Default 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API Endpoint Not Found' });
});

// Serve frontend fallback for client-side routing
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled Server Error:', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Start Server & Init Database
async function startServer() {
  try {
    // Validate all required environment variables
    const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(
        `CRITICAL: Missing required environment variables: ${missingVars.join(', ')}. ` +
        `Please configure them in .env or as system environment variables.`
      );
    }

    // Warn if optional but recommended env vars are missing
    const recommendedVars = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'SMTP_HOST', 'SMTP_USER'];
    const missingRecommended = recommendedVars.filter(varName => !process.env[varName]);
    if (missingRecommended.length > 0) {
      logger.warn(`Missing optional environment variables: ${missingRecommended.join(', ')}. Some features may not work.`);
    }

    await initDb();
    await seedDatabase();

    app.listen(PORT, () => {
      logger.info(`Arihant Express Backend Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', { error: err.message });
    process.exit(1);
  }
}

startServer();
