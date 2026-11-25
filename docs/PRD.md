# Product Requirements Document (PRD): **Recall**

| Field | Details |
| --- | --- |
| **Product Name** | **Recall** (Indexed Memory Logs)

 |
| **Target User** | Software Developer saving and revising technical content across tools, languages, frameworks, and concepts |
| **Constraint Profile** | **100% Free Tiers Only** — Zero credit card / payment details, no Docker required right now, cloud-hosted free DB/storage/AI/auth

 |
| **Core Experience** | Clean blog-style knowledge base with dynamic categories, rich coding/concept posts, code boxes, images, embedded YouTube videos, PDFs, Google Login, and AI assistance

 |

---

## 1. Product Vision & Problem Statement

### Problem

As a software developer scrolling feeds, articles, videos, and docs across **Java**, **DSA**, **MySQL**, **Spring Boot**, **Spring AI**, **AI Tools**, and emerging technologies, useful insights get buried in bookmarks, chats, or history and are hard to recall during coding, interviews, or project work.

### Vision

Build **Recall**—a fast, distraction-free personal developer blog and memory log where every newly discovered concept, code solution, diagram, video, or PDF can be captured immediately under a category, organized cleanly, enhanced with AI, and reviewed effortlessly.

### Non-Goals (For Current Phase)

* Running Docker/Kubernetes locally or paying for cloud billing/credit-card tiers.


* Multi-tenant public social network features (comments, public feeds, monetized subscriptions).

---

## 2. Zero-Cost Architecture & Free Resource Strategy

Everything must operate within **no-credit-card free tiers**:

* **Authentication:** Google OAuth 2.0 Login via Google Cloud Console + Spring Security (issuing session/JWT tokens for API calls).


* **Database:** Free PostgreSQL tier (e.g., Supabase or Aiven) with Flyway migrations; optional `pgvector` support when AI search/RAG is enabled.


* **File & Media Storage:** Free cloud storage bucket (e.g., Supabase Storage or Cloudinary free tier) for **concept images** and **PDF files**, storing returned URLs in PostgreSQL.
* **AI Capabilities:** Free tier Gemini API key via Google AI Studio for generating structured explanations, summaries, code breakdowns, or tags.
* **Backend & Frontend Hosting:** Spring Boot backend (local during active development or free tier host like Render) and React + Tailwind frontend (free tier host like Vercel/Netlify).

---

## 3. User Personas & Core User Flows

### Primary Persona: Developer Learner / Builder

* Discovers a useful snippet, pattern, query, AI tool workflow, YouTube walkthrough, or PDF cheatsheet.
* Opens **Recall**, picks an existing category (or creates a new category on the fly), fills in the entry details, and publishes it to their blog-style view.
* Later filters by category or keyword to review explanations, copy code blocks, view diagrams, watch the embedded video, or open the attached PDF.

### Key User Flows

1. **Google Login:** User clicks *Sign in with Google* -> authenticates via Google OAuth2 -> lands in Recall workspace with their profile/session active.


2. **Dynamic Category Creation:** User clicks `+ New Category`, enters a name (e.g., *System Design*, *Kafka*, *Redis*), backend normalizes a unique slug (`system-design`), saves to DB, and the UI updates filter pills and dropdowns immediately.
3. **Create Rich Recall Entry:** User selects a category and enters:
* **Title** & **Short Description/Summary**
* **Detailed Explanation** (rich blog-style layout)
* **Code Block** (language + formatted code box + copy button)
* **Concept Image** (file upload -> cloud storage -> displayed inline)
* **YouTube Video** (YouTube URL -> validated/converted -> embedded player)
* **PDF Document** (PDF upload -> cloud storage -> embedded viewer / open-in-new-tab / download)


4. **Optional AI Assist:** User clicks *Generate / Polish Explanation* (via Gemini free tier) to turn rough notes or code into a structured blog explanation.
5. **Browse, Filter & Read:** User filters by `/ category` pills (matching the *Indexed Memory Logs* layout), searches by keyword, opens any card into a clean blog reader view, and edits or deletes entries.



---

## 4. Functional Requirements

### FR-1: Authentication & Access Control

