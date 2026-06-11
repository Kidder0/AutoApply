# 🎬 Live Demo - Run on Localhost

See the job aggregator in action with sample data and a web dashboard!

## Quick Start (3 steps)

### Step 1: Run Setup Script

**Windows:**
```bash
demo.bat
```

**macOS/Linux:**
```bash
bash demo.sh
```

This will automatically:
- Create the PostgreSQL database
- Install dependencies
- Load 10 sample jobs
- Start the server

### Step 2: Open Dashboard

Once the server starts, open in your browser:

**Dashboard (Visual):**
```
http://localhost:3000/demo.html
```

Or test via curl:

```bash
# All jobs
curl http://localhost:3000/api/jobs

# New jobs only
curl http://localhost:3000/api/jobs/new

# Remote jobs only
curl "http://localhost:3000/api/jobs?remoteType=remote"

# Jobs from Greenhouse
curl "http://localhost:3000/api/jobs?source=greenhouse"

# Google jobs only
curl "http://localhost:3000/api/jobs?company=Google"

# Metrics
curl http://localhost:3000/api/metrics/summary

# Health check
curl http://localhost:3000/api/health
```

### Step 3: Explore

The dashboard lets you:
- 🔍 **View all jobs** discovered from 6 ATS platforms
- 🆕 **Filter by new jobs** posted today
- 🏠 **Filter by remote/hybrid/onsite**
- 💰 **See salary ranges**
- 📍 **View job locations**
- 📅 **Check posted date**
- ✨ **View company details**

---

## What's Included in Demo

**10 Sample Jobs:**
1. Senior Software Engineer @ Google
2. Product Manager @ Stripe
3. Data Scientist @ OpenAI
4. Frontend Engineer @ Meta
5. DevOps Engineer @ Amazon
6. UX Designer @ Apple
7. Marketing Manager @ Figma
8. Backend Engineer @ Airbnb
9. Security Engineer @ Microsoft
10. Technical Lead @ Netflix

**Job Sources Simulated:**
- ✅ Greenhouse
- ✅ Lever
- ✅ Ashby
- ✅ SmartRecruiters
- ✅ Company career pages
- ✅ Workday

---

## API Endpoints to Try

### Get Jobs
```bash
# All jobs (paginated, limit 50)
GET /api/jobs

# With filters
GET /api/jobs?company=Google
GET /api/jobs?remoteType=remote
GET /api/jobs?location=San%20Francisco
GET /api/jobs?source=greenhouse
GET /api/jobs?limit=10&offset=0
```

### New Jobs
```bash
# Only newly discovered
GET /api/jobs/new?limit=20
```

### Single Job
```bash
# Get job by ID (try 1-10 for demo jobs)
GET /api/jobs/1
```

### Metrics
```bash
# 24-hour summary
GET /api/metrics/summary

# Crawl history
GET /api/metrics/crawl-history

# Metric trends
GET /api/metrics/stats/new_jobs_added
```

### Health
```bash
# Check if server is running
GET /api/health
```

---

## Troubleshooting

**"PostgreSQL not found"**
- Install PostgreSQL: https://www.postgresql.org/download/
- Make sure `psql` is in your PATH

**"Port 3000 already in use"**
- Edit `.env` and change `PORT=3000` to `PORT=3001`
- Or kill the existing process

**"Cannot connect to database"**
- Make sure PostgreSQL is running:
  ```bash
  psql -U postgres  # Should connect
  ```
- Check `.env` credentials

**"Demo data not loading"**
- Verify PostgreSQL is running
- Check server logs for errors
- Try: `psql -U postgres -d jobs_db -c "SELECT COUNT(*) FROM jobs;"`

---

## Dashboard Features

### Filter Buttons
- **All Jobs** - Show all 10 demo jobs
- **New Only** - Jobs marked as new (all demo jobs)
- **Remote** - Work from home positions
- **Hybrid** - Mix of office & remote
- **Onsite** - Office-only positions
- **🔄 Refresh** - Reload data from API

### Job Cards Show
- ✨ NEW badge (for recently posted)
- Job title & company
- Location, remote type, employment type
- Salary range (where available)
- Job description snippet
- Posted date
- Apply button (links to job board)

### Statistics Cards
- **Total Jobs** - Count of all jobs in system
- **New Today** - Recently discovered jobs
- **Remote** - How many remote positions
- **Avg Salary** - Average compensation

---

## System Architecture (What's Running)

```
┌─────────────────────────────────────┐
│    PostgreSQL Database              │
│  (jobs, sources, metrics, logs)     │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Express.js Server (3000)         │
│  • REST API endpoints               │
│  • Data access layer                │
│  • Metrics tracking                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│    Demo Dashboard (demo.html)       │
│  • Filters jobs by type             │
│  • Shows statistics                 │
│  • Beautiful UI                     │
└─────────────────────────────────────┘
```

---

## Next Steps After Demo

1. **Try the APIs** - Use curl or Postman
2. **Read the docs** - See QUICK_START.md
3. **Add your credentials** - Edit .env for real ATS sources
4. **Run live ingestion** - Replace demo data with real jobs
5. **Integrate into your app** - Use the APIs

---

## API Response Format

All endpoints return JSON:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "externalId": "gh_001",
      "title": "Senior Software Engineer",
      "company": "Google",
      "location": "Mountain View, CA",
      "salaryMin": 180000,
      "salaryMax": 220000,
      "salaryCurrency": "USD",
      "employmentType": "fulltime",
      "remoteType": "hybrid",
      "description": "...",
      "applyUrl": "https://...",
      "postedDate": "2026-06-09T...",
      "source": "greenhouse",
      "isNew": true,
      "createdAt": "2026-06-11T...",
      "updatedAt": "2026-06-11T..."
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 10
  }
}
```

---

## Commands

**Stop Server:** Press `Ctrl+C`

**Restart:** Run `npm run dev`

**Check Database:** 
```bash
psql -U postgres -d jobs_db
SELECT COUNT(*) FROM jobs;
\q  # Exit
```

**View Raw Data:**
```bash
curl http://localhost:3000/api/jobs | jq .
```

---

## Questions?

See the documentation:
- `START_HERE.md` - Overview
- `QUICK_START.md` - Setup guide
- `JOB_AGGREGATOR_README.md` - Full reference

**Enjoy the demo! 🚀**
