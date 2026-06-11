# Job Aggregator - Quick Start

## 1. Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm/yarn

## 2. Install Dependencies
```bash
npm install
```

## 3. Setup PostgreSQL Database

### macOS (Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
createdb jobs_db
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb jobs_db
```

### Windows
- Download PostgreSQL from https://www.postgresql.org/download/windows/
- Or use WSL2 with Ubuntu installation above

## 4. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

**Minimum required (.env)**:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=jobs_db
PORT=3000
```

**For ATS Sources** (add as needed):
- Greenhouse: `GREENHOUSE_BOARD_TOKEN=xxx`
- Lever: `LEVER_COMPANY=mycompany`
- Ashby: `ASHBY_API_KEY=xxx`
- SmartRecruiters: `SMARTRECRUITERS_COMPANY_ID=xxx`

**For Embeddings** (optional):
- OpenAI: `OPENAI_API_KEY=sk-xxx`

## 5. Run the Server

Development (with hot-reload):
```bash
npm run dev
```

Production:
```bash
npm run build
npm start
```

## 6. Verify Setup

Once server starts, test endpoints:

```bash
# Health check
curl http://localhost:3000/api/health

# Get new jobs
curl http://localhost:3000/api/jobs/new

# Get all jobs
curl http://localhost:3000/api/jobs?limit=10

# Get metrics
curl http://localhost:3000/api/metrics/summary
```

## 7. Monitor Scheduler

The system automatically runs:
- **Every 4 hours**: Job ingestion from all sources
- **Every 1 hour**: Metrics logging

Check status:
```bash
curl http://localhost:3000/api/metrics/crawl-history
```

## Next Steps

1. **Add more ATS sources**: Update `.env` with provider credentials
2. **Enable embeddings**: Set `OPENAI_API_KEY` for semantic search
3. **Customize scheduling**: Edit `jobAggregator.ts` to adjust crawl intervals
4. **Add custom routes**: Integrate job data into your frontend

## Troubleshooting

**"Database connection failed"**
- Verify PostgreSQL is running: `psql -U postgres`
- Check `.env` credentials
- Ensure `jobs_db` exists: `psql -U postgres -l`

**"Jobs not being discovered"**
- Check crawl logs: `GET /api/metrics/crawl-history`
- Verify ATS credentials in `.env`
- Check server logs for errors

**"Port already in use"**
- Change `PORT` in `.env`
- Or kill existing process: `lsof -i :3000` (macOS/Linux)

## Project Structure

```
src/
├── database/
│   ├── schema.sql        # Database schema
│   └── connection.ts     # Database initialization
├── services/
│   ├── jobFetcher.ts     # ATS provider fetchers
│   ├── normalization.ts  # Data normalization
│   ├── jobRepository.ts  # Database queries
│   ├── metricsService.ts # Metrics & logging
│   ├── jobIngestionService.ts  # Main pipeline
│   └── scheduler.ts      # Cron scheduler
├── api/
│   └── jobRoutes.ts      # REST endpoints
├── jobAggregator.ts      # System initialization
└── INTEGRATION_EXAMPLE.ts # How to integrate
```

## API Endpoints Reference

```
GET  /api/jobs                    # List all jobs
GET  /api/jobs/new                # Get new jobs
GET  /api/jobs/:id                # Get single job
POST /api/jobs/:id/mark-processed # Mark as seen
POST /api/jobs/search/semantic    # Semantic search

GET  /api/metrics/summary         # 24h summary
GET  /api/metrics/crawl-history   # Crawl logs
GET  /api/metrics/stats/:metric   # Metric statistics

GET  /api/health                  # Health check
```

## Support

For detailed documentation, see `JOB_AGGREGATOR_README.md`
