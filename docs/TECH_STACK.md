Here is the complete, **100% free and open-source** tech stack we will use to build **Recall**, organized by architectural layer so you can map out your learning and include it cleanly on your resume:

---

### 1. Core Backend & Language

* **Java 21 (LTS):** Utilizing modern features like Records, Pattern Matching, and **Virtual Threads** for high-throughput I/O.
* **Spring Boot 3.4+ / 4.x:** The core application framework (Spring Web, Spring Data JPA, Spring Validation, Spring Scheduling).
* **Maven:** Build automation and dependency management.

### 2. Artificial Intelligence & RAG (Zero-Cost)

* **Spring AI:** Unified abstraction for LLM chat, embeddings, structured outputs (`BeanOutputConverter`), and vector stores.
* **Ollama (Local LLM Engine):** Runs open-source models locally on your machine for free (e.g., `llama3.2` for chat/formatting and `nomic-embed-text` for vector embeddings).
* **Google Gemini API (Free Developer Tier):** Optional zero-cost cloud fallback/alternative to Ollama.
* **Apache PDFBox / Tika:** Extracts raw text from uploaded PDF documents for AI indexing.

### 3. Databases & Storage

* **PostgreSQL 16:** Primary relational database for users, category tabs, blog posts, and metadata.
* **PGVector:** PostgreSQL extension used as our **Vector Database** to store and search 768-dimensional AI embeddings.
* **Flyway:** Version-controlled database schema migrations (`V1__init.sql`, etc.) instead of `ddl-auto=update`.
* **MinIO:** Self-hosted, **AWS S3-compatible** object storage running in Docker for storing uploaded PDFs and code screenshots locally for free.
* **Redis:** In-memory store for caching popular category tabs/posts, storing AI chat conversation memory, and managing refresh tokens.

### 4. Security & Access Control

* **Spring Security 6+:** Core authentication and authorization framework.
* **OAuth2 Client (Google Login):** Passwordless Single Sign-On (SSO) using Google accounts.
* **JWT (JSON Web Tokens - JJWT):** Stateless Bearer token authentication with Redis-backed refresh token rotation.
* **Bucket4j + Redis:** Distributed rate limiting to protect AI and upload endpoints from abuse.

### 5. Messaging, Resilience & Background Automation

* **RabbitMQ:** Message broker for asynchronous document/PDF parsing, YouTube metadata extraction, and AI vectorization—complete with **Dead Letter Queues (DLQ)** and retry policies.
* **Resilience4j:** Fault-tolerance library providing `@CircuitBreaker`, `@Retry`, and `@TimeLimiter` around LLM and external API calls.
* **ShedLock (with Redis):** Distributed lock for `@Scheduled` jobs (such as daily spaced-repetition recall digests) so duplicate pods in Kubernetes never execute the same job twice.

### 6. Observability, API Docs & Testing

* **Spring Boot Actuator & Micrometer:** Exposes application health probes (`/liveness`, `/readiness`) and runtime metrics.
* **Prometheus & Grafana:** Self-hosted monitoring stack for scraping metrics and visualizing latency, JVM memory, and queue depths.
* **Springdoc OpenAPI (Swagger UI):** Auto-generated interactive REST API documentation and testing interface.
* **RFC 7807 `ProblemDetail`:** Standardized, production-grade JSON error responses.
* **JUnit 5, Mockito & Testcontainers:** Integration testing using real ephemeral Docker containers for PostgreSQL and RabbitMQ.

### 7. DevOps, Containers & Orchestration (Zero-Cost)

* **Docker & Docker Compose:** Multi-stage `Dockerfile` for optimized Java images and `docker-compose.yml` to spin up the entire local infrastructure stack in one command.
* **Minikube (Kubernetes):** Local Kubernetes cluster to practice Deployments, Services, ConfigMaps, Secrets, Persistent Volume Claims (PVCs), and Horizontal Pod Autoscaling (HPA).
* **GitHub Actions:** Automated CI/CD pipeline to run tests, build Docker images, and validate manifests on every `git push`.

### 8. Frontend (Clean Tabbed UI)

* **React (Vite) + Tailwind CSS:** Fast, responsive single-page web application with category tabs (`Java`, `Frontend`, `System Design`, etc.).
* **Prism.js / Shiki:** Syntax-highlighted code blocks with one-click copy functionality.
* **React-Markdown:** Renders clean, formatted blog-style notes alongside embedded YouTube players and PDF previews.

---

### Quick Summary Line for Your Resume

> **Tech Stack:** Java 21, Spring Boot, Spring AI, Ollama/Gemini, PostgreSQL, PGVector, Flyway, Redis, MinIO (S3), RabbitMQ, Spring Security (Google OAuth2 & JWT), Resilience4j, Bucket4j, ShedLock, Docker, Kubernetes (Minikube), Prometheus, Grafana, GitHub Actions, Testcontainers, React.

Ready to start **Phase 1**? Let me know if you'd like the complete `docker-compose.yml` and Maven `pom.xml` next!