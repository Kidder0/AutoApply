import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { Pool } = pg;

let pool: pg.Pool | null = null;

export async function initializeDatabase() {
  try {
    pool = new Pool({
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'jobs_db',
    });

    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connected');
    client.release();

    // Initialize schema
    await initializeSchema();
    return pool;
  } catch (err) {
    console.error('❌ Database connection failed:', err);
    throw err;
  }
}

async function initializeSchema() {
  if (!pool) throw new Error('Database not initialized');
  
  try {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    const statements = schema.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      await pool.query(statement);
    }
    
    console.log('✅ Database schema initialized');
  } catch (err) {
    console.error('❌ Schema initialization failed:', err);
    throw err;
  }
}

export function getPool(): pg.Pool {
  if (!pool) throw new Error('Database not initialized. Call initializeDatabase first.');
  return pool;
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('✅ Database connection closed');
  }
}
