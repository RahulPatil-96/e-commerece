import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { initDb, isDbConnected } from './db.js';
import { seedDatabase } from './seed.js';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import inquiriesRouter from './routes/inquiries.js';
import newsletterRouter from './routes/newsletter.js';
import paymentsRouter from './routes/payments.js';
import usersRouter from './routes/users.js';
import customizationRulesRouter from './routes/customization-rules.js';
import siteContentRouter from './routes/site-content.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - restrict to specific origins
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:5000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
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
app.use(express.json());

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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth requests, please try again later.' },
});

const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

app.use('/api/auth', authLimiter);
app.use('/api/inquiries', inquiryLimiter);
app.use('/api/newsletter', inquiryLimiter);
app.use('/api/payments', inquiryLimiter);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/inquiries', inquiriesRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/customization-rules', customizationRulesRouter);
app.use('/api/site-content', siteContentRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend assets in production when available
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required and must not be empty');
    }

    await initDb();
    if (process.env.NODE_ENV === 'production' && !isDbConnected()) {
      throw new Error('Production startup failed because database connection is unavailable');
    }
    await seedDatabase();

    app.listen(PORT, () => {
      logger.info(`Lekha Express Backend Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', { error: err.message });
    process.exit(1);
  }
}

startServer();
