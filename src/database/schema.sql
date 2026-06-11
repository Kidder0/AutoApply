-- Jobs table: stores normalized job data from all sources
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  salary_currency VARCHAR(3),
  employment_type VARCHAR(50),
  remote_type VARCHAR(50),
  description TEXT,
  apply_url TEXT,
  posted_date TIMESTAMP,
  discovered_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  source VARCHAR(100),
  source_url TEXT,
  is_new BOOLEAN DEFAULT TRUE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  canonical_job_id BIGINT REFERENCES jobs(id),
  embedding BYTEA,
  hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_salary CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);

CREATE INDEX IF NOT EXISTS idx_jobs_is_new ON jobs(is_new) WHERE is_new = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_date ON jobs(posted_date DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_hash ON jobs(hash);
CREATE INDEX IF NOT EXISTS idx_jobs_canonical ON jobs(canonical_job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_external_id ON jobs(external_id);

-- Job sources tracking
CREATE TABLE IF NOT EXISTS job_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  last_crawl_time TIMESTAMP,
  next_crawl_time TIMESTAMP,
  crawl_interval_minutes INT DEFAULT 240,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crawl metrics and logging
CREATE TABLE IF NOT EXISTS crawl_logs (
  id BIGSERIAL PRIMARY KEY,
  source_id INT REFERENCES job_sources(id),
  crawl_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  crawl_end_time TIMESTAMP,
  jobs_discovered INT DEFAULT 0,
  new_jobs_added INT DEFAULT 0,
  duplicates_removed INT DEFAULT 0,
  duplicates_merged INT DEFAULT 0,
  failed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crawl_logs_source ON crawl_logs(source_id);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_status ON crawl_logs(status);
CREATE INDEX IF NOT EXISTS idx_crawl_logs_time ON crawl_logs(crawl_start_time DESC);

-- Deduplication map
CREATE TABLE IF NOT EXISTS job_duplicates (
  primary_job_id BIGINT NOT NULL REFERENCES jobs(id),
  duplicate_job_id BIGINT NOT NULL REFERENCES jobs(id),
  similarity_score DECIMAL(3,2),
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (primary_job_id, duplicate_job_id),
  CHECK (primary_job_id < duplicate_job_id)
);

CREATE INDEX IF NOT EXISTS idx_duplicates_primary ON job_duplicates(primary_job_id);
CREATE INDEX IF NOT EXISTS idx_duplicates_duplicate ON job_duplicates(duplicate_job_id);

-- Search queries log
CREATE TABLE IF NOT EXISTS search_logs (
  id BIGSERIAL PRIMARY KEY,
  query_text VARCHAR(500),
  method VARCHAR(50),
  results_count INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at DESC);

-- System metrics
CREATE TABLE IF NOT EXISTS system_metrics (
  id BIGSERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON system_metrics(metric_name, recorded_at DESC);
