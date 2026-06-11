import { Router, Request, Response } from 'express';
import { JobRepository } from '../services/jobRepository.js';
import { MetricsService } from '../services/metricsService.js';

export function createJobRoutes(): Router {
  const router = Router();
  const repository = new JobRepository();
  const metrics = new MetricsService();

  /**
   * GET /jobs
   * Get all jobs with optional filtering
   */
  router.get('/jobs', async (req: Request, res: Response) => {
    try {
      const { company, location, remoteType, source, limit, offset } = req.query;

      const result = await repository.getJobs({
        company: company as string,
        location: location as string,
        remoteType: remoteType as string,
        source: source as string,
        limit: limit ? parseInt(limit as string) : 50,
        offset: offset ? parseInt(offset as string) : 0,
      });

      await metrics.logSearch(
        `company:${company} location:${location}`,
        'filter',
        result.jobs.length
      );

      res.json({
        success: true,
        data: result.jobs,
        pagination: {
          limit: limit ? parseInt(limit as string) : 50,
          offset: offset ? parseInt(offset as string) : 0,
          total: result.total,
        },
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /jobs/new
   * Get newly discovered jobs
   */
  router.get('/jobs/new', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const jobs = await repository.getNewJobs(limit);

      res.json({
        success: true,
        data: jobs,
        count: jobs.length,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /jobs/:id
   * Get a single job by ID
   */
  router.get('/jobs/:id', async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await repository.getJobById(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found',
        });
      }

      res.json({
        success: true,
        data: job,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /jobs/:id/mark-processed
   * Mark a job as processed
   */
  router.post('/jobs/:id/mark-processed', async (req: Request, res: Response) => {
    try {
      const jobId = parseInt(req.params.id);
      await repository.markJobsAsProcessed([jobId]);

      res.json({
        success: true,
        message: 'Job marked as processed',
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  /**
   * POST /jobs/search/semantic
   * Semantic search using embeddings
   */
  router.post('/jobs/search/semantic', async (req: Request, res: Response) => {
    try {
      const { embedding, limit } = req.body;

      if (!embedding || !Array.isArray(embedding)) {
        return res.status(400).json({
          success: false,
          error: 'Missing or invalid embedding array',
        });
      }

      const jobs = await repository.semanticSearch(embedding, limit || 20);

      await metrics.logSearch('semantic_search', 'semantic', jobs.length);

      res.json({
        success: true,
        data: jobs,
        count: jobs.length,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /metrics/summary
   * Get crawl summary
   */
  router.get('/metrics/summary', async (req: Request, res: Response) => {
    try {
      const hoursBack = req.query.hoursBack ? parseInt(req.query.hoursBack as string) : 24;
      const summary = await metrics.getCrawlSummary(hoursBack);

      res.json({
        success: true,
        data: summary,
        timeRange: `${hoursBack} hours`,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /metrics/crawl-history
   * Get crawl history
   */
  router.get('/metrics/crawl-history', async (req: Request, res: Response) => {
    try {
      const source = req.query.source as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const history = await metrics.getCrawlHistory(source, limit);

      res.json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /metrics/stats/:metricName
   * Get metric statistics
   */
  router.get('/metrics/stats/:metricName', async (req: Request, res: Response) => {
    try {
      const metricName = req.params.metricName;
      const hoursBack = req.query.hoursBack ? parseInt(req.query.hoursBack as string) : 24;
      const stats = await metrics.getMetricStats(metricName, hoursBack);

      res.json({
        success: true,
        metric: metricName,
        data: stats,
        timeRange: `${hoursBack} hours`,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  });

  /**
   * GET /health
   * Health check
   */
  router.get('/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
