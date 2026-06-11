# Job Aggregator System - Setup Guide

This is a comprehensive job discovery and aggregation system that:
- Crawls multiple ATS providers (Greenhouse, Lever, Ashby, SmartRecruiters, Workday)
- Discovers jobs from company career pages
- Normalizes job data across sources
- Detects and deduplicates jobs
- Generates semantic embeddings for intelligent search
- Provides REST APIs for job retrieval
- Logs detailed metrics and ingestion statistics

## Architecture Overview

```
Job Sources (ATS + Career Pages)
    ↓
Job Fetchers (Protocol-specific collectors)
    ↓
Normalization Service (Standardize fields)
    ↓
Deduplication Service (Hash + similarity matching)
    ↓
PostgreSQL Database (Store canonical records)
    ↓
Embedding Service (OpenAI semantic vectors)
    ↓
REST API (Search + retrieve)
    ↓
Scheduler (Runs ingestion every 4 hours)
```

## Prerequisites

1. **PostgreSQL 13+** with pgvector extension (optional, for semantic search)
2. **Node.js 18+**
3. **OpenAI API Key** (optional, for embeddings)

### Install PostgreSQL (macOS with Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
createdb jobs_db
```

### Install pgvector Extension (optional but recommended)
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Environment Setup

Create `.env` file:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=jobs_db

# ATS Provider Credentials (add only those you use)
GREENHOUSE_BOARD_TOKEN=your_token_here
LEVER_COMPANY=your_company_handle
ASHBY_API_KEY=your_api_key
SMARTRECRUITERS_COMPANY_ID=your_company_id
WORKDAY_DOMAIN=your_domain.wd1.myworkdaysite.com

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Server
PORT=3000
```

## Installation

```bash
# Install dependencies
npm install

# Initialize database schema
npm run build  # TypeScript compilation
npm run dev   # Start server with scheduler
```

## Database Schema

### Main Tables

**jobs** - Stores normalized job listings
- `id` - Primary key
- `external_id` - Source-unique identifier
- `title`, `company`, `location` - Job basics
- `salary_min/max`, `salary_currency` - Compensation
- `employment_type` - fulltime, parttime, contract, etc
- `remote_type` - onsite, hybrid, remote
- `description` - Full job description
- `apply_url` - Application link
- `posted_date` - Job posting date
- `source` - ATS source name
- `is_new` - NEW flag (true = recently discovered)
- `is_duplicate` - Duplicate flag
- `canonical_job_id` - Links to primary record if duplicate
- `hash` - Content hash for dedup
- `embedding` - Vector for semantic search
- Timestamps: `created_at`, `updated_at`

**job_sources** - Tracks crawl sources and intervals
- `name` - Source identifier
- `enabled` - Active/inactive flag
- `crawl_interval_minutes` - Default: 240 (4 hours)
- `last_crawl_time`, `next_crawl_time` - Scheduling info

**crawl_logs** - Detailed ingestion metrics
- `source_id` - Which source was crawled
- `crawl_start_time`, `crawl_end_time` - Duration
- `jobs_discovered` - Total found
- `new_jobs_added` - Novel entries
- `duplicates_removed` - Removed as duplicates
- `status` - pending, running, completed, failed
- `error_message` - If failed

**job_duplicates** - Duplicate relationship mapping
- Maps similar jobs across sources
- Tracks similarity score (0-1)

**search_logs** - Analytics on user searches

**system_metrics** - Time-series metrics
- Track ingestion rate, success rate, etc

## API Endpoints

### Jobs

```bash
# Get all jobs with filtering
GET /api/jobs?company=Google&location=Remote&remoteType=remote&limit=20

# Get newly discovered jobs
GET /api/jobs/new?limit=50

# Get single job
GET /api/jobs/123

# Mark job as processed
POST /api/jobs/123/mark-processed

# Semantic search (requires embedding)
POST /api/jobs/search/semantic
{
  "embedding": [0.1, 0.2, ...],  // 1536-dim vector
  "limit": 20
}
```

### Metrics

```bash
# Get summary (24-hour by default)
GET /api/metrics/summary?hoursBack=24

# Get crawl history
GET /api/metrics/crawl-history?source=greenhouse&limit=50

# Get metric statistics
GET /api/metrics/stats/new_jobs_added?hoursBack=24

# Health check
GET /api/health
```

## Normalization & Deduplication

### Field Normalization

- **Employment Type**: fulltime, parttime, contract, temporary, internship, freelance
- **Remote Type**: onsite, hybrid, remote
- **Salary**: Always normalized to numbers, currency code
- **Description**: Limited to 50,000 chars, HTML stripped
- **Dates**: Always ISO 8601 format

