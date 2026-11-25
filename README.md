# ReCall AI — Indexed Developer Memory & Knowledge Engine

[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20Vite-black?style=flat-square&logo=react)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-Spring%20Boot%203.3.5%20%7C%20Java%2017-black?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![Database](https://img.shields.io/badge/Database-Neon%20Serverless%20Postgres-00E599?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Storage](https://img.shields.io/badge/Storage-Backblaze%20B2%20(S3)-red?style=flat-square)](https://www.backblaze.com/b2/)
[![Theme](https://img.shields.io/badge/UI-Dark%20Brutalist%20Mono-white?style=flat-square)](#)

> **ReCall AI** is an enterprise-grade developer knowledge engine and memory vault designed for high-density note revision, code snippet recall, interview prep, autonomous job radar ingestion, and zero-cost cloud architecture.

---

## ⚡ Architectural Highlights

1. **Dark Brutalist High-Density UI**:
   - Engineered with React 18, TypeScript, Tailwind CSS, Lucide icons, Prism syntax highlighting, and Three.js / Canvas 3D core visualizer.
   - Fast, distraction-free typography with responsive mobile and desktop support.

2. **Git-Backed Zero-DB Markdown Notes Vault**:
   - Pure local filesystem vault in `frontend/src/content/notes/` categorized by domain (e.g., `java`, `react`, `system-design`, `database`).
   - Integrated with GitHub REST API (`GitHubVaultSyncService.java`) for continuous GitOps auto-commits directly into GitHub with zero database or object storage compute.

3. **Neon Serverless Zero-Scale Optimization (100% Free-Tier Guaranteed)**:
   - Customized HikariCP connection pool (`minimum-idle = 0`, `idle-timeout = 30000ms`, `keepalive-time = 0`).
   - Spring Boot drains idle database connections down to 0 after 30 seconds of inactivity, allowing Neon PostgreSQL compute to automatically suspend (0.00 CU-hrs consumed when idle).

4. **Claim-Check Pattern & GZIP Blob Storage**:
   - Lightweight metadata and titles stored in PostgreSQL.
   - Heavy code explanations and markdown bodies compressed via GZIP and stored in Backblaze B2 (S3-compatible 10GB free tier) or local storage.

5. **Autonomous Telegram Job Radar with In-Memory Eco Mode**:
   - Background Telethon listener streams real-time tech opportunities.
   - Controlled via an in-memory `AtomicBoolean` gatekeeper in Spring Boot (`/api/jobs/stream-status`) so jobs are buffered in memory and never wake Neon up until enabled.

6. **Free-Tier Dual AI Engine**:
   - Integrated with Google Gemini API (`gemini-3.5-flash`) and Groq Cloud (`openai/gpt-oss-120b`) for concept explanations, code debugging, and interview quizzes.

---

## 📁 Repository Structure

```text
ReCall/
├── frontend/                      # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/            # Brutalist UI components & modals
│   │   ├── content/notes/         # Local Git-backed markdown files
│   │   ├── features/              # Category workspace, Job radar, Vault
│   │   └── services/              # API clients with dynamic Vercel baseURL
│   ├── vercel.json                # SPA routing rewrite rule
│   └── Dockerfile / configs
│
├── backend/                       # Spring Boot 3.3.5 (Java 17) REST API
│   ├── src/main/java/com/recall/  # Controllers, Services, Entities, Repositories
│   ├── src/main/resources/        # application.yml, Hikari zero-scale configs, Flyway
│   ├── Dockerfile                 # Multi-stage Alpine container build
│   └── pom.xml
│
├── telegram-listener/             # Python Telethon asynchronous daemon
│   ├── listener.py                # Smart eco-buffered Telegram scraper
│   └── login.py                   # MTProto session authenticator
│
└── docs/                          # PRD, Architecture & Tech specifications
```

---

## 🚀 Quickstart (Local Development)

### 1. Backend (Spring Boot)
Ensure Java 17+ and Maven are installed.
```bash
cd backend
cp .env.example .env
# Fill in your Neon PostgreSQL and credentials in .env
mvn spring-boot:run
```
Backend starts on `http://localhost:8080`.
Interactive OpenAPI Swagger docs available at `http://localhost:8080/swagger-ui.html`.

### 2. Frontend (React + Vite)
Ensure Node.js 18+ is installed.
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend runs at `http://localhost:3000`.

---

## ☁️ Cloud Deployment Guide

### A. Deploy Frontend (Vercel)
1. Push this repository to GitHub.
2. In Vercel, click **Add New Project** and import `sunilkumar4545/ReCall`.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://your-backend-domain.onrender.com`
5. Click **Deploy**. SPA routing is automatically handled via `vercel.json`.

### B. Deploy Backend (Render / Railway / Fly.io)
#### Using Docker (Recommended):
1. In Render / Railway, select **New Web Service** -> **Deploy from Git Repo**.
2. Set **Root Directory**: `backend`
3. Select **Docker** (Render will use `backend/Dockerfile`).
4. Set Environment Variables:
   - `NEON_DB_URL`: `jdbc:postgresql://<your-neon-host>/neondb?sslmode=require`
   - `NEON_DB_USER`: `<your-neon-user>`
   - `NEON_DB_PASS`: `<your-neon-password>`
   - `STORAGE_TYPE`: `s3`
   - `STORAGE_S3_ACCESS_KEY`: `<your-b2-key>`
   - `STORAGE_S3_SECRET_KEY`: `<your-b2-secret>`
   - `STORAGE_S3_BUCKET`: `recall4224`
   - `STORAGE_S3_ENDPOINT`: `https://s3.us-east-005.backblazeb2.com`
   - `GITHUB_TOKEN`: `<your-github-pat-with-contents-write>`
   - `GITHUB_REPO`: `sunilkumar4545/ReCall`
   - `GITHUB_BRANCH`: `main`
   - `CORS_ALLOWED_ORIGINS`: `https://*.vercel.app,https://*.netlify.app,http://localhost:3000`

---

## 🔐 Credentials & Security Notice
- Actual `.env` files are strictly excluded via `.gitignore` and never committed to version control.
- In production, configure all sensitive keys directly in your cloud hosting provider's Environment Variables dashboard.

---

## 📄 License
This project is licensed under the Apache 2.0 License.
