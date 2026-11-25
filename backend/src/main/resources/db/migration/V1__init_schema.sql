-- =============================================================================
-- Flyway Migration V1: ReCall by sunil4224 Schema (Aligned with PRD 3.txt)
-- Database: Neon Serverless PostgreSQL
-- =============================================================================

-- 1. Enable PGVector extension (Native support in Neon)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Users Table (Google OAuth 2.0 Authenticated Users)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    picture_url VARCHAR(500),
    provider VARCHAR(50) DEFAULT 'GOOGLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Categories Table ("Fields" as required by FR-2 in PRD)
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Recall Entries Table (Rich Coding & Concept Blog Posts as required by FR-3)
CREATE TABLE IF NOT EXISTS recall_entries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    explanation TEXT,
    code_language VARCHAR(50),
    code_snippet TEXT,
    image_url VARCHAR(1000),
    youtube_url VARCHAR(1000),
    youtube_embed_url VARCHAR(1000),
    pdf_url VARCHAR(1000),
    pdf_name VARCHAR(255),
    embedding vector(768), -- 768-dim AI semantic vector for RAG
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Seed Initial Developer Categories (as specified in FR-2.1 of PRD 3.txt)
INSERT INTO categories (name, slug)
VALUES 
    ('Java', 'java'),
    ('DSA', 'dsa'),
    ('MySQL', 'mysql'),
    ('Spring Boot', 'spring-boot'),
    ('Spring AI', 'spring-ai'),
    ('AI Tools', 'ai-tools'),
    ('Docker', 'docker')
ON CONFLICT (slug) DO NOTHING;
