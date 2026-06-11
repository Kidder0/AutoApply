import { getPool } from '../database/connection.js';

export interface CrawlLog {
  id: number;
  sourceId: number;
  crawlStartTime: Date;
  crawlEndTime: Date | null;
  jobsDiscovered: number;
  newJobsAdded: number;
  duplicatesRemoved: number;
  duplicatesMerged: number;
  failed: boolean;
  errorMessage: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
}

export class MetricsService {
  /**
   * Start a new crawl log
   */
  async startCrawl(sourceName: string): Promise<number> {
    const pool = getPool();

    // Get source ID
    const sourceResult = await pool.query(
      'SELECT id FROM job_sources WHERE name = $1',
      [sourceName]
    );

    if (sourceResult.rows.length === 0) {
      throw new Error(`Source not found: ${sourceName}`);
    }

    const sourceId = sourceResult.rows[0].id;

    // Create log entry
    const result = await pool.query(
      `INSERT INTO crawl_logs (source_id, status)
       VALUES ($1, $2)
       RETURNING id`,
      [sourceId, 'running']
    );

    return result.rows[0].id;
  }

  /**
   * End a crawl log with metrics
   */
  async endCrawl(logId: number, metrics: {
    jobsDiscovered: number;
    newJobsAdded: number;
    duplicatesRemoved: number;
    duplicatesMerged: number;
    error?: string;
  }): Promise<void> {
    const pool = getPool();

    const status = metrics.error ? 'failed' : 'completed';

    await pool.query(
      `UPDATE crawl_logs
       SET crawl_end_time = CURRENT_TIMESTAMP,
           jobs_discovered = $1,
           new_jobs_added = $2,
           duplicates_removed = $3,
           duplicates_merged = $4,
           status = $5,
           error_message = $6,
           failed = $7
       WHERE id = $8`,
      [
        metrics.jobsDiscovered,
        metrics.newJobsAdded,
        metrics.duplicatesRemoved,
        metrics.duplicatesMerged,
        status,
        metrics.error || null,
        !!metrics.error,
        logId,
      ]
    );

    // Update source's last crawl time
    const crawlResult = await pool.query(
      'SELECT source_id FROM crawl_logs WHERE id = $1',
      [logId]
    );

    if (crawlResult.rows.length > 0) {
      const sourceId = crawlResult.rows[0].source_id;
      const nextCrawlTime = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

      await pool.query(
        `UPDATE job_sources
         SET last_crawl_time = CURRENT_TIMESTAMP,
             next_crawl_time = $1
         WHERE id = $2`,
        [nextCrawlTime, sourceId]
      );
    }
  }

  /**
   * Get crawl history
   */
  async getCrawlHistory(sourceName?: string, limit = 100): Promise<CrawlLog[]> {
    const pool = getPool();

    let query = 'SELECT cl.* FROM crawl_logs cl';
    const params: any[] = [];

    if (sourceName) {
      query += ' JOIN job_sources js ON cl.source_id = js.id WHERE LOWER(js.name) = LOWER($1)';
      params.push(sourceName);
    }

    query += ' ORDER BY cl.crawl_start_time DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows.map(r => this.rowToCrawlLog(r));
  }

  /**
   * Record a metric value
   */
  async recordMetric(name: string, value: number): Promise<void> {
    const pool = getPool();

    await pool.query(
      `INSERT INTO system_metrics (metric_name, metric_value)
       VALUES ($1, $2)`,
      [name, value]
    );
  }

  /**
   * Get metric statistics
   */
  async getMetricStats(metricName: string, hoursBack = 24): Promise<{
    min: number;
    max: number;
    avg: number;
    latest: number;
  }> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT 
         MIN(metric_value) as min,
         MAX(metric_value) as max,
         AVG(metric_value) as avg,
         (SELECT metric_value FROM system_metrics 
          WHERE metric_name = $1 
          ORDER BY recorded_at DESC LIMIT 1) as latest
       FROM system_metrics
       WHERE metric_name = $1
       AND recorded_at > NOW() - INTERVAL '1 hour' * $2`,
      [metricName, hoursBack]
    );

    if (result.rows.length === 0) {
      return { min: 0, max: 0, avg: 0, latest: 0 };
    }

    const row = result.rows[0];
    return {
      min: row.min || 0,
      max: row.max || 0,
      avg: Math.round(row.avg || 0),
      latest: row.latest || 0,
    };
  }

  /**
   * Get crawl summary for dashboard
   */
  async getCrawlSummary(hoursBack = 24): Promise<{
    totalCrawls: number;
    successfulCrawls: number;
    failedCrawls: number;
    totalJobsDiscovered: number;
    totalNewJobs: number;
    totalDuplicates: number;
    averageJobsPerCrawl: number;
  }> {
    const pool = getPool();

    const result = await pool.query(
      `SELECT
         COUNT(*) as total_crawls,
         SUM(CASE WHEN failed = false THEN 1 ELSE 0 END) as successful,
         SUM(CASE WHEN failed = true THEN 1 ELSE 0 END) as failed,
         SUM(jobs_discovered) as total_discovered,
         SUM(new_jobs_added) as total_new,
         SUM(duplicates_removed + duplicates_merged) as total_duplicates,
         AVG(CASE WHEN jobs_discovered > 0 THEN jobs_discovered ELSE NULL END) as avg_per_crawl
       FROM crawl_logs
       WHERE crawl_start_time > NOW() - INTERVAL '1 hour' * $1`,
      [hoursBack]
    );

    if (result.rows.length === 0) {
      return {
        totalCrawls: 0,
        successfulCrawls: 0,
        failedCrawls: 0,
        totalJobsDiscovered: 0,
        totalNewJobs: 0,
        totalDuplicates: 0,
        averageJobsPerCrawl: 0,
      };
    }

    const row = result.rows[0];
    return {
      totalCrawls: parseInt(row.total_crawls) || 0,
      successfulCrawls: parseInt(row.successful) || 0,
      failedCrawls: parseInt(row.failed) || 0,
      totalJobsDiscovered: parseInt(row.total_discovered) || 0,
      totalNewJobs: parseInt(row.total_new) || 0,
      totalDuplicates: parseInt(row.total_duplicates) || 0,
      averageJobsPerCrawl: Math.round(row.avg_per_crawl) || 0,
    };
  }

  /**
   * Log a search query
   */
  async logSearch(query: string, method: string, resultCount: number): Promise<void> {
    const pool = getPool();

    await pool.query(
      `INSERT INTO search_logs (query_text, method, results_count)
       VALUES ($1, $2, $3)`,
      [query, method, resultCount]
    );
  }

  private rowToCrawlLog(row: any): CrawlLog {
    return {
      id: row.id,
      sourceId: row.source_id,
      crawlStartTime: row.crawl_start_time,
      crawlEndTime: row.crawl_end_time,
      jobsDiscovered: row.jobs_discovered || 0,
      newJobsAdded: row.new_jobs_added || 0,
      duplicatesRemoved: row.duplicates_removed || 0,
      duplicatesMerged: row.duplicates_merged || 0,
      failed: row.failed || false,
      errorMessage: row.error_message,
      status: row.status,
      createdAt: row.created_at,
    };
  }
}
