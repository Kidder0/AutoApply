import { getPool } from '../database/connection.js';
import { NormalizedJob, calculateJobSimilarity } from './normalization.js';

export interface JobRecord {
  id: number;
  externalId: string;
  title: string;
  company: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  employmentType: string | null;
  remoteType: string | null;
  description: string | null;
  applyUrl: string;
  postedDate: Date | null;
  source: string;
  sourceUrl: string | null;
  isNew: boolean;
  isDuplicate: boolean;
  canonicalJobId: number | null;
  hash: string;
  createdAt: Date;
  updatedAt: Date;
}

export class JobRepository {
  /**
   * Insert a new job into the database
   */
  async insertJob(job: NormalizedJob): Promise<JobRecord> {
    const pool = getPool();
    const query = `
      INSERT INTO jobs (
        external_id, title, company, location, salary_min, salary_max,
        salary_currency, employment_type, remote_type, description,
        apply_url, posted_date, source, source_url, hash, is_new
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;

    const result = await pool.query(query, [
      job.externalId,
      job.title,
      job.company,
      job.location,
      job.salaryMin,
      job.salaryMax,
      job.salaryCurrency,
      job.employmentType,
      job.remoteType,
      job.description,
      job.applyUrl,
      job.postedDate,
      job.source,
      job.sourceUrl,
      job.hash,
      true, // is_new
    ]);

    return this.rowToRecord(result.rows[0]);
  }

  /**
   * Check if a job already exists by external ID
   */
  async findByExternalId(externalId: string): Promise<JobRecord | null> {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM jobs WHERE external_id = $1',
      [externalId]
    );

    return result.rows.length > 0 ? this.rowToRecord(result.rows[0]) : null;
  }

  /**
   * Find duplicate jobs by hash with similarity scoring
   */
  async findPotentialDuplicates(job: NormalizedJob, threshold = 0.8): Promise<{ job: JobRecord; similarity: number }[]> {
    const pool = getPool();
    
    // First find by hash
    const hashResults = await pool.query(
      'SELECT * FROM jobs WHERE hash = $1 AND is_duplicate = FALSE LIMIT 50',
      [job.hash]
    );

    if (hashResults.rows.length > 0) {
      return hashResults.rows.map(row => ({
        job: this.rowToRecord(row),
        similarity: 1.0,
      }));
    }

    // If no hash matches, search by title and company similarity
    const similarQuery = `
      SELECT * FROM jobs 
      WHERE (
        LOWER(title) LIKE LOWER($1) OR 
        LOWER(company) = LOWER($2)
      )
      AND is_duplicate = FALSE
      AND posted_date > NOW() - INTERVAL '90 days'
      LIMIT 50
    `;

    const titlePattern = `%${job.title.split(' ').slice(0, 2).join('%')}%`;
    const results = await pool.query(similarQuery, [titlePattern, job.company]);

    const candidates = results.rows.map(row => {
      const candidate = this.rowToRecord(row);
      const tempCandidate: NormalizedJob = {
        externalId: candidate.externalId,
        title: candidate.title,
        company: candidate.company,
        location: candidate.location,
        salaryMin: candidate.salaryMin,
        salaryMax: candidate.salaryMax,
        salaryCurrency: candidate.salaryCurrency,
        employmentType: candidate.employmentType,
        remoteType: candidate.remoteType,
        description: candidate.description,
        applyUrl: candidate.applyUrl,
        postedDate: candidate.postedDate,
        source: candidate.source,
        sourceUrl: candidate.sourceUrl,
        hash: candidate.hash,
      };

      const similarity = calculateJobSimilarity(job, tempCandidate);
      return { job: candidate, similarity };
    });

    return candidates.filter(c => c.similarity >= threshold);
  }

  /**
   * Mark a job as duplicate and link it to canonical
   */
  async markAsDuplicate(jobId: number, canonicalJobId: number, similarity: number): Promise<void> {
    const pool = getPool();
    
    await pool.query(
      `UPDATE jobs SET is_duplicate = TRUE, canonical_job_id = $1, is_new = FALSE
       WHERE id = $2`,
      [canonicalJobId, jobId]
    );

    // Record the duplicate relationship
    const primaryId = Math.min(canonicalJobId, jobId);
    const duplicateId = Math.max(canonicalJobId, jobId);

    await pool.query(
      `INSERT INTO job_duplicates (primary_job_id, duplicate_job_id, similarity_score)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [primaryId, duplicateId, similarity]
    );
  }

  /**
   * Get new jobs (is_new = true)
   */
  async getNewJobs(limit = 50): Promise<JobRecord[]> {
    const pool = getPool();
    const result = await pool.query(
      `SELECT * FROM jobs WHERE is_new = TRUE AND is_duplicate = FALSE
       ORDER BY posted_date DESC LIMIT $1`,
      [limit]
    );

    return result.rows.map(r => this.rowToRecord(r));
  }

  /**
   * Get all jobs with filtering
   */
  async getJobs(filter: {
    company?: string;
    location?: string;
    remoteType?: string;
    source?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ jobs: JobRecord[]; total: number }> {
    const pool = getPool();
    
    let query = 'SELECT * FROM jobs WHERE is_duplicate = FALSE';
    const params: any[] = [];
    let paramCount = 1;

    if (filter.company) {
      query += ` AND LOWER(company) LIKE LOWER($${paramCount})`;
      params.push(`%${filter.company}%`);
      paramCount++;
    }

    if (filter.location) {
      query += ` AND LOWER(location) LIKE LOWER($${paramCount})`;
      params.push(`%${filter.location}%`);
      paramCount++;
    }

    if (filter.remoteType) {
      query += ` AND remote_type = $${paramCount}`;
      params.push(filter.remoteType);
      paramCount++;
    }

    if (filter.source) {
      query += ` AND source = $${paramCount}`;
      params.push(filter.source);
      paramCount++;
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM (${query}) as subquery`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    query += ` ORDER BY posted_date DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(filter.limit || 50, filter.offset || 0);

    const result = await pool.query(query, params);
    return {
      jobs: result.rows.map(r => this.rowToRecord(r)),
      total,
    };
  }

  /**
   * Get a single job by ID
   */
  async getJobById(id: number): Promise<JobRecord | null> {
    const pool = getPool();
    const result = await pool.query('SELECT * FROM jobs WHERE id = $1', [id]);

    return result.rows.length > 0 ? this.rowToRecord(result.rows[0]) : null;
  }

  /**
   * Mark jobs as no longer new after processing
   */
  async markJobsAsProcessed(jobIds: number[]): Promise<void> {
    const pool = getPool();
    
    if (jobIds.length === 0) return;

    const placeholders = jobIds.map((_, i) => `$${i + 1}`).join(',');
    await pool.query(
      `UPDATE jobs SET is_new = FALSE, updated_at = CURRENT_TIMESTAMP
       WHERE id IN (${placeholders})`,
      jobIds
    );
  }

  /**
   * Update job with embedding vector
   */
  async updateJobEmbedding(jobId: number, embedding: number[]): Promise<void> {
    const pool = getPool();
    const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);
    
    await pool.query(
      'UPDATE jobs SET embedding = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [embeddingBuffer, jobId]
    );
  }

  /**
   * Semantic search using embeddings (requires pgvector extension)
   */
  async semanticSearch(embedding: number[], limit = 20): Promise<JobRecord[]> {
    const pool = getPool();
    const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);
    
    const result = await pool.query(
      `SELECT * FROM jobs 
       WHERE is_duplicate = FALSE
       ORDER BY embedding <-> $1 LIMIT $2`,
      [embeddingBuffer, limit]
    );

    return result.rows.map(r => this.rowToRecord(r));
  }

  private rowToRecord(row: any): JobRecord {
    return {
      id: row.id,
      externalId: row.external_id,
      title: row.title,
      company: row.company,
      location: row.location,
      salaryMin: row.salary_min,
      salaryMax: row.salary_max,
      salaryCurrency: row.salary_currency,
      employmentType: row.employment_type,
      remoteType: row.remote_type,
      description: row.description,
      applyUrl: row.apply_url,
      postedDate: row.posted_date,
      source: row.source,
      sourceUrl: row.source_url,
      isNew: row.is_new,
      isDuplicate: row.is_duplicate,
      canonicalJobId: row.canonical_job_id,
      hash: row.hash,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
