# OTET Prep Pro — Enterprise Examination & Assessment Platform

An enterprise-grade, secure, multi-tier mock examination system built for the **Odisha Teacher Eligibility Test (OTET)**. 

Engineered with a modern decoupled architecture:
* **Frontend:** Clean, responsive, accessible Single-Page App (SPA) optimized for **Vercel** with zero-latency global CDN deployment.
* **Backend:** Robust RESTful API engine powered by **Java 17/21 & Spring Boot 3**.
* **Database:** Relational persistence with **PostgreSQL** (Neon / Supabase / AWS RDS / Docker) and Spring Data JPA / Hibernate.
* **Security & Integrity:** Server-side answer protection (correct answers are never shipped to the client during an exam), server-side grading, and autosave.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────┐
                      │             Vercel Frontend               │
                      │        (HTML5, CSS3, ES6 Modules)         │
                      └─────────────────────┬─────────────────────┘
                                            │
                                            │ HTTPS / REST API
                                            ▼
                      ┌───────────────────────────────────────────┐
                      │         Spring Boot 3 API Server          │
                      │         (Render / Railway / Cloud)        │
                      │  • Sanitized Question Delivery (No Ans)   │
                      │  • Server-side Attempt Evaluation         │
                      │  • CORS & CSRF Hardening                  │
                      └─────────────────────┬─────────────────────┘
                                            │
                                            │ Hikari Connection Pool (JDBC)
                                            ▼
                      ┌───────────────────────────────────────────┐
                      │            PostgreSQL Database            │
                      │     (Neon / Supabase / AWS / Local)       │
                      │  • test_papers        • questions         │
                      │  • question_options   • test_attempts     │
                      │  • user_answers                           │
                      └───────────────────────────────────────────┘
```

---

## Project Structure

```
├── backend/                       # Spring Boot 3 (Java 17/21) REST Backend
│   ├── src/main/java/com/otet/prep/
│   │   ├── config/                # CORS & Web security configurations
│   │   ├── controller/            # REST API endpoints (/api/v1/tests, etc.)
│   │   ├── model/entity/          # JPA Entities (TestPaper, Question, Attempt)
│   │   ├── model/dto/             # Data Transfer Objects (Client-safe DTOs)
│   │   ├── repository/            # Spring Data JPA repositories
│   │   └── service/               # Test evaluation & auto-seeding engine
│   ├── src/main/resources/
│   │   ├── application.yml        # Dev (H2) and Prod (PostgreSQL) profiles
│   │   ├── schema.sql             # Pure SQL DDL schema
│   │   └── seed_data.json         # 244+ preloaded OTET questions
│   ├── pom.xml                    # Maven configuration
│   └── Dockerfile                 # Multi-stage production container build
│
├── frontend/                      # Modern, secure client ready for Vercel
│   ├── index.html                 # Semantic HTML5 exam layout
│   ├── app.js                     # Safe DOM manipulation & API state engine
│   ├── style.css                  # Modern UI, palette styles, dark/light accents
│   ├── config.js                  # Dynamic API base URL configuration
│   └── vercel.json                # Security headers & clean URL rules
│
├── pipeline/                      # Extraction pipeline & data tools
│   ├── extract_with_gemini.py     # OCR & vision extraction tools
│   └── raw_pdfs/                  # Archived exam papers (ignored from git)
│
├── docker-compose.yml             # 1-command local full-stack development
├── vercel.json                    # Root Vercel routing configuration
└── README.md
```

---

## Core Security & Anti-Cheat Features

1. **Client-Safe Question DTOs:** During an ongoing exam, questions are served to the browser via `GET /api/v1/tests/{paperCode}/questions`. The `correctOptionIndex` field is strictly omitted from the API response so inspecting elements in DevTools reveals no answers.
2. **Server-Side Scoring:** Answers are evaluated entirely in the backend against ground truth in PostgreSQL when `POST /api/v1/tests/{paperCode}/submit` is invoked.
3. **Zero Secrets in Code:** AI keys and database passwords are loaded via environment variables (`.env`).
4. **XSS Protection:** Direct `innerHTML` injections of user input have been completely replaced with safe DOM element creation (`document.createElement` and `textContent`).

---

## REST API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/health` | Healthcheck and backend status |
| `GET` | `/api/v1/tests` | List all available test papers (Paper 1, Paper 2 Social, Paper 2 Science) |
| `GET` | `/api/v1/tests/{paperCode}/questions` | Fetch questions for a paper (secure: no answers included) |
| `POST` | `/api/v1/tests/{paperCode}/submit` | Submit candidate responses and receive verified score breakdown |

---

## Quickstart (Local Development)

### Option 1: Docker Compose (Instant Full Stack)
Run the entire stack (PostgreSQL + Spring Boot + Frontend) with one command:
```bash
docker compose up --build
```
* Frontend: `http://localhost:3000`
* Backend API: `http://localhost:8080/api/v1`

### Option 2: Running Components Individually
**1. Run Spring Boot Backend:**
```bash
cd backend
mvn clean spring-boot:run
```
*(By default, uses the `dev` profile with in-memory H2 database with automatic question seeding so you don't even need PostgreSQL running locally).*

**2. Run Frontend:**
Serve the `frontend/` directory with any static server:
```bash
npx serve frontend -p 3000
```

---

## Deployment Guide

### Deploying Frontend to Vercel
1. Push this repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your `otet-prep` repository.
4. Set **Root Directory** to `frontend` (or keep root).
5. Add an Environment Variable in Vercel:
   * Key: `API_BASE_URL`
   * Value: Your live backend URL (e.g. `https://otet-api.onrender.com/api/v1`)
6. Click **Deploy**.

### Deploying Backend to Render or Railway
1. Create a new Web Service on [Render](https://render.com) or [Railway](https://railway.app).
2. Connect your `otet-prep` GitHub repository.
3. Set Root Directory to `backend` and build via Dockerfile.
4. Supply environment variables:
   * `SPRING_PROFILES_ACTIVE`: `prod`
   * `DATABASE_URL`: `jdbc:postgresql://<neon-or-supabase-host>:5432/<dbname>?sslmode=require`
   * `DB_USER`: `<db-user>`
   * `DB_PASSWORD`: `<db-password>`
   * `CORS_ALLOWED_ORIGINS`: `https://your-app.vercel.app`

---

## License
MIT License. Free for educational and personal exam preparation.
