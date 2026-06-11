#!/bin/bash
# Demo Setup Script - Run the Job Aggregator locally with sample data

set -e

echo "🚀 Job Aggregator Demo Setup"
echo "=============================="
echo ""

# Check if PostgreSQL is running
echo "📋 Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
  echo "❌ PostgreSQL not found. Please install it first:"
  echo "   macOS: brew install postgresql@15 && brew services start postgresql@15"
  echo "   Linux: sudo apt-get install postgresql && sudo systemctl start postgresql"
  exit 1
fi

# Create database
echo "📦 Creating jobs database..."
dropdb jobs_db 2>/dev/null || true
createdb jobs_db
echo "✅ Database created"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📥 Installing dependencies..."
  npm install
  echo "✅ Dependencies installed"
fi

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
  echo "⚙️  Creating .env..."
  cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=jobs_db
PORT=3000
EOF
  echo "✅ .env created"
fi

# Initialize schema
echo "📊 Initializing database schema..."
psql jobs_db < src/database/schema.sql
echo "✅ Schema initialized"

# Load sample data
echo "📝 Loading sample data..."
psql jobs_db << 'EOF'
-- Insert job sources
INSERT INTO job_sources (name, description, enabled, crawl_interval_minutes) VALUES
('greenhouse', 'Greenhouse ATS', true, 240),
('lever', 'Lever ATS', true, 240),
('ashby', 'Ashby ATS', true, 240),
('smartrecruiters', 'SmartRecruiters', true, 240),
('company_site', 'Company career pages', true, 240),
('workday', 'Workday ATS', true, 480)
ON CONFLICT DO NOTHING;

