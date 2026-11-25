-- =============================================================================
-- Flyway Migration V2: Claim-Check Reference Pattern for Object Storage
-- Protects 500 MB Neon DB limit by offloading large texts to S3 / Object Storage
-- =============================================================================

ALTER TABLE recall_entries
    ADD COLUMN IF NOT EXISTS content_key VARCHAR(500),
    ADD COLUMN IF NOT EXISTS content_url VARCHAR(1000),
    ADD COLUMN IF NOT EXISTS compression_type VARCHAR(50) DEFAULT 'GZIP',
    ADD COLUMN IF NOT EXISTS content_size_bytes BIGINT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS compressed_size_bytes BIGINT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_recall_entries_content_key ON recall_entries(content_key);
