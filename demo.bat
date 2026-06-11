@echo off
REM Demo Setup Script for Windows - Run the Job Aggregator locally with sample data

echo.
echo ====================================
echo Job Aggregator Demo Setup (Windows)
echo ====================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Error: PostgreSQL not found
  echo Please install PostgreSQL from: https://www.postgresql.org/download/windows/
  echo Or use Windows Subsystem for Linux (WSL)
  pause
  exit /b 1
)

echo 1/5: Creating database...
psql -U postgres -c "DROP DATABASE IF EXISTS jobs_db;" >nul 2>&1
psql -U postgres -c "CREATE DATABASE jobs_db;"
if %ERRORLEVEL% NEQ 0 (
  echo Error: Failed to create database
  echo Make sure PostgreSQL is running and you can login
  pause
  exit /b 1
)
echo OK - Database created

echo 2/5: Installing dependencies...
if not exist "node_modules" (
  call npm install
) else (
  echo OK - Dependencies already installed
)

echo 3/5: Creating .env file...
if not exist ".env" (
  (
    echo DB_HOST=localhost
    echo DB_PORT=5432
    echo DB_USER=postgres
    echo DB_PASSWORD=postgres
    echo DB_NAME=jobs_db
    echo PORT=3000
  ) > .env
  echo OK - .env created
) else (
  echo OK - .env already exists
)

echo 4/5: Initializing database schema...
psql -U postgres -d jobs_db -f src\database\schema.sql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Error: Failed to initialize schema
  pause
  exit /b 1
)
echo OK - Schema initialized

echo 5/5: Loading sample data...
psql -U postgres -d jobs_db -f - <<EOF >nul 2>&1
INSERT INTO job_sources (name, description, enabled, crawl_interval_minutes) VALUES
('greenhouse', 'Greenhouse ATS', true, 240),
('lever', 'Lever ATS', true, 240),
('ashby', 'Ashby ATS', true, 240),
('smartrecruiters', 'SmartRecruiters', true, 240),
('company_site', 'Company career pages', true, 240),
('workday', 'Workday ATS', true, 480)
ON CONFLICT DO NOTHING;