-- Insert sample jobs
INSERT INTO jobs (
  external_id, title, company, location, salary_min, salary_max, salary_currency,
  employment_type, remote_type, description, apply_url, posted_date, source,
  source_url, is_new, hash
) VALUES
(
  'gh_001',
  'Senior Software Engineer',
  'Google',
  'Mountain View, CA',
  180000,
  220000,
  'USD',
  'fulltime',
  'hybrid',
  'We are looking for a Senior Software Engineer to join our team. You will work on large-scale distributed systems, design APIs, and mentor junior engineers. Requirements: 5+ years experience, strong systems design, Go or C++.',
  'https://careers.google.com/jobs/001',
  NOW() - INTERVAL '2 days',
  'greenhouse',
  'https://greenhouse.io/job/001',
  true,
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
),
(
  'lever_002',
  'Product Manager',
  'Stripe',
  'San Francisco, CA',
  150000,
  190000,
  'USD',
  'fulltime',
  'remote',
  'Join Stripe as a Product Manager and help shape the future of payments. You will own product strategy, work with engineering teams, and drive adoption. Background in fintech or payments preferred.',
  'https://stripe.com/jobs/listing/pm-001',
  NOW() - INTERVAL '1 day',
  'lever',
  'https://lever.co/job/pm-001',
  true,
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856'
),
(
  'ashby_003',
  'Data Scientist',
  'OpenAI',
  'San Francisco, CA',
  160000,
  210000,
  'USD',
  'fulltime',
  'hybrid',
  'We are hiring Data Scientists to work on our foundation models and safety research. You will analyze training data, conduct experiments, and publish research. PhD in ML/AI or equivalent experience required.',
  'https://openai.com/careers/data-scientist',
  NOW() - INTERVAL '3 hours',
  'ashby',
  'https://ashby.com/job/ds-001',
  true,
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b857'
),
(
  'sr_004',
  'Frontend Engineer',
  'Meta',
  'Menlo Park, CA',
  140000,
  180000,
  'USD',
  'fulltime',
  'onsite',
  'Meta is looking for Frontend Engineers to build world-class user experiences. You will work with React, TypeScript, and GraphQL. 3+ years frontend experience needed.',
  'https://meta.com/careers/frontend',
  NOW() - INTERVAL '5 hours',
  'smartrecruiters',
  'https://smartrecruiters.com/job/fe-001',
  true,
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b858'
),
(
  'gh_005',
  'DevOps Engineer',
  'Amazon',
  'Seattle, WA',
  130000,
  160000,
  'USD',
  'fulltime',
  'hybrid',
  'Amazon Web Services is hiring DevOps Engineers to manage infrastructure at scale. You will work with Kubernetes, Terraform, and AWS. 4+ years required.',
  'https://amazon.com/jobs/devops-001',
  NOW() - INTERVAL '6 hours',
  'greenhouse',
  'https://greenhouse.io/job/dops-001',
  true,
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b859'
),
(
  'lever_006',
  'UX Designer',
  'Apple',
  'Cupertino, CA',
  120000,
  150000,
  'USD',
  'fulltime',
  'onsite',
  'Apple is looking for UX Designers to create beautiful interfaces for our products. You will work with Figma, conduct user research, and iterate on designs. Portfolio required.',
  'https://apple.com/careers/design',
  NOW() - INTERVAL '1 day',
  'lever',
  'https://lever.co/job/design-001',
  true,
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b860'
),
(
  'ashby_007',
  'Marketing Manager',
  'Figma',
  'San Francisco, CA',
  110000,
  140000,
  'USD',
  'fulltime',
  'remote',
  'Figma is hiring a Marketing Manager to drive product adoption and customer growth. You will manage campaigns, work with sales, and drive strategy. SaaS background preferred.',
  'https://figma.com/careers/marketing',
  NOW() - INTERVAL '2 days',
  'ashby',
  'https://ashby.com/job/mkt-001',
  true,
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b861'
),
(
  'sr_008',
  'Backend Engineer',
  'Airbnb',
  'San Francisco, CA',
  140000,
  180000,
  'USD',
  'fulltime',
  'hybrid',
  'Airbnb is hiring Backend Engineers to scale our platform. You will work on payments, search, and availability. 5+ years experience with large-scale systems needed.',
  'https://airbnb.com/careers/backend',
  NOW() - INTERVAL '4 hours',
  'smartrecruiters',
  'https://smartrecruiters.com/job/be-001',
  true,
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b862'
),
(
  'gh_009',
  'Security Engineer',
  'Microsoft',
  'Redmond, WA',
  130000,
  170000,
  'USD',
  'fulltime',
  'hybrid',
  'Microsoft is hiring Security Engineers to protect our cloud infrastructure. You will conduct threat modeling, write security tools, and respond to incidents. CISSP or similar certification preferred.',
  'https://microsoft.com/careers/security',
  NOW() - INTERVAL '3 days',
  'greenhouse',
  'https://greenhouse.io/job/sec-001',
  true,
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b863'
),
(
  'lever_010',
  'Technical Lead',
  'Netflix',
  'Los Gatos, CA',
  160000,
  210000,
  'USD',
  'fulltime',
  'remote',
  'Netflix is looking for a Technical Lead to guide a team of engineers. You will mentor engineers, make architectural decisions, and ship features. 7+ years experience required.',
  'https://netflix.com/careers/tech-lead',
  NOW() - INTERVAL '1 hour',
  'lever',
  'https://lever.co/job/tl-001',
  true,
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b864'
);

-- Insert a crawl log
INSERT INTO crawl_logs (source_id, crawl_start_time, crawl_end_time, jobs_discovered, new_jobs_added, duplicates_removed, status) 
SELECT id, NOW() - INTERVAL '1 hour', NOW(), 10, 10, 0, 'completed' FROM job_sources LIMIT 1;

-- Insert metrics
INSERT INTO system_metrics (metric_name, metric_value) VALUES
('jobs_discovered', 10),
('new_jobs_added', 10),
('duplicates_detected', 0);

EOF
echo "✅ Sample data loaded (10 demo jobs)"

echo ""
echo "🎉 Demo setup complete!"
echo ""
echo "📡 Starting server..."
echo ""
echo "Available at: http://localhost:3000"
echo ""
echo "Try these URLs in your browser or with curl:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔍 View all jobs:"
echo "   curl http://localhost:3000/api/jobs"
echo ""
echo "🆕 View new jobs only:"
echo "   curl http://localhost:3000/api/jobs/new"
echo ""
echo "💰 Filter by remote jobs:"
echo "   curl http://localhost:3000/api/jobs?remoteType=remote"
echo ""
echo "🏢 Filter by company:"
echo "   curl http://localhost:3000/api/jobs?company=Google"
echo ""
echo "📊 View metrics:"
echo "   curl http://localhost:3000/api/metrics/summary"
echo ""
echo "💚 Health check:"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
npm run dev
