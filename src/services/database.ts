// Database connection manager for PostgreSQL
import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  salary_min?: number;
  salary_max?: number;
  employment_type?: string;
  remote_type?: 'remote' | 'hybrid' | 'onsite';
  apply_url: string;
  source: string;
  source_url: string;
  external_id: string;
  content_hash: string;
  posted_date: Date;
  discovered_date: Date;
  is_duplicate?: boolean;
  parent_job_id?: string;
  is_new: boolean;
  embedding?: number[];
}

export interface Application {
  id: string;
  job_id: string;
  user_id: string;
  resume_used: string;
  status: 'applied' | 'reviewing' | 'rejected' | 'offer' | 'withdrawn';
  applied_at: Date;
  updated_at: Date;
  recruiter_feedback?: string;
}

export interface IngestionMetric {
  id: string;
  timestamp: Date;
  jobs_discovered: number;
  new_jobs_added: number;
  duplicates_removed: number;
  failed_crawls: number;
  sources: string[];
}

export class DatabaseService {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('🔴 Unexpected error on idle client', err);
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      console.log('✅ PostgreSQL connected successfully');
      client.release();
    } catch (err) {
      console.error('❌ Failed to connect to PostgreSQL:', err);
      throw err;
    }
  }

  async initializeSchema(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Jobs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS jobs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          company VARCHAR(255) NOT NULL,
          location VARCHAR(255),
          description TEXT,
          salary_min INTEGER,
          salary_max INTEGER,
          employment_type VARCHAR(50),
          remote_type VARCHAR(50),
          apply_url VARCHAR(1024) NOT NULL,
          source VARCHAR(100) NOT NULL,
          source_url VARCHAR(1024),
          external_id VARCHAR(500) UNIQUE,
          content_hash VARCHAR(64),
          posted_date TIMESTAMP,
          discovered_date TIMESTAMP DEFAULT NOW(),
          is_duplicate BOOLEAN DEFAULT FALSE,
          parent_job_id UUID REFERENCES jobs(id),
          is_new BOOLEAN DEFAULT TRUE,
          embedding FLOAT8[],
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          INDEX idx_company (company),
          INDEX idx_source (source),
          INDEX idx_is_new (is_new),
          INDEX idx_discovered_date (discovered_date)
        )
      `);

      // Applications table
      await client.query(`
        CREATE TABLE IF NOT EXISTS applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          job_id UUID NOT NULL REFERENCES jobs(id),
          user_id VARCHAR(255) NOT NULL,
          resume_used TEXT,
          status VARCHAR(50) DEFAULT 'applied',
          applied_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          recruiter_feedback TEXT,
          INDEX idx_user_id (user_id),
          INDEX idx_job_id (job_id),
          INDEX idx_status (status)
        )
      `);

      // Job sources table
      await client.query(`
        CREATE TABLE IF NOT EXISTS job_sources (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          type VARCHAR(50),
          api_endpoint VARCHAR(1024),
          api_key VARCHAR(1024),
          enabled BOOLEAN DEFAULT TRUE,
          last_crawl TIMESTAMP,
          crawl_interval_hours INTEGER DEFAULT 2,
          created_at TIMESTAMP DEFAULT NOW(),
          INDEX idx_enabled (enabled)
        )
      `);

      // Ingestion metrics table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ingestion_metrics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          timestamp TIMESTAMP DEFAULT NOW(),
          jobs_discovered INTEGER,
          new_jobs_added INTEGER,
          duplicates_removed INTEGER,
          failed_crawls INTEGER,
          sources TEXT[]
        )
      `);

      console.log('✅ Database schema initialized');
    } catch (err) {
      console.error('❌ Failed to initialize schema:', err);
      throw err;
    } finally {
      client.release();
    }
  }

  async insertJob(job: Job): Promise<string> {
    const query = `
      INSERT INTO jobs 
        (title, company, location, description, salary_min, salary_max, 
         employment_type, remote_type, apply_url, source, source_url, 
         external_id, content_hash, posted_date, is_new)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (external_id) DO NOTHING
      RETURNING id
    `;

    const client = await this.pool.connect();
    try {
      const result = await client.query(query, [
        job.title,
        job.company,
        job.location,
        job.description,
        job.salary_min,
        job.salary_max,
        job.employment_type,
        job.remote_type,
        job.apply_url,
        job.source,
        job.source_url,
        job.external_id,
        job.content_hash,
        job.posted_date,
        job.is_new,
      ]);

      return result.rows[0]?.id;
    } finally {
      client.release();
    }
  }

  async getJobs(limit = 100, offset = 0): Promise<Job[]> {
    const query = `
      SELECT * FROM jobs 
      WHERE is_duplicate = FALSE
      ORDER BY discovered_date DESC
      LIMIT $1 OFFSET $2
    `;

    const client = await this.pool.connect();
    try {
      const result = await client.query(query, [limit, offset]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getNewJobs(limit = 50): Promise<Job[]> {
    const query = `
      SELECT * FROM jobs 
      WHERE is_new = TRUE AND is_duplicate = FALSE
      ORDER BY discovered_date DESC
      LIMIT $1
    `;

    const client = await this.pool.connect();
    try {
      const result = await client.query(query, [limit]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async recordApplication(jobId: string, userId: string, resume: string): Promise<string> {
    const query = `
      INSERT INTO applications (job_id, user_id, resume_used)
      VALUES ($1, $2, $3)
      RETURNING id
    `;

    const client = await this.pool.connect();
    try {
      const result = await client.query(query, [jobId, userId, resume]);
      return result.rows[0].id;
    } finally {
      client.release();
    }
  }

  async recordMetric(metric: IngestionMetric): Promise<void> {
    const query = `
      INSERT INTO ingestion_metrics 
        (jobs_discovered, new_jobs_added, duplicates_removed, failed_crawls, sources)
      VALUES ($1, $2, $3, $4, $5)
    `;

    const client = await this.pool.connect();
    try {
      await client.query(query, [
        metric.jobs_discovered,
        metric.new_jobs_added,
        metric.duplicates_removed,
        metric.failed_crawls,
        metric.sources,
      ]);
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Singleton instance
let dbService: DatabaseService | null = null;

export function getDB(): DatabaseService {
  if (!dbService && process.env.DATABASE_URL) {
    dbService = new DatabaseService(process.env.DATABASE_URL);
  }
  return dbService!;
}

export async function initDB(): Promise<void> {
  const db = getDB();
  await db.connect();
  await db.initializeSchema();
}
