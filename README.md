# SmartStudy AI

> An AI-powered study companion that helps students upload notes and textbooks, then receive grounded explanations, step-by-step solutions, practice questions, flashcards, and quizzes — all powered by RAG (Retrieval-Augmented Generation).

🔗 **Live Demo**: [smart-study-ai-blush.vercel.app](https://smart-study-ai-blush.vercel.app)

---

## Features

- **Document Ingestion** — Upload PDFs and TXT files; content is chunked, embedded, and stored in the database instantly
- **Grounded Q&A (RAG)** — Ask questions and get answers grounded strictly in your uploaded materials, with source citations
- **AI Streaming Chat** — Real-time streamed responses via Groq (primary) and Google Gemini (fallback)
- **Comprehension Levels** — Choose beginner, intermediate, or advanced explanations
- **AI Explanations** — Select any text on the page and get an instant contextual explanation
- **Practice Questions** — Auto-generated questions with difficulty levels and step-by-step solutions
- **Flashcards** — AI-generated flashcards with SM-2 spaced repetition scheduling
- **Quizzes** — Timed multiple-choice quizzes with per-question explanations and scoring
- **Study Sessions** — Persistent chat sessions with full conversation history
- **Neo-Brutalist UI** — Bold, modern design with micro-animations

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS 4, Framer Motion |
| **Database** | PostgreSQL via [Neon](https://neon.tech) (free serverless) + Prisma ORM 7 |
| **Auth** | NextAuth.js v5 — JWT sessions, bcrypt password hashing |
| **AI — Chat** | Groq `llama-3.3-70b-versatile` (primary) → Google Gemini (fallback) |
| **AI — Embeddings** | Google `text-embedding-004` API (free, serverless-compatible) |
| **PDF Parsing** | `pdf2json` — in-memory, no disk I/O |
---

## Architecture

```
Upload → Buffer in memory → Extract text → Gemini embeddings → Store chunks in Neon DB
  ↓
Query → Gemini query embedding → Cosine similarity → Top-K chunks → Stream answer via Groq/Gemini
```

---

## Project Structure

```
SmartStudyAI/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth handlers + signup
│   │   │   ├── files/         # Document list, upload, delete
│   │   │   ├── explain/       # Text selection AI explanation
│   │   │   ├── query/         # RAG streaming chat
│   │   │   ├── practice/      # Practice question generation
│   │   │   ├── flashcards/    # Flashcard CRUD + SM-2 review
│   │   │   ├── quizzes/       # Quiz generation + attempts
│   │   │   └── sessions/      # Study session management
│   │   ├── auth/              # Login / Signup pages
│   │   ├── (dashboard)/       # Document management UI
│   │   ├── study/             # Chat interface
│   │   └── page.tsx           # Landing page
│   ├── components/            # Shared React components
│   ├── lib/                   # Prisma client singleton
│   ├── auth.ts                # NextAuth config
│   └── proxy.ts               # Route protection middleware
├── prisma/
│   ├── schema.prisma          # Database schema (9 models)
│   └── seed.ts                # Demo data seeder
├── prisma.config.ts           # Prisma 7 config (url for CLI)
├── vercel.json                # Vercel deployment config
└── next.config.ts             # Next.js config
```

---

## Getting Started (Local Dev)

### Prerequisites

- Node.js 22+
- A free PostgreSQL database from [Neon](https://neon.tech)
- [Groq API key](https://console.groq.com/keys) — 14,400 free req/day
- [Google AI Studio API key](https://aistudio.google.com/app/apikey) — free (used for both chat fallback and embeddings)

### Setup

```bash
# 1. Clone
git clone https://github.com/Soumyaditya25/SmartStudy-AI.git
cd SmartStudy-AI

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env
# Fill in your values (see .env.example)

# 4. Push DB schema
npx prisma db push

# 5. (Optional) Seed demo data
npm run seed

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string (`?sslmode=require`) |
| `AUTH_SECRET` | Random secret — `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` for dev, your Vercel URL for prod |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Used for chat (fallback) + all embeddings |
| `GROQ_API_KEY` | Primary chat provider |
| `NODE_ENV` | `development` or `production` |


## API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/signup` | POST | Create new account |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers |
| `/api/files` | GET | List user documents |
| `/api/files/upload` | POST | Upload & process document (PDF/TXT) |
| `/api/files/[id]` | DELETE | Delete document + chunks |
| `/api/explain` | POST | AI explanation for selected text |
| `/api/query` | POST | RAG chat with streaming response |
| `/api/practice/generate` | POST | Generate practice questions |
| `/api/flashcards` | GET/POST | List or generate flashcards |
| `/api/quizzes` | GET/POST | List or generate quizzes |
| `/api/sessions` | GET/POST | List/create study sessions |
| `/api/sessions/[id]` | GET/PUT | Get/update session |

---

## Database Schema

9 Prisma models: `User`, `Account`, `AuthSession`, `VerificationToken`, `Document`, `Chunk`, `StudySession`, `PracticeQuestion`, `Flashcard`, `Quiz`, `QuizQuestion`, `QuizAttempt`

Key design decisions:
- Embeddings stored as JSON strings in `Chunk.embedding` — no pgvector needed
- Cosine similarity computed in-application for simplicity
- SM-2 spaced repetition fields (`nextReview`, `interval`, `easeFactor`, `repetitions`) on `Flashcard`

---

## Security

- JWT session strategy (no DB session lookups on every request)
- Middleware route protection — unauthenticated users redirected to login
- bcrypt password hashing (cost factor 10)
- All data queries scoped by `userId` — no cross-user data leakage
- Document ownership verified before any file operation

---

## Design System

Neo-Brutalist with:
- **Borders**: 3px solid `#1a1a1a` + hard box-shadows
- **Palette**: Yellow `#FFE156` · Pink `#FF6B9D` · Teal `#4ECDC4` · Coral `#FF6B6B`
- **Typography**: Space Grotesk (headings/body) + JetBrains Mono (code/badges)
- **Animations**: Framer Motion page transitions + CSS micro-animations

---

## Author

**Soumyaditya** — [github.com/Soumyaditya25](https://github.com/Soumyaditya25)