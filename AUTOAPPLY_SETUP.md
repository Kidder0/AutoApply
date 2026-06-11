# 🚀 AutoApply - Setup & Configuration Guide

## Phase 1 & 2: Auto Job Pulling + One-Click Apply

### What's New ✨

Your AutoApply system now has:

1. **Automatic Job Discovery** - Runs every 2 hours
   - Fetches from Greenhouse API
   - Fetches from Lever API
   - Auto-deduplicates jobs
   - Stores in PostgreSQL

2. **One-Click Auto-Apply** - Single click to apply
   - Analyzes resume match score (0-100%)
   - Generates tailored cover letters
   - Pre-fills application forms
   - Tracks all applications

3. **Smart Resume Matching** - Real-time analysis
   - Extracts skills from resume
   - Compares with job requirements
   - Shows missing skills
   - Provides readiness assessment

---

## Setup Instructions

### 1. Database Configuration

You need a PostgreSQL database. Choose one:

#### Option A: Vercel Postgres (Recommended)
```bash
# In Vercel Dashboard:
1. Storage → Create Database → Postgres
2. Copy connection string
3. Set as DATABASE_URL environment variable
```

#### Option B: External PostgreSQL
```bash
# Using services like:
- Railway.app
- Neon.tech
- AWS RDS
- Digital Ocean

# Get connection string format:
postgresql://user:password@host:port/database
```

### 2. Configure Environment Variables

Set these in your Vercel project settings:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security
CRON_SECRET=your-super-secret-cron-token-here

# Job Sources - Greenhouse
GREENHOUSE_BOARDS=anthropic,databricks,stripe

# Job Sources - Lever
LEVER_COMPANIES=anthropic,openai,perplexity

# Optional: APIs
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
```

### 3. Vercel Cron Configuration

The system automatically runs job discovery every 2 hours via `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/jobs-discovery",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

**Schedule Format (Cron Expression):**
- `0 */2 * * *` = Every 2 hours (recommended)
- `0 * * * *` = Every hour
- `0 0 * * *` = Once daily at midnight

---

## API Endpoints

### 1. Auto Job Discovery (Automatic)
```
GET /api/cron/jobs-discovery?authorization=Bearer%20CRON_SECRET
```
Called automatically every 2 hours. Returns discovered jobs.

### 2. One-Click Apply
```
POST /api/applications/apply-one-click

Request:
{
  "job": {
    "id": "job-123",
    "title": "Senior Engineer",
    "company": "Stripe",
    "description": "Looking for React/TypeScript expert..."
  },
  "profile": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "skills": ["React", "TypeScript", "Node.js"],
    "experience": [...]
  }
}

Response:
{
  "success": true,
  "applicationId": "app_1234567890",
  "match": {
    "score": 85,
    "readiness": "ready",
    "matchedSkills": ["React", "TypeScript"],
    "missingSkills": ["Kubernetes"]
  },
  "nextSteps": [...]
}
```

### 3. Analyze Job Match
```
POST /api/jobs/analyze-match

Request:
{
  "resume": "Jane Doe... React TypeScript...",
  "jobDescription": "We need React, TypeScript, Node.js..."
}

Response:
{
  "score": 85,
  "readiness": "ready",
  "color": "#10b981",
  "emoji": "🎯",
  "matched": {
    "skills": ["React", "TypeScript"],
    "count": 2
  },
  "missing": {
    "skills": ["Kubernetes"],
    "count": 1
  }
}
```

---

## How It Works

### Job Discovery Pipeline

```
1. Every 2 hours (via Vercel Cron):
   
   ↓
   
2. Fetch jobs from multiple sources:
   • Greenhouse API (configured boards)
   • Lever API (configured companies)
   
   ↓
   
3. Extract & normalize job data:
   • Title, company, location
   • Description, salary
   • Remote status
   
   ↓
   
4. Deduplication:
   • Generate content hash
   • Compare with existing jobs
   • Keep unique entries only
   
   ↓
   
5. Store in PostgreSQL:
   • Save new jobs
   • Log metrics
   • Track sources

6. Emit metrics:
   • Jobs discovered
   • New jobs added
   • Duplicates removed
```

### One-Click Apply Pipeline

```
1. User clicks "Apply Now":
   
   ↓
   
2. Analyze resume match:
   • Extract skills from resume
   • Extract requirements from job
   • Calculate match score (0-100%)
   • Assess readiness
   
   ↓
   
3. Prepare application:
   • Generate cover letter
   • Pre-fill form fields
   • Collect user data
   
   ↓
   
4. Submit application:
   • Send to job board
   • Get confirmation
   • Track status
   
   ↓
   
5. Record application:
   • Save to database
   • Link to job
   • Log timestamp
   
   ↓
   
6. Return results:
   • Match score & readiness
   • Application ID
   • Next steps & timeline
```

---

## UI Integration

Add one-click apply button to your job listings:

```tsx
import { OneClickApplyButton } from './components/OneClickApplyButton';

<OneClickApplyButton
  job={job}
  profile={userProfile}
  resume={resumeText}
  onApplySuccess={(result) => {
    console.log('Applied successfully!', result);
  }}
/>
```

---

## Monitoring & Debugging

### Check Job Discovery Logs
```
Vercel Dashboard → Functions → /api/cron/jobs-discovery
```

### Check Application Tracking
```
SELECT * FROM applications ORDER BY applied_at DESC;
```

### Test Manually
```bash
# Trigger job discovery manually
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/jobs-discovery

# Test match analysis
curl -X POST https://your-app.vercel.app/api/jobs/analyze-match \
  -H "Content-Type: application/json" \
  -d '{
    "resume": "Jane Doe...",
    "jobDescription": "Looking for..."
  }'
```

---

## Configuration Examples

### Greenhouse Boards

Popular tech company boards:

```env
GREENHOUSE_BOARDS=anthropic,databricks,stripe,google-careers,amazon-jobs
```

### Lever Companies

Tech company Lever instances:

```env
LEVER_COMPANIES=anthropic,openai,perplexity,huggingface,stability
```

---

## Next Steps

- [ ] Deploy to Vercel
- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Test job discovery manually
- [ ] Add UI components to your app
- [ ] Test one-click apply flow
- [ ] Set up application tracking dashboard
- [ ] Add recruiter notifications

---

## Troubleshooting

### Cron job not running?
- Check CRON_SECRET is set
- Verify schedule in vercel.json
- Check Vercel Function logs

### No jobs being discovered?
- Verify GREENHOUSE_BOARDS and LEVER_COMPANIES
- Test APIs manually to ensure they're accessible
- Check DATABASE_URL connection

### One-click apply not working?
- Verify job and profile data structure
- Check browser console for errors
- Test API endpoint directly

---

## Support

For issues or questions:
1. Check Vercel logs
2. Review API responses
3. Verify environment variables
4. Test endpoints manually

Good luck! 🚀
