import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is missing in environment variables. Please configure DATABASE_URL in server/.env');
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=require') || connectionString.includes('neon.tech')
    ? { rejectUnauthorized: false }
    : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL Pool Error:', err.message);
});

// Initialize schema on PostgreSQL
// Run only once on first startup or when schema needs to be reset
export async function initDb() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Execute the whole schema as a single query.
    // IMPORTANT: The schema contains dollar-quoted strings ($$ ... $$) in trigger
    // functions and JSON seeds. Splitting on ';' would corrupt those strings and
    // cause "unterminated dollar-quoted string" errors. node-postgres runs a
    // no-parameter query through the simple query protocol, which correctly
    // handles multiple statements and dollar-quoting.
    await pool.query(sql);

    console.log('✅ PostgreSQL Schema Initialized Successfully');
  } catch (err) {
    console.error('❌ Failed to initialize PostgreSQL schema:', err.message);
    throw err;
  }
}

export const query = (text, params = []) => pool.query(text, params);

export default { query, initDb, pool };
