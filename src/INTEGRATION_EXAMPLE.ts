/**
 * INTEGRATION EXAMPLE: How to integrate the Job Aggregator into server.ts
 * 
 * Add these imports and initialization code to your existing Express server.
 */

// ===== ADD THESE IMPORTS =====

import { initializeJobAggregator } from './jobAggregator.js';

// ===== IN YOUR EXPRESS SERVER SETUP =====

const app = express();

// ... existing middleware ...

// Initialize job aggregator system
try {
  const { scheduler, repository, metricsService } = await initializeJobAggregator(app);
  
  // Optional: Export for use in other routes
  app.locals.jobScheduler = scheduler;
  app.locals.jobRepository = repository;
  app.locals.metricsService = metricsService;
} catch (err) {
  console.error('Failed to initialize job aggregator:', err);
  process.exit(1);
}

// ... rest of your server setup ...

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

// ===== OPTIONAL: CUSTOM ROUTES TO USE JOB DATA =====

import { JobRepository } from './services/jobRepository.js';

// Example: Homepage with job statistics
app.get('/dashboard', async (req, res) => {
  const repository = new JobRepository();
  const { jobs: newJobs } = await repository.getJobs({ limit: 5 });
  
  res.json({
    recentJobs: newJobs,
    timestamp: new Date().toISOString(),
  });
});

// Example: Search with semantic similarity
app.post('/search-jobs', async (req, res) => {
  const { searchText } = req.body;
  const repository = new JobRepository();
  
  // In real implementation, you'd generate an embedding from searchText
  // using OpenAI API first
  const mockEmbedding = new Array(1536).fill(0.1); // Mock embedding
  
  const results = await repository.semanticSearch(mockEmbedding, 20);
  res.json(results);
});

// ===== ENVIRONMENT VARIABLES NEEDED =====

/*
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=jobs_db

GREENHOUSE_BOARD_TOKEN=your_token
LEVER_COMPANY=your_company
ASHBY_API_KEY=your_api_key
SMARTRECRUITERS_COMPANY_ID=your_id

OPENAI_API_KEY=sk-...

PORT=3000
*/

// ===== DATABASE SETUP COMMANDS =====

/*
# Create PostgreSQL database
createdb jobs_db

# Or in PostgreSQL console:
CREATE DATABASE jobs_db;

# Optional: Install pgvector for better semantic search
CREATE EXTENSION IF NOT EXISTS vector;
*/

// ===== VERIFICATION CHECKLIST =====

/*
After setup, verify with these commands:

1. Test API health:
   curl http://localhost:3000/api/health

2. Check for new jobs:
   curl http://localhost:3000/api/jobs/new

3. Get metrics:
   curl http://localhost:3000/api/metrics/summary

4. View crawl history:
   curl http://localhost:3000/api/metrics/crawl-history

5. Query jobs with filters:
   curl "http://localhost:3000/api/jobs?company=Google&remoteType=remote&limit=10"
*/

export { initializeJobAggregator };
