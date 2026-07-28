import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool = null;
let isPgAvailable = false;
const isProduction = process.env.NODE_ENV === 'production';

const connectionString = process.env.DATABASE_URL;
const forceMemoryStore = process.env.USE_MEMORY_STORE === 'true';
const allowMemoryFallback = process.env.ALLOW_MEMORY_FALLBACK !== 'false';

// Test if DATABASE_URL is provided and not default placeholder
const isValidConnectionString = connectionString &&
  !connectionString.includes('your_password') &&
  !connectionString.includes('ep-example-123456');

if (!forceMemoryStore && isValidConnectionString) {
  try {
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=require') || connectionString.includes('neon.tech')
        ? { rejectUnauthorized: false }
        : false,
    });
    isPgAvailable = true;
    console.log('Configured Neon PostgreSQL Pool');
  } catch (err) {
    console.error('⚠️ Failed to initialize PG Pool:', err.message);
    if (isProduction || !allowMemoryFallback) {
      throw err;
    }
  }
} else {
  if (forceMemoryStore) {
    console.log('ℹ️ USE_MEMORY_STORE=true. Forcing in-memory store mode.');
  } else if (!allowMemoryFallback) {
    if (isProduction) {
      throw new Error('Production requires a valid DATABASE_URL. Please set DATABASE_URL.');
    } else {
      throw new Error('Memory fallback disabled (ALLOW_MEMORY_FALLBACK=false) but no valid DATABASE_URL provided.');
    }
  } else {
    console.log('ℹ️ No valid DATABASE_URL provided. Running with robust mock state layer.');
  }
}


const memoryStore = {
  users: [],
  products: [],
  categories: [],
  orders: [],
  b2b_inquiries: [],
  newsletter_subscriptions: [],
  email_verifications: [],
  password_resets: [],
  customizationRules: null,
};

// Initialize schema on PostgreSQL if connected
export async function initDb() {
  if (isPgAvailable && pool) {
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(sql);
      console.log('✅ PostgreSQL Schema Initialized Successfully');
    } catch (err) {
      console.warn('⚠️ Error initializing PostgreSQL schema:', err.message);
      isPgAvailable = false;
    }
  }
}

export function getMemoryStore() {
  return memoryStore;
}

export function isDbConnected() {
  if (forceMemoryStore) return false;
  return isPgAvailable;
}

export const query = async (text, params = []) => {
  if (isPgAvailable && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  }
  throw new Error('Database pool unavailable');
};

export default { query, initDb, getMemoryStore, isDbConnected };
