# SmartStudy AI

An AI-powered study companion that helps students upload notes/textbooks and receive accurate, level-adjusted explanations, step-by-step solutions, practice questions, and personalized revision plans using Retrieval-Augmented Generation (RAG).


## Features

- **Document Ingestion**: Upload PDFs and TXT files, automatically processed with semantic chunking and zero-cost local embeddings.
- **Grounded Q&A (RAG)**: Ask questions and receive answers based strictly on your uploaded materials.
- **Multi-Provider AI Fallback**: Groq as the fast, primary provider, with Google Gemini as an automatic fallback (bypassing AI SDK for seamless SSE streaming).
- **Comprehension Levels**: Choose from beginner, intermediate, or advanced explanations.
- **Practice Questions**: Generate quizzes with mixed difficulty from your documents.
- **Study Sessions**: Persistent chat sessions with conversation history.
- **Neo-Brutalist Design**: Bold, modern UI with distinctive visual style.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, NextAuth.js v5
- **Database**: SQLite with Prisma ORM
- **AI**: Groq (Llama 3.3 70B), Google Gemini (Custom Streaming)
- **Embeddings**: `@xenova/transformers` (all-MiniLM-L6-v2) running locally on the server
- **Auth**: Credentials-based with bcrypt

## Project Structure

```
SmartStudyAI/
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── api/         # API Routes
│   │   │   ├── auth/    # Authentication endpoints
│   │   │   ├── files/   # Document management
│   │   │   ├── query/   # RAG chat endpoint (Custom SSE)
│   │   │   ├── practice/# Practice question generation
│   │   │   └── sessions/# Study session management
│   │   ├── auth/        # Login/Signup pages
│   │   ├── dashboard/   # Document management UI
│   │   ├── study/       # Chat interface
│   │   └── page.tsx     # Landing page
│   ├── components/      # React components
│   ├── lib/             # Utilities (Prisma client)
│   ├── auth.ts          # NextAuth configuration
│   └── proxy.ts         # Route protection
├── prisma/
│   └── schema.prisma    # Database schema
├── public/              # Static assets
└── SmartStudy AI (PRD).pdf  # Product Requirements Document
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- Groq API key (Primary tier)
- Google Generative AI API key (Fallback tier)

### Installation

1. Clone the repository:
```bash
# If using git
git clone https://github.com/YOUR_USERNAME/SmartStudyAI.git
cd SmartStudyAI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Copy `.env.example` to `.env` in the root directory and add your API keys:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_google_api_key_here
GROQ_API_KEY=your_groq_api_key_here
NEXTAUTH_SECRET=your_random_secret_here
DATABASE_URL=file:./dev.db
NODE_ENV=development
```

4. Initialize the database:
```bash
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signup` | POST | Create new account |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers |
| `/api/files` | GET | List user documents |
| `/api/files/upload` | POST | Upload and process document |
| `/api/files/[id]` | GET/DELETE | Get or delete document |
| `/api/query` | POST | RAG chat streaming (Multi-provider) |
| `/api/practice/generate` | POST | Generate practice questions |
| `/api/sessions` | GET/POST | List/create study sessions |
| `/api/sessions/[id]` | GET/PUT | Get/update session |

## Database Schema

### User
- id, email, passwordHash, name, levelPref, createdAt

### Document
- id, userId, name, status, storagePath, createdAt
- Relations: user, practiceQs, chunks

### Chunk
- id, documentId, userId, page, chunkIndex, content, embedding
- Relations: document, user

### StudySession
- id, userId, title, turns (JSON), createdAt
- Relations: user

### PracticeQuestion
- id, userId, documentId, difficulty, question, answer, solutionSteps
- Relations: user, document

## Security Features

- Route protection via proxy (authenticated users only for dashboard/study)
- Password hashing with bcrypt
- Document ownership verification on all file operations
- Vector scoping by userId

## Design System

Neo-Brutalist design with:
- Bold borders (3px solid #1a1a1a)
- Hard shadows (box-shadow with offset)
- Bright accent colors: yellow (#FFE156), pink (#FF6B9D), blue (#4ECDC4)
- Space Grotesk + JetBrains Mono typography


## Author

Soumyaditya.