### Duplicate Detection

Jobs are marked as duplicates based on:
1. **Hash Match** (100% duplicate)
   - SHA256(title + company + location)
   - Immediate 1.0 similarity

2. **Similarity Scoring** (threshold: 0.85)
   - Title match: 40% weight
   - Company match: 30% weight
   - Location match: 20% weight
   - Description word overlap: 10% weight

When duplicates detected:
- Mark newer job as duplicate
- Link to older "canonical" record
- Update metrics
- Only canonical jobs shown in API results

## Scheduler Configuration

The system includes two default scheduled jobs:

### 1. Main Ingestion (every 4 hours)
```typescript
scheduler.registerJob('ingest-all-sources', async () => {
  // Fetches from all enabled sources
  // Normalizes and deduplicates
  // Generates embeddings if OpenAI configured
  // Updates metrics
}, 4 * 60 * 60 * 1000);
```

### 2. Metrics Logging (every 1 hour)
```typescript
scheduler.registerJob('log-metrics', async () => {
  // Logs 24-hour summary
  // Updates system_metrics table
}, 60 * 60 * 1000);
```

### Register Custom Jobs

```typescript
import { JobScheduler } from './services/scheduler';

const scheduler = new JobScheduler();

// Your custom job
scheduler.registerJob('custom-job', async () => {
  console.log('Running custom job');
  // Your logic here
}, 60 * 60 * 1000); // 1 hour

scheduler.start();
```

## Embedding & Semantic Search

### Generate Embeddings

The system automatically generates embeddings during ingestion if `OPENAI_API_KEY` is set.

For existing jobs:
```typescript
const ingestionService = new JobIngestionService(...);
const embeddedCount = await ingestionService.generateEmbeddings(apiKey, 100);
```

### Semantic Search

```bash
# Create embedding for your search query
POST /api/jobs/search/semantic
{
  "embedding": [0.15, 0.23, ...],  // OpenAI embedding
  "limit": 20
}
```

## Ingestion Metrics

Monitor ingestion performance:

```typescript
const summary = await metricsService.getCrawlSummary(24); // Last 24 hours

// Returns:
{
  totalCrawls: 6,
  successfulCrawls: 6,
  failedCrawls: 0,
  totalJobsDiscovered: 1250,
  totalNewJobs: 850,
  totalDuplicates: 150,
  averageJobsPerCrawl: 208
}
```

## Adding New Job Sources

### Example: Add a new ATS provider

1. **Create Fetcher**:
```typescript
export class CustomATSFetcher implements JobFetcher {
  name = 'customats';
  
  async fetch(): Promise<RawJob[]> {
    // API calls to your ATS
    // Return normalized RawJob[]
  }
}
```

2. **Register in jobAggregator.ts**:
```typescript
if (source === 'customats') {
  const apiKey = process.env.CUSTOMATS_API_KEY;
  if (apiKey) {
    aggregator.addFetcher(new CustomATSFetcher(apiKey));
  }
}
```

3. **Initialize source in database**:
```sql
INSERT INTO job_sources (name, description, crawl_interval_minutes)
VALUES ('customats', 'Custom ATS Integration', 240);
```

## Troubleshooting

### Database Connection Issues
```bash
# Test PostgreSQL
psql -U postgres -d jobs_db -c "SELECT version();"

# Check connection string in .env
# DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
```

### Jobs Not Being Discovered
1. Check source credentials in .env
2. View crawl logs: `GET /api/metrics/crawl-history`
3. Check error messages in logs
4. Verify ATS API access

### Duplicates Not Detected
- Increase similarity threshold (currently 0.85)
- Check hash generation in `normalization.ts`
- Review duplicate relationship table

### Embeddings Not Generated
- Verify `OPENAI_API_KEY` is set
- Check OpenAI API quota
- Review OpenAI API errors in logs

## Performance Tips

1. **Batch Operations**
   - Process jobs in batches of 50-100
   - Reduces database round-trips

2. **Index Optimization**
   - Indexes on: is_new, company, source, posted_date, hash
   - Query patterns optimized for common filters

3. **Connection Pooling**
   - PostgreSQL pool size: 20 connections
   - Adjust based on load

4. **Embedding Rate Limiting**
   - OpenAI API: 1 second delay per 10 embeddings
   - Prevents throttling

## Development

```bash
# Run in dev mode (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint TypeScript
npm run lint
```

## API Response Format

All endpoints return consistent JSON:

```json
{
  "success": true,
  "data": { /* response data */ },
  "error": null
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message"
}
```

## License

MIT