* **FR-1.1:** Support Google OAuth 2.0 login flow.
* **FR-1.2:** Protect create, update, and delete endpoints so only authenticated users can mutate data (or restrict to the authenticated user's own entries).
* **FR-1.3:** Provide logout and clear error handling when unauthenticated requests hit protected endpoints.

### FR-2: Dynamic Categories ("Fields")

* **FR-2.1:** Seed initial developer categories (`Java`, `DSA`, `MySQL`, `Spring Boot`, `Spring AI`, `AI Tools`, `Docker`).
* **FR-2.2:** Allow adding new categories dynamically at any time via UI and `POST /api/categories`.
* **FR-2.3:** Auto-generate URL-safe slugs and reject duplicate categories cleanly (`409 Conflict`).
* **FR-2.4:** Allow filtering entries by any category slug or viewing all entries (`/ all`).

### FR-3: Coding & Concept Blog Entries

* **FR-3.1:** Every entry must support:
* `title` (required)
* `categoryId` (required)
* `summary` / short description
* `explanation` (detailed concept explanation rendered in clean blog typography)
* `codeLanguage` and `codeSnippet` (rendered inside a dedicated code box with syntax highlighting and one-click **Copy**)
* `imageUrl` (optional uploaded concept diagram/screenshot)
* `youtubeUrl` / `youtubeEmbedUrl` (optional embedded YouTube player)
* `pdfUrl` / `pdfFileName` (optional attached PDF)


* **FR-3.2:** Support full **CRUD** (`Create`, `Read` list + detail view, `Update`, `Delete`) and keyword search across title, summary, explanation, and code.

### FR-4: Media & File Handling (Images, YouTube, PDFs)

* **FR-4.1 (Images):** Validate file type (PNG, JPG, WEBP) and size limit (e.g., ≤ 5 MB) to stay comfortably within free storage quotas; upload to free object storage and render in the entry view.
* **FR-4.2 (YouTube):** Accept standard YouTube URLs (`[youtube.com/watch?v=](https://youtube.com/watch?v=)...`, `youtu.be/...`, `[youtube.com/shorts/](https://youtube.com/shorts/)...`) and safely convert to embeddable URLs (`[https://www.youtube.com/embed/](https://www.youtube.com/embed/)<id>`) without breaking on invalid URLs.
* **FR-4.3 (PDFs):** Validate `.pdf` files and size limit (e.g., ≤ 10 MB); upload to free storage and provide an embedded PDF viewer + direct link.

### FR-5: AI Assistance (Free Tier)

* **FR-5.1:** Provide an endpoint/action (e.g., `POST /api/ai/explain`) using the free Gemini API to help draft a clear step-by-step explanation, time/space complexity (for DSA), or key takeaways from raw notes/code.
* **FR-5.2:** Gracefully handle missing API keys, quota limits, or network timeouts with clear fallback messages (never crashing entry creation).

---

## 5. Data Model & API Contract Overview

### Core Entities

* **`users`**: `id`, `email` (unique), `name`, `picture_url`, `provider`, `created_at`
* **`categories`**: `id`, `slug` (unique), `name`, `created_at`
* **`recall_entries`**: `id`, `user_id` (FK), `category_id` (FK), `title`, `summary`, `explanation`, `code_language`, `code_snippet`, `image_url`, `youtube_url`, `youtube_embed_url`, `pdf_url`, `pdf_name`, `created_at`, `updated_at`

### REST API Endpoints

* `GET /api/categories` — List all categories ordered by name.
* `POST /api/categories` — Create a new category (`{ name }`).
* `GET /api/entries?category={slug}&q={keyword}` — List/filter entries.
* `GET /api/entries/{id}` — Fetch full entry details for the blog view.
* `POST /api/entries` — Create a new entry.
* `PUT /api/entries/{id}` — Update an existing entry.
* `DELETE /api/entries/{id}` — Delete an entry.
* `POST /api/media/upload` — Upload an image or PDF to free storage and return `{ url, fileName, type }`.
* `POST /api/ai/explain` — Generate structured explanation/summary from title, code, and notes.

---

## 6. Non-Functional Requirements & Guardrails

* **Zero Cost Guarantee:** No service in the default setup may require a credit card or paid plan.
* **Security & Validation:** Use Bean Validation (`@NotBlank`, `@Size`), parameterized queries via JPA, strict MIME/extension checks on uploads, and environment variables (`${...}`) for secrets (never commit API keys or client secrets).
* **Usability & Readability:** Clean blog reader layout inspired by *Indexed Memory Logs*, scannable sections, responsive design for desktop and mobile scrolling, and fast search/filtering.


* **Reliability:** Standardized error responses (`ProblemDetail` / JSON errors) and clear UI loading/empty/error states.

---

## 7. Phased Delivery Plan

1. **Phase 1 — Foundation & Dynamic Categories:** Free Postgres setup, schema/Flyway migrations, `Category` & `Entry` CRUD APIs, and category filter bar + `+ New Category` modal.
2. **Phase 2 — Rich Blog View & Rich Media:** Code block box with copy button, blog-style explanation view, image upload, YouTube embed parser/player, and PDF upload/viewer.
3. **Phase 3 — Google Login & Free AI Polish:** Google OAuth2 sign-in integration, protected write routes, and Gemini free-tier explanation helper.

---

Would you like to move into **Phase 1** by generating the **database schema + Spring Boot backend controllers/services**, or start with the **React UI (category bar + entry creation form + blog reader view)**?