import { getPool } from '../database/connection.js';

interface ScheduledJob {
  id: string;
  fn: () => Promise<void>;
  intervalMs: number;
  lastRun?: number;
  nextRun?: number;
}

export class JobScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private running = false;
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Register a job to run on an interval
   */
  registerJob(id: string, fn: () => Promise<void>, intervalMs: number): void {
    this.jobs.set(id, {
      id,
      fn,
      intervalMs,
      lastRun: 0,
      nextRun: Date.now(),
    });

    console.log(`📅 Registered job: ${id} (every ${Math.round(intervalMs / 60000)} minutes)`);
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) {
      console.warn('Scheduler is already running');
      return;
    }

    this.running = true;
    console.log('🚀 Job scheduler started');

    // Check every 10 seconds if any jobs need to run
    this.checkInterval = setInterval(() => {
      this.checkJobs();
    }, 10000);

    // Also run check immediately
    this.checkJobs();
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.running = false;
    console.log('⏹️  Job scheduler stopped');
  }

  /**
   * Check if any jobs need to run
   */
  private async checkJobs(): Promise<void> {
    const now = Date.now();

    for (const job of this.jobs.values()) {
      if (job.nextRun && now >= job.nextRun) {
        console.log(`⏱️  Running scheduled job: ${job.id}`);
        
        try {
          const startTime = Date.now();
          await job.fn();
          const duration = Date.now() - startTime;

          job.lastRun = now;
          job.nextRun = now + job.intervalMs;

          console.log(
            `✅ Job completed: ${job.id} (${Math.round(duration / 1000)}s, next in ${Math.round(job.intervalMs / 60000)} min)`
          );
        } catch (err) {
          console.error(`❌ Job failed: ${job.id}`, err);
          // Retry in 1 minute instead of full interval
          job.nextRun = now + 60000;
        }
      }
    }
  }

  /**
   * Get job status
   */
  getStatus(): {
    running: boolean;
    jobs: Array<{
      id: string;
      intervalMs: number;
      lastRun?: Date;
      nextRun?: Date;
    }>;
  } {
    return {
      running: this.running,
      jobs: Array.from(this.jobs.values()).map(job => ({
        id: job.id,
        intervalMs: job.intervalMs,
        lastRun: job.lastRun ? new Date(job.lastRun) : undefined,
        nextRun: job.nextRun ? new Date(job.nextRun) : undefined,
      })),
    };
  }
}

/**
 * Initialize job sources in database and get crawl configuration
 */
export async function initializeJobSources(): Promise<void> {
  const pool = getPool();

  const sources = [
    {
      name: 'greenhouse',
      description: 'Greenhouse ATS integration',
      crawlInterval: 240, // 4 hours
    },
    {
      name: 'lever',
      description: 'Lever ATS integration',
      crawlInterval: 240,
    },
    {
      name: 'ashby',
      description: 'Ashby ATS integration',
      crawlInterval: 240,
    },
    {
      name: 'smartrecruiters',
      description: 'SmartRecruiters ATS integration',
      crawlInterval: 240,
    },
    {
      name: 'workday',
      description: 'Workday ATS integration',
      crawlInterval: 480, // 8 hours
    },
    {
      name: 'company_site',
      description: 'Direct company career pages',
      crawlInterval: 240,
    },
  ];

  for (const source of sources) {
    await pool.query(
      `INSERT INTO job_sources (name, description, crawl_interval_minutes)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO UPDATE SET description = $2, crawl_interval_minutes = $3`,
      [source.name, source.description, source.crawlInterval]
    );
  }

  console.log('✅ Job sources initialized');
}

/**
 * Get sources that need to be crawled
 */
export async function getSourcesToCrawl(): Promise<string[]> {
  const pool = getPool();

  const result = await pool.query(
    `SELECT name FROM job_sources
     WHERE enabled = TRUE
     AND (next_crawl_time IS NULL OR next_crawl_time < NOW())`
  );

  return result.rows.map(r => r.name);
}
