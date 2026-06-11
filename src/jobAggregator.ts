import { initializeDatabase } from './database/connection.js';
import { createJobRoutes } from './api/jobRoutes.js';
import { JobScheduler, initializeJobSources, getSourcesToCrawl } from './services/scheduler.js';
import { JobAggregator, GreenhouseFetcher, LeverFetcher, AshbyFetcher, SmartRecruitersFetcher } from './services/jobFetcher.js';
import { JobRepository } from './services/jobRepository.js';
import { MetricsService } from './services/metricsService.js';
import { JobIngestionService } from './services/jobIngestionService.js';

/**
 * Initialize the entire job aggregator system
 */
export async function initializeJobAggregator(app: any) {
  console.log('🚀 Initializing job aggregator system...\n');

  // 1. Initialize database
  console.log('📦 Setting up database...');
  await initializeDatabase();

  // 2. Initialize job sources
  console.log('\n📋 Initializing job sources...');
  await initializeJobSources();

  // 3. Mount API routes
  console.log('\n🌐 Setting up API routes...');
  app.use('/api', createJobRoutes());

  // 4. Setup scheduler
  console.log('\n📅 Setting up job scheduler...');
  const scheduler = new JobScheduler();
  const repository = new JobRepository();
  const metricsService = new MetricsService();

  // Register main ingestion job (every 4 hours)
  scheduler.registerJob('ingest-all-sources', async () => {
    console.log('\n🔄 Starting scheduled job ingestion...');

    const sourcesToCrawl = await getSourcesToCrawl();

    for (const source of sourcesToCrawl) {
      try {
        // Create aggregator with fetchers based on source
        const aggregator = new JobAggregator();

        // Add fetchers based on source type
        if (source === 'greenhouse') {
          const token = process.env.GREENHOUSE_BOARD_TOKEN;
          if (token) {
            aggregator.addFetcher(new GreenhouseFetcher(token));
          }
        } else if (source === 'lever') {
          const company = process.env.LEVER_COMPANY;
          if (company) {
            aggregator.addFetcher(new LeverFetcher(company));
          }
        } else if (source === 'ashby') {
          const apiKey = process.env.ASHBY_API_KEY;
          if (apiKey) {
            aggregator.addFetcher(new AshbyFetcher(apiKey));
          }
        } else if (source === 'smartrecruiters') {
          const companyId = process.env.SMARTRECRUITERS_COMPANY_ID;
          if (companyId) {
            aggregator.addFetcher(new SmartRecruitersFetcher(companyId));
          }
        }

        // Run ingestion
        const ingestionService = new JobIngestionService(
          aggregator,
          repository,
          metricsService
        );

        const result = await ingestionService.ingestJobs(source);

        if (result.success && process.env.OPENAI_API_KEY) {
          // Generate embeddings for new jobs
          console.log('🧠 Generating embeddings...');
          const embeddedCount = await ingestionService.generateEmbeddings(
            process.env.OPENAI_API_KEY,
            100
          );
          console.log(`✅ Embedded ${embeddedCount} jobs`);
        }
      } catch (err) {
        console.error(`Error processing source ${source}:`, err);
      }
    }

    console.log('✅ Scheduled job ingestion completed\n');
  }, 4 * 60 * 60 * 1000); // 4 hours

  // Register metrics logging job (every 1 hour)
  scheduler.registerJob('log-metrics', async () => {
    const summary = await metricsService.getCrawlSummary(24);
    console.log('📊 Crawl metrics (24h):', summary);
  }, 60 * 60 * 1000); // 1 hour

  // Start scheduler
  scheduler.start();

  console.log('\n✅ Job aggregator system initialized successfully!\n');
  console.log('📡 API Endpoints:');
  console.log('  GET /api/jobs - Get all jobs');
  console.log('  GET /api/jobs/new - Get new jobs');
  console.log('  GET /api/jobs/:id - Get job by ID');
  console.log('  POST /api/jobs/search/semantic - Semantic search');
  console.log('  GET /api/metrics/summary - Get metrics');
  console.log('  GET /api/metrics/crawl-history - Get crawl history');
  console.log('  GET /api/health - Health check\n');

  return {
    scheduler,
    repository,
    metricsService,
  };
}

export {
  JobScheduler,
  JobAggregator,
  GreenhouseFetcher,
  LeverFetcher,
  AshbyFetcher,
  SmartRecruitersFetcher,
  JobRepository,
  MetricsService,
  JobIngestionService,
};