INSERT INTO jobs (
  external_id, title, company, location, salary_min, salary_max, salary_currency,
  employment_type, remote_type, description, apply_url, posted_date, source,
  source_url, is_new, hash
) VALUES
('gh_001', 'Senior Software Engineer', 'Google', 'Mountain View, CA', 180000, 220000, 'USD', 'fulltime', 'hybrid', 'We are looking for a Senior Software Engineer to join our team. You will work on large-scale distributed systems, design APIs, and mentor junior engineers. Requirements: 5+ years experience, strong systems design, Go or C++.', 'https://careers.google.com/jobs/001', NOW() - INTERVAL '2 days', 'greenhouse', 'https://greenhouse.io/job/001', true, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'),
('lever_002', 'Product Manager', 'Stripe', 'San Francisco, CA', 150000, 190000, 'USD', 'fulltime', 'remote', 'Join Stripe as a Product Manager and help shape the future of payments. You will own product strategy, work with engineering teams, and drive adoption. Background in fintech or payments preferred.', 'https://stripe.com/jobs/listing/pm-001', NOW() - INTERVAL '1 day', 'lever', 'https://lever.co/job/pm-001', true, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856'),
('ashby_003', 'Data Scientist', 'OpenAI', 'San Francisco, CA', 160000, 210000, 'USD', 'fulltime', 'hybrid', 'We are hiring Data Scientists to work on our foundation models and safety research. You will analyze training data, conduct experiments, and publish research. PhD in ML/AI or equivalent experience required.', 'https://openai.com/careers/data-scientist', NOW() - INTERVAL '3 hours', 'ashby', 'https://ashby.com/job/ds-001', true, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b857'),
('sr_004', 'Frontend Engineer', 'Meta', 'Menlo Park, CA', 140000, 180000, 'USD', 'fulltime', 'onsite', 'Meta is looking for Frontend Engineers to build world-class user experiences. You will work with React, TypeScript, and GraphQL. 3+ years frontend experience needed.', 'https://meta.com/careers/frontend', NOW() - INTERVAL '5 hours', 'smartrecruiters', 'https://smartrecruiters.com/job/fe-001', true, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b858'),
('gh_005', 'DevOps Engineer', 'Amazon', 'Seattle, WA', 130000, 160000, 'USD', 'fulltime', 'hybrid', 'Amazon Web Services is hiring DevOps Engineers to manage infrastructure at scale. You will work with Kubernetes, Terraform, and AWS. 4+ years required.', 'https://amazon.com/jobs/devops-001', NOW() - INTERVAL '6 hours', 'greenhouse', 'https://greenhouse.io/job/dops-001', true, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b859'),
('lever_006', 'UX Designer', 'Apple', 'Cupertino, CA', 120000, 150000, 'USD', 'fulltime', 'onsite', 'Apple is looking for UX Designers to create beautiful interfaces for our products. You will work with Figma, conduct user research, and iterate on designs. Portfolio required.', 'https://apple.com/careers/design', NOW() - INTERVAL '1 day', 'lever', 'https://lever.co/job/design-001', true, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b860'),
('ashby_007', 'Marketing Manager', 'Figma', 'San Francisco, CA', 110000, 140000, 'USD', 'fulltime', 'remote', 'Figma is hiring a Marketing Manager to drive product adoption and customer growth. You will manage campaigns, work with sales, and drive strategy. SaaS background preferred.', 'https://figma.com/careers/marketing', NOW() - INTERVAL '2 days', 'ashby', 'https://ashby.com/job/mkt-001', true, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b861'),
('sr_008', 'Backend Engineer', 'Airbnb', 'San Francisco, CA', 140000, 180000, 'USD', 'fulltime', 'hybrid', 'Airbnb is hiring Backend Engineers to scale our platform. You will work on payments, search, and availability. 5+ years experience with large-scale systems needed.', 'https://airbnb.com/careers/backend', NOW() - INTERVAL '4 hours', 'smartrecruiters', 'https://smartrecruiters.com/job/be-001', true, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b862'),
('gh_009', 'Security Engineer', 'Microsoft', 'Redmond, WA', 130000, 170000, 'USD', 'fulltime', 'hybrid', 'Microsoft is hiring Security Engineers to protect our cloud infrastructure. You will conduct threat modeling, write security tools, and respond to incidents. CISSP or similar certification preferred.', 'https://microsoft.com/careers/security', NOW() - INTERVAL '3 days', 'greenhouse', 'https://greenhouse.io/job/sec-001', true, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b863'),
('lever_010', 'Technical Lead', 'Netflix', 'Los Gatos, CA', 160000, 210000, 'USD', 'fulltime', 'remote', 'Netflix is looking for a Technical Lead to guide a team of engineers. You will mentor engineers, make architectural decisions, and ship features. 7+ years experience required.', 'https://netflix.com/careers/tech-lead', NOW() - INTERVAL '1 hour', 'lever', 'https://lever.co/job/tl-001', true, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b864');

INSERT INTO crawl_logs (source_id, crawl_start_time, crawl_end_time, jobs_discovered, new_jobs_added, duplicates_removed, status) 
SELECT id, NOW() - INTERVAL '1 hour', NOW(), 10, 10, 0, 'completed' FROM job_sources LIMIT 1;

INSERT INTO system_metrics (metric_name, metric_value) VALUES
('jobs_discovered', 10),
('new_jobs_added', 10),
('duplicates_detected', 0);
EOF
echo OK - Sample data loaded

echo.
echo ====================================
echo Setup Complete! Starting server...
echo ====================================
echo.
echo Open in browser: http://localhost:3000/demo.html
echo.
echo API Endpoints:
echo   All jobs:      http://localhost:3000/api/jobs
echo   New jobs:      http://localhost:3000/api/jobs/new
echo   Metrics:       http://localhost:3000/api/metrics/summary
echo.

npm run dev
pause
