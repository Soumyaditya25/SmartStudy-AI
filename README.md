# SmartStudy AI

An AI-powered study companion that helps students upload notes/textbooks and receive accurate, level-adjusted explanations, step-by-step solutions, practice questions, flashcards, and quizzes using Retrieval-Augmented Generation (RAG).

## Features

- **Document Ingestion**: Upload PDFs and TXT files, automatically processed with semantic chunking and zero-cost local embeddings.
- **Grounded Q&A (RAG)**: Ask questions and receive answers grounded strictly in your uploaded materials.
- **Multi-Provider AI Fallback**: Groq as the fast, primary provider, with Google Gemini as an automatic fallback.
- **Comprehension Levels**: Choose from beginner, intermediate, or advanced explanations.
- **Practice Questions**: Generate questions with mixed difficulty from your documents.
- **Flashcards**: AI-generated flashcards with SM-2 spaced repetition scheduling.
- **Quizzes**: Timed multiple-choice quizzes with scoring and explanations.
- **Study Sessions**: Persistent chat sessions with full conversation history.
- **Neo-Brutalist Design**: Bold, modern UI with a distinctive visual style.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL (via [Neon](https://neon.tech)) with Prisma ORM
- **Auth**: NextAuth.js v5 — Credentials-based with bcrypt
- **AI**: Groq (Llama 3.3 70B), Google Gemini (fallback)
- **Embeddings**: `@xenova/transformers` (all-MiniLM-L6-v2) — runs server-side
- **Deployment**: [Vercel](https://vercel.com) (free tier)

## Project Structure

```
SmartStudyAI/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API Routes (backend)
│   │   │   ├── auth/        # Authentication endpoints
│   │   │   ├── files/       # Document upload & management
│   │   │   ├── explain/     # AI explanation endpoint
│   │   │   ├── query/       # RAG chat (streaming)
│   │   │   ├── practice/    # Practice question generation
│   │   │   ├── flashcards/  # Flashcard generation & review
│   │   │   ├── quizzes/     # Quiz generation & attempts
│   │   │   └── sessions/    # Study session management
│   │   ├── auth/            # Login/Signup pages
│   │   ├── dashboard/       # Document management UI
│   │   ├── study/           # Chat & study interface
│   │   └── page.tsx         # Landing page
│   ├── components/          # Shared React components
│   ├── lib/                 # Utilities (Prisma client, helpers)
│   ├── auth.ts              # NextAuth configuration
│   └── proxy.ts             # Middleware route protection
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Demo data seeder
├── public/                  # Static assets
└── vercel.json              # Vercel deployment config
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm
- A PostgreSQL database (free: [Neon](https://neon.tech))
- Groq API key — [console.groq.com](https://console.groq.com/keys) (14,400 req/day free)
- Google Generative AI API key — [aistudio.google.com](https://aistudio.google.com/app/apikey) (free)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Soumyaditya25/SmartStudy-AI.git
cd SmartStudy-AI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables — copy `.env.example` to `.env` and fill in values:
```env
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
AUTH_SECRET=your_random_secret_here   # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
GOOGLE_GENERATIVE_AI_API_KEY=your_key
GROQ_API_KEY=your_key
NODE_ENV=development
```

4. Push the database schema:
```bash
npx prisma db push
```

5. (Optional) Seed demo data:
```bash
npm run seed
```

6. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment (Vercel + Neon)

This project is deployed on [Vercel](https://vercel.com) (free tier) with [Neon](https://neon.tech) as the free PostgreSQL host.

### Steps
1. Create a free PostgreSQL database on [neon.tech](https://neon.tech) and copy the connection string.
2. Import the GitHub repo into [vercel.com](https://vercel.com).
3. Add the following environment variables in Vercel's dashboard:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Your Vercel deployment URL |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Google AI Studio API key |
| `GROQ_API_KEY` | Groq API key |
| `NODE_ENV` | `production` |

4. Deploy — Vercel will automatically run `prisma generate`, `prisma db push`, and `next build`.

## API Routes

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/signup` | POST | Create new account |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers |
| `/api/files` | GET | List user documents |
| `/api/files/upload` | POST | Upload and process document |
| `/api/files/[id]` | GET/DELETE | Get or delete document |
| `/api/explain` | POST | AI concept explanation |
| `/api/query` | POST | RAG chat (streaming) |
| `/api/practice/generate` | POST | Generate practice questions |
| `/api/flashcards` | GET/POST | List or generate flashcards |
| `/api/quizzes` | GET/POST | List or generate quizzes |
| `/api/sessions` | GET/POST | List/create study sessions |
| `/api/sessions/[id]` | GET/PUT | Get/update session |

## Security

- Route protection via Next.js middleware (authenticated users only for dashboard/study)
- Password hashing with bcrypt
- Document ownership verification on all file operations
- Embeddings and RAG results scoped by `userId`

## Design System

Neo-Brutalist design with:
- Bold borders (3px solid #1a1a1a) and hard drop shadows
- Accent palette: yellow `#FFE156`, pink `#FF6B9D`, teal `#4ECDC4`
- Typography: Space Grotesk + JetBrains Mono

## Author

Soumyaditya — [github.com/Soumyaditya25](https://github.com/Soumyaditya25)