# StudyPass — Setup Guide

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Expo CLI (`npm install -g expo-cli`)

---

## Quick Start

### 1. Clone & Install JS dependencies

```bash
npm install   # from project root — installs all workspaces
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your Supabase credentials (or leave defaults for local dev)
```

### 3. Start PostgreSQL

```bash
docker-compose up -d postgres
```

### 4. Install Python dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 5. Run database migrations

```bash
cd backend
alembic upgrade head
```

### 6. Ingest questions from PDF sources

```bash
cd backend
python scripts/ingest_questions.py
```

This will:
- Parse all 4 PDF source files (3 Revei booklets + 1 exam prep book)
- Insert ~700+ questions with answers and explanations
- Create the California Real Estate course record

### 7. Start the backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### 8. Start the web app

```bash
cd apps/web
npm run dev
```

Web app at: http://localhost:3000

### 9. Start the mobile app

```bash
cd apps/mobile
npx expo start
```

Scan QR code with Expo Go app on your device.

---

## Project Structure

```
studypass/
  apps/
    web/          ← Next.js 14 web app
    mobile/       ← Expo React Native app
  packages/
    core/         ← Shared TypeScript types, API client, utils
  backend/        ← FastAPI Python backend
    app/
      routers/    ← API route handlers
      models/     ← SQLAlchemy ORM models
      schemas/    ← Pydantic request/response schemas
      services/   ← Business logic
    scripts/
      ingest_questions.py  ← PDF → Database pipeline
    alembic/      ← Database migrations
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Login |
| GET | /courses | List all courses |
| GET | /courses/{id} | Course details + topics |
| GET | /questions | List questions (filter by topic, course, etc.) |
| POST | /exams/start | Start exam session |
| POST | /exams/{id}/submit | Submit exam answers |
| GET | /exams/{id}/results | Get exam results |
| GET | /exams/history | User's exam history |
| GET | /progress/summary | Score trends, streaks, weak topics |
| GET | /progress/topics | Per-topic breakdown |

## Data Sources

| File | Questions | Topics | Has Explanations |
|------|-----------|--------|-----------------|
| Real Estate Finance Booklet.pdf | 200 | Finance | No |
| Real Estate Practice Booklet.pdf | 200 | Practice | No |
| Real Estate Principles Booklet.pdf | 200 | Principles | No |
| Real_Estate_Exam_Professionals_Ltd_2021_...pdf | ~500+ | Multiple | Yes |

## Passing Score

California Real Estate Salesperson Exam: **70%** (105/150 questions)
