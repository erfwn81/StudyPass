# StudyPass — California Real Estate License Exam Prep

A full-stack exam prep app for the California Department of Real Estate (DRE) Salesperson License Exam. Built with a FastAPI backend, Next.js 14 web app, and a local AI tutor powered by Ollama running on your GPU.

---

## What's Inside

- **600+ real exam questions** from 3 official Revei booklets (Finance, Practice, Principles)
- **AI tutor chat** — ask anything about real estate, powered by llama3.2 running locally
- **Practice tests** — Finance, Practice, and Principles exams + mixed 150-question simulations
- **Study guide** — browse all questions by booklet and topic with answer reveals
- **Progress tracking** — scores, streaks, weak topics, and exam history
- **GPU-accelerated explanations** — auto-generate explanations for questions using your NVIDIA GPU

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand, React Query |
| Backend | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2 |
| Database | PostgreSQL 16 |
| AI | Ollama + llama3.2 (local, GPU) |
| Auth | JWT (python-jose + passlib) |
| Monorepo | Turborepo, shared `packages/core` TypeScript library |

---

## Requirements

### System
- Ubuntu 22.04+ (or compatible Linux)
- Python 3.11+ (3.13 recommended via Anaconda)
- Node.js 18+
- PostgreSQL 16
- NVIDIA GPU with CUDA (optional, for AI features)
- Ollama (optional, for AI tutor and explanation generation)

### Accounts / Keys
- No external API keys required — everything runs locally

---

## Setup Guide

### 1. Clone the repository

```bash
git clone git@github.com:erfwn81/StudyPass.git
cd StudyPass
```

---

### 2. Set up PostgreSQL

If PostgreSQL is not installed:

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Create the database and user:

```bash
sudo -u postgres psql << 'EOF'
CREATE USER studypass WITH LOGIN PASSWORD 'studypass';
CREATE DATABASE studypass OWNER studypass;
GRANT ALL PRIVILEGES ON DATABASE studypass TO studypass;
EOF
```

If you get a password authentication error, edit `/etc/postgresql/16/main/pg_hba.conf` and make sure the host lines use `scram-sha-256` or `md5`, then restart:

```bash
sudo systemctl restart postgresql
```

Test the connection:

```bash
psql "postgresql://studypass:studypass@127.0.0.1:5432/studypass" -c "SELECT 1"
```

---

### 3. Set up the Python environment

Using Anaconda (recommended):

```bash
conda create -n studypass python=3.13 -y
conda activate studypass
```

Install dependencies:

```bash
cd backend
pip install -r requirements.txt
pip install "bcrypt==3.2.2"   # Required for passlib compatibility
```

---

### 4. Run database migrations

From the `backend/` directory:

```bash
alembic upgrade head
```

---

### 5. Add the PDF source files

Place the following PDF files in the **project root** (same folder as `package.json`):

```
StudyPass/
├── Real Estate Finance Booklet.pdf
├── Real Estate Practice Booklet.pdf
└── Real Estate Principles Booklet.pdf
```

These are the official Revei booklets for the California Real Estate License Exam.

---

### 6. Ingest questions into the database

From the `backend/` directory:

```bash
python scripts/ingest_questions.py
```

This parses all 3 booklets and seeds ~600 questions into PostgreSQL. Takes about 30 seconds.

---

### 7. (Optional) Set up Ollama for AI features

Install Ollama:

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

Or download manually from [ollama.com](https://ollama.com) and extract to `~/.local/bin/`.

Pull the AI model (2GB download):

```bash
ollama pull llama3.2
```

Start Ollama (runs in background):

```bash
ollama serve &
```

Generate AI explanations for all questions (uses GPU, ~5 minutes):

```bash
cd backend
python scripts/generate_explanations.py
```

---

### 8. Install Node.js dependencies

From the project root:

```bash
npm install
```

---

### 9. Start the backend

Open a terminal in `backend/` and run:

```bash
conda activate studypass
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO: Application startup complete.
```

---

### 10. Start the web app

Open a **second terminal** in `apps/web/` and run:

```bash
npm run dev
```

Then open your browser at [http://localhost:3000](http://localhost:3000)

---

## Running Everything (Quick Reference)

After initial setup, you only need two terminals:

**Terminal 1 — Backend:**
```bash
cd ~/StudyPass/backend
conda activate studypass
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd ~/StudyPass/apps/web
npm run dev
```

**Optional — Ollama AI:**
```bash
ollama serve
```

---

## Project Structure

```
StudyPass/
├── apps/
│   ├── web/              # Next.js 14 web app
│   └── mobile/           # Expo React Native app (WIP)
├── packages/
│   └── core/             # Shared TypeScript types and API client
├── backend/
│   ├── app/
│   │   ├── models/       # SQLAlchemy models
│   │   ├── routers/      # FastAPI route handlers
│   │   ├── schemas/      # Pydantic schemas
│   │   └── services/     # Auth and business logic
│   ├── scripts/
│   │   ├── ingest_questions.py      # PDF parser and DB seeder
│   │   └── generate_explanations.py # GPU explanation generator
│   └── alembic/          # Database migrations
├── package.json          # Turborepo monorepo config
└── docker-compose.yml    # PostgreSQL via Docker (alternative)
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Sign in, get JWT |
| GET | `/courses` | List courses |
| GET | `/questions` | List questions (filterable) |
| POST | `/exams/start` | Start an exam session |
| POST | `/exams/{id}/submit` | Submit answers |
| GET | `/exams/history` | Exam history |
| GET | `/results/{id}` | Exam results |
| GET | `/progress/summary` | Overall progress stats |
| POST | `/chat` | AI tutor chat (streaming) |

Full interactive API docs available at [http://localhost:8000/docs](http://localhost:8000/docs)

---

## Environment Variables

Create a `.env` file in `backend/` if you want to override defaults:

```env
DATABASE_URL=postgresql://studypass:studypass@localhost:5432/studypass
JWT_SECRET=change-this-to-a-random-secret
CORS_ORIGINS=http://localhost:3000
```

---

## Troubleshooting

**`password authentication failed for user "studypass"`**
Run: `sudo -u postgres psql -c "ALTER USER studypass WITH PASSWORD 'studypass';"` then restart PostgreSQL.

**`No module named 'fastapi'`**
Make sure your conda env is activated: `conda activate studypass`

**Ollama not responding**
Start it first: `ollama serve &` then check it's running at `http://localhost:11434`

**Docker postgres conflicts**
If another project uses Docker on port 5432, use the native PostgreSQL install instead (Steps 2–4 above).

---

## License

MIT
