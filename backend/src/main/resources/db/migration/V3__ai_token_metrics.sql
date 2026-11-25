-- =============================================================================
-- Flyway Migration V3: Persistent AI Token Telemetry
-- Persists token consumption across backend server restarts and reboots
-- =============================================================================

CREATE TABLE IF NOT EXISTS ai_token_metrics (
    id VARCHAR(50) PRIMARY KEY,
    total_tokens_used BIGINT NOT NULL DEFAULT 0,
    total_queries INT NOT NULL DEFAULT 0,
    prompt_tokens_used BIGINT NOT NULL DEFAULT 0,
    completion_tokens_used BIGINT NOT NULL DEFAULT 0,
    token_limit BIGINT NOT NULL DEFAULT 1000000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO ai_token_metrics (id, total_tokens_used, total_queries, prompt_tokens_used, completion_tokens_used, token_limit)
VALUES ('global_telemetry', 0, 0, 0, 0, 1000000)
ON CONFLICT (id) DO NOTHING;
