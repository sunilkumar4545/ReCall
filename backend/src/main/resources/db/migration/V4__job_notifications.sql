-- =============================================================================
-- Flyway Migration V4: Job Notifications & Circular FIFO Storage
-- Maintains a rolling window of max 150 active jobs (< 75 KB DB footprint)
-- =============================================================================

CREATE TABLE IF NOT EXISTS job_notifications (
    id BIGSERIAL PRIMARY KEY,
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(150),
    location VARCHAR(100),
    apply_url TEXT NOT NULL,
    description VARCHAR(500),
    channel_title VARCHAR(150),
    channel_username VARCHAR(100),
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON job_notifications(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_content_hash ON job_notifications(content_hash);
